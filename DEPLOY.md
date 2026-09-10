# Neogogy Readiness Index: Deployment

## What is running

- **Host:** AWS EC2 `t3.micro` (Amazon Linux 2023), region `ap-southeast-1`.
  - Instance: `i-06cc3b7e75a1ecac6`
  - Elastic IP (static): **52.77.118.48**
  - Security group `neogogy-sg` (`sg-0b80f7572d5d02196`): port 22 from the deployer IP only, ports 80 and 443 open.
  - 2 GB swap so `next build` does not run out of memory.
- **App:** Next.js 14, served by `next start` on port 3000, managed by systemd unit `neogogy`.
- **Reverse proxy:** nginx on port 80 (443 after SSL) at `/etc/nginx/nginx.conf`.
- **Storage:** DynamoDB tables `neogogy-leads` and `neogogy-events` (region `ap-southeast-1`, on-demand billing).
- **Analytics:** self-hosted events to DynamoDB; summary at `GET /api/stats?token=...`.
- **Email:** Amazon SES. Whether sending is on is set on the server, not here.
  See "Email" below for how to check it, because this file said both at once for
  a while and neither statement was verifiable from the repository.

## Live URLs

- **https://assessment.neogogy.ai** (live, Let's Encrypt SSL, http -> https redirect, auto-renew enabled)
- Direct IP: http://52.77.118.48/

## Finish the custom domain (your action in GoDaddy)

`assessment.neogogy.ai` currently has an A record pointing at `18.204.4.39`.
Change it to the Elastic IP:

1. GoDaddy > Domains > neogogy.ai > DNS.
2. Edit the existing **A** record with host `assessment` (or add one):
   - Type: `A`
   - Host: `assessment`
   - Value: `52.77.118.48`
   - TTL: 600 seconds.
3. Save and wait for it to propagate (usually minutes).

Then obtain SSL (one command, already staged on the server):

```
ssh -i C:\Users\lcfaj\OneDrive\Documents\Neogogy.Ai\keys\neogogy-fresh-20260625-180854.pem ec2-user@52.77.118.48 "bash setup-ssl.sh"
```

This runs certbot for `assessment.neogogy.ai`, switches nginx to HTTPS, adds the
http -> https redirect, and enables auto-renewal.

## Email (Amazon SES)

**Check before you trust it.** This file used to assert `EMAIL_ENABLED=true` here
and `EMAIL_ENABLED=false` twenty lines earlier, and the handover said a third
thing. The server is the only authority:

```bash
grep -E '^EMAIL_(ENABLED|FROM)=' /opt/neogogy/app/.env.production
```

The intended configuration is `EMAIL_ENABLED=true`, `EMAIL_FROM=info@neogogy.ai`,
region ap-southeast-1. The SES account already has production access (can send to
any recipient). Sends succeed once the `info@neogogy.ai` sender is verified.

**And check that it is actually working.** Every submission now records the
outcome on the record (`emailSent`, `emailError`) and emits a
`report_email_sent` or `report_email_failed` event, so the admin dashboard shows
a delivery rate rather than nothing. A run of `report_email_failed` with reason
`email_disabled` means sending is off; anything else names the SES error.

Sending being off is no longer the same as a respondent getting nothing: the
results screen offers a PDF download for every edition, and the report keeps its
own address under `/r/`. Bounces and complaints are still unhandled, which is
the remaining piece before any volume: subscribe an SNS topic to SES bounce and
complaint notifications and keep a suppression list.

Two verification paths were set up:

1. **Email identity `info@neogogy.ai`** (immediate): SES sent a verification email
   to that inbox. Click the link and sending works right away.
2. **Domain identity `neogogy.ai` with Easy DKIM** (recommended for deliverability):
   add these 3 CNAME records in GoDaddy (host is relative to neogogy.ai):

   | Host (Name)                                   | Value                                              |
   | --------------------------------------------- | -------------------------------------------------- |
   | `wj5s5rpq5hmqeix4i3sslkrfjewdqwsb._domainkey` | `wj5s5rpq5hmqeix4i3sslkrfjewdqwsb.dkim.amazonses.com` |
   | `5ij2dr3vqgzvowqttlmqzapiqg3qqsmg._domainkey` | `5ij2dr3vqgzvowqttlmqzapiqg3qqsmg.dkim.amazonses.com` |
   | `ziswxjggwn357d53eonc7u7ovfjujkg6._domainkey` | `ziswxjggwn357d53eonc7u7ovfjujkg6.dkim.amazonses.com` |

   SES auto-verifies the domain once the records propagate. After that, mail from
   any `@neogogy.ai` address is DKIM-signed.

