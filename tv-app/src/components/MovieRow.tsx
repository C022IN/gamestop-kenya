import React, { useRef, useState, useCallback } from 'react';
import { Animated, View, Text, FlatList, StyleSheet, TVFocusGuideView } from 'react-native';
import FocusableCard from './FocusableCard';
import { tmdbPoster, tmdbBackdrop } from '@/api/client';
import type { CatalogItem, TmdbItem } from '@/api/client';

type AnyItem = CatalogItem | TmdbItem;

interface MovieRowProps {
  title: string;
  items: AnyItem[];
  onSelect: (item: AnyItem) => void;
  isFirstRow?: boolean;
}

const CARD_WIDTH = 160;
const CARD_MARGIN = 12;
const ITEM_SIZE = CARD_WIDTH + CARD_MARGIN;

// Netflix-style row lift: focused row rises slightly toward viewer.
const ROW_LIFT_PX = 24;
const LIFT_SPRING = { damping: 16, stiffness: 180, mass: 0.7, useNativeDriver: true };
// Time to wait after a blur before deciding the row has truly lost focus.
// Card-to-card navigation fires blur(A) then focus(B) on the next tick — this
// debounce prevents the row from dipping briefly between transitions.
const BLUR_DEBOUNCE_MS = 80;

function getImage(item: AnyItem): string {
  if ('poster_url' in item && item.poster_url) return item.poster_url;
  if ('poster_path' in item) return tmdbPoster((item as TmdbItem).poster_path);
  return '';
}

function getBackdrop(item: AnyItem): string {
  if ('backdrop_url' in item && (item as any).backdrop_url) return (item as any).backdrop_url;
  if ('backdrop_path' in item) return tmdbBackdrop((item as TmdbItem).backdrop_path);
  return '';
}

function getTitle(item: AnyItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return 'Unknown';
}

function getKey(item: AnyItem, index: number): string {
  if ('slug' in item && item.slug) return item.slug;
  if (item.id !== undefined && item.id !== null) return String(item.id);
  return `idx-${index}`;
}

function getSubtitle(item: AnyItem): string | undefined {
  const v = (item as any).vote_average;
  return v ? `★ ${Number(v).toFixed(1)}` : undefined;
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
              imageUri={getImage(item)}
              subtitle={getSubtitle(item)}
              hasTVPreferredFocus={isFirstRow && index === 0}
              dimmed={focusedIndex !== null && focusedIndex !== index}
              prefetchUrl={getBackdrop(item)}
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
  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 32,
    marginBottom: 12,
  },
  row: { paddingHorizontal: 26, paddingVertical: 16 },
});
