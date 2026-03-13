/**
 * Safaricom M-Pesa Daraja API helpers
 *
 * Docs: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 *
 * Required environment variables:
 *   MPESA_CONSUMER_KEY      - From Daraja developer portal
 *   MPESA_CONSUMER_SECRET   - From Daraja developer portal
 *   MPESA_SHORTCODE         - Business shortcode (sandbox: 174379)
 *   MPESA_PASSKEY           - From Daraja portal (sandbox passkey provided below)
 *   MPESA_CALLBACK_URL      - Optional explicit callback URL. Falls back to {site}/api/mpesa/callback
 *   MPESA_ENVIRONMENT       - "sandbox" | "production"
 */

import { getAppUrl } from '@/lib/app-url';

const SANDBOX_BASE = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_BASE = 'https://api.safaricom.co.ke';

function getBaseUrl(): string {
  return process.env.MPESA_ENVIRONMENT === 'production' ? PRODUCTION_BASE : SANDBOX_BASE;
}

/** Generate a Daraja timestamp in the format YYYYMMDDHHmmss */
export function getDarajaTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

/** Generate the base64-encoded STK password: base64(shortcode + passkey + timestamp) */
export function getStkPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE ?? '';
  const passkey = process.env.MPESA_PASSKEY ?? '';
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

/** Normalise a Kenyan phone number to the 254XXXXXXXXX format Daraja expects */
export function normaliseMpesaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return '254' + digits.slice(1);
  }
  if (digits.startsWith('254') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('7') && digits.length === 9) {
    return '254' + digits;
  }
  return digits;
}

/** Fetch an OAuth access token from Daraja */
export async function getMpesaToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY ?? '';
  const secret = process.env.MPESA_CONSUMER_SECRET ?? '';
  const credentials = Buffer.from(`${key}:${secret}`).toString('base64');

  const res = await fetch(
    `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa token error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export interface StkPushParams {
  phone: string;       // raw phone number from user
  amount: number;      // in KES, must be a whole number
  orderId: string;     // used as AccountReference
  description?: string;
}

export interface StkPushResult {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  customerMessage?: string;
  error?: string;
}

/** Initiate an M-Pesa Express (STK Push) payment */
export async function initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
  const { phone, amount, orderId, description } = params;

  const token = await getMpesaToken();
  const timestamp = getDarajaTimestamp();
  const password = getStkPassword(timestamp);
  const shortcode = process.env.MPESA_SHORTCODE ?? '';
  const callbackUrl =
    process.env.MPESA_CALLBACK_URL?.trim() || `${getAppUrl()}/api/mpesa/callback`;

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: normaliseMpesaPhone(phone),
    PartyB: shortcode,
    PhoneNumber: normaliseMpesaPhone(phone),
    CallBackURL: callbackUrl,
    AccountReference: orderId,
    TransactionDesc: description ?? `GameStop Kenya order ${orderId}`,
  };

  const res = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json();

  if (data.ResponseCode === '0') {
    return {
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      customerMessage: data.CustomerMessage,
    };
  }

  return {
    success: false,
    error: data.errorMessage ?? data.ResponseDescription ?? 'STK Push failed',
  };
}

export interface StkQueryResult {
  status: 'pending' | 'success' | 'failed';
  resultCode?: string;
  resultDesc?: string;
}

/** Query the status of an STK Push transaction */
export async function queryStkStatus(checkoutRequestId: string): Promise<StkQueryResult> {
  const token = await getMpesaToken();
  const timestamp = getDarajaTimestamp();
  const password = getStkPassword(timestamp);
  const shortcode = process.env.MPESA_SHORTCODE ?? '';

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await fetch(`${getBaseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json();

  // ResultCode 0 = success, 1032 = cancelled by user, others = failure
  if (data.ResultCode === '0' || data.ResultCode === 0) {
    return { status: 'success', resultCode: String(data.ResultCode), resultDesc: data.ResultDesc };
  }

  if (data.ResultCode !== undefined) {
    return { status: 'failed', resultCode: String(data.ResultCode), resultDesc: data.ResultDesc };
  }

  // errorCode 500.001.1001 = still processing
  return { status: 'pending' };
}
