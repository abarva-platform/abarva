# 2026-09-17 Source commitment-anniversary evidence

## Release ID

`2026-09-17-source-commit-anniversary-evidence`

## Status

`candidate`

## Plain-English Summary

An authored sourcing action now names the commitment anniversary established by its source rows. It no longer presents an unverified payment-authorization date as a contractual deadline. The package generator also retains its separate document page-text inventory when that inventory matches the evidence manifest.

## Layer Impact

- Release lane: `client-data-lane` (synthetic package only; no data write in this PR).
- Layer 1: A synthetic intake opportunity row and its workbook have corrected action and timing wording. No underlying contract amount or date changes.
- Layer 2/3/4: No Azure rows are modified by this release. A separately governed reload would be required to propagate the corrected source row through the adapters, canonical objects, and read models.

## Client Applicability

- All clients: No.
- Specific clients: Only the synthetic demo package if its governed data-build job is later approved and run.
- Internal only: Package builder and regression test.
- Public/demo only: The synthetic evidence package is not live-client truth.
- Feature flag: None.

## Changes Included

- The source package builder, regenerated opportunity CSV, workbook, package manifest, workbook previews, and focused regression test.
- No migrations, route changes, security changes, or Azure data-plane writes.

## QA / Validation

- Focused package loader tests: 11 passed, including an anniversary regression demonstrated red then green.
- Plan-mode loader quality gate: PASS; 169 expected adapter rows, six opportunities, six page-text rows, no data writes.
- Scoped ESLint, TypeScript no-emit, and diff whitespace checks: PASS.
- Workbook lever preview inspected for legibility; source anniversary and generated action agree.

## Rollout Plan

Merge the source-package correction through the protected PR lane. The repo-owned ACA deployment may update the runtime image, but it does not reload the synthetic package. Before any separate data job, perform the scoped rewrite-safety check against action and review records. Run only a named, tenant-scoped ACA Job with a pinned digest, idempotency key, proof bundle, quality gate, Layer 2/3/4 readback, and human review. Do not activate the corrected opportunity if the guard fails.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this change.
- Approved image digest: Determined by that workflow after merge.
- ACA runtime invariant: Required if merged and deployed.
- Worker image invariant: Required if merged and deployed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after any governed data reload.

## Rollback Plan

The source-package candidate can be reverted by PR before a data job. If a governed reload has run, stop activation and use its recorded prior dataset/read-model version and proof bundle for an operator-reviewed rollback; do not directly edit canonical rows.

## Audit Evidence

PR checks, the plan-mode summary, generated workbook/preview, package manifest checksum, and any later ACA job proof bundle and signed-in acceptance record.

## Known Gaps

The loaded Azure opportunity remains unchanged until the separate data build passes the rewrite-safety gate and readback. Signed-in contract and aVa acceptance is pending.
