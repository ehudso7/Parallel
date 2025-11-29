import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@parallel/ui';
import {
  BarChart,
  TrendingUp,
  Users,
  MessageSquare,
  CreditCard,
  Activity,
  Clock,
  Zap,
} from 'lucide-react';

export default async function AdminAnalyticsPage() {
  const supabase = createAdminClient();

  // Fetch analytics data
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    { count: totalUsers },
    { count: newUsers30d },
    { count: _newUsers7d },
    { count: totalMessages },
    { count: messages30d },
    { count: messages7d },
    { count: totalContent },
    { count: content30d },
    { count: activeSubscriptions },
    { data: topPersonaTypes },
    { data: _topWorlds },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('generated_content').select('*', { count: 'exact', head: true }),
    supabase.from('generated_content').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('personas').select('persona_type').limit(1000),
    supabase.from('worlds').select('id, name').limit(10),
    supabase.from('messages').select('created_at').order('created_at', { ascending: false }).limit(100),
  ]);

  // Calculate persona type distribution
  const personaTypeCounts = (topPersonaTypes || []).reduce((acc: Record<string, number>, p: any) => {
    acc[p.persona_type] = (acc[p.persona_type] || 0) + 1;
    return acc;
  }, {});

  const personaTypeData = Object.entries(personaTypeCounts)
    .map(([type, count]) => ({ type, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate daily active users approximation (based on message activity)
  const dau = messages7d ? Math.round((messages7d / 7) * 0.3) : 0;
  const mau = messages30d ? Math.round((messages30d / 30) * 0.15) : 0;

  const metrics = [
    {
      title: 'Total Users',
      value: totalUsers?.toLocaleString() || '0',
      change: `+${newUsers30d || 0} this month`,
      icon: Users,
      color: 'text-blue-400',
    },
    {
      title: 'Messages Sent',
      value: totalMessages?.toLocaleString() || '0',
      change: `+${messages30d || 0} this month`,
      icon: MessageSquare,
      color: 'text-green-400',
    },
    {
      title: 'Content Generated',
      value: totalContent?.toLocaleString() || '0',
      change: `+${content30d || 0} this month`,
      icon: Zap,
      color: 'text-violet-400',
    },
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions?.toLocaleString() || '0',
      change: 'Paying users',
      icon: CreditCard,
      color: 'text-amber-400',
    },
  ];

  const engagementMetrics = [
    {
      title: 'Estimated DAU',
      value: dau.toLocaleString(),
      description: 'Daily Active Users',
    },
    {
      title: 'Estimated MAU',
      value: mau.toLocaleString(),
      description: 'Monthly Active Users',
    },
    {
      title: 'DAU/MAU Ratio',
      value: mau > 0 ? `${((dau / mau) * 100).toFixed(1)}%` : '0%',
      description: 'Stickiness metric',
    },
    {
      title: 'Avg Messages/Day',
      value: (messages30d ? messages30d / 30 : 0).toFixed(0),
      description: 'Message velocity',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <Badge variant="outline">Last 30 days</Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <metric.icon className={`w-8 h-8 ${metric.color}`} />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-3xl font-bold">{metric.value}</h3>
              <p className="text-white/60">{metric.title}</p>
              <p className="text-sm text-green-400 mt-1">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {engagementMetrics.map((metric) => (
                <div key={metric.title} className="p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-white/60">{metric.title}</p>
                  <p className="text-xs text-white/40">{metric.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Persona Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Popular Persona Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {personaTypeData.map((item) => {
                const maxCount = personaTypeData[0]?.count || 1;
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="capitalize">{item.type.replace('_', ' ')}</span>
                      <span className="text-white/60">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {personaTypeData.length === 0 && (
                <p className="text-white/40 text-center py-4">No persona data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* User Growth Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-white/40 border border-dashed border-white/10 rounded-xl">
              <div className="text-center">
                <BarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>User growth chart</p>
                <p className="text-sm">(Integrate with analytics provider)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Activity Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-white/40 border border-dashed border-white/10 rounded-xl">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Activity heatmap by hour</p>
                <p className="text-sm">(Integrate with analytics provider)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(recentActivity || []).slice(0, 10).map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/60">Message sent</span>
                <span className="text-white/40 text-sm ml-auto">
                  {new Date(activity.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-white/40 text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
