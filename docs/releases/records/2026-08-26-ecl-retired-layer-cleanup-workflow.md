# 2026-08-26-ecl-retired-layer-cleanup-workflow - ECL Retired-Layer Cleanup Workflow

## Release ID

`2026-08-26-ecl-retired-layer-cleanup-workflow`

## Status

`candidate`

## Plain-English Summary

Adds a repo-owned workflow for the ECL legacy cleanup lane. The workflow runs the retired-layer static preflight, resolves the currently deployed digest-pinned ACA image, and then runs the cleanup operator through the approved private ACA job path.

## Layer Impact

- Affected lane: L-CLEANUP.
- Layer 1 CLIENT INTAKE: no change.
- Layer 2 SOURCE ADAPTERS: no change.
- Layer 3 CANONICAL MODEL: no schema or data change.
- Layer 4 PRODUCTS: no route or product behavior change.
- Operations: adds a controlled dry-run/apply dispatch path for L-CLEANUP retired data-layer proof.

## Client Applicability

- All clients: no direct runtime behavior change.
- Specific clients: none.
- Internal only: ECL cleanup operators.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `.github/workflows/ecl-retired-layer-cleanup.yml`: manual dispatch workflow for retired-layer cleanup dry-run/apply through `npm run ops:aca-job`.

## QA / Validation

- PASS: workflow static assertions for dispatch, confirmation guard, and database secret reference.
- PASS: `npm run ops:aca-job -- --self-test`
- PASS: `git diff --check`
- PENDING: workflow syntax validation through PR checks.
- PENDING: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through PR only. After merge, run workflow dispatch in `dry_run` mode for `source_registry` first. Apply remains limited to `source_registry` and requires the exact confirmation string `APPLY_SOURCE_REGISTRY`.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: resolved at workflow runtime before operator execution.
- ACA runtime invariant: the operator wrapper restores the private operator job to idle and records proof.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the workflow PR. No data rollback is required unless a later apply workflow run is explicitly executed and accepted.

## Audit Evidence

- Workflow: `.github/workflows/ecl-retired-layer-cleanup.yml`
- Operator script: `scripts/ops/purge-retired-data-layers.mjs`
- Preflight proof is uploaded by each workflow run as `ecl-retired-layer-cleanup`.

## Known Gaps

This release does not itself retire legacy assets. It creates the governed execution path for dry-run and explicitly gated apply.
