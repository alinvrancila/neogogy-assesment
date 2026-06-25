import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { generateNeogogyPdf } from '@/lib/reportPdf';
import { compute, type Answers, type Baseline } from '@/lib/engine';
import { dimensions } from '@/data/compass';
import { saveLead, logEvent } from '@/lib/storage';
import { sendReportEmail, isEmailEnabled } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, name, firstName, lastName, mobilePhone, heardFrom, role, modality, consent, answers, baseline, usageVal, sessionId } = body as {
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    mobilePhone?: string;
    heardFrom?: string;
    role?: string;
    modality?: string;
    consent?: boolean;
    answers: Answers;
    baseline: Baseline | null;
    usageVal: number | null;
    sessionId?: string;
  };

  const fullName = (name || `${firstName || ''} ${lastName || ''}`).trim();
  if (!email || !fullName || !answers) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const result = compute(answers || {}, baseline ?? null, usageVal ?? null);

  const dimScores: Record<string, number> = {};
  dimensions.forEach((d) => {
    dimScores[d.id] = result.dimResults[d.id].pct;
  });

  const lead = {
    id: randomUUID(),
    name: fullName,
    firstName: firstName || '',
    lastName: lastName || '',
    email,
    mobilePhone: mobilePhone || '',
    heardFrom: heardFrom || '',
    role: role || '',
    modality: modality || '',
    consent: Boolean(consent),
    persona: result.pkey,
    personaName: result.persona.name,
    resilience: result.resilience,
    readiness: result.readiness,
    overall: result.overall,
    dimensions: dimScores,
    answers,
    baseline,
    usageVal,
    createdAt: new Date().toISOString()
  };

  try {
    await saveLead(lead);
  } catch (error) {
    console.error('saveLead failed', error);
    // Storage failure must not block the user's results.
  }

  await logEvent({ event: 'email_submit', sessionId, role: lead.role, zone: result.pkey });

  let emailSent = false;
  try {
    const pdf = await generateNeogogyPdf({ name: fullName, role: lead.role, modality: lead.modality, result });
    if (isEmailEnabled()) {
      const r = await sendReportEmail({
        to: email,
        name: fullName,
        personaName: result.persona.name,
        bodyText: `Hello ${firstName || fullName},\n\nYour Neogogy Formation Compass results are ready. You are ${result.persona.name}: ${result.persona.tagline}\n\nThe attached report includes your formation index, your map of formation, every dimension, your named blind spots, and your next step toward The Guide.\n\nExplore the framework at www.ican.ph.\n\nWarmly,\nThe International Center for Applied Neogogy`,
        pdf
      });
      emailSent = r.sent;
    }
  } catch (error) {
    console.error('email/pdf failed', error);
  }

  return NextResponse.json({ success: true, persona: result.pkey, emailSent });
}
