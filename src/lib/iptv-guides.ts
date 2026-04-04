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
    headline: 'Best overall TV setup path.',
    app: 'TiviMate or IPTV Smarters',
    summary: 'Use Xtream or the protected playlist on Android TV, Google TV, Fire TV, Samsung, and LG players.',
    steps: [
      'Open TiviMate or IPTV Smarters on the TV or streaming stick.',
      'Use the protected playlist URL first for the most reliable import path.',
      'If your subscription includes provider-issued Xtream login details, you can enter the portal host, username, and password instead.',
    ],
  },
  {
    id: 'mobile',
    platform: 'mobile',
    title: 'Phone and Tablet',
    headline: 'Quick setup from the phone that paid.',
    app: 'IPTV Smarters or VLC',
    summary: 'Good for testing the subscription fast before moving to a TV, box, or shared household device.',
    steps: [
      'Install IPTV Smarters, VLC, or another M3U-compatible player.',
      'Paste the protected playlist URL for the fastest test.',
      'Use player login details only when the app specifically asks for them.',
      'Confirm playback once, then save the app for later support checks.',
    ],
  },
  {
    id: 'web',
    platform: 'web',
    title: 'Web Browser',
    headline: 'Secondary browser access.',
    app: 'GameStop Member Hub',
    summary: 'Use the browser for laptop, mobile, and support sessions. TV apps remain the primary playback path.',
    steps: [
      'Open the member hub from the sign-in page with the saved phone number and access code.',
      'Use browser playback for quick watching, support, or checking entitlement.',
      'Return to the TV setup section anytime if you need playlist or Xtream details again.',
    ],
  },
  {
    id: 'tv-box',
    platform: 'box',
    title: 'Android Box and Kodi',
    headline: 'Manual setup for advanced users.',
    app: 'Kodi or VLC',
    summary: 'Best when the customer wants full control over playlist import, playback settings, or a box-based install.',
    steps: [
      'Open Kodi, VLC, or another compatible player on the box or PC.',
      'In Kodi, enable PVR IPTV Simple Client and paste the protected playlist URL as the remote M3U path.',
      'Use provider-issued player login details only if the target app supports them.',
      'Run one playback test, then keep the credentials saved for future reprovision support.',
    ],
  },
];
