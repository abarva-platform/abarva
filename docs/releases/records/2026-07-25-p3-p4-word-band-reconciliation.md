# 2026-07-25-p3-p4-word-band-reconciliation — Reconcile P3/P4 word budgets across both pipelines, and add the same advisory band as Charter

## Release ID

`2026-07-25-p3-p4-word-band-reconciliation`

## Status

`candidate`

## Plain-English Summary

Following the Charter word-count banding work (PR #5593), an audit compared golden-bar's
`DEPTH_BY_ARTIFACT` against the orchestrator's `quality-bar-registry.ts` for P3 (Choose the
Approach) and P4 (Build the Plan) artifact types, to check whether the same "each pipeline keeps
its own copy of the same number" bug existed elsewhere. It did — and for three types it was worse
than a mismatch, it was an outright contradiction:

- `target_state_architecture`: the orchestrator's floor (9,000 words) sat ABOVE golden-bar's own
  ceiling (6,000 words) — the same document could never satisfy both pipelines' word bars at once.
- `business_case`: the orchestrator's floor (5,000 words) exactly equalled golden-bar's ceiling
  (5,000 words) — "too short" on one pipeline was exactly "too long" on the other.
- `roadmap` / golden-bar's `execution_roadmap`: the same contradiction as business_case (orchestrator
  floor 5,000 = golden-bar ceiling 5,000).
- `estimate_model` / `value_model` (golden-bar's `financial_model` / `tower_metrics_plan`): golden-bar
  had NO depth standard for these at all and silently fell back to a generic 1,200-3,000/24,000-token
  band, unrelated to the orchestrator's actual 1,600-4,200 / 1,800-4,600 bands.
- `solution_design`, `operating_model_design`, `sourcing_strategy` were already aligned or only
  minor drift (200 words on sourcing_strategy's ceiling).

This PR:

1. Adds `P3_P4_WORD_BAND_CONTRACTS` to the shared `artifact-contracts.ts` — one reconciled
   min/target-ceiling/advisory-ceiling/token-budget/enforcement number per type, mirroring
   `CHARTER_CONTRACT`'s pattern. Where the pipelines contradicted, the orchestrator's numbers were
   treated as authoritative (each carries a specific, reasoned comment in `quality-bar-registry.ts`
   that golden-bar's older, unexplained ranges did not).
2. Migrates both pipelines' word-budget definitions to read from this one contract instead of their
   own hardcoded copies.
3. Applies the same three-band word-count policy PR #5593 introduced for Charter (pass / advisory /
   block) to every P3/P4 type that enforces a ceiling as a blocker, using the same ~15% headroom
   ratio observed on Charter's real overshoots.
4. One deliberate exception: `target_state_architecture`'s FLOOR was NOT raised to the orchestrator's
   9,000-word number for golden-bar. Reconciling it broke `generate-artifact.test.ts`'s real
   generation test — golden-bar generates this artifact in a single pass
   (`p3FutureStateAssignment`), unlike the orchestrator's decomposed multi-pass generator that the
   9,000-word floor was designed around. Only the CEILING was reconciled (16,000, resolving the
   actual floor-above-ceiling contradiction); golden-bar keeps its own realistic floor (2,500) until
   its single-pass prompt is proven to reliably produce more depth.

## Layer Impact

- **global-control-lane**: shared P3/P4 word-count policy, applies to both generation pipelines for
  every tenant.

## Client Applicability

- All clients: yes — every P3/P4 deliverable generated after this deploys (either pipeline) uses
  the reconciled word bands and the same advisory-band behavior as Charter.

## Changes Included

- `src/lib/deliverables/shared/artifact-contracts.ts` — new `WordBandContract` type and
  `P3_P4_WORD_BAND_CONTRACTS` registry (8 entries: target_state_architecture, solution_design,
  operating_model_design, sourcing_strategy, business_case, roadmap, estimate_model, value_model),
  with the reconciliation rationale documented inline.
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` — new `wordBandFrom()` helper; all 8
  P3/P4 overrides (including the `operating_model` alias) now spread their word-band fields from
  the shared contract instead of hardcoding them, and gain `advisoryBandMax`.
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — new `depthFromWordBand()` helper;
  `DEPTH_BY_ARTIFACT` migrates `target_state_architecture`, `solution_design`,
  `operating_model_design`, `sourcing_strategy`, `execution_roadmap`, `business_case` to it, and adds
  two entries that didn't exist before (`financial_model`, `tower_metrics_plan`).
  `premiumGoldenBarOptionsForArtifact` now derives `enforceMaximumWordCount` and
  `advisoryMaximumWordCount` from the same shared contract for every P3/P4 type (previously
  `business_case`/`execution_roadmap` were NOT in the enforcement whitelist at all, silently
  disagreeing with the orchestrator's hard-blocking `enforceMaxAsBlocker: true`).
- Tests: `quality-validator-size-range.test.ts` (one existing `roadmap` test row updated for the new
  advisory band), new `p3-p4-word-band-reconciliation.test.ts` (real-runtime-output reconciliation
  proof for all 8 types, mirroring `charter-contract-reconciliation.test.ts`'s pattern).

## QA / Validation

- `npx eslint` on all 5 changed/new files — pass, in a clean worktree built from `origin/main`
  (which already includes PR #5593).
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest src/lib/deliverables` — 449/455 pass; the 6 failures are the same pre-existing baseline
  confirmed on a clean `origin/main` checkout (3 unrelated suites with stale fixture-name/snapshot
  expectations). One real regression was caught and fixed during this work:
  `generate-artifact.test.ts`'s `target_state_architecture` generation test broke when the floor was
  first reconciled to 9,000 words — see the deliberate exception above.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass, changed-file list matches
  exactly the 5 files above.
- Live signed-in proof — not yet run for this PR.

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy
- Live signed-in proof required: yes — generate a P3 or P4 deliverable that previously would have
  hit the old contradictory numbers (e.g. a business_case or roadmap landing in the 5,000-11,000/
  5,000-12,700 range) and confirm both pipelines now agree on whether it passes.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened.
- Prior context: PR #5593 (Charter word-count advisory band), `docs/architecture/
MOVES_DUAL_PIPELINE_AUDIT.md` (PR #5583) — the audit that first surfaced this class of bug for
  Charter; this release applies the same finding-and-fix pattern to P3/P4.

## Known Gaps

- `target_state_architecture`'s floor remains genuinely different between the two pipelines
  (orchestrator 9,000 / golden-bar 2,500) — a deliberate, documented exception, not an oversight.
  Revisit once golden-bar's single-pass prompt for this artifact is proven (via real generation
  samples) to reliably produce more depth, or once the two pipelines' generation approaches for this
  type are unified.
- No live-generation sample exists yet for any of these 8 types' new advisory bands (same gap as
  Charter's PR #5593) — the ~15% headroom ratio is reasoned, not measured, pending real data.
- The user separately raised a much larger follow-up scope during this session: a full "P2/P3/P4
  Artifact and Visual Specification System" (per-artifact purpose, required sections/exhibits,
  diagram/SVG composition rules, evidence requirements, and worked examples of acceptable vs.
  prohibited output, plus a shared SVG design contract for canvas/typography/shape/color semantics).
  That is a substantial design project on its own and is explicitly NOT started by this release —
  this release is scoped to word-count/token-budget reconciliation only, matching what shipped for
  Charter.
