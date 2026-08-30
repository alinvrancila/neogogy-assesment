/**
 * Checks for the request parsing and the reach reports.
 *
 * The parsers see hostile input in production (any header can say anything),
 * so the cases below include the malformed ones on purpose.
 */
import { parseUserAgent, clientIp, parseLanguages } from '@/lib/requestContext';
import { isPrivateIp } from '@/lib/geoip';
import { buildReachReport, buildTechReport, buildEngagementReport, type Attempt } from '@/lib/analytics';

let pass = 0; let fail = 0;
const ok = (name: string, cond: boolean, got?: unknown) => {
  if (cond) { pass += 1; console.log('  ok   ', name); }
  else { fail += 1; console.log('  FAIL ', name, got !== undefined ? `got ${JSON.stringify(got)}` : ''); }
};

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  bot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  fb: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
};

console.log('\nUser agents');
ok('an iPhone reads as a phone on iOS', (() => {
  const u = parseUserAgent(UA.iphone);
  return u.deviceClass === 'phone' && u.os === 'iOS' && u.browser === 'Safari' && u.vendor === 'Apple';
})(), parseUserAgent(UA.iphone));
ok('an Android phone names Chrome and the maker', (() => {
  const u = parseUserAgent(UA.android);
  return u.deviceClass === 'phone' && u.os === 'Android' && u.browser === 'Chrome' && u.vendor === 'Samsung';
})(), parseUserAgent(UA.android));
ok('an iPad is a tablet, not a phone', parseUserAgent(UA.ipad).deviceClass === 'tablet');
ok('Edge is told apart from Chrome', parseUserAgent(UA.windows).browser === 'Edge');
ok('Windows 10 and 11 are reported honestly as one', parseUserAgent(UA.windows).osVersion === '10 or 11');
ok('a desktop Mac is a desktop', (() => {
  const u = parseUserAgent(UA.mac);
  return u.deviceClass === 'desktop' && u.os === 'macOS';
})());
ok('a crawler is flagged and not counted as a device', (() => {
  const u = parseUserAgent(UA.bot);
  return u.bot === true && u.deviceClass === 'bot';
})());
ok('the link preview fetcher is flagged too', parseUserAgent(UA.fb).bot === true);
ok('an empty agent yields nothing rather than throwing', Object.keys(parseUserAgent('')).length === 0);

console.log('\nAddresses');
const H = (h: Record<string, string>) => new Headers(h);
ok('the first hop in the forwarded chain is the visitor',
  clientIp(H({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1, 10.0.0.2' })) === '203.0.113.9');
ok('a real ip header is used when there is no chain',
  clientIp(H({ 'x-real-ip': '198.51.100.4' })) === '198.51.100.4');
ok('no headers means no address', clientIp(H({})) === '');
ok('private ranges are never sent for lookup',
  ['10.1.2.3', '192.168.0.5', '172.16.4.4', '127.0.0.1', '::1'].every(isPrivateIp));
ok('a public address is looked up', !isPrivateIp('203.0.113.9'));

console.log('\nLanguages');
ok('languages come back in preference order',
  JSON.stringify(parseLanguages('en-GB,en;q=0.9,fil;q=0.8')) === JSON.stringify(['en-GB', 'en', 'fil']));
ok('a missing header is an empty list', parseLanguages(null).length === 0);

console.log('\nReach reports');
const attempt = (email: string, meta: Record<string, unknown>): Attempt => ({
  id: `a_${email}_${JSON.stringify(meta).length}`,
  email, name: email, persona: 'student', createdAt: '2026-01-01T00:00:00.000Z',
  result: { stage: { rawIndex: 50, stage: 5 }, dimensions: {}, archetype: { id: 'x', name: 'X' } } as never,
  rescored: false, heardFrom: '', consent: true, hasPhone: false, answers: {}, baseline: null,
  meta: meta as never,
});

const cohort = [
  attempt('a@x.com', { country: 'Philippines', countryCode: 'PH', city: 'Manila', latitude: 14.6, longitude: 121, ip: '203.0.113.1', device: 'phone', browser: 'Chrome', os: 'Android', timezone: 'Asia/Manila', ipTimezone: 'Asia/Manila', durationMs: 600000, medianAnswerMs: 8000, awayCount: 0, screenWidth: 390 }),
  attempt('b@x.com', { country: 'Philippines', countryCode: 'PH', city: 'Manila', latitude: 14.6, longitude: 121, ip: '203.0.113.1', device: 'desktop', browser: 'Safari', os: 'macOS', timezone: 'Asia/Manila', ipTimezone: 'Asia/Manila', durationMs: 900000, medianAnswerMs: 12000, awayCount: 2, rushedAnswers: 4, screenWidth: 1512 }),
  attempt('c@y.com', { country: 'Germany', countryCode: 'DE', city: 'Berlin', latitude: 52.5, longitude: 13.4, isEu: true, datacenter: true, ip: '198.51.100.7', device: 'desktop', browser: 'Firefox', os: 'Windows', timezone: 'America/New_York', ipTimezone: 'Europe/Berlin', durationMs: 300000, medianAnswerMs: 900, awayCount: 1, resumed: true, screenWidth: 1920 }),
  attempt('d@y.com', {}),
];

const reach = buildReachReport(cohort);
ok('records without context are excluded from the denominator', reach.known === 3 && reach.total === 4, reach.known);
ok('countries are ranked by count', reach.countries[0].label === 'Philippines' && reach.countries[0].count === 2);
ok('two people on one address are reported as shared',
  reach.sharedNetworks.length === 1 && reach.sharedNetworks[0].people === 2, reach.sharedNetworks);
ok('the EU share is measured against records that have context', reach.euShare === 33.3, reach.euShare);
ok('a datacentre network is counted', reach.datacenterShare === 33.3, reach.datacenterShare);
ok('a browser timezone that disagrees with the address is counted',
  reach.timezoneMismatch === 33.3, reach.timezoneMismatch);
ok('one point per city, with a count', (() => {
  const manila = reach.points.find((p) => p.city === 'Manila');
  return reach.points.length === 2 && manila?.count === 2;
})(), reach.points);

const tech = buildTechReport(cohort);
ok('devices are tallied', tech.devices.find((d) => d.label === 'desktop')?.count === 2);
ok('screens land in readable bands',
  tech.screens.some((s) => s.label === 'Under 400px') && tech.screens.some((s) => s.label === '1920px and wider'),
  tech.screens);

const eng = buildEngagementReport(cohort);
ok('the median sitting is in minutes', eng.minutes.median === 10, eng.minutes.median);
ok('leaving the tab is measured on the ones we know about', eng.leftTabShare === 66.7, eng.leftTabShare);
ok('rushing is reported at three or more fast answers', eng.rushedShare === 33.3, eng.rushedShare);
ok('resuming a draft is measured', eng.resumedShare === 33.3, eng.resumedShare);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
