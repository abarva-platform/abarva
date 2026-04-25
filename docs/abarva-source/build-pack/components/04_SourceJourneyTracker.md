# 04 SourceJourneyTracker

## 1. Component Purpose

`SourceJourneyTracker` visualizes the universal Source workflow and enforces stage state awareness. It must show current position, blocked gates, completed work, reopened stages, and locked future stages.

## 2. Primary Users

- Sourcing lead
- PMO lead
- Procurement leader
- Executive sponsor

## 3. Primary User Question

"Where are we in the lifecycle, and what blocks the next stage?"

## 4. Business Role In The Product

The tracker prevents sourcing work from becoming a set of disconnected pages. It gives every event a shared journey model and makes gate status visible.

## 5. Information Hierarchy

- First: active stage and state.
- Second: completed prior stages and next locked stage.
- Third: readiness or approval requirement.
- Hidden: detailed gate checklist, which belongs in stage panel or Steward drawer later.

## 6. Visual Hierarchy

- Active stage has the strongest treatment.
- Blocked and Needs Approval states are visible but calm.
- Completed stages are subdued.
- Locked stages show a clear locked state with prerequisite on interaction.

## 7. Layout Zones

- Tracker label.
- Stage sequence.
- State badges.
- Readiness/gate summary.
- Optional prerequisite tooltip/popover later.

## 8. Data Required

- Ordered WorkflowStage list.
- Stage state: Not Started, Active, Complete, Blocked, Needs Approval, Reopened.
- Active stage id.
- Readiness score.
- Gate status and prerequisite text.

## 9. Empty State

If no workflow stages are available, show "Workflow stages unavailable" and keep the event header visible. This is an error-like configuration state, not a blank tracker.

## 10. Loading State

Show skeleton stage chips in the expected count to avoid layout jump.

## 11. Error State

Show "Journey could not be resolved" and prevent stage navigation.

## 12. Interactions

- Completed stages can be viewed.
- Active stage focuses workspace.
- Locked future stages show prerequisites.
- Reopened stages show reopening reason.
- Blocked stages link to missing inputs or alerts.

## 13. Nexus Role

Nexus uses the tracker state to explain why the event can or cannot advance and what must happen before the next gate.

## 14. Agent Handoffs If Applicable

Steward owns formal gate enforcement. Nexus may ask Steward whether a stage is ready, but the UI should not pretend a gate is clear without Steward-ready data.

## 15. Accessibility Notes

- Stages should be keyboard reachable.
- Current stage should use `aria-current` or equivalent.
- Locked state must be text-described.
- Color cannot be the only state indicator.

## 16. Responsive Behavior

- Desktop: horizontal sequence.
- Tablet: scrollable horizontal sequence.
- Mobile: compact current/next summary plus expandable full journey.

## 17. Design Anti-Patterns

- Do not make the tracker decorative.
- Do not show a percent complete without gate logic.
- Do not allow skipping locked stages.
- Do not hide blockers behind hover-only UI.

## 18. Acceptance Criteria

- Includes all 10 universal workflow stages.
- Shows all required states.
- Explains locked future-stage prerequisites.
- Displays readiness for active stage.
- Connects selected stage to the active workspace.

## 19. Implementation Notes

Use `src/lib/source/lifecycle.ts` for state transitions and stage lock logic. The tracker should receive state data, not infer business rules from labels.

## 20. Files To Modify

- `src/components/source/SourceJourneyTracker.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/lifecycle.ts`

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
