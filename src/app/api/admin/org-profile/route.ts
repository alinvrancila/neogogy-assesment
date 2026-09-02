import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { getOrgProfile, saveOrgProfile, LIMITS } from '@/lib/orgProfile';

export const runtime = 'nodejs';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** What an organisation puts on its own cover. Read and write, admin only. */
export async function GET(request: NextRequest) {
  if (!isAdminAuthed(request)) return json({ error: 'Unauthorized' }, 401);
  const domain = (request.nextUrl.searchParams.get('domain') || '').trim().toLowerCase();
  if (!domain) return json({ error: 'A domain is required.' }, 400);
  return json({ profile: await getOrgProfile(domain), limits: LIMITS });
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) return json({ error: 'Unauthorized' }, 401);
  const body = await request.json().catch(() => null) as {
    domain?: string; coverTitle?: string; coverSubtitle?: string;
    logo?: string; logoWidth?: number; logoHeight?: number;
  } | null;
  if (!body?.domain) return json({ error: 'A domain is required.' }, 400);

  if (body.logo) {
    const m = /^data:([^;]+);base64,/.exec(body.logo);
    if (!m || !(LIMITS.types as readonly string[]).includes(m[1])) {
      return json({ error: 'The logo must be a PNG, JPG or SVG.' }, 415);
    }
    if (body.logo.length > LIMITS.logoBytes) {
      return json({ error: `The logo must be under ${Math.round(LIMITS.logoBytes / 1024)}KB.` }, 413);
    }
  }

  const saved = await saveOrgProfile({
    domain: body.domain,
    coverTitle: body.coverTitle,
    coverSubtitle: body.coverSubtitle,
    logo: body.logo,
    logoWidth: body.logoWidth,
    logoHeight: body.logoHeight,
  });
  return json({ profile: saved });
}
