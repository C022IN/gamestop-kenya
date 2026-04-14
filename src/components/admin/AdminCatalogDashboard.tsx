'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  PackagePlus,
  Phone,
  RefreshCw,
  ShieldCheck,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type AdminRole = 'super_admin' | 'admin';
type AdminType = 'iptv' | 'catalog' | 'movies';
type ListingCondition = 'new' | 'used' | 'refurbished';
type InquiryStatus = 'new' | 'contacted' | 'sold' | 'closed';

interface AdminCatalogDashboardProps {
  admin: {
    id: string;
    role: AdminRole;
    adminType: AdminType | null;
    name: string;
    email: string | null;
    phone: string | null;
    referralCode: string | null;
  };
}

interface CatalogListing {
  id: string;
  adminId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  priceKes: number | null;
  images: string[];
  condition: ListingCondition;
  isAvailable: boolean;
  trackingCode: string;
  trackingUrl: string;
  clickCount: number;
  inquiryCount: number;
  createdAt: string;
}

interface CatalogInquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  message: string | null;
  status: InquiryStatus;
  adminNotes: string | null;
  createdAt: string;
}

type View = 'listings' | 'inquiries';

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  sold: 'Sold',
  closed: 'Closed',
};

const STATUS_COLORS: Record<InquiryStatus, string> = {
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  sold: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }, []);
  return { copiedKey, copy };
}

function CopyButton({ text, label, copyKey }: { text: string; label: string; copyKey: string }) {
  const { copiedKey, copy } = useCopy();
  const copied = copiedKey === copyKey;
  return (
    <button
      onClick={() => copy(text, copyKey)}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? 'Copied!' : label}
    </button>
  );
}

