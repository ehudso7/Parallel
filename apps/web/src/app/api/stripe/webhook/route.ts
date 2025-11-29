import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Map Stripe price IDs to subscription tiers
const TIER_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_BASIC || 'price_basic']: 'basic',
  [process.env.STRIPE_PRICE_PRO || 'price_pro']: 'pro',
  [process.env.STRIPE_PRICE_UNLIMITED || 'price_unlimited']: 'unlimited',
  [process.env.STRIPE_PRICE_STUDIO || 'price_studio']: 'studio',
};

// Monthly credits per tier
const TIER_CREDITS: Record<string, number> = {
  free: 50,
  basic: 500,
  pro: 2000,
  unlimited: 5000,
  studio: 999999, // Unlimited
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) break;

        if (session.metadata?.type === 'credits') {
          // Handle credit purchase
          const credits = parseInt(session.metadata.credits || '0');

          const { data: profile } = await supabase
            .from('profiles')
            .select('credits_balance')
            .eq('id', userId)
            .single();

          const newBalance = (profile?.credits_balance || 0) + credits;

          await supabase
            .from('profiles')
            .update({ credits_balance: newBalance })
            .eq('id', userId);

          // Record purchase
          await supabase.from('purchases').insert({
            user_id: userId,
            purchase_type: 'credits',
            amount: session.amount_total! / 100,
            credits_amount: credits,
            provider: 'stripe',
            provider_transaction_id: session.payment_intent as string,
          });

          // Record transaction
          await supabase.from('credit_transactions').insert({
            user_id: userId,
            amount: credits,
            balance_after: newBalance,
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

        // Update profile
        await supabase
          .from('profiles')
          .update({
            subscription_tier: tier,
            subscription_status: subscription.status,
            subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            credits_balance: monthlyCredits,
            monthly_credits_used: 0,
          })
          .eq('id', userId);

        // Upsert subscription record
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            tier,
            status: subscription.status,
            provider: 'stripe',
            provider_subscription_id: subscription.id,
            provider_customer_id: subscription.customer as string,
            price_amount: subscription.items.data[0]?.price.unit_amount! / 100,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, {
            onConflict: 'user_id',
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
        if (invoice.billing_reason === 'subscription_cycle') {
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
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = subscription.metadata?.user_id;

        if (userId) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', userId);
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
