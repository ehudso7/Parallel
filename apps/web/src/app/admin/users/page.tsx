import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from '@parallel/ui';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Crown,
  Ban,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const supabase = createAdminClient();
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch users with pagination
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (searchParams.search) {
    query = query.or(`email.ilike.%${searchParams.search}%,username.ilike.%${searchParams.search}%`);
  }

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count || 0) / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="glow">Export</Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            name="search"
            placeholder="Search users by email or username..."
            defaultValue={searchParams.search}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </form>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-white/60 font-medium">User</th>
                  <th className="text-left p-4 text-white/60 font-medium">Subscription</th>
                  <th className="text-left p-4 text-white/60 font-medium">Credits</th>
                  <th className="text-left p-4 text-white/60 font-medium">Streak</th>
                  <th className="text-left p-4 text-white/60 font-medium">Joined</th>
                  <th className="text-left p-4 text-white/60 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user: any) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                          {user.display_name?.[0] || user.email?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{user.display_name || user.username || 'Anonymous'}</p>
                          <p className="text-sm text-white/60">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.subscription_tier === 'free' ? 'secondary' : 'premium'}>
                        {user.subscription_tier === 'free' ? (
                          user.subscription_tier
                        ) : (
                          <>
                            <Crown className="w-3 h-3 mr-1" />
                            {user.subscription_tier}
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{user.credits_balance || 0}</span>
                    </td>
                    <td className="p-4">
                      <span>{user.current_streak || 0} days</span>
                    </td>
                    <td className="p-4 text-white/60">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Ban className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-white/60">
              Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count || 0} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4">Page {page} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
