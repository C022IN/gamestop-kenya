import { NextRequest, NextResponse } from 'next/server';
import {
  isProvisioningRequestAuthorized,
  parseProvisioningPayload,
  provisionInternalCredentials,
} from '@/lib/iptv-provisioning-core';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isProvisioningRequestAuthorized(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized provisioning request.' }, { status: 401 });
  }

  try {
    const payload = parseProvisioningPayload(await req.json());
    const result = await provisionInternalCredentials(payload, req.nextUrl.origin);

    return NextResponse.json({
      credentials: result.credentials,
      provisioningSource: result.source,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not provision IPTV credentials.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
