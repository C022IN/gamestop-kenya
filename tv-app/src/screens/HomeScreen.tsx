import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { fetchCatalog } from '@/api/client';
import HeroBanner from '@/components/HeroBanner';
import MovieRow from '@/components/MovieRow';

type AnyItem = CatalogItem | TmdbItem;

interface Section {
  id: string;
  title: string;
  items: AnyItem[];
}

interface Props {
  navigation: NavigationProp<any>;
  onLogout: () => void;
}

export default function HomeScreen({ navigation, onLogout }: Props) {
  const [heroItem, setHeroItem] = useState<AnyItem | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchCatalog();
    if (!data) {
      setError('Failed to load content. Please check your connection.');
      setLoading(false);
      return;
    }

    const allItems = data.items ?? [];
    if (allItems.length) setHeroItem(allItems[0]);

    const built: Section[] = [];
    if (data.sections?.length) {
      for (const s of data.sections) {
        built.push({ id: s.id, title: s.title, items: s.items as AnyItem[] });
      }
    } else if (allItems.length) {
      built.push({ id: 'all', title: 'All Content', items: allItems });
    }
    setSections(built);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function goToDetail(item: AnyItem) {
    navigation.navigate('Detail', { item });
  }

  function goToPlay(item: AnyItem) {
    navigation.navigate('Player', { item });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableHighlight style={styles.retryBtn} onPress={load} hasTVPreferredFocus>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableHighlight>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>🎬 GameStop Movies</Text>
        <View style={styles.topActions}>
          <TouchableHighlight
            style={styles.topBtn}
            underlayColor="#222"
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.topBtnText}>🔍 Search</Text>
          </TouchableHighlight>
          <TouchableHighlight style={styles.topBtn} underlayColor="#222" onPress={onLogout}>
            <Text style={styles.topBtnText}>Sign Out</Text>
          </TouchableHighlight>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {heroItem && (
          <HeroBanner
            item={heroItem}
            onPlay={() => goToPlay(heroItem)}
            onMore={() => goToDetail(heroItem)}
          />
        )}
        <View style={styles.rows}>
          {sections.map((s, i) => (
            <MovieRow key={s.id} title={s.title} items={s.items} onSelect={goToDetail} isFirstRow={i === 0} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800' },
  topActions: { flexDirection: 'row', gap: 12 },
  topBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
  },
  topBtnText: { color: '#fff', fontSize: 14 },
  rows: { paddingTop: 32 },
  errorText: { color: '#e50914', fontSize: 18, marginBottom: 24 },
  retryBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
