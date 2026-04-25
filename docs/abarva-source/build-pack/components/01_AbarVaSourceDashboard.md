# 01 AbarVaSourceDashboard

## 1. Component Purpose

`AbarVaSourceDashboard` is the portfolio-level command surface for AbarVa Source. It summarizes active sourcing events, blocked work, value at stake, decisions needed, and Nexus-prioritized actions.

It orchestrates dashboard sections but must not become a monolithic owner of event table, alert, value ledger, or canvas logic.

## 2. Primary Users

- CIO
- CTO
- CFO
- Procurement leader
- Sourcing lead
- PMO or transformation lead

## 3. Primary User Question

"What sourcing events are active, where are they stuck, what value is at stake, and what action is needed next?"

## 4. Business Role In The Product

The dashboard is the entry point into Source. It turns sourcing work into an executive-readable operating view and directs users into the right event, alert, or decision.

## 5. Information Hierarchy

- First: product context, portfolio status, value at stake, decisions needed.
- Second: Nexus alerts and blocked events.
- Third: event portfolio table/list.
- Secondary: links to value ledger and future Control Tower handoff.
- Hidden: detailed scorecard, artifact body, vendor response details, and long-form event setup.

## 6. Visual Hierarchy

- Title treatment: calm executive page title with short positioning line.
- Status treatment: restrained badges using lifecycle language, not loud colors everywhere.
- Key metric treatment: KPI strip with 4 to 5 compact metrics.
- Alert treatment: concise Nexus alert cards, severity by border and label.
- Table/card density: dense enough for portfolio scanning, not a tiled analytics dashboard.
- Empty state: explain that no sourcing events are active and offer future event creation.
- Loading state: skeleton for KPI strip and 3 rows.
- Error state: preserve shell, explain event portfolio could not load, and offer retry later.

## 7. Layout Zones

- Product header.
- KPI strip.
- Nexus alert panel.
- Event table/list section.
- Optional internal build note only if seed data is not production.

## 8. Data Required

- SourcingEvent id, name, archetype, rigor, stage, status, owner, agingDays, blocker, nextAction, valueAtStake.
- SourceAlert eventId, severity, message, owner, nextAction.
- Aggregates: active count, waiting count, at-risk count, decision count, total projected value.

Golden demo events:

- Data & AI Modernization SI Selection: Enhanced, Scope, Waiting on Client, $18.5M, Client PMO Lead, 12 days, application inventory and current analytics workload baseline missing.
- AMS Consolidation Assessment: Strategic, Sourcing Strategy, Active, $42M, CIO Office, 3 days, no blocker.
- Digital App Build Partner Selection: Standard, Vendor Responses, Waiting on Vendor, $2.8M, Procurement Lead, 6 days, two vendors missing pricing templates.

## 9. Empty State

Show a calm empty portfolio state: "No active sourcing events yet." Explain that Source starts when a sourcing event is classified and scoped by Nexus. Do not show fake chart placeholders.

## 10. Loading State

Use skeleton bars for the page header, KPI strip, alert panel, and event rows. Avoid spinners as the primary experience.

## 11. Error State

Show "Source events could not be loaded" with a practical explanation and a retry affordance later. Do not collapse the full shell.

## 12. Interactions

- Event row click opens `/source/events/[eventId]`.
- Open event action opens the same route.
- Alert click focuses the related event or routes to the event canvas later.
- Value ledger action routes to `/source/value` after value screen approval.

## 13. Nexus Role

Nexus prioritizes alerts and explains why each event is blocked, what decision is needed, and who owns the next action. Nexus does not free-chat on this surface in the first approved slice.

## 14. Agent Handoffs If Applicable

- Sentinel validates evidence gaps behind alerts later.
- Atlas receives dashboard summaries for executive views later.
- Steward enforces gate readiness when a dashboard action would move a stage.

## 15. Accessibility Notes

- KPI values must have text labels, not color-only meaning.
- Alerts need severity labels in text.
- Row actions must be keyboard focusable.
- Table headers must remain semantic if implemented as a table.

## 16. Responsive Behavior

- Desktop: header, KPI strip, alerts, table/list.
- Tablet: KPI strip wraps and table becomes stacked rows.
- Mobile: alerts first, then event cards with key fields only.

## 17. Design Anti-Patterns

- Do not overuse cards.
- Do not create a generic dashboard full of disconnected metrics.
- Do not hide next action.
- Do not show charts before there is a meaningful question.
- Do not make this component own event canvas or table internals.

## 18. Acceptance Criteria

- Shows active, waiting, at-risk, value at stake, and decisions needed.
- Shows Nexus alerts with event, owner, next action, and blocker.
- Shows the three golden demo events with required fields.
- Opens event detail via row/action.
- Does not implement downstream event canvas, scorecard, artifact drawer, value ledger, vendor response flow, or AI generation.

## 19. Implementation Notes

The future implementation should compose `SourcingEventTable` and `SourceAlertPanel`. Keep aggregation logic in `src/lib/source` rather than inline in the page where possible.

## 20. Files To Modify

- `src/components/source/AbarVaSourceDashboard.tsx`
- `src/components/source/SourcingEventTable.tsx`
- `src/components/source/SourceAlertPanel.tsx`
- `src/lib/source/types.ts`
- `src/lib/source/mock-seed.ts` only for the first static slice if persistence is not ready.
- `src/app/(maestro)/source/page.tsx`

## 21. Files Not To Touch

- `src/app/programs/*`
- `src/app/(maestro)/preview/*`
- `src/app/demo/*`
- `src/components/programs/ProgramSurface.tsx`
- `src/lib/programs/mock.ts`
