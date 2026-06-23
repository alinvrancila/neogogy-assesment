import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logEvent } from '@/lib/storage';

export const runtime = 'nodejs';

const ALLOWED = new Set([
  'assessment_start',
  'role_selected',
  'question_view',
  'assessment_complete',
  'email_submit',
  'report_download'
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, sessionId, role, step, questionId, zone } = body as {
      event: string;
      sessionId?: string;
      role?: string;
      step?: number;
      questionId?: string;
      zone?: string;
    };
    if (!event || !ALLOWED.has(event)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await logEvent({ event, sessionId, role, step, questionId, zone });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
