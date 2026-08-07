# 2026-08-07-source-golden-contract-evidence-job — Source Golden Contract Evidence Job

## Release ID

`2026-08-07-source-golden-contract-evidence-job`

## Status

`candidate`

## Plain-English Summary

Adds an idempotent operator job script that loads a clearly marked synthetic canary evidence pack for one contract optimization path. The evidence is shaped like real source-system extracts and reconciles the four ledgers separately: recoverable leakage, avoided cost, negotiated improvement, and realized value. It is not client truth; it is a governed canary used to prove that the product can show a complete, evidence-backed decision story when the required source data exists.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake/source adapters: Adds source-system-shaped raw rows for the canary dataset only when the operator job is explicitly run.
- Source read models: Extends the Source V4 reader so unapproved rate-card variance contributes dollars to recoverable leakage.
- Tower handoff: Upserts one finance-validated Tower value claim for the canary contract so realized value remains gated by Tower.
- Products: Contract 360 can render a populated four-ledger evidence story where this canary evidence exists.

## Client Applicability

- All clients: The reader behavior is shared and tenant-agnostic.
- Specific clients: The included operator job defaults to the SkyHarbor canary dataset and can be overridden by explicit tenant/contract parameters.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace availability still controls route exposure.

## Changes Included

- Adds `scripts/source/load-source-golden-contract-evidence.mjs`.
- Adds npm scripts `source:contract-evidence:golden:plan` and `source:contract-evidence:golden:apply`.
- Updates the Source V4 read adapter to sum unapproved rate-card variance dollars.
- Adds a focused regression test for quantified rate-card variance.
- Refreshes the control-plane tenant-purity baseline to the current scanner count after unrelated tenant-name debt moved across terms; total allowed references drops from 1063 to 939.

## QA / Validation

- `npm run source:contract-evidence:golden:plan` passed locally and emitted the expected non-mutating plan.
- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.test.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-360-view.test.ts --runInBand` passed.
- `npx eslint scripts/source/load-source-golden-contract-evidence.mjs src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.test.ts` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` passed.
- `npm run audit:control-plane-purity:check` passed after baseline refresh; total baseline decreased from 1063 to 939.
- Live operator-job apply and browser proof are required after deployment before this release can be called live-proven.

## Rollout Plan

Merge to main through PR. The repo-owned Azure Container Apps deploy workflow builds and deploys the exact merged image. After the image is deployed and the ACA runtime invariant passes, run the new npm script through the ACA operator job with a digest-pinned image. The job must reconcile exact ledger values before committing.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime activation.
- Shared runtime mutators: The web runtime must not be mutated directly.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: The ACA operator job must use the same approved digest-pinned image.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Contract 360 must show the golden contract as populated while contracts without evidence remain explicitly incomplete.

## Rollback Plan

Code rollback is a PR revert followed by the repo-owned ACA deploy workflow. Data rollback is rerunning the operator job with the same dataset id after adding a delete-only mode, or manually deleting only rows with `_dataset_id = 'skyharbor-source-v4-202608-golden-evidence'` and the matching Tower claim under an approved data-operations change. No broad tenant deletion is required.

## Audit Evidence

- PR URL after creation.
- Deploy workflow run after merge.
- ACA operator job proof bundle after apply.
- Source Contract 360 signed-in browser proof after the job.

## Known Gaps

The job proves one canary contract story. It does not replace the broader need for richer source-system extracts across the full portfolio.