If a send fails (e.g. before verification completes) the user still gets on-screen
results and the PDF download; the error is logged, never shown.

## Report links (audit item B3)

Every stored submission has its own report page at `/r/<token>`. Three things
about the deployment matter to it.

**nginx ships with the deploy.** `.github/workflows/deploy.yml` copies
`deploy/nginx.conf` to the box, runs `nginx -t` and reloads, on every push to
`main`. No hand copying is needed. What follows is what that file now does and
how to confirm it landed.

- A `log_format redacted` plus two `map` blocks rewrite `/r/<token>` to
  `/r/[token]` before anything is written to the access log. The privacy notice
  tells respondents the token is stripped from the logs, and until this is live
  on the box, it is not.
- `/r/` now terminates in its own `location ^~` block with
  `error_log /dev/null crit;`. The error log cannot be rewritten the way the
  access log can: nginx appends the raw request line to an upstream failure, so
  a `systemctl restart neogogy` during a deploy would write live tokens into
  `error.log`. Report requests therefore log no errors of their own. An upstream
  outage is still visible on every other path, which is where it is read from.
- `X-Forwarded-For` is now `$remote_addr` rather than `$proxy_add_x_forwarded_for`.
  The appending form kept whatever the caller sent and put the real address after
  it, and the app reads the first entry, so a visitor could choose the IP recorded
  against their submission and could evade the rate limit on link guessing. If a
  CDN or load balancer is ever put in front of nginx, this has to change again.

Confirm it landed, from anywhere:

```bash
curl -sI https://assessment.neogogy.ai/r/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
  | grep -iE 'x-robots-tag|referrer-policy|cache-control'
```

and on the box:

```bash
sudo tail -2 /var/log/nginx/access.log   # must show /r/[token], never a real token
```

The `Deploy` workflow runs `lint`, `build` and `typecheck` but not `npm test`.
CI runs the suites on the same push, so a red suite is visible, but it does not
stop the deploy. Adding a `Test` step to `deploy.yml` would make the privacy
promises in `tests/humanAdvantage/link.ts` a release gate rather than a report.

**Table scans.** `neogogy-leads` has no index on `reportToken`, so opening a
report is a filtered `Scan`, billed against the whole table. That is fine at the
current row count and will not stay fine. A global secondary index on
`reportToken` (and one on `email`, which `lastCompletedAtForEmail` and the
retake history would both use) turns two scans per page view into two queries.
Until then the miss limit in `src/lib/reportLinkAccess.ts` is what stands
between a guessing loop and the bill.

**Retention is only half enforced.** A link stops opening 24 months after the
person's last completed assessment, because the app checks. The record itself is
still deleted by hand. Either stamp a DynamoDB TTL attribute equal to
`expiresAt(lastCompletedAt)` on each write and re-stamp the person's earlier
records on every new submission, or run a scheduled purge. The notice says the
link and the record go together, and today only the link keeps that promise.

## Editing copy (no code knowledge needed)

All user-facing words live in `src/data/copy.ts` (and question wording in
`src/data/questionBank.ts`). After editing, redeploy:

```
powershell -ExecutionPolicy Bypass -File deploy\redeploy.ps1
```

## Analytics dashboard and admin users

- URL: **https://assessment.neogogy.ai/admin**
- **Login is email + password**, checked against the DynamoDB `neogogy-users`
  table (scrypt-hashed passwords). Usernames must be valid emails. Three
  accounts were seeded: `alin@`, `don@` and `lem@neogogy.ai`.

  > **Their passwords used to be printed here.** They were the same default for
  > all three, against a dashboard holding every respondent's name, email,
  > phone, address, location and answers, and this file is in the repository.
  > **Rotate all three in the "Admin users" panel before launch**, and treat the
  > old one as burned. Passwords do not go back into this file: set them in the
  > panel and share them out of band.

