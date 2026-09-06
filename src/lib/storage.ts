import path from 'path';
import { randomUUID } from 'crypto';
import { tokensMatch } from '@/lib/reportLink';

/**
 * Storage layer for leads and analytics events.
 *
 * When DynamoDB env vars are present (LEADS_TABLE, EVENTS_TABLE) the records are
 * written to DynamoDB. Otherwise everything degrades gracefully to a local JSON
 * file so the app keeps working in local development without AWS.
 */

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-1';
const LEADS_TABLE = process.env.LEADS_TABLE || '';
const EVENTS_TABLE = process.env.EVENTS_TABLE || '';

export type LeadRecord = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  mobilePhone?: string;
  heardFrom?: string;
  role: string;
  modality: string;
  consent: boolean;
  persona: string;
  personaName: string;
  /** v1 axis scores. Absent on engineVersion 2 records, which have no axes. */
  resilience?: number;
  readiness?: number;
  overall: number;
  dimensions?: Record<string, number>;
  answers?: Record<string, number>;
  baseline?: { b1: number; b2: number } | null;
  usageVal?: number | null;
  createdAt: string;

  /** 1 for legacy Formation Compass records, 2 for Formation Compass v2.
   *  Readers must branch on this: v1 and v2 records are not interchangeable. */
  engineVersion?: number;
  /** v2 only: the full CompassResult, stored so any future rescoring is a batch
   *  job rather than a re-survey. */
  result?: unknown;
  /** v2 only: denormalized for listing and CSV without parsing result. */
  stage?: number;
  stageName?: string;
  archetypeId?: string;
  archetypeName?: string;
  confidence?: string;
  /** v2 only: set when this record was produced by rescoring a v1 submission. */
  rescoredFrom?: string;

  /**
   * The report link (B3).
   *
   * A long random token that addresses this record's report page. Whoever holds
   * it can read the report, which is why it is treated as a secret everywhere
   * outside this table: it is stripped from anything sent to the admin, it is
   * never exported, and it is never written to an event or a log line. Reissuing
   * it replaces this value, and that is what stops an old link working.
   */
  reportToken?: string;
  reportTokenIssuedAt?: string;

  /**
   * v2 only: context about how the assessment was taken.
   *
   * Two kinds of thing live here: what the respondent's browser reports about
   * the sitting, and what the request itself disclosed (address, network,
   * place). It exists to judge data quality, to know who the assessment is
   * reaching, and to see which channels bring people. The gate discloses it
   * before anything is stored, and none of it is sold or shared.
   */
  meta?: SubmissionMeta;
};

export type SubmissionMeta = {
  /* --- the sitting ------------------------------------------------------ */
  /** Milliseconds between starting the questions and submitting. */
  durationMs?: number;
  /** How many times an answer was changed before submitting. */
  revisions?: number;
  /** Time with the tab in the background, and how often they left it. */
  awayMs?: number;
  awayCount?: number;
  /** Pace of answering, which is how considered responses are judged. */
  answers?: number;
  medianAnswerMs?: number;
  fastestAnswerMs?: number;
  slowestAnswerMs?: number;
  rushedAnswers?: number;
  /** True when the assessment was resumed from a saved draft. */
  resumed?: boolean;

  /* --- the device ------------------------------------------------------- */
  /** phone, tablet or desktop, from viewport width at submission. */
  device?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  screenWidth?: number;
  screenHeight?: number;
  pixelRatio?: number;
  colorDepth?: number;
  orientation?: string;
  platform?: string;
  uaMobile?: boolean;
  uaBrands?: string[];
  cores?: number;
  memoryGb?: number;
  touchPoints?: number;
  connectionType?: string;
  downlinkMbps?: number;
  rttMs?: number;
  saveData?: boolean;
  prefersDark?: boolean;
  prefersReducedMotion?: boolean;
  cookiesEnabled?: boolean;
  doNotTrack?: boolean;

  /* --- who and where they are ------------------------------------------- */
  /** Local hour and weekday, useful for scheduling reminders. */
  localHour?: number;
  weekday?: number;
  timezone?: string;
  utcOffsetMinutes?: number;
  language?: string;
  languages?: string[];

  /* --- where the visit came from ---------------------------------------- */
  referrerHost?: string;
  referrerPath?: string;
  landingPath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  /** Which ad platform's click identifier was on the landing URL. */
  clickId?: string;

  /* --- the Business Owner's optional context ----------------------------- */
  /** All optional, volunteered by the respondent, never used in scoring. It
   *  lives inside meta rather than in new columns, because meta is the record's
   *  existing free-form metadata field. */
  business?: {
    company?: string;
    industry?: string;
    teamSize?: string;
    tools?: string;
  };

  /* --- what the request disclosed, filled in on the server --------------- */
  ip?: string;
  userAgent?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  deviceClass?: string;
  vendor?: string;
  bot?: boolean;
  acceptLanguages?: string[];
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postal?: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
  isEu?: boolean;
  isp?: string;
  org?: string;
  asn?: number;
  networkDomain?: string;
  ipTimezone?: string;
  utcOffset?: string;
  datacenter?: boolean;
};

