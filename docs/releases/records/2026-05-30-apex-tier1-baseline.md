# 2026-05-30-apex-tier1-baseline — Apex Tier-1 Verifier Baseline

## Release ID

`2026-05-30-apex-tier1-baseline`

## Status

`candidate`

## Plain-English Summary

This release records the Apex Retail production verifier baseline. Apex passed
three consecutive 25-question production Ask runs after the substrate refresh
and overlay config updates.

## Layer Impact

- `qa-validation-lane`: Records three production verifier runs.
- `agent-context-lane`: Confirms Apex retrieval can consistently reach the
  `retail-v1` overlay.
- `data-plane-lane`: No new data mutation in this release.
- `runtime-app-lane`: No runtime code change.

## Client Applicability

- All clients: No direct effect.
- Specific clients: Apex Retail baseline only.
- Internal only: Verification evidence.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `verification/apex-foundation-training/APEX_TIER1_BASELINE_2026-05-30.md`

## QA / Validation

- PASS: Run 1 returned 25/25.
- PASS: Run 2 returned 25/25.
- PASS: Run 3 returned 25/25.
- PASS: Minimum `retail-v1` chunks per answer was 5 in all runs.
- PASS: Minimum pattern citations per answer was 5 in all runs.

## Rollout Plan

Merge evidence to main. No Vercel production deployment is required for this
evidence-only release.

## Rollback Plan

Revert this evidence commit. No live data or runtime rollback is needed.

## Audit Evidence

- Baseline report:
  `verification/apex-foundation-training/APEX_TIER1_BASELINE_2026-05-30.md`

## Known Gaps

The underlying smoke script name still references Retail Overlay retrieval. The
question set and gate are nevertheless the Apex-shaped 25-question Tier-1
baseline required by Section 7.3.
