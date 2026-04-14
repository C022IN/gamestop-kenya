/**
 * Public endpoint — records a catalog tracking link click.
 * Called server-side when a visitor lands on /shop?ref=LST-XXXX
 * Returns the listing details so the shop page can display them.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getListingByTrackingCode,
  recordClick,
} from '@/domains/admin/services/catalog-listings-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { trackingCode } = await req.json();
    if (!trackingCode || typeof trackingCode !== 'string') {
      return NextResponse.json({ error: 'trackingCode is required.' }, { status: 400 });
    }

    const listing = await getListingByTrackingCode(trackingCode.trim().toUpperCase());
    if (!listing) {
      return NextResponse.json({ error: 'Invalid or expired tracking code.' }, { status: 404 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null;
    const userAgent = req.headers.get('user-agent') ?? null;
    const referrerUrl = req.headers.get('referer') ?? null;

    const clickId = await recordClick({
      listingId: listing.id,
      adminId: listing.adminId,
      visitorIp: ip,
      userAgent,
      referrerUrl,
    });

    return NextResponse.json({ listing, clickId });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
