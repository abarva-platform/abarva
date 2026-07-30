# 2026-07-30-airline-rowref-live-source-fix — Airline Row Identity Readback Fix

## Release ID

`2026-07-30-airline-rowref-live-source-fix`

## Status

`candidate`

## Plain-English Summary

Fixes a read-only reconciliation verifier so source rows hydrated from the live source registry can match evidence rows using the live source and source-version references produced by file reconciliation. This prevents the verifier from reporting source rows as missing when matching evidence rows already exist.

## Layer Impact

- `client-data-lane`: Updates the Airline live readback verifier used to certify source-row evidence lineage. No tenant data, review decisions, publications, baselines, projections, product providers, or runtime data are changed.

## Client Applicability

- All clients: No.
- Specific clients: Airline governed proof lane only.
- Internal only: Yes, verifier and release evidence.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`

## QA / Validation

- Pass: `node --check scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- Pass: focused knowledge-process executor regression.
- Pending: CI, deploy, and VNet readback after merge.

## Rollout Plan

Merge to `main` through PR, deploy through the repo-owned ACA main deploy workflow, then rerun the read-only Airline VNet reconciliation job. This release does not authorize data mutation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the deploy workflow.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: no, VNet readback proof required.

## Rollback Plan

Revert the verifier change and redeploy the prior image if the readback diagnostic regresses. No data rollback is required because this is read-only verifier logic.

## Audit Evidence

- PR, CI checks, deployed revision/digest, and VNet readback job logs after merge.

## Known Gaps

- The existing live corpus is not certified through Cube until all variance gates close and Cube parity passes.
- Offline augmentation remains out of scope for this release.
