import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CompassApp from '@/components/compass/CompassApp';
import { PERSONA_CONTENT, personaBySlug } from '@/content/personas';
import { BRAND } from '@/brand';

/**
 * One route per assessment, so a link can put someone straight into their own
 * context: /student, /teacher, /parent, /leader, /minister, /business.
 *
 * The page they land on is the same page, with their assessment already open.
 * Nobody is trapped: the other five are still one click away on the rail.
 */

export function generateStaticParams() {
  return PERSONA_CONTENT.map((p) => ({ persona: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ persona: string }> }
): Promise<Metadata> {
  const p = personaBySlug((await params).persona);
  if (!p) return {};
  const title = `${p.name} Assessment: ${BRAND.product}`;
  return {
    title,
    description: `${p.coreQuestion} ${p.minutes}. ${BRAND.poweredBy}.`,
    alternates: { canonical: `/${p.slug}` },
    openGraph: { title, description: p.coreQuestion, url: `${BRAND.url}/${p.slug}` },
  };
}

export default async function PersonaPage({ params }: { params: Promise<{ persona: string }> }) {
  const p = personaBySlug((await params).persona);
  if (!p) notFound();
  return <CompassApp initialPersona={p.id} />;
}
