import type { Metadata } from 'next';
import LegalPage, { legalMetadata } from '@/components/site/LegalPage';
import { PRIVACY } from '@/content/legal';

export const metadata: Metadata = legalMetadata('Privacy notice', PRIVACY.summary);

export default function Page() {
  return <LegalPage doc={PRIVACY} />;
}
