import React, { useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TVFocusGuideView } from 'react-native';
import { Image } from 'expo-image';
import type { ResumeEntry } from '@/api/client';

interface Props {
  entries: ResumeEntry[];
  onSelect: (entry: ResumeEntry) => void;
}

const TILE_WIDTH = 280;
const TILE_HEIGHT = 158;
const TILE_GAP = 12;
const ITEM_SIZE = TILE_WIDTH + TILE_GAP;

export default function ContinueWatchingRow({ entries, onSelect }: Props) {
  const listRef = useRef<FlatList<ResumeEntry>>(null);
  if (!entries.length) return null;

  return (
    <TVFocusGuideView style={styles.container} autoFocus trapFocusLeft={false} trapFocusRight={false}>
      <Text style={styles.heading}>Continue Watching</Text>
      <FlatList
        ref={listRef}
        data={entries}
        horizontal
        keyExtractor={(e, i) => `${e.id}-${e.season ?? 0}-${e.episode ?? 0}-${i}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        initialNumToRender={5}
        windowSize={3}
        getItemLayout={(_, index) => ({ length: ITEM_SIZE, offset: ITEM_SIZE * index + 26, index })}
        renderItem={({ item, index }) => (
          <ResumeTile
            entry={item}
            hasTVPreferredFocus={index === 0}
            onPress={() => onSelect(item)}
            onFocus={() => {
              listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
            }}
          />
        )}
      />
    </TVFocusGuideView>
  );
}

function ResumeTile({
  entry,
  onPress,
  onFocus,
  hasTVPreferredFocus,
}: {
  entry: ResumeEntry;
  onPress: () => void;
  onFocus?: () => void;
  hasTVPreferredFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  // Best-effort progress percentage. We don't know duration here, so
  // estimate using 90-minute movies / 45-minute episodes as fallback.
  const assumedDurationMs = entry.mediaType === 'tv' ? 45 * 60_000 : 90 * 60_000;
  const pct = Math.max(0.02, Math.min(0.98, entry.positionMs / assumedDurationMs));
  const subtitle = entry.mediaType === 'tv' && entry.season != null
    ? `S${entry.season}  E${entry.episode}`
    : 'Movie';

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => { setFocused(true); onFocus?.(); }}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      isTVSelectable
      style={[styles.tileWrap, focused && styles.tileWrapFocused]}
    >
      <View style={styles.thumb}>
        {entry.backdropUrl ? (
          <Image source={{ uri: entry.backdropUrl }} style={styles.image} contentFit="cover" transition={150} />
        ) : entry.posterUrl ? (
          <Image source={{ uri: entry.posterUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.fallback]}>
            <Text style={styles.fallbackText}>{(entry.title || '?').charAt(0)}</Text>
          </View>
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
        {focused && (
          <View style={styles.playOverlay}>
            <Text style={styles.playGlyph}>▶</Text>
          </View>
        )}
      </View>
      <Text style={[styles.title, focused && styles.titleFocused]} numberOfLines={1}>{entry.title || 'Untitled'}</Text>
      <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 28 },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700', marginLeft: 32, marginBottom: 12 },
  row: { paddingHorizontal: 26 },
  tileWrap: {
    marginHorizontal: 6,
    width: TILE_WIDTH,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  tileWrapFocused: { borderColor: '#fff' },
  thumb: { width: TILE_WIDTH, height: TILE_HEIGHT, borderRadius: 4, overflow: 'hidden', backgroundColor: '#1a1a2e' },
  image: { width: TILE_WIDTH, height: TILE_HEIGHT },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: '#666', fontSize: 40, fontWeight: '700' },
  progressTrack: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: { height: '100%', backgroundColor: '#e50914' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  playGlyph: { color: '#fff', fontSize: 36 },
  title: { color: '#bbb', fontSize: 13, fontWeight: '600', marginTop: 6, paddingHorizontal: 4 },
  titleFocused: { color: '#fff' },
  subtitle: { color: '#888', fontSize: 11, marginTop: 2, paddingHorizontal: 4 },
});
