import React, { useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';

interface Track {
  id: string;
  language?: string;
  label?: string;
  name?: string;
}

interface TrackPickerProps {
  title: string;
  tracks: Track[];
  currentId: string | null;
  onSelect: (track: Track | null) => void;
  onClose: () => void;
  includeOff?: boolean;
}

const SPRING_CFG = { damping: 18, stiffness: 220, mass: 0.6, useNativeDriver: true };

export default function TrackPicker({
  title,
  tracks,
  currentId,
  onSelect,
  onClose,
  includeOff = true,
}: TrackPickerProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.heading}>{title}</Text>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {includeOff && (
            <Row
              label="Off"
              active={currentId === null}
              hasTVPreferredFocus={currentId === null}
              onPress={() => { onSelect(null); onClose(); }}
            />
          )}
          {tracks.map((t, i) => (
            <Row
              key={t.id ?? i}
              label={trackLabel(t)}
              active={t.id === currentId}
              hasTVPreferredFocus={!includeOff && i === 0 && currentId === null}
              onPress={() => { onSelect(t); onClose(); }}
            />
          ))}
        </ScrollView>
        <View style={styles.closeRow}>
          <Row label="← Close" active={false} onPress={onClose} />
        </View>
      </View>
    </View>
  );
}

function Row({
  label,
  active,
  onPress,
  hasTVPreferredFocus,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onFocus={() => {
          setFocused(true);
          Animated.spring(scale, { toValue: 1.02, ...SPRING_CFG }).start();
        }}
        onBlur={() => {
          setFocused(false);
          Animated.spring(scale, { toValue: 1, ...SPRING_CFG }).start();
        }}
        hasTVPreferredFocus={hasTVPreferredFocus}
        isTVSelectable
        style={[styles.row, active && styles.rowActive, focused && styles.rowFocused]}
      >
        <Text style={styles.checkmark}>{active ? '✓' : ' '}</Text>
        <Text style={[styles.rowText, focused && styles.rowTextFocused]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function trackLabel(t: Track): string {
  if (t.label) return t.label;
  if (t.name) return t.name;
  if (t.language) {
    try {
      const dn = new (Intl as any).DisplayNames([navigatorLang()], { type: 'language' });
      const friendly = dn.of(t.language);
      if (friendly) return friendly;
    } catch { /* fallback */ }
    return t.language.toUpperCase();
  }
  return 'Unknown';
}

function navigatorLang() {
  return 'en';
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    width: 480,
    maxHeight: 540,
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 24,
  },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  list: { paddingBottom: 4 },
  closeRow: { borderTopWidth: 1, borderTopColor: '#222', paddingTop: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  rowActive: { backgroundColor: 'rgba(229,9,20,0.15)' },
  rowFocused: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.07)' },
  checkmark: { color: '#e50914', fontSize: 16, width: 20, textAlign: 'center' },
  rowText: { color: '#ccc', fontSize: 16, fontWeight: '500' },
  rowTextFocused: { color: '#fff' },
});
