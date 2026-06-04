# 2026-06-04-healthcare-wave6-meridian-overlay — Meridian Healthcare Tenant Overlay

## Release ID

`2026-06-04-healthcare-wave6-meridian-overlay`

## Status

`candidate`

## Plain-English Summary

This release adds the sixth healthcare hardening wave: 300 Meridian-specific overlay patterns that connect the global healthcare modernization, CDAO, and CPO corpus to Meridian's tenant context.

It also corrects the Meridian profile used by this corpus lane. Meridian is represented as a Sacramento-based integrated health system with a 30+ hospital footprint. The prior 14-hospital composite profile is removed from the active tenant portfolio seed.

## Layer Impact

- `client-data-lane`: Adds import-ready, Meridian-scoped corpus JSONL artifacts and corrects the local Meridian portfolio profile used to generate tenant overlays.
- `global-control-lane`: Adds deterministic generator, reports, final readiness evidence, and tests. No runtime application behavior changes are introduced.

## Client Applicability

- All clients: No production data or runtime behavior changes until governed upload is performed.
- Specific clients: Meridian Health is the only tenant targeted by the generated overlay patterns.
- Internal only: Generator, report artifacts, final readiness report, and tests are internal release evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updates `intelligence/seeds/tenant-portfolios/meridian.json` to the corrected Sacramento-based 30+ hospital profile.
- Adds `scripts/corpus/generated/healthcare-meridian-wave6/generate-healthcare-meridian-wave6.mjs`.
- Adds six Meridian overlay JSONL upload batches under `scripts/corpus/generated/healthcare-meridian-wave6/`.
- Adds Wave 6 report artifacts under `reports/healthcare-harden/wave-6/`.
- Adds `reports/healthcare-harden/MODERNIZATION_HARDENING_SUMMARY.md`.
- Adds `HEALTHCARE_MODERNIZATION_HARDEN_READINESS.md`.
- Extends `reports/healthcare-harden/eval/SUMMARY.md` with Wave 6 overlay status.

## QA / Validation

- PASS: `node scripts/corpus/generated/healthcare-meridian-wave6/generate-healthcare-meridian-wave6.mjs` generated 300 patterns across six Meridian overlay domains.
- PASS: `npx jest scripts/corpus/generated/healthcare-meridian-wave6/__tests__/wave6-meridian-overlay.test.ts --runInBand` completed with 3/3 tests passing. Jest emitted existing duplicate manual mock warnings, but the suite passed.
- PASS: Targeted ESLint completed cleanly for the Wave 6 generator and test.
- PASS: Direct pattern audit confirmed 300 rows across `MRD-OVL-D01..D06` and no stale `14 hospitals`, `220 ambulatory sites`, or `$7.8B revenue` terms.
- PASS: `npx tsc --noEmit --pretty false` completed cleanly.
- PASS: `npm run release:check -- --base origin/main --head HEAD` completed cleanly.
- PASS: `git diff --check` completed cleanly.

## Rollout Plan

Merge the candidate PR to `main` and deploy normally. This release ships import-ready corpus artifacts and evidence only. The generated Meridian overlay rows become live corpus data only after an authenticated admin loads the JSONL batches through the governed context-layer upload workflow.

## Rollback Plan

Revert the PR to remove the Wave 6 generator, artifacts, profile correction, and readiness reports. No production data rollback is required unless the JSONL batches have separately been loaded through the governed admin workflow.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment URL: pending.
- Local Wave 6 checkpoint: `reports/healthcare-harden/wave-6/checkpoint.json`.
- Final readiness report: `HEALTHCARE_MODERNIZATION_HARDEN_READINESS.md`.

## Known Gaps

Live retrieval remains deferred until the generated Wave 6 JSONL batches are committed through the governed admin loader. Exact Meridian revenue, ambulatory-site count, vendor commitments, and facility count beyond the user-confirmed 30+ hospital footprint are intentionally not invented.
