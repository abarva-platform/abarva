# 01 Source Dashboard Wireframe

## 1. Purpose Of The Screen

The Source Dashboard is the portfolio entry point for AbarVa Source. It answers which sourcing events are active, where they are stuck, what value is at stake, and what action is needed next.

The dashboard should orient an executive or sourcing lead in under 30 seconds without requiring them to open every event.

## 2. Primary User Question

"What sourcing events are active, where are they stuck, what value is at stake, and what action is needed next?"

## 3. Text-Based Wireframe

```text
+--------------------------------------------------------------------------------+
| AbarVa Source                                           Nexus: 3 decisions need |
| AI-led sourcing workbench for technology services decisions.         attention |
| [New event later] [View value ledger] [Open Control Tower later]                |
+--------------------------------------------------------------------------------+
| Active events  3 | Waiting  2 | At risk  1 | Value at stake  $63.3M | Decisions 2 |
+--------------------------------------------------------------------------------+
| Nexus Alerts                                                                    |
| ! Data & AI Modernization SI Selection is aging 12d waiting on client inputs.   |
|   Next: upload application/workload inventory. Owner: Client PMO Lead.          |
| ! Digital App Build Partner Selection has two vendor pricing templates missing. |
+--------------------------------------------------------------------------------+
| Event Portfolio                                                                 |
| Event                               Stage              Status       Value  Action |
| Data & AI Modernization SI Selection Scope              Waiting      $18.5M Open  |
|   Enhanced rigor | Owner: Client PMO Lead | Aging: 12d | Blocker: app inventory  |
| AMS Consolidation Assessment        Sourcing Strategy  Active       $42.0M Open  |
|   Strategic rigor | Owner: CIO Office | Aging: 3d | Next: confirm shortlist     |
| Digital App Build Partner Selection Vendor Responses   Waiting      $2.8M  Open  |
|   Standard rigor | Owner: Procurement Lead | Aging: 6d | Vendor pricing missing  |
+--------------------------------------------------------------------------------+
| Footer note: Data shown is Source seed data until persistence is approved.       |
+--------------------------------------------------------------------------------+
```

## 4. Layout Zones

- Product header: product name, concise positioning, primary navigation actions.
- KPI strip: active events, waiting events, at-risk events, value at stake, decisions needed.
- Nexus alerts: high-signal blockers and decisions, not a generic notification feed.
- Event portfolio: table/list hybrid with one row per sourcing event.
- Future footer/status: optional seed data or persistence note in internal builds only.

## 5. Above-The-Fold Content

- Product name and one-sentence description.
- KPI strip.
- Two highest-priority Nexus alerts.
- First three event rows with open actions.

## 6. Interaction Notes

- `Open` routes to `/source/events/[eventId]`.
- Event row click routes to the same event detail page.
- Alert click should filter or focus the matching event row in the first static version; later it can deep-link to the event canvas.
- KPI clicks can become filters later; do not implement filter behavior until approved.
- `View value ledger` routes to `/source/value` only after the value route is approved.

## 7. Responsive Behavior

- Desktop: full KPI strip and table/list hybrid.
- Tablet: KPI strip wraps to two rows; event rows become denser stacked cards.
- Mobile: product header, alert summary, and event cards only; hide secondary metadata behind expandable sections.

## 8. What Should Not Appear

- No charts in the first dashboard slice.
- No generic procurement portal language.
- No vendor portal entry points.
- No AI generation controls.
- No long-form event creation form.
- No mock labels visible to client users.
- No disconnected decorative cards.

## 9. Acceptance Criteria

- The dashboard clearly shows active, waiting, at-risk, value-at-stake, and decision-needed metrics.
- Each event row shows status, stage, rigor, owner, aging, blocker, value at stake, next action, and an open event action.
- Nexus alerts name the event, blocker, owner, and next action.
- The screen can be understood without opening an event.
- The dashboard does not own the event canvas, scorecard, artifact drawer, or value ledger logic.
