'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseBrowserEnv } from '@/lib/supabase/env';

let cachedClient: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey, {
    global: {
      headers: {
        'X-Client-Info': 'gamestop-kenya/browser',
      },
    },
  });

  return cachedClient;
}
