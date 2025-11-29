import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@parallel/ui';
import {
  AlertTriangle,
  Flag,
  Ban,
  CheckCircle,
  Eye,
  MessageSquare,
  User,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const supabase = createAdminClient();
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch moderation stats
  const [
    { count: totalReports },
    { count: pendingReports },
    { count: resolvedReports },
    { count: bannedUsers },
  ] = await Promise.all([
    supabase.from('moderation_reports').select('*', { count: 'exact', head: true }),
    supabase.from('moderation_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('moderation_reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
  ]);

  // Fetch reports
  let query = supabase
    .from('moderation_reports')
    .select(`
      *,
      reporter:reporter_id (
        id,
        display_name,
        username,
        email
      ),
      reported_user:reported_user_id (
        id,
        display_name,
        username,
        email
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  const { data: reports, count } = await query;
  const totalPages = Math.ceil((count || 0) / limit);

  const stats = [
    { title: 'Total Reports', value: totalReports || 0, icon: Flag, color: 'text-blue-400' },
    { title: 'Pending Review', value: pendingReports || 0, icon: Clock, color: 'text-amber-400' },
    { title: 'Resolved', value: resolvedReports || 0, icon: CheckCircle, color: 'text-green-400' },
    { title: 'Banned Users', value: bannedUsers || 0, icon: Ban, color: 'text-red-400' },
  ];

  const getReportTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      harassment: 'bg-red-500/20 text-red-400',
      spam: 'bg-yellow-500/20 text-yellow-400',
      inappropriate_content: 'bg-orange-500/20 text-orange-400',
      hate_speech: 'bg-red-500/20 text-red-400',
      other: 'bg-gray-500/20 text-gray-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${typeColors[type] || typeColors.other}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'reviewing':
        return <Badge className="bg-amber-500/20 text-amber-400">Reviewing</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Moderation</h1>
        {pendingReports && pendingReports > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {pendingReports} pending reviews
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <h3 className="text-3xl font-bold">{stat.value.toLocaleString()}</h3>
              <p className="text-white/60">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map((status) => (
          <a
            key={status}
            href={status === 'all' ? '/admin/moderation' : `/admin/moderation?status=${status}`}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              (status === 'all' && !searchParams.status) || searchParams.status === status
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </a>
        ))}
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Reports Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/10">
            {reports?.map((report: any) => (
              <div key={report.id} className="p-4 hover:bg-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getReportTypeBadge(report.report_type)}
                    {getStatusBadge(report.status)}
                  </div>
                  <span className="text-sm text-white/40">
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-white/40" />
                      <span className="text-sm text-white/60">Reported User</span>
                    </div>
                    <p className="font-medium">
                      {report.reported_user?.display_name || report.reported_user?.username || 'Unknown'}
                    </p>
                    <p className="text-sm text-white/40">{report.reported_user?.email}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="w-4 h-4 text-white/40" />
                      <span className="text-sm text-white/60">Reported By</span>
                    </div>
                    <p className="font-medium">
                      {report.reporter?.display_name || report.reporter?.username || 'Anonymous'}
                    </p>
                    <p className="text-sm text-white/40">{report.reporter?.email}</p>
                  </div>
                </div>

                {report.reason && (
                  <div className="p-3 rounded-lg bg-white/5 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-white/40" />
                      <span className="text-sm text-white/60">Reason</span>
                    </div>
                    <p className="text-sm">{report.reason}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  {report.status === 'pending' && (
                    <>
                      <Button variant="ghost" size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Dismiss
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Ban className="w-4 h-4 mr-2" />
                        Ban User
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {(!reports || reports.length === 0) && (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-bold mb-2">All Clear!</h3>
                <p className="text-white/60">No reports to review at the moment</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {reports && reports.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-white/10">
              <p className="text-white/60">
                Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count || 0}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-4">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
