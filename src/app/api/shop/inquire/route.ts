/**
 * Public endpoint — submits a buyer inquiry for a catalog listing.
 * Buyer fills a contact form after clicking a catalog admin's tracking link.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getListingByTrackingCode,
  createInquiry,
} from '@/domains/admin/services/catalog-listings-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { trackingCode, clickId, buyerName, buyerPhone, buyerEmail, message } =
      await req.json();

    if (!trackingCode || typeof trackingCode !== 'string') {
      return NextResponse.json({ error: 'trackingCode is required.' }, { status: 400 });
    }
    if (!buyerName || typeof buyerName !== 'string') {
      return NextResponse.json({ error: 'Your name is required.' }, { status: 400 });
    }
    if (!buyerPhone || typeof buyerPhone !== 'string') {
      return NextResponse.json({ error: 'Your phone number is required.' }, { status: 400 });
    }

    const listing = await getListingByTrackingCode(trackingCode.trim().toUpperCase());
    if (!listing) {
      return NextResponse.json({ error: 'Invalid or expired tracking code.' }, { status: 404 });
    }

    const result = await createInquiry({
      listingId: listing.id,
      adminId: listing.adminId,
      clickId: typeof clickId === 'string' ? clickId : null,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerEmail: typeof buyerEmail === 'string' ? buyerEmail.trim() : null,
      message: typeof message === 'string' ? message.trim() : null,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, inquiryId: result.inquiry!.id });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
