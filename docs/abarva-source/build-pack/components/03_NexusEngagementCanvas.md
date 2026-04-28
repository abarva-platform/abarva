# 03 NexusEngagementCanvas

## 1. Component Purpose

`NexusEngagementCanvas` is the main workspace shell for a single sourcing event. It composes event header, journey tracker, stage panel, active stage workspace, persistent Nexus panel, artifact entry point, scorecard link, and value context.

## 2. Primary Users

- Sourcing lead
- CIO or CTO delegate
- Procurement leader
- PMO/transformation lead
- Executive sponsor during reviews

## 3. Primary User Question

"Where is this event, what is missing, and what should happen next?"

## 4. Business Role In The Product

The canvas is where Source becomes a workflow product rather than a dashboard. It is the operating room for one sourcing event and the primary place Nexus leads the work.

## 5. Information Hierarchy

- First: event identity, lifecycle status, value, owner, current stage, next action.
- Second: journey tracker and gate readiness.
- Third: active stage workspace and Nexus recommendation.
- Secondary: artifacts, scorecard, and value ledger entry points.
- Hidden: full artifact bodies, editable scorecard internals, vendor responses until those surfaces are approved.

## 6. Visual Hierarchy

- Event header is authoritative and compact.
- Journey tracker shows progression and blockers.
- Center workspace is the working area.
- Right rail has advisory authority but not visual noise.
- Utility actions stay connected to the event.

## 7. Layout Zones

- Event header.
- SourceJourneyTracker.
- Left SourceStagePanel.
- Center SourceActiveStageWorkspace.
- Right PersistentNexusPanel.
- Artifact drawer trigger and utility strip.

## 8. Data Required

- SourcingEvent.
- WorkflowStage list and stage states.
- Current StageGate and readiness score.
- RequiredInput list.
- SourceAlert list.
- Artifact summary list.
- Scorecard status.
- Projected value summary.
- Nexus guidance object.

## 9. Empty State

If eventId is not found, show a not-found event state with link back to `/source/events`. Do not show a fake event.

## 10. Loading State

Render event header skeleton, journey tracker skeleton, and three-column workspace skeleton.

## 11. Error State

Render a recoverable event error with eventId and route back to the Source dashboard. Do not render partial cross-event data.

## 12. Interactions

- Stage selection updates current stage context if unlocked.
- Locked stage click shows prerequisite explanation.
- Artifact trigger opens SourceArtifactDrawer.
- Scorecard link routes to `/source/events/[eventId]/scorecard` after approval.
- Nexus actions focus relevant workspace sections.

## 13. Nexus Role

Nexus is the lead sourcing agent for the canvas. It explains stage status, missing inputs, risks, next action, artifact readiness, and what cannot be trusted yet.

## 14. Agent Handoffs If Applicable

- Sentinel validates evidence and risk.
- Atlas prepares executive summaries and decision memos.
- Steward enforces gate readiness and approval rules.

## 15. Accessibility Notes

- The three-column layout must preserve logical reading order.
- Journey tracker stages must be keyboard reachable.
- Drawer triggers need explicit labels.
- Status and readiness must be text-readable.

## 16. Responsive Behavior

- Desktop: three-column canvas.
- Tablet: two-column with collapsible stage panel or Nexus panel.
- Mobile: event header, journey summary, Nexus summary, active workspace, expandable panels.

## 17. Design Anti-Patterns

- Do not create a duplicate shell.
- Do not bury current stage.
- Do not show all artifacts and scorecard internals inline.
- Do not make Nexus a passive chatbot.
- Do not allow future-stage work to bypass gates.

## 18. Acceptance Criteria

- Shows event identity, current stage, lifecycle status, value, owner, aging, and next action.
- Composes tracker, stage panel, workspace, Nexus panel, and artifact entry point.
- Locked and blocked states are explicit.
- Does not implement artifact editing, scorecard editing, vendor response flow, or AI generation.

## 19. Implementation Notes

Keep `NexusEngagementCanvas` as an orchestration shell. Child components should own their own display details, and state transition logic should live in `src/lib/source/lifecycle.ts`.

## 20. Files To Modify

- `src/components/source/NexusEngagementCanvas.tsx`
- `src/components/source/SourceJourneyTracker.tsx`
- `src/components/source/SourceStagePanel.tsx`
- `src/components/source/SourceActiveStageWorkspace.tsx`
- `src/components/source/PersistentNexusPanel.tsx`
- `src/components/source/SourceArtifactDrawer.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/lifecycle.ts`
- `src/app/(maestro)/source/events/[eventId]/page.tsx`

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
