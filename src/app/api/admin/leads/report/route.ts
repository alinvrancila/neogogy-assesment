import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { getLead } from '@/lib/storage';
import { generateNeogogyPdfFromInputs } from '@/lib/reportPdf';
import type { Answers, Baseline } from '@/lib/engine';

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
  if (!lead.answers) {
    return new Response(JSON.stringify({ error: 'This submission does not have stored answers.' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const pdf = await generateNeogogyPdfFromInputs({
    name: lead.name || '',
    role: lead.role || '',
    modality: lead.modality || '',
    answers: lead.answers as Answers,
    baseline: (lead.baseline as Baseline | null | undefined) ?? null,
    usageVal: lead.usageVal ?? null
  });

  return new Response(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Neogogy_Formation_Compass_${safeFilePart(lead.name, 'Participant')}.pdf"`
    }
  });
}
