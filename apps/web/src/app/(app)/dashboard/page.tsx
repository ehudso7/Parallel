import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button, Badge, Card, CardContent } from '@parallel/ui';
import {
  MessageCircle,
  Users,
  Globe,
  Wand2,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  Play,
  Zap,
  Heart,
  Music,
  Video,
  Image,
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  // Fetch user's data
  const [
    { data: profile },
    { data: recentConversations },
    { data: userPersonas },
    { data: userWorlds },
    { data: recentContent },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('conversations')
      .select('*, persona:personas(*)')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })
      .limit(5),
    supabase
      .from('user_personas')
      .select('*, persona:personas(*)')
      .eq('user_id', user.id)
      .order('last_interaction_at', { ascending: false })
      .limit(4),
    supabase
      .from('user_worlds')
      .select('*, world:worlds(*)')
      .eq('user_id', user.id)
      .order('last_visit_at', { ascending: false })
      .limit(4),
    supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const greeting = getGreeting();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, {profile?.display_name || profile?.username || 'there'}!
          </h1>
          <p className="text-white/60">
            Welcome back to your Parallel universe. What would you like to do today?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="glow" className="px-4 py-2">
            <Zap className="w-4 h-4 mr-1" />
            {profile?.current_streak || 0} day streak
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/chat', icon: MessageCircle, label: 'New Chat', color: 'from-violet-500 to-purple-600' },
          { href: '/personas/new', icon: Users, label: 'Create Persona', color: 'from-pink-500 to-rose-600' },
          { href: '/worlds/explore', icon: Globe, label: 'Explore Worlds', color: 'from-cyan-500 to-blue-600' },
          { href: '/create', icon: Wand2, label: 'Create Content', color: 'from-amber-500 to-orange-600' },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${action.color} p-6`}>
                  <action.icon className="w-8 h-8 text-white mb-3" />
                  <p className="text-white font-semibold">{action.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Conversations */}
      {recentConversations && recentConversations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-400" />
              Recent Chats
            </h2>
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-3">
            {recentConversations.map((conv: any) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <Card className="hover:bg-white/10 transition cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{conv.persona?.name || 'Unknown'}</p>
                      <p className="text-sm text-white/60 truncate">
                        {conv.title || 'Conversation'}
                      </p>
                    </div>
                    <div className="text-xs text-white/40">
                      {formatTimeAgo(conv.last_message_at)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Your Personas & Worlds */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Personas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              Your Personas
            </h2>
            <Link href="/personas">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {userPersonas && userPersonas.length > 0 ? (
              userPersonas.map((up: any) => (
                <Link key={up.id} href={`/personas/${up.persona?.id}`}>
                  <Card className="hover:scale-[1.02] transition cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-3">
                        <span className="text-2xl">
                          {up.persona?.name?.[0] || '?'}
                        </span>
                      </div>
                      <p className="font-semibold truncate">{up.nickname || up.persona?.name}</p>
                      <p className="text-xs text-white/60 capitalize">{up.persona?.persona_type}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Link href="/personas/new" className="col-span-2">
                <Card className="border-dashed hover:border-violet-500/50 transition cursor-pointer">
                  <CardContent className="p-8 text-center">
                    <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-3" />
                    <p className="font-semibold">Create Your First Persona</p>
                    <p className="text-sm text-white/60">Start your AI companion journey</p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </section>

        {/* Worlds */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Your Worlds
            </h2>
            <Link href="/worlds">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {userWorlds && userWorlds.length > 0 ? (
              userWorlds.map((uw: any) => (
                <Link key={uw.id} href={`/worlds/${uw.world?.id}`}>
                  <Card className="hover:scale-[1.02] transition cursor-pointer overflow-hidden">
                    <div className="h-24 bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <CardContent className="p-3">
                      <p className="font-semibold truncate">{uw.world?.name}</p>
                      <p className="text-xs text-white/60 capitalize">{uw.world?.theme}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Link href="/worlds/explore" className="col-span-2">
                <Card className="border-dashed hover:border-cyan-500/50 transition cursor-pointer">
                  <CardContent className="p-8 text-center">
                    <Globe className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                    <p className="font-semibold">Explore Worlds</p>
                    <p className="text-sm text-white/60">Discover new universes</p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </section>
      </div>

      {/* Recent Creations */}
      {recentContent && recentContent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-amber-400" />
              Your Creations
            </h2>
            <Link href="/create/history">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentContent.map((content: any) => (
              <Card key={content.id} className="overflow-hidden group cursor-pointer">
                <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                  {content.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={content.thumbnail_url}
                      alt={content.title || 'Creation'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {content.content_type === 'music' && <Music className="w-8 h-8 text-white/40" />}
                      {content.content_type === 'video' && <Video className="w-8 h-8 text-white/40" />}
                      {content.content_type === 'image' && <Image className="w-8 h-8 text-white/40" />}
                    </>
                  )}
                  {(content.content_type === 'music' || content.content_type === 'video') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{content.title || 'Untitled'}</p>
                  <p className="text-xs text-white/60 capitalize">{content.content_type}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Trending & Featured */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-semibold">Trending Now</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Cyber Tokyo Dreams', type: 'World', color: 'from-cyan-500 to-blue-600' },
            { title: 'Luna - AI Companion', type: 'Persona', color: 'from-pink-500 to-rose-600' },
            { title: 'Lo-Fi Beats Pack', type: 'Music', color: 'from-violet-500 to-purple-600' },
          ].map((item, i) => (
            <Card key={i} className="overflow-hidden group cursor-pointer hover:scale-[1.02] transition">
              <div className={`h-32 bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                <Badge variant="secondary" className="bg-black/30 backdrop-blur">
                  {item.type}
                </Badge>
              </div>
              <CardContent className="p-4">
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-white/60">Trending this week</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
