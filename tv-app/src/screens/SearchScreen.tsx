import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { searchMovies, tmdbPoster } from '@/api/client';
import FocusableCard from '@/components/FocusableCard';

type AnyItem = CatalogItem | TmdbItem;

interface Props {
  navigation: NavigationProp<any>;
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

function getSubtitle(item: AnyItem): string | undefined {
  if ('vote_average' in item && item.vote_average) {
    return `★ ${Number(item.vote_average).toFixed(1)}`;
  }
  return undefined;
}

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    const data = await searchMovies(query.trim());
    const all: AnyItem[] = [
      ...(data.libraryResults ?? []),
      ...(data.tmdbResults ?? []),
    ];
    setResults(all);
    setSearched(true);
    setLoading(false);
  }

  const CARD_WIDTH = 150;
  const NUM_COLUMNS = 5;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableHighlight
          style={styles.backBtn}
          underlayColor="#333"
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableHighlight>
        <Text style={styles.heading}>Search</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search for movies, series…"
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          returnKeyType="search"
          autoFocus
          hasTVPreferredFocus
          blurOnSubmit={false}
        />
        <TouchableHighlight style={styles.searchBtn} underlayColor="#cc0000" onPress={doSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableHighlight>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e50914" />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      )}

      {!loading && searched && results.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No results for "{query}"</Text>
        </View>
      )}

      {!loading && results.length > 0 && (
        <>
          <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
          <FlatList
            data={results}
            numColumns={NUM_COLUMNS}
            keyExtractor={(item, i) => `${getTitle(item)}-${i}`}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            renderItem={({ item, index }) => (
              <FocusableCard
                title={getTitle(item)}
                imageUri={getImage(item)}
                subtitle={getSubtitle(item)}
                width={CARD_WIDTH}
                height={225}
                hasTVPreferredFocus={index === 0}
                onPress={() => navigation.navigate('Detail', { item })}
              />
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
  },
  backText: { color: '#fff', fontSize: 16 },
  heading: { color: '#fff', fontSize: 24, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultCount: {
    color: '#888',
    fontSize: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#888', fontSize: 16 },
  emptyText: { color: '#888', fontSize: 18 },
  grid: {
    paddingHorizontal: 26,
    paddingBottom: 32,
  },
});
