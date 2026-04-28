# 08 SourceAlertPanel

## 1. Component Purpose

`SourceAlertPanel` displays sourcing-event alerts across the dashboard and event canvas. Alerts should name the issue, owner, aging, severity, event, and next action.

## 2. Primary Users

- CIO
- Procurement leader
- Sourcing lead
- PMO lead
- Event owner

## 3. Primary User Question

"What needs attention now, who owns it, and how urgent is it?"

## 4. Business Role In The Product

Alerts convert lifecycle state into operational focus. They prevent sourcing work from silently aging in waiting states.

## 5. Information Hierarchy

- First: severity, event, alert message.
- Second: owner, aging, next action.
- Third: source trigger and related stage.
- Hidden: full audit history until needed.

## 6. Visual Hierarchy

- Severity is clear and textual.
- Critical alerts lead the list.
- Alert content is sentence-like and actionable.
- Owner and next action are visible.

## 7. Layout Zones

- Panel header.
- Alert rows/cards.
- Empty state.
- Optional filter later.

## 8. Data Required

- SourceAlert id, eventId, severity, type, message, owner, agingDays, nextAction, relatedStage, createdAt.

## 9. Empty State

Show "No Source alerts need attention" with a small explanation that Nexus will surface blockers, overdue inputs, and approval risks here.

## 10. Loading State

Skeleton alert rows.

## 11. Error State

Show "Alerts could not load" but do not block the event table or canvas.

## 12. Interactions

- Alert click focuses the event row or routes to the event canvas later.
- In event canvas, alert click focuses the relevant stage/workspace.
- Dismiss is not available until alert ownership and audit rules are defined.

## 13. Nexus Role

Nexus prioritizes and phrases alerts in decision-oriented language, including what is missing and why it matters.

## 14. Agent Handoffs If Applicable

Sentinel may validate evidence-related alerts. Steward may validate gate and approval alerts. Atlas may receive escalated executive summaries.

## 15. Accessibility Notes

- Severity text must be present.
- Alert cards require clear headings.
- Actions must be keyboard reachable.

## 16. Responsive Behavior

- Dashboard: full-width alert panel above event table.
- Event canvas: compact alert strip or right-rail section.
- Mobile: stacked alert cards.

## 17. Design Anti-Patterns

- Do not create a noisy notification feed.
- Do not show stale alerts with no owner.
- Do not let alerts be color-only.
- Do not allow dismiss without persistence/audit.

## 18. Acceptance Criteria

- Shows missing input aging, vendor response overdue, procurement review overdue, executive approval pending, scorecard not locked, artifact needs review, RFP package missing inputs, at-risk threshold, and value ledger owner alerts as supported types.
- Shows severity, owner, aging, next action, event, and stage.
- Supports dashboard and canvas contexts.

## 19. Implementation Notes

Alert generation rules belong in `src/lib/source/lifecycle.ts` or `src/lib/source/queries.ts`, not inside the component.

## 20. Files To Modify

- `src/components/source/SourceAlertPanel.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/lifecycle.ts`

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
