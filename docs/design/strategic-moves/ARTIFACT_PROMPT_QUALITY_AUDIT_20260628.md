# Strategic Moves Artifact Prompt Quality Audit

Date: 2026-06-28  
Branch: `codex/moves-premium-artifact-standard`  
Scope: current `origin/main` Strategic Moves generation path before the premium P1/P2 upgrade.

## Summary

The live primary generation path is already much better than the older `[DATA GAP]` stub path: it assembles `SolutionContext`, retrieves tenant current-state context through the Programs broker, injects visual artifact requirements, calls Claude through governed egress, and runs a deterministic golden-bar check. However, the prompt is still too compact for premium Strategic Moves work products. It does not yet carry a durable artifact brief, phase-specific minimum depth, artifact-specific token budgets, or complete review/regenerate semantics.

## Current Primary Path

Primary route:

- `src/app/api/v1/programs/[programId]/generate/route.ts`

Runtime path:

1. `requireTenancy()`
2. `getProgramById(ctx, programId)`
3. `normalizeMovesDeliverableKey(...)`
4. `generateArtifact(...)`
5. `assertPhaseReadyForGeneration(...)`
6. `assembleMoveSolutionContext(...)`
7. `buildArtifactPrompt(...)`
8. `streamAgentTurn(...)`
9. `meetsGoldenBar(...)`
10. persist via `draftModuleDeliverable(...)` and `saveMoveArtifact(...)`

## Current Prompt For P1/P2

P1 normally maps to `charter`.

P2 normally maps to `discovery_report` when the requested title/key contains discover, diagnose, diagnostic, or defaults to phase 2.

The current prompt has:

- system persona: senior consulting principal / strategist / solution architect / presentation designer
- context fields: use case, KPIs, current state, gaps/root causes, approved decisions, human review notes
- visual standard block
- per-artifact visual contract
- draft caveat when draft mode is used
- task: generate self-contained HTML with custom inline SVG and tables
- rules: no invented facts, recommendations trace to KPI/gap/evidence/decision, lead with judgment

What is missing for P1/P2:

- P1-specific charter assignment
- P2-specific current-work diagnostic assignment
- required P2 handoff map / exception taxonomy / process-vs-AI matrix / control implications
- minimum target depth
- explicit evidence classification language
- readiness/gate summary as a structured brief
- uploaded evidence content contract beyond what broker retrieval returns
- stakeholder/workshop use instructions

## Current Prompt For P0/P3/P4/P5

The same `buildArtifactPrompt(...)` function is used for all canonical deliverable keys that route through `generateArtifact(...)`.

P3 architecture has an additional guard: architecture must use `chosenOption` and must not choose the solution approach inside the architecture artifact.

P4/P5 receive the same generic brief plus their visual contract if a contract exists.

Current gap: P0, P3, P4, and P5 do not yet receive the full phase-specific assignment from the new doctrine. The current task explicitly says not to upgrade P3/P4/P5 blindly; therefore the implementation should upgrade P1/P2 first and leave a visible next-step note for later phases.

## Evidence Packaging Behavior

Current context assembly:

- `assembleMoveSolutionContext(...)` folds prior structured phase digests.
- It calls `retrieveCurrentState(...)`.
- The real route uses `buildProgramsContextBundleAsync(...)` with requested broker domains:
  - enterprise profile
  - people/org
  - program lifecycle
  - system landscape
  - vendor contracts
  - financials
  - evidence provenance
  - operating telemetry
- It formats the broker bundle through `formatProgramsBrokerBundleForPrompt(...)`.

What is good:

- No `[DATA GAP]` stub is used.
- Prior digests are structured, not 1,800-character raw clips.
- Gate decisions are folded as solution decisions.

Gaps:

