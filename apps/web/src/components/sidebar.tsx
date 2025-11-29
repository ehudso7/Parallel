'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Profile } from '@parallel/database';
import { Avatar, AvatarImage, AvatarFallback, Badge, Button } from '@parallel/ui';
import {
  Sparkles,
  Home,
  MessageCircle,
  Users,
  Globe,
  Wand2,
  Settings,
  Crown,
  Gift,
  LogOut,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import { cn } from '@parallel/ui';

interface SidebarProps {
  profile: Profile | null;
}

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/personas', icon: Users, label: 'Personas' },
  { href: '/worlds', icon: Globe, label: 'Worlds' },
  { href: '/create', icon: Wand2, label: 'Create' },
];

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const initials = profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || profile?.email?.[0].toUpperCase() || '?';

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-white/10 bg-slate-900/50 backdrop-blur-xl">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold gradient-text">Parallel</span>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <Avatar size="md">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {profile?.display_name || profile?.username || 'User'}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={profile?.subscription_tier === 'free' ? 'secondary' : 'premium'}>
                {profile?.subscription_tier === 'free' ? (
                  'Free'
                ) : (
                  <>
                    <Crown className="w-3 h-3 mr-1" />
                    {profile?.subscription_tier}
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">{profile?.credits_balance || 0}</span>
            <span className="text-white/60 text-sm">credits</span>
          </div>
          <Link href="/settings/billing">
            <Button size="sm" variant="ghost" className="h-8 px-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-white border border-violet-500/30'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-violet-400')} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* Daily Rewards */}
        <Link
          href="/rewards"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 hover:border-amber-500/40 transition"
        >
          <Gift className="w-5 h-5" />
          <span className="font-medium">Daily Rewards</span>
          <Badge variant="warning" className="ml-auto">
            New!
          </Badge>
        </Link>

        {/* Upgrade CTA for free users */}
        {profile?.subscription_tier === 'free' && (
          <Link
            href="/settings/billing"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition"
          >
            <Crown className="w-5 h-5" />
            <span className="font-medium">Upgrade to Pro</span>
          </Link>
        )}

        {/* Settings & Logout */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
            pathname.startsWith('/settings')
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
