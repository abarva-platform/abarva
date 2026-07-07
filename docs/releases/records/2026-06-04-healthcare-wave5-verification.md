# 2026-06-04-healthcare-wave5-verification — Healthcare Estimation + RFP Verification

## Release ID

`2026-06-04-healthcare-wave5-verification`

## Status

`candidate`

## Plain-English Summary

This release adds the fifth healthcare hardening wave: a deterministic verification packet for two cross-cutting executive questions that the corpus must support after governed loading.

The wave adds no corpus rows. It verifies that the authored Wave 1-4 evidence can support a healthcare modernization effort estimate with P50/P80/P95 bands and a sourcing answer that normalizes three SI bids against the seven Lakehouse pillars.

## Layer Impact

- `global-control-lane`: Adds deterministic Wave 5 verification evidence, checkpoint reporting, and a focused Jest contract.
- `client-data-lane`: No production data mutation and no new corpus rows. Live retrieval remains deferred until authenticated governed admin upload commits the Wave 1-4 packs.

## Client Applicability

- All clients: The verification method is reusable for healthcare modernization and sourcing questions after governed upload.
- Specific clients: Meridian Health is the primary healthcare demo target, but no tenant-specific Meridian facts are added in this wave.
- Internal only: Generator, report artifacts, and tests are internal release evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `scripts/corpus/generated/healthcare-wave5-verification/generate-healthcare-wave5-verification.mjs`.
- Adds `scripts/corpus/generated/healthcare-wave5-verification/__tests__/wave5-verification.test.ts`.
- Adds Wave 5 run evidence under `reports/healthcare-harden/wave-5/`.
- Adds cross-wave eval summary under `reports/healthcare-harden/eval/SUMMARY.md`.

## QA / Validation

- `node scripts/corpus/generated/healthcare-wave5-verification/generate-healthcare-wave5-verification.mjs` — pass.
- `npx jest scripts/corpus/generated/healthcare-wave5-verification/__tests__/wave5-verification.test.ts --runInBand` — pass.
- `npx eslint scripts/corpus/generated/healthcare-wave5-verification/generate-healthcare-wave5-verification.mjs scripts/corpus/generated/healthcare-wave5-verification/__tests__/wave5-verification.test.ts` — pass.
- `npx tsc --noEmit --pretty false` — pass.
- `npm run release:check -- --base origin/main --head HEAD` — pass.
- `git diff --check` — pass.

## Rollout Plan

Merge the candidate PR to main and deploy the app normally. This ships verification evidence only; it does not commit corpus data. Live retrieval eval should run after authenticated admin upload of the Wave 1-4 corpus packs.

## Rollback Plan

Revert the PR to remove the Wave 5 generator, tests, and evidence. No production data rollback is required because no corpus rows or schema changes are introduced.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment URL: pending.
- Local verification summary: `reports/healthcare-harden/wave-5/SUMMARY.md`.
- Local checkpoint: `reports/healthcare-harden/wave-5/checkpoint.json`.
- Cross-wave eval summary: `reports/healthcare-harden/eval/SUMMARY.md`.

## Known Gaps

- Live retrieval is not claimed in this wave because the corpus packs have not been committed through the governed admin loader in this run.
- This is not a `RETRIEVAL_DISCONNECT`; it is explicitly marked `DEFERRED_PENDING_GOVERNED_UPLOAD`.
