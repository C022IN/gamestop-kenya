import React, { useRef } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
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

function getKey(item: AnyItem): string {
  if ('slug' in item && item.slug) return item.slug;
  return String(item.id ?? Math.random());
}

function getSubtitle(item: AnyItem): string | undefined {
  if ('vote_average' in item && item.vote_average) {
    return `★ ${Number(item.vote_average).toFixed(1)}`;
  }
  return undefined;
}

export default function MovieRow({ title, items, onSelect, isFirstRow = false }: MovieRowProps) {
  const listRef = useRef<FlatList<AnyItem>>(null);

  if (!items.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{title}</Text>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        keyExtractor={getKey}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: 172,
          offset: 172 * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <FocusableCard
            key={getKey(item)}
            title={getTitle(item)}
            imageUri={getImage(item)}
            subtitle={getSubtitle(item)}
            hasTVPreferredFocus={isFirstRow && index === 0}
            onPress={() => onSelect(item)}
            onFocus={() => {
              listRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.3,
              });
            }}
          />
        )}
      />
    </View>
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
