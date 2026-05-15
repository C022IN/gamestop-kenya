import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';

interface FocusableCardProps {
  title: string;
  imageUri?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  onPress: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  hasTVPreferredFocus?: boolean;
  /** When true the card visually recedes (siblings of a focused card dim out) */
  dimmed?: boolean;
  /** Larger image (typically the backdrop) to warm into expo-image's cache
   *  while the card is focused, so navigating to Detail is instant. */
  prefetchUrl?: string;
}

const PREFETCH_DELAY_MS = 300;

const SPRING_CFG = { damping: 18, stiffness: 220, mass: 0.6, useNativeDriver: true };
const GLOW_CFG   = { duration: 200, useNativeDriver: true };
const DIM_CFG    = { duration: 220, useNativeDriver: true };

export default function FocusableCard({
  title,
  imageUri,
  subtitle,
  width = 160,
  height = 240,
  onPress,
  onFocus,
  onBlur,
  hasTVPreferredFocus = false,
  dimmed = false,
  prefetchUrl,
}: FocusableCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;
  const dim   = useRef(new Animated.Value(1)).current;
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // External "should this card recede" signal — animated independently of self-focus
  useEffect(() => {
    Animated.timing(dim, { toValue: dimmed ? 0.55 : 1, ...DIM_CFG }).start();
  }, [dim, dimmed]);

  function handleFocus() {
    Animated.spring(scale, { toValue: 1.08, ...SPRING_CFG }).start();
    Animated.timing(glow,  { toValue: 1,    ...GLOW_CFG   }).start();
    // Warm the detail backdrop into the image cache after a short debounce so
    // rapid D-pad scrubbing doesn't trigger 20 simultaneous fetches.
    if (prefetchUrl) {
      if (prefetchTimer.current) clearTimeout(prefetchTimer.current);
      prefetchTimer.current = setTimeout(() => {
        Image.prefetch(prefetchUrl).catch(() => {});
      }, PREFETCH_DELAY_MS);
    }
    onFocus?.();
  }
  function handleBlur() {
    Animated.spring(scale, { toValue: 1, ...SPRING_CFG }).start();
    Animated.timing(glow,  { toValue: 0, ...GLOW_CFG   }).start();
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
    onBlur?.();
  }

  const titleColor = glow.interpolate({ inputRange: [0, 1], outputRange: ['#bbb', '#fff'] });

  return (
    <Animated.View
      style={[
        styles.shadowWrap,
        {
          // Bottom-anchored scale: card grows upward like Netflix instead of
          // expanding equally in all directions from center.
          transformOrigin: 'bottom',
          transform: [{ scale }],
          opacity: dim,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        hasTVPreferredFocus={hasTVPreferredFocus}
        isTVSelectable
        style={styles.outerWrapper}
      >
        <View style={[styles.card, { width, height }]}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width, height }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.placeholder, { width, height }]}>
              <Text style={styles.placeholderText} numberOfLines={3}>{title}</Text>
            </View>
          )}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.glowBorder, { opacity: glow }]}
          />
        </View>
        <Animated.View style={[styles.info, { width }, { opacity: glow }]}>
          <View style={styles.infoBg} />
        </Animated.View>
        <View style={[styles.info, { width }]}>
          <Animated.Text style={[styles.titleText, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Animated.Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: { marginHorizontal: 6 },
  outerWrapper: { borderRadius: 8 },
  card: { borderRadius: 6, overflow: 'hidden', backgroundColor: '#1a1a2e' },
  glowBorder: { borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  placeholder: { backgroundColor: '#2a2a3e', alignItems: 'center', justifyContent: 'center', padding: 10 },
  placeholderText: { color: '#aaa', textAlign: 'center', fontSize: 13 },
  info: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: '#fff',
    borderRadius: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  infoBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a0003',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  titleText: { fontSize: 13, fontWeight: '600' },
  subtitle: { color: '#e50914', fontSize: 11, marginTop: 2 },
});
