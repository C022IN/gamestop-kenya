'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, Maximize2, Volume2, VolumeX } from 'lucide-react';

interface HlsPlayerProps {
  src: string;
  title?: string;
  logoUrl?: string;
  isLive?: boolean;
  className?: string;
  onError?: () => void;
}

export default function HlsPlayer({ src, title, logoUrl, isLive = true, className = '', onError }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setStatus('loading');
    let hls: import('hls.js').default | null = null;

    const tryNative = () => {
      video.src = src;
      video.load();
      video.play().catch(() => setStatus('error'));
    };

    import('hls.js').then(({ default: Hls }) => {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus('playing');
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setStatus('error');
            onError?.();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        tryNative();
      } else {
        setStatus('error');
      }
    }).catch(() => tryNative());

    const handlePlay = () => setStatus('playing');
    const handleError = () => { setStatus('error'); onError?.(); };

    video.addEventListener('playing', handlePlay);
    video.addEventListener('error', handleError);

    return () => {
      hls?.destroy();
      video.removeEventListener('playing', handlePlay);
      video.removeEventListener('error', handleError);
    };
  }, [src, onError]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(!muted);
    }
  };

  const toggleFullscreen = () => {
    const el = videoRef.current?.closest('.hls-player-wrap') as HTMLElement | null;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div className={`hls-player-wrap relative overflow-hidden rounded-2xl bg-black ${className}`}>
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        playsInline
        autoPlay
        muted={muted}
        controls={false}
      />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          {logoUrl && <img src={logoUrl} alt="" className="mb-4 h-12 w-12 rounded-lg object-contain opacity-80" />}
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="mt-3 text-sm text-white/60">Loading stream…</p>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-center p-6">
          <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
          <p className="font-bold text-white">Stream unavailable</p>
          <p className="mt-1 text-sm text-white/50">
            This channel may be geo-restricted or temporarily offline.
          </p>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Try in external player
            </a>
          )}
        </div>
      )}

      {/* Controls bar */}
      {status === 'playing' && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-4 py-3 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
            {title && <span className="text-sm font-semibold text-white drop-shadow">{title}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleMute} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button type="button" onClick={toggleFullscreen} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
