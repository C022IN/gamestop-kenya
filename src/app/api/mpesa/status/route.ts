import { NextRequest, NextResponse } from 'next/server';
import { queryStkStatus } from '@/lib/mpesa';
import { paymentResults } from '@/lib/mpesa-payment-results';

/**
 * GET /api/mpesa/status?id=<checkoutRequestId>
 *
 * First checks the in-memory callback store (populated when Safaricom fires
 * the callback). Falls back to a direct Daraja query if the callback hasn't
 * arrived yet (useful in sandbox or when callback delivery is slow).
 */
export async function GET(req: NextRequest) {
  const checkoutRequestId = req.nextUrl.searchParams.get('id');

  if (!checkoutRequestId) {
    return NextResponse.json(
      { error: 'id query parameter is required' },
      { status: 400 }
    );
  }

  // 1. Check if Safaricom has already called back
  const cached = paymentResults.get(checkoutRequestId);
  if (cached) {
    return NextResponse.json(cached);
  }

  // 2. Fall back to a direct STK query
  try {
    const result = await queryStkStatus(checkoutRequestId);
    if (result.status === 'success' || result.status === 'failed') {
      paymentResults.set(checkoutRequestId, {
        status: result.status,
        resultCode: result.resultCode ?? '',
        resultDesc: result.resultDesc ?? '',
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('STK status query error:', err);
    return NextResponse.json({ status: 'pending' });
  }
}
