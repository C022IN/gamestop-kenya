module.exports = {
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
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
    ],
  },
  plugins: [
    'expo-image',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 21,
          targetSdkVersion: 35,
          compileSdkVersion: 35,
          buildToolsVersion: '35.0.0',
          newArchEnabled: false,
        },
      },
    ],
    './plugins/withTVConfig',
  ],
  extra: {
    eas: {
      projectId: '623d7a87-ee47-4abb-a601-ddfbc9052305',
    },
  },
};
