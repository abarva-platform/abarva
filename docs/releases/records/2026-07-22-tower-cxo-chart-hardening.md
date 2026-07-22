# 2026-07-22-tower-cxo-chart-hardening — Tower CXO Chart Hardening

## Release ID

`2026-07-22-tower-cxo-chart-hardening`

## Status

`candidate`

## Plain-English Summary

Tower's Meridian CXO command center now keeps the value-funnel and portfolio charts readable after the V3 mart refresh. The change prevents Recharts from mounting with invalid transient dimensions and gives the value-funnel chart enough right-side room for large labels such as approved program funding.

## Layer Impact

- `global-control-lane` / UI rendering layer: hardens Tower's native Recharts exhibits without changing mart data, formulas, tenant selection, or evidence lineage.
- `client-data-lane`: no data writes, schema changes, or mart projection changes.

## Client Applicability

- All clients: Tower chart rendering behavior is shared.
- Specific clients: Meridian / Healthcare Demo was the proof tenant for the refreshed Tower mart.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
  - Added minimum Recharts container dimensions for Tower budget, value-funnel, and AI-portfolio charts.
  - Increased the value-funnel chart's right margin so large value labels do not clip.

## QA / Validation

- `npm test -- src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx --runInBand`
  - Passed: 4 suites, 47 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
  - Passed.
- `npx eslint src/components/tower/TowerIndexPage.tsx`
  - 0 errors. Existing unused-symbol warnings remain in the large Tower component and are not introduced by this change.
- Local Meridian mart dry-run:
  - `npm run project:tower-mart -- --tenant meridian-health --v3-dir datasets/tenant-inputs/meridian-health/standard-2026-07-v3 --no-db --out-dir /tmp/tower-mart-local-proof-20260722-2`
  - Passed with $650.0M budget, $53.7M AI-tagged lens, $35.5M promised value, $3.8M finance-validated value, $0 realized/claimable value, 243 candidate AI opportunities, 255 AI portfolio rows, and 12 decision-lane rows.

## Rollout Plan

Merge to `main` through the protected PR lane. The repo-owned Azure Container Apps main deploy workflow will build and deploy the digest-pinned web image. After deploy, run the ACA runtime invariant and signed-in Meridian Tower browser proof.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: captured by ACA main deploy after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Meridian / Healthcare Demo Tower.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. No database rollback is required.

## Audit Evidence

- Pre-PR browser proof of current Tower mart state:
  - `/tmp/tower-cxo-finish-browser-proof-20260722/tower-command-center.png`
  - `/tmp/tower-cxo-finish-browser-proof-20260722/tower-value-proof-funnel.png`
  - `/tmp/tower-cxo-finish-browser-proof-20260722/tower-decision-lanes.png`
  - `/tmp/tower-cxo-finish-browser-proof-20260722/tower-ai-portfolio.png`
  - `/tmp/tower-cxo-finish-browser-proof-20260722/proof.json`
- ACA invariant proof:
  - `/tmp/tower-cxo-finish-aca-invariant-final-20260722`

## Known Gaps

- This PR does not load live Copilot, ServiceNow, Workday/SAP, GitHub/Codex, or DORA telemetry. The current proof has `tower_facts=0`; usage and value evidence comes from V3 source templates and the SA08 benefits/value ledger until tool-feed ingestion is run.
- The Tower mart reads the first 80 AI portfolio rows for the visible browser view while the mart contains 255 rows. Candidate opportunity count remains displayed separately as 243.
