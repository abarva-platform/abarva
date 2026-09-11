# 2026-09-11-source-ava-lever-rationale-context — Source aVa Lever Rationale Context

## Release ID

`2026-09-11-source-ava-lever-rationale-context`

## Status

`candidate`

## Plain-English Summary

Source aVa contract-optimization export answers now receive the same lever detail that the Contract 360 Optimize table renders. The selected contract ID is carried on optimization opportunity rows, and fallback action rows include the buyer ask, negotiation language, vendor rationale, timing, priority, and risk details when those reviewed fields are loaded.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 — Products: Source view-model and deterministic aVa export-answer context are widened so the live answer path can produce a client-ready lever table from the selected contract context.

No Layer 1 intake, Layer 2 adapter, Layer 3 canonical model, migration, seed, or tenant-data mutation is included.

## Client Applicability

- All clients: Yes, for Source Contract 360 optimization answers using the governed Source workspace context.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route/provider gates only.

## Changes Included

- Source view-model now includes `contractId` on optimization opportunity rows passed to aVa.
- Source view-model mirrors reviewed negotiation detail into the action-candidate fallback directory.
- Deterministic Source aVa export answers read negotiation detail from fallback rows when the rich opportunity row is unavailable.
- Behavioral tests cover opaque opportunity IDs and prove the aVa context carries buyer ask and vendor rationale.

## QA / Validation

- Pass — `npm test -- --runTestsByPath 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' --runInBand`
- Pass — `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand`
- Pass — `npx eslint src/lib/source/ava/source-workspace-visual-answer.ts 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'`
- Pass — `npx tsc --noEmit --pretty false`
- Pending — release check after this record update.
- Pending — PR, ACA deployment, runtime invariant, and signed-in Source/aVa proof after merge.

## Rollout Plan

Merge through pull request, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the approved main image. No migration, private VNet data-build job, or contract-data refresh is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Contract 360 aVa optimization export answer.

## Rollback Plan

Revert the product-surface commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this only changes the in-memory page context and deterministic aVa export-answer path.

## Audit Evidence

Pull request, focused Jest output, ESLint output, TypeScript output, release-check output, ACA deployment summary, runtime invariant output, and signed-in Source/aVa export-answer smoke evidence.

## Known Gaps

This release does not reload, parse, or enrich contract data. Richer contract facts, archetype backfills, and evidence-derived narrative objects still require a governed data-build job.
