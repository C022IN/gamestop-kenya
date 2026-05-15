import React, { useRef } from 'react';
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
  hasTVPreferredFocus?: boolean;
}

const SPRING_CFG = { damping: 18, stiffness: 220, mass: 0.6, useNativeDriver: true };
const GLOW_CFG   = { duration: 200, useNativeDriver: true };

export default function FocusableCard({
  title,
  imageUri,
  subtitle,
  width = 160,
  height = 240,
  onPress,
  onFocus,
  hasTVPreferredFocus = false,
}: FocusableCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  function handleFocus() {
    Animated.spring(scale, { toValue: 1.08, ...SPRING_CFG }).start();
    Animated.timing(glow,  { toValue: 1,    ...GLOW_CFG   }).start();
    onFocus?.();
  }
  function handleBlur() {
    Animated.spring(scale, { toValue: 1, ...SPRING_CFG }).start();
    Animated.timing(glow,  { toValue: 0, ...GLOW_CFG   }).start();
  }

  // Border overlay fades in via opacity (native driver compatible)
  const borderOpacity = glow;
  const titleColor = glow.interpolate({ inputRange: [0, 1], outputRange: ['#bbb', '#fff'] });

  return (
    <Animated.View style={[styles.shadowWrap, { transform: [{ scale }] }]}>
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
          {/* Glow border overlay — fades in on focus, native driver via opacity */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.glowBorder,
              { opacity: borderOpacity },
            ]}
          />
        </View>
        <Animated.View style={[styles.info, { width }, { opacity: borderOpacity }]}>
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
  shadowWrap: {
    marginHorizontal: 6,
  },
  outerWrapper: {
    borderRadius: 8,
  },
  card: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  glowBorder: {
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  placeholder: {
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
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
