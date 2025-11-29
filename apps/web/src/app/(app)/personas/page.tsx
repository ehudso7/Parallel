import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, Badge, Avatar, AvatarFallback, Tabs, TabsList, TabsTrigger, TabsContent } from '@parallel/ui';
import {
  Plus,
  Heart,
  Users,
  Brain,
  Star,
  Sparkles,
  MessageCircle,
  Crown,
  Search,
  Filter,
} from 'lucide-react';

export default async function PersonasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/personas');
  }

  // Fetch user's personas
  const { data: userPersonas } = await supabase
    .from('user_personas')
    .select(`
      *,
      persona:personas(*)
    `)
    .eq('user_id', user.id)
    .order('last_interaction_at', { ascending: false });

  // Fetch public/featured personas for discovery
  const { data: featuredPersonas } = await supabase
    .from('personas')
    .select('*')
    .eq('is_public', true)
    .order('total_conversations', { ascending: false })
    .limit(12);

  const personaTypeIcons: Record<string, typeof Heart> = {
    romantic: Heart,
    friend: Users,
    mentor: Brain,
    trainer: Sparkles,
    strategist: Brain,
    hype: Sparkles,
    advisor: Brain,
    coach: Users,
    creative: Sparkles,
    roleplay: Star,
    custom: Sparkles,
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Personas</h1>
          <p className="text-white/60">Your AI companions and characters</p>
        </div>
        <Link href="/personas/new">
          <Button variant="glow">
            <Plus className="w-5 h-5 mr-2" />
            Create Persona
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search personas..."
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="my-personas">
        <TabsList className="mb-6">
          <TabsTrigger value="my-personas">My Personas</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        {/* My Personas */}
        <TabsContent value="my-personas">
          {userPersonas && userPersonas.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userPersonas.map((up: any) => {
                const Icon = personaTypeIcons[up.persona?.persona_type] || Sparkles;
                return (
                  <Link key={up.id} href={`/personas/${up.persona?.id}`}>
                    <Card className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden h-full">
                      <div className="h-32 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 relative">
                        {up.persona?.is_premium && (
                          <Badge variant="premium" className="absolute top-3 right-3">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4 -mt-10 relative">
                        <Avatar size="xl" className="mx-auto border-4 border-slate-900">
                          <AvatarFallback className="text-2xl">
                            {up.persona?.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="text-center mt-3">
                          <div className="flex items-center justify-center gap-2">
                            <h3 className="font-semibold">{up.nickname || up.persona?.name}</h3>
                            {up.is_favorite && (
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            )}
                          </div>

                          <div className="flex items-center justify-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Icon className="w-3 h-3 mr-1" />
                              {up.persona?.persona_type}
                            </Badge>
                          </div>

                          <p className="text-sm text-white/60 mt-2 line-clamp-2">
                            {up.persona?.tagline || up.persona?.description}
                          </p>

                          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {up.total_messages || 0}
                            </span>
                            <span>Level {up.relationship_level || 1}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}

              {/* Create New Card */}
              <Link href="/personas/new">
                <Card className="h-full border-dashed hover:border-violet-500/50 transition cursor-pointer group">
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <Plus className="w-8 h-8 text-violet-400" />
                    </div>
                    <h3 className="font-semibold mb-1">Create New Persona</h3>
                    <p className="text-sm text-white/60">Design your perfect AI companion</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No personas yet</h3>
                <p className="text-white/60 mb-6">
                  Create your first AI companion to start chatting
                </p>
                <Link href="/personas/new">
                  <Button variant="glow">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Persona
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Discover */}
        <TabsContent value="discover">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredPersonas?.map((persona: any) => {
              const Icon = personaTypeIcons[persona.persona_type] || Sparkles;
              return (
                <Link key={persona.id} href={`/personas/${persona.id}`}>
                  <Card className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden h-full">
                    <div className="h-32 bg-gradient-to-br from-pink-500/20 to-rose-500/20 relative">
                      {persona.is_premium && (
                        <Badge variant="premium" className="absolute top-3 right-3">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4 -mt-10 relative">
                      <Avatar size="xl" className="mx-auto border-4 border-slate-900">
                        <AvatarFallback className="text-2xl">
                          {persona.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="text-center mt-3">
                        <h3 className="font-semibold">{persona.name}</h3>

                        <div className="flex items-center justify-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            <Icon className="w-3 h-3 mr-1" />
                            {persona.persona_type}
                          </Badge>
                        </div>

                        <p className="text-sm text-white/60 mt-2 line-clamp-2">
                          {persona.tagline || persona.description}
                        </p>

                        <div className="flex items-center justify-center gap-2 mt-4">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm">{persona.average_rating?.toFixed(1) || '5.0'}</span>
                          </div>
                          <span className="text-xs text-white/40">
                            {persona.total_conversations?.toLocaleString() || 0} chats
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favorites">
          {(userPersonas?.filter((up: any) => up.is_favorite)?.length ?? 0) > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userPersonas
                ?.filter((up: any) => up.is_favorite)
                .map((up: any) => {
                  const Icon = personaTypeIcons[up.persona?.persona_type] || Sparkles;
                  return (
                    <Link key={up.id} href={`/personas/${up.persona?.id}`}>
                      <Card className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden h-full">
                        <div className="h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/20 relative" />
                        <CardContent className="p-4 -mt-10 relative">
                          <Avatar size="xl" className="mx-auto border-4 border-slate-900">
                            <AvatarFallback className="text-2xl">
                              {up.persona?.name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="text-center mt-3">
                            <div className="flex items-center justify-center gap-2">
                              <h3 className="font-semibold">{up.nickname || up.persona?.name}</h3>
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            </div>

                            <Badge variant="secondary" className="text-xs mt-1">
                              <Icon className="w-3 h-3 mr-1" />
                              {up.persona?.persona_type}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                <p className="text-white/60">
                  Star your favorite personas to find them quickly here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
