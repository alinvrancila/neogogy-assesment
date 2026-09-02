/**
 * What an organisation puts on the cover of its own group report.
 *
 * A logo, a title line and a subtitle. Nothing here affects a reading: it is
 * presentation, kept beside the analysis rather than inside it.
 *
 * The logo is held as a data URI rather than in object storage, which keeps the
 * whole feature to one small JSON file and one route. That only works while the
 * file is small, so the size cap below is enforced on the way in and is the
 * reason the cap exists.
 */

import path from 'path';

export interface OrgProfile {
  /** Email domain, which is how people are grouped everywhere else. */
  domain: string;
  /** Up to 60 characters. Empty renders nothing. */
  coverTitle?: string;
  /** Up to 160 characters. Empty renders nothing. */
  coverSubtitle?: string;
  /** data:image/png;base64,... PNG, JPG or SVG. */
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
  updatedAt: string;
}

export const LIMITS = {
  title: 60,
  subtitle: 160,
  /** 512KB of base64, which is a generous logo and a small file. */
  logoBytes: 512 * 1024,
  types: ['image/png', 'image/jpeg', 'image/svg+xml'] as const,
};

const FILE = 'org-profiles.json';
const localDir = path.join(process.cwd(), 'data');

async function readAll(): Promise<OrgProfile[]> {
  const fs = await import('fs/promises');
  try {
    return JSON.parse(await fs.readFile(path.join(localDir, FILE), 'utf-8')) as OrgProfile[];
  } catch {
    return [];
  }
}

let queue: Promise<unknown> = Promise.resolve();

export async function getOrgProfile(domain: string): Promise<OrgProfile | null> {
  const all = await readAll();
  return all.find((p) => p.domain === domain.toLowerCase()) ?? null;
}

export async function saveOrgProfile(next: Omit<OrgProfile, 'updatedAt'>): Promise<OrgProfile> {
  const record: OrgProfile = {
    ...next,
    domain: next.domain.toLowerCase(),
    coverTitle: (next.coverTitle || '').slice(0, LIMITS.title),
    coverSubtitle: (next.coverSubtitle || '').slice(0, LIMITS.subtitle),
    updatedAt: new Date().toISOString(),
  };
  // Serialised the same way lead writes are: read, modify, write loses data
  // when two saves land together.
  const run = queue.then(async () => {
    const fs = await import('fs/promises');
    const all = await readAll();
    const kept = all.filter((p) => p.domain !== record.domain);
    await fs.mkdir(localDir, { recursive: true });
    const tmp = path.join(localDir, `${FILE}.tmp`);
    await fs.writeFile(tmp, JSON.stringify([...kept, record], null, 2), 'utf-8');
    await fs.rename(tmp, path.join(localDir, FILE));
    return record;
  });
  queue = run.catch(() => undefined);
  return run;
}
