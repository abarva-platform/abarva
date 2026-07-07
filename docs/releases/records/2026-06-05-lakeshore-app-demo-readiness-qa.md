# 2026-06-05-lakeshore-app-demo-readiness-qa — Lakeshore App Demo Readiness QA

## Release ID

`2026-06-05-lakeshore-app-demo-readiness-qa`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable Lakeshore live-demo QA runner that signs in as the Lakeshore CFO persona, pins the active client to Lakeshore, visits the demo-critical product surfaces, and emits JSON plus an HTML report. The runner is designed to prove that the demo uses real synthetic Source and Moves artifacts, tenant-scoped routes, and live production pages rather than doc-only claims.

## Layer Impact

- `internal-admin`: Adds an operator/auditor script and generated evidence packet for app-demo readiness checks.
- `client-data-lane`: Verifies Lakeshore tenant data and artifact visibility, but does not write or mutate tenant data.
- `public-demo`: Supports the Lakeshore demo path by documenting which live routes are safe to show.

## Client Applicability

- All clients: No direct runtime change.
- Specific clients: Lakeshore only.
- Internal only: QA runner and audit packet.
- Public/demo only: Demo evidence and route-readiness reporting.
- Feature flag: None.

## Changes Included

- `scripts/lakeshore/app-demo-readiness-qa.mjs`
- Generated audit packet under `audit-artifacts/lakeshore-app-demo-readiness/` when the runner is executed.

## QA / Validation

- Pass: `node --check scripts/lakeshore/app-demo-readiness-qa.mjs`
- Pass: live run against `https://app.abarva.ai` with `cfo@lakeshore-holdings.example.com` and `abarva_active_client=lakeshore`.
- Pass: 26/26 live checks passed in `audit-artifacts/lakeshore-app-demo-readiness/lakeshore-app-demo-readiness-2026-06-05T14-46-26-188Z-4723ac4d6/summary.json`.
- Pending before PR: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No runtime deployment is required for the script itself, although the live QA should be re-run after any production deployment that affects Lakeshore routes or tenant data.

## Rollback Plan

Revert the script and audit packet. No database, Azure, Clerk, or runtime state is changed by this release.

## Audit Evidence

- Script output: `audit-artifacts/lakeshore-app-demo-readiness/<run-id>/summary.json`
- Full check results: `audit-artifacts/lakeshore-app-demo-readiness/<run-id>/checks.json`
- Human-readable report: `audit-artifacts/lakeshore-app-demo-readiness/<run-id>/report.html`
- Production deployment inspected with Vercel CLI before live QA.

## Known Gaps

Corpus expansion is intentionally out of scope for this release. The runner verifies route text and visible artifact markers; it does not score LLM answer quality, which is covered by the separate CXO hard-question QA packet.
