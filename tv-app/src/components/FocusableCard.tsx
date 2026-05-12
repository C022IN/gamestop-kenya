import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableHighlight, View, Text } from 'react-native';
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
    Animated.spring(scale, { toValue: 1.12, useNativeDriver: true, speed: 25, bounciness: 4 }).start();
  }

  function handleBlur() {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();
  }

  return (
    <View style={{ marginHorizontal: 6 }}>
      <TouchableHighlight
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        underlayColor="transparent"
        hasTVPreferredFocus={hasTVPreferredFocus}
      >
        <Animated.View
          style={[
            styles.card,
            { width, height: height + 52 },
            { transform: [{ scale }] },
            focused && styles.cardFocused,
          ]}
        >
          {focused && <View style={[styles.focusGlow, { width: width + 8, height: height + 60 }]} />}
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width, height, borderRadius: focused ? 0 : 6 }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.placeholder, { width, height }]}>
              <Text style={styles.placeholderText} numberOfLines={3}>{title}</Text>
            </View>
          )}
          <View style={[styles.info, focused && styles.infoFocused]}>
            <Text style={[styles.titleText, focused && styles.titleFocused]} numberOfLines={1}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            ) : null}
          </View>
        </Animated.View>
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardFocused: {
    borderColor: '#e50914',
    borderWidth: 3,
    borderRadius: 8,
  },
  focusGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 9, 20, 0.18)',
    zIndex: -1,
  },
  placeholder: {
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  placeholderText: { color: '#aaa', textAlign: 'center', fontSize: 13 },
  info: { paddingHorizontal: 6, paddingTop: 6, paddingBottom: 4, backgroundColor: '#1a1a2e' },
  infoFocused: { backgroundColor: '#2a0a0e' },
  titleText: { color: '#ccc', fontSize: 13, fontWeight: '600' },
  titleFocused: { color: '#fff' },
  subtitle: { color: '#888', fontSize: 11, marginTop: 2 },
});