export type EventRecord = {
  id: string;
  event: string;
  sessionId?: string;
  role?: string;
  step?: number;
  questionId?: string;
  zone?: string;
  day: string;
  createdAt: string;
  /** Coarse context, so the funnel reads by device and country rather than
   *  only in total. Set from the request, never from the posted body. */
  device?: string;
  country?: string;
  countryCode?: string;
  browser?: string;
  os?: string;
  bot?: boolean;
  referrerHost?: string;
  utmSource?: string;
};

let docClientPromise: Promise<any> | null = null;

const getDocClient = async () => {
  if (!docClientPromise) {
    docClientPromise = (async () => {
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb');
      const client = new DynamoDBClient({ region: REGION });
      return DynamoDBDocumentClient.from(client, {
        marshallOptions: { removeUndefinedValues: true }
      });
    })();
  }
  return docClientPromise;
};

// Local fallback helpers -----------------------------------------------------

const localDir = path.join(process.cwd(), 'data');

const readLocal = async <T>(file: string): Promise<T[]> => {
  const fs = await import('fs/promises');
  try {
    const raw = await fs.readFile(path.join(localDir, file), 'utf-8');
    return (JSON.parse(raw) as T[]) || [];
  } catch {
    return [];
  }
};

/**
 * Serialises local file writes.
 *
 * Appending is read, modify, write. Events fire in bursts (a start and a role
 * choice land together), so two concurrent appends would both read the same
 * array and the second write would discard the first. Worse, a read landing
 * mid-write parses as invalid JSON and yields an empty array, which drops the
 * entire log. Every local write now queues behind the previous one.
 */
let localWriteQueue: Promise<unknown> = Promise.resolve();
const queueLocalWrite = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = localWriteQueue.then(fn, fn);
  localWriteQueue = next.catch(() => undefined);
  return next;
};

const appendLocal = async <T>(file: string, record: T) =>
  queueLocalWrite(async () => {
    const fs = await import('fs/promises');
    await fs.mkdir(localDir, { recursive: true });
    const existing = await readLocal<T>(file);
    existing.push(record);
    // Write to a temporary file and rename, so a concurrent reader never sees
    // a half-written file.
    const target = path.join(localDir, file);
    const tmp = `${target}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(existing, null, 2), 'utf-8');
    await fs.rename(tmp, target);
  });

// Public API -----------------------------------------------------------------

export const saveLead = async (lead: LeadRecord): Promise<void> => {
  if (LEADS_TABLE) {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const doc = await getDocClient();
    await doc.send(new PutCommand({ TableName: LEADS_TABLE, Item: lead }));
    return;
  }
  // DynamoDB PutCommand upserts by key. The local JSON fallback must behave the
  // same way, otherwise re-saving a record (rescoring, for example) silently
  // appends a duplicate with the same id instead of replacing it.
  await upsertLocalById('leads.json', lead);
};

const upsertLocalById = async (file: string, record: LeadRecord) =>
  queueLocalWrite(async () => {
    const fs = await import('fs/promises');
    await fs.mkdir(localDir, { recursive: true });
    const existing = await readLocal<LeadRecord>(file);
    const at = existing.findIndex((r) => r.id === record.id);
    if (at >= 0) existing[at] = record;
    else existing.push(record);
    const target = path.join(localDir, file);
    const tmp = `${target}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(existing, null, 2), 'utf-8');
    await fs.rename(tmp, target);
  });

