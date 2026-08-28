# 2026-08-28-tower-ecl-proof-surface-alignment — Tower ECL proof surface alignment

## Release ID

`2026-08-28-tower-ecl-proof-surface-alignment`

## Status

`candidate`

## Plain-English Summary

Tower now exposes the same user-facing ECL proof contract that the browser smoke expects. The
supporting diagnostics list the full Tower serving-surface set, show demo-finding evidence on the
Tower route, and avoid rendering raw backing-table names as operator-facing provenance.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Tower route composition and supporting proof diagnostics only.
- Data layers: no tenant intake, adapter, canonical object, serving-row, or chat data is changed.

## Client Applicability

- All clients using the ECL Tower serving path.
- Specific clients: none.
- Internal only: local validation and release proof.
- Public/demo only: none.
- Feature flag: existing ECL provider routing only.

## Changes Included

- Adds Tower demo-finding proof cards to the Tower ECL route when the ECL provider is active.
- Expands Tower serving-surface diagnostics to include Decision Lanes, Evidence, and Recommended
  Actions alongside the existing Tower surfaces.
- Replaces raw backing-view provenance text with operator-facing governed-evidence wording.
- Updates Tower-focused regression tests for the public proof-surface contract.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/tower/__tests__/tower-freshness-provenance.test.ts src/lib/tower/__tests__/readTowerCommandCenter.test.ts --runInBand`.
- Pass: `node scripts/ecl/run_product_ecl_predeploy_gate.mjs`.

## Rollout Plan

Merge by PR. The route and diagnostic changes become active through the repo-owned Azure Container
Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required after deployment before making live-product claims.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the ECL Tower route after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data
rollback is required because this release does not write tenant data.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI run: to be added after PR creation.
- ACA revision and digest: to be captured after merge/deploy.
- Signed-in browser proof: to be captured after deployment.

## Known Gaps

This release does not change Tower's underlying serving rows or run live aVa prompts.
