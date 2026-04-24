# 02 SourcingEventTable

## 1. Component Purpose

`SourcingEventTable` displays sourcing events in a scan-friendly portfolio list. It should make status, stage, rigor, owner, aging, blocker, value, and next action visible without forcing a drill-in.

## 2. Primary Users

- Procurement leader
- Sourcing lead
- PMO lead
- CIO or CFO scanning a portfolio

## 3. Primary User Question

"Which event needs my attention, and why?"

## 4. Business Role In The Product

The table is the dashboard's operating ledger for sourcing events. It directs users into the right event canvas and supports future sorting/filtering without becoming a generic data grid.

## 5. Information Hierarchy

- First: event name, status, stage, next action.
- Second: value at stake, owner, aging, blocker.
- Third: archetype and rigor.
- Hidden until later: vendor count, scorecard detail, artifact list, financial assumptions.

## 6. Visual Hierarchy

- Event name is the row anchor.
- Status and aging show urgency.
- Value is visible but not over-dramatized.
- Next action reads as a sentence, not a button label alone.
- Open action is clear and consistent.

## 7. Layout Zones

- Header row.
- Event identity cell.
- Stage/status cell.
- Rigor/archetype cell.
- Owner/aging cell.
- Value cell.
- Blocker/next action cell.
- Open action cell.

## 8. Data Required

- `SourcingEvent.id`
- `name`
- `archetype`
- `rigorLevel`
- `currentStage`
- `lifecycleStatus`
- `owner`
- `agingDays`
- `blocker`
- `nextAction`
- `projectedValue`

## 9. Empty State

Render a compact message inside the table region: "No sourcing events match this view." If no events exist at all, the parent dashboard owns the broader empty state.

## 10. Loading State

Render 3 to 5 skeleton rows with stable column widths.

## 11. Error State

Render an inline table error: "Event rows could not load." The parent dashboard should retain the KPI and alert areas.

## 12. Interactions

- Row click opens `/source/events/[eventId]`.
- `Open` button opens the same route.
- Future sort should support status, stage, value, aging, and owner.
- Future filter should support status, rigor, archetype, and owner.

## 13. Nexus Role

Nexus determines which row-level alert or blocker gets highlighted, but the table itself should not call agent runtime.

## 14. Agent Handoffs If Applicable

No direct handoff in the first slice. Later, row-level "why blocked" may open Nexus context with Sentinel validation.

## 15. Accessibility Notes

- If implemented as a table, use semantic table markup.
- If implemented as cards on mobile, preserve field labels.
- Open action must have event-specific accessible label.

## 16. Responsive Behavior

- Desktop: table/list hybrid.
- Tablet: horizontal density reduction, with blocker below main row.
- Mobile: event cards with status, next action, value, and open action.

## 17. Design Anti-Patterns

- Do not create a spreadsheet clone.
- Do not include every future sourcing field.
- Do not rely on color-only status.
- Do not bury the next action.
- Do not show vendor evaluation data before evaluation begins.

## 18. Acceptance Criteria

- Shows event, status, stage, rigor, owner, aging, blocker, value at stake, next action, and open action.
- Supports the three golden demo events.
- Does not implement filtering/sorting unless specifically approved.
- Does not own data fetching beyond receiving typed props.

## 19. Implementation Notes

Accept typed event rows from the parent. Prefer a small adapter in `src/lib/source/queries.ts` or `mock-seed.ts` to shape data for display.

## 20. Files To Modify

- `src/components/source/SourcingEventTable.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/mock-seed.ts` only if approved for static seed data.

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
