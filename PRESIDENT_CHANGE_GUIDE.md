# Change Guide for the College President

This guide is for making thoughtful changes to the Neogogy assessment with
Claude or another coding assistant. The safest pattern is:

1. Describe the change clearly.
2. Ask Claude to inspect the repo before editing.
3. Ask Claude to run checks.
4. Commit and push the change.
5. Let GitHub Actions deploy automatically.

The live assessment is:

https://assessment.neogogy.ai

## The Short Version

When you want a change, tell Claude:

```text
Please inspect this repository first. I want to change [describe the change].

Keep the existing design language and user flow. Make the smallest clean change
that solves the request. Do not remove analytics, email capture, PDF download,
admin dashboard, GitHub Actions, deployment files, secrets handling, SSL, or
nginx settings unless I explicitly ask.

Before you finish, run:
npm run lint
npm run build
npm run typecheck

If those pass, update the visible release stamp if this is a user-facing change,
commit the change with a clear message, and push to main. Deployment happens
automatically after the push.
```

## Where Common Changes Live

Most assessment wording and questions:

```text
src/data/compass.ts
```

Main assessment screens, flow, and release stamp:

```text
src/components/compass/CompassApp.tsx
```

Results screen and email/PDF gate:

```text
src/components/compass/Results.tsx
```

Charts, logos, and visual components:

```text
src/components/compass/Visuals.tsx
```

PDF report content/layout:

```text
src/lib/reportPdf.tsx
```

Visual styling:

```text
src/app/compass.css
src/app/globals.css
```

Admin dashboard:

```text
src/app/admin/page.tsx
```

Deployment and server configuration:

```text
.github/workflows/ci.yml
.github/workflows/deploy.yml
deploy/nginx.conf
deploy/neogogy.service
DEPLOY.md
```

Avoid changing deployment files unless the requested change is specifically
about CI/CD, the server, SSL, nginx, or GitHub Actions.

## Updating the Version Stamp

For user-facing changes, ask Claude to update the release stamp so the live site
can prove the change deployed.

The visible stamp is in:

```text
src/components/compass/CompassApp.tsx
```

Look for:

```ts
const RELEASE_INFO = {
  version: 'v0.1.1',
  date: '2026-07-03',
  copyright: 'Copyright 2026 Dr. Alin Vrancila'
};
```

Also keep `package.json` version aligned when the release number changes.

Suggested version rule:

- Small wording/style fix: bump the patch version, for example `0.1.1` to `0.1.2`.
- Noticeable feature/content update: bump the minor version, for example `0.1.1` to `0.2.0`.
- Major redesign or scoring change: agree on the version number before editing.

## Good Claude Prompts

### Change Assessment Wording

```text
Please update the assessment wording in src/data/compass.ts.

Change [old wording or section] to [new wording]. Preserve the scoring logic,
role substitutions like {learner}, and the 1-5 answer structure. Do not change
question IDs unless absolutely necessary because analytics may depend on them.

Run lint, build, and typecheck. If they pass, bump the patch version and release
date, commit, and push to main.
```

### Change the Look and Feel

```text
Please adjust the visual design of the assessment.

Goal: [describe the visual goal]. Keep the existing elegant academic/formation
style. Do not redesign the whole app. Make the change responsive on mobile and
desktop. Do not let text overlap or overflow.

After editing, run lint, build, and typecheck. Bump the visible release stamp,
commit, and push to main.
```

### Add or Revise PDF Content

```text
Please update the generated PDF report in src/lib/reportPdf.tsx.

Add/change [describe the content]. Keep the PDF professional, readable, and
consistent with the assessment result language. Do not break the email capture
or download flow.

Run lint, build, and typecheck. Bump the visible release stamp, commit, and push
to main.
```

### Change Scoring or Results

```text
Please inspect src/lib/engine.ts, src/data/compass.ts, and
src/components/compass/Results.tsx before editing.

I want to change how results are calculated/displayed: [describe the scoring or
result change]. Explain the impact before editing. Preserve existing analytics
events and stored lead data unless I explicitly approve a data-shape change.

Add or update a focused test if the repo already has a suitable test setup.
Run lint, build, and typecheck. Bump the release stamp, commit, and push to main.
```

### Add Admin Dashboard Feature

```text
Please inspect src/app/admin/page.tsx and the storage helpers in src/lib before
editing.

I want the admin dashboard to [describe feature]. Preserve existing login,
stats, user management, and DynamoDB behavior. Do not expose secret tokens in
the browser.

Run lint, build, and typecheck. Commit and push to main.
```

## Deployment Instructions for Claude

Tell Claude this:

```text
Deployment is already configured with GitHub Actions.

Do not manually SSH into the server for ordinary app changes. Do not paste or
request AWS keys, SSH keys, GitHub tokens, .env files, or secrets.

After checks pass, commit the change and push to the main branch. GitHub Actions
will automatically:

1. Run CI on the push.
2. Build the app.
3. Temporarily allow the GitHub runner to SSH into EC2.
4. Upload the release.
5. Run npm ci and npm run build on the server.
6. Restart the neogogy service.
7. Reload nginx.
8. Revoke the temporary SSH rule.

After pushing, open the GitHub Actions tab and verify both CI and Deploy are
green. Then verify https://assessment.neogogy.ai and check the bottom-right
version stamp.
```

## What Not To Give Claude

Do not paste these into Claude:

- AWS access keys.
- GitHub personal access tokens.
- SSH private keys or `.pem` files.
- `.env.production`.
- Admin passwords.
- Analytics tokens.
- Any private student, parent, staff, or lead data.

Claude can make normal code changes without seeing secrets. The secrets already
live in GitHub Actions and on the EC2 server.

## Before Pushing

Ask Claude to run:

```text
npm run lint
npm run build
npm run typecheck
```

If any command fails, Claude should fix the problem before committing.

## After Pushing

Check:

1. GitHub repository > Actions.
2. Confirm `CI` is green.
3. Confirm `Deploy` is green.
4. Open https://assessment.neogogy.ai.
5. Confirm the requested change is visible.
6. Confirm the bottom-right release stamp changed when appropriate.

## If Deployment Fails

Give Claude this prompt:

```text
The GitHub Actions deploy failed. Please inspect the failing workflow run and
identify the first failing step. Do not guess. Summarize the error, propose the
smallest fix, apply it, run local checks, commit, and push again.

Do not change repository secrets, AWS credentials, SSH keys, nginx SSL settings,
or EC2 security-group logic unless the log clearly proves that area is the cause.
```

If the live site is still working, avoid panic edits. A failed deployment usually
means the previous successful version is still running.

## Safe Change Checklist

Before saying the work is done, Claude should confirm:

- The requested change was made.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run typecheck` passed.
- The release stamp was updated for user-facing changes.
- The change was committed and pushed to `main`.
- GitHub Actions `CI` and `Deploy` completed successfully.
- The live site was checked after deployment.

