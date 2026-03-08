function trimEnv(value: string | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

export function getSupabaseUrl(): string | null {
  return trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string | null {
  return trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseServiceRoleKey(): string | null {
  return trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasSupabaseBrowserEnv(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function hasSupabaseServerEnv(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}
