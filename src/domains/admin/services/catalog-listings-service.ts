import { randomBytes } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListingCondition = 'new' | 'used' | 'refurbished';
export type InquiryStatus = 'new' | 'contacted' | 'sold' | 'closed';

export interface CatalogListing {
  id: string;
  adminId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  priceKes: number | null;
  images: string[];
  specs: Record<string, string>;
  condition: ListingCondition;
  isAvailable: boolean;
  trackingCode: string;
  /** Full public URL for the tracking link */
  trackingUrl: string;
  clickCount: number;
  inquiryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogInquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  adminId: string;
  clickId: string | null;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  message: string | null;
  status: InquiryStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListingRow {
  id: string;
  admin_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price_kes: number | null;
  images: string[];
  specs: Record<string, string>;
  condition: ListingCondition;
  is_available: boolean;
  tracking_code: string;
  created_at: string;
  updated_at: string;
  click_count?: number;
  inquiry_count?: number;
}

interface InquiryRow {
  id: string;
  listing_id: string;
  listing_title?: string;
  admin_id: string;
  click_id: string | null;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  message: string | null;
  status: InquiryStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeListingId(): string {
  return `lst-${randomBytes(5).toString('hex')}`;
}

function makeTrackingCode(): string {
  return `LST-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function slugify(title: string, id: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) +
    '-' +
    id.slice(-4)
  );
}

function buildTrackingUrl(trackingCode: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://gamestop.co.ke';
  return `${base}/shop?ref=${trackingCode}`;
}

function fromListingRow(row: ListingRow): CatalogListing {
  return {
    id: row.id,
    adminId: row.admin_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    priceKes: row.price_kes,
    images: row.images ?? [],
    specs: row.specs ?? {},
    condition: row.condition,
    isAvailable: row.is_available,
    trackingCode: row.tracking_code,
    trackingUrl: buildTrackingUrl(row.tracking_code),
    clickCount: row.click_count ?? 0,
    inquiryCount: row.inquiry_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromInquiryRow(row: InquiryRow): CatalogInquiry {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title ?? '',
    adminId: row.admin_id,
    clickId: row.click_id,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    buyerEmail: row.buyer_email,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function getListingsForAdmin(
  adminId: string,
  isSuperAdmin = false
): Promise<CatalogListing[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from('catalog_listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (!isSuperAdmin) {
    query = query.eq('admin_id', adminId);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const listings = data as ListingRow[];

  // Enrich with click + inquiry counts
  const ids = listings.map((l) => l.id);
  if (ids.length === 0) return listings.map(fromListingRow);

  const [clickRes, inquiryRes] = await Promise.all([
    supabase
      .from('catalog_link_clicks')
      .select('listing_id')
      .in('listing_id', ids),
    supabase
      .from('catalog_inquiries')
      .select('listing_id')
      .in('listing_id', ids),
  ]);

  const clickCounts: Record<string, number> = {};
  const inquiryCounts: Record<string, number> = {};

  for (const row of clickRes.data ?? []) {
    clickCounts[row.listing_id] = (clickCounts[row.listing_id] ?? 0) + 1;
  }
  for (const row of inquiryRes.data ?? []) {
    inquiryCounts[row.listing_id] = (inquiryCounts[row.listing_id] ?? 0) + 1;
  }

  return listings.map((l) =>
    fromListingRow({
      ...l,
      click_count: clickCounts[l.id] ?? 0,
      inquiry_count: inquiryCounts[l.id] ?? 0,
    })
  );
}

export async function getListingByTrackingCode(
  trackingCode: string
): Promise<CatalogListing | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('catalog_listings')
    .select('*')
    .eq('tracking_code', trackingCode)
    .eq('is_available', true)
    .maybeSingle();

  if (error || !data) return null;
  return fromListingRow(data as ListingRow);
}

export async function getListingById(id: string): Promise<CatalogListing | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('catalog_listings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return fromListingRow(data as ListingRow);
}

export async function createListing(params: {
  adminId: string;
  title: string;
  description?: string;
  category?: string;
  priceKes?: number | null;
  images?: string[];
  specs?: Record<string, string>;
  condition?: ListingCondition;
}): Promise<{ ok: boolean; listing?: CatalogListing; error?: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: 'Database not configured.' };

  const title = params.title.trim();
  if (!title) return { ok: false, error: 'Listing title is required.' };

  const id = makeListingId();
  const slug = slugify(title, id);
  const trackingCode = makeTrackingCode();

  const row = {
    id,
    admin_id: params.adminId,
    title,
    slug,
    description: params.description?.trim() ?? '',
    category: params.category?.trim() ?? 'general',
    price_kes: params.priceKes ?? null,
    images: params.images ?? [],
    specs: params.specs ?? {},
    condition: params.condition ?? 'new',
    is_available: true,
    tracking_code: trackingCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('catalog_listings').insert(row);
  if (error) return { ok: false, error: error.message };

  return { ok: true, listing: fromListingRow({ ...row, click_count: 0, inquiry_count: 0 }) };
}

export async function updateListing(
  id: string,
  adminId: string,
  isSuperAdmin: boolean,
  updates: {
    title?: string;
    description?: string;
    category?: string;
    priceKes?: number | null;
    images?: string[];
    specs?: Record<string, string>;
    condition?: ListingCondition;
    isAvailable?: boolean;
  }
): Promise<{ ok: boolean; listing?: CatalogListing; error?: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: 'Database not configured.' };

  const existing = await getListingById(id);
  if (!existing) return { ok: false, error: 'Listing not found.' };
  if (!isSuperAdmin && existing.adminId !== adminId) {
    return { ok: false, error: 'You can only edit your own listings.' };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) {
    patch.title = updates.title.trim();
    patch.slug = slugify(updates.title.trim(), id);
  }
  if (updates.description !== undefined) patch.description = updates.description.trim();
  if (updates.category !== undefined) patch.category = updates.category.trim();
  if ('priceKes' in updates) patch.price_kes = updates.priceKes ?? null;
  if (updates.images !== undefined) patch.images = updates.images;
  if (updates.specs !== undefined) patch.specs = updates.specs;
  if (updates.condition !== undefined) patch.condition = updates.condition;
  if (updates.isAvailable !== undefined) patch.is_available = updates.isAvailable;

  const { error } = await supabase.from('catalog_listings').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };

  const updated = await getListingById(id);
  return updated ? { ok: true, listing: updated } : { ok: false, error: 'Could not re-fetch listing.' };
}

export async function deleteListing(
  id: string,
  adminId: string,
  isSuperAdmin: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: 'Database not configured.' };

  const existing = await getListingById(id);
  if (!existing) return { ok: false, error: 'Listing not found.' };
  if (!isSuperAdmin && existing.adminId !== adminId) {
    return { ok: false, error: 'You can only delete your own listings.' };
  }

  const { error } = await supabase.from('catalog_listings').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Click tracking ───────────────────────────────────────────────────────────

export async function recordClick(params: {
  listingId: string;
  adminId: string;
  visitorIp?: string | null;
  userAgent?: string | null;
  referrerUrl?: string | null;
}): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('catalog_link_clicks')
    .insert({
      listing_id: params.listingId,
      admin_id: params.adminId,
      visitor_ip: params.visitorIp ?? null,
      user_agent: params.userAgent ?? null,
      referrer_url: params.referrerUrl ?? null,
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function markClickConverted(clickId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from('catalog_link_clicks').update({ converted: true }).eq('id', clickId);
}

// ─── Inquiries ────────────────────────────────────────────────────────────────

export async function getInquiriesForAdmin(
  adminId: string,
  isSuperAdmin = false
): Promise<CatalogInquiry[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from('catalog_inquiries')
    .select('*, catalog_listings(title)')
    .order('created_at', { ascending: false });

  if (!isSuperAdmin) {
    query = query.eq('admin_id', adminId);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Array<InquiryRow & { catalog_listings?: { title: string } }>).map((row) =>
    fromInquiryRow({
      ...row,
      listing_title: row.catalog_listings?.title,
    })
  );
}

export async function createInquiry(params: {
  listingId: string;
  adminId: string;
  clickId?: string | null;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string | null;
  message?: string | null;
}): Promise<{ ok: boolean; inquiry?: CatalogInquiry; error?: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: 'Database not configured.' };

  const buyerName = params.buyerName.trim();
  const buyerPhone = params.buyerPhone.trim();
  if (!buyerName) return { ok: false, error: 'Buyer name is required.' };
  if (!buyerPhone) return { ok: false, error: 'Buyer phone is required.' };

  const { data, error } = await supabase
    .from('catalog_inquiries')
    .insert({
      listing_id: params.listingId,
      admin_id: params.adminId,
      click_id: params.clickId ?? null,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      buyer_email: params.buyerEmail?.trim() ?? null,
      message: params.message?.trim() ?? null,
      status: 'new',
    })
    .select('*')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create inquiry.' };

  if (params.clickId) {
    await markClickConverted(params.clickId);
  }

  return { ok: true, inquiry: fromInquiryRow(data as InquiryRow) };
}

export async function updateInquiryStatus(
  inquiryId: string,
  adminId: string,
  isSuperAdmin: boolean,
  updates: { status?: InquiryStatus; adminNotes?: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: 'Database not configured.' };

  const { data: existing } = await supabase
    .from('catalog_inquiries')
    .select('admin_id')
    .eq('id', inquiryId)
    .maybeSingle();

  if (!existing) return { ok: false, error: 'Inquiry not found.' };
  if (!isSuperAdmin && (existing as { admin_id: string }).admin_id !== adminId) {
    return { ok: false, error: 'You can only update your own inquiries.' };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.adminNotes !== undefined) patch.admin_notes = updates.adminNotes.trim();

  const { error } = await supabase.from('catalog_inquiries').update(patch).eq('id', inquiryId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
