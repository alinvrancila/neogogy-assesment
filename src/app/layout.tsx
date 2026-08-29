import type { Metadata, Viewport } from 'next';
import { Crimson_Pro, Inter } from 'next/font/google';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#141210'
};

const crimson = Crimson_Pro({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-serif', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

const SHARE_TITLE = 'The Neogogy Formation Compass';
// One share card for every network. 1200 by 630 is the size Facebook,
// LinkedIn and X all crop from, so this is what a shared link shows.
const SHARE_IMAGE = {
  url: '/share/og.jpg',
  width: 1200,
  height: 630,
  alt: 'A climber on a lit route of ten steps toward a mountain summit, under the words: find out what stage of AI usage you are in, and why it matters.',
  type: 'image/jpeg',
};
const SHARE_DESC = 'Find out where you stand with AI. A free assessment across ten dimensions of how you work with AI, placing you on a ten stage route from first contact to a mature practice, with a personal report to keep. From the International Center for Applied Neogogy (ICAN).';

export const metadata: Metadata = {
  title: SHARE_TITLE,
  description: SHARE_DESC,
  metadataBase: new URL('https://assessment.neogogy.ai'),
  applicationName: 'The Neogogy Formation Compass',
  keywords: ['AI learning', 'AI literacy', 'Neogogy', 'ICAN', 'formation', 'critical thinking', 'education', 'assessment'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: SHARE_TITLE,
    description: SHARE_DESC,
    url: 'https://assessment.neogogy.ai',
    siteName: 'The Neogogy Formation Compass',
    locale: 'en_US',
    images: [SHARE_IMAGE]
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_TITLE,
    description: SHARE_DESC,
    images: [SHARE_IMAGE]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${crimson.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