export const listLeads = async (): Promise<LeadRecord[]> => {
  let leads: LeadRecord[] = [];
  if (LEADS_TABLE) {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const doc = await getDocClient();
    let lastKey: any = undefined;
    do {
      const result: any = await doc.send(
        new ScanCommand({ TableName: LEADS_TABLE, ExclusiveStartKey: lastKey })
      );
      leads = leads.concat((result.Items as LeadRecord[]) || []);
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);
  } else {
    leads = await readLocal<LeadRecord>('leads.json');
  }

  return leads.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
};

/** Remove one submission. Returns false when nothing matched. */
export const deleteLead = async (id: string): Promise<boolean> => {
  if (!id) return false;
  if (LEADS_TABLE) {
    const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
    const doc = await getDocClient();
    await doc.send(new DeleteCommand({ TableName: LEADS_TABLE, Key: { id } }));
    return true;
  }
  const fs = await import('fs/promises');
  const existing = await readLocal<LeadRecord>('leads.json');
  const next = existing.filter((l) => l.id !== id);
  if (next.length === existing.length) return false;
  await fs.writeFile(path.join(localDir, 'leads.json'), JSON.stringify(next, null, 2), 'utf-8');
  return true;
};

/**
 * Remove every submission for an email address. This is the "delete a person"
 * operation, used for erasure requests as well as clearing test accounts.
 */
export const deleteLeadsByEmail = async (email: string): Promise<number> => {
  const target = email.trim().toLowerCase();
  if (!target) return 0;
  const all = await listLeads();
  const doomed = all.filter((l) => (l.email || '').trim().toLowerCase() === target);
  if (!doomed.length) return 0;

  if (LEADS_TABLE) {
    const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
    const doc = await getDocClient();
    for (const l of doomed) {
      await doc.send(new DeleteCommand({ TableName: LEADS_TABLE, Key: { id: l.id } }));
    }
    return doomed.length;
  }
  const fs = await import('fs/promises');
  const keep = all.filter((l) => (l.email || '').trim().toLowerCase() !== target);
  await fs.writeFile(path.join(localDir, 'leads.json'), JSON.stringify(keep, null, 2), 'utf-8');
  return doomed.length;
};

export const getLead = async (id: string): Promise<LeadRecord | null> => {
  if (!id) return null;
  if (LEADS_TABLE) {
    const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const doc = await getDocClient();
    const result: any = await doc.send(new GetCommand({ TableName: LEADS_TABLE, Key: { id } }));
    return (result.Item as LeadRecord) || null;
  }
  const leads = await readLocal<LeadRecord>('leads.json');
  return leads.find((lead) => lead.id === id) || null;
};

/**
 * A record with its report token removed.
 *
 * Anything that leaves this module for a browser, a file or a screen goes
 * through here first. The admin has every right to read a person's result; it
 * has no need of a live link to it, and a token in a page payload is a token in
 * a cache, a screenshot and a support thread.
 */
export const withoutReportToken = <T extends Partial<LeadRecord>>(lead: T): T => {
  const { reportToken, ...rest } = lead as LeadRecord;
  return rest as unknown as T;
};

/**
 * Find a submission by its report token.
 *
 * Filtered at the database rather than in the process, so the whole table is
 * never pulled across to answer one link. Returns null for anything that does
 * not match exactly, which is the only authorisation a report page has.
 */
export const getLeadByReportToken = async (token: string): Promise<LeadRecord | null> => {
  if (!token) return null;

  let candidates: LeadRecord[] = [];
  if (LEADS_TABLE) {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const doc = await getDocClient();
    let lastKey: any = undefined;
    do {
      const result: any = await doc.send(
        new ScanCommand({
          TableName: LEADS_TABLE,
          FilterExpression: '#t = :t',
          ExpressionAttributeNames: { '#t': 'reportToken' },
          ExpressionAttributeValues: { ':t': token },
          ExclusiveStartKey: lastKey,
        })
      );
      candidates = candidates.concat((result.Items as LeadRecord[]) || []);
      lastKey = result.LastEvaluatedKey;
    } while (lastKey && !candidates.length);
  } else {
    candidates = await readLocal<LeadRecord>('leads.json');
  }

  return candidates.find((lead) => tokensMatch(lead.reportToken, token)) || null;
};

