import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  useTVEventHandler,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { fetchStream, buildDirectPlayerUrl, recordResume, clearResume } from '@/api/client';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import TrackPicker from '@/components/TrackPicker';

const { width, height } = Dimensions.get('window');

type AnyItem = CatalogItem | TmdbItem;
type MediaTrack = { id: string; language?: string; label?: string; name?: string };

interface Props {
  route: RouteProp<{ Player: { item: AnyItem; season?: number; episode?: number } }, 'Player'>;
  navigation: NavigationProp<any>;
}

function getSlug(item: AnyItem): string {
  return ('slug' in item && item.slug) ? item.slug : '';
}
function getId(item: AnyItem): string {
  return String(item.id ?? '');
}
function getMediaType(item: AnyItem): 'movie' | 'tv' {
  if ('media_type' in item && (item as TmdbItem).media_type === 'tv') return 'tv';
  if ('kind' in item && (item as CatalogItem).kind === 'series') return 'tv';
  return 'movie';
}
function getTitle(item: AnyItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return 'Playing…';
}
function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
function progressKey(item: AnyItem, season: number, episode: number): string {
  return `lastPos_${getId(item)}_s${season}_e${episode}`;
}

const WEBVIEW_BEFORE_LOAD_JS = `
  (function() {
    try { Object.defineProperty(window, 'ReactNativeWebView', { get: function() { return undefined; } }); } catch(e) {}
  })(); true;
`;
const WEBVIEW_AFTER_LOAD_JS = `
  (function() {
    var tries = 0;
    var t = setInterval(function() {
      var videos = document.querySelectorAll('video');
      if (videos.length > 0) {
        videos.forEach(function(v) { v.muted = false; v.play().catch(function(){}); });
        clearInterval(t);
        // Report progress back to RN every 15s
        setInterval(function() {
          var v = document.querySelector('video');
          if (!v || v.paused || v.currentTime <= 0) return;
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'progress', currentTime: v.currentTime, duration: v.duration || 0 })
          );
        }, 15000);
        return;
      }
      document.querySelectorAll('button, [role="button"]').forEach(function(b) {
        var label = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase();
        if (label.indexOf('play') !== -1) b.click();
      });
      if (++tries >= 20) clearInterval(t);
    }, 600);
  })(); true;
`;

