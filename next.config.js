const path = require('path');
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => ({
  trailingSlash: true,
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  allowedDevOrigins: ['*.preview.same-app.com'],
  turbopack: {
    root: path.resolve(__dirname),
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

module.exports = nextConfig;
