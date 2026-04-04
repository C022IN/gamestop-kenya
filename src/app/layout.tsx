import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ClientBody from './ClientBody';
import WhatsAppButton from '@/components/WhatsAppButton';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gamestop.co.ke'),
  title: {
    default: 'GameStop Kenya - Consoles, Games & Digital Content | Nairobi',
    template: '%s | GameStop Kenya',
  },
  description:
    "Kenya's #1 gaming store. Buy PS5, Xbox Series X, Nintendo Switch, gaming accessories, and digital codes online. Fast delivery in Nairobi, pay with M-Pesa. 50,000+ happy customers.",
  keywords: [
    'GameStop Kenya',
    'gaming store Kenya',
    'PS5 Nairobi',
    'Xbox Kenya',
    'Nintendo Switch Kenya',
    'buy games online Kenya',
    'M-Pesa gaming',
    'IPTV Kenya',
    'gaming accessories Nairobi',
  ],
  authors: [{ name: 'GameStop Kenya' }],
  creator: 'GameStop Kenya',
  publisher: 'GameStop Kenya',
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://www.gamestop.co.ke',
    siteName: 'GameStop Kenya',
    title: 'GameStop Kenya - Consoles, Games & Digital Content',
    description:
      "Kenya's #1 gaming store. PS5, Xbox, Nintendo Switch, digital codes, IPTV. Fast delivery, M-Pesa accepted.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GameStop Kenya - Consoles, Games & Digital Content',
    description:
      "Kenya's #1 gaming store. PS5, Xbox, Nintendo Switch, digital codes, IPTV. Fast delivery, M-Pesa accepted.",
    creator: '@GameStopKenya',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GS Movies',
    startupImage: [
      { url: '/icons/apple-splash-2048-2732.jpg', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/icons/apple-splash-2732-2048.jpg', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/icons/apple-splash-1290-2796.jpg', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/icons/apple-splash-2796-1290.jpg', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/icons/apple-splash-1179-2556.jpg', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/icons/apple-splash-2556-1179.jpg', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/icons/apple-splash-1170-2532.jpg', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/icons/apple-splash-2532-1170.jpg', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/icons/apple-splash-750-1334.jpg', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/icons/apple-splash-1334-750.jpg', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
    ],
  },
  icons: {
    apple: '/icons/apple-icon-180.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClientBody className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <WhatsAppButton />
      </ClientBody>
    </html>
  );
}
