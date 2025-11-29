import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@parallel/ui';
import {
  User,
  Bell,
  CreditCard,
  Shield,
  Palette,
  HelpCircle,
  ChevronRight,
  Crown,
  Coins,
  Settings as SettingsIcon,
} from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          href: '/settings/profile',
          icon: User,
          label: 'Profile',
          description: 'Manage your personal information',
        },
        {
          href: '/settings/notifications',
          icon: Bell,
          label: 'Notifications',
          description: 'Configure notification preferences',
        },
        {
          href: '/settings/privacy',
          icon: Shield,
          label: 'Privacy & Security',
          description: 'Manage your privacy settings',
        },
      ],
    },
    {
      title: 'Subscription',
      items: [
        {
          href: '/settings/billing',
          icon: CreditCard,
          label: 'Billing',
          description: 'Manage subscription and payment',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          href: '/settings/appearance',
          icon: Palette,
          label: 'Appearance',
          description: 'Customize the app appearance',
        },
        {
          href: '/settings/ai',
          icon: SettingsIcon,
          label: 'AI Settings',
          description: 'Configure AI behavior preferences',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          href: '/support',
          icon: HelpCircle,
          label: 'Help Center',
          description: 'Get help and support',
        },
      ],
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Account Overview */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold">
              {profile?.display_name?.[0] || profile?.email?.[0] || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {profile?.display_name || profile?.username || 'User'}
              </h2>
              <p className="text-white/60">{profile?.email}</p>
            </div>
            <Link href="/settings/profile">
              <Button variant="outline">Edit Profile</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {profile?.subscription_tier === 'free' ? (
                  <Badge variant="secondary">Free</Badge>
                ) : (
                  <Badge variant="premium">
                    <Crown className="w-3 h-3 mr-1" />
                    {profile?.subscription_tier}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-white/40">Plan</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">{profile?.credits_balance || 0}</span>
              </div>
              <p className="text-xs text-white/40">Credits</p>
            </div>
            <div className="text-center">
              <p className="font-semibold mb-1">{profile?.current_streak || 0} days</p>
              <p className="text-xs text-white/40">Streak</p>
            </div>
          </div>

          {/* Upgrade CTA */}
          {profile?.subscription_tier === 'free' && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    Upgrade to Pro
                  </h3>
                  <p className="text-sm text-white/60">
                    Unlock unlimited features and credits
                  </p>
                </div>
                <Link href="/settings/billing">
                  <Button variant="glow">Upgrade</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-white/60">{section.title}</h2>
          <Card>
            <CardContent className="p-0">
              {section.items.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 p-4 hover:bg-white/5 transition ${
                    index !== section.items.length - 1 ? 'border-b border-white/10' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-white/40">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-white/40">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
