import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Image } from 'expo-image';
import type { CastMember } from '@/api/client';

interface CastStripProps {
  cast: CastMember[];
}

export default function CastStrip({ cast }: CastStripProps) {
  if (!cast.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Cast</Text>
      <FlatList
        data={cast.slice(0, 12)}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c, i) => `${c.name}-${i}`}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.item}>
            {item.profile_url ? (
              <Image source={{ uri: item.profile_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.character} numberOfLines={1}>{item.character}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24, marginBottom: 16 },
  heading: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 40, marginBottom: 12 },
  row: { paddingHorizontal: 40, gap: 18 },
  item: { width: 100, alignItems: 'center' },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#222' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#aaa', fontSize: 28, fontWeight: '700' },
  name: { color: '#eee', fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  character: { color: '#888', fontSize: 11, marginTop: 2, textAlign: 'center' },
});
