import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logEvent } from '@/lib/storage';
import { requestContext } from '@/lib/requestContext';
import { lookupIp } from '@/lib/geoip';

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

    // The same context the submission carries, so the funnel can be read by
    // device and by country. Taken from the request, never from the body.
    const ctx = requestContext(request.headers);
    const geo = ctx.ip ? await lookupIp(ctx.ip) : undefined;
    const refHost = (() => {
      try { return ctx.referer ? new URL(ctx.referer).host : undefined; } catch { return undefined; }
    })();
    const utmSource = (() => {
      try { return ctx.referer ? new URL(ctx.referer).searchParams.get('utm_source') || undefined : undefined; }
      catch { return undefined; }
    })();

    await logEvent({
      event, sessionId, role, step, questionId, zone,
      device: ctx.deviceClass === 'bot' ? undefined : ctx.deviceClass,
      country: geo?.country,
      countryCode: geo?.countryCode,
      browser: ctx.browser,
      os: ctx.os,
      bot: ctx.bot,
      referrerHost: refHost,
      utmSource: utmSource || undefined,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
