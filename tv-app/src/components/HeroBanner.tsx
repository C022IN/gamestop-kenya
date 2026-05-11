import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import type { CatalogItem, TmdbItem } from '@/api/client';
import { tmdbBackdrop } from '@/api/client';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(width * 0.45);

type HeroItem = CatalogItem | TmdbItem;

interface HeroBannerProps {
  item: HeroItem;
  onPlay: () => void;
  onMore: () => void;
}

function getBackdrop(item: HeroItem): string {
  if ('backdrop_url' in item && item.backdrop_url) return item.backdrop_url;
  if ('backdrop_path' in item) return tmdbBackdrop((item as TmdbItem).backdrop_path);
  if ('poster_url' in item && item.poster_url) return item.poster_url;
  return '';
}

function getTitle(item: HeroItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return '';
}

function getOverview(item: HeroItem): string {
  if ('overview' in item && item.overview) return item.overview;
  return '';
}

export default function HeroBanner({ item, onPlay, onMore }: HeroBannerProps) {
  const imageUri = getBackdrop(item);
  const title = getTitle(item);
  const overview = getOverview(item);

  return (
    <View style={[styles.container, { height: HERO_HEIGHT }]}>
      {imageUri ? (
        <FastImage
          source={{ uri: imageUri, priority: FastImage.priority.high }}
          style={StyleSheet.absoluteFill}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : null}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)', '#000']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {overview ? (
          <Text style={styles.overview} numberOfLines={3}>
            {overview}
          </Text>
        ) : null}
        <View style={styles.buttons}>
          <TouchableHighlight
            style={[styles.btn, styles.playBtn]}
            underlayColor="#cc0000"
            onPress={onPlay}
            hasTVPreferredFocus
          >
            <Text style={styles.playBtnText}>▶  Play</Text>
          </TouchableHighlight>
          <TouchableHighlight
            style={[styles.btn, styles.moreBtn]}
            underlayColor="#333"
            onPress={onMore}
          >
            <Text style={styles.moreBtnText}>ⓘ  More Info</Text>
          </TouchableHighlight>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width, backgroundColor: '#000' },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 40,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  overview: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 560,
  },
  buttons: { flexDirection: 'row', gap: 16 },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 4,
    minWidth: 140,
    alignItems: 'center',
  },
  playBtn: { backgroundColor: '#e50914' },
  moreBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  playBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  moreBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
