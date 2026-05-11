# Store Submission Guide — GameStop Movies TV

## How to Get the Build Files

### Option A — GitHub Actions (recommended, free)

1. Go to **github.com/C022IN/gamestop-kenya → Actions → Build TV App (APK + AAB)**
2. Click **Run workflow** → main branch → Run
3. Wait ~15 min for the build
4. Download artifacts:
   - `gamestop-movies-tv-release-apk` → APK file (sideload + Amazon Appstore)
   - `gamestop-movies-tv-release-aab` → AAB file (Google Play Store)

**First time only — add keystore secrets to GitHub:**
1. Generate a keystore locally:
   ```bash
   keytool -genkey -v \
     -keystore gamestop-movies.keystore \
     -alias gamestop-movies \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Base64-encode it: `base64 -i gamestop-movies.keystore | pbcopy`
3. In GitHub repo → Settings → Secrets → Actions → New secret:
   - `TV_KEYSTORE_BASE64` = the base64 string
   - `TV_KEYSTORE_PASSWORD` = your keystore password
   - `TV_KEY_ALIAS` = `gamestop-movies`
   - `TV_KEY_PASSWORD` = your key password

### Option B — Codemagic (easier Play Store integration)

1. Go to **codemagic.io** → Sign in with GitHub
2. Add repository `C022IN/gamestop-kenya`
3. Codemagic detects `codemagic.yaml` automatically
4. Upload your keystore in Codemagic → Settings → Code signing → Android
5. Add Google Play JSON credentials for auto-publish
6. Click **Start build**

---

## Google Play Store

**App type:** Android TV app

1. Go to **play.google.com/console** → Create app
2. App details:
   - Name: `GameStop Movies`
   - Language: English
   - App or game: App
   - Free or paid: Free (subscription inside)
3. Set up your app:
   - Content rating: Complete IARC questionnaire
   - Target audience: 18+ (movies)
   - App category: Entertainment
4. Production track → Upload AAB (`app-release.aab`)
5. Required assets:
   - TV banner: 1280×720 PNG (required for Android TV)
   - Screenshots: at least 2 TV screenshots (1920×1080)
   - Feature graphic: 1024×500
6. Select distribution: **Android TV** (tick TV checkbox)
7. Submit for review (typically 2–7 days)

---

## Amazon Appstore (Fire TV)

1. Go to **developer.amazon.com/apps-and-games** → Add a New App
2. App information:
   - App title: `GameStop Movies`
   - Category: Entertainment → Video
   - Content rating: 18+
3. Upload APK (`app-release.apk`)
   - Platform: Fire TV
   - Device support: Fire TV Stick, Fire TV Cube, Fire TV Edition
4. Screenshots: Fire TV screenshots at 1920×1080
5. Description + icon (512×512)
6. Submit — Amazon review takes 1–3 business days

---

## App Details to Have Ready

| Field | Value |
|---|---|
| Package / Bundle ID | `ke.co.gamestop.movies` |
| App name | GameStop Movies |
| Short description | Stream movies and TV with your GameStop Kenya subscription |
| Category | Entertainment |
| Content rating | 18+ / Mature |
| Privacy policy URL | `https://www.gamestop.co.ke/privacy` |
| Contact email | collanjeo@gmail.com |

---

## Sideloading (no store needed)

### Fire TV
```bash
adb connect <fire-tv-ip>:5555
adb install app-release.apk
```
Enable: Settings → My Fire TV → Developer Options → ADB Debugging + Apps from Unknown Sources

### Android TV / Google TV
```bash
adb connect <tv-ip>:5555
adb install app-release.apk
```
Enable: Settings → Device Preferences → Developer Options → USB Debugging

### TCL / Hisense (via USB)
1. Copy APK to USB drive
2. Insert in TV → open File Manager
3. Navigate to APK → Install
