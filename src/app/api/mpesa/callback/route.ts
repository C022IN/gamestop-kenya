import { NextRequest, NextResponse } from 'next/server';
import { setPaymentResult } from '@/lib/mpesa-payment-results';

/**
 * Safaricom sends the STK Push result to this URL.
 * URL must be publicly accessible and HTTPS.
 * Set MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const callback = body?.Body?.stkCallback;
    if (!callback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const checkoutRequestId: string = callback.CheckoutRequestID;
    const resultCode: string = String(callback.ResultCode);
    const resultDesc: string = callback.ResultDesc;

    if (resultCode === '0') {
      // Payment successful — extract metadata
      const items: Array<{ Name: string; Value: string | number }> =
        callback.CallbackMetadata?.Item ?? [];

      const get = (name: string) =>
        items.find((i) => i.Name === name)?.Value;

      await setPaymentResult(checkoutRequestId, {
        status: 'success',
        resultCode,
        resultDesc,
        mpesaReceiptNumber: String(get('MpesaReceiptNumber') ?? ''),
        transactionDate: String(get('TransactionDate') ?? ''),
        phoneNumber: String(get('PhoneNumber') ?? ''),
        amount: Number(get('Amount') ?? 0),
      }, { payload: body });
    } else {
      // Payment failed or was cancelled
      await setPaymentResult(checkoutRequestId, {
        status: 'failed',
        resultCode,
        resultDesc,
      }, { payload: body });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('M-Pesa callback error:', err);
    // Always return 200 to Safaricom even on errors
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
