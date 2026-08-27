# 2026-08-27-ecl-retired-reference-manifest-batch4 - Retired Reference Manifest Narrows Cleanup Blockers

## Release ID

`2026-08-27-ecl-retired-reference-manifest-batch4`

## Status

`candidate`

## Plain-English Summary

This release separates historical script references from active product/runtime dependencies in the ECL legacy-cleanup lane. It lets the cleanup preflight identify a smaller set of object-level candidates that can safely move to governed dry-run proof without treating old QA or proof scripts as live consumers.

## Layer Impact

- Operations/proof: expands the retired code-reference manifest used by the cleanup preflight.
- Data-plane cleanup: updates the purge gate vocabulary so the current archive-only retirement status is treated as eligible for proof.
- Product runtime: no behavior change and no route/provider change.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: ECL cleanup tracking, validation, and operator proof readiness.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/architecture/ecl-retired-code-reference-manifest.json`: declares additional historical QA, proof, tenant-specific, and pre-ECL operator script references.
- `scripts/ops/purge-retired-data-layers.mjs`: accepts `RETIRED_ARCHIVE_ONLY` as an apply-safe status for object/schema retirement gates.

## QA / Validation

- PASS: `node -e "JSON.parse(require('fs').readFileSync('docs/architecture/ecl-retired-code-reference-manifest.json','utf8')); console.log('manifest json ok')"`
- PASS: `node scripts/ops/purge-retired-data-layers.mjs --self-test`
- PASS: `node --check scripts/ops/purge-retired-data-layers.mjs`
- PASS: object-level static preflight on the next 28 cleanup candidates: 0 active code references, 91 declared-retired references, status gate allowed.

## Rollout Plan

Merge through PR only. If the standard repo-owned ACA deploy workflow runs after merge, allow it to publish a digest-pinned image containing the updated operator manifest and safe-status vocabulary. After that image is live, the governed cleanup workflow may use it for dry-run proof before any apply.

## Deployment Authority

- Repo-owned deploy workflow: allowed after merge so the cleanup operator image contains this manifest update.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: required if the repo-owned deploy workflow runs.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert this PR. The cleanup lane returns to treating these historical references as active blockers; no data rollback is required because this release performs no data mutation.

## Audit Evidence

- Local static proof: `/tmp/ecl-cleanup-batch4-28-static-preflight/ecl-cleanup-batch4-28-static-preflight.json`
- Manifest: `docs/architecture/ecl-retired-code-reference-manifest.json`
- Operator: `scripts/ops/purge-retired-data-layers.mjs`

## Known Gaps

No data-plane objects are retired by this PR. The remaining cleanup candidates still require governed dry-run, apply, and post-apply readback before the L-CLEANUP numerator moves.
