# 2026-07-23-tower-cxo-visual-quality — Tower CXO Visual Quality Pass

## Release ID

`2026-07-23-tower-cxo-visual-quality`

## Status

`candidate`

## Plain-English Summary

This release improves the Tower command center visual experience so the AI Portfolio and Evidence views read like executive decision exhibits instead of raw/debug dashboards. The AI Portfolio now uses stable, numbered Recharts visuals with an adjacent category spend lens and a clearer watchlist. Evidence now leads with business questions — what exists, what is missing, who provides it, and what stays blocked — while preserving raw lineage as audit backup.

## Layer Impact

- Product UI / Tower: Updates the Tower command center rendering for the mart-backed Tower view.
- Data rendering: Uses existing `TowerMartCommandViewModel` data only; no new facts, no synthetic fallbacks, and no data-plane writes.
- Evidence posture: Reframes existing evidence lineage and required-field gaps into CXO-readable summaries while keeping source traceability visible.

## Client Applicability

- All clients: Applies wherever the mart-backed Tower command center is rendered.
- Specific clients: Healthcare/Meridian is the immediate proof target because it has the refreshed Tower mart.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/components/tower/TowerCommandCenterContract.tsx`
  - Replaced fragile responsive chart sizing with a safe measured chart frame.
  - Improved AI Portfolio matrix labels, collision handling, watchlist text, and category spend chart.
  - Cleaned AI Portfolio watchlist copy so candidate rows are grouped by business lens instead of leaking generic owner labels such as "Application Owners / Business Applications."
  - Added a candidate-portfolio mix fallback for the AI category bars when spend categories are not populated, so the view remains useful without inventing spend.
  - Reworked Evidence into executive posture cards plus source-package and audit-trace sections.
  - Cleaned Evidence audit-trace labels and planning-grade caveats so the trace remains inspectable without exposing generic owner labels as CXO-facing copy.

## QA / Validation

- `npx eslint src/components/tower/TowerCommandCenterContract.tsx src/components/tower/TowerIndexPage.tsx` passed with no errors. Existing unused-symbol warnings remain in `TowerIndexPage.tsx`.
- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed: 17/17 tests.
- Cleanup validation: `npx eslint src/components/tower/TowerCommandCenterContract.tsx`, `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`, and `git diff --check` passed after the AI Portfolio copy/mix cleanup.
- Evidence trace cleanup validation: `npx eslint src/components/tower/TowerCommandCenterContract.tsx`, `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`, and `git diff --check` passed after the audit-trace label cleanup.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` was attempted; it fails on pre-existing Home dependency errors for `@xyflow/react` and `@dagrejs/dagre`, not on this Tower slice.
- Post-merge validation required: ACA runtime invariant plus signed-in Healthcare/Meridian Tower browser proof across Command Center, Value Proof Funnel, Decision Lanes, AI Portfolio, Recommended Actions, and Evidence.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the image to `ca-abarva-web-lab-eastus`, then signed-in browser proof validates the live Tower experience.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Not changed by this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Healthcare/Meridian Tower.

## Rollback Plan

Revert the PR and allow the repo-owned ACA deploy workflow to publish the previous Tower command center rendering. No database rollback is required because this is presentation-only.

## Audit Evidence

- Pull request URL: pending.
- Focused lint/test output from local candidate branch.
- ACA revision, image digest, health, and traffic proof after merge/deploy.
- Signed-in browser screenshots after deploy.

## Known Gaps

- This release does not ingest telemetry, refresh the Tower mart, or change any source-of-truth data tables.
- Full TypeScript check is currently blocked by pre-existing Home visualization dependency errors unrelated to this Tower change.
