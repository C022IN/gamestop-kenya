import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableHighlight,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { fetchCatalog, getStoredPhone } from '@/api/client';
import HeroBanner from '@/components/HeroBanner';
import MovieRow from '@/components/MovieRow';

type AnyItem = CatalogItem | TmdbItem;

type FeedRow =
  | { type: 'hero'; id: string; item: AnyItem }
  | { type: 'section'; id: string; title: string; items: AnyItem[]; isFirst: boolean };

interface Props {
  navigation: NavigationProp<any>;
  onLogout: () => void;
}

export default function HomeScreen({ navigation, onLogout }: Props) {
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const backPressedOnce = useRef(false);
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Require two back presses within 2s to exit — prevents accidental OS kick-out.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (backPressedOnce.current) {
          BackHandler.exitApp();
          return true;
        }
        backPressedOnce.current = true;
        ToastAndroid.show('Press Back again to exit', ToastAndroid.SHORT);
        if (backTimer.current) clearTimeout(backTimer.current);
        backTimer.current = setTimeout(() => { backPressedOnce.current = false; }, 2000);
        return true;
      });
      return () => {
        sub.remove();
        if (backTimer.current) clearTimeout(backTimer.current);
      };
    }, []),
  );

  useEffect(() => {
    getStoredPhone().then(setPhone);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchCatalog();
    if (!data) {
      setError('Failed to load content. Please check your connection.');
      setLoading(false);
      return;
    }

    const rows: FeedRow[] = [];
    const allItems = data.items ?? [];

    if (allItems.length) {
      rows.push({ type: 'hero', id: 'hero', item: allItems[0] });
    }

    const sections = data.sections ?? [];
    sections.forEach((s, i) => {
      rows.push({
        type: 'section',
        id: s.id,
        title: s.title,
        items: s.items as AnyItem[],
        isFirst: i === 0,
      });
    });

    if (!sections.length && allItems.length) {
      rows.push({ type: 'section', id: 'all', title: 'All Content', items: allItems, isFirst: true });
    }

    setFeed(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function goToDetail(item: AnyItem) {
    navigation.navigate('Detail', { item });
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
      <View style={styles.topBar}>
        <Text style={styles.brand}>GameStop Movies</Text>
        <View style={styles.topActions}>
          {phone ? <Text style={styles.phoneText}>{phone}</Text> : null}
          <TouchableHighlight
            style={styles.topBtn}
            underlayColor="#333"
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.topBtnText}>Search</Text>
          </TouchableHighlight>
          <TouchableHighlight style={styles.topBtn} underlayColor="#333" onPress={onLogout}>
            <Text style={styles.topBtnText}>Sign Out</Text>
          </TouchableHighlight>
        </View>
      </View>

      {/* FlatList for vertical rows — Android TV D-pad navigates between sections correctly */}
      <FlatList
        data={feed}
        keyExtractor={row => row.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        renderItem={({ item: row }) => {
          if (row.type === 'hero') {
            return (
              <HeroBanner
                item={row.item}
                onPlay={() => navigation.navigate('Player', { item: row.item })}
                onMore={() => goToDetail(row.item)}
              />
            );
          }
          return (
            <MovieRow
              title={row.title}
              items={row.items}
              onSelect={goToDetail}
              isFirstRow={row.isFirst}
            />
          );
        }}
      />
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
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 10,
  },
  brand: { color: '#e50914', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  phoneText: { color: '#888', fontSize: 13, marginRight: 4 },
  topBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  topBtnText: { color: '#fff', fontSize: 14 },
  errorText: { color: '#e50914', fontSize: 18, marginBottom: 24 },
  retryBtn: {
    backgroundColor: '#e50914',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