/**
 * When this person last completed an assessment.
 *
 * Retention runs from here rather than from the record's own date, because
 * taking the assessment again restarts the period for everything held about
 * them. A report link outlives its own sitting for exactly that reason.
 */
export const lastCompletedAtForEmail = async (email: string): Promise<string | null> => {
  const target = email.trim().toLowerCase();
  if (!target) return null;

  let rows: Array<{ email?: string; createdAt?: string }> = [];
  if (LEADS_TABLE) {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const doc = await getDocClient();
    let lastKey: any = undefined;
    do {
      const result: any = await doc.send(
        new ScanCommand({
          TableName: LEADS_TABLE,
          ProjectionExpression: 'email, createdAt',
          ExclusiveStartKey: lastKey,
        })
      );
      rows = rows.concat((result.Items as typeof rows) || []);
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);
  } else {
    rows = await readLocal<LeadRecord>('leads.json');
  }

  let latest: string | null = null;
  for (const row of rows) {
    if ((row.email || '').trim().toLowerCase() !== target) continue;
    if (!row.createdAt) continue;
    if (!latest || row.createdAt > latest) latest = row.createdAt;
  }
  return latest;
};

export const logEvent = async (
  event: Omit<EventRecord, 'id' | 'day' | 'createdAt'>
): Promise<void> => {
  const now = new Date();
  const record: EventRecord = {
    id: randomUUID(),
    day: now.toISOString().slice(0, 10),
    createdAt: now.toISOString(),
    ...event
  };
  try {
    if (EVENTS_TABLE) {
      const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
      const doc = await getDocClient();
      await doc.send(new PutCommand({ TableName: EVENTS_TABLE, Item: record }));
      return;
    }
    await appendLocal('events.json', record);
  } catch (error) {
    // Analytics must never break the user flow.
    console.error('logEvent failed', error);
  }
};

export type StatsSummary = {
  totalEvents: number;
  byEvent: Record<string, number>;
  byRole: Record<string, number>;
  byZone: Record<string, number>;
  starts: number;
  completions: number;
  emailSubmits: number;
  completionRate: number;
  emailConversionRate: number;
};

export const getStats = async (): Promise<StatsSummary> => {
  let events: EventRecord[] = [];
  if (EVENTS_TABLE) {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const doc = await getDocClient();
    let lastKey: any = undefined;
    do {
      const result: any = await doc.send(
        new ScanCommand({ TableName: EVENTS_TABLE, ExclusiveStartKey: lastKey })
      );
      events = events.concat((result.Items as EventRecord[]) || []);
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);
  } else {
    events = await readLocal<EventRecord>('events.json');
  }

  const byEvent: Record<string, number> = {};
  const byRole: Record<string, number> = {};
  const byZone: Record<string, number> = {};
  for (const e of events) {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
    // Role is counted once per start, not on every event carrying a role, so
    // choosing a role twice cannot inflate the funnel.
    if (e.role && e.event === 'assessment_start') byRole[e.role] = (byRole[e.role] || 0) + 1;
    // Zone is the archetype, which only exists once a result has been produced.
    if (e.zone && e.event === 'email_submit') byZone[e.zone] = (byZone[e.zone] || 0) + 1;
  }

  const starts = byEvent['assessment_start'] || 0;
  const completions = byEvent['assessment_complete'] || 0;
  const emailSubmits = byEvent['email_submit'] || 0;

  return {
    totalEvents: events.length,
    byEvent,
    byRole,
    byZone,
    starts,
    completions,
    emailSubmits,
    // Rates are clamped to 100. A ratio above that only arises from records
    // that predate the tracking of the earlier step, and a 2900 percent
    // conversion reads as a bug rather than as history.
    completionRate: starts ? Math.min(100, Math.round((completions / starts) * 100)) : 0,
    emailConversionRate: completions ? Math.min(100, Math.round((emailSubmits / completions) * 100)) : 0
  };
};
