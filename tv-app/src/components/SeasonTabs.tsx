import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

interface Season {
  season_number: number;
  name: string;
  episode_count: number;
}

interface SeasonTabsProps {
  seasons: Season[];
  selected: number;
  onSelect: (seasonNumber: number) => void;
}

export default function SeasonTabs({ seasons, selected, onSelect }: SeasonTabsProps) {
  const listRef = useRef<FlatList<Season>>(null);
  if (!seasons.length) return null;

  return (
    <FlatList
      ref={listRef}
      data={seasons}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={s => String(s.season_number)}
      contentContainerStyle={styles.row}
      // Fixed layout so scrollToIndex is instant without measurement fallback.
      getItemLayout={(_, index) => ({ length: PILL_SIZE, offset: PILL_SIZE * index + 40, index })}
      renderItem={({ item: s, index }) => (
        <SeasonPill
          label={`Season ${s.season_number}`}
          active={s.season_number === selected}
          onPress={() => onSelect(s.season_number)}
          onFocus={() => {
            // Auto-scroll the focused pill into view — FlatList handles this
            // correctly; ScrollView has no equivalent for TV focus events.
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.4 });
          }}
        />
      )}
    />
  );
}

// Approximate pill width (label + padding) used for getItemLayout.
const PILL_SIZE = 130;

function SeasonPill({
  label,
  active,
  onPress,
  onFocus,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  onFocus: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => { setFocused(true); onFocus(); }}
      onBlur={() => setFocused(false)}
      isTVSelectable
      style={[
        styles.pill,
        active   && styles.pillActive,
        focused  && styles.pillFocused,
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
  pillActive:  { backgroundColor: '#fff' },
  pillFocused: { borderColor: '#e50914' },
  pillText:       { color: '#ccc', fontSize: 14, fontWeight: '600' },
  pillTextActive: { color: '#000' },
});