- **Login is rate limited**: ten failed attempts per address and per account in
  fifteen minutes, then a fifteen minute wait. Successful logins are never
  rationed. The counters live in the app process, so a restart clears them.
- **The session is not the stats token.** The cookie is a signed, expiring
  statement of who logged in and when, valid eight hours. Set
  `ADMIN_SESSION_SECRET` in `.env.production` to a long random value; rotating it
  signs everyone out immediately, which is the way to end a session you are
  unsure about. If it is unset the session falls back to signing with
  `STATS_TOKEN`, which works but ties the two secrets together.
- **User management** (in the dashboard, "Admin users" panel): add a user, change
  a user's password, or remove a user. Changes are live (no redeploy).
- Visuals (Google Charts): conversion funnel (started -> completed -> email),
  role distribution, zone distribution, all-events breakdown, plus metric cards
  for completion rate and email conversion. "Refresh" re-pulls.
- Break-glass: `ADMIN_PASSWORD` in `.env.production` (a random 28-char secret)
  works with any username if the users table is ever empty or unreachable. Keep
  it secret; rotate by editing the value and `sudo systemctl restart neogogy`.
- Re-seed the initial users any time: `node scripts/seed-users.mjs` (with AWS
  creds + `USERS_TABLE=neogogy-users` in the environment).
- Raw JSON analytics remain at `/api/stats?token=STATS_TOKEN`.

## Operations cheat sheet

```
# SSH in
ssh -i C:\Users\lcfaj\OneDrive\Documents\Neogogy.Ai\keys\neogogy-fresh-20260625-180854.pem ec2-user@52.77.118.48

# service
sudo systemctl status neogogy
sudo systemctl restart neogogy
tail -f /var/log/neogogy.log

# nginx
sudo nginx -t && sudo systemctl reload nginx

# analytics summary (replace TOKEN from .env.production STATS_TOKEN)
curl "https://assessment.neogogy.ai/api/stats?token=TOKEN"
```

## CI/CD

GitHub Actions is configured under `.github/workflows/`:

- `CI` runs on every pull request and every branch push, regardless of who made
  the push.
- `Deploy` runs when a push lands on `main`, regardless of who made the push,
  and can also be started manually from the Actions tab.

Both workflows run:

```
npm ci --no-audit --no-fund
npm run lint
npm run build
npm run typecheck
```

The deploy workflow then packages the source, uploads it to the EC2 host, runs
`npm ci` and `npm run build` on the server, restarts the `neogogy` systemd
service, reloads nginx, and checks the local app and nginx endpoints.

Add these repository secrets in GitHub before enabling production deploys:

| Secret | Value |
| ------ | ----- |
| `EC2_HOST` | `52.77.118.48` |
| `EC2_USER` | `ec2-user` |
| `EC2_PORT` | `22` |
| `EC2_SSH_KEY` | Private key contents for the EC2 deploy key |
| `EC2_SECURITY_GROUP_ID` | `sg-0b80f7572d5d02196` |
| `AWS_ACCESS_KEY_ID` | AWS key allowed to edit the EC2 security group |
| `AWS_SECRET_ACCESS_KEY` | Matching AWS secret key |
| `AWS_REGION` | `ap-southeast-1` |

The deploy job expects the production environment file to already exist on the
server at `/home/ec2-user/.env.production`; it copies that file into
`/opt/neogogy/app/.env.production` during each deploy. Do not commit
`.env.production` or SSH keys.

During deploy, the workflow discovers the GitHub runner's public IP, temporarily
authorizes that `/32` for SSH on the EC2 security group, and revokes it in an
`always()` cleanup step after the deploy attempt.

## Secrets and keys

- SSH private key: `C:\Users\lcfaj\OneDrive\Documents\Neogogy.Ai\keys\neogogy-fresh-20260625-180854.pem` (keep safe, not in the repo).
- The server holds the AWS access key in `/opt/neogogy/app/.env.production`. For
  hardening, replace it with a scoped key limited to DynamoDB (and SES once on),
  or migrate to an EC2 instance role if IAM permissions allow.

## Cost

t3.micro + 16 GB gp3 + Elastic IP (in use) is roughly 8 to 12 USD per month;
DynamoDB on-demand at this volume is cents. The first 12 months may fall under
the EC2 free tier if the account is eligible.
