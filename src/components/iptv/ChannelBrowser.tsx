'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Loader2, Radio, Tv, ChevronRight, PlayCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const HlsPlayer = dynamic(() => import('./HlsPlayer'), { ssr: false });

interface Channel {
  id: string;
  name: string;
  logoUrl: string;
  streamUrl: string;
  category: string;
  country: string;
}

interface Category {
  key: string;
  label: string;
  emoji: string;
}

interface ChannelBrowserProps {
  initialCategories: Category[];
}

function ChannelCard({
  channel,
  isActive,
  onClick,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tv-card
      data-tv-focusable="true"
      className={`group relative flex flex-col items-center gap-2 rounded-[22px] border p-3 text-center transition-all ${
        isActive
          ? 'border-violet-500 bg-violet-950/65 ring-2 ring-violet-500/35'
          : 'border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-violet-400/35 hover:bg-white/[0.08]'
      }`}
    >
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-black/40">
        {channel.logoUrl ? (
          <img
            src={channel.logoUrl}
            alt={channel.name}
            className="h-12 w-12 object-contain"
            onError={(event) => {
              (event.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <Tv className="h-6 w-6 text-white/28" />
        )}
        {isActive && (
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-black animate-pulse" />
        )}
      </div>
      <p className="line-clamp-2 text-xs font-semibold leading-tight text-white/82 group-hover:text-white">
        {channel.name}
      </p>
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/32">
        {channel.country || 'Live'}
      </p>
    </button>
  );
}

function ChannelRail({
  channels,
  activeId,
  onSelect,
}: {
  channels: Channel[];
  activeId: string | null;
  onSelect: (channel: Channel) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {channels.map((channel) => (
        <div key={channel.id + channel.streamUrl} className="w-[108px] shrink-0">
          <ChannelCard
            channel={channel}
            isActive={activeId === channel.id + channel.streamUrl}
            onClick={() => onSelect(channel)}
          />
        </div>
      ))}
    </div>
  );
}

export default function ChannelBrowser({ initialCategories }: ChannelBrowserProps) {
  const [activeCategory, setActiveCategory] = useState<string>('sports');
  const [channelCache, setChannelCache] = useState<Record<string, Channel[]>>({});
  const [loading, setLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const cacheRef = useRef<Record<string, Channel[]>>({});

  const channels = useMemo(
    () => channelCache[activeCategory] ?? [],
    [activeCategory, channelCache]
  );

  const loadCategory = useCallback(async (key: string) => {
    setActiveCategory(key);

    const cachedChannels = cacheRef.current[key];
    if (cachedChannels) {
      setActiveChannel(cachedChannels[0] ?? null);
      return;
    }

    setActiveChannel(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/iptv/live?cat=${key}&limit=60`);
      const data = await response.json();
      const nextChannels: Channel[] = data.channels ?? [];

      cacheRef.current = { ...cacheRef.current, [key]: nextChannels };
      setChannelCache((current) => ({ ...current, [key]: nextChannels }));
      setActiveChannel(nextChannels[0] ?? null);
    } catch {
      cacheRef.current = { ...cacheRef.current, [key]: [] };
      setChannelCache((current) => ({ ...current, [key]: [] }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategory('sports');
  }, [loadCategory]);

  useEffect(() => {
    if (!activeChannel && channels.length > 0) {
      setActiveChannel(channels[0]);
    }
  }, [activeChannel, channels]);

  return (
    <div className="grid gap-6 xl:grid-cols-[260px,1fr]">
      <aside className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/72">
          Browse live
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Channel categories</h2>
        <p className="mt-2 text-sm leading-6 text-white/54">
          Keep navigation tight: choose a category first, then switch channels without leaving the
          player.
        </p>

        <div className="mt-6 grid gap-2">
          {initialCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus={category.key === 'sports' ? 'true' : undefined}
              onClick={() => {
                void loadCategory(category.key);
              }}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                activeCategory === category.key
                  ? 'bg-violet-600 text-white'
                  : 'border border-white/10 bg-white/[0.04] text-white/62 hover:border-violet-400/35 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{category.emoji}</span>
                {category.label}
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          {[
            { label: 'Loaded now', value: String(channels.length) },
            { label: 'Category', value: activeCategory.toUpperCase() },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-[22px] border border-white/10 bg-black/20 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/34">
                {label}
              </p>
              <p className="mt-2 text-lg font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </aside>

      <div className="space-y-6">
        <div className="grid gap-6 2xl:grid-cols-[1.2fr,0.8fr]">
          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-black">
            {activeChannel ? (
              <HlsPlayer
                src={activeChannel.streamUrl}
                title={activeChannel.name}
                logoUrl={activeChannel.logoUrl}
                isLive
                className="aspect-video w-full"
                onError={() => {}}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_30%),linear-gradient(180deg,#091120_0%,#040814_100%)]">
                {loading ? (
                  <Loader2 className="h-7 w-7 animate-spin text-violet-300" />
                ) : (
                  <div className="text-center">
                    <PlayCircle className="mx-auto h-10 w-10 text-white/45" />
                    <p className="mt-3 text-sm text-white/50">Choose a channel to begin playback.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
              <Radio className="h-3.5 w-3.5" />
              Live now
            </div>

            {activeChannel ? (
              <>
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    {activeChannel.logoUrl ? (
                      <img
                        src={activeChannel.logoUrl}
                        alt={activeChannel.name}
                        className="h-12 w-12 object-contain"
                      />
                    ) : (
                      <Tv className="h-6 w-6 text-white/28" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{activeChannel.name}</h3>
                    <p className="mt-1 text-sm text-white/55">
                      {activeChannel.category} · {activeChannel.country || 'International'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/34">
                    Current category
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    {initialCategories.find((category) => category.key === activeCategory)?.label ??
                      activeCategory}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/52">
                    Switch channels instantly from the grid below without leaving the stream.
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-sm leading-6 text-white/54">
                  No active channel yet. Pick a category and select a stream from the grid.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/36">
                Category results
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {initialCategories.find((category) => category.key === activeCategory)?.label ??
                  activeCategory}
              </h2>
            </div>
            <p className="text-sm text-white/48">Showing up to 60 channels per category view.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-violet-300" />
            </div>
          ) : channels.length > 0 ? (
          <div
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
            data-tv-group="live-channel-grid"
          >
              {channels.map((channel) => (
                <ChannelCard
                  key={channel.id + channel.streamUrl}
                  channel={channel}
                  isActive={
                    activeChannel?.id === channel.id &&
                    activeChannel?.streamUrl === channel.streamUrl
                  }
                  onClick={() => setActiveChannel(channel)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-8 text-center text-white/42">
              <Tv className="mx-auto mb-3 h-8 w-8" />
              <p>No channels loaded for this category yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function ChannelRailSection({
  title,
  emoji,
  categoryKey,
}: {
  title: string;
  emoji: string;
  categoryKey: string;
}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  useEffect(() => {
    fetch(`/api/iptv/live?cat=${categoryKey}&limit=20`)
      .then((response) => response.json())
      .then((data) => {
        const nextChannels = data.channels ?? [];
        setChannels(nextChannels);
        setActiveChannel(nextChannels[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryKey]);

  if (!loading && channels.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-black text-white">
          <span>{emoji}</span>
          {title}
        </h2>
        <a
          href={`/live?cat=${categoryKey}`}
          data-tv-focusable="true"
          className="flex items-center gap-1 text-xs font-semibold text-violet-300 transition-colors hover:text-violet-200"
        >
          See all
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      {activeChannel && (
        <div className="mb-4 overflow-hidden rounded-[28px] border border-white/10 bg-black">
          <HlsPlayer
            src={activeChannel.streamUrl}
            title={activeChannel.name}
            logoUrl={activeChannel.logoUrl}
            isLive
            className="aspect-video w-full max-h-64"
          />
        </div>
      )}

      {loading ? (
        <div className="flex gap-3 overflow-x-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-[124px] w-[108px] shrink-0 animate-pulse rounded-[22px] bg-white/[0.05]"
            />
          ))}
        </div>
      ) : (
        <ChannelRail
          channels={channels}
          activeId={activeChannel ? activeChannel.id + activeChannel.streamUrl : null}
          onSelect={setActiveChannel}
        />
      )}
    </section>
  );
}
