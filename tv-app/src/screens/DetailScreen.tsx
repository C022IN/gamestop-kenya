import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { CatalogItem, TmdbItem, SeasonEpisodes, TitleDetails, CastMember } from '@/api/client';
import {
  tmdbBackdrop,
  tmdbPoster,
  fetchDetails,
  fetchEpisodes,
  fetchCredits,
  fetchSimilar,
  getContinueWatching,
} from '@/api/client';
import EpisodeTile, { EpisodeListLoading } from '@/components/EpisodeTile';
import SeasonTabs from '@/components/SeasonTabs';
import CastStrip from '@/components/CastStrip';
import MovieRow from '@/components/MovieRow';
import { useHardwareBack } from '@/hooks/useHardwareBack';

const { width } = Dimensions.get('window');
type AnyItem = CatalogItem | TmdbItem;

interface Props {
  route: RouteProp<{ Detail: { item: AnyItem } }, 'Detail'>;
  navigation: NavigationProp<any>;
}

function getId(item: AnyItem): string {
  return String(item.id ?? '');
}
function getTitle(item: AnyItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return 'Unknown';
}
function getOverview(item: AnyItem): string {
  return ('overview' in item ? item.overview : '') ?? '';
}
function getBackdrop(item: AnyItem): string {
  if ('backdrop_url' in item && (item as any).backdrop_url) return (item as any).backdrop_url;
  if ('backdrop_path' in item) return tmdbBackdrop((item as TmdbItem).backdrop_path);
  return '';
}
function getPoster(item: AnyItem): string {
  if ('poster_url' in item && (item as any).poster_url) return (item as any).poster_url;
  if ('poster_path' in item) return tmdbPoster((item as TmdbItem).poster_path);
  return '';
}
function isTvShow(item: AnyItem): boolean {
  if ('media_type' in item && (item as TmdbItem).media_type === 'tv') return true;
  if ('kind' in item && (item as CatalogItem).kind === 'series') return true;
  return false;
}

