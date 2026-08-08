# 2026-08-08-source-contract-pdf-intelligence — Source Contract PDF Intelligence

## Release ID

`2026-08-08-source-contract-pdf-intelligence`

## Status

`candidate`

## Plain-English Summary

Adds a synthetic two-contract Source evidence package with real contract-style PDFs, line-level commercial evidence, parser instructions, reconciliation checks, and a single operator script that loads both structured extracts and PDF clause intelligence into the governed Source/document layers. Contract 360 can then use the same four-ledger evidence contract for recoverable leakage, avoided cost, negotiated improvement, and finance-confirmed realized value.

## Layer Impact

- Release lanes: `client-data-lane`, `global-control-lane`.
- Client intake: Adds source-system-shaped templates, extraction instructions, parser mapping, and synthetic evidence files for two canary contracts.
- Source adapters: Extends the golden evidence operator so every package CSV is persisted as a source table and every PDF is persisted through `doc.file`, `doc.page`, `doc.span`, and `doc.extraction`.
- Canonical model: Keeps mapped contract PDFs tied to current contract IDs and keeps supplemental prior PDFs unmapped until reviewed, preventing portfolio-total contamination.
- Products: Updates Source Contract 360 evidence reads to prefer loaded golden evidence when present and otherwise fall back to existing tenant-agnostic evidence classes.

## Client Applicability

- All clients: Shared Source optimization read model and evidence-class behavior.
- Specific clients: Synthetic canary package is scoped to the canonical airline demo tenant only.
- Internal only: Operator execution and reconciliation proof.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `datasets/source/contract-intelligence/skyharbor-golden-20260808/**`
- `scripts/source/load-source-golden-contract-evidence.mjs`
- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/types.ts`
- `src/lib/home/readSkyHarborAiSuccessHome.ts`

## QA / Validation

- `npm run source:contract-evidence:golden:plan` passed, reporting 18 package CSV tables, 1,752 source rows, 5 PDFs, 379 pages, 934 document extractions, 2 mapped golden PDFs, 3 supplemental prior PDFs, and 2 Tower value claims.
- `npx eslint scripts/source/load-source-golden-contract-evidence.mjs src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/types.ts src/lib/home/readSkyHarborAiSuccessHome.ts` passed.
- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-360-view.test.ts --runInBand` passed.
- `npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge to main, allow the repo-owned Azure Container Apps deploy workflow to build and deploy the web image, then run the Source golden evidence operator script through the ACA operator job using the deployed digest. Do not run this as a web request or ad-hoc local database mutation.

## Deployment Authority

- Repo-owned deploy workflow: Required for web/runtime code.
- Shared runtime mutators: Not used by this PR.
- Approved image digest: To be captured after the main deploy workflow completes.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Operator job must use the deployed digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Contract 360 for both canary contracts plus evidence/readback checks.

## Rollback Plan

Revert the PR and redeploy the prior ACA image. The operator load is dataset-scoped by `_dataset_id` and deterministic document/extraction IDs; rerun the operator with a cleanup-only follow-up if product rollback also requires removing canary evidence rows.

## Audit Evidence

- PR URL and merge commit.
- ACA deploy digest and runtime invariant.
- ACA operator job log containing `source_contract_golden_evidence_loaded`.
- Live readback counts for source package tables and `doc.*`.
- Signed-in browser proof for both canary contracts.

## Known Gaps

The package is synthetic canary evidence, not client fact. Supplemental prior PDFs are intentionally processed but not mapped into current portfolio rollups until reviewed.
