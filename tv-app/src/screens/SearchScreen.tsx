import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import type { AnyItem } from '@/utils/mediaItem';
import { getPosterUrl, getTitle, getSubtitle, getId, getMediaType } from '@/utils/mediaItem';
import { searchMovies } from '@/api/client';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import FocusableCard from '@/components/FocusableCard';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
}

const RECENT_KEY = '@recentSearches';
const MAX_RECENT = 8;
const DEBOUNCE_MS = 350;
const CARD_WIDTH = 150;
const CARD_HEIGHT = 225;

type FilterTab = 'all' | 'movies' | 'series';

function numColumns() {
  const w = Dimensions.get('window').width;
  if (Platform.isTV) return Math.max(4, Math.floor(w / (CARD_WIDTH + 16)));
  return Math.max(2, Math.floor(w / (CARD_WIDTH + 16)));
}

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [cols, setCols] = useState(numColumns());

  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useHardwareBack(useCallback(() => { navigation.goBack(); return true; }, [navigation]));

  // Load recent searches on mount
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(raw => {
      if (raw) setRecent(JSON.parse(raw));
    });
  }, []);

  // Recompute columns on dimension change (orientation / window resize)
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', () => setCols(numColumns()));
    return () => sub.remove();
  }, []);

  async function saveRecent(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecent(prev => {
      const updated = [trimmed, ...prev.filter(r => r !== trimmed)].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  async function doSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(false);
    const data = await searchMovies(trimmed);
    const all: AnyItem[] = [
      ...(data.libraryResults ?? []),
      ...(data.tmdbResults ?? []),
    ];
    setResults(all);
    setSearched(true);
    setLoading(false);
    saveRecent(trimmed);
  }

  function handleChangeText(text: string) {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => doSearch(text), DEBOUNCE_MS);
  }

  function handleSubmit() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    doSearch(query);
  }

  function handleRecentPress(q: string) {
    setQuery(q);
    doSearch(q);
  }

  async function clearRecent() {
    setRecent([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  }

  const filteredResults = results.filter(item => {
    if (activeFilter === 'all') return true;
    const mt = getMediaType(item);
    return activeFilter === 'movies' ? mt === 'movie' : mt === 'tv';
  });

  const showRecent = !query && recent.length > 0 && !searched;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableHighlight
          style={styles.backBtn}
          underlayColor="#333"
          onPress={() => navigation.goBack()}
          isTVSelectable
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableHighlight>
        <Text style={styles.heading}>Search</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search movies, series, genres…"
          placeholderTextColor="#555"
          value={query}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus
          hasTVPreferredFocus
          blurOnSubmit={false}
        />
        {query.length > 0 && (
          <TouchableHighlight
            style={styles.clearBtn}
            underlayColor="#333"
            onPress={() => { setQuery(''); setResults([]); setSearched(false); }}
            isTVSelectable
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableHighlight>
        )}
        <TouchableHighlight
          style={styles.searchBtn}
          underlayColor="#cc0000"
          onPress={handleSubmit}
          isTVSelectable
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableHighlight>
      </View>

      {/* Category filter tabs */}
      {(searched || results.length > 0) && (
        <View style={styles.filterRow}>
          {(['all', 'movies', 'series'] as FilterTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}
              isTVSelectable
            >
              <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                {tab === 'all' ? 'All' : tab === 'movies' ? 'Movies' : 'TV Shows'}
              </Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.resultCount}>
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e50914" />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      )}

      {/* Recent searches */}
      {!loading && showRecent && (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecent} isTVSelectable>
              <Text style={styles.clearRecentText}>Clear all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentPills}>
            {recent.map(r => (
              <TouchableHighlight
                key={r}
                style={styles.recentPill}
                underlayColor="#333"
                onPress={() => handleRecentPress(r)}
                isTVSelectable
              >
                <Text style={styles.recentPillText}>🕐  {r}</Text>
              </TouchableHighlight>
            ))}
          </ScrollView>
        </View>
      )}

      {/* No results */}
      {!loading && searched && filteredResults.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No results for "{query}"</Text>
          {activeFilter !== 'all' && (
            <TouchableOpacity onPress={() => setActiveFilter('all')} isTVSelectable style={styles.showAllBtn}>
              <Text style={styles.showAllText}>Show all categories</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results grid */}
      {!loading && filteredResults.length > 0 && (
        <FlatList
          key={cols}
          data={filteredResults}
          numColumns={cols}
          keyExtractor={item => `${getId(item)}-${getTitle(item)}`}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          initialNumToRender={cols * 3}
          maxToRenderPerBatch={cols * 2}
          windowSize={5}
          renderItem={({ item, index }) => (
            <FocusableCard
              title={getTitle(item)}
              imageUri={getPosterUrl(item)}
              subtitle={getSubtitle(item)}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              hasTVPreferredFocus={index === 0}
              onPress={() => navigation.navigate('Detail', { item })}
            />
          )}
        />
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
  backBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1a1a1a', borderRadius: 6 },
  backText: { color: '#fff', fontSize: 16 },
  heading: { color: '#fff', fontSize: 24, fontWeight: '700' },

  searchBar: { flexDirection: 'row', paddingHorizontal: 32, gap: 12, marginBottom: 12 },
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
  clearBtn: {
    backgroundColor: '#2a2a2a',
    width: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { color: '#888', fontSize: 18 },
  searchBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  filterTabActive: { backgroundColor: '#e50914', borderColor: '#e50914' },
  filterTabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  filterTabTextActive: { color: '#fff' },
  resultCount: { color: '#888', fontSize: 13, marginLeft: 'auto' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#888', fontSize: 16 },
  emptyText: { color: '#888', fontSize: 18 },
  showAllBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6, backgroundColor: '#1a1a1a' },
  showAllText: { color: '#e50914', fontSize: 14 },

  recentContainer: { paddingHorizontal: 32, marginBottom: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recentTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  clearRecentText: { color: '#e50914', fontSize: 13 },
  recentPills: { gap: 8 },
  recentPill: {
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  recentPillText: { color: '#ccc', fontSize: 14 },

  grid: { paddingHorizontal: 26, paddingBottom: 32 },
});
