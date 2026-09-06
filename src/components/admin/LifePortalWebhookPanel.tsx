'use client';

import { useEffect, useState, type FormEvent } from 'react';

type LifePortalSettings = {
  enabled: boolean;
  url: string;
  stageCode: string;
  firstInquirySourceCode: string;
  programCode?: string;
  academicTermCode?: string;
  sourceOfOriginCode?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  secretConfigured: boolean;
  secretSource: 'admin' | 'environment' | 'none';
  maskedSecret?: string;
  updatedAt?: string;
};

const EMPTY: LifePortalSettings = {
  enabled: true,
  url: 'https://lifeportal.life.edu.ph/api/public/integrations/contacts/webhook',
  stageCode: 'inquiry',
  firstInquirySourceCode: 'rfi',
  programCode: '',
  academicTermCode: '',
  sourceOfOriginCode: '',
  utmSource: 'lifex',
  utmMedium: 'webhook',
  utmCampaign: 'lifex-neogogy-assessment',
  utmTerm: 'lifex',
  secretConfigured: false,
  secretSource: 'none',
};

export default function LifePortalWebhookPanel() {
  const [settings, setSettings] = useState<LifePortalSettings>(EMPTY);
  const [secret, setSecret] = useState('');
  const [clearSecret, setClearSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/lifeportal-webhook', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Could not load Life Portal settings.');
      setSettings(await res.json());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load Life Portal settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const update = (key: keyof LifePortalSettings, value: string | boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/lifeportal-webhook', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled: settings.enabled,
          url: settings.url,
          stageCode: settings.stageCode,
          firstInquirySourceCode: settings.firstInquirySourceCode,
          programCode: settings.programCode || '',
          academicTermCode: settings.academicTermCode || '',
          sourceOfOriginCode: settings.sourceOfOriginCode || '',
          utmSource: settings.utmSource,
          utmMedium: settings.utmMedium,
          utmCampaign: settings.utmCampaign,
          utmTerm: settings.utmTerm,
          secret,
          clearSecret,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not save Life Portal settings.');
      setSettings(data);
      setSecret('');
      setClearSecret(false);
      setMessage('Life Portal webhook settings saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save Life Portal settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-card rounded-3xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="admin-eyebrow text-xs uppercase tracking-[0.24em]">Integrations</p>
          <h2 className="admin-title mt-2 font-serif text-xl">Life Portal CRM webhook</h2>
          <p className="admin-muted mt-2 max-w-2xl text-sm">
            Completed assessment takers are sent to Life Portal as contact leads when the webhook is enabled and a signing secret is configured.
          </p>
        </div>
        <div className="admin-subcard rounded-2xl px-4 py-3 text-xs">
          <p className="admin-muted">Secret</p>
          <p className="admin-strong mt-1 font-semibold">
            {settings.secretConfigured ? `Configured ${settings.maskedSecret || ''}` : 'Not configured'}
          </p>
          <p className="admin-muted-soft mt-1">Source: {settings.secretSource}</p>
        </div>
      </div>

      {loading ? (
        <p className="admin-muted mt-5 text-sm">Loading Life Portal settings...</p>
      ) : (
        <form onSubmit={save} className="mt-5 space-y-5">
          <label className="admin-subcard flex items-start gap-3 rounded-2xl p-4 text-sm">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => update('enabled', e.target.checked)}
              className="admin-checkbox mt-1"
            />
            <span>
              <span className="admin-strong block font-semibold">Send completed assessments to Life Portal</span>
              <span className="admin-muted mt-1 block text-xs">Turn this off to pause CRM sync without changing the saved secret.</span>
            </span>
          </label>

          <div className="grid gap-3 lg:grid-cols-2">
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">Webhook URL</span>
              <input
                value={settings.url}
                onChange={(e) => update('url', e.target.value)}
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">Signing secret</span>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={settings.secretConfigured ? 'Leave blank to keep current secret' : 'Paste Life Portal signing secret'}
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">Stage code</span>
              <input value={settings.stageCode} onChange={(e) => update('stageCode', e.target.value)}
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">First inquiry source</span>
              <input value={settings.firstInquirySourceCode} onChange={(e) => update('firstInquirySourceCode', e.target.value)}
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">Source of origin</span>
              <input value={settings.sourceOfOriginCode || ''} onChange={(e) => update('sourceOfOriginCode', e.target.value)}
                placeholder="Let Life Portal derive"
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">Program code</span>
              <input value={settings.programCode || ''} onChange={(e) => update('programCode', e.target.value)}
                placeholder="Optional"
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">Academic term</span>
              <input value={settings.academicTermCode || ''} onChange={(e) => update('academicTermCode', e.target.value)}
                placeholder="Optional"
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">Campaign</span>
              <input value={settings.utmCampaign} onChange={(e) => update('utmCampaign', e.target.value)}
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">UTM source</span>
              <input value={settings.utmSource} onChange={(e) => update('utmSource', e.target.value)}
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">UTM medium</span>
              <input value={settings.utmMedium} onChange={(e) => update('utmMedium', e.target.value)}
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="admin-muted text-xs uppercase tracking-[0.12em]">UTM term</span>
              <input value={settings.utmTerm} onChange={(e) => update('utmTerm', e.target.value)}
                className="admin-input mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </label>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={clearSecret}
              onChange={(e) => setClearSecret(e.target.checked)}
              className="admin-checkbox mt-1"
            />
            <span className="admin-muted">Clear the saved admin secret on save and fall back to the environment secret, if one exists.</span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className="admin-button admin-button-primary rounded-full px-6 py-3 text-sm font-semibold transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Life Portal settings'}
            </button>
            <button type="button" onClick={() => void load()} disabled={saving} className="admin-button admin-button-muted rounded-full px-5 py-3 text-sm transition disabled:opacity-50">
              Reload
            </button>
            {message ? <p className="admin-accent text-sm">{message}</p> : null}
          </div>
        </form>
      )}
    </section>
  );
}
