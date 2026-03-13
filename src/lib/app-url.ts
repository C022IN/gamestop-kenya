function normalizeUrl(value?: string | null): string | null {
  const next = value?.trim();
  if (!next) return null;

  const withProtocol = /^https?:\/\//i.test(next) ? next : `https://${next}`;
  return withProtocol.replace(/\/+$/, '');
}

export function getAppUrl(origin?: string | null): string {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeUrl(process.env.VERCEL_BRANCH_URL) ??
    normalizeUrl(process.env.VERCEL_URL) ??
    normalizeUrl(origin) ??
    'http://localhost:3000'
  );
}
