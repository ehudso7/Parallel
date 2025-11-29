import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@parallel/ui';
import {
  Users,
  CreditCard,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  // Fetch stats
  const [
    { count: totalUsers },
    { count: activeSubscriptions },
    { count: totalMessages },
    { count: totalContent },
    { data: recentUsers },
    { data: recentTransactions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('generated_content').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('credit_transactions').select('*').order('created_at', { ascending: false }).limit(10),
  ]);

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers?.toLocaleString() || '0',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-400',
    },
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions?.toLocaleString() || '0',
      change: '+8%',
      trend: 'up',
      icon: CreditCard,
      color: 'text-green-400',
    },
    {
      title: 'Total Messages',
      value: totalMessages?.toLocaleString() || '0',
      change: '+23%',
      trend: 'up',
      icon: MessageSquare,
      color: 'text-violet-400',
    },
    {
      title: 'Content Generated',
      value: totalContent?.toLocaleString() || '0',
      change: '+15%',
      trend: 'up',
      icon: Activity,
      color: 'text-amber-400',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <Badge variant={stat.trend === 'up' ? 'success' : 'destructive'}>
                  {stat.trend === 'up' ? (
                    <ArrowUp className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
              </div>
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              <p className="text-white/60">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="font-medium">{user.display_name || user.username || 'Anonymous'}</p>
                    <p className="text-sm text-white/60">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={user.subscription_tier === 'free' ? 'secondary' : 'premium'}>
                      {user.subscription_tier}
                    </Badge>
                    <p className="text-xs text-white/40 mt-1">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions?.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="font-medium">{tx.description || tx.source}</p>
                    <p className="text-sm text-white/60">{tx.source}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                    </p>
                    <p className="text-xs text-white/40">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-white/40">
            <p>Revenue chart would be displayed here with real data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
