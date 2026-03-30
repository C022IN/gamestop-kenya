import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GameStop Kenya Movies',
    short_name: 'GS Movies',
    description: 'Stream movies, series, and live TV — GameStop Kenya',
    start_url: '/movies',
    scope: '/movies',
    display: 'fullscreen',
    orientation: 'landscape',
    background_color: '#000000',
    theme_color: '#000000',
    categories: ['entertainment', 'video'],
    icons: [
      {
        src: '/icons/manifest-icon-192.maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/manifest-icon-192.maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/manifest-icon-512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/manifest-icon-512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/icons/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        // @ts-ignore — form_factor is valid in the spec but not yet in Next.js types
        form_factor: 'wide',
        label: 'GameStop Kenya Movies on TV',
      },
    ],
  };
}
