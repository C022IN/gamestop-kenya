import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { tmdbBackdrop, fetchTitleLogo } from '@/api/client';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(width * 0.5);
const ROTATE_INTERVAL_MS = 8000;
const SPRING_CFG = { damping: 18, stiffness: 220, mass: 0.6, useNativeDriver: true };
const PARALLAX_PX = 20; // backdrop slides this far when D-pad nav moves focus

type HeroItem = CatalogItem | TmdbItem;

interface HeroBannerProps {
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
function getId(item: HeroItem): number | null {
  const n = Number(item.id);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function getMediaType(item: HeroItem): 'movie' | 'tv' {
  if ('media_type' in item && (item as TmdbItem).media_type === 'tv') return 'tv';
  if ('kind' in item && (item as CatalogItem).kind === 'series') return 'tv';
  return 'movie';
}

export default function HeroBanner({ item, items, onPlay, onMore }: HeroBannerProps) {
  const list = (items && items.length > 0 ? items : item ? [item] : []).slice(0, 5);
  const [idx, setIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [logo, setLogo] = useState<{ url: string; aspect: number } | null>(null);
  const [logoMissing, setLogoMissing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parallax: drives an X offset for the backdrop. -1 = Play focused (slide right), +1 = More focused (slide left).
  const parallaxX = useRef(new Animated.Value(0)).current;

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

  // Fetch the title logo whenever the slide changes
  useEffect(() => {
    if (!current) return;
    setLogo(null);
    setLogoMissing(false);
    const id = getId(current);
    if (!id) { setLogoMissing(true); return; }
    let cancelled = false;
    fetchTitleLogo(id, getMediaType(current)).then(result => {
      if (cancelled) return;
      if (result) setLogo(result); else setLogoMissing(true);
    });
    return () => { cancelled = true; };
  }, [current]);

  function animateParallax(dir: -1 | 0 | 1) {
    Animated.spring(parallaxX, { toValue: dir * PARALLAX_PX, ...SPRING_CFG }).start();
  }

  if (!current) return null;

  return (
    <View style={[styles.container, { height: HERO_HEIGHT }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: parallaxX }] }]}>
        <Image
          source={{ uri: getBackdrop(current) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          priority="high"
          transition={500}
        />
      </Animated.View>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)', '#000']}
        locations={[0, 0.4, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        {/* Logo image (preferred) → text title fallback once the fetch completes */}
        {logo ? (
          <Image
            source={{ uri: logo.url }}
            style={[styles.logo, { width: Math.min(360, 80 * logo.aspect), height: 80 }]}
            contentFit="contain"
            transition={200}
          />
        ) : logoMissing ? (
          <Text style={styles.title} numberOfLines={2}>{getTitle(current)}</Text>
        ) : (
          // Reserve the same vertical space while logo is loading so layout doesn't jump
          <View style={styles.logoPlaceholder} />
        )}
        {getOverview(current) ? (
          <Text style={styles.overview} numberOfLines={3}>{getOverview(current)}</Text>
        ) : null}
        <View style={styles.buttons}>
          <HeroButton
            label="▶  Play"
            primary
            hasTVPreferredFocus
            onPress={() => onPlay(current)}
            onFocus={() => { setFocused(true); animateParallax(-1); }}
            onBlur={() => { setFocused(false); animateParallax(0); }}
          />
          <HeroButton
            label="ⓘ  More Info"
            onPress={() => onMore(current)}
            onFocus={() => { setFocused(true); animateParallax(1); }}
            onBlur={() => { setFocused(false); animateParallax(0); }}
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
  const scale = useRef(new Animated.Value(1)).current;
  const [focused, setFocused] = useState(false);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onFocus={() => {
          setFocused(true);
          Animated.spring(scale, { toValue: 1.06, ...SPRING_CFG }).start();
          onFocus();
        }}
        onBlur={() => {
          setFocused(false);
          Animated.spring(scale, { toValue: 1, ...SPRING_CFG }).start();
          onBlur();
        }}
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
  container: { width, backgroundColor: '#000', overflow: 'hidden' },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 40 },
  logo: { marginBottom: 12 },
  logoPlaceholder: { height: 80, marginBottom: 12 },
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
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: '#fff', width: 24 },
});
