import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@parallel/database';

// Cache env var validation result
let envValidated = false;
let cachedUrl: string | null = null;
let cachedAnonKey: string | null = null;
let cachedServiceKey: string | null = null;

function getEnvVars() {
  if (!envValidated) {
    cachedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
    cachedAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
    cachedServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
    envValidated = true;
  }
  return { url: cachedUrl, anonKey: cachedAnonKey, serviceKey: cachedServiceKey };
}

function validateClientEnvVars(): { url: string; anonKey: string } {
  const { url, anonKey } = getEnvVars();

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file or Vercel environment variables.'
    );
  }
  if (!anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env.local file or Vercel environment variables.'
    );
  }
  return { url, anonKey };
}

function validateAdminEnvVars(): { url: string; serviceKey: string } {
  const { url, serviceKey } = getEnvVars();

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file or Vercel environment variables.'
    );
  }
  if (!serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Please add it to your .env.local file or Vercel environment variables. ' +
      'This is required for admin operations.'
    );
  }
  return { url, serviceKey };
}

export async function createClient() {
  const { url, anonKey } = validateClientEnvVars();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Admin client with service role key
export function createAdminClient() {
  const { url, serviceKey } = validateAdminEnvVars();

  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Check if Supabase is configured (useful for conditional logic)
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getEnvVars();
  return Boolean(url && anonKey);
}

// Check if admin client is available
export function isAdminConfigured(): boolean {
  const { url, serviceKey } = getEnvVars();
  return Boolean(url && serviceKey);
}
