import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@parallel/database';

// Protected routes that require authentication
const PROTECTED_PATHS = ['/dashboard', '/chat', '/personas', '/worlds', '/create', '/settings'];

// Auth pages that should redirect to dashboard if already logged in
const AUTH_PATHS = ['/login', '/signup'];

// Paths that should be excluded from auth checks
const EXCLUDED_PATHS = ['/api', '/_next', '/static', '/favicon.ico'];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next({ request });
  }

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Log warning with specific missing variable
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    console.error(
      `[Middleware] Missing Supabase environment variables: ${missing.join(', ')}. ` +
      'Authentication will not work. Please configure these in Vercel or .env.local'
    );

    // For protected paths, redirect to an error page or home
    const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
    if (isProtectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('error', 'config');
      return NextResponse.redirect(url);
    }

    // Allow request to proceed for non-protected paths
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('[Middleware] Auth error:', error.message);
    }

    // Protected routes check
    const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

    if (isProtectedPath && !user) {
      // Redirect to login with return URL
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Redirect logged-in users from auth pages to dashboard
    const isAuthPath = AUTH_PATHS.some((path) => pathname === path);

    if (isAuthPath && user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error);

    // On error, redirect protected paths to login for safety
    const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
    if (isProtectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'auth_error');
      return NextResponse.redirect(url);
    }

    // Allow non-protected paths to proceed
    return NextResponse.next({ request });
  }
}
