/**
 * What the request itself tells us, before the page says anything.
 *
 * Every field here comes from headers the browser sends on its own: the
 * address the connection came from, the user agent string, the languages the
 * visitor has configured. Nothing is inferred by probing the device.
 *
 * Pure functions, so the parsers are testable without a request.
 */

export type UaInfo = {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  /** phone, tablet, desktop or bot, as far as the string admits. */
  deviceClass?: string;
  /** Apple, Samsung and the like, when the string names it. */
  vendor?: string;
  bot?: boolean;
};

const BROWSERS: Array<[RegExp, string]> = [
  [/edg(?:e|a|ios)?\/([\d.]+)/i, 'Edge'],
  [/opr\/([\d.]+)/i, 'Opera'],
  [/samsungbrowser\/([\d.]+)/i, 'Samsung Internet'],
  [/firefox\/([\d.]+)/i, 'Firefox'],
  [/fxios\/([\d.]+)/i, 'Firefox'],
  [/crios\/([\d.]+)/i, 'Chrome'],
  [/chrome\/([\d.]+)/i, 'Chrome'],
  [/version\/([\d.]+).*safari/i, 'Safari'],
  [/safari\/([\d.]+)/i, 'Safari'],
];

const OSES: Array<[RegExp, string]> = [
  [/windows nt ([\d.]+)/i, 'Windows'],
  [/android ([\d.]+)/i, 'Android'],
  [/(?:iphone|cpu) os ([\d_]+)/i, 'iOS'],
  [/mac os x ([\d_.]+)/i, 'macOS'],
  [/cros [^)]*?([\d.]+)/i, 'ChromeOS'],
  [/ubuntu/i, 'Ubuntu'],
  [/linux/i, 'Linux'],
];

const WINDOWS_NAMES: Record<string, string> = {
  '10.0': '10 or 11', '6.3': '8.1', '6.2': '8', '6.1': '7',
};

const BOT = /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|preview|headless|phantomjs|curl|wget|python-requests|axios|go-http|okhttp|scrapy|lighthouse|monitor|uptime|pingdom|semrush|ahrefs|whatsapp|telegram|discord|linkedinbot|twitterbot|embedly/i;

/** Read a user agent string into the parts worth reporting on. */
export function parseUserAgent(ua: string): UaInfo {
  if (!ua) return {};
  const out: UaInfo = {};

  if (BOT.test(ua)) { out.bot = true; out.deviceClass = 'bot'; }

  for (const [re, name] of BROWSERS) {
    const m = ua.match(re);
    if (m) { out.browser = name; out.browserVersion = (m[1] || '').split('.').slice(0, 2).join('.'); break; }
  }
  for (const [re, name] of OSES) {
    const m = ua.match(re);
    if (m) {
      out.os = name;
      const v = (m[1] || '').replace(/_/g, '.');
      out.osVersion = name === 'Windows' ? (WINDOWS_NAMES[v] || v) : v.split('.').slice(0, 2).join('.');
      break;
    }
  }

  if (!out.bot) {
    const tablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua);
    const phone = /mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua);
    out.deviceClass = tablet ? 'tablet' : phone ? 'phone' : 'desktop';
  }

  if (/iphone|ipad|ipod|mac os x/i.test(ua)) out.vendor = 'Apple';
  else if (/samsung|sm-[a-z0-9]/i.test(ua)) out.vendor = 'Samsung';
  else if (/pixel/i.test(ua)) out.vendor = 'Google';
  else if (/huawei/i.test(ua)) out.vendor = 'Huawei';
  else if (/xiaomi|redmi|poco/i.test(ua)) out.vendor = 'Xiaomi';
  else if (/oppo/i.test(ua)) out.vendor = 'Oppo';
  else if (/vivo/i.test(ua)) out.vendor = 'Vivo';

  return out;
}

/**
 * The client address. Behind nginx the socket address is the proxy, so the
 * forwarded chain is authoritative, and the first entry is the visitor.
 */
export function clientIp(headers: Headers): string {
  const chain = headers.get('x-forwarded-for');
  if (chain) {
    const first = chain.split(',')[0]?.trim();
    if (first) return first.replace(/^\[|\]$/g, '');
  }
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('true-client-ip') ||
    ''
  ).trim();
}

/** The languages the browser asks for, most preferred first. */
export function parseLanguages(header: string | null): string[] {
  if (!header) return [];
  return header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.trim(), q: q ? Number(q.split('=')[1]) : 1 };
    })
    .filter((l) => l.tag && l.tag !== '*')
    .sort((a, b) => b.q - a.q)
    .slice(0, 5)
    .map((l) => l.tag);
}

export type RequestContext = {
  ip?: string;
  userAgent?: string;
  languages?: string[];
  /** The page that linked here, as the server saw it. */
  referer?: string;
} & UaInfo;

export function requestContext(headers: Headers): RequestContext {
  const ua = headers.get('user-agent') || '';
  const ip = clientIp(headers);
  const languages = parseLanguages(headers.get('accept-language'));
  const referer = headers.get('referer') || undefined;
  return {
    ip: ip || undefined,
    userAgent: ua ? ua.slice(0, 400) : undefined,
    languages: languages.length ? languages : undefined,
    referer: referer ? referer.slice(0, 300) : undefined,
    ...parseUserAgent(ua),
  };
}
