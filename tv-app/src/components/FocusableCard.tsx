import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';

// hasTVPreferredFocus is a valid Android TV prop missing from RN TS types
const TVPressable = Pressable as any;

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
  const scale = useRef(new Animated.Value(1)).current;

  function handleFocus() {
    setFocused(true);
    onFocus?.();
    Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, speed: 22, bounciness: 3 }).start();
  }

  function handleBlur() {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22 }).start();
  }

  return (
    // Focus border lives on this outer View — NOT inside overflow:hidden
    <View style={[styles.outerWrapper, focused && styles.outerFocused]}>
      <TVPressable
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        hasTVPreferredFocus={hasTVPreferredFocus}
        android_ripple={null}
      >
        <Animated.View style={[{ width, height: height + 52 }, { transform: [{ scale }] }]}>
          {/* Inner card — overflow hidden for image clipping only */}
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
          <View style={[styles.info, focused && styles.infoFocused]}>
            <Text style={[styles.titleText, focused && styles.titleFocused]} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </Animated.View>
      </TVPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 6,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  outerFocused: {
    borderColor: '#e50914',
    // Shadow glow effect
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 12,
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
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: '#111',
  },
  infoFocused: { backgroundColor: '#2a0a0e' },
  titleText: { color: '#bbb', fontSize: 13, fontWeight: '600' },
  titleFocused: { color: '#fff' },
  subtitle: { color: '#e50914', fontSize: 11, marginTop: 2 },
});
