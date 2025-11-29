import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Lazy initialization of Stripe to avoid build-time errors
let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripeClient;
}

// Map Stripe price IDs to subscription tiers
const TIER_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_BASIC || 'price_basic']: 'basic',
  [process.env.STRIPE_PRICE_PRO || 'price_pro']: 'pro',
  [process.env.STRIPE_PRICE_UNLIMITED || 'price_unlimited']: 'unlimited',
  [process.env.STRIPE_PRICE_STUDIO || 'price_studio']: 'studio',
};

// Monthly credits per tier (matches subscription pricing)
const TIER_CREDITS: Record<string, number> = {
  free: 50,
  basic: 500,      // $19.99/mo
  pro: 2000,       // $29.99/mo
  unlimited: 5000, // $49.99/mo
  studio: 10000,   // $99.99/mo
};

// Check if event has already been processed (idempotency)
async function isEventProcessed(supabase: ReturnType<typeof createAdminClient>, eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .single();

  // PGRST116 = "No rows found" which means not processed
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking webhook event:', error);
  }
  return !!data;
}

// Mark event as processed
async function markEventProcessed(supabase: ReturnType<typeof createAdminClient>, eventId: string, eventType: string): Promise<void> {
  const { error } = await supabase.from('webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    processed_at: new Date().toISOString(),
  });

  // 23505 = unique constraint violation (duplicate) - already marked by concurrent process
  if (error && error.code !== '23505') {
    console.error('Error marking webhook event processed:', error);
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency check - skip if already processed
  if (await isEventProcessed(supabase, event.id)) {
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) break;

        if (session.metadata?.type === 'credits') {
          // Handle credit purchase using atomic increment
          const credits = parseInt(session.metadata.credits || '0');
          let finalBalance: number;

          // Use atomic RPC to prevent race conditions
          const { data: newBalance, error: rpcError } = await supabase.rpc('increment_credits', {
            p_user_id: userId,
            p_amount: credits,
          });

          if (rpcError) {
            // Fallback to non-atomic if RPC doesn't exist (race condition possible)
            console.warn('increment_credits RPC unavailable, using fallback:', rpcError.message);
            const { data: profile } = await supabase
              .from('profiles')
              .select('credits_balance')
              .eq('id', userId)
              .single();

            const calculatedBalance = (profile?.credits_balance || 0) + credits;
            finalBalance = calculatedBalance;

            await supabase
              .from('profiles')
              .update({ credits_balance: calculatedBalance })
              .eq('id', userId);
          } else {
            finalBalance = typeof newBalance === 'number' ? newBalance : credits;
          }

          // Record purchase
          await supabase.from('purchases').insert({
            user_id: userId,
            purchase_type: 'credits',
            amount: session.amount_total! / 100,
            credits_amount: credits,
            provider: 'stripe',
            provider_transaction_id: session.payment_intent as string,
          });

          // Record transaction with correct balance
          await supabase.from('credit_transactions').insert({
            user_id: userId,
            amount: credits,
            balance_after: finalBalance,
            source: 'purchase',
            description: `Purchased ${credits} credits`,
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) break;

        const priceId = subscription.items.data[0]?.price.id;
        const tier = TIER_MAP[priceId] || 'basic';
        const monthlyCredits = TIER_CREDITS[tier] || 500;

        // Update profile - only reset credits on create, not update
        const updateData: Record<string, unknown> = {
          subscription_tier: tier,
          subscription_status: subscription.status,
          subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        };

        // Only reset credits on new subscription
        if (event.type === 'customer.subscription.created') {
          updateData.credits_balance = monthlyCredits;
          updateData.monthly_credits_used = 0;
        }

        await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        // Get price amount with proper null handling
        const priceAmount = subscription.items.data[0]?.price.unit_amount;
        if (priceAmount == null) {
          console.warn('Missing unit_amount for subscription:', subscription.id);
        }

        // Upsert subscription record - uses provider_subscription_id for conflict resolution
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            tier,
            status: subscription.status,
            provider: 'stripe',
            provider_subscription_id: subscription.id,
            provider_customer_id: subscription.customer as string,
            price_amount: (priceAmount ?? 0) / 100,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, {
            onConflict: 'provider_subscription_id',
          });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) break;

        // Downgrade to free
        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            credits_balance: TIER_CREDITS.free,
          })
          .eq('id', userId);

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('provider_subscription_id', subscription.id);

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        // Reset monthly credits on renewal
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.user_id;

          if (userId) {
            const priceId = subscription.items.data[0]?.price.id;
            const tier = TIER_MAP[priceId] || 'basic';
            const monthlyCredits = TIER_CREDITS[tier] || 500;

            await supabase
              .from('profiles')
              .update({
                credits_balance: monthlyCredits,
                monthly_credits_used: 0,
              })
              .eq('id', userId);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.user_id;

          if (userId) {
            await supabase
              .from('profiles')
              .update({ subscription_status: 'past_due' })
              .eq('id', userId);
          }
        }
        break;
      }
    }

    // Mark event as processed for idempotency
    await markEventProcessed(supabase, event.id, event.type);

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
