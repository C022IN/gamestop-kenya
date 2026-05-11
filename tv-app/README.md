# GameStop Movies — TV App (Android APK)

React Native app targeting Android TV, Google TV, Amazon Fire TV, TCL, Hisense Vidaa (Android), and the Google Play Store TV section.

---

## TV Platform Compatibility

| Platform | Method | Notes |
|---|---|---|
| **Android TV / Google TV** | APK sideload or Play Store | Full support — LEANBACK_LAUNCHER enabled |
| **Amazon Fire TV** | APK sideload or Amazon Appstore | Fire OS = Android; same APK |
| **TCL (Android TV models)** | APK sideload | From USB or file manager |
| **Hisense Vidaa (Android)** | APK sideload | Enable "Install from Unknown Sources" |
| **Samsung Smart TV (Tizen)** | HTML5 web app — see below | Cannot use APK |
| **LG webOS** | HTML5 web app — see below | Cannot use APK |

> **Samsung and LG** do not run Android. They require packaging the web app via Samsung Tizen Studio or LG webOS CLI. The existing Next.js Movies site at `gamestop.co.ke/movies` is already usable as a TV browser app on those platforms.

---

## Prerequisites

- Node.js 18+
- Java 17 (JDK)
- Android SDK (API 35) + Build Tools
- React Native CLI: `npm install -g react-native`
- For TV emulator: Android Studio with TV AVD image

---

## Setup

```bash
cd tv-app
npm install
```

---

## Run on Android TV Emulator

1. In Android Studio → AVD Manager → Create Virtual Device → TV → Android TV (1080p)
2. Start the AVD
3. In this directory:
```bash
npm start          # Start Metro bundler
npm run android    # Deploy to emulator
```

---

## Build Debug APK

```bash
npm run build:debug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Build Release APK (for sideloading)

### 1. Generate a keystore (one-time)
```bash
keytool -genkey -v \
  -keystore gamestop-movies-release.keystore \
  -alias gamestop-movies \
  -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Set environment variables
```bash
export KEYSTORE_FILE=/path/to/gamestop-movies-release.keystore
export KEYSTORE_PASSWORD=your_password
export KEY_ALIAS=gamestop-movies
export KEY_PASSWORD=your_key_password
```

### 3. Build
```bash
npm run build:apk
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### 4. Build AAB (for Play Store submission)
```bash
npm run build:aab
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Sideloading on Android TV Devices

### Fire TV
1. Enable ADB debugging in Settings → My Fire TV → Developer Options
2. `adb connect <fire-tv-ip>:5555`
3. `adb install app-release.apk`

### TCL / Hisense / Generic Android TV
1. Copy APK to USB drive
2. Open File Manager app on TV
3. Navigate to APK → Install (enable Unknown Sources if prompted)

### Via ADB (any Android TV)
```bash
adb connect <tv-ip>:5555
adb install app-release.apk
```

---

## Google Play Store Submission

1. Build the AAB: `npm run build:aab`
2. Go to [play.google.com/console](https://play.google.com/console)
3. Create new app → Android TV category
4. Upload the `.aab` file
5. Add TV screenshots (1920×1080) and TV banner (1280×720)
6. Set content rating (PEGI / IARC)
7. Submit for review

---

## Samsung Smart TV (Tizen) — Separate Package

Samsung TVs run Tizen OS and require a separate web app package.

1. Install [Tizen Studio](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html)
2. Create a Web App project pointing to `https://www.gamestop.co.ke/movies`
3. Configure TV-specific CSS: `@media tv` queries
4. Package as `.wgt` file
5. Submit to [Samsung Smart TV Seller Office](https://seller.samsungapps.com)

---

## LG webOS — Separate Package

1. Install [webOS Studio](https://webostv.developer.lge.com/develop/tools/webos-studio-installation)
2. Create an IPK package wrapping the web app
3. Submit to [LG Content Store](https://seller.lgappstv.com)

---

## App Structure

```
tv-app/
├── src/
│   ├── App.tsx                    # Root component
│   ├── api/client.ts              # REST API client (auth, catalog, stream, search)
│   ├── navigation/AppNavigator.tsx
│   ├── screens/
│   │   ├── SplashScreen.tsx       # Token check + loading
│   │   ├── LoginScreen.tsx        # Phone + access code
│   │   ├── HomeScreen.tsx         # Hero banner + content rows
│   │   ├── DetailScreen.tsx       # Movie detail + play button
│   │   ├── PlayerScreen.tsx       # HLS video player
│   │   └── SearchScreen.tsx       # Catalog + TMDB search
│   └── components/
│       ├── FocusableCard.tsx      # D-pad focusable movie card
│       ├── MovieRow.tsx           # Horizontal scroll row
│       └── HeroBanner.tsx         # Full-width hero with play/info buttons
└── android/
    ├── app/
    │   ├── build.gradle           # minSdk 21, TV Leanback, signing config
    │   └── src/main/
    │       └── AndroidManifest.xml # LEANBACK_LAUNCHER + no touchscreen required
    └── build.gradle
```

---

## API Endpoints Used

All backed by `https://www.gamestop.co.ke/api/movies/`:

| Endpoint | Method | Description |
|---|---|---|
| `/auth/login/` | POST | Phone + access code → session cookie |
| `/catalog/` | GET | All content with sections |
| `/stream/?slug=&id=` | GET | HLS stream URL for a content item |
| `/search/?q=` | GET | Search library + TMDB |
