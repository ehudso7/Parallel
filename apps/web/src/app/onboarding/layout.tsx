import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - onboarding requires authentication
export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (!user) {
    redirect('/login');
  }

  return children;
}
