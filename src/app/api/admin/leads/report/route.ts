import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { getLead } from '@/lib/storage';
import { generateCompassPdf } from '@/lib/reportPdfV2';
import { resolveLeadResult } from '@/lib/leadResult';

export const runtime = 'nodejs';

const safeFilePart = (value: unknown, fallback = 'Result') =>
  String(value || fallback).trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || fallback;

export async function GET(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = request.nextUrl.searchParams.get('id') || '';
  const lead = await getLead(id);
  if (!lead) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const resolved = resolveLeadResult(lead);
  if (!resolved.ok) {
    return new Response(JSON.stringify({ error: resolved.reason }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const pdf = await generateCompassPdf({ result: resolved.result, name: lead.name || '' });

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Neogogy_Formation_Compass_${safeFilePart(lead.name, 'Participant')}.pdf"`
    }
  });
}
