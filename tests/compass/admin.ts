/**
 * The door to everyone's personal data.
 *
 * The dashboard behind this login holds every respondent's name, email, phone,
 * address, city and answers. It was protected by three accounts sharing one
 * password that was printed in DEPLOY.md, with no attempt limit, and a session
 * cookie set to STATS_TOKEN, a value that also travels in query strings and
 * never changes. These checks hold the replacement closed.
 */
import fs from 'fs';
import path from 'path';
import {
  ADMIN_COOKIE, SESSION_MAX_AGE_S, mintAdminSession, readAdminSession,
} from '@/lib/adminAuth';
import { allow, peek, resetThrottles } from '@/lib/throttle';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: unknown) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail !== undefined ? `\n        ${String(detail)}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);
const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), 'utf-8');

process.env.ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'suite-secret-value';

head('A session names a person, expires, and is not another secret');
{
  const s = mintAdminSession('alin@neogogy.ai');
  ok('a session is issued', !!s);
  ok('and it reads back as the person who signed in',
    readAdminSession(s) === 'alin@neogogy.ai', readAdminSession(s));

  ok('it is not the stats token', s !== process.env.STATS_TOKEN);
  ok('and not the session secret either', s !== process.env.ADMIN_SESSION_SECRET);

  ok('two logins by the same person are different sessions',
    mintAdminSession('alin@neogogy.ai') !== mintAdminSession('alin@neogogy.ai'));

  ok('it expires', readAdminSession(s, Date.now() + (SESSION_MAX_AGE_S + 60) * 1000) === null);
  ok('and is live until then', readAdminSession(s, Date.now() + (SESSION_MAX_AGE_S - 60) * 1000) === 'alin@neogogy.ai');

  ok('nothing is not a session', readAdminSession(undefined) === null && readAdminSession('') === null);
  ok('a forged signature is refused', readAdminSession(`${s.split('.').slice(0, 3).join('.')}.forged`) === null);
  ok('an edited username is refused',
    readAdminSession([Buffer.from('attacker').toString('base64url'), ...s.split('.').slice(1)].join('.')) === null);
  ok('a session signed with another secret is refused', (() => {
    const mine = mintAdminSession('alin@neogogy.ai');
    const was = process.env.ADMIN_SESSION_SECRET;
    process.env.ADMIN_SESSION_SECRET = 'a-different-secret';
    const out = readAdminSession(mine);
    process.env.ADMIN_SESSION_SECRET = was;
    return out === null;
  })(), 'rotating the secret must sign everyone out');
}

head('Guessing a password costs the guesser');
{
  resetThrottles();
  const spent = Array.from({ length: 12 }, () => allow('suite:login', 10));
  ok('ten tries are allowed and the eleventh is not',
    spent.filter(Boolean).length === 10 && spent[10] === false, spent.filter(Boolean).length);
  ok('and the budget can be read without spending it',
    peek('suite:login', 10) === false);
  resetThrottles();
  ok('clearing them starts over', peek('suite:login', 10) === true);

  const route = read('src', 'app', 'api', 'admin', 'login', 'route.ts');
  ok('the login route counts failures', /allow\(byIp/.test(route) && /allow\(byUser/.test(route));
  ok('and checks the budget before it checks the password',
    route.indexOf('peek(byIp') < route.indexOf('authenticate(name, password)'));
  ok('a successful login is not rationed',
    route.indexOf('allow(byIp') > route.indexOf('!(await authenticate'));
  ok('the cookie is a minted session, not an environment secret',
    /mintAdminSession\(name\)/.test(route) && !/ADMIN_COOKIE, token/.test(route));
}

head('The door cannot be jammed shut from outside');
{
  const route = read('src', 'app', 'api', 'admin', 'login', 'route.ts');
  // Keyed on the submitted username alone, ten wrong guesses from anywhere
  // locked the owner out for fifteen minutes with no password required.
  ok('the account budget is scoped to the caller as well as the account',
    /admin-login:ip-user:\$\{ip\}:\$\{name\}/.test(route)
    && !/admin-login:user:\$\{name\}/.test(route),
    'a budget keyed on the username alone is a denial of service');

  resetThrottles();
  const attacker = 'admin-login:ip-user:203.0.113.1:alin@neogogy.ai';
  const owner = 'admin-login:ip-user:198.51.100.7:alin@neogogy.ai';
  for (let i = 0; i < 12; i++) allow(attacker, 10);
  ok('an attacker exhausts only their own budget', peek(attacker, 10) === false);
  ok('and the owner still has theirs', peek(owner, 10) === true);
  resetThrottles();
}

head('The session is not signed with a secret that travels in the open');
{
  const auth = read('src', 'lib', 'adminAuth.ts');
  ok('the stats token is never used to sign a session',
    !/process\.env\.STATS_TOKEN/.test(auth),
    'STATS_TOKEN is accepted in a query string, so anything logging a URL held a signing key');
  ok('an unconfigured deployment gets a random per-process secret instead',
    /randomBytes\(32\)/.test(auth) && /ephemeral/.test(auth));

  // A session minted under one secret must not read under another.
  const was = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = 'secret-one';
  const s = mintAdminSession('someone@example.com');
  process.env.ADMIN_SESSION_SECRET = 'secret-two';
  ok('and rotating it invalidates every session', readAdminSession(s) === null);
  process.env.ADMIN_SESSION_SECRET = was;
}

head('The public endpoints are bounded');
{
  const submit = read('src', 'app', 'api', 'submit', 'route.ts');
  ok('a submission costs an address part of an hourly budget', /allow\(`submit:/.test(submit));
  ok('and an address that is not one is refused', /looksLikeAnAddress/.test(submit));

  const stats = read('src', 'app', 'api', 'stats', 'route.ts');
  ok('the analytics summary is closed unless the caller proves itself',
    /const byToken = Boolean\(token\) && provided === token;/.test(stats)
    && /if \(!byToken && !isAdminAuthed\(request\)\)/.test(stats),
    'it used to be open whenever STATS_TOKEN was unset');

  const event = read('src', 'app', 'api', 'event', 'route.ts');
  ok('an event carries only identifiers, bounded', /const ident = /.test(event));
  ok('and anonymous callers have a budget', /allow\(`event:/.test(event));
}

head('No password is written down in the repository');
{
  const files = ['DEPLOY.md', 'README.md', '.env.example',
    path.join('scripts', 'seed-users.mjs'), path.join('docs', 'compass', 'HANDOVER.md')];
  for (const f of files) {
    const body = read(f);
    ok(`${f} carries no shared default password`,
      !/Default123/.test(body), 'a live password is committed here');
  }
  const seed = read('scripts', 'seed-users.mjs');
  ok('the seed script generates passwords rather than carrying them',
    /randomBytes\(\d+\)\.toString\('base64url'\)/.test(seed));
  ok('and says they are shown once', /only time they are shown/.test(seed));
  ok('the deployment notes tell the owner to rotate', /[Rr]otate all three/.test(read('DEPLOY.md')));
}

head('The cookie name has not drifted');
{
  ok('one name, used everywhere', ADMIN_COOKIE === 'neogogy_admin');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
