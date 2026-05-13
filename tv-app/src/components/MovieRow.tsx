import React, { useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TVFocusGuideView } from 'react-native';
import FocusableCard from './FocusableCard';
import { tmdbPoster } from '@/api/client';
import type { CatalogItem, TmdbItem } from '@/api/client';

type AnyItem = CatalogItem | TmdbItem;

interface MovieRowProps {
  title: string;
  items: AnyItem[];
  onSelect: (item: AnyItem) => void;
  isFirstRow?: boolean;
}

const CARD_WIDTH = 160;
const CARD_MARGIN = 12; // 6 * 2
const ITEM_SIZE = CARD_WIDTH + CARD_MARGIN;

function getImage(item: AnyItem): string {
  if ('poster_url' in item && item.poster_url) return item.poster_url;
  if ('poster_path' in item) return tmdbPoster((item as TmdbItem).poster_path);
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

  if (!items.length) return null;

  return (
    <TVFocusGuideView style={styles.container} autoFocus trapFocusLeft={false} trapFocusRight={false}>
      <Text style={styles.heading}>{title}</Text>
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
            onPress={() => onSelect(item)}
            onFocus={() => {
              listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
            }}
          />
        )}
      />
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
  row: { paddingHorizontal: 26 },
});
