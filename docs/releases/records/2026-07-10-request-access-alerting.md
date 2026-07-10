# 2026-07-10-request-access-alerting - Request Access Failure Alerts

## Release ID

`2026-07-10-request-access-alerting`

## Status

`candidate`

## Plain-English Summary

The public request-access path now alerts `admin@abarva.ai` when the submission pipeline has an operational failure. Expected user validation errors, such as a personal email address, remain user-facing only and do not page admin. A scheduled canary also checks the live sign-in and request-access validation path every 15 minutes and emails admin if the path breaks.

## Layer Impact

- public-demo: `/api/request-access` keeps accepting private-preview requests but now sends an operational warning or critical alert when storage or email delivery fails.
- global-control-lane: `.github/workflows/request-access-monitor.yml` adds a scheduled live canary against `https://app.abarva.ai`.
- internal-admin: `scripts/qa/request-access-canary.mjs` records JSON evidence and sends an email alert through Resend on failure.

## Client Applicability

- All clients: No signed-in client workspace behavior changes.
- Specific clients: None.
- Internal only: Admin/operator notification behavior for the public request-access path.
- Public/demo only: The public private-preview request path receives monitoring.
- Feature flag: None.

## Changes Included

- `src/app/api/request-access/route.ts`
- `src/app/api/request-access/__tests__/route.test.ts`
- `scripts/qa/request-access-canary.mjs`
- `.github/workflows/request-access-monitor.yml`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/app/api/request-access/__tests__/route.test.ts --runInBand`
- Pass: `node scripts/qa/request-access-canary.mjs --base-url https://app.abarva.ai --out /tmp/request-access-canary-live.json`
- Pass: `npx eslint src/app/api/request-access/route.ts src/app/api/request-access/__tests__/route.test.ts scripts/qa/request-access-canary.mjs`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`. The route change becomes active through the repo-owned Azure Container Apps main deploy workflow. The scheduled monitor becomes active from GitHub Actions after merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: `RESEND_API_KEY` and optional `RESEND_FROM_EMAIL` must remain configured for email alerts.
- Live signed-in proof required: No signed-in proof required; public route live proof required.

## Rollback Plan

Revert this PR. That removes the extra alerting and scheduled canary while restoring the prior request-access behavior.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Canary evidence artifact: `audit-artifacts/request-access-monitor/result.json` after workflow run.

## Known Gaps

If Resend itself is unavailable, email alert delivery can fail. The workflow still fails visibly in GitHub Actions, and the server logs the request-access operational failure.
