# Neogogy Readiness Index: Deployment

## What is running

- **Host:** AWS EC2 `t3.micro` (Amazon Linux 2023), region `ap-southeast-1`.
  - Instance: `i-045e9a508a81eb188`
  - Elastic IP (static): **52.77.118.48**
  - Security group `neogogy-sg` (`sg-0b80f7572d5d02196`): port 22 from the deployer IP only, ports 80 and 443 open.
  - 2 GB swap so `next build` does not run out of memory.
- **App:** Next.js 14, served by `next start` on port 3000, managed by systemd unit `neogogy`.
- **Reverse proxy:** nginx on port 80 (443 after SSL) at `/etc/nginx/nginx.conf`.
- **Storage:** DynamoDB tables `neogogy-leads` and `neogogy-events` (region `ap-southeast-1`, on-demand billing).
- **Analytics:** self-hosted events to DynamoDB; summary at `GET /api/stats?token=...`.
- **Email:** Amazon SES, wired but disabled (`EMAIL_ENABLED=false`). See below.

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
ssh -i C:\Users\lci_d\neogogy-key.pem ec2-user@52.77.118.48 "bash setup-ssl.sh"
```

This runs certbot for `assessment.neogogy.ai`, switches nginx to HTTPS, adds the
http -> https redirect, and enables auto-renewal.

## Email (Amazon SES)

Email is ENABLED on the server: `EMAIL_ENABLED=true`, `EMAIL_FROM=info@neogogy.ai`,
region ap-southeast-1. The SES account already has production access (can send to
any recipient). Sends succeed once the `info@neogogy.ai` sender is verified.

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

## Editing copy (no code knowledge needed)

All user-facing words live in `src/data/copy.ts` (and question wording in
`src/data/questionBank.ts`). After editing, redeploy:

```
powershell -ExecutionPolicy Bypass -File deploy\redeploy.ps1
```

## Analytics dashboard and admin users

- URL: **https://assessment.neogogy.ai/admin**
- **Login is email + password**, checked against the DynamoDB `neogogy-users`
  table (scrypt-hashed passwords). Usernames must be valid emails. Accounts:
  - `alin@neogogy.ai` / `Default123!`
  - `don@neogogy.ai` / `Default123!`
  - `lem@neogogy.ai` / `Default123!`
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
ssh -i C:\Users\lci_d\neogogy-key.pem ec2-user@52.77.118.48

# service
sudo systemctl status neogogy
sudo systemctl restart neogogy
tail -f /var/log/neogogy.log

# nginx
sudo nginx -t && sudo systemctl reload nginx

# analytics summary (replace TOKEN from .env.production STATS_TOKEN)
curl "https://assessment.neogogy.ai/api/stats?token=TOKEN"
```

## Secrets and keys

- SSH private key: `C:\Users\lci_d\neogogy-key.pem` (keep safe, not in the repo).
- The server holds the AWS access key in `/opt/neogogy/app/.env.production`. For
  hardening, replace it with a scoped key limited to DynamoDB (and SES once on),
  or migrate to an EC2 instance role if IAM permissions allow.

## Cost

t3.micro + 16 GB gp3 + Elastic IP (in use) is roughly 8 to 12 USD per month;
DynamoDB on-demand at this volume is cents. The first 12 months may fall under
the EC2 free tier if the account is eligible.
