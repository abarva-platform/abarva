# 2026-08-29-tower-ecl-serving-route-binding — Tower ECL Serving Route Binding

## Release ID

`2026-08-29-tower-ecl-serving-route-binding`

## Status

`candidate`

## Plain-English Summary

Tower now reads the governed ECL serving model directly on the primary route. The visible page no
longer prefers the older CIO mart reader ahead of the ECL serving reader, so refreshed Layer 4
serving rows can drive the Command Center without being masked by an older read path.

The ECL reader also treats freshness fields as source data. If the serving summary row does not
carry an as-of period or refresh timestamp, Tower reports the gap instead of substituting a frozen
date.

## Layer Impact

Layer 4 — Products. Lane: `global-control-lane`.

`/tower` changes its read-path binding so the product projection reads the ECL serving substrate
directly. Presentation behavior is unchanged except for using source-recorded freshness when
present and an explicit gap when absent.

## Client Applicability

- All clients: yes, all signed-in Tower users on the shared route receive the read-path binding.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/tower/page.tsx`: removes the older mart-first fallback from the visible Tower
  route and reads `readTowerCommandCenter` directly.
- `src/lib/tower/readTowerCommandCenter.ts`: maps `as_of_period` and `refresh_timestamp` from the
  ECL serving summary row instead of hardcoding freshness.
- Tower invariant and reader tests covering the route binding and freshness behavior.

## QA / Validation

- PASS: `npx jest src/__tests__/integration/tower/tower-invariants.test.ts src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/__tests__/tower-freshness-provenance.test.ts --runInBand`

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the
exact merged SHA image, then verifies the ACA runtime invariant and production health endpoint.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only
- Approved image digest: assigned by the workflow after merge
- ACA runtime invariant: required before claiming live
- Worker image invariant: required before claiming live
- Feature/env flag update path: none
- Live signed-in proof required: yes, `/tower` should show the ECL serving dataset rather than the
  older mart dataset after deploy

## Rollback Plan

Revert this PR and allow the main deploy workflow to publish the prior route binding. No schema or
data-plane rollback is required.

## Audit Evidence

- PR URL and CI checks.
- ACA main deploy run for the merged SHA.
- Post-deploy health endpoint response.
- Signed-in `/tower` proof after the deploy.

## Known Gaps

The new mechanical Command Center panels remain component-level only until a separate route wiring
change mounts them in the tab shell.
