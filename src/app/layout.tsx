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
  title: {
    default: 'GameStop Kenya â€” Consoles, Games & Digital Content | Nairobi',
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
    url: 'https://gamestop.co.ke',
    siteName: 'GameStop Kenya',
    title: 'GameStop Kenya â€” Consoles, Games & Digital Content',
    description:
      "Kenya's #1 gaming store. PS5, Xbox, Nintendo Switch, digital codes, IPTV. Fast delivery, M-Pesa accepted.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GameStop Kenya â€” Consoles, Games & Digital Content',
    description:
      "Kenya's #1 gaming store. PS5, Xbox, Nintendo Switch, digital codes, IPTV. Fast delivery, M-Pesa accepted.",
    creator: '@GameStopKenya',
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
