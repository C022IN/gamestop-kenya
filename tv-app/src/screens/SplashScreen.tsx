import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { getStoredToken } from '@/api/client';

interface Props {
  onReady: (hasToken: boolean) => void;
}

export default function SplashScreen({ onReady }: Props) {
  useEffect(() => {
    getStoredToken().then(token => onReady(!!token));
  }, [onReady]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🎬 GameStop Movies</Text>
      <ActivityIndicator size="large" color="#e50914" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
