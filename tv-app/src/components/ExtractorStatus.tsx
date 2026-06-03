import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fetchExtractorHealth } from '@/api/client';

// Re-check every 5 minutes (matches the server-side monitor cadence).
const REFRESH_MS = 5 * 60 * 1000;

type Status = 'checking' | 'ok' | 'down';

// Small streaming-backend health chip for the Home header. Green dot when the
// extractor is healthy; amber "Streaming issue" when it's down or mis-authed, so
// a backend outage reads as a backend outage instead of a mysterious black
// screen. Purely informational (not focusable) so it never traps the D-pad.
export default function ExtractorStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let active = true;
    const check = async () => {
      const health = await fetchExtractorHealth();
      if (active) setStatus(health.ok ? 'ok' : 'down');
    };
    check();
    const id = setInterval(check, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (status === 'checking') return null;

  const ok = status === 'ok';
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.dot, ok ? styles.dotOk : styles.dotDown]} />
      <Text style={[styles.label, ok ? styles.labelOk : styles.labelDown]}>
        {ok ? 'Streaming OK' : 'Streaming issue'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOk: { backgroundColor: '#22c55e' },
  dotDown: { backgroundColor: '#f59e0b' },
  label: { fontSize: 12, fontWeight: '600' },
  labelOk: { color: '#6b7280' },
  labelDown: { color: '#fbbf24' },
});
