# GameStop Kenya Movies — Kodi Addon

## Installation

1. Copy the `plugin.video.gamestop.kenya` folder to your Kodi addons directory:
   - **Android TV / Fire TV:** `/sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/`
   - **Linux:** `~/.kodi/addons/`
   - **Windows:** `%APPDATA%\Kodi\addons\`
2. In Kodi go to **Settings → Add-ons → Install from zip** and select the folder, or enable **Unknown Sources** and install from file manager.
3. After installing, go to **Add-on settings** and confirm **Site URL** is `https://www.gamestop.co.ke`.
4. Open the addon and sign in with your **phone number** and **access code**.

## Structure

```
plugin.video.gamestop.kenya/
├── addon.xml              # Kodi addon manifest
├── addon.py               # Main entry point
└── resources/
    ├── settings.xml       # User-configurable settings
    └── language/
        └── English/
            └── strings.po # UI strings
```

## Requirements

- Kodi 19 (Matrix) or newer
- `inputstream.adaptive` addon (for HLS streams) — usually pre-installed
- Active GameStop Kenya Movies membership
