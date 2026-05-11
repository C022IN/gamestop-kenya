import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import Video, { type VideoRef } from 'react-native-video';
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
  if ('slug' in item && item.slug) return item.slug;
  return '';
}
function getId(item: AnyItem): string {
  return String(item.id ?? '');
}
function getTitle(item: AnyItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return 'Playing…';
}

export default function PlayerScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const videoRef = useRef<VideoRef>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loadingStream, setLoadingStream] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStream = useCallback(async () => {
    setLoadingStream(true);
    setStreamError(null);
    const result = await fetchStream(getSlug(item), getId(item));
    setLoadingStream(false);
    if (!result || (!result.stream_url && !result.iframe_url)) {
      setStreamError('This content is not available for playback. Check your subscription.');
      return;
    }
    // Prefer HLS stream; fall back to iframe URL if no direct stream
    if (result.stream_url) {
      setStreamUrl(result.stream_url);
    } else {
      setStreamError('Iframe-only streams require the web player. Open gamestop.co.ke/movies on a browser.');
    }
  }, [item]);

  React.useEffect(() => { loadStream(); }, [loadStream]);

  function resetControlsTimer() {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000);
  }

  if (loadingStream) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Loading stream…</Text>
      </View>
    );
  }

  if (streamError || !streamUrl) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{streamError ?? 'Stream unavailable.'}</Text>
        <TouchableHighlight
          style={styles.backBtn}
          underlayColor="#333"
          onPress={() => navigation.goBack()}
          hasTVPreferredFocus
        >
          <Text style={styles.backText}>← Go Back</Text>
        </TouchableHighlight>
      </View>
    );
  }

  return (
    <View style={styles.container} onTouchStart={resetControlsTimer}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        resizeMode="contain"
        paused={paused}
        controls={false}
        onLoad={() => setLoadingStream(false)}
        onError={e => setStreamError(`Playback error: ${e.error?.localizedDescription ?? 'Unknown'}`)}
        ignoreSilentSwitch="ignore"
        playInBackground={false}
      />

      {/* Overlay controls */}
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
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 12 },
  errorText: { color: '#e50914', fontSize: 18, textAlign: 'center', maxWidth: 500 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'space-between',
  },
  controlsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  controlsCenter: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  controlBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
  },
  controlText: { color: '#fff', fontSize: 16 },
  titleText: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(229,9,20,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseText: { color: '#fff', fontSize: 28 },
  backBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 6,
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
