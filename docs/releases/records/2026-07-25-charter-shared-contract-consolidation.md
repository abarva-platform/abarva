# 2026-07-25-charter-shared-contract-consolidation — One canonical Charter contract, read by both pipelines

## Release ID

`2026-07-25-charter-shared-contract-consolidation`

## Status

`candidate`

## Plain-English Summary

This is the real fix the two prior stopgaps (`2026-07-25-p0-p1-scope-outcomes-discovery-split`,
`2026-07-25-charter-generous-tokens-firm-words`) were working around: the Charter word budget had
to be corrected twice because each of the two live Moves generation pipelines (golden-bar,
orchestrator) kept its own hardcoded copy of the same numbers. New module
`src/lib/deliverables/shared/artifact-contracts.ts` defines the Charter's word budget (floor/target/
hard-max), its 7 required sections with per-section word caps, its forbidden later-phase topics, and
its three placeholder labels ("Client decision required" / "Hypothesis to test in P2" / "Evidence
required for P2") **once**. Both pipelines now read from it:

- Golden-bar's `strategic-moves-artifact-standard.ts` (`DEPTH_BY_ARTIFACT.charter`, `p1Assignment()`)
  interpolates the shared contract's numbers and labels instead of hardcoding its own copy.
- Orchestrator's `quality-bar-registry.ts` (charter's `minBodyWords`/`targetBodyWordsMax`) and
  `deliverable-structures.ts` (`MOVES_CHARTER`'s per-section word caps and
  `forbiddenSectionTopics`) do the same.

One reconciliation was needed to make this possible: golden-bar's floor was 700 words, orchestrator's
was 900 (identical to its own target-range minimum, leaving no room below target). Canonicalized to
700 (the more permissive floor) — a real editorial decision, not an accidental pick, recorded here so
it's traceable.

This does **not** unify the two pipelines' prompt construction (golden-bar's single-pass narrative
brief vs. orchestrator's six-pass section-by-section system remain architecturally different — see
`docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md`) or their token-budget mechanics. Only the numeric/
policy contract — the part that must never silently diverge — is shared. Only Charter is migrated
today; the same pattern extends to other deliverable types as a follow-up.

## Layer Impact

- **global-control-lane**: new shared module consumed by both Moves generation pipelines, applies to
  every tenant.

## Client Applicability

- All clients: yes — no behavior change from this PR alone (the numbers are identical to what
  `2026-07-25-charter-generous-tokens-firm-words` already set in both pipelines); this PR makes that
  alignment structural instead of two independently-maintained copies that already drifted once.

## Changes Included

- `src/lib/deliverables/shared/artifact-contracts.ts` (new) — `CHARTER_CONTRACT`,
  `CHARTER_PLACEHOLDER_LABELS`, `getArtifactContract()`, `sectionWordCapTotal()`.
- `src/lib/deliverables/shared/__tests__/artifact-contracts.test.ts` (new) — internal consistency
  checks (section word caps sum under the hard ceiling, word-budget ordering, exact label text,
  section count).
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — `DEPTH_BY_ARTIFACT.charter` and
  `p1Assignment()` read from `CHARTER_CONTRACT`/`CHARTER_PLACEHOLDER_LABELS` instead of hardcoded
  literals.
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` — charter's `minBodyWords`
  (900 → 700, reconciled to golden-bar's floor) and `targetBodyWordsMax` now read from
  `CHARTER_CONTRACT.wordBudget`.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — `MOVES_CHARTER`'s 7
  per-section word-cap instructions and `forbiddenSectionTopics` now read from
  `CHARTER_CONTRACT.sections`/`CHARTER_CONTRACT.forbiddenTopics`.
- `src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts` — updated the
  `minBodyWords` assertion for the reconciled floor (900 → 700).

## QA / Validation

- `npx eslint` on all changed/new files — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest` across the shared module's own tests plus both pipelines' charter-related test files —
  102/105 pass; the 3 failures (`visual-and-prompt.test.ts`'s pre-existing solution_design/
  operating_model_design/sourcing_strategy length-rule assertions) confirmed pre-existing/unrelated
  earlier this session.
- Live signed-in proof — not yet run.

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy
- Live signed-in proof required: yes — generate a P1 Charter via both entry points (`/generate` and
  "Approve & Build") and confirm both reflect the identical 900-1,100/1,300-hard-max standard.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened.
- Context: `docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md` (PR #5583) is the audit that surfaced
  the duplication this PR resolves for Charter.

## Known Gaps

- Only Charter is migrated to the shared-contract pattern. Other deliverable types
  (discovery_report, root_cause_worksheet, target_state_architecture, solution_design, etc.) still
  have independent word-budget/section definitions in each pipeline — same risk of silent
  divergence, not yet addressed.
- Golden-bar's prompt does not yet enforce `CHARTER_CONTRACT.forbiddenTopics` as a phase-boundary
  check the way the orchestrator's `forbiddenSectionTopics` does — golden-bar only has its own
  separate internal-jargon forbidden-term list (`STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS`), a
  different concept. Building a shared phase-boundary validator that both pipelines run is part of
  the still-pending P1 preflight/validation work.
- The two pipelines' prompt PROSE and token-budget mechanics remain architecturally separate by
  design (documented in the audit) — this PR intentionally does not attempt to unify those.
