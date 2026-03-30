# PWA Icons

Place the following icon files in this directory before deploying:

| File                  | Size      | Purpose                        |
|-----------------------|-----------|--------------------------------|
| `pwa-192x192.png`     | 192×192   | PWA icon (Android home screen) |
| `pwa-512x512.png`     | 512×512   | PWA splash / maskable icon     |
| `screenshot-wide.png` | 1280×720  | TV/desktop install screenshot  |

## Generating Icons

Use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator):

```bash
npx pwa-asset-generator public/brand/gamestop-kenya-logo.svg public/icons \
  --background "#000000" \
  --padding "20%" \
  --manifest public/manifest.json
```

Or create them manually from `public/brand/gamestop-kenya-logo.svg`.
