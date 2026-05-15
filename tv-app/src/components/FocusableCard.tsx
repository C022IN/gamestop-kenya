import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

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

const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };

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
  const [focused, setFocused] = useState(false);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    // Soft glow ring via shadow on iOS, elevation animated value on Android (cap'd to safe values)
    shadowOpacity: glow.value,
    shadowRadius: 16 * glow.value,
    elevation: Platform.OS === 'android' ? Math.round(glow.value * 12) : 0,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: focused ? '#fff' : 'transparent',
    backgroundColor: focused ? '#1a0003' : 'transparent',
  }));

  function handleFocus() {
    setFocused(true);
    scale.value = withSpring(1.08, SPRING);
    glow.value = withTiming(1, { duration: 200 });
    onFocus?.();
  }
  function handleBlur() {
    setFocused(false);
    scale.value = withSpring(1, SPRING);
    glow.value = withTiming(0, { duration: 200 });
  }

  return (
    <Animated.View style={[styles.shadowWrap, animatedStyle]}>
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
        </View>
        <Animated.View style={[styles.info, { width }, borderStyle]}>
          <Text style={[styles.titleText, focused && styles.titleFocused]} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    marginHorizontal: 6,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 6 },
  },
  outerWrapper: {
    borderRadius: 8,
  },
  card: {
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
  info: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
    borderWidth: 2,
    borderTopWidth: 0,
    borderRadius: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  titleText: { color: '#bbb', fontSize: 13, fontWeight: '600' },
  titleFocused: { color: '#fff' },
  subtitle: { color: '#e50914', fontSize: 11, marginTop: 2 },
});
