import path from 'path';
import { randomUUID } from 'crypto';

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
  resilience: number;
  readiness: number;
  overall: number;
  dimensions?: Record<string, number>;
  answers?: Record<string, number>;
  baseline?: { b1: number; b2: number } | null;
  usageVal?: number | null;
  createdAt: string;
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

const appendLocal = async <T>(file: string, record: T) => {
  const fs = await import('fs/promises');
  await fs.mkdir(localDir, { recursive: true });
  const existing = await readLocal<T>(file);
  existing.push(record);
  await fs.writeFile(path.join(localDir, file), JSON.stringify(existing, null, 2), 'utf-8');
};

// Public API -----------------------------------------------------------------

export const saveLead = async (lead: LeadRecord): Promise<void> => {
  if (LEADS_TABLE) {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const doc = await getDocClient();
    await doc.send(new PutCommand({ TableName: LEADS_TABLE, Item: lead }));
    return;
  }
  await appendLocal('leads.json', lead);
};

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
    if (e.role) byRole[e.role] = (byRole[e.role] || 0) + 1;
    if (e.zone) byZone[e.zone] = (byZone[e.zone] || 0) + 1;
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
    completionRate: starts ? Math.round((completions / starts) * 100) : 0,
    emailConversionRate: completions ? Math.round((emailSubmits / completions) * 100) : 0
  };
};