- The prompt factory treats broker output as one `CURRENT STATE` string rather than a structured evidence inventory.
- The code does not explicitly prove whether uploaded CSV/XLSX summaries, stakeholder notes, or policy/control notes are included; it depends on the broker bundle.
- The prompt does not explicitly say "do not pass only metadata if extracted content exists."
- Evidence readiness/slot coverage is not rendered in the prompt as a standard brief section.

## Token Budgets

Current model call:

- `NEXUS_MOVES_ARTIFACT_MAX_TOKENS`, default `20000`
- single global cap for all artifacts

Gap:

- No artifact-specific budget or target length.
- P1/P2 do not receive explicit word targets.

## Draft/Final Behavior

Current draft behavior:

- `generationMode: "draft"` can proceed when capture has enough context but gate is not approved.
- Draft caveat is inserted into the prompt and force-inserted into returned HTML.
- Persisted status is `review_required`.
- Metadata marks `Pre-gate draft — review required`, `Draft quality passed`, and `Passed with caveats` when golden-bar passes.

What is good:

- Drafts are not marked final.
- Draft caveat is visible.

Gap:

- Draft caveat is close to doctrine but not the exact standard wording.
- Prompt lacks full "client to complete before final" standard beyond a concise exhibit instruction.

## Review/Regenerate Behavior

Current route:

- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/review-regenerate/route.ts`

Current helper:

- `buildReviewRegenerationPlan(...)`

Current behavior:

- Parses feedback into items.
- Writes a short markdown review-regenerated packet.
- Does not fetch the prior artifact body.
- Does not assemble full phase context.
- Does not call Claude.
- Does not return a complete updated artifact.

This is the largest gap against the new doctrine. Regeneration currently behaves like a safe feedback packet, not a complete revised work product.

## Golden-Bar Behavior

Current golden-bar checks:

- rendered SVG/CSS diagrams
- `[DATA GAP]`
- prose-only
- required visual/table contract exhibits for known artifacts

What is good:

- Architecture artifacts require conceptual/logical/physical/data-flow/pattern exhibits.
- Discovery requires current-state diagrams and gap/evidence tables.

Gaps:

- No minimum depth by artifact.
- No phase-alignment test.
- No evidence-usage depth test beyond absence of `[DATA GAP]`.
- No internal language leakage check.
- No unsupported value claim check.
- No shallow-artifact failure when an artifact has visuals but insufficient substance.

## Renderer And File Cabinet

The generation route persists:

- `deliverables_v2` draft version through `draftModuleDeliverable(...)`
- Move File Cabinet registry through `saveMoveArtifact(...)`
- body stored as HTML in Blob where object storage is configured
- metadata includes golden-bar result and generation mode

Current gap:

- Existing File Cabinet proof should be rerun after P1/P2 regeneration to confirm new draft versions are visible and tenant-scoped.

## Risk Assessment

The platform is no longer at the old `[DATA GAP]` failure mode. The remaining risk is product-quality under-instruction:

- Claude gets context, but not the full consulting assignment.
- P1/P2 can be visually valid while still too shallow for a CIO workshop.
- Review/regenerate cannot yet produce a complete revised artifact.

## Recommended Fixes In This Slice

1. Add durable doctrine doc.
2. Add executable Strategic Moves prompt-standard module.
3. Upgrade `buildArtifactPrompt(...)` for P1 `charter` and P2 `discovery_report`.
4. Add artifact-specific token budget support for model calls.
5. Add premium golden-bar options for P1/P2 minimum depth and forbidden internal language.
6. Upgrade review/regenerate to fetch prior artifact body and call Claude with original artifact, feedback, context, evidence, gate/draft caveats, and complete-revision instructions.
7. Add tests for the standard, P2 assignment, draft caveat, token budget, shallow artifact failure, forbidden internal language, and complete regeneration.

## Explicit Non-Goals For This Slice

- Do not expand P3/P4/P5 standards beyond documenting and preparing the shared contract.
- Do not add new phases.
- Do not mark draft artifacts final.
- Do not fake sponsor assignment or gate approval.

