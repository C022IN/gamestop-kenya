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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';
import { getId, getSlug, getMediaType, getTitle, getPosterUrl, getBackdropUrl } from '@/utils/mediaItem';
import { fetchStream, buildDirectPlayerUrl, recordResume, clearResume } from '@/api/client';
import { formatTime } from '@/utils/mediaItem';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import TrackPicker from '@/components/TrackPicker';

const { width, height } = Dimensions.get('window');

type MediaTrack = { id: string; language?: string; label?: string; name?: string };

interface Props {
  route: RouteProp<RootStackParamList, 'Player'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Player'>;
}

function progressKey(itemId: string, season: number, episode: number): string {
  return `lastPos_${itemId}_s${season}_e${episode}`;
}

// Injected before page loads: hide the ReactNativeWebView bridge from the iframe
// so player SDKs don't try to call postMessage on it unexpectedly.
const WEBVIEW_BEFORE_LOAD_JS = `
  (function() {
    try { Object.defineProperty(window, 'ReactNativeWebView', { get: function() { return undefined; } }); } catch(e) {}
  })(); true;
`;

// Injected after load: unmute + play any <video> element and report progress to RN.
// Also clicks the Videasy overlay trigger (div.cursor-pointer) that must be tapped
// before the player will start. Retries for up to 12s (20 × 600ms).
// D-pad fix: keyCode 23 (Android TV OK/center) is not handled by web players as a
// click — we intercept it and fire click() on the focused element. Also makes
// dynamic panel items focusable so arrow keys can reach them.
const WEBVIEW_AFTER_LOAD_JS = `
  (function() {
    // ── D-pad OK fix ─────────────────────────────────────────────────────────
    // Videasy handles arrow keys for tab/item focus but ignores keyCode 23
    // (DPAD_CENTER). Map it to a click so "Select" actually activates the item.
    document.addEventListener('keydown', function(e) {
      var code = e.keyCode || e.which;
      if (code === 23) {
        var el = document.activeElement;
        if (el && el !== document.body && el !== document.documentElement) {
          e.preventDefault();
          e.stopPropagation();
          el.click();
        }
      }
    }, true);

    // ── Panel open/close detection ────────────────────────────────────────────
    // Detect when the Videasy settings panel (Quality/Subs/Servers/Speed) opens
    // or closes, and notify RN so the hardware back button can close it first
    // instead of exiting the player entirely.
    var panelOpen = false;
    function checkPanelState() {
      var isOpen = false;
      var btns = document.querySelectorAll('button,[role="button"],[role="tab"]');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].textContent || '').trim().toLowerCase();
        if (t === 'quality' || t === 'subs' || t === 'servers' || t === 'speed') {
          var r = btns[i].getBoundingClientRect();
          if (r.width > 0 && r.height > 0) { isOpen = true; break; }
        }
      }
      if (isOpen !== panelOpen) {
        panelOpen = isOpen;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'panelState', open: isOpen })
        );
      }
    }
    new MutationObserver(checkPanelState).observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class']
    });

    // ── Focusable items ───────────────────────────────────────────────────────
    // Videasy renders panel rows as divs without tabindex, so arrow keys skip
    // them. Add tabindex="0" whenever new elements appear (panels open lazily).
    var ITEM_SEL = 'div[class*="item"],div[class*="option"],div[class*="row"],div[class*="server"],div[class*="track"],div[class*="speed"],div[class*="quality"],div[class*="sub"],div[class*="label"]';
    function makeFocusable() {
      document.querySelectorAll(ITEM_SEL).forEach(function(el) {
        if (el.getAttribute('tabindex') === null && el.children.length <= 4) {
          el.setAttribute('tabindex', '0');
        }
      });
    }
    makeFocusable();
    new MutationObserver(makeFocusable).observe(document.documentElement, { childList: true, subtree: true });

    // ── Video autoplay + progress ─────────────────────────────────────────────
    var tries = 0;
    var t = setInterval(function() {
      var videos = document.querySelectorAll('video');
      if (videos.length > 0) {
        videos.forEach(function(v) { v.muted = false; v.play().catch(function(){}); });
        clearInterval(t);
        setInterval(function() {
          var v = document.querySelector('video');
          if (!v || v.paused || v.currentTime <= 0) return;
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'progress', currentTime: v.currentTime, duration: v.duration || 0 })
          );
        }, 15000);
        return;
      }
      var overlay = document.querySelector('div.cursor-pointer');
      if (overlay) { overlay.click(); }
      document.querySelectorAll('button, [role="button"], .vjs-big-play-button, .plyr__control--overlaid').forEach(function(b) {
        var label = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase();
        if (!label || label.indexOf('play') !== -1) b.click();
      });
      if (++tries >= 20) clearInterval(t);
    }, 600);
  })(); true;
`;

