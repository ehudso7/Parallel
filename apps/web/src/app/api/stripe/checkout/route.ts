import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

// Validate Stripe Price IDs are configured
function validatePriceIds(): Record<string, string> {
  const priceIds: Record<string, string> = {
    price_basic_monthly: process.env.STRIPE_PRICE_BASIC || '',
    price_pro_monthly: process.env.STRIPE_PRICE_PRO || '',
    price_unlimited_monthly: process.env.STRIPE_PRICE_UNLIMITED || '',
    price_studio_monthly: process.env.STRIPE_PRICE_STUDIO || '',
  };

  // Warn in development if price IDs are not configured
  const missing = Object.entries(priceIds)
    .filter(([_, value]) => !value || value.startsWith('price_xxx'))
    .map(([key]) => key);

  if (missing.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `[Stripe] Missing price IDs: ${missing.join(', ')}. ` +
      'Subscription checkout will fail until these are configured in environment variables.'
    );
  }

  return priceIds;
}

// Price IDs (these must be created in Stripe dashboard and set in env vars)
const PRICE_IDS = validatePriceIds();

const CREDIT_PRICES: Record<string, { price: number; credits: number }> = {
  credits_100: { price: 499, credits: 100 },
  credits_500: { price: 1999, credits: 550 },
  credits_1000: { price: 3499, credits: 1150 },
  credits_5000: { price: 14999, credits: 6000 },
};

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, packId, mode } = await request.json();

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (mode === 'subscription' && priceId) {
      // Validate and resolve price ID
      const resolvedPriceId = PRICE_IDS[priceId] || priceId;

      // Ensure price ID is valid (not empty or placeholder)
      if (!resolvedPriceId || resolvedPriceId.startsWith('price_xxx')) {
        console.error(`Invalid or unconfigured price ID: ${priceId}`);
        return NextResponse.json({
          error: 'Subscription pricing not configured. Please contact support.'
        }, { status: 500 });
      }

      // Create subscription checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: resolvedPriceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/settings/billing?canceled=true`,
        metadata: {
          user_id: user.id,
          type: 'subscription',
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
          },
        },
      });

      return NextResponse.json({ url: session.url });
    } else if (mode === 'payment' && packId) {
      // Create one-time payment for credits
      const pack = CREDIT_PRICES[packId];
      if (!pack) {
        return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${pack.credits} Credits`,
                description: `Parallel Credits Pack`,
              },
              unit_amount: pack.price,
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/settings/billing?canceled=true`,
        metadata: {
          user_id: user.id,
          type: 'credits',
          pack_id: packId,
          credits: pack.credits.toString(),
        },
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