export default function AdminCatalogDashboard({ admin }: AdminCatalogDashboardProps) {
  const isSuperAdmin = admin.role === 'super_admin';
  const [view, setView] = useState<View>('listings');
  const [listings, setListings] = useState<CatalogListing[]>([]);
  const [inquiries, setInquiries] = useState<CatalogInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add listing form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCondition, setFormCondition] = useState<ListingCondition>('new');
  const [formImages, setFormImages] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Inquiry expansion
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
  const [updatingInquiry, setUpdatingInquiry] = useState<string | null>(null);

  // Listing details expansion
  const [expandedListing, setExpandedListing] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, inqRes] = await Promise.all([
        fetch('/api/admin/catalog/listings'),
        fetch('/api/admin/catalog/inquiries'),
      ]);
      if (!listRes.ok || !inqRes.ok) throw new Error('Failed to load data.');
      const [listData, inqData] = await Promise.all([listRes.json(), inqRes.json()]);
      setListings(listData.listings ?? []);
      setInquiries(inqData.inquiries ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSignOut() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  async function handleAddListing(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      const images = formImages
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);
      const res = await fetch('/api/admin/catalog/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          category: formCategory || 'general',
          priceKes: formPrice ? parseFloat(formPrice) : null,
          condition: formCondition,
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? 'Failed to create listing.');
        return;
      }
      setListings((prev) => [data.listing, ...prev]);
      setShowAddForm(false);
      setFormTitle('');
      setFormDescription('');
      setFormCategory('');
      setFormPrice('');
      setFormImages('');
      setFormCondition('new');
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDeleteListing(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/catalog/listings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
  }

  async function handleToggleAvailability(listing: CatalogListing) {
    const res = await fetch(`/api/admin/catalog/listings/${listing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !listing.isAvailable }),
    });
    if (res.ok) {
      const { listing: updated } = await res.json();
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    }
  }

  async function handleUpdateInquiryStatus(id: string, status: InquiryStatus) {
    setUpdatingInquiry(id);
    const res = await fetch(`/api/admin/catalog/inquiries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
      );
    }
    setUpdatingInquiry(null);
  }

  const totalClicks = listings.reduce((sum, l) => sum + l.clickCount, 0);
  const totalInquiries = listings.reduce((sum, l) => sum + l.inquiryCount, 0);
  const newInquiries = inquiries.filter((i) => i.status === 'new').length;

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0d0f1a]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">
                {isSuperAdmin ? 'Super Admin' : 'Catalog Admin'}
              </p>
              <p className="font-semibold text-sm">{admin.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Listings', value: listings.length, icon: Package, color: 'text-violet-400' },
            { label: 'Total Clicks', value: totalClicks, icon: TrendingUp, color: 'text-blue-400' },
            { label: 'Inquiries', value: totalInquiries, icon: MessageSquare, color: 'text-yellow-400' },
            { label: 'New Leads', value: newInquiries, icon: AlertCircle, color: 'text-emerald-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex gap-2">
          {(['listings', 'inquiries'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                view === v
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {v === 'inquiries' && newInquiries > 0 ? (
                <span className="flex items-center gap-2">
                  Inquiries
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newInquiries}
                  </span>
                </span>
              ) : (
                v.charAt(0).toUpperCase() + v.slice(1)
              )}
            </button>
          ))}
          {view === 'listings' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
            >
              <PackagePlus className="w-4 h-4" />
              Add Listing
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          </div>
        )}

        {/* ── Listings View ─────────────────────────────────────────────── */}
        {!loading && view === 'listings' && (
          <div className="space-y-4">
            {listings.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No listings yet. Add your first product above.</p>
              </div>
            )}
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-violet-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{listing.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          listing.isAvailable
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {listing.isAvailable ? 'Available' : 'Unlisted'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-300 capitalize">
                        {listing.condition}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{listing.category}</p>
                    {listing.priceKes !== null && (
                      <p className="text-sm font-medium text-violet-300 mt-1">
                        KSh {listing.priceKes.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-300">{listing.clickCount}</p>
                      <p className="text-xs text-slate-500">clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-300">{listing.inquiryCount}</p>
                      <p className="text-xs text-slate-500">inquiries</p>
                    </div>
                  </div>
                </div>

                {/* Tracking link */}
                <div className="mt-3 flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                  <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <code className="text-xs text-slate-300 flex-1 truncate">{listing.trackingUrl}</code>
                  <CopyButton
                    text={listing.trackingUrl}
                    label="Copy link"
                    copyKey={`url-${listing.id}`}
                  />
                  <a
                    href={listing.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setExpandedListing(expandedListing === listing.id ? null : listing.id)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {expandedListing === listing.id ? 'Hide details' : 'Details'}
                  </button>
                  <button
                    onClick={() => handleToggleAvailability(listing)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    {listing.isAvailable ? 'Unlist' : 'Re-list'}
                  </button>
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>

                {/* Expanded details */}
                {expandedListing === listing.id && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    {listing.description && (
                      <p className="text-sm text-slate-300">{listing.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        Tracking code: <code className="text-slate-300">{listing.trackingCode}</code>
                      </span>
                      <CopyButton
                        text={listing.trackingCode}
                        label="Copy code"
                        copyKey={`code-${listing.id}`}
                      />
                    </div>
                    {listing.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {listing.images.slice(0, 4).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg border border-white/10"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Inquiries View ────────────────────────────────────────────── */}
        {!loading && view === 'inquiries' && (
          <div className="space-y-3">
            {inquiries.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No inquiries yet. Share your tracking links to get started.</p>
              </div>
            )}
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-violet-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{inq.buyerName}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[inq.status]}`}
                      >
                        {STATUS_LABELS[inq.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Re: <span className="text-slate-300">{inq.listingTitle}</span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 shrink-0">
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Contact */}
                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  <a
                    href={`tel:${inq.buyerPhone}`}
                    className="flex items-center gap-1.5 text-sm text-emerald-300 hover:text-emerald-200"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {inq.buyerPhone}
                  </a>
                  {inq.buyerEmail && (
                    <a
                      href={`mailto:${inq.buyerEmail}`}
                      className="text-sm text-blue-300 hover:text-blue-200"
                    >
                      {inq.buyerEmail}
                    </a>
                  )}
                  <CopyButton
                    text={inq.buyerPhone}
                    label="Copy phone"
                    copyKey={`phone-${inq.id}`}
                  />
                </div>

                {inq.message && (
                  <p className="mt-2 text-sm text-slate-300 bg-black/20 rounded-lg px-3 py-2">
                    &ldquo;{inq.message}&rdquo;
                  </p>
                )}

                {/* Status actions */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {updatingInquiry === inq.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    (['new', 'contacted', 'sold', 'closed'] as InquiryStatus[])
                      .filter((s) => s !== inq.status)
                      .map((s) => (
                        <button
                          key={s}
                          onClick={() => handleUpdateInquiryStatus(inq.id, s)}
                          className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                        >
                          Mark {STATUS_LABELS[s]}
                        </button>
                      ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Listing Modal ──────────────────────────────────────────── */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13152a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Add Product Listing</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddListing} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Product Title *</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. PS5 Console Bundle"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the product..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <input
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Gaming, Electronics"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Price (KSh)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="89000"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Condition</label>
                <select
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value as ListingCondition)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Image URLs <span className="text-slate-600">(one per line)</span>
                </label>
                <textarea
                  value={formImages}
                  onChange={(e) => setFormImages(e.target.value)}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 border-white/20 text-slate-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 bg-violet-600 hover:bg-violet-500"
                >
                  {formSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Listing'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
