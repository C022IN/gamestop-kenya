import React, { useState } from 'react';
import { Pressable, StyleSheet, ScrollView, Text } from 'react-native';

interface SeasonTabsProps {
  seasons: { season_number: number; name: string; episode_count: number }[];
  selected: number;
  onSelect: (seasonNumber: number) => void;
}

export default function SeasonTabs({ seasons, selected, onSelect }: SeasonTabsProps) {
  if (!seasons.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {seasons.map(s => (
        <SeasonPill
          key={s.season_number}
          label={`Season ${s.season_number}`}
          active={s.season_number === selected}
          onPress={() => onSelect(s.season_number)}
        />
      ))}
    </ScrollView>
  );
}

function SeasonPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      isTVSelectable
      style={[
        styles.pill,
        active && styles.pillActive,
        focused && styles.pillFocused,
      ]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 40, paddingVertical: 12 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillActive: { backgroundColor: '#fff' },
  pillFocused: { borderColor: '#e50914' },
  pillText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  pillTextActive: { color: '#000' },
});