export default function DetailScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const tv = isTvShow(item);
  const numericId = useMemo(() => {
    const n = Number(getId(item));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [item]);

  useHardwareBack(useCallback(() => { navigation.goBack(); return true; }, [navigation]));

  const [details, setDetails] = useState<TitleDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<TmdbItem[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonData, setSeasonData] = useState<SeasonEpisodes | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [resumeEpisode, setResumeEpisode] = useState<{ season: number; episode: number; positionMs: number; durationMs?: number } | null>(null);

  // Fetch full details + cast + similar in parallel as soon as we mount
  useEffect(() => {
    if (!numericId) return;
    let cancelled = false;
    const t: 'movie' | 'tv' = tv ? 'tv' : 'movie';
    (async () => {
      const [d, c, s] = await Promise.all([
        fetchDetails(numericId, t),
        fetchCredits(numericId, t),
        fetchSimilar(numericId, t),
      ]);
      if (cancelled) return;
      setDetails(d);
      setCast(c);
      setSimilar(s);
    })();
    return () => { cancelled = true; };
  }, [numericId, tv]);

  // Look up the most recent saved position for this title to surface "Resume" / progress on episode tiles
  useEffect(() => {
    if (!numericId) return;
    (async () => {
      const list = await getContinueWatching();
      const match = list.find(e => e.id === String(numericId) && e.mediaType === (tv ? 'tv' : 'movie'));
      if (match) {
        setResumeEpisode({
          season: match.season ?? 1,
          episode: match.episode ?? 1,
          positionMs: match.positionMs,
        });
        if (tv && match.season) setSelectedSeason(match.season);
      }
    })();
  }, [numericId, tv]);

  // Fetch episode list whenever the user switches seasons (TV only)
  useEffect(() => {
    if (!tv || !numericId) return;
    let cancelled = false;
    setLoadingEpisodes(true);
    setSeasonData(null);
    fetchEpisodes(numericId, selectedSeason).then(d => {
      if (cancelled) return;
      setSeasonData(d);
      setLoadingEpisodes(false);
    });
    return () => { cancelled = true; };
  }, [tv, numericId, selectedSeason]);

  function play(season?: number, episode?: number) {
    if (tv) {
      navigation.navigate('Player', { item, season: season ?? 1, episode: episode ?? 1 });
    } else {
      navigation.navigate('Player', { item });
    }
  }

  const title = details?.title || details?.name || getTitle(item);
  const overview = details?.overview || getOverview(item);
  const meta: string[] = [];
  if (details?.release_date) meta.push(details.release_date.slice(0, 4));
  if (details?.runtime) meta.push(`${details.runtime}m`);
  if (details?.number_of_seasons) meta.push(`${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}`);
  if (details?.vote_average) meta.push(`★ ${details.vote_average.toFixed(1)}`);
  const genres = details?.genres?.slice(0, 3).map(g => g.name).join(' · ') ?? '';
  const accent = details?.accent_color ?? null;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: getBackdrop(item) || details?.backdrop_url || getPoster(item) }}
        style={[styles.backdrop, { width }]}
        contentFit="cover"
        priority="high"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', '#000']}
        style={[styles.gradient, { width }]}
      />
      <TouchableHighlight
        style={styles.backBtn}
        underlayColor="#333"
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableHighlight>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero block: title + meta + Play */}
        <View style={styles.heroBlock}>
          <Text style={styles.title}>{title}</Text>
          {details?.tagline ? <Text style={styles.tagline}>{details.tagline}</Text> : null}
          <Text style={styles.metaLine}>{meta.join('  ·  ')}</Text>
          {genres ? <Text style={styles.genreLine}>{genres}</Text> : null}
          <Text style={styles.overview}>{overview}</Text>

          <View style={styles.actions}>
            {resumeEpisode ? (
              <TouchableHighlight
                style={[styles.btn, styles.playBtn, accent && { backgroundColor: accent }]}
                underlayColor="#cc0000"
                onPress={() => play(resumeEpisode.season, resumeEpisode.episode)}
                hasTVPreferredFocus
              >
                <Text style={styles.playBtnText}>
                  ▶ Resume{tv ? `  S${resumeEpisode.season} E${resumeEpisode.episode}` : ''}
                </Text>
              </TouchableHighlight>
            ) : (
              <TouchableHighlight
                style={[styles.btn, styles.playBtn, accent && { backgroundColor: accent }]}
                underlayColor="#cc0000"
                onPress={() => play(1, 1)}
                hasTVPreferredFocus
              >
                <Text style={styles.playBtnText}>▶ {tv ? 'Play S1 E1' : 'Play Now'}</Text>
              </TouchableHighlight>
            )}
            {resumeEpisode ? (
              <TouchableHighlight
                style={[styles.btn, styles.secondaryBtn]}
                underlayColor="#333"
                onPress={() => play(1, 1)}
              >
                <Text style={styles.secondaryText}>↺ Start Over</Text>
              </TouchableHighlight>
            ) : null}
          </View>
        </View>

        {/* TV: season tabs + episodes list */}
        {tv && details?.seasons && details.seasons.length > 0 && (
          <>
            <SeasonTabs
              seasons={details.seasons}
              selected={selectedSeason}
              onSelect={setSelectedSeason}
            />
            <View style={styles.episodesWrap}>
              {loadingEpisodes ? (
                <EpisodeListLoading />
              ) : seasonData && seasonData.episodes.length ? (
                seasonData.episodes.map((ep, idx) => {
                  const pct = resumeEpisode &&
                    resumeEpisode.season === ep.season_number &&
                    resumeEpisode.episode === ep.episode_number &&
                    ep.runtime
                      ? resumeEpisode.positionMs / (ep.runtime * 60_000)
                      : undefined;
                  return (
                    <EpisodeTile
                      key={ep.id}
                      episodeNumber={ep.episode_number}
                      title={ep.name}
                      overview={ep.overview}
                      stillUrl={ep.still_url}
                      runtime={ep.runtime}
                      airDate={ep.air_date}
                      resumePct={pct}
                      hasTVPreferredFocus={idx === 0 && !resumeEpisode}
                      onPress={() => play(ep.season_number, ep.episode_number)}
                    />
                  );
                })
              ) : (
                <Text style={styles.empty}>No episodes available for this season.</Text>
              )}
            </View>
          </>
        )}

        {/* Cast (movies + TV) */}
        {cast.length > 0 && <CastStrip cast={cast} />}

        {/* Similar titles */}
        {similar.length > 0 && (
          <View style={styles.similarWrap}>
            <MovieRow
              title="More Like This"
              items={similar}
              onSelect={(it) => (navigation as any).replace('Detail', { item: it })}
            />
          </View>
        )}

        {!details && (
          <View style={styles.spinner}>
            <ActivityIndicator color="#666" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backdrop: { position: 'absolute', top: 0, left: 0, height: 520 },
  gradient: { position: 'absolute', top: 0, left: 0, height: 600 },
  backBtn: {
    position: 'absolute', top: 20, left: 24, zIndex: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6,
  },
  backText: { color: '#fff', fontSize: 16 },
  content: { paddingTop: 220, paddingBottom: 80 },
  heroBlock: { paddingHorizontal: 40, maxWidth: 900 },
  title: { color: '#fff', fontSize: 38, fontWeight: '800', marginBottom: 6 },
  tagline: { color: '#aaa', fontSize: 14, fontStyle: 'italic', marginBottom: 10 },
  metaLine: { color: '#bbb', fontSize: 14, marginBottom: 4 },
  genreLine: { color: '#888', fontSize: 13, marginBottom: 14 },
  overview: { color: '#ddd', fontSize: 15, lineHeight: 22, marginBottom: 20, maxWidth: 720 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  btn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 6, minWidth: 160, alignItems: 'center' },
  playBtn: { backgroundColor: '#e50914' },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  playBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  episodesWrap: { paddingHorizontal: 30, paddingTop: 8 },
  empty: { color: '#666', textAlign: 'center', paddingVertical: 30 },
  similarWrap: { marginTop: 20 },
  spinner: { paddingVertical: 30 },
});
