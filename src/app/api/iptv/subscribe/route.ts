import { NextRequest, NextResponse } from 'next/server';
import { startMpesaIptvCheckout } from '@/domains/iptv/services/mpesa-checkout-service';
import { verifyTurnstileRequest } from '@/lib/turnstile';

export async function POST(req: NextRequest) {
  let body: {
    planId?: unknown;
    customerName?: unknown;
    email?: unknown;
    phone?: unknown;
    turnstileToken?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.planId || !body.customerName || !body.email || !body.phone) {
    return NextResponse.json(
      { error: 'planId, customerName, email, and phone are required' },
      { status: 400 }
    );
  }

  const verification = await verifyTurnstileRequest(req, body.turnstileToken);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: verification.status });
  }

  const result = await startMpesaIptvCheckout({
    planId: String(body.planId ?? ''),
    customerName: String(body.customerName ?? ''),
    email: String(body.email ?? ''),
    phone: String(body.phone ?? ''),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
