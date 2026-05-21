import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { fetchTitleLogo, fetchTrailerKey } from '@/api/client';
import type { AnyItem } from '@/utils/mediaItem';
import { getBackdropUrl, getTitle, getOverview, getNumericId, getMediaType } from '@/utils/mediaItem';
import { SPRING_CFG, CROSSFADE_CFG } from '@/constants/animation';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(width * 0.58);
const ROTATE_INTERVAL_MS = 8000;
const PARALLAX_PX = 20;

// Auto-preview: wait before fetching + showing the trailer so rapid rotation
// doesn't trigger needless YouTube loads.
const PREVIEW_DELAY_MS = 2500;
const PREVIEW_FADE_IN_DELAY_MS = 900;

// NOTE: Embedded YouTube auto-preview violates YouTube's Terms of Service for
// unattended playback. Acceptable for sideload distribution.
// MUST be removed before Play Store submission. See tv-app/STORE_SUBMISSION.md.

interface HeroBannerProps {
  item?: AnyItem;
  items?: AnyItem[];
  onPlay: (item: AnyItem) => void;
  onMore: (item: AnyItem) => void;
}

export default function HeroBanner({ item, items, onPlay, onMore }: HeroBannerProps) {
  const list = (items && items.length > 0 ? items : item ? [item] : []).slice(0, 5);
  const [idx, setIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [logo, setLogo] = useState<{ url: string; aspect: number } | null>(null);
  const [logoMissing, setLogoMissing] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parallaxX    = useRef(new Animated.Value(0)).current;
  const trailerOpacity = useRef(new Animated.Value(0)).current;

  const current = list[idx];

  useEffect(() => {
    if (list.length <= 1 || focused) return;
    timerRef.current = setTimeout(() => {
      setIdx(i => (i + 1) % list.length);
    }, ROTATE_INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, focused, list.length]);

  useEffect(() => {
    if (!current) return;
    setLogo(null);
    setLogoMissing(false);
    const id = getNumericId(current);
    if (!id) { setLogoMissing(true); return; }
    let cancelled = false;
    fetchTitleLogo(id, getMediaType(current)).then(result => {
      if (cancelled) return;
      if (result) setLogo(result); else setLogoMissing(true);
    });
    return () => { cancelled = true; };
  }, [current]);

  useEffect(() => {
    setTrailerKey(null);
    setShowTrailer(false);
    if (!current || focused) return;
    const id = getNumericId(current);
    if (!id) return;

    let cancelled = false;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    const fetchTimer = setTimeout(async () => {
      const key = await fetchTrailerKey(id, getMediaType(current));
      if (cancelled || !key) return;
      setTrailerKey(key);
      fadeTimer = setTimeout(() => {
        if (!cancelled) setShowTrailer(true);
      }, PREVIEW_FADE_IN_DELAY_MS);
    }, PREVIEW_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(fetchTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [current, focused]);

  useEffect(() => {
    Animated.timing(trailerOpacity, {
      toValue: showTrailer ? 1 : 0,
      ...CROSSFADE_CFG,
    }).start();
  }, [showTrailer, trailerOpacity]);

  function animateParallax(dir: -1 | 0 | 1) {
    Animated.spring(parallaxX, { toValue: dir * PARALLAX_PX, ...SPRING_CFG }).start();
  }

  if (!current) return null;

  return (
    <View style={[styles.container, { height: HERO_HEIGHT }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: parallaxX }] }]}>
        <Image
          source={{ uri: getBackdropUrl(current) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          priority="high"
          transition={500}
        />
      </Animated.View>
      {trailerKey && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: trailerOpacity }]}
        >
          <WebView
            source={{
              uri: `https://www.youtube-nocookie.com/embed/${trailerKey}` +
                `?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}` +
                `&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1`,
            }}
            style={styles.trailerView}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            originWhitelist={['*']}
            mixedContentMode="always"
          />
        </Animated.View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)', '#000']}
        locations={[0, 0.4, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
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
  trailerView: { flex: 1, backgroundColor: 'transparent' },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 48, paddingBottom: 48, paddingTop: 0 },
  logo: { marginBottom: 14 },
  logoPlaceholder: { height: 80, marginBottom: 14 },
  title: { color: '#fff', fontSize: 40, fontWeight: '800', marginBottom: 10 },
  overview: { color: '#ddd', fontSize: 16, lineHeight: 24, marginBottom: 24, maxWidth: 640 },
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
  dots: { position: 'absolute', bottom: 18, right: 30, flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: '#fff', width: 24 },
});
