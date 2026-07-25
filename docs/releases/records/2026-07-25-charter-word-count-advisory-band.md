# 2026-07-25-charter-word-count-advisory-band — Replace the Charter's hard word-count block with a warning band, and record generation metrics on every artifact

## Release ID

`2026-07-25-charter-word-count-advisory-band`

## Status

`candidate`

## Plain-English Summary

A live signed-in proof of the previous increment (Charter reconciliation, PR #5589) found that two
independent real Charter generations both landed 170-200 words past the 1,300-word hard ceiling
(1,471 and 1,505 words), and both were blocked outright even though the content read as a strong,
complete Charter. Blocking a high-quality artifact over a word-count number that the prompt/section
budgets don't yet reliably hit trades real quality for a target that is still being tuned.

This change replaces the single hard ceiling with a warning band, for the Charter specifically (and
as a reusable mechanism any other concise artifact type can opt into later):

- 900-1,300 words: passes cleanly, as before.
- 1,301-1,500 words: passes with an advisory ("Advisory: this document is slightly longer than the
  recommended executive target but remains within the acceptable review range") — does not block.
- Above 1,500 words: still blocks export, same as before.

Both pipelines (orchestrator and golden-bar) apply the same three bands, reading the same numbers
from the shared contract in `artifact-contracts.ts` — the exact single-source-of-truth pattern this
Move's earlier increments established, so the two pipelines can't silently diverge on this number
either.

Separately, every artifact that reaches the orchestrator's persistence step (i.e. every artifact
that passes, including the new advisory band) now records a `generationMetrics` object on its
`generated_artifacts.metadata` — body word count, section count, table count, a rough page estimate,
reading time, quality score, which word band it landed in, and whether any warning fired (a proxy
for "needed a human look before shipping"). The intent is to build up a real sample of generated
Charters before tightening the bands further, rather than re-guessing the right ceiling from a
single live run.

## Layer Impact

- **global-control-lane**: shared Charter word-count policy and generation-metrics capture, applies
  to both generation pipelines for every tenant.

## Client Applicability

- All clients: yes — every P1 Charter generated after this deploys (either pipeline) uses the new
  three-band word-count policy, and every artifact that persists (either pipeline reaching the
  orchestrator's save path) records `generationMetrics`.

## Changes Included

- `src/lib/deliverables/shared/artifact-contracts.ts` — `ArtifactWordBudget` gains
  `advisoryMaxWords`; `CHARTER_CONTRACT.wordBudget.advisoryMaxWords = 1_500`. `hardMaxWords` (1,300)
  keeps its name for backward compatibility but is now documented as the target ceiling / advisory
  threshold, not the true block point.
- `src/lib/deliverables/orchestrator/types.ts` — `QualityBar` gains `advisoryBandMax`;
  `QualityValidationResult.metrics` gains `readingTimeMinutes`, `manualEditNeeded`, `wordBand`.
- `src/lib/deliverables/orchestrator/quality-validator.ts` — the word-ceiling check now checks
  `advisoryBandMax` before blocking: within the band it's a warning only, even when
  `enforceMaxAsBlocker` is true; only crossing `advisoryBandMax` blocks. Computes the three new
  metrics fields on every validation call regardless of pass/fail.
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` — `moves::charter` sets
  `advisoryBandMax: CHARTER_CONTRACT.wordBudget.advisoryMaxWords` (1,500).
- `src/lib/deliverables/orchestrator/persistence.ts` — new `buildGenerationMetrics()` reads the
  quality-validator's metrics and quality score into a plain object, merged into the artifact's
  `metadata.generationMetrics` on every successful save (i.e. every artifact that isn't blocked).
- `src/lib/deliverables/golden-bar.ts` — `GoldenBarOptions` gains `advisoryMaximumWordCount`;
  `meetsGoldenBar()` applies the same within-band-is-advisory / past-band-blocks logic and reports
  it in `reasons`.
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — `premiumGoldenBarOptionsForArtifact`
  passes `advisoryMaximumWordCount: CHARTER_CONTRACT.wordBudget.advisoryMaxWords` for `charter`, and
  the function's return type is extended to include the new field.
- Tests: `quality-validator-size-range.test.ts` (new `advisoryBandMax` band-boundary tests +
  `readingTimeMinutes`/`wordBand` metrics tests) and `golden-bar.test.ts` (new advisory-band test +
  wiring test for the Charter's `advisoryMaximumWordCount`).

## QA / Validation

- `npx eslint` on all 9 changed files — pass, in a clean worktree built from `origin/main`.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest src/lib/deliverables` — 439/445 pass; the 6 failures are pre-existing on a clean
  `origin/main` checkout with none of this change's files applied (confirmed by running the same
  suite against the unmodified worktree before copying in the changed files) — 3 unrelated suites
  (`golden-regression.test.ts`, `visual-and-prompt.test.ts`, `renderers.test.ts`) with stale
  fixture-name/snapshot expectations.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passes once this record exists;
  the changed-file list matches exactly the 9 files above, no incidental diff.
- Live signed-in proof — this change is a direct, traceable response to a live-proof finding (two
  independent live Charter generations at 1,471 and 1,505 words both blocked incorrectly under the
  prior single-ceiling policy); a follow-up live run to confirm the advisory band behaves as
  designed in production has not yet been performed.

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration — `generationMetrics` lands in the existing `generated_artifacts.metadata` JSONB column,
which already accepts arbitrary merged keys.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy
- Live signed-in proof required: yes — generate a P1 Charter that lands in the 1,301-1,500 word
  advisory band and confirm it is NOT blocked and the advisory warning is visible; confirm
  `generated_artifacts.metadata.generationMetrics` is populated on the resulting record.

## Rollback Plan

Revert the merge commit. No schema/data changes; `generationMetrics` simply stops appearing in new
records.

## Audit Evidence

- PR: to be opened.
- Prior context: `docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md` (PR #5583); the live-proof session
  that surfaced this finding ran two independent Charter generations on a synthetic test Move
  through the orchestrator's Approve & Build path, both blocked at 1,471 and 1,505 words against the
  prior 1,300-word hard ceiling.

## Known Gaps

- The advisory band numbers (1,300 / 1,500) are still a judgment call pending real data — the whole
  point of `generationMetrics` is to accumulate a real sample (per the live-proof follow-up
  discussion: "after 50-100 real Charters, you'll know the natural range") before tightening or
  loosening either threshold.
- `generationMetrics` is only captured for artifacts that reach the persistence step — a genuinely
  blocked artifact (still possible above 1,500 words, or blocked on any other quality-gate reason)
  is not persisted at all today, so its metrics aren't recorded either. Surfacing metrics for
  blocked runs too (e.g. via the `/api/v1/deliverables/runs/[runId]` status endpoint, which already
  returns `sectionCount` for blocked runs) is a reasonable follow-up but out of scope here.
- `pageEstimate` in `generationMetrics` is a rough ~500-words-per-executive-page heuristic, not a
  real DOCX/HTML pagination result — flagged as an estimate in the metadata itself, not measured.
- No compression/retry pass exists yet for documents that exceed the advisory band — they still
  simply block, per "Compression/retry or block" in the original ask; only the "or block" half is
  implemented.
