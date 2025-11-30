import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Whitelist of allowed redirect paths to prevent open redirect attacks
const ALLOWED_REDIRECT_PATHS = [
  '/dashboard',
  '/chat',
  '/personas',
  '/worlds',
  '/create',
  '/settings',
  '/settings/billing',
  '/settings/profile',
  '/onboarding',
];

// Validate redirect path to prevent open redirect attacks
function isValidRedirect(redirect: string): boolean {
  // Must start with / and be a relative path
  if (!redirect.startsWith('/')) {
    return false;
  }

  // Check against whitelist (also allow subpaths)
  const normalizedRedirect = redirect.split('?')[0]; // Remove query params
  return ALLOWED_REDIRECT_PATHS.some(
    (allowed) =>
      normalizedRedirect === allowed || normalizedRedirect.startsWith(`${allowed}/`)
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawRedirect = searchParams.get('redirect');
  const onboarding = searchParams.get('onboarding');
  const ref = searchParams.get('ref');

  // Validate and sanitize redirect path
  const redirect = rawRedirect && isValidRedirect(rawRedirect) ? rawRedirect : '/dashboard';

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        // Handle referral for OAuth signups
        if (ref && typeof ref === 'string' && ref.length <= 20) {
          try {
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
          } catch (refError) {
            // Log but don't fail auth if referral processing fails
            console.error('Referral processing error:', refError);
          }
        }

        // Redirect to onboarding for new users
        if (onboarding === 'true') {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        return NextResponse.redirect(`${origin}${redirect}`);
      }

      console.error('Auth callback error:', error?.message);
    } catch (err) {
      console.error('Auth callback exception:', err);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
