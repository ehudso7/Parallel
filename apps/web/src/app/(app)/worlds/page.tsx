import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@parallel/ui';
import {
  Plus,
  Globe,
  Star,
  Search,
  Filter,
  Crown,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';

export default async function WorldsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/worlds');
  }

  // Fetch user's worlds
  const { data: userWorlds } = await supabase
    .from('user_worlds')
    .select(`
      *,
      world:worlds(*)
    `)
    .eq('user_id', user.id)
    .order('last_visit_at', { ascending: false });

  // Fetch featured/public worlds
  const { data: featuredWorlds } = await supabase
    .from('worlds')
    .select('*')
    .eq('is_public', true)
    .eq('is_featured', true)
    .limit(8);

  // Fetch all public worlds for explore
  const { data: allWorlds } = await supabase
    .from('worlds')
    .select('*')
    .eq('is_public', true)
    .order('total_visits', { ascending: false })
    .limit(20);

  const themeColors: Record<string, string> = {
    cyber: 'from-cyan-500 to-blue-600',
    retro: 'from-orange-500 to-red-600',
    tropical: 'from-green-500 to-emerald-600',
    space: 'from-purple-500 to-violet-600',
    luxury: 'from-amber-500 to-yellow-600',
    fantasy: 'from-pink-500 to-rose-600',
    horror: 'from-slate-600 to-slate-800',
    romance: 'from-rose-500 to-pink-600',
    adventure: 'from-emerald-500 to-teal-600',
    custom: 'from-violet-500 to-fuchsia-600',
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Globe className="w-8 h-8 text-cyan-400" />
            Parallel Worlds
          </h1>
          <p className="text-white/60">Explore immersive themed universes</p>
        </div>
        <Link href="/worlds/create">
          <Button variant="glow">
            <Plus className="w-5 h-5 mr-2" />
            Create World
          </Button>
        </Link>
      </div>

      {/* Featured Worlds Banner */}
      {featuredWorlds && featuredWorlds.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Featured Worlds
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 lg:mx-0 lg:px-0">
            {featuredWorlds.map((world: any) => (
              <Link
                key={world.id}
                href={`/worlds/${world.id}`}
                className="flex-shrink-0 w-72"
              >
                <Card className="overflow-hidden group cursor-pointer hover:scale-[1.02] transition">
                  <div className={`h-40 bg-gradient-to-br ${themeColors[world.theme] || themeColors.custom} relative`}>
                    {world.is_premium && (
                      <Badge variant="premium" className="absolute top-3 right-3">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{world.name}</h3>
                    <p className="text-sm text-white/60 line-clamp-2">{world.tagline || world.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {world.total_visits?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        {world.average_rating?.toFixed(1) || '5.0'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search worlds..."
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="my-worlds">
        <TabsList className="mb-6">
          <TabsTrigger value="my-worlds">My Worlds</TabsTrigger>
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        {/* My Worlds */}
        <TabsContent value="my-worlds">
          {userWorlds && userWorlds.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userWorlds.map((uw: any) => (
                <Link key={uw.id} href={`/worlds/${uw.world?.id}`}>
                  <Card className="overflow-hidden group cursor-pointer hover:scale-[1.02] transition h-full">
                    <div className={`h-32 bg-gradient-to-br ${themeColors[uw.world?.theme] || themeColors.custom} relative`}>
                      {uw.is_favorite && (
                        <div className="absolute top-3 right-3">
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{uw.world?.name}</h3>
                      <Badge variant="secondary" className="text-xs mt-1 capitalize">
                        {uw.world?.theme}
                      </Badge>

                      <div className="flex items-center gap-3 mt-3 text-xs text-white/40">
                        <span>Level {uw.exploration_level || 1}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {uw.total_visits || 0} visits
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* Create New Card */}
              <Link href="/worlds/create">
                <Card className="h-full border-dashed hover:border-cyan-500/50 transition cursor-pointer group">
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <Plus className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="font-semibold mb-1">Create New World</h3>
                    <p className="text-sm text-white/60">Design your own universe</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Globe className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No worlds unlocked</h3>
                <p className="text-white/60 mb-6">
                  Explore and unlock worlds to start your adventures
                </p>
                <Button variant="glow" onClick={() => {}}>
                  Explore Worlds
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Explore */}
        <TabsContent value="explore">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allWorlds?.map((world: any) => (
              <Link key={world.id} href={`/worlds/${world.id}`}>
                <Card className="overflow-hidden group cursor-pointer hover:scale-[1.02] transition h-full">
                  <div className={`h-32 bg-gradient-to-br ${themeColors[world.theme] || themeColors.custom} relative`}>
                    {world.is_premium && (
                      <Badge variant="premium" className="absolute top-3 right-3">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{world.name}</h3>
                    <p className="text-sm text-white/60 line-clamp-2 mt-1">
                      {world.tagline || world.description}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {world.theme}
                      </Badge>
                      <div className="flex items-center gap-1 text-amber-400 text-sm">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{world.average_rating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favorites">
          {(userWorlds?.filter((uw: any) => uw.is_favorite).length ?? 0) > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userWorlds
                ?.filter((uw: any) => uw.is_favorite)
                .map((uw: any) => (
                  <Link key={uw.id} href={`/worlds/${uw.world?.id}`}>
                    <Card className="overflow-hidden group cursor-pointer hover:scale-[1.02] transition h-full">
                      <div className={`h-32 bg-gradient-to-br ${themeColors[uw.world?.theme] || themeColors.custom} relative`}>
                        <div className="absolute top-3 right-3">
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{uw.world?.name}</h3>
                        <Badge variant="secondary" className="text-xs mt-1 capitalize">
                          {uw.world?.theme}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                <p className="text-white/60">
                  Star your favorite worlds to find them quickly here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