export default function PlayerScreen({ route, navigation }: Props) {
  const { item, season = 1, episode = 1 } = route.params;
  const isTV = getMediaType(item) === 'tv';
  const itemId = getId(item);

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
  const [picker, setPicker] = useState<null | 'subs' | 'audio' | 'sources'>(null);
  const [webPanelOpen, setWebPanelOpen] = useState(false);
  const webviewRef = useRef<WebView>(null);

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

    const result = await fetchStream(getSlug(item), itemId, getMediaType(item), season, episode);
    setLoading(false);

    if (!result) {
      const numericId = Number(itemId);
      if (Number.isFinite(numericId) && numericId > 0) {
        setIframeUrl(buildDirectPlayerUrl(numericId, getMediaType(item), season, episode));
        return;
      }
      setError('Stream not available. Check your connection or subscription.');
      return;
    }

    if (result.stream_url) {
      // Normalise header keys (referer → Referer, etc.) so fetch sends them correctly.
      const HEADER_CASE: Record<string, string> = {
        referer: 'Referer',
        origin: 'Origin',
        'user-agent': 'User-Agent',
      };
      const h: Record<string, string> = {};
      for (const [k, v] of Object.entries(result.stream_headers ?? {})) {
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
  }, [item, itemId, season, episode]);

  useEffect(() => { loadStream(); }, [loadStream]);

  // Hand the stream URL to the player. replaceAsync resolves once metadata loads,
  // so seeking to the saved position after is safe.
  // Note: expo-video auto-detects HLS from the .m3u8 URL — no contentType needed.
  useEffect(() => {
    if (!streamUrl) return;
    let cancelled = false;
    (async () => {
      try {
        await player.replaceAsync({ uri: streamUrl, headers: streamHeaders });
        if (cancelled) return;
        player.play();
      } catch (e: any) {
        if (!cancelled) setError(`Playback error: ${e?.message ?? e}`);
      }
    })();
    return () => { cancelled = true; };
  }, [streamUrl, streamHeaders, player]);

  // Subscribe to player events.
  useEffect(() => {
    const subTime = player.addListener('timeUpdate', (e) => {
      setPositionSec(e.currentTime);
    });
    const subStatus = player.addListener('statusChange', (e) => {
      if (e.status === 'error' && e.error) {
        const msg = e.error.message ?? '';
        // 410 Gone / 403 Forbidden / 404 Not Found = stream URL expired.
        // Fall back to the Videasy iframe silently.
        if (/\b(410|403|404)\b/.test(msg)) {
          const numericId = Number(itemId);
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
        id: (t as any).id, language: (t as any).language,
        label: (t as any).label, name: (t as any).name,
      })));
      setAvailableAudios((e.availableAudioTracks ?? []).map(t => ({
        id: (t as any).id, language: (t as any).language,
        label: (t as any).label, name: (t as any).name,
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
      clearResume(itemId, getMediaType(item), season, episode).catch(() => {});
    });

    return () => {
      subTime.remove(); subStatus.remove(); subSource.remove();
      subPlaying.remove(); subSubTrack.remove(); subAudioTrack.remove();
      subEnd.remove();
    };
  }, [player, item, itemId, season, episode]);

  // Auto-resume saved position once duration is known.
  useEffect(() => {
    if (durationSec <= 0 || hasResumedRef.current) return;
    hasResumedRef.current = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(progressKey(itemId, season, episode));
        if (saved) {
          const savedSec = Number(saved) / 1000;
          if (savedSec > 30 && savedSec < durationSec - 60) {
            player.currentTime = savedSec;
          }
        }
      } catch { /* ignore */ }
    })();
  }, [durationSec, itemId, season, episode, player]);

  // Auto-hide overlay 2.5s after playback starts.
  useEffect(() => {
    if (paused || hasAutoHiddenRef.current) return;
    if (!showControls) return;
    hasAutoHiddenRef.current = true;
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, [paused, showControls]);

  // Persist progress every ~10s.
  useEffect(() => {
    const posMs = positionSec * 1000;
    if (paused || posMs <= 0) return;
    if (posMs - lastSavedPosRef.current < 10_000) return;
    lastSavedPosRef.current = posMs;

    const nearEnd = durationSec > 0 && posMs > durationSec * 1000 - 90_000;
    if (nearEnd) {
      clearResume(itemId, getMediaType(item), season, episode).catch(() => {});
    } else {
      AsyncStorage.setItem(progressKey(itemId, season, episode), String(posMs)).catch(() => {});
      recordResume({
        id: itemId,
        mediaType: getMediaType(item),
        season: isTV ? season : undefined,
        episode: isTV ? episode : undefined,
        positionMs: posMs,
        updatedAt: Date.now(),
        title: getTitle(item),
        posterUrl: getPosterUrl(item),
        backdropUrl: getBackdropUrl(item),
      }).catch(() => {});
    }
  }, [positionSec, durationSec, paused, item, itemId, isTV, season, episode]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  // Use player.currentTime (real position) rather than positionSec state to avoid
  // stale-closure drift during rapid D-pad seeking.
  const seek = useCallback((deltaSec: number) => {
    const dur = player.duration ?? 0;
    if (dur <= 0) return;
    const current = player.currentTime ?? 0;
    const next = Math.max(0, Math.min(dur, current + deltaSec));
    player.currentTime = next;
    setPositionSec(next);
    resetControlsTimer();
  }, [player, resetControlsTimer]);

  // Accelerating arrow seek: 10 → 20 → 40 → 60s when held.
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
    // If the Videasy settings panel is open, close it instead of exiting
    if (iframeUrl && webPanelOpen) {
      webviewRef.current?.injectJavaScript(`
        (function() {
          var closed = false;
          document.querySelectorAll('button,[role="button"]').forEach(function(b) {
            if (closed) return;
            var text = (b.textContent || '').trim();
            var label = (b.getAttribute('aria-label') || '').toLowerCase();
            if (text === '×' || text === 'X' || text === '✕' || text === '✖' || label === 'close') {
              b.click(); closed = true;
            }
          });
          if (!closed) {
            document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27, key: 'Escape', bubbles: true }));
          }
        })(); true;
      `);
      return true;
    }
    navigation.goBack();
    return true;
  }, [navigation, picker, iframeUrl, webPanelOpen]));

  useTVEventHandler((evt) => {
    if (!evt?.eventType || evt.eventType === 'blur' || evt.eventType === 'focus') return;
    if (picker) return;
    if (!showControls) {
      if (evt.eventType === 'left')  { acceleratingSeek(-1); return; }
      if (evt.eventType === 'right') { acceleratingSeek(1);  return; }
    }
    if (evt.eventType === 'playPause') { togglePlay(); return; }
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
        <TouchableHighlight style={[styles.backBtn, { marginTop: 8 }]} underlayColor="#333" onPress={loadStream} hasTVPreferredFocus>
          <Text style={styles.backBtnText}>↺ Retry</Text>
        </TouchableHighlight>
        <TouchableHighlight style={styles.backBtn} underlayColor="#333" onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableHighlight>
      </View>
    );
  }

  if (iframeUrl) {
    return (
      <View style={styles.container}>
        <WebView
          ref={webviewRef}
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
              if (msg.type === 'panelState') { setWebPanelOpen(msg.open); return; }
              if (msg.type !== 'progress' || !(msg.currentTime > 30)) return;
              const posMs = Math.round(msg.currentTime * 1000);
              const durMs = msg.duration > 0 ? msg.duration * 1000 : 0;
              const nearEnd = durMs > 0 && posMs > durMs - 90_000;
              if (nearEnd) {
                clearResume(itemId, getMediaType(item), season, episode).catch(() => {});
              } else {
                AsyncStorage.setItem(progressKey(itemId, season, episode), String(posMs)).catch(() => {});
                recordResume({
                  id: itemId, mediaType: getMediaType(item),
                  season: isTV ? season : undefined, episode: isTV ? episode : undefined,
                  positionMs: posMs, updatedAt: Date.now(),
                  title: getTitle(item),
                  posterUrl: getPosterUrl(item),
                  backdropUrl: getBackdropUrl(item),
                }).catch(() => {});
              }
            } catch { /* ignore non-JSON messages from iframe */ }
          }}
        />
        {/* Back button for the WebView path.
            NOTE: WebView traps all D-pad focus on Android TV — this button is only
            reachable via the hardware Back key (handled by useHardwareBack above).
            It remains in the tree as a visual affordance for pointer/mouse users. */}
        <TouchableHighlight
          style={styles.webviewBackBtn}
          underlayColor="#333"
          onPress={() => navigation.goBack()}
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
      {/* Focus anchor: sits above VideoView so Android routes key events to RN
          instead of ExoPlayer while controls are hidden. OK press shows controls;
          left/right seek via useTVEventHandler. */}
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
            <TouchableHighlight style={styles.controlBtn} underlayColor="#333" onPress={() => navigation.goBack()} isTVSelectable>
              <Text style={styles.controlText}>← Back</Text>
            </TouchableHighlight>
            <Text style={styles.titleText}>
              {getTitle(item)}{isTV ? `  ·  S${season} E${episode}` : ''}
            </Text>
          </View>

          <View style={styles.controlsCenter}>
            <TouchableHighlight style={styles.seekBtn} underlayColor="#333" onPress={() => seek(-10)} isTVSelectable>
              <Text style={styles.seekText}>⏪ 10s</Text>
            </TouchableHighlight>
            <TouchableHighlight style={styles.playPauseBtn} underlayColor="#333" onPress={togglePlay} hasTVPreferredFocus isTVSelectable>
              <Text style={styles.playPauseText}>{paused ? '▶' : '⏸'}</Text>
            </TouchableHighlight>
            <TouchableHighlight style={styles.seekBtn} underlayColor="#333" onPress={() => seek(10)} isTVSelectable>
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
                <TouchableHighlight style={styles.actionBtn} underlayColor="#333" onPress={() => setPicker('subs')} isTVSelectable>
                  <Text style={styles.actionBtnText}>CC  Subtitles</Text>
                </TouchableHighlight>
              )}
              {availableAudios.length > 1 && (
                <TouchableHighlight style={styles.actionBtn} underlayColor="#333" onPress={() => setPicker('audio')} isTVSelectable>
                  <Text style={styles.actionBtnText}>🎧  Audio</Text>
                </TouchableHighlight>
              )}
              {isTV && episode > 1 && (
                <TouchableHighlight style={styles.actionBtn} underlayColor="#333" onPress={() => goToEpisode(episode - 1)} isTVSelectable>
                  <Text style={styles.actionBtnText}>← Prev Ep</Text>
                </TouchableHighlight>
              )}
              {isTV && (
                <TouchableHighlight style={styles.actionBtn} underlayColor="#333" onPress={() => goToEpisode(episode + 1)} isTVSelectable>
                  <Text style={styles.actionBtnText}>Next Ep →</Text>
                </TouchableHighlight>
              )}
              <TouchableHighlight style={[styles.actionBtn, styles.sourcesBtn]} underlayColor="#1a4a8a" onPress={() => setPicker('sources')} isTVSelectable>
                <Text style={styles.actionBtnText}>📡  Sources</Text>
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
          onSelect={(track) => { player.subtitleTrack = track ? (track as any) : null; }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'audio' && (
        <TrackPicker
          title="Audio Track"
          tracks={availableAudios}
          currentId={currentAudioId}
          includeOff={false}
          onSelect={(track) => { if (track) player.audioTrack = track as any; }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'sources' && (
        <TrackPicker
          title="Playback Source"
          includeOff={false}
          tracks={[
            { id: 'hls', label: 'Native HLS  (re-extract)' },
            { id: 'web', label: 'Videasy Web Player' },
          ]}
          currentId={streamUrl ? 'hls' : 'web'}
          onSelect={(track) => {
            setPicker(null);
            if (!track) return;
            if (track.id === 'web') {
              const numericId = Number(itemId);
              if (Number.isFinite(numericId) && numericId > 0) {
                setIframeUrl(buildDirectPlayerUrl(numericId, getMediaType(item), season, episode));
                setStreamUrl(null);
              }
            } else {
              setIframeUrl(null);
              setStreamUrl(null);
              loadStream();
            }
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
  bufferingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
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
  sourcesBtn: { backgroundColor: 'rgba(30,90,180,0.5)' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  backBtn: { backgroundColor: '#333', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 6 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
