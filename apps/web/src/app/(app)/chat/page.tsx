import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button, Card, CardContent, Badge, Avatar, AvatarFallback } from '@parallel/ui';
import { Plus, MessageCircle, Search, Star, Clock, Heart, Brain, Flame } from 'lucide-react';

export default async function ChatListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch conversations with personas
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      persona:personas(*),
      world:worlds(*)
    `)
    .eq('user_id', user!.id)
    .eq('is_archived', false)
    .order('last_message_at', { ascending: false });

  // Fetch user's personas for quick start
  const { data: userPersonas } = await supabase
    .from('user_personas')
    .select(`
      *,
      persona:personas(*)
    `)
    .eq('user_id', user!.id)
    .order('last_interaction_at', { ascending: false })
    .limit(6);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-white/60">Chat with your AI companions</p>
        </div>
        <Link href="/chat/new">
          <Button variant="glow">
            <Plus className="w-5 h-5 mr-2" />
            New Chat
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Search conversations..."
          className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
        />
      </div>

      {/* Quick Start with Personas */}
      {userPersonas && userPersonas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Quick Start
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 lg:mx-0 lg:px-0">
            {userPersonas.map((up: any) => (
              <Link key={up.id} href={`/chat/new?persona=${up.persona?.id}`} className="flex-shrink-0">
                <Card className="w-32 hover:scale-105 transition cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <Avatar size="lg" className="mx-auto mb-2">
                      <AvatarFallback className="text-lg">
                        {up.persona?.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium truncate text-sm">{up.persona?.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {up.persona?.persona_type}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
            <Link href="/personas" className="flex-shrink-0">
              <Card className="w-32 h-full border-dashed hover:border-violet-500/50 transition cursor-pointer">
                <CardContent className="p-4 h-full flex flex-col items-center justify-center">
                  <Plus className="w-8 h-8 text-violet-400 mb-2" />
                  <p className="text-sm text-white/60">More</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* Conversations List */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-violet-400" />
          Conversations
        </h2>

        {conversations && conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conv: any) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <Card className="hover:bg-white/10 transition cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar size="lg" status={conv.is_active ? 'online' : undefined}>
                        <AvatarFallback>
                          {conv.persona?.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{conv.persona?.name || 'Unknown'}</h3>
                            {conv.persona?.is_premium && (
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            )}
                          </div>
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(conv.last_message_at)}
                          </span>
                        </div>

                        <p className="text-sm text-white/60 truncate mb-2">
                          {conv.title || `Chat with ${conv.persona?.name}`}
                        </p>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <PersonaIcon type={conv.persona?.persona_type} />
                            {conv.persona?.persona_type}
                          </Badge>
                          {conv.world && (
                            <Badge variant="outline" className="text-xs">
                              {conv.world.name}
                            </Badge>
                          )}
                          <span className="text-xs text-white/40 ml-auto">
                            {conv.message_count} messages
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-violet-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
              <p className="text-white/60 mb-6">
                Start chatting with your AI companions to see your conversations here.
              </p>
              <Link href="/chat/new">
                <Button variant="glow">
                  <Plus className="w-5 h-5 mr-2" />
                  Start Your First Chat
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function PersonaIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    romantic: <Heart className="w-3 h-3 mr-1" />,
    friend: <MessageCircle className="w-3 h-3 mr-1" />,
    mentor: <Brain className="w-3 h-3 mr-1" />,
  };
  return icons[type] || null;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}
