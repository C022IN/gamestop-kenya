'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { StorefrontKind } from '@/lib/storefront-types';
import {
  Boxes,
  Check,
  ChevronRight,
  Database,
  ExternalLink,
  Gamepad2,
  Gift,
  Globe,
  ImageUp,
  Info,
  Loader2,
  LogOut,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';

type AdminRole = 'super_admin' | 'admin';
type ImageAspect = 'portrait' | 'card' | 'wide';
type ImageFit = 'cover' | 'contain';
type DashTab = 'media' | 'product' | 'seo';

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
  catalog: {
    syncedToBackend: boolean;
    sku: string;
    lastSeedSyncAt?: string;
    orderCount: number;
    unitsSold: number;
    revenueKes: number;
    lastSoldAt?: string;
  };
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

interface ProductFormState {
  title: string;
  description: string;
  platform: string;
  priceKes: string;
  originalPriceKes: string;
  inStock: boolean;
  stockQuantity: string;
}

interface SeoFormState {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
  canonicalSlug: string;
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

function defaultProductForm(): ProductFormState {
  return {
    title: '',
    description: '',
    platform: '',
    priceKes: '',
    originalPriceKes: '',
    inStock: true,
    stockQuantity: '',
  };
}

function defaultSeoForm(): SeoFormState {
  return {
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    ogImage: '',
    canonicalSlug: '',
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

function toProductForm(product: CatalogMediaProduct): ProductFormState {
  return {
    title: product.title ?? '',
    description: '',
    platform: product.platform ?? '',
    priceKes: product.price > 0 ? String(product.price) : '',
    originalPriceKes: product.originalPrice ? String(product.originalPrice) : '',
    inStock: true,
    stockQuantity: '',
  };
}

function formatKes(amount: number) {
  return `KSh ${amount.toLocaleString()}`;
}

const INPUT_CLS =
  'w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none';
const LABEL_CLS = 'text-sm font-semibold text-white';
const SECTION_CLS = 'rounded-2xl border border-white/10 bg-white/5 p-5';

export default function AdminCatalogMediaDashboard({ admin }: AdminCatalogMediaDashboardProps) {
  const [products, setProducts] = useState<CatalogMediaProduct[]>([]);
  const [hasSupabase, setHasSupabase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | StorefrontKind>('all');
  const [selectedId, setSelectedId] = useState('');
  const [activeTab, setActiveTab] = useState<DashTab>('media');

  // Media tab state
  const [form, setForm] = useState<MediaFormState>(defaultFormState());
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Product tab state
  const [productForm, setProductForm] = useState<ProductFormState>(defaultProductForm());
  const [savingProduct, setSavingProduct] = useState(false);

  // SEO tab state
  const [seoForm, setSeoForm] = useState<SeoFormState>(defaultSeoForm());
  const [savingSeo, setSavingSeo] = useState(false);

  // Probe state
  const [probeUrl, setProbeUrl] = useState('');
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<null | {
    title: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogImage: string;
    sourceUrl: string;
  }>(null);
  const [probeStructured, setProbeStructured] = useState<null | {
    price?: number;
    platform?: string;
    images?: string[];
  }>(null);
  const [probeError, setProbeError] = useState('');

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
      if (!res.ok) throw new Error(data.error ?? 'Could not load catalog media.');

      const nextProducts = Array.isArray(data.products)
        ? (data.products as CatalogMediaProduct[])
        : [];
      setHasSupabase(Boolean(data.hasSupabase));
      setProducts(nextProducts);

      const nextSelectedId =
        preferredId && nextProducts.some((p) => p.id === preferredId)
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
    return products.filter((p) => {
      const matchesKind = kindFilter === 'all' || p.kind === kindFilter;
      const matchesQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.platform?.toLowerCase().includes(query);
      return matchesKind && matchesQuery;
    });
  }, [kindFilter, products, search]);

  const selectedProduct = useMemo(
    () => filteredProducts.find((p) => p.id === selectedId) ?? filteredProducts[0] ?? null,
    [filteredProducts, selectedId]
  );

  const catalogSummary = useMemo(
    () =>
      products.reduce(
        (s, p) => {
          s.syncedProducts += p.catalog.syncedToBackend ? 1 : 0;
          s.productsSold += p.catalog.unitsSold > 0 ? 1 : 0;
          s.unitsSold += p.catalog.unitsSold;
          s.revenueKes += p.catalog.revenueKes;
          return s;
        },
        { syncedProducts: 0, productsSold: 0, unitsSold: 0, revenueKes: 0 }
      ),
    [products]
  );

  useEffect(() => {
    if (!filteredProducts.length) {
      setSelectedId('');
      setForm(defaultFormState());
      setProductForm(defaultProductForm());
      setSeoForm(defaultSeoForm());
      return;
    }

    const next = filteredProducts.find((p) => p.id === selectedId) ?? filteredProducts[0];
    if (!next) return;

    if (next.id !== selectedId) setSelectedId(next.id);
    setForm(toFormState(next));
    setProductForm(toProductForm(next));
    setSeoForm(defaultSeoForm());
    setProbeResult(null);
    setProbeStructured(null);
    setProbeError('');
    setProbeUrl('');
  }, [filteredProducts, selectedId]);

  const clearMessages = () => {
    setError('');
    setStatus('');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/admin/login';
    }
  };

  // ── Media save/clear ──────────────────────────────────────────────────────

  const handleSaveMedia = async () => {
    if (!selectedProduct || !hasSupabase) return;
    setSaving(true);
    clearMessages();

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
            .map((v) => v.trim())
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
      if (!res.ok) throw new Error(data.error ?? 'Could not save catalog media.');

      setProducts(Array.isArray(data.products) ? (data.products as CatalogMediaProduct[]) : []);
      setStatus(`Media saved for ${selectedProduct.title}.`);
      setSelectedId(selectedProduct.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save catalog media.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearMedia = async () => {
    if (!selectedProduct || !hasSupabase) return;
    setRemoving(true);
    clearMessages();

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
      if (!res.ok) throw new Error(data.error ?? 'Could not clear catalog media.');

      setProducts(Array.isArray(data.products) ? (data.products as CatalogMediaProduct[]) : []);
      setStatus(`Reverted ${selectedProduct.title} to local fallback art.`);
      setSelectedId(selectedProduct.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear catalog media.');
    } finally {
      setRemoving(false);
    }
  };

  // ── Product info save ──────────────────────────────────────────────────────

  const handleSaveProduct = async () => {
    if (!selectedProduct || !hasSupabase) return;
    setSavingProduct(true);
    clearMessages();

    try {
      const res = await fetch(`/api/admin/catalog/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: productForm.title || undefined,
          description: productForm.description || undefined,
          platform: productForm.platform || undefined,
          priceKes: productForm.priceKes ? parseFloat(productForm.priceKes) : undefined,
          originalPriceKes: productForm.originalPriceKes
            ? parseFloat(productForm.originalPriceKes)
            : null,
          inStock: productForm.inStock,
          stockQuantity: productForm.stockQuantity
            ? parseInt(productForm.stockQuantity)
            : null,
        }),
      });

      if (res.status === 401) {
        window.location.href = '/admin/login?next=/admin/catalog';
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not update product.');

      setStatus(`Product info saved for ${selectedProduct.title}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update product.');
    } finally {
      setSavingProduct(false);
    }
  };

  // ── SEO save ──────────────────────────────────────────────────────────────

  const handleSaveSeo = async () => {
    if (!selectedProduct || !hasSupabase) return;
    setSavingSeo(true);
    clearMessages();

    try {
      const res = await fetch(`/api/admin/catalog/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seo: {
            metaTitle: seoForm.metaTitle || undefined,
            metaDescription: seoForm.metaDescription || undefined,
            keywords: seoForm.keywords || undefined,
            ogImage: seoForm.ogImage || undefined,
            canonicalSlug: seoForm.canonicalSlug || undefined,
          },
        }),
      });

      if (res.status === 401) {
        window.location.href = '/admin/login?next=/admin/catalog';
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save SEO data.');

      setStatus(`SEO data saved for ${selectedProduct.title}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save SEO data.');
    } finally {
      setSavingSeo(false);
    }
  };

  // ── Probe ─────────────────────────────────────────────────────────────────

  const handleProbe = async () => {
    if (!probeUrl.trim()) return;
    setProbing(true);
    setProbeError('');
    setProbeResult(null);
    setProbeStructured(null);

    try {
      const res = await fetch('/api/admin/catalog/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: probeUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProbeError(data.error ?? 'Probe failed.');
        return;
      }

      setProbeResult(data.result ?? null);
      setProbeStructured(data.structured ?? null);
    } catch (err) {
      setProbeError(err instanceof Error ? err.message : 'Probe failed.');
    } finally {
      setProbing(false);
    }
  };

  const applyProbeToProduct = () => {
    if (!probeResult) return;
    setProductForm((prev) => ({
      ...prev,
      title: probeResult.title || prev.title,
      description: probeResult.description || prev.description,
      platform: probeStructured?.platform || prev.platform,
      priceKes: probeStructured?.price ? String(probeStructured.price) : prev.priceKes,
    }));
    setSeoForm({
      metaTitle: probeResult.metaTitle || probeResult.title,
      metaDescription: probeResult.metaDescription || probeResult.description,
      keywords: probeResult.keywords,
      ogImage: probeResult.ogImage,
      canonicalSlug: '',
    });
    if (probeResult.sourceUrl && !form.sourceUrl) {
      setForm((prev) => ({ ...prev, sourceUrl: probeResult!.sourceUrl }));
    }
    if (probeResult.ogImage && !form.primaryImageUrl) {
      setForm((prev) => ({ ...prev, primaryImageUrl: probeResult!.ogImage }));
    }
    setActiveTab('product');
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  const TABS: { id: DashTab; label: string; Icon: React.ElementType }[] = [
    { id: 'media', label: 'Media & Art', Icon: ImageUp },
    { id: 'product', label: 'Product Info', Icon: Info },
    { id: 'seo', label: 'SEO', Icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Catalog Ops
            </p>
            <h1 className="mt-2 text-3xl font-black">Catalog media &amp; product editor</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Manage storefront art, product details, and SEO. Use Firecrawl to auto-populate
              content from any product page.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Signed in as {admin.name}
              {admin.email ? ` · ${admin.email}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/admin/iptv">IPTV Ops</Link>
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
              {loggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats bar */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className={SECTION_CLS}>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
              <ImageUp className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Catalog scope</p>
            <p className="mt-2 text-2xl font-black">{products.length.toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-300">
              {catalogSummary.productsSold} sold products ·{' '}
              {catalogSummary.unitsSold.toLocaleString()} units
            </p>
          </div>
          <div className={SECTION_CLS}>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <Database className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Backend sync</p>
            <p className="mt-2 text-2xl font-black">
              {hasSupabase ? `${catalogSummary.syncedProducts} synced` : 'Read-only'}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {hasSupabase
                ? 'Products mirrored into Supabase.'
                : 'Browse only — Supabase not configured.'}
            </p>
          </div>
          <div className={SECTION_CLS}>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Sales tracked</p>
            <p className="mt-2 text-lg font-black">
              {formatKes(catalogSummary.revenueKes)} revenue
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Sold items linked to catalog products for tracking.
            </p>
          </div>
        </div>

        {!hasSupabase && (
          <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            Supabase is not configured. You can review the catalog, but saving and backend sync
            are disabled.
          </div>
        )}

        {(error || status) && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-sm ${
              error
                ? 'border-red-400/30 bg-red-500/10 text-red-100'
                : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
            }`}
          >
            {error || status}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
          {/* Left: product list */}
          <aside className="space-y-4">
            <div className={SECTION_CLS}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, id, or platform"
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
                      kindFilter === filter.id
                        ? 'bg-red-600 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/15'
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
                  <p className="text-sm font-semibold">Products</p>
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
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="max-h-[42rem] space-y-2 overflow-y-auto p-3">
                {loading ? (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1220] p-4 text-sm text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading catalog...
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
                          <img
                            src={product.storefrontImage}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="line-clamp-2 text-sm font-semibold text-white">
                                {product.title}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                                {product.catalog.sku}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                                product.kind === 'games'
                                  ? 'bg-blue-500/15 text-blue-200'
                                  : product.kind === 'hardware'
                                    ? 'bg-emerald-500/15 text-emerald-200'
                                    : 'bg-amber-500/15 text-amber-200'
                              }`}
                            >
                              {product.kind === 'games'
                                ? 'Game'
                                : product.kind === 'hardware'
                                  ? 'HW'
                                  : 'Gift'}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                            <span>{formatKes(product.price)}</span>
                            {product.platform && <span>{product.platform}</span>}
                            <span>{product.catalog.unitsSold} sold</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
                            <span
                              className={
                                product.hasOverride ? 'text-emerald-300' : 'text-slate-500'
                              }
                            >
                              {product.hasOverride ? 'DB media' : 'Fallback'}
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

          {/* Right: editor */}
          <section className="space-y-5">
            {selectedProduct ? (
              <>
                {/* Product header card */}
                <div className={SECTION_CLS}>
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                      <img
                        src={selectedProduct.storefrontImage}
                        alt={selectedProduct.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {selectedProduct.kind === 'games' ? (
                          <Gamepad2 className="h-3.5 w-3.5" />
                        ) : selectedProduct.kind === 'hardware' ? (
                          <Boxes className="h-3.5 w-3.5" />
                        ) : (
                          <Gift className="h-3.5 w-3.5" />
                        )}
                        {selectedProduct.platform ?? selectedProduct.kind}
                        <ChevronRight className="h-3 w-3" />
                        <span>{selectedProduct.catalog.sku}</span>
                      </div>
                      <h2 className="mt-1 text-xl font-black leading-tight">
                        {selectedProduct.title}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                          {formatKes(selectedProduct.price)}
                        </span>
                        {selectedProduct.originalPrice && (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-400 line-through">
                            {formatKes(selectedProduct.originalPrice)}
                          </span>
                        )}
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
                          {selectedProduct.catalog.unitsSold} units sold
                        </span>
                        <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-200">
                          {selectedProduct.catalog.orderCount} orders
                        </span>
                        {selectedProduct.catalog.lastSoldAt && (
                          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-violet-200">
                            Last sold{' '}
                            {new Date(selectedProduct.catalog.lastSoldAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Firecrawl probe panel */}
                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-300" />
                    <p className="text-sm font-semibold text-violet-200">
                      Firecrawl — Auto-populate from URL
                    </p>
                  </div>
                  <p className="mb-4 text-xs text-slate-400">
                    Paste any product page URL (PlayStation Store, Amazon, etc.) and Firecrawl
                    will extract the title, description, price, images, and SEO data. Review the
                    result, then click &ldquo;Apply to fields&rdquo; to prefill all tabs.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={probeUrl}
                      onChange={(e) => setProbeUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleProbe()}
                      placeholder="https://store.playstation.com/..."
                      className="flex-1 rounded-xl border border-violet-500/30 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none"
                    />
                    <Button
                      type="button"
                      disabled={probing || !probeUrl.trim()}
                      onClick={handleProbe}
                      className="shrink-0 bg-violet-600 hover:bg-violet-700"
                    >
                      {probing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span className="ml-2">{probing ? 'Fetching…' : 'Fetch'}</span>
                    </Button>
                  </div>

                  {probeError && (
                    <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
                      {probeError}
                    </p>
                  )}

                  {probeResult && (
                    <div className="mt-4 space-y-3 rounded-xl border border-violet-500/20 bg-black/20 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                          Fetched result
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={applyProbeToProduct}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          Apply to fields
                        </Button>
                      </div>
                      {probeResult.title && (
                        <div>
                          <p className="text-xs text-slate-500">Title</p>
                          <p className="text-sm font-semibold text-white">{probeResult.title}</p>
                        </div>
                      )}
                      {probeResult.description && (
                        <div>
                          <p className="text-xs text-slate-500">Description</p>
                          <p className="line-clamp-3 text-sm text-slate-200">
                            {probeResult.description}
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs">
                        {probeStructured?.price && (
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
                            Price: {formatKes(probeStructured.price)}
                          </span>
                        )}
                        {probeStructured?.platform && (
                          <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-200">
                            Platform: {probeStructured.platform}
                          </span>
                        )}
                        {probeResult.ogImage && (
                          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-violet-200">
                            OG image found
                          </span>
                        )}
                        {probeResult.keywords && (
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">
                            Keywords found
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tab bar */}
                <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
                  {TABS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                        activeTab === id
                          ? 'bg-red-600 text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── Tab: Media & Art ────────────────────────────────── */}
                {activeTab === 'media' && (
                  <>
                    <div className={SECTION_CLS}>
                      <p className="mb-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                        Art preview
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                            Fallback art
                          </p>
                          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                            <img
                              src={selectedProduct.fallbackImage}
                              alt={`${selectedProduct.title} fallback`}
                              className="aspect-[4/5] w-full object-contain"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                            Managed storefront art
                          </p>
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
                      {selectedProduct.media.sourceUrl && (
                        <a
                          href={selectedProduct.media.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-sky-300 hover:bg-white/5"
                        >
                          View current source <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    <div className={SECTION_CLS}>
                      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                            Editor
                          </p>
                          <h2 className="mt-1 text-xl font-black">Update media</h2>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!hasSupabase || removing || saving}
                            onClick={handleClearMedia}
                            className="border-white/10 bg-transparent text-white hover:bg-white/10"
                          >
                            {removing ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Reset to fallback
                          </Button>
                          <Button
                            type="button"
                            disabled={!hasSupabase || saving || removing}
                            onClick={handleSaveMedia}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {saving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save media
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="space-y-2">
                          <span className={LABEL_CLS}>Primary image URL</span>
                          <input
                            type="text"
                            value={form.primaryImageUrl}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, primaryImageUrl: e.target.value }))
                            }
                            className={INPUT_CLS}
                            placeholder="https://cdn.example.com/product.jpg"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className={LABEL_CLS}>Alt text</span>
                          <input
                            type="text"
                            value={form.altText}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, altText: e.target.value }))
                            }
                            className={INPUT_CLS}
                            placeholder="Product alt text"
                          />
                        </label>

                        <label className="space-y-2 lg:col-span-2">
                          <span className={LABEL_CLS}>Gallery URLs</span>
                          <textarea
                            value={form.galleryText}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, galleryText: e.target.value }))
                            }
                            rows={4}
                            className={INPUT_CLS}
                            placeholder={'One URL per line.'}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className={LABEL_CLS}>Image aspect</span>
                          <select
                            value={form.imageAspect}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                imageAspect: e.target.value as ImageAspect,
                              }))
                            }
                            className={INPUT_CLS}
                          >
                            <option value="portrait">Portrait (4:5)</option>
                            <option value="card">Card (16:10)</option>
                            <option value="wide">Wide (16:9)</option>
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className={LABEL_CLS}>Image fit</span>
                          <select
                            value={form.imageFit}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, imageFit: e.target.value as ImageFit }))
                            }
                            className={INPUT_CLS}
                          >
                            <option value="cover">Cover</option>
                            <option value="contain">Contain</option>
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className={LABEL_CLS}>Object position</span>
                          <input
                            type="text"
                            value={form.imagePosition}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, imagePosition: e.target.value }))
                            }
                            className={INPUT_CLS}
                            placeholder="center top"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className={LABEL_CLS}>License type</span>
                          <select
                            value={form.licenseType}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, licenseType: e.target.value }))
                            }
                            className={INPUT_CLS}
                          >
                            <option value="official">Official</option>
                            <option value="licensed">Licensed</option>
                            <option value="owned">Owned</option>
                            <option value="distributor-provided">Distributor-provided</option>
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className={LABEL_CLS}>Source label</span>
                          <input
                            type="text"
                            value={form.sourceLabel}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, sourceLabel: e.target.value }))
                            }
                            className={INPUT_CLS}
                            placeholder="PlayStation press kit"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className={LABEL_CLS}>Source URL</span>
                          <input
                            type="text"
                            value={form.sourceUrl}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, sourceUrl: e.target.value }))
                            }
                            className={INPUT_CLS}
                            placeholder="https://..."
                          />
                        </label>

                        <label className="space-y-2">
                          <span className={LABEL_CLS}>Usage scope</span>
                          <input
                            type="text"
                            value={form.usageScope}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, usageScope: e.target.value }))
                            }
                            className={INPUT_CLS}
                            placeholder="storefront"
                          />
                        </label>

                        <label className="space-y-2 lg:col-span-2">
                          <span className={LABEL_CLS}>Notes</span>
                          <textarea
                            value={form.notes}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, notes: e.target.value }))
                            }
                            rows={3}
                            className={INPUT_CLS}
                            placeholder="Crop rules, region variants, license notes…"
                          />
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Tab: Product Info ───────────────────────────────── */}
                {activeTab === 'product' && (
                  <div className={SECTION_CLS}>
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                          Core details
                        </p>
                        <h2 className="mt-1 text-xl font-black">Product info</h2>
                      </div>
                      <Button
                        type="button"
                        disabled={!hasSupabase || savingProduct}
                        onClick={handleSaveProduct}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {savingProduct ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save info
                      </Button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="space-y-2 lg:col-span-2">
                        <span className={LABEL_CLS}>Title</span>
                        <input
                          type="text"
                          value={productForm.title}
                          onChange={(e) =>
                            setProductForm((p) => ({ ...p, title: e.target.value }))
                          }
                          className={INPUT_CLS}
                          placeholder="e.g. PlayStation 5 Console"
                        />
                      </label>

                      <label className="space-y-2 lg:col-span-2">
                        <span className={LABEL_CLS}>Description</span>
                        <textarea
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm((p) => ({ ...p, description: e.target.value }))
                          }
                          rows={4}
                          className={INPUT_CLS}
                          placeholder="Storefront description shown to buyers…"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className={LABEL_CLS}>Platform</span>
                        <input
                          type="text"
                          value={productForm.platform}
                          onChange={(e) =>
                            setProductForm((p) => ({ ...p, platform: e.target.value }))
                          }
                          className={INPUT_CLS}
                          placeholder="PS5, Xbox Series X, Nintendo Switch…"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className={LABEL_CLS}>Price (KES)</span>
                        <input
                          type="number"
                          value={productForm.priceKes}
                          onChange={(e) =>
                            setProductForm((p) => ({ ...p, priceKes: e.target.value }))
                          }
                          className={INPUT_CLS}
                          placeholder="79000"
                          min="0"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className={LABEL_CLS}>Original price (KES)</span>
                        <input
                          type="number"
                          value={productForm.originalPriceKes}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              originalPriceKes: e.target.value,
                            }))
                          }
                          className={INPUT_CLS}
                          placeholder="89000 (leave blank to clear)"
                          min="0"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className={LABEL_CLS}>Stock quantity</span>
                        <input
                          type="number"
                          value={productForm.stockQuantity}
                          onChange={(e) =>
                            setProductForm((p) => ({ ...p, stockQuantity: e.target.value }))
                          }
                          className={INPUT_CLS}
                          placeholder="Leave blank to keep unchanged"
                          min="0"
                        />
                      </label>

                      <div className="space-y-2">
                        <span className={LABEL_CLS}>Availability</span>
                        <div className="flex gap-3 pt-1">
                          {[
                            { value: true, label: 'In stock' },
                            { value: false, label: 'Out of stock' },
                          ].map((opt) => (
                            <button
                              key={String(opt.value)}
                              type="button"
                              onClick={() =>
                                setProductForm((p) => ({ ...p, inStock: opt.value }))
                              }
                              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                                productForm.inStock === opt.value
                                  ? opt.value
                                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                                    : 'border-red-500/50 bg-red-500/15 text-red-200'
                                  : 'border-white/10 bg-transparent text-slate-400 hover:bg-white/5'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Tab: SEO ────────────────────────────────────────── */}
                {activeTab === 'seo' && (
                  <div className={SECTION_CLS}>
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-sky-300" />
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                            Search engine
                          </p>
                        </div>
                        <h2 className="mt-1 text-xl font-black">SEO &amp; Open Graph</h2>
                      </div>
                      <Button
                        type="button"
                        disabled={!hasSupabase || savingSeo}
                        onClick={handleSaveSeo}
                        className="bg-sky-600 hover:bg-sky-700"
                      >
                        {savingSeo ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save SEO
                      </Button>
                    </div>

                    <div className="mb-5 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs text-sky-200">
                      Use Firecrawl above to auto-populate these fields from the official product
                      page, then tweak as needed. A strong meta description (150–160 chars)
                      and focused keywords improve click-through rate.
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="space-y-2 lg:col-span-2">
                        <span className={LABEL_CLS}>Meta title</span>
                        <input
                          type="text"
                          value={seoForm.metaTitle}
                          onChange={(e) =>
                            setSeoForm((p) => ({ ...p, metaTitle: e.target.value }))
                          }
                          className={INPUT_CLS}
                          placeholder="PlayStation 5 — Buy PS5 in Kenya | GameStop Kenya"
                          maxLength={70}
                        />
                        <p className="text-xs text-slate-500">
                          {seoForm.metaTitle.length}/70 chars — aim for 50–60
                        </p>
                      </label>

                      <label className="space-y-2 lg:col-span-2">
                        <span className={LABEL_CLS}>Meta description</span>
                        <textarea
                          value={seoForm.metaDescription}
                          onChange={(e) =>
                            setSeoForm((p) => ({ ...p, metaDescription: e.target.value }))
                          }
                          rows={3}
                          className={INPUT_CLS}
                          placeholder="Buy the PS5 at the best price in Kenya. Fast delivery, official warranty. Shop GameStop Kenya today."
                          maxLength={160}
                        />
                        <p className="text-xs text-slate-500">
                          {seoForm.metaDescription.length}/160 chars — aim for 150–160
                        </p>
                      </label>

                      <label className="space-y-2 lg:col-span-2">
                        <span className={LABEL_CLS}>Keywords</span>
                        <input
                          type="text"
                          value={seoForm.keywords}
                          onChange={(e) =>
                            setSeoForm((p) => ({ ...p, keywords: e.target.value }))
                          }
                          className={INPUT_CLS}
                          placeholder="ps5 kenya, buy ps5 nairobi, playstation 5 price kenya"
                        />
                        <p className="text-xs text-slate-500">Comma-separated</p>
                      </label>

                      <label className="space-y-2 lg:col-span-2">
                        <span className={LABEL_CLS}>OG image URL</span>
                        <input
                          type="text"
                          value={seoForm.ogImage}
                          onChange={(e) =>
                            setSeoForm((p) => ({ ...p, ogImage: e.target.value }))
                          }
                          className={INPUT_CLS}
                          placeholder="https://... (shown when shared on social media)"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className={LABEL_CLS}>Canonical slug</span>
                        <input
                          type="text"
                          value={seoForm.canonicalSlug}
                          onChange={(e) =>
                            setSeoForm((p) => ({ ...p, canonicalSlug: e.target.value }))
                          }
                          className={INPUT_CLS}
                          placeholder="playstation-5-console"
                        />
                        <p className="text-xs text-slate-500">
                          Lowercase, hyphens only. Leave blank to keep the auto-generated slug.
                        </p>
                      </label>

                      {seoForm.ogImage && (
                        <div className="space-y-2">
                          <p className={LABEL_CLS}>OG image preview</p>
                          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]">
                            <img
                              src={seoForm.ogImage}
                              alt="OG preview"
                              className="aspect-[16/9] w-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-400">
                Select a storefront product to manage its media, product info, and SEO.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
