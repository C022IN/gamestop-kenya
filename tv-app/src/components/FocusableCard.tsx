import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, Text, Platform } from 'react-native';
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
    Animated.spring(scale, { toValue: 1.08, ...SPRING_CFG }).start();
    onFocus?.();
  }
  function handleBlur() {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, ...SPRING_CFG }).start();
  }

  return (
    <Animated.View style={[
      styles.shadowWrap,
      { transform: [{ scale }] },
      focused && Platform.OS === 'android' && { elevation: 12 },
    ]}>
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
        <View style={[styles.info, { width }, focused && styles.infoBorderFocused]}>
          <Text style={[styles.titleText, focused && styles.titleFocused]} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    marginHorizontal: 6,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0,
    shadowRadius: 0,
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
    borderColor: 'transparent',
    borderRadius: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: 'transparent',
  },
  infoBorderFocused: {
    borderColor: '#fff',
    backgroundColor: '#1a0003',
  },
  titleText: { color: '#bbb', fontSize: 13, fontWeight: '600' },
  titleFocused: { color: '#fff' },
  subtitle: { color: '#e50914', fontSize: 11, marginTop: 2 },
});
