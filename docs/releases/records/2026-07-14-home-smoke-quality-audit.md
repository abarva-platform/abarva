# 2026-07-14-home-smoke-quality-audit — Full Home Dimension, Tab, And Content Quality Audit

## Release ID

`2026-07-14-home-smoke-quality-audit`

## Status

`candidate`

## Plain-English Summary

Adds a read-only Home QA harness that audits every standard Home dimension, every standard Home tab, Home aVa prompts, active/candidate separation, and tenant browser coverage. The harness creates a proof bundle so Home is not called demo-ready merely because the page loads.

## Layer Impact

- `global-control-lane`: Adds shared Home smoke/content-quality scripts and report generation for all tenants.
- `module-context consumer`: Reads the existing Home module-context serving contract to compare Home-facing content against active tenant context.
- `QA/proof harness`: Produces deterministic JSON, Markdown, HTML, screenshot, and DOM indexes under `reports/home-smoke-quality/latest/`.

## Client Applicability

- All clients: all registry-active tenants are included in server/module-context proof.
- Specific clients: SkyHarbor Air, Meridian Health, Apex Retail, First Capital Financial, Lakeshore Holdings, and Lakeshore Industries are the initial audited tenant set.
- Internal only: the scripts and generated reports are operator proof artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `scripts/qa/home-full-smoke-quality.ts`.
- Adds `npm run smoke:home:full`.
- Adds `npm run audit:home:content-quality`.
- Adds `npm run qa:home:ava-quality`.
- Adds this release record.

## QA / Validation

- Pass: `npm run smoke:home:full` produced `0 P0 / 0 P1 / 30 P2` with watch items and proof output under `reports/home-smoke-quality/latest/`.
- Pass: `npm run audit:home:content-quality` produced `0 P0 / 0 P1 / 30 P2` with server/module-context proof across 6 tenants, 42 dimensions, and 210 tabs.
- Pass: `npm run qa:home:ava-quality` produced `0 P0 / 0 P1 / 30 P2` and tested 10 signed-in aVa prompts where storage states were available.
- Pass: `npm run audit:module-context-serving`.
- Pass: `npm run audit:active-candidate-separation`.
- Pass: `npm run audit:enterprise-naming`.
- Pass: `npm run audit:architecture-rules`.
- Pending: `npm run release:check` after this release-record format correction.
- Pending: `npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.

## Rollout Plan

Merge through PR only. If merged, the repo-owned ACA main deploy workflow may deploy the script/package metadata with the next main build. The change does not alter runtime Home behavior by itself.

## Deployment Authority

- Repo-owned deploy workflow: required for any production rollout after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for production Home smoke/aVa coverage when storage states are available.

## Rollback Plan

Revert this PR. Because this is a proof harness and npm-script addition, rollback does not require data rollback, tenant promotion rollback, or Active Tenant Access changes.

## Audit Evidence

- Local proof bundle: `reports/home-smoke-quality/latest/`.
- Required report files include `summary.md`, `tenant-results.json`, `page-tab-results.json`, `dimension-quality-scores.json`, `ava-home-quality-results.json`, `active-candidate-separation-results.json`, and `home-smoke-quality-control.html`.

## Known Gaps

- P2 watch items remain for old V-language appearing in served records; these are reported as wording/product-language cleanup, not active/candidate failures.
- Browser proof only runs for tenants with available signed-in storage states. Lakeshore Industries is server/module-context proof only until a dedicated automation persona exists.
