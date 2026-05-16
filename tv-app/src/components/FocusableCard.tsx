import React, { useEffect, useRef, useState } from 'react';
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
  dimmed?: boolean;
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
  width = 180,
  height = 270,
  onPress,
  onFocus,
  onBlur,
  hasTVPreferredFocus = false,
  dimmed = false,
  prefetchUrl,
}: FocusableCardProps) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;
  const dim   = useRef(new Animated.Value(1)).current;
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(dim, { toValue: dimmed ? 0.55 : 1, ...DIM_CFG }).start();
  }, [dim, dimmed]);

  function handleFocus() {
    setFocused(true);
    Animated.spring(scale, { toValue: 1.08, ...SPRING_CFG }).start();
    Animated.timing(glow,  { toValue: 1, ...GLOW_CFG }).start();
    if (prefetchUrl) {
      if (prefetchTimer.current) clearTimeout(prefetchTimer.current);
      prefetchTimer.current = setTimeout(() => {
        Image.prefetch(prefetchUrl).catch(() => {});
      }, PREFETCH_DELAY_MS);
    }
    onFocus?.();
  }

  function handleBlur() {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, ...SPRING_CFG }).start();
    Animated.timing(glow,  { toValue: 0, ...GLOW_CFG }).start();
    if (prefetchTimer.current) { clearTimeout(prefetchTimer.current); prefetchTimer.current = null; }
    onBlur?.();
  }

  const titleColor = glow.interpolate({ inputRange: [0, 1], outputRange: ['#bbb', '#fff'] });

  return (
    <Animated.View style={[styles.wrap, { transformOrigin: 'bottom', transform: [{ scale }], opacity: dim }]}>
      <Pressable
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        hasTVPreferredFocus={hasTVPreferredFocus}
        isTVSelectable
        style={styles.pressable}
      >
        {/* Poster */}
        <View style={[styles.poster, { width, height }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width, height }} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.placeholder, { width, height }]}>
              <Text style={styles.placeholderText} numberOfLines={3}>{title}</Text>
            </View>
          )}
        </View>

        {/* Label row — clean text below poster, no border box */}
        <View style={[styles.label, { width }]}>
          <Animated.Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Animated.Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        {/* Glow border overlay on the poster — fades in/out, native driver */}
        <Animated.View
          pointerEvents="none"
          style={[styles.glowBorder, { width, height }, { opacity: glow }]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 6 },
  pressable: { borderRadius: 6 },
  poster: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  placeholder: {
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  placeholderText: { color: '#aaa', textAlign: 'center', fontSize: 13 },
  label: {
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 2,
  },
  title: { fontSize: 13, fontWeight: '600' },
  subtitle: { color: '#e50914', fontSize: 11, marginTop: 2 },
  // Absolutely positioned so it overlays the poster without affecting layout
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
  },
});
