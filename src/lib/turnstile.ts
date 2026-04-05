import type { NextRequest } from 'next/server';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

type TurnstileVerificationResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; status: number; error: string; codes?: string[] };

function getTurnstileSecret() {
  return process.env.TURNSTILE_SECRET_KEY?.trim() ?? '';
}

export function isTurnstileConfigured() {
  return getTurnstileSecret().length > 0;
}

export function extractClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',');
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  for (const headerName of ['cf-connecting-ip', 'x-real-ip', 'x-vercel-forwarded-for']) {
    const value = req.headers.get(headerName)?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

export async function verifyTurnstileToken({
  token,
  ip,
}: {
  token: unknown;
  ip?: string | null;
}): Promise<TurnstileVerificationResult> {
  const secret = getTurnstileSecret();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return {
        ok: false,
        status: 503,
        error: 'Security check is not configured right now. Please try again shortly.',
      };
    }

    return { ok: true, skipped: true };
  }

  const normalizedToken = typeof token === 'string' ? token.trim() : '';
  if (!normalizedToken) {
    return { ok: false, status: 400, error: 'Complete the security check and try again.' };
  }

  const body = new URLSearchParams({
    secret,
    response: normalizedToken,
  });

  if (ip?.trim()) {
    body.set('remoteip', ip.trim());
  }

  let response: Response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Turnstile verification request failed:', error);
    return {
      ok: false,
      status: 502,
      error: 'Security check could not be completed. Please try again.',
    };
  }

  if (!response.ok) {
    console.error('Turnstile verification returned HTTP', response.status);
    return {
      ok: false,
      status: 502,
      error: 'Security check could not be completed. Please try again.',
    };
  }

  let verification: TurnstileVerifyResponse;
  try {
    verification = (await response.json()) as TurnstileVerifyResponse;
  } catch (error) {
    console.error('Turnstile verification returned invalid JSON:', error);
    return {
      ok: false,
      status: 502,
      error: 'Security check could not be completed. Please try again.',
    };
  }

  if (verification.success) {
    return { ok: true };
  }

  console.warn('Turnstile verification failed:', verification['error-codes'] ?? []);
  return {
    ok: false,
    status: 400,
    error: 'Security check failed. Please try again.',
    codes: verification['error-codes'],
  };
}

export async function verifyTurnstileRequest(req: NextRequest, token: unknown) {
  return verifyTurnstileToken({
    token,
    ip: extractClientIp(req),
  });
}
