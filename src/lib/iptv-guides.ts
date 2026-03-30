export type DevicePlatform = 'tv' | 'mobile' | 'web' | 'box';

export interface DeviceOnboardingGuide {
  id: string;
  platform: DevicePlatform;
  title: string;
  headline: string;
  app: string;
  summary: string;
  steps: string[];
}

export const DEVICE_ONBOARDING_GUIDES: DeviceOnboardingGuide[] = [
  {
    id: 'smart-tv',
    platform: 'tv',
    title: 'Smart TV',
    headline: 'Main household screen setup.',
    app: 'IPTV Smarters Pro or TiviMate',
    summary: 'Best for Samsung, LG, Android TV, Google TV, Fire TV, and Apple TV style setups.',
    steps: [
      'Install the player on the TV or streaming stick.',
      'Use the protected playlist URL from the payment screen for the fastest setup path.',
      'If your provider supports it, you can also use the host, username, and password shown after activation.',
    ],
  },
  {
    id: 'mobile',
    platform: 'mobile',
    title: 'Phone and Tablet',
    headline: 'Fast setup on Android or iPhone.',
    app: 'IPTV Smarters Pro or GSE',
    summary: 'Useful for mobile-first customers who want the quickest setup path after payment.',
    steps: [
      'Install the mobile player.',
      'Paste the protected playlist URL or use the provider credentials when supported.',
      'Save favorites for daily access.',
    ],
  },
  {
    id: 'web',
    platform: 'web',
    title: 'Web Browser',
    headline: 'Browser-based playback for laptop users.',
    app: 'Browser-compatible player',
    summary: 'Helpful for quick support sessions and customers who watch from desktop.',
    steps: [
      'Open the browser player.',
      'Log in with the subscription credentials.',
      'Confirm playback before leaving the payment session.',
    ],
  },
  {
    id: 'tv-box',
    platform: 'box',
    title: 'Android Box and Kodi',
    headline: 'Power-user setup for manual players.',
    app: 'Kodi or VLC',
    summary: 'Useful for advanced users who want manual playlists and custom playback.',
    steps: [
      'Open Kodi, VLC, or another compatible player.',
      'Paste the protected playlist URL or configure the provider endpoint if available.',
      'Save the playlist locally after the first successful login.',
    ],
  },
];
