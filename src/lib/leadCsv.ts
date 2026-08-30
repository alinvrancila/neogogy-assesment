/**
 * The records export.
 *
 * One row per submission, carrying everything held about that person: what
 * they typed, what the engine made of it, the context the submission arrived
 * with, and every individual answer. The point is that an exported file can be
 * loaded anywhere else without needing this application to interpret it, so
 * nothing is left encoded and nothing is left out.
 *
 * Pure: takes records, returns a string.
 */

import type { LeadRecord } from '@/lib/storage';
import type { CompassResult, ConstructId } from '@/engine/types';
import { CONSTRUCTS } from '@/engine/config';
import { domainOf, isOrgDomain } from '@/lib/analytics';

const CONSTRUCT_IDS = Object.keys(CONSTRUCTS) as ConstructId[];

/** Excel reads a leading = or + as a formula, so those cells are quoted out. */
const cell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  let text = typeof value === 'boolean' ? (value ? 'yes' : 'no') : String(value);
  if (/^[=+@\-\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const list = (values: Array<string | undefined>) => values.filter(Boolean).join('; ');

const band = (score: number) => (score >= 65 ? 'strength' : score >= 45 ? 'developing' : 'needs attention');

type Row = Record<string, unknown>;

/** Attempt history per person, so each row can carry its own progression. */
function historyFor(leads: LeadRecord[]) {
  const byEmail = new Map<string, LeadRecord[]>();
  for (const lead of leads) {
    const key = (lead.email || '').toLowerCase();
    if (!key) continue;
    if (!byEmail.has(key)) byEmail.set(key, []);
    byEmail.get(key)!.push(lead);
  }
  for (const list of byEmail.values()) list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return byEmail;
}

function resultOf(lead: LeadRecord): CompassResult | null {
  return lead.engineVersion === 2 && lead.result ? (lead.result as CompassResult) : null;
}

/**
 * Build one flat row per record. Column order is stable and grouped: who they
 * are, what they scored, how they got there, then the raw answers.
 */
export function buildLeadRows(leads: LeadRecord[]): Row[] {
  const history = historyFor(leads);

  return leads.map((lead) => {
    const r = resultOf(lead);
    const m = lead.meta;
    const domain = domainOf(lead.email || '');
    const mine = history.get((lead.email || '').toLowerCase()) || [lead];
    const position = mine.findIndex((x) => x.id === lead.id);
    const previous = position > 0 ? mine[position - 1] : null;
    const previousIndex = previous?.engineVersion === 2
      ? (previous.result as CompassResult | undefined)?.stage.rawIndex
      : previous?.overall;

    const row: Row = {
      /* who they are */
      id: lead.id,
      submitted_at: lead.createdAt,
      submitted_date: (lead.createdAt || '').slice(0, 10),
      name: lead.name,
      first_name: lead.firstName || '',
      last_name: lead.lastName || '',
      email: lead.email,
      email_domain: domain,
      organisational_email: domain ? isOrgDomain(domain) : '',
      mobile_phone: lead.mobilePhone || '',
      heard_from: lead.heardFrom || '',
      marketing_consent: lead.consent,

      /* what they were asked */
      engine_version: lead.engineVersion ?? 1,
      role: lead.role,
      usage_level: lead.usageVal ?? '',
      baseline_feels_healthy: lead.baseline?.b1 ?? '',
      baseline_predicted: lead.baseline?.b2 ?? '',

      /* where they landed */
      developmental_index: r ? r.stage.rawIndex : lead.overall,
      stage: lead.stage ?? '',
      stage_name: lead.stageName || '',
      substage: r?.stage.substage || '',
      placed_index: r ? r.stage.index : '',
      gated: r ? !!r.stage.gated : '',
      gate_would_reach_stage: r?.stage.gated?.cappedFrom ?? '',
      gate_reason: r?.stage.gated?.reasons[0] || '',
      archetype_id: lead.archetypeId || lead.persona || '',
      archetype_name: lead.archetypeName || lead.personaName || '',
      overall_confidence: lead.confidence || r?.overallConfidence || '',
      next_stage: r?.nextTarget.stage ?? '',
      next_stage_name: r?.nextTarget.stageName || '',
      bottleneck: r ? CONSTRUCTS[r.bottleneck.construct].name : '',
      bottleneck_via_gate: r ? r.bottleneck.viaGate : '',

      /* the six composite questions */
      composite_future_readiness: r?.composites.futureReadiness ?? '',
      composite_augmentation: r?.composites.augmentation ?? '',
      composite_judgment: r?.composites.judgment ?? '',
      composite_capability_transfer: r?.composites.capabilityTransfer ?? '',
      composite_dependency_index: r?.composites.dependencyIndex ?? '',
      composite_underexposure: r?.composites.underexposure ?? '',

      /* the narrative findings, flattened */
      strengths: r ? list(r.strengths.map((s) => `${CONSTRUCTS[s.construct].name} ${s.score}`)) : '',
      vulnerabilities: r ? list(r.vulnerabilities.map((s) => `${CONSTRUCTS[s.construct].name} ${s.score}`)) : '',
      help_patterns: r ? list(r.patterns.filter((p) => p.kind === 'help').map((p) => p.label)) : '',
      harm_patterns: r ? list(r.patterns.filter((p) => p.kind === 'harm').map((p) => p.label)) : '',
      risk_signals: r ? list(r.riskSignals.map((s) => `${s.tag} (${s.severity})`)) : '',
      recommendations: r ? list(r.recommendations.map((rec) => `${rec.capability} (${rec.priority})`)) : '',
      fingerprint: r ? list(r.fingerprint) : '',
      usage_category: r?.usageProfile.category || '',
      low_use_reason: r?.usageProfile.lowUseReason || '',
      intentional_selective_use: r ? r.usageProfile.intentionalSelectiveUse : '',
      underexposed: r ? r.usageProfile.underexposed : '',
      calibration_feel_gap: r?.calibration.desirabilityGap ?? '',
      calibration_prediction_gap: r?.calibration.calibrationGap ?? '',

      /* their own history */
      attempt_number: position >= 0 ? position + 1 : 1,
      total_attempts: mine.length,
      first_attempt_at: mine[0]?.createdAt || lead.createdAt,
      previous_index: previousIndex ?? '',
      index_change: previousIndex !== undefined && r ? Math.round((r.stage.rawIndex - previousIndex) * 10) / 10 : '',
      rescored_from: lead.rescoredFrom || '',
    };

    /* every dimension, with the number shown, the healthy number and its band */
    for (const id of CONSTRUCT_IDS) {
      const d = r?.dimensions[id];
      const label = CONSTRUCTS[id].reportedAsRisk ? 'dependency_risk' : id;
      row[`dim_${label}`] = d ? d.score : (lead.dimensions?.[id] ?? '');
      row[`dim_${label}_reported`] = d ? d.reportedScore : '';
      row[`dim_${label}_confidence`] = d ? d.confidence : '';
      row[`dim_${label}_band`] = d ? band(d.score) : '';
      row[`dim_${label}_evidence`] = d ? d.evidenceCount : '';
      row[`dim_${label}_claim_gap`] = d?.consistencyGap?.gap ?? '';
    }

    /* the context the submission arrived with */
    row.ip = m?.ip || '';
    row.country = m?.country || '';
    row.country_code = m?.countryCode || '';
    row.region = m?.region || '';
    row.city = m?.city || '';
    row.postal = m?.postal || '';
    row.latitude = m?.latitude ?? '';
    row.longitude = m?.longitude ?? '';
    row.in_eu = m?.isEu ?? '';
    row.internet_provider = m?.isp || '';
    row.organisation = m?.org || '';
    row.asn = m?.asn ?? '';
    row.network_domain = m?.networkDomain || '';
    row.datacenter_or_vpn = m?.datacenter ?? '';
    row.device = m?.device || m?.deviceClass || '';
    row.device_make = m?.vendor || '';
    row.browser = m?.browser || '';
    row.browser_version = m?.browserVersion || '';
    row.operating_system = m?.os || '';
    row.os_version = m?.osVersion || '';
    row.platform = m?.platform || '';
    row.screen_width = m?.screenWidth ?? '';
    row.screen_height = m?.screenHeight ?? '';
    row.window_width = m?.viewportWidth ?? '';
    row.window_height = m?.viewportHeight ?? '';
    row.pixel_ratio = m?.pixelRatio ?? '';
    row.orientation = m?.orientation || '';
    row.cores = m?.cores ?? '';
    row.memory_gb = m?.memoryGb ?? '';
    row.touch_points = m?.touchPoints ?? '';
    row.connection_type = m?.connectionType || '';
    row.downlink_mbps = m?.downlinkMbps ?? '';
    row.round_trip_ms = m?.rttMs ?? '';
    row.language = m?.language || '';
    row.accepted_languages = list(m?.languages || m?.acceptLanguages || []);
    row.timezone = m?.timezone || '';
    row.address_timezone = m?.ipTimezone || '';
    row.prefers_dark = m?.prefersDark ?? '';
    row.prefers_reduced_motion = m?.prefersReducedMotion ?? '';
    row.do_not_track = m?.doNotTrack ?? '';
    row.cookies_enabled = m?.cookiesEnabled ?? '';
    row.automated_client = m?.bot ?? '';
    row.user_agent = m?.userAgent || '';

    /* where they came from */
    row.referrer_host = m?.referrerHost || '';
    row.referrer_path = m?.referrerPath || '';
    row.landing_path = m?.landingPath || '';
    row.utm_source = m?.utmSource || '';
    row.utm_medium = m?.utmMedium || '';
    row.utm_campaign = m?.utmCampaign || '';
    row.utm_term = m?.utmTerm || '';
    row.utm_content = m?.utmContent || '';
    row.ad_click_id = m?.clickId || '';

    /* how the sitting went */
    row.minutes_taken = m?.durationMs ? Math.round((m.durationMs / 60000) * 10) / 10 : '';
    row.minutes_away = m?.awayMs ? Math.round((m.awayMs / 60000) * 10) / 10 : '';
    row.times_left_tab = m?.awayCount ?? '';
    row.answers_given = m?.answers ?? '';
    row.median_seconds_per_answer = m?.medianAnswerMs ? Math.round(m.medianAnswerMs / 100) / 10 : '';
    row.fastest_answer_seconds = m?.fastestAnswerMs ? Math.round(m.fastestAnswerMs / 100) / 10 : '';
    row.slowest_answer_seconds = m?.slowestAnswerMs ? Math.round(m.slowestAnswerMs / 100) / 10 : '';
    row.answers_under_1_2s = m?.rushedAnswers ?? '';
    row.answers_changed = m?.revisions ?? '';
    row.resumed_draft = m?.resumed ?? '';
    row.local_hour = m?.localHour ?? '';
    row.weekday = m?.weekday ?? '';

    /* every answer, so the file can be rescored elsewhere */
    for (const [itemId, value] of Object.entries(lead.answers || {})) {
      row[`answer_${itemId}`] = value;
    }

    return row;
  });
}

/** Rows to CSV, with a BOM so Excel opens accented names correctly. */
export function buildLeadCsv(leads: LeadRecord[]): string {
  const rows = buildLeadRows(leads);
  // union of keys in first-seen order, so answer columns appear even when only
  // some personas were exported
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) { seen.add(key); headers.push(key); }
    }
  }
  const answerCols = headers.filter((h) => h.startsWith('answer_')).sort();
  const ordered = headers.filter((h) => !h.startsWith('answer_')).concat(answerCols);

  const lines = [ordered.join(',')];
  for (const row of rows) {
    lines.push(ordered.map((h) => cell(row[h])).join(','));
  }
  return `﻿${lines.join('\r\n')}`;
}
