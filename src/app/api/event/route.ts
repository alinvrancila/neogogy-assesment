import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logEvent } from '@/lib/storage';
import { requestContext } from '@/lib/requestContext';
import { lookupIp } from '@/lib/geoip';
import { allow } from '@/lib/throttle';
import { clientIp } from '@/lib/requestContext';

export const runtime = 'nodejs';

const ALLOWED = new Set([
  'assessment_start',
  'role_selected',
  'question_view',
  'assessment_complete',
  'email_submit',
  'report_download',
  // Written by the server on every submission, and allowlisted here so the two
  // lists do not disagree about what an event name may be.
  'report_email_sent',
  'report_email_failed',
  'report_view',
  'report_link_email',
  'report_link_rotate'
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

    // Everything below this line arrives from an anonymous caller and is
    // written to the analytics store, where it is read back into the admin
    // charts. It was taken as given: any length, any type, any content. Bounded
    // to what the funnel actually needs.
    const short = (v: unknown, max: number) =>
      (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
    const whole = (v: unknown, min: number, max: number) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
    };
    // role, zone and questionId are identifiers from the item bank, so they are
    // held to an identifier's shape. Anything else is dropped rather than
    // stored and drawn into the admin's charts as a category of its own.
    const ident = (v: unknown, max: number) => {
      const t = short(v, max);
      return t && /^[A-Za-z0-9_.:-]+$/.test(t) ? t : undefined;
    };
    const clean = {
      sessionId: ident(sessionId, 64),
      role: ident(role, 24),
      step: whole(step, 0, 200),
      questionId: ident(questionId, 64),
      zone: ident(zone, 48),
    };

    if (!allow(`event:${clientIp(request.headers) || 'unknown'}`, 600)) {
      // Answered as success so a throttled page never shows an error for
      // analytics, which must never interrupt a respondent.
      return NextResponse.json({ ok: true });
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
      event, ...clean,
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
