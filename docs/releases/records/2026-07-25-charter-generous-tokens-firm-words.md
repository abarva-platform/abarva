# 2026-07-25-charter-generous-tokens-firm-words — Reconcile both pipelines' Charter budget, be generous on tokens

## Release ID

`2026-07-25-charter-generous-tokens-firm-words`

## Status

`candidate`

## Plain-English Summary

Two corrections, both scoped to the P1 Charter's length/token behavior across **both** live
generation pipelines (per `docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md`, this session's audit):

1. **Stopgap pipeline reconciliation.** The Charter word standard shipped in
   `2026-07-25-p0-p1-scope-outcomes-discovery-split` (900-1,100 target / 1,300 hard max) only
   reached the golden-bar pipeline. The orchestrator pipeline — the one the live "Approve & Build"
   button actually invokes — had its own separate, untouched charter budget
   (`quality-bar-registry.ts`: 900-1,600 words, blocking) and its own prompt text
   (`prompt-builder.ts`, `deliverable-structures.ts`) that still said "prefer 1,200–1,500 words."
   Both are now aligned to 900-1,100 target / 1,300 hard max, and the orchestrator's 7 fixed
   charter sections' per-section word caps are proportionally trimmed so their sum (1,175 words)
   fits comfortably under the new ceiling.
2. **Be generous on tokens, firm on words** (explicit direction, 2026-07-25). A tight *token*
   ceiling constrains the model's ability to reason and draft before compressing to the target word
   count — that hurts quality, not just length. Conciseness should be enforced by the *word* gate
   alone. Two token ceilings that were previously tightened specifically to force charter brevity
   are now generous instead: golden-bar's charter `maxTokens` (was cut to 3,000 in the prior
   increment; raised to 8,000) and the orchestrator's charter-specific per-pass token compaction in
   `document-generation-policy.ts` (`compactPassFallback`, which cut `section_draft`/`synthesis` to
   900/1,200 tokens vs. the standard 12,000/6,000) — removed entirely; charter now gets the same
   per-profile token budget as any other deliverable type. The word-count quality gate
   (`targetBodyWordsMax`/`enforceMaxAsBlocker`, still firm at 1,300) is what enforces conciseness.

## Layer Impact

- **global-control-lane**: shared prompt/quality-gate infrastructure for both Moves generation
  pipelines, applies to every tenant.

## Client Applicability

- All clients: yes — this changes the P1 Charter's word/token behavior in both generation pipelines
  for every tenant. No tenant-specific gating; no client-visible UI changes beyond the generated
  Charter's own length and (unchanged) content standard.

## Changes Included

- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — charter's `DEPTH_BY_ARTIFACT.maxTokens`
  raised 3,000 → 8,000.
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` — charter's `targetBodyWordsMax`
  lowered 1,600 → 1,300 to match the golden-bar standard.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — charter's "prefer 1,200–1,500 words" text
  updated to "target 900–1,100."
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — charter's 7 per-section word
  caps trimmed (125/150/175/175/200/175/175, sum 1,175) to fit the new 1,300 hard ceiling.
- `src/lib/ai/document-generation-policy.ts` — removed `compactPassFallback`'s charter-specific
  token compaction; charter now uses the same per-profile token defaults (12,000/6,000 for
  section_draft/synthesis on the standard profile) as every other deliverable type.
- Tests updated across all of the above
  (`visual-and-prompt.test.ts`, `orchestrator.test.ts`, `quality-bar-registry.test.ts`,
  `document-generation-policy.test.ts`).

## QA / Validation

- `npx eslint` on all changed files — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest` across all 7 touched test files — 112/115 pass; the 3 failures
  (`visual-and-prompt.test.ts`'s pre-existing solution_design/operating_model_design/
  sourcing_strategy length-rule assertions) confirmed pre-existing/unrelated in this session's
  earlier baseline check.
- Live signed-in proof — not yet run.

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy
- Live signed-in proof required: yes — generate a P1 Charter via "Approve & Build" and confirm it
  reflects the 900-1,100/1,300-hard-max standard, not the old 1,600-word behavior.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened.
- Root cause / context: `docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md` (PR #5583) documents the
  pipeline divergence this change reconciles.

## Known Gaps

This remains a **stopgap**, not the full consolidation. The two pipelines still have entirely
separate prompt-construction systems (`solution-prompt-factory.ts` vs. `prompt-builder.ts`/
`deliverable-structures.ts`) that can drift again on any future change made to only one side. The
next real increment (per direction) is the shared source-of-truth module both pipelines read
phase-assignment/word-budget/required-section definitions from — not done in this change.
