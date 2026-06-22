# 2026-06-21-scb-golden-coverage-all-packs — Full golden-question coverage → 67/67 packs exposable

## Release ID

`2026-06-21-scb-golden-coverage-all-packs`

## Status

`candidate`

## Plain-English Summary

Expands the W5.2 golden-question fixtures from one-question-per-expert (35 covering 35 packs) to **~5 questions per expert across all 67 registered packs (335 total)**, each covering a distinct angle (headline metric, AI use-case, pain-theme, vendor/system-of-record, diagnostic/ROI). This closes the exposability gap: a Consilium pack is exposable only if it passes `gateExpertPack` AND has passing golden coverage, so before this change only 35 of 67 gate-clean packs were exposable. After this change **all 67 packs are exposable** — converting the faculty from "authored + gate-proven" to "exposable" (the gate the shared engine reads before a pack can ground a live answer). Fixtures are split into per-domain batch modules under `evals/golden/` and aggregated by `golden-questions.ts`.

## Layer Impact

- **global-control-lane (additive):** golden eval fixtures + aggregation. `golden-questions.ts` now aggregates 7 per-domain batch modules; new `evals/golden/types.ts` + `evals/golden/batch1..7-*.ts`. Consumed by the (default-off) eval harness + exposability gate (`exposure/shared-engine-policy.ts`). No runtime answer-path change; exposability still gates behind default-off `scb_shared_engine_*` flags.

## Client Applicability

- All clients: No runtime change — fixtures + gate inputs; SCB surface flags remain default-off.
- Specific clients: None.
- Internal only: Yes — eval/readiness fixtures.
- Public/demo only: None.
- Feature flag: None (gates the default-off `scb_shared_engine_*` exposure flags).

## Changes Included

- `src/lib/intelligence/answer/evals/golden-questions.ts` (now aggregates the 7 batches; re-exports `GoldenQuestion`)
- `src/lib/intelligence/answer/evals/golden/types.ts` (new — shared `GoldenQuestion` type)
- `src/lib/intelligence/answer/evals/golden/batch{1..7}-*.ts` (new — 335 fixtures, 5 per expert × 67)
- `src/lib/intelligence/exposure/shared-engine-policy.test.ts` (assertion updated: full coverage → all exposable; logic guard via controlled empty-coverage input)

## QA / Validation

Validation: Pass.
- 335 golden questions; **335 unique ids, no duplicates**; all 67 experts covered (5 each), no uncovered packs, no orphan expected-expert-ids.
- `runGoldenEval()` → **335/335 pass** (routing 335 / grounding 335 / content 335) — every question routes top-1 to its expected expert and every `mustInclude` term is present in that expert's grounding block.
- `buildExpertPackReadinessReport()` → **67/67 exposable** (was 35/67).
- `tsc --noEmit` clean over the golden modules + consumers (golden-eval, harness, shared-engine-policy).
- Jest: `harness.test.ts` + `shared-engine-policy.test.ts` → **6/6 pass** (harness `passCount === total` and `answerQualityPassCount === total` hold at the new count).

## Rollout Plan

Merge to `main`. No runtime rollout — fixtures + gate inputs consumed only by the default-off eval harness / exposability gate. Makes the full faculty exposable once a surface flag is flipped (separate, gated step).

## Deployment Authority

Not applicable — additive eval fixtures + test, no default-on runtime call sites.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a (gates the existing default-off `scb_shared_engine_*` flags)
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR — fixtures + test only, no migration, no runtime call sites.

## Audit Evidence

- Aggregate verify script: 335/335 unique ids; 67/67 experts covered; runGoldenEval 335/335 pass; readiness 67/67 exposable.
- `harness.test.ts` + `shared-engine-policy.test.ts` 6/6 pass.

## Known Gaps

- Covers the 67 packs on `main`. The 8 experts staged in held PRs #3806/#3807 will need their own golden coverage in (or alongside) those PRs before they become exposable.
- Deterministic layer only (routing + grounding + content). Live model-answer quality scoring remains the env-gated W5.1 layer.
