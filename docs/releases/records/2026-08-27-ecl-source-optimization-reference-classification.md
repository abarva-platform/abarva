# 2026-08-27-ecl-source-optimization-reference-classification — ECL Source Optimization Reference Classification

## Release ID

`2026-08-27-ecl-source-optimization-reference-classification`

## Status

`candidate`

## Plain-English Summary

Classifies three historical operator/proof scripts as retired-reference-only for legacy Source optimization and promotion-review objects. This lets the retired-layer cleanup gate distinguish old proof scaffolding from active product reads before any governed object retirement is attempted.

## Layer Impact

- Layer 4 product projections: no active ECL projection or serving view is changed.
- Retired legacy data plane: cleanup preflight can now treat the named historical script references as declared retired references when evaluating eligible object batches.

## Client Applicability

- All clients: applies only to shared platform cleanup governance.
- Specific clients: none.
- Internal only: release/status governance and cleanup evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updates `docs/architecture/ecl-retired-code-reference-manifest.json` with narrow historical classifications for legacy Source optimization and promotion-review scripts.

## QA / Validation

- Targeted static preflight passed for the next candidate Source optimization cleanup batch: 4 object targets, 0 active code references, 16 declared retired references, and status gate allowed.

## Rollout Plan

Merge to `main`, then allow the repo-owned ACA deploy workflow to publish the manifest change into the deployed image used by the private cleanup operator. No product route behavior changes.

## Deployment Authority

- Repo-owned deploy workflow: yes, to make the cleanup manifest available inside the private operator image.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned deploy workflow.
- ACA runtime invariant: required before follow-on cleanup apply proof.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert this PR to restore the prior cleanup reference classification. No data-plane object is removed by this PR.

## Audit Evidence

- Static proof artifact: `/tmp/ecl-cleanup-batch5-source-optimization-static-preflight/ecl-cleanup-batch5-source-optimization-static-preflight.json`

## Known Gaps

This release does not retire any object. It only prepares the governed cleanup gate for the next Source optimization object batch.
