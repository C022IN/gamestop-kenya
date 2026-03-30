import { fileURLToPath } from 'node:url';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';
import withPWAInit from '@ducanh2912/next-pwa';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => ({
  trailingSlash: true,
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  allowedDevOrigins: ['*.preview.same-app.com'],
  turbopack: {
    root: rootDir,
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }

    return config;
  },
  images: {
    unoptimized: true,
    domains: [
      'source.unsplash.com',
      'images.unsplash.com',
      'ext.same-assets.com',
      'ugc.same-assets.com',
      'via.placeholder.com',
      'image.tmdb.org',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ext.same-assets.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ugc.same-assets.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/**',
      },
    ],
  },
});

export default (phase) => withPWA(nextConfig(phase));
