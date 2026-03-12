'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { StorefrontKind } from '@/lib/storefront-types';
import {
  Boxes,
  Database,
  ExternalLink,
  Gamepad2,
  Gift,
  ImageUp,
  Loader2,
  LogOut,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

type AdminRole = 'super_admin' | 'admin';
type ImageAspect = 'portrait' | 'card' | 'wide';
type ImageFit = 'cover' | 'contain';

interface AdminCatalogMediaDashboardProps {
  admin: {
    id: string;
    role: AdminRole;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

interface CatalogMediaProduct {
  id: string;
  kind: StorefrontKind;
  title: string;
  platform?: string;
  price: number;
  originalPrice?: number;
  isDigital?: boolean;
  fallbackImage: string;
  storefrontImage: string;
  hasOverride: boolean;
  media: {
    primaryImageUrl: string | null;
    gallery: string[];
    altText: string;
    imageAspect?: ImageAspect;
    imageFit?: ImageFit;
    imagePosition?: string;
    licenseType?: string;
    sourceLabel?: string;
    sourceUrl?: string;
    usageScope?: string;
    notes?: string;
    lastSyncedAt?: string;
  };
}

interface MediaFormState {
  primaryImageUrl: string;
  galleryText: string;
  altText: string;
  imageAspect: ImageAspect;
  imageFit: ImageFit;
  imagePosition: string;
  licenseType: string;
  sourceLabel: string;
  sourceUrl: string;
  usageScope: string;
  notes: string;
}

function defaultFormState(): MediaFormState {
  return {
    primaryImageUrl: '',
    galleryText: '',
    altText: '',
    imageAspect: 'portrait',
    imageFit: 'cover',
    imagePosition: 'center',
    licenseType: 'official',
    sourceLabel: '',
    sourceUrl: '',
    usageScope: 'storefront',
    notes: '',
  };
}

function defaultAspectForKind(kind: StorefrontKind): ImageAspect {
  return kind === 'games' ? 'portrait' : 'card';
}

function defaultFitForKind(kind: StorefrontKind): ImageFit {
  return kind === 'gift-cards' ? 'contain' : 'cover';
}

function toFormState(product: CatalogMediaProduct): MediaFormState {
  return {
    primaryImageUrl: product.media.primaryImageUrl ?? '',
    galleryText: product.media.gallery.join('\n'),
    altText: product.media.altText,
    imageAspect: product.media.imageAspect ?? defaultAspectForKind(product.kind),
    imageFit: product.media.imageFit ?? defaultFitForKind(product.kind),
    imagePosition: product.media.imagePosition ?? 'center',
    licenseType: product.media.licenseType ?? 'official',
    sourceLabel: product.media.sourceLabel ?? '',
    sourceUrl: product.media.sourceUrl ?? '',
    usageScope: product.media.usageScope ?? 'storefront',
    notes: product.media.notes ?? '',
  };
}

function formatKes(amount: number) {
  return `KSh ${amount.toLocaleString()}`;
}

export default function AdminCatalogMediaDashboard({ admin }: AdminCatalogMediaDashboardProps) {
  const [products, setProducts] = useState<CatalogMediaProduct[]>([]);
  const [hasSupabase, setHasSupabase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | StorefrontKind>('all');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<MediaFormState>(defaultFormState());

  const loadCatalog = async (preferredId?: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/catalog/media', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/admin/login?next=/admin/catalog';
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load catalog media.');
      }

      const nextProducts = Array.isArray(data.products) ? (data.products as CatalogMediaProduct[]) : [];
      setHasSupabase(Boolean(data.hasSupabase));
      setProducts(nextProducts);

      const nextSelectedId =
        preferredId && nextProducts.some((product) => product.id === preferredId)
          ? preferredId
          : nextProducts[0]?.id ?? '';
      setSelectedId(nextSelectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load catalog media.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesKind = kindFilter === 'all' || product.kind === kindFilter;
      const matchesQuery =
        !query ||
        product.title.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query) ||
        product.platform?.toLowerCase().includes(query);
      return matchesKind && matchesQuery;
    });
  }, [kindFilter, products, search]);

  const selectedProduct = useMemo(() => {
    return filteredProducts.find((product) => product.id === selectedId) ?? filteredProducts[0] ?? null;
  }, [filteredProducts, selectedId]);

  useEffect(() => {
    if (!filteredProducts.length) {
      setSelectedId('');
      setForm(defaultFormState());
      return;
    }

    const nextSelected = filteredProducts.find((product) => product.id === selectedId) ?? filteredProducts[0];
    if (!nextSelected) {
      return;
    }

    if (nextSelected.id !== selectedId) {
      setSelectedId(nextSelected.id);
    }

    setForm(toFormState(nextSelected));
  }, [filteredProducts, selectedId]);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/admin/login';
    }
  };

  const handleSave = async () => {
    if (!selectedProduct || !hasSupabase) {
      return;
    }

    setSaving(true);
    setError('');
    setStatus('');

    try {
      const res = await fetch('/api/admin/catalog/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          kind: selectedProduct.kind,
          primaryImageUrl: form.primaryImageUrl,
          galleryUrls: form.galleryText
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean),
          altText: form.altText,
          imageAspect: form.imageAspect,
          imageFit: form.imageFit,
          imagePosition: form.imagePosition,
          licenseType: form.licenseType,
          sourceLabel: form.sourceLabel,
          sourceUrl: form.sourceUrl,
          usageScope: form.usageScope,
          notes: form.notes,
        }),
      });

      if (res.status === 401) {
        window.location.href = '/admin/login?next=/admin/catalog';
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not save catalog media.');
      }

      setProducts(Array.isArray(data.products) ? (data.products as CatalogMediaProduct[]) : []);
      setStatus(`Saved licensed media for ${selectedProduct.title}.`);
      setSelectedId(selectedProduct.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save catalog media.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!selectedProduct || !hasSupabase) {
      return;
    }

    setRemoving(true);
    setError('');
    setStatus('');

    try {
      const res = await fetch('/api/admin/catalog/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProduct.id }),
      });

      if (res.status === 401) {
        window.location.href = '/admin/login?next=/admin/catalog';
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not clear catalog media.');
      }

      setProducts(Array.isArray(data.products) ? (data.products as CatalogMediaProduct[]) : []);
      setStatus(`Reverted ${selectedProduct.title} to local fallback art.`);
      setSelectedId(selectedProduct.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear catalog media.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="border-b border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Catalog Media Ops</p>
            <h1 className="mt-2 text-3xl font-black">Licensed product imagery</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Save approved game, hardware, and gift-card artwork into Supabase so storefront pages stop depending on placeholders.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Signed in as {admin.name}
              {admin.email ? ` | ${admin.email}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10">
              <Link href="/admin/iptv">
                IPTV Ops
              </Link>
            </Button>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/admin/catalog">Catalog Media</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loggingOut}
              onClick={handleLogout}
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
            >
              {loggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
              <ImageUp className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Managed scope</p>
            <p className="mt-2 text-2xl font-black">{products.length.toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-300">Storefront products ready for official or licensed media overrides.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <Database className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Persistence</p>
            <p className="mt-2 text-2xl font-black">{hasSupabase ? 'Supabase ready' : 'Read-only fallback'}</p>
            <p className="mt-2 text-sm text-slate-300">
              {hasSupabase
                ? 'Changes save into products and product_media, then flow into the storefront.'
                : 'Catalog browsing still works, but saving is disabled until Supabase server env is configured.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Licensing rule</p>
            <p className="mt-2 text-lg font-black">Use approved assets only</p>
            <p className="mt-2 text-sm text-slate-300">
              Save URLs for official brand art, distributor-provided art, or owned assets. Do not ingest scraped third-party files without permission.
            </p>
          </div>
        </div>

        {!hasSupabase && (
          <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            Supabase persistence is not configured in this environment. You can review the catalog and prep metadata, but save and clear actions stay disabled until server credentials are present.
          </div>
        )}

        {(error || status) && (
          <div className={`mb-6 rounded-2xl border p-4 text-sm ${error ? 'border-red-400/30 bg-red-500/10 text-red-100' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'}`}>
            {error || status}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product title, id, or platform"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'games', label: 'Games' },
                  { id: 'hardware', label: 'Hardware' },
                  { id: 'gift-cards', label: 'Gift Cards' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setKindFilter(filter.id as 'all' | StorefrontKind)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${
                      kindFilter === filter.id ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Catalog products</p>
                  <p className="text-xs text-slate-400">{filteredProducts.length} visible</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => loadCatalog(selectedId)}
                  className="border-white/10 bg-transparent text-white hover:bg-white/10"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
              <div className="max-h-[42rem] space-y-2 overflow-y-auto p-3">
                {loading ? (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1220] p-4 text-sm text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading catalog media...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[#0b1220] p-4 text-sm text-slate-400">
                    No products match that filter.
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedId(product.id)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        selectedProduct?.id === product.id
                          ? 'border-red-400/50 bg-red-500/10'
                          : 'border-white/10 bg-[#0b1220] hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                          <img src={product.storefrontImage} alt={product.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="line-clamp-2 text-sm font-semibold text-white">{product.title}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{product.id}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                              product.kind === 'games'
                                ? 'bg-blue-500/15 text-blue-200'
                                : product.kind === 'hardware'
                                  ? 'bg-emerald-500/15 text-emerald-200'
                                  : 'bg-amber-500/15 text-amber-200'
                            }`}>
                              {product.kind === 'games'
                                ? 'Game'
                                : product.kind === 'hardware'
                                  ? 'Hardware'
                                  : 'Gift Card'}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                            <span>{formatKes(product.price)}</span>
                            {product.platform && <span>{product.platform}</span>}
                            {product.isDigital && <span>Digital</span>}
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
                            <span className={product.hasOverride ? 'text-emerald-300' : 'text-slate-500'}>
                              {product.hasOverride ? 'DB media active' : 'Local fallback'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            {selectedProduct ? (
              <>
                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Current preview</p>
                        <h2 className="mt-2 text-2xl font-black">{selectedProduct.title}</h2>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        {selectedProduct.kind === 'games' ? (
                          <Gamepad2 className="h-4 w-4" />
                        ) : selectedProduct.kind === 'hardware' ? (
                          <Boxes className="h-4 w-4" />
                        ) : (
                          <Gift className="h-4 w-4" />
                        )}
                        {selectedProduct.platform ?? selectedProduct.kind}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Fallback art</p>
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                          <img src={selectedProduct.fallbackImage} alt={`${selectedProduct.title} fallback`} className="aspect-[4/5] w-full object-contain" />
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Managed storefront art</p>
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                          <img
                            src={form.primaryImageUrl || selectedProduct.storefrontImage}
                            alt={form.altText || selectedProduct.title}
                            style={{ objectPosition: form.imagePosition || 'center' }}
                            className={`w-full ${
                              form.imageAspect === 'card'
                                ? 'aspect-[16/10]'
                                : form.imageAspect === 'wide'
                                  ? 'aspect-[16/9]'
                                  : 'aspect-[4/5]'
                            } ${form.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">{selectedProduct.id}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">{formatKes(selectedProduct.price)}</span>
                      {selectedProduct.originalPrice && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">Was {formatKes(selectedProduct.originalPrice)}</span>
                      )}
                      {selectedProduct.media.lastSyncedAt && (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
                          Synced {new Date(selectedProduct.media.lastSyncedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Source notes</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      <p>Use official publisher, platform, distributor, or owned asset URLs only.</p>
                      <p>Primary image URL becomes the storefront default. Gallery URLs are stored in product_media order.</p>
                      <p>Image aspect, fit, and position control how the storefront cards frame the product.</p>
                    </div>
                    {selectedProduct.media.sourceUrl && (
                      <a
                        href={selectedProduct.media.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-sky-300 hover:bg-white/5"
                      >
                        View current source <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Editor</p>
                      <h2 className="mt-2 text-2xl font-black">Save approved media metadata</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!hasSupabase || removing || saving}
                        onClick={handleClear}
                        className="border-white/10 bg-transparent text-white hover:bg-white/10"
                      >
                        {removing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Reset to fallback
                      </Button>
                      <Button
                        type="button"
                        disabled={!hasSupabase || saving || removing}
                        onClick={handleSave}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save media
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white">Primary image URL</span>
                      <input
                        type="text"
                        value={form.primaryImageUrl}
                        onChange={(event) => setForm((prev) => ({ ...prev, primaryImageUrl: event.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                        placeholder="https://cdn.example.com/assets/product-primary.jpg"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white">Alt text</span>
                      <input
                        type="text"
                        value={form.altText}
                        onChange={(event) => setForm((prev) => ({ ...prev, altText: event.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                        placeholder="Product alt text"
                      />
                    </label>

                    <label className="space-y-2 lg:col-span-2">
                      <span className="text-sm font-semibold text-white">Gallery URLs</span>
                      <textarea
                        value={form.galleryText}
                        onChange={(event) => setForm((prev) => ({ ...prev, galleryText: event.target.value }))}
                        rows={5}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                        placeholder={'One URL per line.\nInclude the primary URL on the first line if you want deterministic ordering.'}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white">Image aspect</span>
                      <select
                        value={form.imageAspect}
                        onChange={(event) => setForm((prev) => ({ ...prev, imageAspect: event.target.value as ImageAspect }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white focus:border-red-400 focus:outline-none"
                      >
                        <option value="portrait">Portrait</option>
                        <option value="card">Card</option>
                        <option value="wide">Wide</option>
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white">Image fit</span>
                      <select
                        value={form.imageFit}
                        onChange={(event) => setForm((prev) => ({ ...prev, imageFit: event.target.value as ImageFit }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white focus:border-red-400 focus:outline-none"
                      >
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white">Object position</span>
                      <input
                        type="text"
                        value={form.imagePosition}
                        onChange={(event) => setForm((prev) => ({ ...prev, imagePosition: event.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                        placeholder="center top"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white">License type</span>
                      <select
                        value={form.licenseType}
                        onChange={(event) => setForm((prev) => ({ ...prev, licenseType: event.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white focus:border-red-400 focus:outline-none"
                      >
                        <option value="official">Official</option>
                        <option value="licensed">Licensed</option>
                        <option value="owned">Owned</option>
                        <option value="distributor-provided">Distributor-provided</option>
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white">Source label</span>
                      <input
                        type="text"
                        value={form.sourceLabel}
                        onChange={(event) => setForm((prev) => ({ ...prev, sourceLabel: event.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                        placeholder="PlayStation press kit"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white">Source URL</span>
                      <input
                        type="text"
                        value={form.sourceUrl}
                        onChange={(event) => setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                        placeholder="https://..."
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white">Usage scope</span>
                      <input
                        type="text"
                        value={form.usageScope}
                        onChange={(event) => setForm((prev) => ({ ...prev, usageScope: event.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                        placeholder="storefront"
                      />
                    </label>

                    <label className="space-y-2 lg:col-span-2">
                      <span className="text-sm font-semibold text-white">Notes</span>
                      <textarea
                        value={form.notes}
                        onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                        rows={4}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                        placeholder="Any internal notes about crop rules, region variants, or proof of license."
                      />
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-400">
                Select a storefront product to manage its licensed media.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
