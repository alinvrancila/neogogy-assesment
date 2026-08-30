/**
 * IP to place, resolved server side.
 *
 * The lookup is best effort: a slow or failing provider must never delay or
 * fail a submission, so every path here returns undefined rather than throwing.
 * Results are cached in memory for the life of the process, which is enough at
 * this volume and keeps us well inside a free tier.
 *
 * The provider is swappable through GEOIP_URL, where {ip} is substituted, so
 * moving to a paid or self-hosted database later is a config change.
 */

export type IpGeo = {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postal?: string;
  continent?: string;
  /** Coarse coordinates of the city, not of a person. */
  latitude?: number;
  longitude?: number;
  /** True when the address is inside the EU, which changes what law applies. */
  isEu?: boolean;
  /** The network the request came from. */
  isp?: string;
  org?: string;
  asn?: number;
  networkDomain?: string;
  /** Timezone the address belongs to, useful against the reported local hour. */
  ipTimezone?: string;
  utcOffset?: string;
  /** Set when the network looks like a datacentre, so likely a VPN or a bot. */
  datacenter?: boolean;
};

const DEFAULT_URL = 'https://ipwho.is/{ip}';

/**
 * Networks that host machines rather than people. A hit means the visitor is
 * behind a VPN, a proxy or is automation, which is a data quality signal and
 * not an accusation.
 */
const DATACENTER = [
  'amazon', 'aws', 'google llc', 'google cloud', 'microsoft', 'azure', 'digitalocean',
  'linode', 'akamai', 'cloudflare', 'ovh', 'hetzner', 'contabo', 'vultr', 'scaleway',
  'leaseweb', 'choopa', 'm247', 'datacamp', 'packethub', 'nordvpn', 'expressvpn',
  'surfshark', 'private internet access', 'mullvad', 'proton', 'oracle cloud',
  'alibaba', 'tencent', 'hostinger', 'godaddy', 'namecheap', 'colocation', 'hosting',
  'server', 'datacenter', 'data center',
];

const cache = new Map<string, IpGeo | null>();

const looksDatacenter = (isp?: string, org?: string) => {
  const hay = `${isp || ''} ${org || ''}`.toLowerCase();
  return hay.trim() ? DATACENTER.some((n) => hay.includes(n)) : undefined;
};

/** Private, loopback and link-local addresses never leave the building. */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n))) return false;
  if (p[0] === 10 || p[0] === 127) return true;
  if (p[0] === 192 && p[1] === 168) return true;
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
  if (p[0] === 169 && p[1] === 254) return true;
  return false;
}

export async function lookupIp(ip: string, timeoutMs = 1800): Promise<IpGeo | undefined> {
  if (!ip || isPrivateIp(ip)) return undefined;
  if (cache.has(ip)) return cache.get(ip) ?? undefined;

  const url = (process.env.GEOIP_URL || DEFAULT_URL).replace('{ip}', encodeURIComponent(ip));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!res.ok) { cache.set(ip, null); return undefined; }
    const d = (await res.json()) as Record<string, any>;
    if (d.success === false) { cache.set(ip, null); return undefined; }

    const isp = d.connection?.isp || d.isp;
    const org = d.connection?.org || d.org;
    const geo: IpGeo = {
      country: d.country,
      countryCode: d.country_code || d.countryCode,
      region: d.region,
      city: d.city,
      postal: d.postal || d.zip,
      continent: d.continent,
      latitude: typeof d.latitude === 'number' ? d.latitude : undefined,
      longitude: typeof d.longitude === 'number' ? d.longitude : undefined,
      isEu: typeof d.is_eu === 'boolean' ? d.is_eu : undefined,
      isp,
      org,
      asn: typeof d.connection?.asn === 'number' ? d.connection.asn : undefined,
      networkDomain: d.connection?.domain,
      ipTimezone: d.timezone?.id || d.timezone,
      utcOffset: d.timezone?.utc,
      datacenter: looksDatacenter(isp, org),
    };
    cache.set(ip, geo);
    return geo;
  } catch {
    // a timeout or a network failure simply means we do not know where they are
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
