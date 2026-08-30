/**
 * What the browser can tell us about the sitting, gathered in one place.
 *
 * Everything here is read from standard APIs that a page is allowed to read
 * without a permission prompt. Nothing probes the device, draws to a canvas or
 * builds a covert identifier: the aim is to describe the conditions the
 * assessment was taken in, not to recognise the same person elsewhere.
 *
 * Every read is guarded, because these APIs vary by browser and a missing one
 * must never cost a respondent their submission.
 */

export type ClientSignals = Record<string, unknown>;

const q = <T>(read: () => T): T | undefined => {
  try { return read(); } catch { return undefined; }
};

/** Ad and campaign click identifiers, so paid traffic can be told apart. */
const CLICK_IDS = ['gclid', 'fbclid', 'msclkid', 'ttclid', 'li_fat_id', 'twclid'];

export function collectAttribution(): ClientSignals {
  const p = new URLSearchParams(window.location.search);
  const out: ClientSignals = {};
  for (const key of ['source', 'medium', 'campaign', 'term', 'content']) {
    const v = p.get(`utm_${key}`);
    if (v) out[`utm${key[0].toUpperCase()}${key.slice(1)}`] = v.slice(0, 80);
  }
  for (const key of CLICK_IDS) {
    if (p.get(key)) { out.clickId = key; break; }
  }
  const ref = q(() => (document.referrer ? new URL(document.referrer) : null));
  if (ref && ref.host !== window.location.host) {
    out.referrerHost = ref.host.slice(0, 120);
    out.referrerPath = ref.pathname.slice(0, 120);
  }
  out.landingPath = window.location.pathname.slice(0, 120);
  return out;
}

/** The device and the display, as the browser reports them. */
export function collectEnvironment(): ClientSignals {
  const nav = navigator as Navigator & {
    userAgentData?: { brands?: Array<{ brand: string; version: string }>; mobile?: boolean; platform?: string };
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean; type?: string };
  };
  const conn = nav.connection;
  const width = window.innerWidth;

  return {
    // display
    viewportWidth: width,
    viewportHeight: window.innerHeight,
    screenWidth: q(() => window.screen.width),
    screenHeight: q(() => window.screen.height),
    pixelRatio: q(() => Math.round(window.devicePixelRatio * 100) / 100),
    colorDepth: q(() => window.screen.colorDepth),
    orientation: q(() => (window.screen.orientation?.type || '').split('-')[0]) ||
      (window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait'),
    device: width < 640 ? 'phone' : width < 1024 ? 'tablet' : 'desktop',

    // platform, from the modern hint first and the legacy string second
    platform: nav.userAgentData?.platform || q(() => (navigator as Navigator & { platform?: string }).platform),
    uaMobile: nav.userAgentData?.mobile,
    uaBrands: nav.userAgentData?.brands?.map((b) => b.brand).filter((b) => !/not.a.brand/i.test(b)).slice(0, 4),

    // locale, which is often truer than the IP for who a person is
    timezone: q(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    utcOffsetMinutes: -new Date().getTimezoneOffset(),
    language: navigator.language,
    languages: q(() => (navigator.languages || []).slice(0, 5)),

    // capability, useful for reading unusual completion times
    cores: q(() => navigator.hardwareConcurrency),
    memoryGb: nav.deviceMemory,
    touchPoints: q(() => navigator.maxTouchPoints),
    connectionType: conn?.effectiveType || conn?.type,
    downlinkMbps: conn?.downlink,
    rttMs: conn?.rtt,
    saveData: conn?.saveData,

    // stated preferences, which say something about how the page was read
    prefersDark: q(() => window.matchMedia('(prefers-color-scheme: dark)').matches),
    prefersReducedMotion: q(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    cookiesEnabled: q(() => navigator.cookieEnabled),
    doNotTrack: q(() => (navigator as Navigator & { doNotTrack?: string }).doNotTrack === '1'),
  };
}

/**
 * Attention during the sitting. A tab left in the background, a device put
 * down, an assessment resumed the next day: all of it changes how a duration
 * should be read.
 */
export class SittingWatcher {
  private hiddenAt: number | null = null;
  private hiddenMs = 0;
  private blurs = 0;
  private readonly startedAt = Date.now();
  private readonly onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      this.hiddenAt = Date.now();
      this.blurs += 1;
    } else if (this.hiddenAt) {
      this.hiddenMs += Date.now() - this.hiddenAt;
      this.hiddenAt = null;
    }
  };

  start() {
    try { document.addEventListener('visibilitychange', this.onVisibility); } catch { /* not fatal */ }
  }

  stop() {
    try { document.removeEventListener('visibilitychange', this.onVisibility); } catch { /* not fatal */ }
  }

  read(): ClientSignals {
    const away = this.hiddenMs + (this.hiddenAt ? Date.now() - this.hiddenAt : 0);
    return {
      awayMs: away,
      awayCount: this.blurs,
      elapsedMs: Date.now() - this.startedAt,
    };
  }
}

/**
 * How the answers arrived. Pace and pattern are the honest way to judge
 * whether a set of answers was considered, without judging the answers.
 */
export function pacing(stamps: number[]): ClientSignals {
  const gaps: number[] = [];
  for (let i = 1; i < stamps.length; i += 1) {
    const gap = stamps[i] - stamps[i - 1];
    if (gap >= 0 && gap < 10 * 60 * 1000) gaps.push(gap);
  }
  if (!gaps.length) return {};
  const sorted = [...gaps].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return {
    answers: stamps.length,
    medianAnswerMs: Math.round(median),
    fastestAnswerMs: Math.round(sorted[0]),
    slowestAnswerMs: Math.round(sorted[sorted.length - 1]),
    // answered faster than a question can be read, which is worth knowing
    rushedAnswers: gaps.filter((g) => g < 1200).length,
  };
}
