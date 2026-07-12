# Moves Orphan Placement Decision

Date: 2026-07-12
Scope: Remaining non-P1 findings from `docs/audits/moves-orphaned-components-audit-2026-07-12.md`.

## Decision Summary

The P1 orphan repairs are complete through the live phase workspace:

- `MovePhaseWorkspacePanel` is mounted for P2-P5.
- `CurrentStateReadinessPanel` is mounted in current-state/findings.
- `SessionPlaybookPanel` is mounted in prepare/templates.
- `PhaseApproveAndBuild` is mounted as the governed gate build action while preserving phase-gate approval.

The remaining orphan inventory is not one more blind mount. It splits into one cleanup and two placed-but-not-mounted product surfaces.

## 1. `MovesExplorer`

Decision: delete the old component.

Rationale:

- `/strategic-moves/[moveId]/workspace` now renders the shared `WorkspaceExplorer`.
- `workspace_explorer_moves` is platform-default.
- `MovesExplorer.tsx` has no live import site and represents the retired Finder-style explorer implementation.
- Keeping it around increases the chance that a future agent remounts the wrong explorer shell.

Follow-up: none unless historical release records need archival copy edits; those records intentionally remain historical.

## 2. `NexusCurrentStateBriefingPanel`

Decision: do not mount into the general phase workspace yet. Product placement is P2 current-state as a CXO briefing drawer/rail, opened from the current-state readiness area.

Why this placement:

- The panel generates a cited current-state executive read, not phase-task execution content.
- P2 current-state/findings is the moment where users ask "what is true now?" and where the current-state readiness ledger already lives.
- Files & Evidence is not the first placement because the current API returns a generated briefing/answer payload, not a persisted File Cabinet artifact.
- The global phase workspace is already dense after the P1 repairs; always-on placement would bury the task workflow.

Mount prerequisites:

- Add visible `AI Draft` and edit-before-commit framing before the briefing can be reused in artifacts.
- Add credentialed fetches in the panel.
- Decide whether generated briefs should persist as File Cabinet artifacts before exposing "save/export" behavior.
- Add a focused test for P2-only surfacing and cited answer rendering.

Recommended first implementation:

- Server-render P2 current-state with a compact "CXO current-state brief" affordance below `CurrentStateReadinessPanel`.
- Open `NexusCurrentStateBriefingPanel` in an inline drawer/rail only for P2 current-state/findings.
- Keep it read-only/generative until persisted artifact semantics are defined.

## 3. `MoveToSourceHandoffCta`

Decision: do not return it to the retired Move overview tab. Product placement is the P3 gate/decision handoff, after the sourcing-strategy deliverable exists and before the P4 plan opens.

Why this placement:

- The old `/strategic-moves/[moveId]` overview route redirects to the phase workspace, so the component's own comment points at a dead surface.
- The handoff is consequential: it can create a Source event. It belongs next to the human-reviewed sourcing strategy and gate approval, not in a passive overview card.
- P3 is where build/buy/partner and external-scope decisions are made. P5 is too late for the initial Source event.

Mount prerequisites:

- Compute `runMoveToSourceHandoff(move)` server-side in the P3 phase page or a dedicated server adapter.
- Resolve any existing Source event linked to the Move before rendering.
- Add an explicit human rationale/evidence packet to the Source-event creation path for AI-suggested events, matching `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`.
- Keep the action hidden unless the trigger disposition is `sourcing_required` and the sourcing-strategy deliverable is available or gate-approved.

Recommended first implementation:

- Render a compact "Source handoff" card in the P3 approve/gate area after successful gate approval.
- Use the existing `MoveToSourceHandoffCta` only after updating its copy away from "Overview tab" assumptions and adding the required rationale/evidence control.

## Non-Decision Inventory

`DeliverableArtifactCard` remains orphan inventory, not a repair finding. The live File Cabinet and workspace explorer already expose generated artifacts through current routes.

`ResolveDecisionButton` remains stale. P0 close/advance is owned by `/api/v1/programs/:programId/phase-gate-approval`.
