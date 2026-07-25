# 2026-07-25-charter-reconciliation-discovery-preparation — Reconcile canonical values; redesign Charter to end with Discovery Preparation

## Release ID

`2026-07-25-charter-reconciliation-discovery-preparation`

## Status

`candidate`

## Plain-English Summary

Two changes, requested together after reviewing the earlier increments in this session:

**1. Reconciliation — correcting two values that had drifted from what was actually agreed:**
- Word floor: `CHARTER_CONTRACT.wordBudget.minWords` was 700 (carried over from the golden-bar
  pipeline's original implementation); corrected to 900, equal to the target range's own minimum.
  A floor below the target's minimum risks a thin Charter once tables are included, and the new
  shared contract is the source of truth — not whichever pipeline's number happened to already
  exist.
- Token ceiling: had moved from 3,000 → 8,000 under a "be generous on tokens" reading that went
  too far. Corrected to 4,000 (`CHARTER_CONTRACT.maxOutputTokens`) — generous enough for
  structured content/tables above the 1,300-word hard ceiling, without being unbounded (which
  raises latency, cost, and the odds of over-generation followed by truncation/rejection). Both
  pipelines now derive this one number: golden-bar's single-shot `maxTokens`, and the
  orchestrator's charter-specific `section_draft`/`synthesis` pass budgets (reintroduced as a
  contract-driven override — see `document-generation-policy.ts`).
- A `policy` object was added to the shared contract stating explicit runtime flags
  (`qualityContractRequired`, `visualRendererRequired: false`, `evidenceCitationRequired`,
  `phaseBoundaryValidationRequired`, `structuredRenderingRequired`) — these are the *declared*
  contract, not all of them are actually enforced in shipped code yet (`qualityContractRequired`
  is gated by the `deliverable_quality_contract` flag, off for every tenant; golden-bar has no
  phase-boundary check at all, only the orchestrator does). Declared-vs-enforced gaps are
  recorded, not glossed over.
- A reconciliation proof (`charter-contract-reconciliation.test.ts`) inspects the ACTUAL assembled
  prompt/resolved quality-bar/resolved token budget in both pipelines — not just imported-constant
  equality — confirming both derive the same real runtime values from the one shared contract.

**2. Redesign — Charter now ends with a first-class "Discovery Preparation" section, not a generic
recommendation.** The Charter's section list grows from 7 to 9 (both pipelines): `charter_decision`,
`opportunity_context`, `intended_outcomes`, `scope`, `success_measures`, `sponsorship_governance`,
`known_constraints_dependencies`, **`discovery_preparation`** (new), `authorization_next_steps`.
`intended_outcomes` and `success_measures` are also split apart (previously merged into one
"success_criteria" section). `discovery_preparation` contains two real tables (an executive
Area/What-to-Expect/What-We-Need/Priority table across 6 domains, and a Discovery-activities/
duration table) plus a short paragraph pointing to the separate Discovery Guidebook that gets
generated after Charter approval — instead of compressing "discovery questions" and "evidence
requested for P2" into vague bullets inside a generic recommendation section (the gap flagged in
the prior reconciliation). Placeholder labels also changed: `"Hypothesis to test in P2"` →
`"To Validate During Discovery"`, and both remaining labels moved to Title Case
(`"Client Decision Required"`, `"Evidence Required for P2"`).

## Layer Impact

- **global-control-lane**: shared Charter contract + both generation pipelines' prompt/structure,
  applies to every tenant.

## Client Applicability

- All clients: yes — every P1 Charter generated after this deploys (either pipeline) reflects the
  new 9-section structure and reconciled word/token numbers.

## Changes Included

- `src/lib/deliverables/shared/artifact-contracts.ts` — `CHARTER_CONTRACT.wordBudget.minWords`
  700→900; `maxOutputTokens` field added (4,000); `estimatedRenderedPages`, `boundaryStatement`,
  `maxSubstantiveTables`, and `policy` fields added; `sections` redesigned from 7 to 9 (Discovery
  Preparation as its own section); `presentationElements` updated to the 4 new required elements;
  `CHARTER_PLACEHOLDER_LABELS` updated (Title Case, `hypothesisToTestInP2` → `toValidateDuringDiscovery`).
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — `p1Assignment()` rewritten to the
  new 9-section structure, boundary statement, Discovery Preparation content spec, and updated
  placeholder labels, all interpolated from the shared contract.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — `MOVES_CHARTER`'s
  `sections`/`requiredSectionKeys` redesigned to the same 9 sections with matching per-section
  word caps read from the shared contract.
- `src/lib/deliverables/orchestrator/section-generation.ts` — `fallbackRecommendation`'s section
  matcher regex updated (`recommendation|handoff|authorization|next.?steps`, dropping bare
  `decision` — which would otherwise now match the new "Charter Decision" section instead of the
  intended "Authorization & Immediate Next Steps" section).
- `src/lib/ai/document-generation-policy.ts` — reintroduced a charter-specific token override
  (`charterPassFallback`), this time driven by `CHARTER_CONTRACT.maxOutputTokens` (4,000) instead
  of a hardcoded literal, replacing the brief "fall through to the generic 12,000/6,000 defaults"
  behavior from the immediately prior increment.
- `src/lib/programs/charter-preflight.ts` — `CHARTER_SECTION_TO_P0_CAPTURE_KEYS` updated to the 9
  new section keys.
- `src/lib/deliverables/shared/__tests__/charter-contract-reconciliation.test.ts` (new) — inspects
  real runtime output (assembled prompts, resolved quality bar, resolved token budgets, resolved
  artifact brief) in both pipelines to prove they derive from the one shared contract.
- Tests updated across all of the above for the new section keys/word caps/labels.
- `docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md` — carried forward from the prior increment
  (unchanged content, included so this PR's diff is self-contained against a fresh `main`).

## QA / Validation

- `npx eslint` on all changed/new files — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest` across all touched test files plus the new reconciliation test — 129/132 pass; the 3
  failures (`visual-and-prompt.test.ts`'s pre-existing solution_design/operating_model_design/
  sourcing_strategy length-rule assertions) confirmed pre-existing/unrelated earlier this session.
- Live signed-in proof — not yet run.

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy
- Live signed-in proof required: yes — generate a P1 Charter via both entry points and confirm the
  Discovery Preparation section (with both tables) appears, the word/token numbers match, and the
  new placeholder labels are used correctly instead of fabricated content.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened.
- Prior context: `docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md` (PR #5583); the reconciliation
  request that prompted this PR was made directly in-session after reviewing the prior increment's
  truth table.

## Known Gaps

- Declared-vs-enforced policy gaps remain open (see Plain-English Summary): `qualityContractRequired`
  not actually enforced for any tenant today; golden-bar has no `phaseBoundaryValidationRequired`
  equivalent check.
- Only Charter is migrated to the shared-contract pattern; other deliverable types still have
  independent definitions per pipeline.
- The two pipelines' prompt-construction systems remain architecturally separate by design
  (documented in the dual-pipeline audit) — this PR keeps them in sync on values/structure, it does
  not merge the systems themselves.
