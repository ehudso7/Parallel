// ===========================================
// PARALLEL - Database Package Exports
// ===========================================

export * from './types';
export * from './client';

// Re-export commonly used Supabase types
export type {
  User,
  Session,
  AuthError,
  AuthChangeEvent,
} from '@supabase/supabase-js';
