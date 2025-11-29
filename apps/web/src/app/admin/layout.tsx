import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  Globe,
  BarChart,
  Settings,
  Shield,
  AlertTriangle,
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!adminUser) {
    redirect('/dashboard');
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { href: '/admin/content', icon: MessageSquare, label: 'Content' },
    { href: '/admin/worlds', icon: Globe, label: 'Worlds' },
    { href: '/admin/analytics', icon: BarChart, label: 'Analytics' },
    { href: '/admin/moderation', icon: AlertTriangle, label: 'Moderation' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Shield className="w-8 h-8 text-violet-500" />
          <span className="text-xl font-bold">Admin</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Back to App</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
