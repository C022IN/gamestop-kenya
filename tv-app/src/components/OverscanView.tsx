import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useProjector } from '@/context/ProjectorContext';
import { projectorInset } from '@/constants/projector';

// Wraps the whole app. In Projector Mode it pads every edge inward so projector
// overscan can't crop the nav bar, player controls, or subtitles. When off it's
// a plain black flex container — zero layout change.
export default function OverscanView({ children }: { children: React.ReactNode }) {
  const { on } = useProjector();
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.root, on ? projectorInset(width, height) : null]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
});
