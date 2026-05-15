import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, type ViewStyle, type TextStyle } from 'react-native';

interface FocusableButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  hasTVPreferredFocus?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SPRING_CFG = { damping: 18, stiffness: 220, mass: 0.6, useNativeDriver: true };

export default function FocusableButton({
  label,
  onPress,
  variant = 'secondary',
  hasTVPreferredFocus = false,
  style,
  textStyle,
}: FocusableButtonProps) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const baseColors =
    variant === 'primary' ? styles.primary
      : variant === 'ghost' ? styles.ghost
      : styles.secondary;
  const baseTextColor =
    variant === 'primary' ? styles.primaryText
      : variant === 'ghost' ? styles.ghostText
      : styles.secondaryText;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onFocus={() => {
          setFocused(true);
          Animated.spring(scale, { toValue: 1.06, ...SPRING_CFG }).start();
        }}
        onBlur={() => {
          setFocused(false);
          Animated.spring(scale, { toValue: 1, ...SPRING_CFG }).start();
        }}
        hasTVPreferredFocus={hasTVPreferredFocus}
        isTVSelectable
        style={[styles.base, baseColors, focused && styles.focused, style]}
      >
        <Text style={[styles.text, baseTextColor, focused && styles.textFocused, textStyle]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  primary: { backgroundColor: '#e50914' },
  secondary: { backgroundColor: '#1a1a1a', borderColor: '#333' },
  ghost: { backgroundColor: 'transparent' },
  focused: { borderColor: '#fff', backgroundColor: '#2a2a2a' },
  text: { fontSize: 14, fontWeight: '600' },
  primaryText: { color: '#fff' },
  secondaryText: { color: '#ddd' },
  ghostText: { color: '#ccc' },
  textFocused: { color: '#fff' },
});
