import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@parallel/ui';
import {
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  Crown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tier?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const page = parseInt(params.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch subscription stats
  const [
    { count: totalSubscriptions },
    { count: activeSubscriptions },
    { count: basicCount },
    { count: proCount },
    { count: unlimitedCount },
    { count: studioCount },
  ] = await Promise.all([
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'basic').eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'pro').eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'unlimited').eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'studio').eq('status', 'active'),
  ]);

  // Fetch subscriptions with user data
  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        display_name,
        username
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.tier) {
    query = query.eq('tier', params.tier);
  }

  const { data: subscriptions, count } = await query;
  const totalPages = Math.ceil((count || 0) / limit);

  // Calculate MRR (Monthly Recurring Revenue)
  const tierPrices: Record<string, number> = {
    basic: 9.99,
    pro: 24.99,
    unlimited: 49.99,
    studio: 99.99,
  };

  const mrr =
    (basicCount || 0) * tierPrices.basic +
    (proCount || 0) * tierPrices.pro +
    (unlimitedCount || 0) * tierPrices.unlimited +
    (studioCount || 0) * tierPrices.studio;

  const stats = [
    {
      title: 'Total Subscriptions',
      value: totalSubscriptions?.toLocaleString() || '0',
      icon: CreditCard,
      color: 'text-blue-400',
    },
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions?.toLocaleString() || '0',
      icon: Users,
      color: 'text-green-400',
    },
    {
      title: 'Monthly Revenue',
      value: `$${mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-violet-400',
    },
    {
      title: 'Conversion Rate',
      value: '12.4%',
      icon: TrendingUp,
      color: 'text-amber-400',
    },
  ];

  const tierBreakdown = [
    { tier: 'Basic', count: basicCount || 0, price: '$9.99', color: 'bg-blue-500' },
    { tier: 'Pro', count: proCount || 0, price: '$24.99', color: 'bg-violet-500' },
    { tier: 'Unlimited', count: unlimitedCount || 0, price: '$49.99', color: 'bg-fuchsia-500' },
    { tier: 'Studio', count: studioCount || 0, price: '$99.99', color: 'bg-amber-500' },
  ];

  const buildPaginationUrl = (newPage: number) => {
    const searchParamsStr = params.tier ? `&tier=${params.tier}` : '';
    return `/admin/subscriptions?page=${newPage}${searchParamsStr}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <Button variant="glow">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Stripe
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              <p className="text-white/60">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tier Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {tierBreakdown.map((tier) => (
              <div key={tier.tier} className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{tier.tier}</span>
                  <span className="text-white/60">{tier.price}/mo</span>
                </div>
                <p className="text-2xl font-bold">{tier.count}</p>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full ${tier.color}`}
                    style={{ width: `${(tier.count / (activeSubscriptions || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Subscriptions</CardTitle>
            <div className="flex gap-2">
              {['all', 'basic', 'pro', 'unlimited', 'studio'].map((tier) => (
                <Link
                  key={tier}
                  href={tier === 'all' ? '/admin/subscriptions' : `/admin/subscriptions?tier=${tier}`}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    (tier === 'all' && !params.tier) || params.tier === tier
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-white/60 font-medium">User</th>
                  <th className="text-left p-4 text-white/60 font-medium">Tier</th>
                  <th className="text-left p-4 text-white/60 font-medium">Status</th>
                  <th className="text-left p-4 text-white/60 font-medium">Price</th>
                  <th className="text-left p-4 text-white/60 font-medium">Period End</th>
                  <th className="text-left p-4 text-white/60 font-medium">Provider</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions?.map((sub: any) => (
                  <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">
                          {sub.profiles?.display_name || sub.profiles?.username || 'Anonymous'}
                        </p>
                        <p className="text-sm text-white/60">{sub.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="premium">
                        <Crown className="w-3 h-3 mr-1" />
                        {sub.tier}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          sub.status === 'active'
                            ? 'success'
                            : sub.status === 'past_due'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">${sub.price_amount?.toFixed(2)}</span>
                    </td>
                    <td className="p-4 text-white/60">
                      {sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{sub.provider}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-white/60">
              Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count || 0}
            </p>
            <div className="flex items-center gap-2">
              <Link href={buildPaginationUrl(page - 1)}>
                <Button variant="outline" size="sm" disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
              <span className="px-4">
                Page {page} of {totalPages || 1}
              </span>
              <Link href={buildPaginationUrl(page + 1)}>
                <Button variant="outline" size="sm" disabled={page >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
