import type { NextRequest } from 'next/server';
import { compute, applicableItems } from '@/engine';
import type { Persona } from '@/engine/types';
import { generateCompassPdf } from '@/lib/reportPdfV2';

export const runtime = 'nodejs';

const PERSONAS: Persona[] = ['student', 'teacher', 'parent', 'administrator', 'business'];

const bad = (error: string, status = 400) =>
  new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST(request: NextRequest) {
  let body: {
    name?: string; persona?: string; usage?: number;
    b1?: number; b2?: number; answers?: Record<string, number>;
  };
  try {
    body = await request.json();
  } catch {
    return bad('Malformed request.');
  }

  const persona = body.persona as Persona | undefined;
  const usage = Number(body.usage);
  if (!persona || !PERSONAS.includes(persona)) return bad('Unknown persona.');
  if (!Number.isInteger(usage) || usage < 1 || usage > 5) return bad('Usage must be 1 to 5.');
  if (!body.answers || typeof body.answers !== 'object') return bad('Missing answers.');

  const ids = new Set(applicableItems(persona, usage).map((i) => i.id));
  for (const id of Object.keys(body.answers)) {
    if (!ids.has(id)) return bad(`Unknown item for this assessment: ${id}`);
  }

  const result = compute({
    persona, usage,
    b1: body.b1, b2: body.b2,
    answers: body.answers,
  });
  const pdf = await generateCompassPdf({ result, name: body.name || '' });

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Neogogy_Formation_Compass.pdf"'
    }
  });
}
