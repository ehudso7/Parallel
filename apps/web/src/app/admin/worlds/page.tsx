import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, Badge, Button } from '@parallel/ui';
import {
  Globe,
  Users,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';

export default async function AdminWorldsPage() {
  const supabase = createAdminClient();

  // Fetch worlds with stats
  const { data: worlds } = await supabase
    .from('worlds')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch usage stats for each world
  const worldsWithStats = await Promise.all(
    (worlds || []).map(async (world) => {
      const [
        { count: userCount },
        { count: messageCount },
        { count: conversationCount },
      ] = await Promise.all([
        supabase.from('personas').select('*', { count: 'exact', head: true }).eq('world_id', world.id),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('world_id', world.id),
        supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('world_id', world.id),
      ]);

      return {
        ...world,
        userCount: userCount || 0,
        messageCount: messageCount || 0,
        conversationCount: conversationCount || 0,
      };
    })
  );

  // Summary stats
  const totalWorlds = worlds?.length || 0;
  const activeWorlds = worlds?.filter((w) => w.is_active)?.length || 0;
  const featuredWorlds = worlds?.filter((w) => w.is_featured)?.length || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Parallel Worlds</h1>
        <Button variant="glow">
          <Plus className="w-4 h-4 mr-2" />
          Create World
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <Globe className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-3xl font-bold">{totalWorlds}</h3>
            <p className="text-white/60">Total Worlds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Eye className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-3xl font-bold">{activeWorlds}</h3>
            <p className="text-white/60">Active Worlds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Star className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="text-3xl font-bold">{featuredWorlds}</h3>
            <p className="text-white/60">Featured Worlds</p>
          </CardContent>
        </Card>
      </div>

      {/* Worlds Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {worldsWithStats.map((world: any) => (
          <Card key={world.id} className="overflow-hidden">
            <div
              className="h-32 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30"
              style={{
                backgroundImage: world.cover_image ? `url(${world.cover_image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">{world.name}</h3>
                  <p className="text-sm text-white/60">{world.theme}</p>
                </div>
                <div className="flex gap-1">
                  {world.is_featured && (
                    <Badge variant="premium">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  <Badge variant={world.is_active ? 'success' : 'secondary'}>
                    {world.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-white/60 line-clamp-2 mb-4">{world.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <Users className="w-4 h-4 mx-auto mb-1 text-white/40" />
                  <p className="text-sm font-medium">{world.userCount}</p>
                  <p className="text-xs text-white/40">Users</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <MessageSquare className="w-4 h-4 mx-auto mb-1 text-white/40" />
                  <p className="text-sm font-medium">{world.messageCount}</p>
                  <p className="text-xs text-white/40">Messages</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <Globe className="w-4 h-4 mx-auto mb-1 text-white/40" />
                  <p className="text-sm font-medium">{world.conversationCount}</p>
                  <p className="text-xs text-white/40">Convos</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-white/40">
                  Created {new Date(world.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {world.is_active ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {worldsWithStats.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-bold mb-2">No worlds yet</h3>
            <p className="text-white/60 mb-4">Create your first parallel world to get started</p>
            <Button variant="glow">
              <Plus className="w-4 h-4 mr-2" />
              Create World
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
