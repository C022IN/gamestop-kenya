import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';

interface EpisodeTileProps {
  episodeNumber: number;
  title: string;
  overview: string;
  stillUrl: string;
  runtime?: number;
  airDate?: string;
  resumePct?: number; // 0..1; renders a red progress bar at the bottom of the still
  onPress: () => void;
  onFocus?: () => void;
  hasTVPreferredFocus?: boolean;
}

export default function EpisodeTile({
  episodeNumber,
  title,
  overview,
  stillUrl,
  runtime,
  airDate,
  resumePct,
  onPress,
  onFocus,
  hasTVPreferredFocus = false,
}: EpisodeTileProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => { setFocused(true); onFocus?.(); }}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      isTVSelectable
      style={[styles.row, focused && styles.rowFocused]}
    >
      <View style={styles.stillWrap}>
        {stillUrl ? (
          <Image source={{ uri: stillUrl }} style={styles.still} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.still, styles.stillFallback]}>
            <Text style={styles.stillFallbackText}>Ep {episodeNumber}</Text>
          </View>
        )}
        {typeof resumePct === 'number' && resumePct > 0.02 && (
          <View style={styles.resumeTrack}>
            <View style={[styles.resumeFill, { width: `${Math.round(resumePct * 100)}%` }]} />
          </View>
        )}
        {focused && (
          <View style={styles.playOverlay}>
            <Text style={styles.playGlyph}>▶</Text>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          <Text style={styles.epNum}>{episodeNumber}. </Text>
          {title}
        </Text>
        <Text style={styles.metaLine}>
          {runtime ? `${runtime}m` : ''}{runtime && airDate ? '  ·  ' : ''}{airDate ? airDate.slice(0, 4) : ''}
        </Text>
        <Text style={[styles.overview, focused && styles.overviewFocused]} numberOfLines={3}>
          {overview || 'No description available.'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowFocused: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: '#fff',
  },
  stillWrap: { width: 240, height: 135, borderRadius: 6, overflow: 'hidden', backgroundColor: '#1a1a2e' },
  still: { width: 240, height: 135 },
  stillFallback: { alignItems: 'center', justifyContent: 'center' },
  stillFallbackText: { color: '#666', fontSize: 16, fontWeight: '700' },
  resumeTrack: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  resumeFill: { height: '100%', backgroundColor: '#e50914' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  playGlyph: { color: '#fff', fontSize: 32 },
  meta: { flex: 1, paddingLeft: 16, paddingVertical: 4 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  epNum: { color: '#888' },
  metaLine: { color: '#888', fontSize: 12, marginTop: 2, marginBottom: 6 },
  overview: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  overviewFocused: { color: '#ddd' },
});

export function EpisodeListLoading() {
  return (
    <View style={loadStyles.wrap}>
      <ActivityIndicator color="#e50914" />
      <Text style={loadStyles.text}>Loading episodes…</Text>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  text: { color: '#888', fontSize: 13 },
});
