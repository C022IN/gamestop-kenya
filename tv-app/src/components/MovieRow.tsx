import React, { useRef, useState, useCallback } from 'react';
import { Animated, View, Text, FlatList, StyleSheet, TVFocusGuideView } from 'react-native';
import FocusableCard from './FocusableCard';
import type { AnyItem } from '@/utils/mediaItem';
import { getPosterUrl, getBackdropUrl, getTitle, getSubtitle } from '@/utils/mediaItem';

interface MovieRowProps {
  title: string;
  items: AnyItem[];
  onSelect: (item: AnyItem) => void;
  isFirstRow?: boolean;
}

const CARD_WIDTH = 180;
const CARD_MARGIN = 14;
const ITEM_SIZE = CARD_WIDTH + CARD_MARGIN;

const ROW_LIFT_PX = 12;
const LIFT_SPRING = { damping: 16, stiffness: 180, mass: 0.7, useNativeDriver: true };
// Debounce to avoid the row dipping briefly during card-to-card D-pad navigation
// (blur fires on A, then focus fires on B on the next tick).
const BLUR_DEBOUNCE_MS = 80;

function getKey(item: AnyItem, index: number): string {
  if ('slug' in item && item.slug) return item.slug;
  if (item.id !== undefined && item.id !== null) return String(item.id);
  return `idx-${index}`;
}

export default function MovieRow({ title, items, onSelect, isFirstRow = false }: MovieRowProps) {
  const listRef = useRef<FlatList<AnyItem>>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liftY = useRef(new Animated.Value(0)).current;
  const headingOpacity = useRef(new Animated.Value(0.85)).current;

  const setLifted = useCallback((lifted: boolean) => {
    Animated.spring(liftY, { toValue: lifted ? -ROW_LIFT_PX : 0, ...LIFT_SPRING }).start();
    Animated.timing(headingOpacity, {
      toValue: lifted ? 1 : 0.85,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [liftY, headingOpacity]);

  const onCardFocus = useCallback((index: number) => {
    if (blurTimer.current) { clearTimeout(blurTimer.current); blurTimer.current = null; }
    setFocusedIndex(prev => {
      if (prev === null) setLifted(true);
      return index;
    });
  }, [setLifted]);

  const onCardBlur = useCallback(() => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => {
      setFocusedIndex(null);
      setLifted(false);
      blurTimer.current = null;
    }, BLUR_DEBOUNCE_MS);
  }, [setLifted]);

  if (!items.length) return null;

  return (
    <TVFocusGuideView style={styles.container} autoFocus trapFocusLeft={false} trapFocusRight={false}>
      <Animated.Text style={[styles.heading, { opacity: headingOpacity }]}>{title}</Animated.Text>
      <Animated.View style={{ transform: [{ translateY: liftY }] }}>
        <FlatList
          ref={listRef}
          data={items}
          horizontal
          keyExtractor={getKey}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={3}
          removeClippedSubviews={false}
          getItemLayout={(_, index) => ({
            length: ITEM_SIZE,
            offset: ITEM_SIZE * index + 26,
            index,
          })}
          onScrollToIndexFailed={info => {
            listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
          }}
          renderItem={({ item, index }) => (
            <FocusableCard
              title={getTitle(item)}
              imageUri={getPosterUrl(item)}
              subtitle={getSubtitle(item)}
              hasTVPreferredFocus={isFirstRow && index === 0}
              dimmed={focusedIndex !== null && focusedIndex !== index}
              prefetchUrl={getBackdropUrl(item)}
              onPress={() => onSelect(item)}
              onFocus={() => {
                onCardFocus(index);
                listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
              }}
              onBlur={() => onCardBlur()}
            />
          )}
        />
      </Animated.View>
    </TVFocusGuideView>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 28 },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700', marginLeft: 32, marginBottom: 12 },
  row: { paddingHorizontal: 26, paddingVertical: 16 },
});
