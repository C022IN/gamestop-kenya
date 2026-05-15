const isPhone = process.env.APP_VARIANT === 'phone';

module.exports = {
  name: 'GameStop Movies',
  slug: isPhone ? 'gamestop-movies-phone' : 'gamestop-movies-tv',
  version: '1.0.0',
  orientation: isPhone ? 'portrait' : 'landscape',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  android: {
    package: isPhone ? 'ke.co.gamestop.movies.phone' : 'ke.co.gamestop.movies',
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
    'expo-av',
    'expo-video',
    'expo-splash-screen',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
          targetSdkVersion: 36,
          compileSdkVersion: 36,
          buildToolsVersion: '35.0.0',
          newArchEnabled: false,
        },
      },
    ],
    ...(isPhone
      ? []
      : [
          [
            '@react-native-tvos/config-tv',
            {
              isTV: true,
              showVerboseWarnings: false,
              removeFlipperOnAndroid: true,
            },
          ],
        ]),
  ],
  extra: {
    eas: {
      projectId: '623d7a87-ee47-4abb-a601-ddfbc9052305',
    },
  },
};
