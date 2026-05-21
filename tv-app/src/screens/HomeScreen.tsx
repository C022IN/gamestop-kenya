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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogItem, TmdbItem, ResumeEntry } from '@/api/client';
import { fetchCatalog, getStoredPhone, getContinueWatching, fetchDiscover } from '@/api/client';
import type { RootStackParamList } from '@/types/navigation';
import type { AnyItem } from '@/utils/mediaItem';
import HeroBanner from '@/components/HeroBanner';
import MovieRow from '@/components/MovieRow';
import ContinueWatchingRow from '@/components/ContinueWatchingRow';
import { HeroSkeleton, PosterRowSkeleton } from '@/components/Skeleton';
import FocusableButton from '@/components/FocusableButton';

type FeedRow =
  | { type: 'hero'; id: string; items: AnyItem[] }
  | { type: 'continue'; id: string; entries: ResumeEntry[] }
  | { type: 'section'; id: string; title: string; items: AnyItem[]; isFirst: boolean };

// Genre rails fetched in parallel after the main catalog. TMDB genre IDs.
const GENRE_RAILS: { title: string; type: 'movie' | 'tv'; genreId: number }[] = [
  { title: 'Action',                          type: 'movie', genreId: 28 },
  { title: 'Comedy',                          type: 'movie', genreId: 35 },
  { title: 'Drama',                           type: 'movie', genreId: 18 },
  { title: 'Sci-Fi',                          type: 'movie', genreId: 878 },
  { title: 'Action & Adventure (Series)',     type: 'tv',    genreId: 10759 },
  { title: 'Crime',                           type: 'movie', genreId: 80 },
];

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  onLogout: () => void;
}

export default function HomeScreen({ navigation, onLogout }: Props) {
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const backPressedOnce = useRef(false);
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Each call to load() gets its own cancellation token so that
    // concurrent loads (e.g. rapid focus in/out) don't race.
    let cancelled = false;

    const [data, resumeEntries] = await Promise.all([
      fetchCatalog(),
      getContinueWatching(),
    ]);

    if (cancelled) return;

    if (!data) {
      setError('Failed to load content. Please check your connection.');
      setLoading(false);
      return;
    }

    const rows: FeedRow[] = [];
    const allItems = (data.items ?? []) as AnyItem[];

    const heroPool = allItems
      .filter(i =>
        ('backdrop_url' in i && (i as CatalogItem).backdrop_url) ||
        ('backdrop_path' in i && (i as TmdbItem).backdrop_path)
      )
      .slice(0, 5);
    if (heroPool.length) rows.push({ type: 'hero', id: 'hero', items: heroPool });

    if (resumeEntries.length) rows.push({ type: 'continue', id: 'continue', entries: resumeEntries });

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

    // Fetch genre rails in parallel. Each uses Promise.all internally so they
    // overlap, and each checks `cancelled` before touching state so a navigation
    // away (or a second load() call) doesn't leak setState onto a dead component.
    await Promise.all(
      GENRE_RAILS.map(async (g) => {
        const items = await fetchDiscover(g.type, g.genreId);
        if (cancelled || !items.length) return;
        setFeed(prev => [
          ...prev,
          {
            type: 'section',
            id: `genre_${g.type}_${g.genreId}`,
            title: g.title,
            items: items as AnyItem[],
            isFirst: false,
          },
        ]);
      })
    );

    return () => { cancelled = true; };
  }, []);

  // useFocusEffect already fires on mount AND on every focus-return (Player → Home).
  // A separate useEffect would double-load on mount — omitted intentionally.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  function goToDetail(item: AnyItem) {
    navigation.navigate('Detail', { item });
  }

  function resumeEntry(entry: ResumeEntry) {
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
  errorText: { color: '#e50914', fontSize: 18, marginBottom: 24 },
});
