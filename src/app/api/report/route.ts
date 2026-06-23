import type { NextRequest } from 'next/server';
import { generateNeogogyPdfFromInputs } from '@/lib/reportPdf';
import type { Answers, Baseline } from '@/lib/engine';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, role, modality, answers, baseline, usageVal } = body as {
    name: string;
    role?: string;
    modality?: string;
    answers: Answers;
    baseline: Baseline | null;
    usageVal: number | null;
  };

  if (!answers) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const pdf = await generateNeogogyPdfFromInputs({
    name: name || '',
    role: role || '',
    modality: modality || '',
    answers,
    baseline: baseline ?? null,
    usageVal: usageVal ?? null
  });

  return new Response(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Neogogy_Formation_Compass.pdf"'
    }
  });
}
