# 2026-10-06 — Move evidence client key repair

## Release ID

`2026-10-06-moves-program-evidence-key-repair`

## Status

`candidate`

## Plain-English Summary

The Move evidence loader now derives the product client key from the authenticated Move registry for evidence and review rows. A scoped operator job corrects the tenant key on one previously loaded synthetic source set. Its preflight requires the exact Move, source hash, eleven pending families, and twenty-two deterministic row IDs before any update.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 3 canonical model: canonical tenant identity remains the governed-object policy key. The correction updates only the product evidence and review row tenant keys for the approved synthetic source set.
- Layer 4 product projection: the existing cabinet can query those rows using its authenticated app client key. No product route or display logic changes.

## Client Applicability

- All clients: no automatic data mutation.
- Specific clients: one synthetic demo Move identified by the repair authorization and source hash.
- Internal only: the operator job and proof bundle.
- Public/demo only: synthetic evidence already loaded for the smoke test.
- Feature flag: none.

## Changes Included

The existing loader's row and binding key selection, manifest explanatory note, exact repair authorization, re-key operator job, package command, and this record.

## QA / Validation

PASS: TypeScript, lint, manifest validation, source-set hash check, and release gate. NOT RUN: the live job and signed-in cabinet refresh until the merged image is available. The live job must prove the exact preflight, eleven evidence updates, eleven review updates, one pending item per required family, unchanged phase, and an independent post-commit readback.

## Rollout Plan

Merge through a PR. The repository-owned ACA main workflow builds and deploys a pinned image. Verify the web and required worker image invariant, then run the private ACA operator job with that image and the exact repair authorization. Refresh the signed-in cabinet after the job passes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only the repository-owned main workflow.
- Approved image digest: record from the main deploy before job execution.
- ACA runtime invariant: verify template, traffic revision, and required workers.
- Worker image invariant: the operator job uses the pinned digest and restores its idle template.
- Feature/env flag update path: none.
- Live signed-in proof required: cabinet pending-review count and visible review controls.

## Rollback Plan

The job is idempotent on a verified fully repaired source set. A reversal requires a separate scoped authorization and operator job; do not delete or reclassify the evidence. If validation fails, keep rows pending and preserve the failure proof.

## Audit Evidence

The PR and merge commit, exact repair authorization, ACA execution ID and logs, Blob progress/validation/quality-gate/proof objects, database readback, and signed-in cabinet screenshot.

## Known Gaps

These records remain pending and unindexed until a separate authorized review and retrieval check. No phase approval or advancement is part of this repair.
