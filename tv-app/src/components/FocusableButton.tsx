import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle, type TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface FocusableButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  hasTVPreferredFocus?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };

export default function FocusableButton({
  label,
  onPress,
  variant = 'secondary',
  hasTVPreferredFocus = false,
  style,
  textStyle,
}: FocusableButtonProps) {
  const [focused, setFocused] = useState(false);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const baseColors =
    variant === 'primary' ? styles.primary
      : variant === 'ghost' ? styles.ghost
      : styles.secondary;
  const baseTextColor =
    variant === 'primary' ? styles.primaryText
      : variant === 'ghost' ? styles.ghostText
      : styles.secondaryText;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onFocus={() => { setFocused(true); scale.value = withSpring(1.06, SPRING); }}
        onBlur={() => { setFocused(false); scale.value = withSpring(1, SPRING); }}
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