export default function PlayerScreen({ route, navigation }: Props) {
  const { item, season = 1, episode = 1 } = route.params;
  const isTV = getMediaType(item) === 'tv';

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamHeaders, setStreamHeaders] = useState<Record<string, string>>({});
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [availableSubs, setAvailableSubs] = useState<MediaTrack[]>([]);
  const [availableAudios, setAvailableAudios] = useState<MediaTrack[]>([]);
  const [currentSubId, setCurrentSubId] = useState<string | null>(null);
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | 'subs' | 'audio'>(null);

  const player = useVideoPlayer(null, (p) => {
    p.timeUpdateEventInterval = 0.5;
    p.audioMixingMode = 'auto';
  });

  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoHiddenRef = useRef(false);
  const hasResumedRef = useRef(false);
  const lastSavedPosRef = useRef(0);
  const lastSeekAtRef = useRef(0);
  const lastSeekStepRef = useRef(10);

  const loadStream = useCallback(async () => {
    setLoading(true);
    setError(null);
    hasAutoHiddenRef.current = false;
    hasResumedRef.current = false;
    lastSavedPosRef.current = 0;
    setPositionSec(0);
    setDurationSec(0);
    setAvailableSubs([]);
    setAvailableAudios([]);
    setCurrentSubId(null);
    setCurrentAudioId(null);

    const result = await fetchStream(
      getSlug(item),
      getId(item),
      getMediaType(item),
      season,
      episode,
    );
    setLoading(false);
    if (!result) {
      const numericId = Number(getId(item));
      if (Number.isFinite(numericId) && numericId > 0) {
        setIframeUrl(buildDirectPlayerUrl(numericId, getMediaType(item), season, episode));
        return;
      }
      setError('Stream not available. Check your connection or subscription.');
      return;
    }
    if (result.stream_url) {
      const HEADER_CASE: Record<string, string> = {
        referer: 'Referer',
        origin: 'Origin',
        'user-agent': 'User-Agent',
      };
      const h: Record<string, string> = {};
      const src = result.stream_headers ?? {};
      for (const [k, v] of Object.entries(src)) {
        if (typeof v === 'string' && v.length > 0) {
          h[HEADER_CASE[k.toLowerCase()] ?? k] = v;
        }
      }
      setStreamUrl(result.stream_url);
      setStreamHeaders(h);
      return;
    }
    if (result.playback_mode === 'iframe' || result.source_type === 'iframe') {
      if (!result.iframe_url) { setError('Player URL missing.'); return; }
      setIframeUrl(result.iframe_url);
      return;
    }
    setError('No playable source found.');
  }, [item, season, episode]);

  useEffect(() => { loadStream(); }, [loadStream]);

  // When we have a stream URL, hand it to the player. replaceAsync (vs replace)
  // resolves only once metadata is loaded, so we can safely auto-seek after.
  useEffect(() => {
    if (!streamUrl) return;
    let cancelled = false;
    (async () => {
      try {
        await player.replaceAsync({ uri: streamUrl, headers: streamHeaders, contentType: 'hls' });
        if (cancelled) return;
        player.play();
      } catch (e: any) {
        if (!cancelled) setError(`Playback error: ${e?.message ?? e}`);
      }
    })();
    return () => { cancelled = true; };
  }, [streamUrl, streamHeaders, player]);

  // Subscribe to player events. expo-video uses an EventEmitter on the shared object.
  useEffect(() => {
    const subTime = player.addListener('timeUpdate', (e) => {
      setPositionSec(e.currentTime);
    });
    const subStatus = player.addListener('statusChange', (e) => {
      if (e.status === 'error' && e.error) {
        const msg = e.error.message ?? '';
        // 410 Gone / 403 Forbidden / 404 Not Found = stream URL expired or revoked.
        // Fall back to the Videasy iframe silently rather than showing an error screen.
        if (/\b(410|403|404)\b/.test(msg)) {
          const numericId = Number(getId(item));
          if (Number.isFinite(numericId) && numericId > 0) {
            setIframeUrl(buildDirectPlayerUrl(numericId, getMediaType(item), season, episode));
            setStreamUrl(null);
            return;
          }
        }
        setError(`Playback error: ${msg}`);
      }
      setBuffering(e.status === 'loading');
    });
    const subSource = player.addListener('sourceLoad', (e) => {
      setDurationSec(e.duration);
      setAvailableSubs((e.availableSubtitleTracks ?? []).map(t => ({
        id: (t as any).id, language: (t as any).language, label: (t as any).label, name: (t as any).name,
      })));
      setAvailableAudios((e.availableAudioTracks ?? []).map(t => ({
        id: (t as any).id, language: (t as any).language, label: (t as any).label, name: (t as any).name,
      })));
    });
    const subPlaying = player.addListener('playingChange', (e) => {
      setPaused(!e.isPlaying);
    });
    const subSubTrack = player.addListener('subtitleTrackChange', (e) => {
      setCurrentSubId((e.subtitleTrack as any)?.id ?? null);
    });
    const subAudioTrack = player.addListener('audioTrackChange', (e) => {
      setCurrentAudioId((e.audioTrack as any)?.id ?? null);
    });
    const subEnd = player.addListener('playToEnd', () => {
      // Clear resume so the title doesn't keep showing up as Continue Watching
      clearResume(getId(item), getMediaType(item), season, episode).catch(() => {});
    });

    return () => {
      subTime.remove();
      subStatus.remove();
      subSource.remove();
      subPlaying.remove();
      subSubTrack.remove();
      subAudioTrack.remove();
      subEnd.remove();
    };
  }, [player, item, season, episode]);

  // Auto-resume saved position once duration becomes known
  useEffect(() => {
    if (durationSec <= 0 || hasResumedRef.current) return;
    hasResumedRef.current = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(progressKey(item, season, episode));
        if (saved) {
          const savedSec = Number(saved) / 1000;
          if (savedSec > 30 && savedSec < durationSec - 60) {
            player.currentTime = savedSec;
          }
        }
      } catch { /* ignore */ }
    })();
  }, [durationSec, item, season, episode, player]);

  // Auto-hide overlay once playback begins
  useEffect(() => {
    if (paused || hasAutoHiddenRef.current) return;
    if (!showControls) return;
    hasAutoHiddenRef.current = true;
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, [paused, showControls]);

  // Persist progress every ~10s. durationSec may be 0 for some HLS streams — still save.
  useEffect(() => {
    const posMs = positionSec * 1000;
    if (paused || posMs <= 0) return;
    if (posMs - lastSavedPosRef.current < 10_000) return;
    lastSavedPosRef.current = posMs;

    const nearEnd = durationSec > 0 && posMs > durationSec * 1000 - 90_000;
    if (nearEnd) {
      clearResume(getId(item), getMediaType(item), season, episode).catch(() => {});
    } else {
      const posterUrl = ('poster_url' in item ? (item as any).poster_url : '') ||
                        ('poster_path' in item ? `https://image.tmdb.org/t/p/w342${(item as TmdbItem).poster_path}` : '');
      const backdropUrl = ('backdrop_url' in item ? (item as any).backdrop_url : '') ||
                          ('backdrop_path' in item ? `https://image.tmdb.org/t/p/w780${(item as TmdbItem).backdrop_path}` : '');
      AsyncStorage.setItem(progressKey(item, season, episode), String(posMs)).catch(() => {});
      recordResume({
        id: getId(item),
        mediaType: getMediaType(item),
        season: isTV ? season : undefined,
        episode: isTV ? episode : undefined,
        positionMs: posMs,
        updatedAt: Date.now(),
        title: getTitle(item),
        posterUrl,
        backdropUrl,
      }).catch(() => {});
    }
  }, [positionSec, durationSec, paused, item, isTV, season, episode]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  const seek = useCallback((deltaSec: number) => {
    if (durationSec <= 0) return;
    const next = Math.max(0, Math.min(durationSec, positionSec + deltaSec));
    player.currentTime = next;
    setPositionSec(next);
    resetControlsTimer();
  }, [durationSec, positionSec, player, resetControlsTimer]);

  // Accelerating arrow seek: 10 → 20 → 40 → 60s when held
  const acceleratingSeek = useCallback((dir: -1 | 1) => {
    const now = Date.now();
    let step = lastSeekStepRef.current;
    step = now - lastSeekAtRef.current < 500 ? Math.min(step * 2, 60) : 10;
    lastSeekStepRef.current = step;
    lastSeekAtRef.current = now;
    seek(dir * step);
  }, [seek]);

  const togglePlay = useCallback(() => {
    if (paused) player.play(); else player.pause();
    resetControlsTimer();
  }, [paused, player, resetControlsTimer]);

  const goToEpisode = useCallback((ep: number) => {
    (navigation as any).replace('Player', { item, season, episode: ep });
  }, [navigation, item, season]);

  useHardwareBack(useCallback(() => {
    if (picker) { setPicker(null); return true; }
    navigation.goBack();
    return true;
  }, [navigation, picker]));

  useTVEventHandler((evt) => {
    if (!evt?.eventType || evt.eventType === 'blur' || evt.eventType === 'focus') return;
    if (picker) return; // let the picker handle its own focus
    if (evt.eventType === 'left') { acceleratingSeek(-1); return; }
    if (evt.eventType === 'right') { acceleratingSeek(1); return; }
    if (evt.eventType === 'playPause' || evt.eventType === 'select') {
      // 'select' / 'playPause' bubble up here only when no button is focused;
      // we still want them to toggle play.
      togglePlay();
      return;
    }
    resetControlsTimer();
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Loading stream…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableHighlight
          style={[styles.backBtn, { marginTop: 8 }]}
          underlayColor="#333"
          onPress={loadStream}
          hasTVPreferredFocus
        >
          <Text style={styles.backBtnText}>↺ Retry</Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.backBtn}
          underlayColor="#333"
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableHighlight>
      </View>
    );
  }

  if (iframeUrl) {
    const posterUrl = ('poster_url' in item ? (item as any).poster_url : '') ||
                      ('poster_path' in item ? `https://image.tmdb.org/t/p/w342${(item as TmdbItem).poster_path}` : '');
    const backdropUrl = ('backdrop_url' in item ? (item as any).backdrop_url : '') ||
                        ('backdrop_path' in item ? `https://image.tmdb.org/t/p/w780${(item as TmdbItem).backdrop_path}` : '');
    return (
      <View style={styles.container}>
        <WebView
          source={{ uri: iframeUrl }}
          style={styles.webview}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
          originWhitelist={['*']}
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={WEBVIEW_BEFORE_LOAD_JS}
          injectedJavaScript={WEBVIEW_AFTER_LOAD_JS}
          onError={e => setError(`WebView error: ${e.nativeEvent.description}`)}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg.type !== 'progress' || !(msg.currentTime > 30)) return;
              const posMs = Math.round(msg.currentTime * 1000);
              const durMs = msg.duration > 0 ? msg.duration * 1000 : 0;
              const nearEnd = durMs > 0 && posMs > durMs - 90_000;
              if (nearEnd) {
                clearResume(getId(item), getMediaType(item), season, episode).catch(() => {});
              } else {
                AsyncStorage.setItem(progressKey(item, season, episode), String(posMs)).catch(() => {});
                recordResume({
                  id: getId(item), mediaType: getMediaType(item),
                  season: isTV ? season : undefined, episode: isTV ? episode : undefined,
                  positionMs: posMs, updatedAt: Date.now(),
                  title: getTitle(item), posterUrl, backdropUrl,
                }).catch(() => {});
              }
            } catch { /* ignore non-JSON messages from iframe */ }
          }}
        />
        {/* Back button always visible for iframe path — WebView captures all
            D-pad events internally so useTVEventHandler won't fire. The user
            navigates the iframe player with the remote directly; we only
            surface a RN-controlled Back button via hasTVPreferredFocus so it
            can be reached by pressing Up until focus escapes the WebView. */}
        <TouchableHighlight
          style={styles.webviewBackBtn}
          underlayColor="#333"
          onPress={() => navigation.goBack()}
          hasTVPreferredFocus
          isTVSelectable
        >
          <Text style={styles.controlText}>← Back</Text>
        </TouchableHighlight>
      </View>
    );
  }

  const progress = durationSec > 0 ? positionSec / durationSec : 0;

  return (
    <View style={styles.container} onTouchStart={resetControlsTimer}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
        focusable={false}
      />
      {/* Focus anchor: sits above VideoView in Z-order so Android routes key
          events to React Native instead of ExoPlayer. When controls are hidden
          this view holds TV focus; pressing OK shows controls, left/right seeks
          via useTVEventHandler. When controls appear it unmounts and
          hasTVPreferredFocus on the play/pause button takes over. */}
      {!showControls && !picker && (
        <TouchableHighlight
          style={styles.focusAnchor}
          underlayColor="transparent"
          onPress={resetControlsTimer}
          hasTVPreferredFocus
          isTVSelectable
        >
          <View />
        </TouchableHighlight>
      )}
      {buffering && !showControls && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      {showControls && !picker && (
        <View style={styles.overlay}>
          <View style={styles.controlsTop}>
            <TouchableHighlight
              style={styles.controlBtn}
              underlayColor="#333"
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.controlText}>← Back</Text>
            </TouchableHighlight>
            <Text style={styles.titleText}>
              {getTitle(item)}{isTV ? `  ·  S${season} E${episode}` : ''}
            </Text>
          </View>

          <View style={styles.controlsCenter}>
            <TouchableHighlight
              style={styles.seekBtn}
              underlayColor="#333"
              onPress={() => seek(-10)}
            >
              <Text style={styles.seekText}>⏪ 10s</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={styles.playPauseBtn}
              underlayColor="#333"
              onPress={togglePlay}
              hasTVPreferredFocus
            >
              <Text style={styles.playPauseText}>{paused ? '▶' : '⏸'}</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={styles.seekBtn}
              underlayColor="#333"
              onPress={() => seek(10)}
            >
              <Text style={styles.seekText}>10s ⏩</Text>
            </TouchableHighlight>
          </View>

          <View style={styles.controlsBottom}>
            <View style={styles.progressRow}>
              <Text style={styles.timeText}>{formatTime(positionSec)}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.timeText}>{durationSec > 0 ? formatTime(durationSec) : '--:--'}</Text>
            </View>

            <View style={styles.bottomActionsRow}>
              {availableSubs.length > 0 && (
                <TouchableHighlight
                  style={styles.actionBtn}
                  underlayColor="#333"
                  onPress={() => setPicker('subs')}
                >
                  <Text style={styles.actionBtnText}>CC  Subtitles</Text>
                </TouchableHighlight>
              )}
              {availableAudios.length > 1 && (
                <TouchableHighlight
                  style={styles.actionBtn}
                  underlayColor="#333"
                  onPress={() => setPicker('audio')}
                >
                  <Text style={styles.actionBtnText}>🎧  Audio</Text>
                </TouchableHighlight>
              )}
              {isTV && episode > 1 && (
                <TouchableHighlight
                  style={styles.actionBtn}
                  underlayColor="#333"
                  onPress={() => goToEpisode(episode - 1)}
                >
                  <Text style={styles.actionBtnText}>← Prev Ep</Text>
                </TouchableHighlight>
              )}
              {isTV && (
                <TouchableHighlight
                  style={styles.actionBtn}
                  underlayColor="#333"
                  onPress={() => goToEpisode(episode + 1)}
                >
                  <Text style={styles.actionBtnText}>Next Ep →</Text>
                </TouchableHighlight>
              )}
              <TouchableHighlight
                style={[styles.actionBtn, styles.webPlayerBtn]}
                underlayColor="#1a4a8a"
                onPress={() => {
                  const numericId = Number(getId(item));
                  if (Number.isFinite(numericId) && numericId > 0) {
                    setIframeUrl(buildDirectPlayerUrl(numericId, getMediaType(item), season, episode));
                    setStreamUrl(null);
                  }
                }}
              >
                <Text style={styles.actionBtnText}>🌐  Web Player</Text>
              </TouchableHighlight>
            </View>
          </View>
        </View>
      )}

      {picker === 'subs' && (
        <TrackPicker
          title="Subtitles"
          tracks={availableSubs}
          currentId={currentSubId}
          onSelect={(track) => {
            player.subtitleTrack = track ? (track as any) : null;
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'audio' && (
        <TrackPicker
          title="Audio Track"
          tracks={availableAudios}
          currentId={currentAudioId}
          includeOff={false}
          onSelect={(track) => {
            if (track) player.audioTrack = track as any;
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { width, height },
  focusAnchor: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  webview: { flex: 1, backgroundColor: '#000' },
  webviewBackBtn: {
    position: 'absolute', top: 16, left: 16,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6,
  },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 12 },
  errorText: { color: '#e50914', fontSize: 18, textAlign: 'center', maxWidth: 500 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'space-between' },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  controlsTop: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 20 },
  controlsCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 },
  controlsBottom: { paddingHorizontal: 32, paddingBottom: 32, gap: 16 },
  controlBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6 },
  controlText: { color: '#fff', fontSize: 16 },
  titleText: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  playPauseBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(229,9,20,0.85)', alignItems: 'center', justifyContent: 'center' },
  playPauseText: { color: '#fff', fontSize: 28 },
  seekBtn: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  seekText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#e50914', borderRadius: 2 },
  timeText: { color: '#ccc', fontSize: 13, minWidth: 48, textAlign: 'center' },
  bottomActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6 },
  webPlayerBtn: { backgroundColor: 'rgba(30,90,180,0.5)' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  backBtn: { backgroundColor: '#333', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 6 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
