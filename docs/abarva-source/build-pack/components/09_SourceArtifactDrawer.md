# 09 SourceArtifactDrawer

## 1. Component Purpose

`SourceArtifactDrawer` shows event artifacts in context, including status, tier, confidence, owner, required inputs, citations, and primary action.

## 2. Primary Users

- Sourcing lead
- Procurement leader
- Legal/compliance reviewer
- Executive sponsor reviewing outputs

## 3. Primary User Question

"Which artifacts exist, which need work, and which can I open or review?"

## 4. Business Role In The Product

The drawer connects the workflow to Artifact Studio without forcing users out of the event canvas. It also prevents fake or premature artifact conclusions by showing prerequisites and status.

## 5. Information Hierarchy

- First: artifacts needing review or inputs.
- Second: artifact status, tier, confidence, owner.
- Third: required inputs and citations.
- Hidden: full artifact body, edit controls, export until approved.

## 6. Visual Hierarchy

- Drawer title and counts lead.
- Needs Review and Needs Inputs artifacts are highest priority.
- Stub artifacts are subdued but honest.
- Primary action is clear per artifact.

## 7. Layout Zones

- Drawer header.
- Artifact summary counts.
- Artifact list.
- Artifact metadata.
- Primary actions.
- Stub/prerequisite explanation.

## 8. Data Required

- Artifact id, eventId, type, title, status, tier, confidence, owner, requiredInputs, citationCount, route, lockedReason.

## 9. Empty State

Show "No artifacts have been generated for this event yet" and explain which stage creates the first artifact. Do not show "coming soon."

## 10. Loading State

Skeleton artifact cards.

## 11. Error State

Show "Artifacts could not load" inside the drawer and keep close control available.

## 12. Interactions

- Drawer open/close.
- Artifact open routes to `/source/events/[eventId]/artifacts/[artifactId]` after approval.
- Missing input action focuses active workspace.
- Stub artifact click shows prerequisites, not fake content.

## 13. Nexus Role

Nexus explains which artifact should be reviewed or generated next and whether it is safe to use.

## 14. Agent Handoffs If Applicable

Sentinel validates citations. Atlas supports executive memo synthesis. Steward enforces review/approval/lock rules.

## 15. Accessibility Notes

- Drawer needs focus management.
- Close control must be keyboard reachable.
- Artifact cards need labeled statuses.
- Screen reader users should know they are inside a drawer.

## 16. Responsive Behavior

- Desktop: side drawer.
- Tablet: wider side sheet.
- Mobile: full-screen sheet.

## 17. Design Anti-Patterns

- Do not show fake artifact previews.
- Do not include AI generation controls before generation model approval.
- Do not hide required inputs.
- Do not export incomplete artifacts as decision-grade.

## 18. Acceptance Criteria

- Shows artifact list with status, tier, confidence, owner, required inputs, citations placeholder, and primary action.
- Stub behavior is explicit and dignified.
- Drawer preserves event context.
- Does not implement artifact generation or full editing.

## 19. Implementation Notes

Use a typed artifact summary model. Full artifact rendering belongs to the artifact route after review.

## 20. Files To Modify

- `src/components/source/SourceArtifactDrawer.tsx`
- `src/lib/source/types.ts`
- `src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx` only when artifact route implementation is approved.

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
