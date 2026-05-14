import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  useTVEventHandler,
} from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { WebView } from 'react-native-webview';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { fetchStream, buildDirectPlayerUrl } from '@/api/client';

const { width, height } = Dimensions.get('window');

type AnyItem = CatalogItem | TmdbItem;

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
function getMediaType(item: AnyItem): string {
  if ('media_type' in item && (item as TmdbItem).media_type) return (item as TmdbItem).media_type!;
  if ('kind' in item && (item as CatalogItem).kind === 'series') return 'tv';
  return 'movie';
}
function getTitle(item: AnyItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return 'Playing…';
}

// Runs before any page script — removes WebView fingerprint so iframe players don't block us
const WEBVIEW_BEFORE_LOAD_JS = `
  (function() {
    try {
      Object.defineProperty(window, 'ReactNativeWebView', { get: function() { return undefined; } });
    } catch(e) {}
  })();
  true;
`;

// Runs after page loads — polls for a video element and forces play
const WEBVIEW_AFTER_LOAD_JS = `
  (function() {
    var tries = 0;
    var t = setInterval(function() {
      var videos = document.querySelectorAll('video');
      if (videos.length > 0) {
        videos.forEach(function(v) {
          v.muted = false;
          v.play().catch(function(){});
        });
        clearInterval(t);
        return;
      }
      // Also try clicking any visible play button
      var btns = document.querySelectorAll('button, [role="button"]');
      btns.forEach(function(b) {
        var label = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase();
        if (label.indexOf('play') !== -1) { b.click(); }
      });
      if (++tries >= 20) clearInterval(t);
    }, 600);
  })();
  true;
`;

export default function PlayerScreen({ route, navigation }: Props) {
  const { item, season = 1, episode = 1 } = route.params;
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamHeaders, setStreamHeaders] = useState<Record<string, string>>({});
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStream = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchStream(
      getSlug(item),
      getId(item),
      getMediaType(item),
      season,
      episode,
    );
    setLoading(false);
    if (!result) {
      // Server API failed — for TMDB numeric IDs build the player URL directly
      const numericId = Number(getId(item));
      if (Number.isFinite(numericId) && numericId > 0) {
        setIframeUrl(buildDirectPlayerUrl(numericId, getMediaType(item), season, episode));
        return;
      }
      setError('Stream not available. Check your connection or subscription.');
      return;
    }
    if (result.stream_url) {
      // Native playback path — preferred for Android TV (expo-av → ExoPlayer).
      // Forward every non-null header the extractor captured. Origin in particular
      // is required by most HLS CDNs for hotlink protection — ExoPlayer doesn't
      // add it on its own, so without forwarding it segments 403 silently.
      setStreamUrl(result.stream_url);
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

  React.useEffect(() => { loadStream(); }, [loadStream]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  // Android TV remote keys don't fire touch events, so we'd never hide the
  // overlay. Wake the timer on any remote keypress instead.
  useTVEventHandler((evt) => {
    if (evt?.eventType && evt.eventType !== 'blur' && evt.eventType !== 'focus') {
      resetControlsTimer();
    }
  });

  const hasAutoHiddenRef = useRef(false);
  function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (!status.isLoaded) {
      if (status.error) setError(`Playback error: ${status.error}`);
      return;
    }
    // Once playback actually begins, hide the controls overlay automatically.
    // Only do it once per session so we don't fight the user reopening them.
    if (status.isPlaying && !hasAutoHiddenRef.current) {
      hasAutoHiddenRef.current = true;
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      controlsTimer.current = setTimeout(() => setShowControls(false), 2500);
    }
  }

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
          // Desktop Chrome UA — Videasy and similar players require a real browser UA
          userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
          originWhitelist={['*']}
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={WEBVIEW_BEFORE_LOAD_JS}
          injectedJavaScript={WEBVIEW_AFTER_LOAD_JS}
          onError={e => setError(`WebView error: ${e.nativeEvent.description}`)}
        />
        <TouchableHighlight
          style={styles.webviewBackBtn}
          underlayColor="#333"
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.controlText}>← Back</Text>
        </TouchableHighlight>
      </View>
    );
  }

  return (
    <View style={styles.container} onTouchStart={resetControlsTimer}>
      <Video
        source={{
          uri: streamUrl!,
          // Forward extracted Referer/User-Agent — some HLS CDNs require them on
          // segment requests, otherwise they 403.
          ...(Object.keys(streamHeaders).length > 0 ? { headers: streamHeaders } : {}),
        }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={!paused}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        isLooping={false}
        useNativeControls={false}
      />
      {showControls && (
        <View style={styles.overlay}>
          <View style={styles.controlsTop}>
            <TouchableHighlight
              style={styles.controlBtn}
              underlayColor="#333"
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.controlText}>← Back</Text>
            </TouchableHighlight>
            <Text style={styles.titleText}>{getTitle(item)}</Text>
          </View>
          <View style={styles.controlsCenter}>
            <TouchableHighlight
              style={styles.playPauseBtn}
              underlayColor="#333"
              onPress={() => { setPaused(p => !p); resetControlsTimer(); }}
              hasTVPreferredFocus
            >
              <Text style={styles.playPauseText}>{paused ? '▶' : '⏸'}</Text>
            </TouchableHighlight>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { width, height },
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
  controlsTop: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 20 },
  controlsCenter: { alignItems: 'center', paddingBottom: 48 },
  controlBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6 },
  controlText: { color: '#fff', fontSize: 16 },
  titleText: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  playPauseBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(229,9,20,0.85)', alignItems: 'center', justifyContent: 'center' },
  playPauseText: { color: '#fff', fontSize: 28 },
  backBtn: { backgroundColor: '#333', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 6 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
