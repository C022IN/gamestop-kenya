import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
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

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => { setFocused(true); onFocus?.(); }}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      isTVSelectable
      tvParallaxProperties={{ enabled: true, magnification: 1.08 }}
      style={[
        styles.outerWrapper,
        focused && styles.outerFocused,
      ]}
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
      <View style={[styles.info, { width }, focused && styles.infoFocused]}>
        <Text style={[styles.titleText, focused && styles.titleFocused]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
    </Pressable>
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
    paddingBottom: 6,
    backgroundColor: '#111',
  },
  infoFocused: { backgroundColor: '#1a0003' },
  titleText: { color: '#bbb', fontSize: 13, fontWeight: '600' },
  titleFocused: { color: '#fff' },
  subtitle: { color: '#e50914', fontSize: 11, marginTop: 2 },
});
