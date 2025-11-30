import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';

// Force dynamic rendering - all (app) routes require authentication
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Check if onboarding is complete
  if (profile && !profile.onboarding_completed) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <Sidebar profile={profile} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <div className="min-h-screen pb-20 lg:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
