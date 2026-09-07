import type { Metadata, Viewport } from 'next';
import { Crimson_Pro, Inter } from 'next/font/google';
import './globals.css';
import { SHARE_TITLE, SHARE_DESC, SHARE_IMAGE } from '@/lib/siteMeta';
import { BRAND } from '@/brand';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#141210'
};

const crimson = Crimson_Pro({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-serif', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: SHARE_TITLE,
  description: SHARE_DESC,
  metadataBase: new URL('https://assessment.neogogy.ai'),
  applicationName: BRAND.product,
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
