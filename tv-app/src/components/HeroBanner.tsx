import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { tmdbBackdrop } from '@/api/client';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(width * 0.5);
const ROTATE_INTERVAL_MS = 8000;
const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };

type HeroItem = CatalogItem | TmdbItem;

interface HeroBannerProps {
  // Accept either a single item (static) or an array (auto-rotates every 8s when not focused).
  item?: HeroItem;
  items?: HeroItem[];
  onPlay: (item: HeroItem) => void;
  onMore: (item: HeroItem) => void;
}

function getBackdrop(item: HeroItem): string {
  if ('backdrop_url' in item && item.backdrop_url) return item.backdrop_url;
  if ('backdrop_path' in item) return tmdbBackdrop((item as TmdbItem).backdrop_path);
  if ('poster_url' in item && item.poster_url) return item.poster_url;
  return '';
}
function getTitle(item: HeroItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return '';
}
function getOverview(item: HeroItem): string {
  return ('overview' in item ? item.overview : '') ?? '';
}

export default function HeroBanner({ item, items, onPlay, onMore }: HeroBannerProps) {
  const list = (items && items.length > 0 ? items : item ? [item] : []).slice(0, 5);
  const [idx, setIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = list[idx];

  // Auto-advance while no hero button is focused
  useEffect(() => {
    if (list.length <= 1) return;
    if (focused) return;
    timerRef.current = setTimeout(() => {
      setIdx(i => (i + 1) % list.length);
    }, ROTATE_INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, focused, list.length]);

  if (!current) return null;

  return (
    <View style={[styles.container, { height: HERO_HEIGHT }]}>
      <Image
        // Keyed by URI so expo-image's transition triggers between slides
        source={{ uri: getBackdrop(current) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        priority="high"
        transition={500}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)', '#000']}
        locations={[0, 0.4, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{getTitle(current)}</Text>
        {getOverview(current) ? (
          <Text style={styles.overview} numberOfLines={3}>{getOverview(current)}</Text>
        ) : null}
        <View style={styles.buttons}>
          <HeroButton
            label="▶  Play"
            primary
            hasTVPreferredFocus
            onPress={() => onPlay(current)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <HeroButton
            label="ⓘ  More Info"
            onPress={() => onMore(current)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
      </View>
      {list.length > 1 && (
        <View style={styles.dots}>
          {list.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

function HeroButton({
  label,
  primary = false,
  hasTVPreferredFocus,
  onPress,
  onFocus,
  onBlur,
}: {
  label: string;
  primary?: boolean;
  hasTVPreferredFocus?: boolean;
  onPress: () => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const scale = useSharedValue(1);
  const [focused, setFocused] = useState(false);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onFocus={() => { setFocused(true); scale.value = withSpring(1.06, SPRING); onFocus(); }}
        onBlur={() => { setFocused(false); scale.value = withSpring(1, SPRING); onBlur(); }}
        hasTVPreferredFocus={hasTVPreferredFocus}
        isTVSelectable
        style={[
          styles.btn,
          primary ? styles.playBtn : styles.moreBtn,
          focused && styles.btnFocused,
        ]}
      >
        <Text style={primary ? styles.playBtnText : styles.moreBtnText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { width, backgroundColor: '#000' },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 40 },
  title: { color: '#fff', fontSize: 38, fontWeight: '800', marginBottom: 8 },
  overview: { color: '#ddd', fontSize: 15, lineHeight: 22, marginBottom: 20, maxWidth: 560 },
  buttons: { flexDirection: 'row', gap: 16 },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 4,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  btnFocused: { borderColor: '#fff' },
  playBtn: { backgroundColor: '#e50914' },
  moreBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  playBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  moreBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  dots: {
    position: 'absolute',
    bottom: 18,
    right: 30,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: { backgroundColor: '#fff', width: 24 },
});
