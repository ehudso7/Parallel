'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@parallel/ui';
import { toast } from '@parallel/ui';
import {
  Crown,
  Check,
  CreditCard,
  Coins,
  Zap,
  ArrowRight,
  Calendar,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import { cn } from '@parallel/ui';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '1 AI Companion',
      '3 Worlds',
      '50 Credits/month',
      'Basic Chat',
      'Limited Generations',
    ],
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    stripePriceId: 'price_basic_monthly',
    features: [
      '5 AI Companions',
      '10 Worlds',
      '500 Credits/month',
      'Voice Messages',
      'HD Generations',
      'Priority Queue',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    interval: 'month',
    stripePriceId: 'price_pro_monthly',
    features: [
      'Unlimited Companions',
      'All Worlds',
      '2000 Credits/month',
      'Voice Messages',
      'HD Generations',
      'Priority Support',
      'Early Access Features',
    ],
    popular: true,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: 39.99,
    interval: 'month',
    stripePriceId: 'price_unlimited_monthly',
    features: [
      'Everything in Pro',
      '5000 Credits/month',
      '4K Generations',
      'Custom Personas',
      'API Access (Limited)',
    ],
    popular: false,
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 99.99,
    interval: 'month',
    stripePriceId: 'price_studio_monthly',
    features: [
      'Everything in Unlimited',
      'Unlimited Credits',
      'Full API Access',
      'White-label Options',
      'Dedicated Support',
      'Custom Integrations',
    ],
    popular: false,
  },
];

const CREDIT_PACKS = [
  { id: 'credits_100', name: '100 Credits', credits: 100, price: 4.99 },
  { id: 'credits_500', name: '500 Credits', credits: 500, price: 19.99, bonus: 50 },
  { id: 'credits_1000', name: '1000 Credits', credits: 1000, price: 34.99, bonus: 150 },
  { id: 'credits_5000', name: '5000 Credits', credits: 5000, price: 149.99, bonus: 1000 },
];

export default function BillingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const [profileResult, subscriptionResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').single(),
    ]);

    setProfile(profileResult.data);
    setSubscription(subscriptionResult.data);
    setIsLoading(false);
  };

  const handleSubscribe = async (planId: string, priceId: string) => {
    setProcessingPlan(planId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          mode: 'subscription',
        }),
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      toast({ title: 'Failed to start checkout', variant: 'error' });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleBuyCredits = async (packId: string) => {
    setProcessingPlan(packId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId,
          mode: 'payment',
        }),
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      toast({ title: 'Failed to start checkout', variant: 'error' });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      toast({ title: 'Failed to open portal', variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const currentPlan = PLANS.find((p) => p.id === profile?.subscription_tier) || PLANS[0];
  const creditsUsedPercent = profile?.monthly_credits_used
    ? Math.min(100, (profile.monthly_credits_used / (currentPlan.features.find((f) => f.includes('Credits'))?.match(/\d+/)?.[0] || 50)) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{currentPlan.name}</h2>
                <Badge variant={currentPlan.id === 'free' ? 'secondary' : 'premium'}>
                  {currentPlan.id === 'free' ? 'Free' : 'Active'}
                </Badge>
              </div>
              {subscription && (
                <p className="text-white/60 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              {subscription && (
                <Button variant="outline" onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>

          {/* Credits Usage */}
          <div className="mt-6 p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                Credits Used This Month
              </span>
              <span className="font-semibold">
                {profile?.monthly_credits_used || 0} / {currentPlan.features.find((f) => f.includes('Credits'))?.match(/\d+/)?.[0] || 50}
              </span>
            </div>
            <Progress value={creditsUsedPercent} variant="gradient" />
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'relative overflow-hidden transition-all',
                plan.popular && 'border-violet-500',
                profile?.subscription_tier === plan.id && 'ring-2 ring-violet-500'
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-violet-500 text-center py-1 text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <CardContent className={cn('p-5', plan.popular && 'pt-8')}>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-white/60">/{plan.interval}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {profile?.subscription_tier === plan.id ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.id === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Default
                  </Button>
                ) : (
                  <Button
                    variant={plan.popular ? 'glow' : 'default'}
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id, plan.stripePriceId!)}
                    loading={processingPlan === plan.id}
                  >
                    {profile?.subscription_tier !== 'free' ? 'Switch' : 'Subscribe'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit Packs */}
      <div>
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Buy Credits
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKS.map((pack) => (
            <Card key={pack.id} className="hover:border-violet-500/50 transition cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{pack.name}</h3>
                  {pack.bonus && (
                    <Badge variant="success">+{pack.bonus} bonus</Badge>
                  )}
                </div>
                <p className="text-3xl font-bold mb-4">
                  ${pack.price}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleBuyCredits(pack.id)}
                  loading={processingPlan === pack.id}
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-6">Payment History</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-white/40">
              <CreditCard className="w-12 h-12 mx-auto mb-3" />
              <p>No payment history yet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
