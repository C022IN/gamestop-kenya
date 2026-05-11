import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import FocusableCard from './FocusableCard';
import { tmdbPoster } from '@/api/client';
import type { CatalogItem, TmdbItem } from '@/api/client';

type AnyItem = CatalogItem | TmdbItem;

interface MovieRowProps {
  title: string;
  items: AnyItem[];
  onSelect: (item: AnyItem) => void;
}

function getImage(item: AnyItem): string {
  if ('poster_url' in item && item.poster_url) return item.poster_url;
  if ('poster_path' in item) return tmdbPoster(item.poster_path);
  return '';
}

function getTitle(item: AnyItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return 'Unknown';
}

function getSlug(item: AnyItem): string {
  if ('slug' in item && item.slug) return item.slug;
  return String(item.id ?? '');
}

export default function MovieRow({ title, items, onSelect }: MovieRowProps) {
  if (!items.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map(item => (
          <FocusableCard
            key={getSlug(item)}
            title={getTitle(item)}
            imageUri={getImage(item)}
            onPress={() => onSelect(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 32,
    marginBottom: 12,
  },
  row: { paddingHorizontal: 26 },
});
