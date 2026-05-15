import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width, height, radius = 6, style }: SkeletonProps) {
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function PosterRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={160} height={20} radius={4} style={{ marginLeft: 32, marginBottom: 12 }} />
      <View style={styles.posterRow}>
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} width={160} height={240} radius={6} style={{ marginRight: 12 }} />
        ))}
      </View>
    </View>
  );
}

export function HeroSkeleton() {
  return <Skeleton width={'100%'} height={360} radius={0} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: '#222' },
  row: { marginBottom: 24 },
  posterRow: { flexDirection: 'row', paddingHorizontal: 26 },
});
