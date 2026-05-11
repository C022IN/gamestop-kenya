import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'GameStop Movies',
  slug: 'gamestop-movies-tv',
  version: '1.0.0',
  orientation: 'landscape',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  android: {
    package: 'ke.co.gamestop.movies',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 21,
          targetSdkVersion: 34,
          compileSdkVersion: 35,
          buildToolsVersion: '35.0.0',
          // Enable TV features
          extraBuildGradleContent: `
android {
    defaultConfig {
        resConfigs "en", "sw"
    }
}
          `,
        },
      },
    ],
    [
      // TV manifest config — adds LEANBACK_LAUNCHER and removes touchscreen requirement
      './plugins/withTVConfig',
    ],
  ],
  extra: {
    eas: {
      projectId: 'gamestop-movies-tv',
    },
  },
};

export default config;
