import type { Metadata } from 'next';
import LegalPage, { legalMetadata } from '@/components/site/LegalPage';
import { TERMS } from '@/content/legal';

export const metadata: Metadata = legalMetadata('Terms of use', TERMS.summary);

export default function Page() {
  return <LegalPage doc={TERMS} />;
}
