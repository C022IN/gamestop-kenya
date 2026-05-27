'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useStoreCurrency } from '@/domains/storefront/hooks/useStoreCurrency';
import {
  Download,
  Tv2,
  Smartphone,
  MonitorPlay,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

const REPO = 'C022IN/gamestop-kenya';
const KODI_ZIP_URL = `https://raw.githubusercontent.com/${REPO}/main/kodi-addon/plugin.video.gamestop.kenya.zip`;

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  updated_at: string;
}

interface Release {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: ReleaseAsset[];
}

async function fetchRelease(tag: string): Promise<Release | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/tags/${tag}`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface AppCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  release: Release | null | undefined;
  apkFileName?: string;
  badge?: string;
  loading?: boolean;
}

function AppCard({
  icon: Icon,
  title,
  subtitle,
  description,
  features,
  release,
  apkFileName,
  badge,
  loading,
}: AppCardProps) {
  const asset = release?.assets.find((a) =>
    apkFileName ? a.name === apkFileName : a.name.endsWith('.apk')
  );
  const downloadUrl = asset?.browser_download_url ?? null;
  const hasRelease = Boolean(release && asset);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative bg-gradient-to-br from-violet-600 to-violet-800 p-6 text-white overflow-hidden">
        {/* Background device illustration */}
        <img
          src="/images/heroes/iptv.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2 object-cover opacity-10"
        />
        <div className="relative mb-3 flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-2.5">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{title}</h3>
              {badge && (
                <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-violet-200">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-4 text-sm leading-relaxed text-gray-600">{description}</p>

        <ul className="mb-6 space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              {f}
            </li>
          ))}
        </ul>

        {loading ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking for latest build...
          </div>
        ) : hasRelease && release && asset ? (
          <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
            <div className="mb-1 font-semibold text-gray-900">{release.name}</div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span>{formatBytes(asset.size)}</span>
              <span>Updated {formatDate(asset.updated_at)}</span>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            No published build yet — trigger a build in GitHub Actions.
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2">
          {downloadUrl ? (
            <a href={downloadUrl} download>
              <Button className="w-full bg-violet-600 hover:bg-violet-700">
                <Download className="mr-2 h-4 w-4" />
                Download APK
              </Button>
            </a>
          ) : (
            <a
              href={`https://github.com/${REPO}/actions`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full border-violet-200 text-violet-700 hover:bg-violet-50">
                <GithubIcon className="mr-2 h-4 w-4" />
                Build on GitHub Actions
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DownloadsPage() {
  const { currency, toggleCurrency } = useStoreCurrency();
  const [tvRelease, setTvRelease] = useState<Release | null>(null);
  const [phoneRelease, setPhoneRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchRelease('tv-app-latest'), fetchRelease('phone-app-latest')]).then(
      ([tv, phone]) => {
        setTvRelease(tv);
        setPhoneRelease(phone);
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="bg-gradient-to-br from-gray-900 via-violet-950 to-gray-900 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold">
            <Download className="h-4 w-4" />
            Downloads
          </div>
          <h1 className="mb-4 text-4xl font-black">Get the Apps</h1>
          <p className="mx-auto max-w-xl text-lg text-gray-300">
            Install GameStop Movies on your Android TV, phone, or Kodi media center.
            All apps are free — you just need an active IPTV or Movies membership.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <AppCard
            icon={Tv2}
            title="Android TV App"
            subtitle="Fire TV · Android TV · Hisense"
            description="A native lean-back app built for big screens. Navigate with your remote, browse live TV and movies, and sign in with your member credentials."
            features={[
              'D-pad remote navigation',
              'Live TV + Movies in one app',
              'Sign in with phone + access code',
              'Works on Fire TV, Hisense, Android TV',
            ]}
            release={tvRelease}
            apkFileName="gamestop-tv.apk"
            badge="TV"
            loading={loading}
          />

          <AppCard
            icon={Smartphone}
            title="Android Phone App"
            subtitle="Android 8.0 and above"
            description="Take your content on the go. Same member hub as the TV app, optimised for portrait touchscreen use on Android smartphones."
            features={[
              'Touch-optimised portrait layout',
              'Browse and stream from anywhere',
              'M-Pesa activation supported',
              'Requires Android 8.0+',
            ]}
            release={phoneRelease}
            apkFileName="gamestop-phone.apk"
            loading={loading}
          />

          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-white/15 p-2.5">
                  <MonitorPlay className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Kodi Addon</h3>
                  <p className="text-sm text-blue-200">Kodi 19 Matrix and above</p>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                Install the GameStop Kenya addon directly inside Kodi. Works on any platform Kodi runs on — Windows, Linux, Android, Apple TV via ATV4 builds.
              </p>

              <ul className="mb-6 space-y-2">
                {[
                  'Install from ZIP — no repository needed',
                  'Stream movies and series from Kodi',
                  'Requires inputstream.adaptive addon',
                  'Sign in with phone + access code',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
                <div className="mb-1 font-semibold text-gray-900">plugin.video.gamestop.kenya</div>
                <div className="text-xs text-gray-500">Stable — always latest from main branch</div>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <a href={KODI_ZIP_URL} download="plugin.video.gamestop.kenya.zip">
                  <Button className="w-full bg-blue-700 hover:bg-blue-800">
                    <Download className="mr-2 h-4 w-4" />
                    Download ZIP
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">Installation Guides</h2>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: 'Android TV / Fire TV',
                steps: [
                  'Enable Unknown Sources in Settings → Security',
                  'Download the TV APK to a USB drive or use a file manager app',
                  'Open the APK and tap Install',
                  'Launch the app and sign in with your phone + access code',
                ],
              },
              {
                title: 'Android Phone',
                steps: [
                  'Tap the APK download link above',
                  'Allow installation from browser when prompted',
                  'Open the APK once downloaded and tap Install',
                  'Launch and sign in with your member credentials',
                ],
              },
              {
                title: 'Kodi',
                steps: [
                  'Download the ZIP file above',
                  'In Kodi: Settings → Add-ons → Install from ZIP',
                  'Navigate to the downloaded ZIP and install',
                  'Open the addon and enter phone + access code',
                ],
              },
            ].map(({ title, steps }) => (
              <div key={title} className="rounded-xl border border-gray-200 p-5">
                <h3 className="mb-4 font-bold text-gray-900">{title}</h3>
                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4 text-sm text-gray-500">
            All builds are compiled from the public source on GitHub. Latest releases are published automatically after each build.
          </p>
          <a
            href={`https://github.com/${REPO}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:underline"
          >
            <GithubIcon className="h-4 w-4" />
            View all releases on GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </section>

      <section className="bg-violet-700 py-10 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-2 text-2xl font-bold">Need an IPTV or Movies membership?</h2>
          <p className="mb-6 text-violet-200">Activate with M-Pesa in minutes.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/iptv">
              <Button className="bg-white font-bold text-violet-700 hover:bg-violet-50">
                View IPTV Plans
              </Button>
            </Link>
            <Link href="/movies/login">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                Movies Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
