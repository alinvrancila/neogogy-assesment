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

const SHARE_TITLE = 'Neogogy Human Advantage Assessment';
// One share card for every network. 1200 by 630 is the size Facebook,
// LinkedIn and X all crop from, so this is what a shared link shows.
const SHARE_IMAGE = {
  url: '/share/og.jpg',
  width: 1200,
  height: 630,
  alt: 'A person standing on a summit above the clouds at sunrise, under the words: AI is becoming more capable, are you? Take the Neogogy Human Advantage Assessment to learn more.',
  type: 'image/jpeg',
};
// Two sentences: the question the assessment exists to ask, then what a
// respondent gets for answering it. Kept near 200 characters, which is what
// Facebook, LinkedIn and X show before they cut.
const SHARE_DESC = 'Is the way you use AI, or choose not to use AI, strengthening your capabilities? A free assessment from ICAN.ph across ten dimensions, in six perspectives, with a personal Human Advantage Report to keep.';

export const metadata: Metadata = {
  title: SHARE_TITLE,
  description: SHARE_DESC,
  metadataBase: new URL('https://assessment.neogogy.ai'),
  applicationName: 'Neogogy Human Advantage Assessment',
  keywords: ['human advantage', 'AI capability', 'AI literacy', 'Neogogy', 'ICAN', 'judgment', 'critical thinking', 'education', 'assessment'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: SHARE_TITLE,
    description: SHARE_DESC,
    url: 'https://assessment.neogogy.ai',
    siteName: 'Neogogy Human Advantage Assessment',
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
