# 2026-07-25-roadmap-reference-story-first — REF_EXECUTIVE_ROADMAP: story-first fast-follow

## Release ID

`2026-07-25-roadmap-reference-story-first`

## Status

`candidate`

## Plain-English Summary

Fast-follow to the REF_EXECUTIVE_ROADMAP pilot (PR #5596). Review of that pilot found the mechanics
were proven — shared contract, real SVG renderer, required-element presence-check, forbidden-pattern
check — but the governing hierarchy was not yet explicit end to end:

```
Executive decision and story → Artifact narrative → Section purpose
  → Exhibit message → Visual reference → SVG rendering
```

A technically compliant roadmap SVG can still read as a polished project schedule if the narrative
spine is missing. This release adds the story-first fields the pilot lacked:

1. **Message-led title enforcement** — the title itself must be the executive conclusion (e.g. "A
   four-stage transition builds the foundation first, proves priority value, and scales only after
   controls are established"), not a bare category label ("Execution Roadmap"). New `titleRule` on
   the reference contract, the orchestrator's `QualityBar`, and golden-bar's options; checked against
   the rendered `<h1>` (golden-bar) / `doc.title` (orchestrator). Advisory-only.
2. **Outcome-led horizons** — each horizon now has a fixed `horizonOutcomes` statement (the state
   achieved, e.g. "Establish Foundation: Trusted data, governance and delivery foundation
   operational") that the prompt requires leading with; activities may appear beneath it, never in
   place of it.
3. **Evidence status per item** — `requiredItemFields` gains `evidenceStatus`, one of approved /
   recommended / illustrative / client_decision_required / evidence_required, so an unconfirmed
   sequence can never read as committed.
4. **Named decision gates and value milestones** — `decisionGates` (e.g. "Funding authorized",
   "Pilot value validated") and `valueMilestones` (e.g. "First measurable result demonstrated",
   "Benefits accepted by Finance") are now explicit fields the prompt surfaces, not just a rendering
   shape (diamond).
5. **Gold-standard SVG exemplar fixed** — the hand-authored exemplar contained cell text that
   overflowed its box; the real `svgRoadmapExhibit()` renderer truncates cell content to 44
   characters (`.slice(0, 44)`), and the exemplar's longer synthetic strings didn't match that
   real truncation behavior. Trimmed to fit, preserving meaning. A gold-standard reference must not
   itself contain a rendering defect — it would be normalized as acceptable by anyone using it as a
   template.

## Layer Impact

- **global-control-lane**: same shared reference contract as PR #5596, extended in place.

## Client Applicability

- All clients: yes — every P4 Executive Roadmap generated after this deploys gets the additional
  story-first prompt guidance and the (still advisory) title-quality check.

## Changes Included

- `src/lib/deliverables/shared/reference-library/executive-roadmap-reference.ts` — adds
  `titleRule`, `horizonOutcomes`, `decisionGates`, `valueMilestones`, `evidenceStatus` (new
  `requiredItemFields` entry and `RoadmapEvidenceStatus` type).
- `src/lib/deliverables/orchestrator/types.ts` — `QualityBar` gains `titleRule`.
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` — `moves::roadmap` wires the new
  `titleRule` from the shared contract.
- `src/lib/deliverables/orchestrator/quality-validator.ts` — new title-quality warning check.
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — `p4RoadmapAssignment()` prompt now
  states the title rule, outcome-led horizon statements, evidenceStatus values, named decision gates,
  and named value milestones; `premiumGoldenBarOptionsForArtifact` wires the matching `titleRule` for
  `execution_roadmap`.
- `src/lib/deliverables/golden-bar.ts` — matching `titleRule` option/check/`titleReadsAsGenericLabel`
  result field for this pipeline (checked against the rendered `<h1>`).
- `docs/design/moves/reference-library/executive-roadmap/gold-standard.svg` — fixed cell-text
  overflow to match the real renderer's 44-character truncation.
- Tests: `executive-roadmap-reference.test.ts` gains 4 new assertions (evidenceStatus field,
  horizon outcomes present, decision gates/value milestones non-empty, title-rule pattern behavior).
  `persist-move-generated-artifact.test.ts` fixture updated for the new required
  `titleReadsAsGenericLabel` field on `GoldenBarResult`.

## QA / Validation

- `npx eslint` on all changed files — pass, in a clean worktree built from `origin/main` (post
  PR #5596 merge).
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest src/lib/deliverables` — 465/472 pass; the failures are the same pre-existing 3-suite/
  6-test baseline confirmed via `git stash` diff against the unmodified worktree — unchanged by this
  PR.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.
- Live signed-in proof — not yet run; deferred to the same live-prove pass covering the base pilot
  (generate a real P4 roadmap through both pipelines and check the full 7-point checklist: message-
  led title, outcome-led horizons, no false precision, named gates, value milestones, evidence-status
  labels, legibility at document size).

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: yes — same live-prove pass as PR #5596's open item, now covering
  the story-first checklist too.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened.
- Prior context: PR #5596 (REF_EXECUTIVE_ROADMAP pilot).

## Known Gaps

- Same known gaps as PR #5596 (pilot scope, no reference-loader abstraction, advisory-only
  enforcement, SVG exemplars hand-authored not programmatically rendered).
- **`target_state_architecture` pipeline-word-floor asymmetry, restated explicitly per review**:
  both pipelines share the same advisory and blocking maximum (ceiling) for this artifact type, but
  their target minimums remain intentionally different — the orchestrator's floor is 9,000 words,
  golden-bar's is 2,500 — because one pipeline is single-pass (golden-bar's
  `p3FutureStateAssignment`) and the other is decomposed multi-pass (the orchestrator's generator,
  which the 9,000-word floor was designed around). This is a pragmatic interim choice, not a fully
  reconciled semantics: **the pipelines are not fully reconciled on this dimension.** Longer term,
  the artifact contract should remain identical across pipelines, while the generation strategy
  adapts internally — a user should not receive materially shallower architecture output simply
  because a different button invoked a single-pass pipeline instead of a multi-pass one. Revisit once
  golden-bar's single-pass prompt is proven (via real generation samples) to reliably produce more
  depth, or once the two pipelines converge on one generation strategy for this artifact type.
- The story-first fields added here (evidenceStatus, decisionGates, valueMilestones, horizonOutcomes,
  titleRule) are all advisory/prompt-guidance only — none are structurally validated yet (e.g. there
  is no check that a generated roadmap item's `evidenceStatus` value is actually one of the five
  allowed labels, only that the prompt asks for it). A structural per-item validator is real
  follow-up scope once real generations exist to calibrate against.
