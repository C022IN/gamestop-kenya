export function getAppUrl(origin?: string | null): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    origin?.trim() ??
    'http://localhost:3000';

  return configured.replace(/\/+$/, '');
}
