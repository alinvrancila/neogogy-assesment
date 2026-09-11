/**
 * The v2 print entry. Kept beside the v1 one until the flag flips.
 */
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { OrganisationDocument, registerFonts, type PageSizeName } from '@/report/org/document';
import type { OrganisationReportAnalytics } from '@/engine/orgAnalytics';
import type { OrgProfile } from '@/lib/orgProfile';

export async function generateOrgReportPdf(
  a: OrganisationReportAnalytics, size: PageSizeName = 'Letter',
  profile?: OrgProfile | null,
): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(<OrganisationDocument a={a} size={size} profile={profile} />);
}

export { OrganisationDocument, PAGE_SIZES } from '@/report/org/document';
