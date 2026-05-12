import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { WebView } from 'react-native-webview';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { fetchStream } from '@/api/client';

const { width, height } = Dimensions.get('window');

type AnyItem = CatalogItem | TmdbItem;

interface Props {
  route: RouteProp<{ Player: { item: AnyItem } }, 'Player'>;
  navigation: NavigationProp<any>;
}

function getSlug(item: AnyItem): string {
  return ('slug' in item && item.slug) ? item.slug : '';
}
function getId(item: AnyItem): string {
  return String(item.id ?? '');
}
function getMediaType(item: AnyItem): string {
  return ('media_type' in item && (item as TmdbItem).media_type) ? (item as TmdbItem).media_type! : 'movie';
}
function getTitle(item: AnyItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return 'Playing…';
}

export default function PlayerScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const videoRef = useRef<Video>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStream = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchStream(getSlug(item), getId(item), getMediaType(item));
    setLoading(false);
    if (!result) {
      setError('This content is not available. Check your subscription.');
      return;
    }
    if (result.playback_mode === 'iframe' || result.source_type === 'iframe') {
      const url = result.iframe_url;
      if (!url) {
        setError('Stream not available.');
        return;
      }
      setIframeUrl(url);
      return;
    }
    if (result.stream_url) {
      setStreamUrl(result.stream_url);
      return;
    }
    setError('Stream not available.');
  }, [item]);

  React.useEffect(() => { loadStream(); }, [loadStream]);

  function resetControlsTimer() {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000);
  }

  function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (!status.isLoaded && status.error) {
      setError(`Playback error: ${status.error}`);
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
          style={styles.backBtn}
          underlayColor="#333"
          onPress={() => navigation.goBack()}
          hasTVPreferredFocus
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
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
        />
        <TouchableHighlight
          style={styles.webviewBackBtn}
          underlayColor="#333"
          onPress={() => navigation.goBack()}
          hasTVPreferredFocus
        >
          <Text style={styles.controlText}>← Back</Text>
        </TouchableHighlight>
      </View>
    );
  }

  return (
    <View style={styles.container} onTouchStart={resetControlsTimer}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl! }}
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
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 20 },
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
  backBtn: { backgroundColor: '#e50914', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 6 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
