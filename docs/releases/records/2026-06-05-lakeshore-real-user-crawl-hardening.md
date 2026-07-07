# 2026-06-05-lakeshore-real-user-crawl-hardening — Lakeshore Real-User Crawl Hardening

## Release ID

`2026-06-05-lakeshore-real-user-crawl-hardening`

## Status

`candidate`

## Plain-English Summary

The Lakeshore app demo-readiness crawl now handles the Responsible AI acknowledgment and training gates for real Clerk users before checking Setup/Admin, Source, Moves, Tower, and Intelligence routes. This keeps the QA proof aligned with the actual production sign-in path instead of relying on an already-onboarded browser session.

## Layer Impact

- Release lane `internal-admin`: Updates the Lakeshore QA harness used by operators to collect proof screenshots and route status.
- Release lane `public-demo`: Improves repeatability of buyer/demo evidence capture for the live Lakeshore walkthrough.

## Client Applicability

- All clients: None.
- Specific clients: Lakeshore demo QA only.
- Internal only: The script is an internal QA harness and does not change runtime product behavior.
- Public/demo only: The generated screenshots and reports support the public/demo proof package.
- Feature flag: None.

## Changes Included

- `scripts/lakeshore/app-demo-readiness-qa.mjs` now completes the Responsible AI acknowledgment and training APIs after Clerk sign-in and before route crawling.

## QA / Validation

- `DOTENV_CONFIG_PATH=/Users/anand/Projects/nexus/.env.local LAKESHORE_DEMO_QA_BASE_URL=https://app.abarva.ai LAKESHORE_DEMO_QA_EMAIL=surekha.durvasula@gmail.com LAKESHORE_DEMO_QA_CLIENT=lakeshore LAKESHORE_DEMO_QA_OUT=/private/tmp/nexus-lakeshore-cxo-qa-hardening/reports/2026-06-05-post3132-lakeshore-app-demo-readiness-surekha-access-fixed node -r dotenv/config scripts/lakeshore/app-demo-readiness-qa.mjs`
- Result: 26 checks, 26 pass, 0 watch, 0 fail against `https://app.abarva.ai` as the real Surekha Lakeshore account.
- Areas covered: Admin, Setup, Source, Moves, Tower, and Intelligence.

## Rollout Plan

Merge to `main`. No runtime deploy is required for product behavior, but the updated QA harness should be used for future live screenshot and demo-readiness captures.

## Rollback Plan

Revert this script change. Existing product runtime remains unaffected because this release only changes an internal QA harness.

## Audit Evidence

- Live QA report: `/private/tmp/nexus-lakeshore-cxo-qa-hardening/reports/2026-06-05-post3132-lakeshore-app-demo-readiness-surekha-access-fixed/lakeshore-app-demo-readiness-2026-06-05T21-11-24-858Z-963d6cf31/report.html`
- Screenshot manifest: `/private/tmp/nexus-lakeshore-cxo-qa-hardening/reports/2026-06-05-post3132-lakeshore-app-demo-readiness-surekha-access-fixed/lakeshore-app-demo-readiness-2026-06-05T21-11-24-858Z-963d6cf31/screenshots.json`
- Screenshot folder: `/private/tmp/nexus-lakeshore-cxo-qa-hardening/reports/2026-06-05-post3132-lakeshore-app-demo-readiness-surekha-access-fixed/lakeshore-app-demo-readiness-2026-06-05T21-11-24-858Z-963d6cf31/screenshots/`

## Known Gaps

The real-user data-plane access grant for Surekha was applied operationally in production Postgres and Clerk metadata; it is not part of this script-only release.
