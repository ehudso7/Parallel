import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/dashboard';
  const onboarding = searchParams.get('onboarding');
  const ref = searchParams.get('ref');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Handle referral for OAuth signups
      if (ref) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', ref)
          .single();

        if (referrer) {
          // Check if referral already exists
          const { data: existingReferral } = await supabase
            .from('referrals')
            .select('id')
            .eq('referred_id', data.user.id)
            .single();

          if (!existingReferral) {
            await supabase.from('referrals').insert({
              referrer_id: referrer.id,
              referred_id: data.user.id,
            });
          }
        }
      }

      // Redirect to onboarding for new users
      if (onboarding === 'true') {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
