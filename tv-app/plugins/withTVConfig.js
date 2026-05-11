const { withAndroidManifest, withGradleProperties } = require('@expo/config-plugins');

function withTVManifest(config) {
  return withAndroidManifest(config, config => {
    const androidManifest = config.modResults;
    if (!androidManifest?.manifest) return config;

    const manifest = androidManifest.manifest;

    // ── uses-feature entries for Android TV ────────────────────────────────────
    if (!Array.isArray(manifest['uses-feature'])) {
      manifest['uses-feature'] = [];
    }

    const tvFeatures = [
      { $: { 'android:name': 'android.hardware.touchscreen', 'android:required': 'false' } },
      { $: { 'android:name': 'android.software.leanback', 'android:required': 'false' } },
      { $: { 'android:name': 'android.hardware.type.television', 'android:required': 'false' } },
    ];

    for (const feature of tvFeatures) {
      const name = feature.$['android:name'];
      const existing = manifest['uses-feature'].findIndex(
        f => f.$?.['android:name'] === name,
      );
      if (existing !== -1) {
        manifest['uses-feature'][existing] = feature;
      } else {
        manifest['uses-feature'].push(feature);
      }
    }

    // ── Main activity patches ───────────────────────────────────────────────────
    const application = manifest.application;
    if (!Array.isArray(application) || application.length === 0) return config;

    const activities = application[0].activity;
    if (!Array.isArray(activities)) return config;

    const mainActivity = activities.find(
      a => a.$?.['android:name'] === '.MainActivity',
    );
    if (!mainActivity) return config;

    if (!mainActivity.$) mainActivity.$ = {};
    mainActivity.$['android:screenOrientation'] = 'landscape';

    if (!Array.isArray(mainActivity['intent-filter'])) {
      mainActivity['intent-filter'] = [];
    }

    const hasLeanback = mainActivity['intent-filter'].some(f =>
      Array.isArray(f.category) &&
      f.category.some(c => c.$?.['android:name'] === 'android.intent.category.LEANBACK_LAUNCHER'),
    );

    if (!hasLeanback) {
      mainActivity['intent-filter'].push({
        action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
        category: [{ $: { 'android:name': 'android.intent.category.LEANBACK_LAUNCHER' } }],
      });
    }

    return config;
  });
}

function withTVGradleProperties(config) {
  return withGradleProperties(config, config => {
    const props = config.modResults;

    const set = (key, value) => {
      const existing = props.findIndex(p => p.type === 'property' && p.key === key);
      if (existing !== -1) {
        props[existing].value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };

    // Disable New Architecture — avoids Hermes tooling CMake prefab issues
    // with NDK r27 + CMake 3.22 in the EAS Build environment
    set('newArchEnabled', 'false');

    return config;
  });
}

module.exports = config => withTVGradleProperties(withTVManifest(config));
