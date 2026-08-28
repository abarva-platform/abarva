# 2026-08-28 Tower Demo Data Sanity

## Release ID

`2026-08-28-tower-demo-data-sanity`

## Status

`candidate`

## Plain-English Summary

Tower now keeps value-claim counts, review-queue counts, AI portfolio lenses, and per-review navigation distinct. The change removes misleading zero-value phrasing, prevents multiple review buttons from opening the same detail panel, and adds a simple full portfolio table for AI initiatives and tools.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Updates the Tower command-center presentation and client-side interactions only.

Layer 3 Canonical Model: No canonical data model, loader, adapter, migration, or tenant data changes.

## Client Applicability

All clients: Yes, for tenants using the Tower command-center v2 surface.

Specific clients: None.

Internal only: No.

Public/demo only: No.

Feature flag: Existing Tower command-center availability applies.

## Changes Included

- Tower command-center tab and drawer wiring.
- Tower AI Portfolio tab lens controls and all-tools table.
- Tower value proof labels and trajectory rendering from loaded trajectory rows only.
- Tower ECL reader claim-count derivation.
- Focused Tower component and reader regression tests.

## QA / Validation

- `node scripts/tower/fact-lineage-report.mjs` was run before quoting Tower numbers.
- `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/lib/tower/__tests__/readTowerCommandCenter.test.ts --runInBand` passed.
- `node scripts/tower/audit-tower-demo-story-data.mjs` passed for the packaged demo-story source package.
- `node scripts/tower/tower-data-trust-gate.mjs --out-dir /tmp/tower-data-trust-gate-demo-fix` ran as a read-only local source availability check. The clean worktree lacked most tenant source directories, so this result is not production data-plane proof.

## Rollout Plan

Merge to main through PR review, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the new digest-pinned web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be recorded after the main deploy workflow completes.
- ACA runtime invariant: Must be verified after deployment.
- Worker image invariant: Must be verified after deployment if worker images are reported by the runbook.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower route with populated tenant data.

## Rollback Plan

Revert the PR or redeploy the previous healthy digest through the approved Azure Container Apps deployment path.

## Audit Evidence

PR URL, merge commit, deployment workflow run, focused Jest output, release check output, ACA revision/digest proof, and signed-in Tower browser proof.

## Known Gaps

No production database mutation or source-data repair is included. A separate source/data-quality workstream is required if the live data-plane audit shows thin or synthetic distributions.
