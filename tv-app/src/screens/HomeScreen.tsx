import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogItem, TmdbItem, ResumeEntry } from '@/api/client';
import { fetchCatalog, getStoredPhone, getContinueWatching, fetchDiscover } from '@/api/client';
import type { RootStackParamList } from '@/types/navigation';
import type { AnyItem } from '@/utils/mediaItem';
import { getMediaType } from '@/utils/mediaItem';
import HeroBanner from '@/components/HeroBanner';
import MovieRow from '@/components/MovieRow';
import ContinueWatchingRow from '@/components/ContinueWatchingRow';
import { HeroSkeleton, PosterRowSkeleton } from '@/components/Skeleton';
import FocusableButton from '@/components/FocusableButton';

const MY_LIST_KEY = '@myList';

export type NavTab = 'home' | 'movies' | 'series' | 'new' | 'mylist';

const NAV_TABS: { id: NavTab; label: string }[] = [
  { id: 'home',   label: 'Home' },
  { id: 'movies', label: 'Movies' },
  { id: 'series', label: 'TV Shows' },
  { id: 'new',    label: 'New & Popular' },
  { id: 'mylist', label: 'My List' },
];

type FeedRow =
  | { type: 'hero'; id: string; items: AnyItem[] }
  | { type: 'continue'; id: string; entries: ResumeEntry[] }
  | { type: 'section'; id: string; title: string; items: AnyItem[]; isFirst: boolean };

const GENRE_RAILS: { title: string; type: 'movie' | 'tv'; genreId: number }[] = [
  { title: 'Action',                       type: 'movie', genreId: 28 },
  { title: 'Comedy',                       type: 'movie', genreId: 35 },
  { title: 'Drama',                        type: 'movie', genreId: 18 },
  { title: 'Sci-Fi',                       type: 'movie', genreId: 878 },
  { title: 'Action & Adventure (Series)',  type: 'tv',    genreId: 10759 },
  { title: 'Crime',                        type: 'movie', genreId: 80 },
];

// Rows used for "New & Popular" tab — pulled from genre rails with newest content
const NEW_RAILS: { title: string; type: 'movie' | 'tv'; genreId: number }[] = [
  { title: 'Trending Movies',   type: 'movie', genreId: 28 },
  { title: 'Trending TV Shows', type: 'tv',    genreId: 10759 },
  { title: 'Popular Dramas',    type: 'movie', genreId: 18 },
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
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [myList, setMyList] = useState<AnyItem[]>([]);
  const backPressedOnce = useRef(false);
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  // Keep top bar fully visible when near top; only slightly dim at scroll so content
  // hierarchy stays clear — never below 0.85 so nav remains readable.
  const topBarBg = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.97)'],
    extrapolate: 'clamp',
  });

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
    loadMyList();
  }, []);

  async function loadMyList() {
    try {
      const raw = await AsyncStorage.getItem(MY_LIST_KEY);
      if (raw) setMyList(JSON.parse(raw));
    } catch {}
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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

  useFocusEffect(useCallback(() => {
    load();
    loadMyList();
  }, [load]));

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

  // Filter the full feed by the active navigation tab
  function getTabFeed(): FeedRow[] {
    if (activeTab === 'home') return feed;

    if (activeTab === 'mylist') {
      if (!myList.length) return [];
      return [{
        type: 'section',
        id: 'mylist',
        title: 'My List',
        items: myList,
        isFirst: true,
      }];
    }

    if (activeTab === 'movies') {
      return feed.map(row => {
        if (row.type === 'hero') {
          const filtered = row.items.filter(i => getMediaType(i) === 'movie');
          return filtered.length ? { ...row, items: filtered } : null;
        }
        if (row.type === 'continue') return row;
        const filtered = row.items.filter(i => getMediaType(i) === 'movie');
        return filtered.length ? { ...row, items: filtered } : null;
      }).filter(Boolean) as FeedRow[];
    }

    if (activeTab === 'series') {
      return feed.map(row => {
        if (row.type === 'hero') {
          const filtered = row.items.filter(i => getMediaType(i) === 'tv');
          return filtered.length ? { ...row, items: filtered } : null;
        }
        if (row.type === 'continue') return row;
        const filtered = row.items.filter(i => getMediaType(i) === 'tv');
        return filtered.length ? { ...row, items: filtered } : null;
      }).filter(Boolean) as FeedRow[];
    }

    if (activeTab === 'new') {
      // Show genre rails that were fetched for NEW_RAILS categories
      return feed.filter(row =>
        row.type === 'section' &&
        NEW_RAILS.some(r => row.id === `genre_${r.type}_${r.genreId}`)
      );
    }

    return feed;
  }

  const tabFeed = getTabFeed();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.topBarFixed}>
          <Text style={styles.brand}>GameStop Movies</Text>
        </View>
        <View style={{ paddingTop: 80 }}>
          <HeroSkeleton />
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
      {/* Fixed top navigation — always visible, background fades in on scroll */}
      <View style={styles.topBarFixed} pointerEvents="box-none">
        <Animated.View style={[styles.topBarBg, { backgroundColor: topBarBg }]} />
        <View style={styles.topBarContent}>
          {/* Left: brand + genre nav */}
          <View style={styles.topLeft}>
            <Text style={styles.brand}>GameStop</Text>
            <View style={styles.navTabs}>
              {NAV_TABS.map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.navTabHit}
                  onPress={() => setActiveTab(tab.id)}
                  isTVSelectable
                >
                  <Text style={[
                    styles.navTabText,
                    activeTab === tab.id && styles.navTabTextActive,
                  ]}>
                    {tab.label}
                  </Text>
                  {activeTab === tab.id && <View style={styles.navTabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Right: search + account */}
          <View style={styles.topRight}>
            {phone ? <Text style={styles.phoneText}>{phone}</Text> : null}
            <FocusableButton label="Search" onPress={() => navigation.navigate('Search')} />
            <FocusableButton label="Sign Out" onPress={onLogout} />
          </View>
        </View>
      </View>

      {/* Content feed */}
      {activeTab === 'mylist' && myList.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyMyList}>Your list is empty</Text>
          <Text style={styles.emptyMyListSub}>
            Add titles by pressing the + button on any detail page.
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={tabFeed}
          keyExtractor={row => row.id}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={3}
          maxToRenderPerBatch={2}
          windowSize={5}
          contentContainerStyle={styles.feedContainer}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },

  // The top bar sits in absolute position so the hero bleeds under it (Netflix-style)
  topBarFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topBarBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  brand: { color: '#e50914', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  navTabs: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navTabHit: { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  navTabText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  navTabTextActive: { color: '#fff', fontWeight: '700' },
  navTabUnderline: {
    position: 'absolute',
    bottom: 2,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: '#e50914',
    borderRadius: 1,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  phoneText: { color: '#888', fontSize: 13, marginRight: 4 },

  feedContainer: { paddingBottom: 32 },

  errorText: { color: '#e50914', fontSize: 18, marginBottom: 24 },
  emptyMyList: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyMyListSub: { color: '#888', fontSize: 14, textAlign: 'center' },
});
