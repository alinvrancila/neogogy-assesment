import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CompassApp from '@/components/compass/CompassApp';
import { PERSONA_CONTENT, personaBySlug, type PersonaContent } from '@/content/personas';
import { BRAND } from '@/brand';
import { shareCard } from '@/lib/shareCard';

/**
 * One route per assessment, so a link can put someone straight into their own
 * context: /student, /teacher, /parent, /leader, /minister, /business.
 *
 * The page they land on is the same page, with their assessment already open
 * and scrolled to. Nobody is trapped: the other five are still one click away.
 *
 * Each route carries its own share card. Drop a 1200 by 630 image in at
 * public/share/og-<slug>.jpg and this picks it up; until then the route shares
 * the site card rather than nothing, so a link posted today still previews.
 */

/** What the card says when a link is posted, in the persona's own terms. */
function shareText(p: PersonaContent) {
  return `${p.coreQuestion} A free assessment, ${p.minutes.toLowerCase()}, with a personal ${BRAND.report} to keep. ${BRAND.poweredBy}.`;
}

export function generateStaticParams() {
  return PERSONA_CONTENT.map((p) => ({ persona: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ persona: string }> }
): Promise<Metadata> {
  const p = personaBySlug((await params).persona);
  if (!p) return {};

  const title = `${p.name} Assessment: ${BRAND.product}`;
  const description = shareText(p);
  const url = `${BRAND.url}/${p.slug}`;
  const image = {
    url: shareCard(p.slug),
    width: 1200,
    height: 630,
    alt: `${BRAND.product}, the ${p.name} assessment. ${p.coreQuestion}`,
    type: 'image/jpeg',
  };

  return {
    title,
    description,
    alternates: { canonical: `/${p.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: BRAND.product,
      locale: 'en_US',
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function PersonaPage({ params }: { params: Promise<{ persona: string }> }) {
  const p = personaBySlug((await params).persona);
  if (!p) notFound();
  return <CompassApp initialPersona={p.id} />;
}
