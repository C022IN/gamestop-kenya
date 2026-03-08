import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl, hasSupabaseServerEnv } from '@/lib/supabase/env';

let cachedClient: SupabaseClient | null | undefined;

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!hasSupabaseServerEnv()) {
    return null;
  }

  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'gamestop-kenya/server',
      },
    },
  });

  return cachedClient;
}
