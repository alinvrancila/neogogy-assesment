import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import {
  publicLifePortalWebhookSettings,
  updateLifePortalWebhookSettings,
  type LifePortalWebhookSettingsUpdate,
} from '@/lib/lifePortalSettings';

export const runtime = 'nodejs';

const guard = (request: NextRequest) =>
  (isAdminAuthed(request) ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : undefined);

export async function GET(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json(await publicLifePortalWebhookSettings());
}

export async function PUT(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const url = str(body.url);
  if (url && !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'Webhook URL must begin with http:// or https://.' }, { status: 400 });
  }

  const update: LifePortalWebhookSettingsUpdate = {
    enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
    url,
    secret: str(body.secret),
    clearSecret: body.clearSecret === true,
    stageCode: str(body.stageCode),
    firstInquirySourceCode: str(body.firstInquirySourceCode),
    programCode: str(body.programCode),
    academicTermCode: str(body.academicTermCode),
    sourceOfOriginCode: str(body.sourceOfOriginCode),
    utmSource: str(body.utmSource),
    utmMedium: str(body.utmMedium),
    utmCampaign: str(body.utmCampaign),
    utmTerm: str(body.utmTerm),
  };

  return NextResponse.json(await updateLifePortalWebhookSettings(update));
}
