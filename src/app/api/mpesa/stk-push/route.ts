import { NextRequest, NextResponse } from 'next/server';
import { initiateStkPush, normaliseMpesaPhone } from '@/lib/mpesa';

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId, description } = await req.json();

    if (!phone || !amount || !orderId) {
      return NextResponse.json(
        { error: 'phone, amount, and orderId are required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount < 1) {
      return NextResponse.json(
        { error: 'amount must be a positive number in KES' },
        { status: 400 }
      );
    }

    const normalisedPhone = normaliseMpesaPhone(String(phone));
    if (normalisedPhone.length !== 12) {
      return NextResponse.json(
        { error: 'Invalid Kenyan phone number. Use format 07XXXXXXXX or 254XXXXXXXXX' },
        { status: 400 }
      );
    }

    const result = await initiateStkPush({
      phone,
      amount,
      orderId,
      description,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      checkoutRequestId: result.checkoutRequestId,
      merchantRequestId: result.merchantRequestId,
      customerMessage: result.customerMessage,
    });
  } catch (err) {
    console.error('STK push error:', err);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
