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
import { CHAPTER_COMPONENTS } from './chapters/all';
import { CHAPTER_META } from './chapters/registry';
import { Cover, Contents, Appendix } from './chapters/frame';
import { TOKENS as T } from './kit/blocks';
import type { OrganisationReportAnalytics } from '@/engine/orgAnalytics';
import type { OrgProfile } from '@/lib/orgProfile';

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
  // SemiBold is registered as 600 and as 700. Charts ask for 700 where the
  // brief says a caveat is printed in bold rather than in capitals, and an
  // unregistered weight does not fall back in react-pdf: it reaches textkit as
  // a missing font and fails with "font.layout is not a function", which is a
  // message that says nothing about the cause.
  Font.register({ family: 'PlexSans', fonts: [
    { src: FONTS('IBMPlexSans-Regular.ttf') },
    { src: FONTS('IBMPlexSans-SemiBold.ttf'), fontWeight: 600 },
    { src: FONTS('IBMPlexSans-SemiBold.ttf'), fontWeight: 700 },
  ] });
  Font.register({ family: 'PlexMono', fonts: [
    { src: FONTS('IBMPlexMono-Regular.ttf') },
    { src: FONTS('IBMPlexMono-Medium.ttf'), fontWeight: 500 },
    { src: FONTS('IBMPlexMono-Medium.ttf'), fontWeight: 600 },
  ] });
  Font.register({ family: 'SourceSerif', fonts: [
    { src: FONTS('SourceSerif4-Regular.ttf') },
    { src: FONTS('SourceSerif4-SemiBold.ttf'), fontWeight: 600 },
    { src: FONTS('SourceSerif4-SemiBold.ttf'), fontWeight: 700 },
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
export { CHAPTER_META as CHAPTERS };

export function OrganisationDocument({ a, size = 'Letter', profile }: {
  a: OrganisationReportAnalytics; size?: PageSizeName; profile?: OrgProfile | null;
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
      {/* The cover places everything absolutely, so it takes the whole sheet
          rather than the text frame the chapters use. */}
      <Page size={[dim.w, dim.h]} style={{ backgroundColor: T.terracotta, fontFamily: 'PlexSans' }}>
        <Cover a={a} w={dim.w} h={dim.h} profile={profile} />
      </Page>

      <Page size={[dim.w, dim.h]} style={S.page}>
        <Contents a={a} width={width} />
        <Footer label={label} />
      </Page>

      {/*
        The chapters flow rather than each starting a fresh sheet. Twenty-two
        page starts left twenty-two partial pages, and a chapter that needs a
        page and a third was taking two. Blocks still never split, so the breaks
        fall between them, and each chapter's opening is held together by
        ChapterOpen so a heading cannot be orphaned at the foot of a page.

      */}
      <Page size={[dim.w, dim.h]} style={S.page}>
        {/* No chapter forces a break. Chapter 1 already opens this sheet, and
            forcing one there produced a blank page carrying only the footer. */}
        {CHAPTER_COMPONENTS.map(({ n, C }) => (
          <View key={n}>
            <C a={a} width={width} />
          </View>
        ))}
        {/* The appendix flows on from the last chapter. Forcing a break here
            produced a blank page whenever the chapters happened to end near a
            boundary, which is the same fault chapter 1 had. */}
        <View>
          <Appendix a={a} />
        </View>
        <Footer label={label} />
      </Page>
    </Document>
  );
}
