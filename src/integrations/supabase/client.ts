import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * This deployment can display the public website before a development
 * Supabase project is connected. The placeholder URL is never used as
 * a production backend; all authenticated flows require real credentials.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase = createClient<Database>(
  url || 'https://not-configured.supabase.co',
  key || 'public-preview-only',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
