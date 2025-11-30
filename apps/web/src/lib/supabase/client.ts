import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@parallel/database';

// Validate environment variables at module load time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function validateEnvVars(): { url: string; anonKey: string } {
  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file or Vercel environment variables.'
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env.local file or Vercel environment variables.'
    );
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

export function createClient() {
  const { url, anonKey } = validateEnvVars();
  return createBrowserClient<Database>(url, anonKey);
}

// Singleton for client-side usage
let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    // Server-side: always create a new client
    return createClient();
  }

  // Client-side: use singleton
  if (!client) {
    client = createClient();
  }
  return client;
}

// Check if Supabase is configured (useful for conditional rendering)
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
