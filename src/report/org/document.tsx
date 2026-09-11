/**
 * The organisation report, v2.
 *
 * Behind ORG_REPORT_V2. The existing report stays exactly as it is with the
 * flag off, which is the transition the brief asks for.
 *
 * Page size is a parameter rather than a constant, because the brief requires
 * Letter and A4 to both render cleanly and a report that only ever renders one
 * of them has not been shown to do that.
 */

import React from 'react';
import path from 'path';
import { Document, Page, StyleSheet, Text, View, Font, Image } from '@react-pdf/renderer';
import { BRAND, ECOSYSTEM } from '@/brand';
import { Chapter03, CH03 } from './chapters/ch03-journey';
import { TOKENS as T } from './kit/blocks';
import type { OrganisationReportAnalytics } from '@/engine/orgAnalytics';

export const PAGE_SIZES = {
  Letter: { w: 612, h: 792 },
  A4: { w: 595.28, h: 841.89 },
} as const;
export type PageSizeName = keyof typeof PAGE_SIZES;

const SAFE = 44;
const FONTS = (f: string) => path.join(process.cwd(), 'public', 'fonts', f);
const ORG = (file: string) => path.join(process.cwd(), 'public', file.replace(/^\//, ''));

let registered = false;
export function registerFonts() {
  if (registered) return;
  Font.register({ family: 'PlexSans', fonts: [
    { src: FONTS('IBMPlexSans-Regular.ttf') },
    { src: FONTS('IBMPlexSans-SemiBold.ttf'), fontWeight: 600 },
  ] });
  Font.register({ family: 'PlexMono', fonts: [
    { src: FONTS('IBMPlexMono-Regular.ttf') },
    { src: FONTS('IBMPlexMono-Medium.ttf'), fontWeight: 500 },
  ] });
  Font.register({ family: 'SourceSerif', fonts: [
    { src: FONTS('SourceSerif4-Regular.ttf') },
    { src: FONTS('SourceSerif4-SemiBold.ttf'), fontWeight: 600 },
  ] });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const S = StyleSheet.create({
  page: { backgroundColor: T.page, paddingTop: 44, paddingBottom: 54,
    paddingHorizontal: SAFE, fontFamily: 'PlexSans', color: T.ink },
  foot: { position: 'absolute', left: SAFE, right: SAFE, bottom: 26, flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: T.hair, paddingTop: 7 },
  footText: { fontFamily: 'PlexMono', fontSize: 6.6, color: T.mute },
});

/** The running footer the brief specifies, on every page. */
const Footer = ({ label }: { label: string }) => (
  <View style={S.foot} fixed>
    <Text style={{ ...S.footText, flex: 1 }}>{label} · {BRAND.product}</Text>
    <Text style={S.footText} render={({ pageNumber, totalPages }) => `page ${pageNumber} of ${totalPages}`} />
  </View>
);

/** The chapter registry. The visual contents page and the tests both read it. */
export const CHAPTERS = [CH03];

export function OrganisationDocument({ a, size = 'Letter' }: {
  a: OrganisationReportAnalytics; size?: PageSizeName;
}) {
  const dim = PAGE_SIZES[size];
  const width = dim.w - SAFE * 2;
  const label = a.group.label;
  return (
    <Document
      title={`${label}, ${BRAND.product}`}
      author="International Center for Applied Neogogy"
      subject={`Organisational AI readiness and human advantage, across ${a.group.n} people`}
    >
      <Page size={[dim.w, dim.h]} style={S.page}>
        <Chapter03 a={a} width={width} />
        <Footer label={label} />
      </Page>
    </Document>
  );
}
