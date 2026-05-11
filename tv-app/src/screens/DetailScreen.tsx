import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { tmdbBackdrop, tmdbPoster } from '@/api/client';

const { width } = Dimensions.get('window');
type AnyItem = CatalogItem | TmdbItem;

interface Props {
  route: RouteProp<{ Detail: { item: AnyItem } }, 'Detail'>;
  navigation: NavigationProp<any>;
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
  if ('backdrop_url' in item && item.backdrop_url) return item.backdrop_url;
  if ('backdrop_path' in item) return tmdbBackdrop((item as TmdbItem).backdrop_path);
  return '';
}
function getPoster(item: AnyItem): string {
  if ('poster_url' in item && item.poster_url) return item.poster_url;
  if ('poster_path' in item) return tmdbPoster((item as TmdbItem).poster_path);
  return '';
}
function getMeta(item: AnyItem): string[] {
  const parts: string[] = [];
  if ('year' in item && item.year) parts.push(String(item.year));
  if ('release_date' in item && (item as TmdbItem).release_date)
    parts.push((item as TmdbItem).release_date!.slice(0, 4));
  if ('vote_average' in item && item.vote_average)
    parts.push(`⭐ ${Number(item.vote_average).toFixed(1)}`);
  if ('genres' in item && item.genres?.length)
    parts.push((item.genres as string[]).slice(0, 3).join(' • '));
  return parts;
}

export default function DetailScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const [playFocused, setPlayFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: getBackdrop(item) || getPoster(item) }}
        style={[styles.backdrop, { width }]}
        contentFit="cover"
        priority="high"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)', '#000']}
        style={[styles.gradient, { width }]}
      />
      <TouchableHighlight
        style={styles.backBtn}
        underlayColor="#333"
        onPress={() => navigation.goBack()}
        hasTVPreferredFocus
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableHighlight>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.main}>
          <Image
            source={{ uri: getPoster(item) }}
            style={styles.poster}
            contentFit="cover"
          />
          <View style={styles.info}>
            <Text style={styles.title}>{getTitle(item)}</Text>
            <Text style={styles.meta}>{getMeta(item).join('  ·  ')}</Text>
            <Text style={styles.overview}>{getOverview(item)}</Text>
            <View style={styles.actions}>
              <TouchableHighlight
                style={[styles.btn, styles.playBtn, playFocused && styles.btnFocused]}
                underlayColor="#cc0000"
                onFocus={() => setPlayFocused(true)}
                onBlur={() => setPlayFocused(false)}
                onPress={() => navigation.navigate('Player', { item })}
              >
                <Text style={styles.playBtnText}>▶  Play Now</Text>
              </TouchableHighlight>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backdrop: { position: 'absolute', top: 0, left: 0, height: 420 },
  gradient: { position: 'absolute', top: 0, left: 0, height: 480 },
  backBtn: { position: 'absolute', top: 20, left: 24, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, zIndex: 10 },
  backText: { color: '#fff', fontSize: 16 },
  content: { paddingTop: 220, paddingHorizontal: 40, paddingBottom: 60 },
  main: { flexDirection: 'row', gap: 32 },
  poster: { width: 180, height: 270, borderRadius: 8 },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 10 },
  meta: { color: '#aaa', fontSize: 15, marginBottom: 16 },
  overview: { color: '#ccc', fontSize: 15, lineHeight: 24, marginBottom: 28, maxWidth: 620 },
  actions: { flexDirection: 'row', gap: 16 },
  btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 6, minWidth: 160, alignItems: 'center' },
  playBtn: { backgroundColor: '#e50914' },
  btnFocused: { borderWidth: 2, borderColor: '#fff' },
  playBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
