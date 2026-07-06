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
const SHARE_DESC = 'Is AI making you wiser, or just faster? A free, research-backed diagnostic of how you learn with AI, with a personal report. From the International Center for Applied Neogogy (ICAN).';

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
    locale: 'en_US'
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_TITLE,
    description: SHARE_DESC
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${crimson.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
