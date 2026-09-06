import path from 'path';

const DEFAULT_ENDPOINT = 'https://lifeportal.life.edu.ph/api/public/integrations/contacts/webhook';
const SETTINGS_FILE = 'lifeportal-webhook-settings.json';

export type LifePortalWebhookConfig = {
  enabled: boolean;
  url: string;
  secret?: string;
  stageCode: string;
  firstInquirySourceCode: string;
  programCode?: string;
  academicTermCode?: string;
  sourceOfOriginCode?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
};

export type PublicLifePortalWebhookSettings = Omit<LifePortalWebhookConfig, 'secret'> & {
  secretConfigured: boolean;
  secretSource: 'admin' | 'environment' | 'none';
  maskedSecret?: string;
  updatedAt?: string;
};

export type LifePortalWebhookSettingsUpdate = Partial<Omit<LifePortalWebhookConfig, 'secret'>> & {
  secret?: string;
  clearSecret?: boolean;
};

type StoredSettings = Partial<LifePortalWebhookConfig> & {
  updatedAt?: string;
};

const localDir = path.join(process.cwd(), 'data');
const localPath = path.join(localDir, SETTINGS_FILE);

const clean = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
};

const envBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const defaults = (): LifePortalWebhookConfig => ({
  enabled: envBool(process.env.LIFE_PORTAL_WEBHOOK_ENABLED, true),
  url: clean(process.env.LIFE_PORTAL_WEBHOOK_URL, 1000) || DEFAULT_ENDPOINT,
  secret: clean(process.env.LIFE_PORTAL_WEBHOOK_SECRET, 500),
  stageCode: clean(process.env.LIFE_PORTAL_STAGE_CODE, 120) || 'inquiry',
  firstInquirySourceCode: clean(process.env.LIFE_PORTAL_FIRST_INQUIRY_SOURCE_CODE, 120) || 'rfi',
  programCode: clean(process.env.LIFE_PORTAL_PROGRAM_CODE, 120),
  academicTermCode: clean(process.env.LIFE_PORTAL_ACADEMIC_TERM_CODE, 120),
  sourceOfOriginCode: clean(process.env.LIFE_PORTAL_SOURCE_OF_ORIGIN_CODE, 120),
  utmSource: clean(process.env.LIFE_PORTAL_UTM_SOURCE, 120) || 'lifex',
  utmMedium: clean(process.env.LIFE_PORTAL_UTM_MEDIUM, 120) || 'webhook',
  utmCampaign: clean(process.env.LIFE_PORTAL_UTM_CAMPAIGN, 160) || 'lifex-neogogy-assessment',
  utmTerm: clean(process.env.LIFE_PORTAL_UTM_TERM, 160) || 'lifex',
});

async function readStored(): Promise<StoredSettings> {
  const fs = await import('fs/promises');
  try {
    const raw = await fs.readFile(localPath, 'utf-8');
    const parsed = JSON.parse(raw) as StoredSettings;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStored(settings: StoredSettings): Promise<void> {
  const fs = await import('fs/promises');
  await fs.mkdir(localDir, { recursive: true });
  await fs.writeFile(localPath, JSON.stringify(settings, null, 2), { encoding: 'utf-8', mode: 0o600 });
  await fs.chmod(localPath, 0o600).catch(() => undefined);
}

export async function resolveLifePortalWebhookSettings(): Promise<LifePortalWebhookConfig> {
  const base = defaults();
  const stored = await readStored();
  const next: LifePortalWebhookConfig = {
    enabled: typeof stored.enabled === 'boolean' ? stored.enabled : base.enabled,
    url: clean(stored.url, 1000) || base.url,
    secret: clean(stored.secret, 500) || base.secret,
    stageCode: clean(stored.stageCode, 120) || base.stageCode,
    firstInquirySourceCode: clean(stored.firstInquirySourceCode, 120) || base.firstInquirySourceCode,
    programCode: clean(stored.programCode, 120) || base.programCode,
    academicTermCode: clean(stored.academicTermCode, 120) || base.academicTermCode,
    sourceOfOriginCode: clean(stored.sourceOfOriginCode, 120) || base.sourceOfOriginCode,
    utmSource: clean(stored.utmSource, 120) || base.utmSource,
    utmMedium: clean(stored.utmMedium, 120) || base.utmMedium,
    utmCampaign: clean(stored.utmCampaign, 160) || base.utmCampaign,
    utmTerm: clean(stored.utmTerm, 160) || base.utmTerm,
  };
  return next;
}

const mask = (secret?: string): string | undefined => {
  if (!secret) return undefined;
  return `....${secret.slice(-4)}`;
};

export async function publicLifePortalWebhookSettings(): Promise<PublicLifePortalWebhookSettings> {
  const stored = await readStored();
  const resolved = await resolveLifePortalWebhookSettings();
  const adminSecret = clean(stored.secret, 500);
  const envSecret = clean(process.env.LIFE_PORTAL_WEBHOOK_SECRET, 500);
  const secretSource = adminSecret ? 'admin' : envSecret ? 'environment' : 'none';
  const { secret: _secret, ...publicConfig } = resolved;
  return {
    ...publicConfig,
    secretConfigured: Boolean(resolved.secret),
    secretSource,
    maskedSecret: mask(resolved.secret),
    updatedAt: stored.updatedAt,
  };
}

export async function updateLifePortalWebhookSettings(
  update: LifePortalWebhookSettingsUpdate,
): Promise<PublicLifePortalWebhookSettings> {
  const stored = await readStored();
  const next: StoredSettings = {
    ...stored,
    updatedAt: new Date().toISOString(),
  };

  if (typeof update.enabled === 'boolean') next.enabled = update.enabled;
  if (update.url !== undefined) next.url = clean(update.url, 1000);
  if (update.stageCode !== undefined) next.stageCode = clean(update.stageCode, 120);
  if (update.firstInquirySourceCode !== undefined) next.firstInquirySourceCode = clean(update.firstInquirySourceCode, 120);
  if (update.programCode !== undefined) next.programCode = clean(update.programCode, 120);
  if (update.academicTermCode !== undefined) next.academicTermCode = clean(update.academicTermCode, 120);
  if (update.sourceOfOriginCode !== undefined) next.sourceOfOriginCode = clean(update.sourceOfOriginCode, 120);
  if (update.utmSource !== undefined) next.utmSource = clean(update.utmSource, 120);
  if (update.utmMedium !== undefined) next.utmMedium = clean(update.utmMedium, 120);
  if (update.utmCampaign !== undefined) next.utmCampaign = clean(update.utmCampaign, 160);
  if (update.utmTerm !== undefined) next.utmTerm = clean(update.utmTerm, 160);

  if (update.clearSecret) {
    delete next.secret;
  } else if (update.secret !== undefined) {
    const secret = clean(update.secret, 500);
    if (secret) next.secret = secret;
  }

  await writeStored(next);
  return publicLifePortalWebhookSettings();
}
