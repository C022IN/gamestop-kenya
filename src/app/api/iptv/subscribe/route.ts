import { NextRequest, NextResponse } from 'next/server';
import { startMpesaIptvCheckout } from '@/domains/iptv/services/mpesa-checkout-service';

export async function POST(req: NextRequest) {
  const body = await req.json();
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
