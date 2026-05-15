import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { fetchCatalog, getStoredPhone, getContinueWatching, fetchDiscover, type ResumeEntry } from '@/api/client';
import HeroBanner from '@/components/HeroBanner';
import MovieRow from '@/components/MovieRow';
import ContinueWatchingRow from '@/components/ContinueWatchingRow';
import { HeroSkeleton, PosterRowSkeleton } from '@/components/Skeleton';
import FocusableButton from '@/components/FocusableButton';

type AnyItem = CatalogItem | TmdbItem;

type FeedRow =
  | { type: 'hero'; id: string; items: AnyItem[] }
  | { type: 'continue'; id: string; entries: ResumeEntry[] }
  | { type: 'section'; id: string; title: string; items: AnyItem[]; isFirst: boolean };

// Genre rails fetched in parallel after the main catalog. TMDB genre IDs.
const GENRE_RAILS: { title: string; type: 'movie' | 'tv'; genreId: number }[] = [
  { title: 'Action',          type: 'movie', genreId: 28 },
  { title: 'Comedy',          type: 'movie', genreId: 35 },
  { title: 'Drama',           type: 'movie', genreId: 18 },
  { title: 'Sci-Fi',          type: 'movie', genreId: 878 },
  { title: 'Action & Adventure (Series)', type: 'tv', genreId: 10759 },
  { title: 'Crime',           type: 'movie', genreId: 80 },
];

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

  // Top bar fades + translates up as the feed scrolls down (Netflix-style).
  const scrollY = useRef(new Animated.Value(0)).current;
  const topBarOpacity = scrollY.interpolate({
    inputRange: [0, 60, 140],
    outputRange: [1, 0.85, 0.4],
    extrapolate: 'clamp',
  });
  const topBarTranslateY = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [0, -8],
    extrapolate: 'clamp',
  });

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
    const [data, resumeEntries] = await Promise.all([
      fetchCatalog(),
      getContinueWatching(),
    ]);
    if (!data) {
      setError('Failed to load content. Please check your connection.');
      setLoading(false);
      return;
    }

    const rows: FeedRow[] = [];
    const allItems = data.items ?? [];

    // Rotating hero: pick the top 5 most relevant items (richest backdrops)
    const heroPool = allItems
      .filter(i => ('backdrop_url' in i && (i as any).backdrop_url) || ('backdrop_path' in i && (i as TmdbItem).backdrop_path))
      .slice(0, 5);
    if (heroPool.length) {
      rows.push({ type: 'hero', id: 'hero', items: heroPool });
    }

    if (resumeEntries.length) {
      rows.push({ type: 'continue', id: 'continue', entries: resumeEntries });
    }

    const sections = data.sections ?? [];
    sections.forEach((s, i) => {
      rows.push({
        type: 'section',
        id: s.id,
        title: s.title,
        items: s.items as AnyItem[],
        isFirst: i === 0 && !resumeEntries.length,
      });
    });

    if (!sections.length && allItems.length) {
      rows.push({
        type: 'section',
        id: 'all',
        title: 'All Content',
        items: allItems,
        isFirst: !resumeEntries.length,
      });
    }

    setFeed(rows);
    setLoading(false);

    // Fetch genre rails in parallel, append as they arrive so the page doesn't
    // wait for all six to come back before rendering anything.
    GENRE_RAILS.forEach(async (g) => {
      const items = await fetchDiscover(g.type, g.genreId);
      if (!items.length) return;
      setFeed(prev => [
        ...prev,
        { type: 'section', id: `genre_${g.type}_${g.genreId}`, title: g.title, items: items as AnyItem[], isFirst: false },
      ]);
    });
  }, []);

  // Reload Continue Watching every time Home regains focus (covers Player → Home)
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  function goToDetail(item: AnyItem) {
    navigation.navigate('Detail', { item });
  }

  function resumeEntry(entry: ResumeEntry) {
    // Jump straight to the player; PlayerScreen will auto-seek to the saved position.
    const stubItem = {
      id: Number(entry.id),
      media_type: entry.mediaType,
      title: entry.title,
      name: entry.title,
      poster_url: entry.posterUrl,
      backdrop_url: entry.backdropUrl,
      overview: '',
      vote_average: 0,
    } as unknown as TmdbItem;
    navigation.navigate('Player', {
      item: stubItem,
      season: entry.season ?? 1,
      episode: entry.episode ?? 1,
    });
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>GameStop Movies</Text>
        </View>
        <HeroSkeleton />
        <View style={{ paddingTop: 24 }}>
          <PosterRowSkeleton />
          <PosterRowSkeleton />
          <PosterRowSkeleton />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <FocusableButton label="Retry" onPress={load} variant="primary" hasTVPreferredFocus />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.topBar,
          { opacity: topBarOpacity, transform: [{ translateY: topBarTranslateY }] },
        ]}
      >
        <Text style={styles.brand}>GameStop Movies</Text>
        <View style={styles.topActions}>
          {phone ? <Text style={styles.phoneText}>{phone}</Text> : null}
          <FocusableButton label="Search" onPress={() => navigation.navigate('Search')} />
          <FocusableButton label="Sign Out" onPress={onLogout} />
        </View>
      </Animated.View>

      {/* FlatList for vertical rows — Android TV D-pad navigates between sections correctly */}
      <Animated.FlatList
        data={feed}
        keyExtractor={row => row.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        renderItem={({ item: row }) => {
          if (row.type === 'hero') {
            return (
              <HeroBanner
                items={row.items}
                onPlay={(it) => navigation.navigate('Player', { item: it })}
                onMore={(it) => goToDetail(it)}
              />
            );
          }
          if (row.type === 'continue') {
            return <ContinueWatchingRow entries={row.entries} onSelect={resumeEntry} />;
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
