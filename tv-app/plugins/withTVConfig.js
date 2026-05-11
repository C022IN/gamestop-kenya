/**
 * Expo config plugin — patches AndroidManifest.xml for Android TV:
 *  - Adds LEANBACK_LAUNCHER intent filter
 *  - Marks touchscreen as not required
 *  - Adds TV hardware feature declarations
 *  - Sets landscape banner
 */
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = withAndroidManifest(config => {
  const androidManifest = config.modResults;
  const manifest = androidManifest.manifest;

  // ── uses-feature ────────────────────────────────────────────────────────────
  if (!manifest['uses-feature']) manifest['uses-feature'] = [];

  const features = manifest['uses-feature'];

  // Remove touchscreen requirement — TV uses D-pad remote
  const touchIdx = features.findIndex(f => f.$?.['android:name'] === 'android.hardware.touchscreen');
  if (touchIdx !== -1) features.splice(touchIdx, 1);

  features.push(
    { $: { 'android:name': 'android.hardware.touchscreen', 'android:required': 'false' } },
    { $: { 'android:name': 'android.software.leanback', 'android:required': 'false' } },
    { $: { 'android:name': 'android.hardware.type.television', 'android:required': 'false' } },
  );

  // ── Main activity ─────────────────────────────────────────────────────────
  const application = manifest.application?.[0];
  if (!application) return config;

  const activity = application.activity?.find(a =>
    a.$?.['android:name'] === '.MainActivity',
  );
  if (!activity) return config;

  // Force landscape on TV
  activity.$['android:screenOrientation'] = 'landscape';

  // Add Leanback (TV) launcher intent filter alongside the existing MAIN/LAUNCHER
  const intentFilters = activity['intent-filter'] ?? [];
  const hasLeanback = intentFilters.some(f =>
    f.category?.some(c => c.$?.['android:name'] === 'android.intent.category.LEANBACK_LAUNCHER'),
  );
  if (!hasLeanback) {
    intentFilters.push({
      action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
      category: [{ $: { 'android:name': 'android.intent.category.LEANBACK_LAUNCHER' } }],
    });
    activity['intent-filter'] = intentFilters;
  }

  return config;
});
