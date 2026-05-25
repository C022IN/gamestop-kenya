/**
 * Enriches product image URLs using the Firecrawl API.
 * Scrapes official manufacturer pages to get the highest-quality product images.
 *
 * Usage:
 *   node scripts/enrich-product-images.mjs
 *
 * Reads FIRECRAWL_API_KEY from .env.local
 * Writes results to src/data/enriched-images.json
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load .env.local
const envPath = resolve(ROOT, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const API_KEY = process.env.FIRECRAWL_API_KEY;
if (!API_KEY) { console.error('Missing FIRECRAWL_API_KEY'); process.exit(1); }

const OUT_FILE = resolve(ROOT, 'src/data/enriched-images.json');

// ---------------------------------------------------------------------------
// Product → official manufacturer page to scrape
// Add new products here when expanding the catalog.
// ---------------------------------------------------------------------------
const PRODUCTS = [
  // ─── Hardware: Consoles ───────────────────────────────────────────────────
  {
    id: 'ps5-console-slim',
    name: 'Sony PlayStation 5 Slim',
    url: 'https://www.playstation.com/en-us/ps5/',
  },
  {
    id: 'xbox-series-x-console',
    name: 'Microsoft Xbox Series X',
    url: 'https://www.xbox.com/en-US/consoles/xbox-series-x',
  },
  {
    id: 'nintendo-switch-oled-console',
    name: 'Nintendo Switch OLED',
    url: 'https://www.nintendo.com/us/store/products/nintendo-switch-oled-model-white-set/',
  },

  // ─── Hardware: Controllers ────────────────────────────────────────────────
  {
    id: 'dualsense-wireless-controller',
    name: 'PlayStation DualSense Controller',
    url: 'https://www.playstation.com/en-us/accessories/dualsense-wireless-controller/',
  },
  {
    id: 'xbox-wireless-controller',
    name: 'Xbox Wireless Controller',
    url: 'https://www.xbox.com/en-US/accessories/controllers/xbox-wireless-controller',
  },
  {
    id: 'switch-pro-controller',
    name: 'Nintendo Switch Pro Controller',
    url: 'https://www.nintendo.com/us/store/products/pro-controller/',
  },

  // ─── Hardware: Audio ─────────────────────────────────────────────────────
  {
    id: 'razer-blackshark-v2-pro-2023',
    name: 'Razer BlackShark V2 Pro Wireless Headset',
    url: 'https://www.razer.com/gaming-headsets/razer-blackshark-v2-pro',
  },

  // ─── Hardware: Sim Racing ─────────────────────────────────────────────────
  {
    id: 'logitech-g923-racing-wheel',
    name: 'Logitech G923 Racing Wheel',
    url: 'https://www.logitechg.com/en-us/products/driving/g923-trueforce-sim-racing-wheel.941-000110.html',
  },

  // ─── Hardware: GPUs ───────────────────────────────────────────────────────
  {
    id: 'asus-dual-geforce-rtx-4060-oc-8gb',
    name: 'ASUS Dual GeForce RTX 4060 OC 8GB',
    url: 'https://www.asus.com/us/motherboards-components/graphics-cards/dual/dual-rtx4060-o8g/',
  },
  {
    id: 'asus-proart-geforce-rtx-5070-ti-16gb',
    name: 'ASUS ProArt GeForce RTX 5070 Ti 16GB',
    url: 'https://www.asus.com/us/motherboards-components/graphics-cards/proart/proart-rtx5070ti-16g/',
  },
  {
    id: 'asus-prime-radeon-rx-7800-xt-16gb',
    name: 'ASUS Prime Radeon RX 7800 XT 16GB',
    url: 'https://www.asus.com/us/motherboards-components/graphics-cards/prime/prime-rx7800xt-16g/',
  },
  {
    id: 'asus-prime-radeon-rx-9070-xt-16gb',
    name: 'ASUS Prime Radeon RX 9070 XT 16GB',
    url: 'https://www.asus.com/us/motherboards-components/graphics-cards/prime/prime-radeon-rx-9070-xt-16g/',
  },

  // ─── Games ────────────────────────────────────────────────────────────────
  {
    id: 'marvel-spiderman-2-ps5',
    name: "Marvel's Spider-Man 2",
    url: 'https://www.playstation.com/en-us/games/marvels-spider-man-2/',
  },
  {
    id: 'super-mario-bros-wonder-switch',
    name: 'Super Mario Bros. Wonder',
    url: 'https://www.nintendo.com/us/store/products/super-mario-bros-wonder-switch/',
  },
  {
    id: 'forza-horizon-5-xbox',
    name: 'Forza Horizon 5',
    url: 'https://www.xbox.com/en-US/games/store/forza-horizon-5/9NKX70BBCDRN',
  },
  {
    id: 'cyberpunk-2077-ultimate-pc',
    name: 'Cyberpunk 2077 Ultimate Edition',
    url: 'https://www.cyberpunk.net/en/news/49982/cyberpunk-2077-ultimate-edition',
  },
  {
    id: 'god-of-war-ragnarok-ps5',
    name: 'God of War Ragnarök',
    url: 'https://www.playstation.com/en-us/games/god-of-war-ragnarok/',
  },
  {
    id: 'hogwarts-legacy-ps5',
    name: 'Hogwarts Legacy',
    url: 'https://www.hogwartslegacy.com/en-us',
  },
  {
    id: 'mortal-kombat-1-ps5',
    name: 'Mortal Kombat 1',
    url: 'https://www.mortalkombat.com/en-us',
  },
  {
    id: 'ea-sports-fc-25-ps5',
    name: 'EA Sports FC 25',
    url: 'https://www.ea.com/games/ea-sports-fc/fc-25',
  },
  {
    id: 'resident-evil-4-remake-ps5',
    name: 'Resident Evil 4 Remake',
    url: 'https://www.residentevil.com/re4/en-us/',
  },
  {
    id: 'zelda-totk-switch',
    name: 'The Legend of Zelda: Tears of the Kingdom',
    url: 'https://www.nintendo.com/us/store/products/the-legend-of-zelda-tears-of-the-kingdom-switch/',
  },

  // ─── Gift Cards / Digital ────────────────────────────────────────────────
  {
    id: 'psn-gift-card',
    name: 'PlayStation Store Gift Card',
    url: 'https://www.playstation.com/en-us/accessories/playstation-store-gift-card/',
  },
  {
    id: 'xbox-gift-card',
    name: 'Xbox Gift Card',
    url: 'https://www.xbox.com/en-US/games/subscriptions/game-pass',
  },
  {
    id: 'nintendo-eshop-card',
    name: 'Nintendo eShop Card',
    url: 'https://www.nintendo.com/us/catalog/eshop/gift-cards/',
  },
  {
    id: 'steam-wallet-card',
    name: 'Steam Wallet Card',
    url: 'https://store.steampowered.com/digitalgiftcards/',
  },
  {
    id: 'roblox-gift-card',
    name: 'Roblox Gift Card',
    url: 'https://www.roblox.com/giftcards',
  },
  {
    id: 'xbox-game-pass',
    name: 'Xbox Game Pass Ultimate',
    url: 'https://www.xbox.com/en-US/games/subscriptions/game-pass',
  },
];

// ---------------------------------------------------------------------------

function absoluteUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http')) return url;
  return '';
}

async function scrape(product) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: product.url,
      formats: ['extract'],
      extract: {
        schema: {
          type: 'object',
          properties: {
            productName: { type: 'string' },
            mainImageUrl: {
              type: 'string',
              description:
                'The main hero or product shot image URL — prefer a clean product-only image, not a lifestyle or marketing banner.',
            },
          },
        },
      },
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  if (!json.success || !json.data) return null;

  const extract = json.data.extract ?? {};
  const meta = json.data.metadata ?? {};

  const candidates = [
    extract.mainImageUrl,
    meta['og:image'],
    meta.ogImage,
    meta.thumbnail,
  ].map(absoluteUrl).filter(Boolean);

  return candidates[0] ?? null;
}

async function run() {
  // Load existing enriched cache
  let cache = {};
  if (existsSync(OUT_FILE)) {
    cache = JSON.parse(readFileSync(OUT_FILE, 'utf8'));
  }

  const now = new Date().toISOString();
  let enriched = 0;
  let failed = 0;

  for (const product of PRODUCTS) {
    // Skip if already enriched (re-run with --force to refresh all)
    if (cache[product.id] && !process.argv.includes('--force')) {
      console.log(`  ⏭  ${product.id} (cached)`);
      continue;
    }

    process.stdout.write(`  🔍 ${product.id} … `);

    try {
      const url = await scrape(product);
      if (url) {
        cache[product.id] = { url, source: product.url, fetchedAt: now };
        console.log(`✅  ${url.slice(0, 80)}`);
        enriched++;
      } else {
        console.log('⚠️  no image found');
        failed++;
      }
    } catch (err) {
      console.log(`❌  ${err.message}`);
      failed++;
    }

    // Be polite to the API — 1 req/sec
    await new Promise(r => setTimeout(r, 1000));
  }

  writeFileSync(OUT_FILE, JSON.stringify(cache, null, 2));
  console.log(`\n✅ Done. Enriched: ${enriched}  Failed: ${failed}  Total cached: ${Object.keys(cache).length}`);
  console.log(`   Written to ${OUT_FILE}`);
}

run().catch(err => { console.error(err); process.exit(1); });
