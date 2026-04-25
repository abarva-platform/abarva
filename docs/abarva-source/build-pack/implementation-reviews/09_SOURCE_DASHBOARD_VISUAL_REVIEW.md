# 09 Source Dashboard Visual Review

Date: 2026-04-24

Status: Review only. No dashboard refinements, UI implementation, API routes, model calls, upload/parsing, or workflow expansion were performed.

## 1. Review Context

- Route reviewed: `/source`
- Review method: browser auth check plus static/code review.
- Browser status: local app was started on `http://localhost:3025` with `next dev --webpack --port 3025`; navigating to `/source` redirected to Clerk sign-in at `https://boss-griffon-61.accounts.dev/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3025%2Fsource`.
- Screenshot status: no dashboard screenshot was captured because the dashboard was blocked by auth. The visible browser surface was the Clerk sign-in page, not the Source dashboard.
- Current dashboard components involved:
  - `src/app/(maestro)/source/page.tsx`
  - `src/components/source/SourceFoundationShell.tsx`
  - `src/components/source/AbarVaSourceDashboard.tsx`
  - `src/components/source/SourcingEventTable.tsx`
  - `src/components/source/SourceAlertPanel.tsx`
  - `src/components/source/EventLifecycleStatusBadge.tsx`
  - `src/components/AbarvaNav.tsx`
  - `src/components/chrome/PrimaryNav.tsx`
- Data shown:
  - Three seeded sourcing events.
  - Portfolio metrics: 3 active events, 2 waiting events, 1 at-risk event, 2 decisions needed, `$63.3M` value at stake.
  - Seeded events:
    - Data & AI Modernization SI Selection: Waiting on Client, Scope, Client PMO Lead, 12 days aging, `$18.5M`, at risk.
    - AMS Consolidation Assessment: Active, Sourcing Strategy, CIO Office, 3 days aging, `$42.0M`.
    - Digital App Build Partner Selection: Waiting on Vendor, Vendor Responses, Procurement Lead, 6 days aging, `$2.8M`.

## 2. Screenshot / Manual Review Notes

Dashboard screenshot capture was not possible in this run because `/source` redirected to Clerk sign-in. This is expected in the current protected app environment and should not be treated as a dashboard defect.

Manual review route:

- `/source`

Recommended manual review steps after sign-in:

1. Confirm top navigation order: Home, Programs, Source, Intelligence, Control Tower, Platform.
2. Confirm Source is active in the top nav.
3. Confirm first viewport shows the Source header, tabs, portfolio summary, KPI cards, Nexus portfolio read, and decisions needed without awkward overlap.
4. Confirm whether the event table is visible soon enough without excessive scrolling.
5. Confirm event table readability on desktop and medium-width screens.
6. Confirm mobile/narrow behavior, especially table horizontal scroll and action-label fit.

## 3. Dashboard Quality Assessment

| Criterion | Assessment | Notes |
| --- | --- | --- |
| Premium enterprise feel | Mostly meets | The dark shell, restrained color system, serif metric treatment, and compact mono labels feel credible. It still reads somewhat like a well-structured prototype rather than a fully polished operating cockpit. |
| Clear information hierarchy | Partially meets | Header, KPIs, Nexus read, alert panel, and table are logically ordered. However, the event table is the core operating surface and may sit too low after header, description, four KPI cards, and a large Nexus panel. |
| Clear value at stake | Meets | `$63.3M` total value and per-event value are explicit. The dashboard can better explain which value is most exposed by risk versus simply total value. |
| Clear next action | Meets | Each event has a next action and the alert panel includes action labels. This is one of the strongest parts of the dashboard. |
| Clear event status | Meets | Lifecycle badges, at-risk pill, current stage, and blocker text make status legible. |
| Clear owner / aging / blocker | Meets | Owner and aging are dedicated table fields; blockers are visible in the event column. Alerts include owners. |
| Calm density | Mostly meets | Density is controlled and avoids noisy charting. The main risk is stacked cards before the table, not visual chaos. |
| No card spam | Partially meets | Four KPI cards plus a large Nexus card plus alert items plus a table card is acceptable, but close to feeling too card-heavy for a first viewport. |
| No procurement-portal feel | Mostly meets | The Nexus summary, value-at-stake framing, archetypes, and stage language differentiate it from a plain procurement tracker. The table could still drift portal-like if not visually elevated. |
| No generic chatbot feel | Meets for now | Nexus is presented as a deterministic portfolio read and alert layer, not a blank prompt box. Good restraint. |
| Nexus alert usefulness | Meets | Alerts name the issue, owner, and action. Adding aging/due date directly into alert metadata would make them sharper later. |
| Table readability | Mostly meets on desktop; risk on smaller screens | The table is specific and operational. `minWidth: 1080` means medium and mobile screens will rely on horizontal scroll, which should be manually checked. |
| Nav placement | Meets | Source appears as a first-class nav item between Programs and Intelligence in both operator nav definitions. The label is correctly `Source`, not `AbarVa Source`. |

## 4. What Works

- Source is positioned as a first-class product surface in the operator nav.
- The page does not overreach into fake AI, live generation, or unbuilt workflow behavior.
- The seeded portfolio communicates useful operating facts: status, stage, owner, aging, blocker, next action, and value.
- The dashboard distinguishes portfolio-level summary from event-level operating detail.
- Nexus is framed as an operating intelligence layer through portfolio read and decisions-needed alerts, not as a generic chatbot prompt.
- Value at stake is visible both at portfolio level and event level.
- The three seeded events are meaningfully different: one at-risk client wait, one healthy strategy event, and one vendor-response wait.
- The page avoids overbuilt charts and decorative visuals.
- Component separation is clean enough to support bounded dashboard refinements.

## 5. What Feels Weak

- The first viewport may be too stacked: product header, portfolio description, four KPI cards, and a large Nexus panel appear before the event table.
- The event table is probably the most decisive dashboard element, but it may not receive enough first-viewport priority.
- The KPI label "Active Events" counts all three events, including waiting events. "Live Events" or "Open Events" may be clearer in a future refinement.
- The table intro copy says "the next action that should happen next," which should be tightened.
- The dashboard shows total value clearly, but does not yet make the value-risk relationship decisive: the largest value event is not the at-risk event.
- The alert panel is useful, but owner/action are stronger than due-date/aging pressure. Aging appears in the table but not directly in the alert card.
- The table's `minWidth: 1080` creates a likely horizontal-scroll dependency on smaller screens.
- The dashboard is credible, but it still has a slight scaffold feel because the hierarchy is built from generic cards rather than one unmistakable Source command surface.

## 6. Recommended Refinements

### Must Fix Before Next UI Slice

- Tighten the dashboard front-door hierarchy so the operating surface answers "what needs attention?" and "what should happen next?" faster.
- Bring event comparison higher or make it visually more central; the event table should not feel secondary to generic KPI cards.
- Clarify the "Active Events" metric label so waiting events are not semantically counted as active work without explanation.
- Fix the repeated wording in the event table description: "next action that should happen next."

### Should Improve Soon

- Add more direct value-risk framing: make it clear whether the highest-value event, the most-at-risk event, or the most-aged event should be handled first.
- Add alert-level aging/due-date pressure where available.
- Reduce card-stack feel by tightening KPI cards or combining the portfolio read and attention list into a more decisive command band.
- Confirm responsive behavior for the table and long action labels after authenticated browser access is available.
- Consider changing the table's "Open" action placement so the primary action feels less like a generic details link and more like the next operating move.

### Can Defer

- Advanced charting, trend lines, and portfolio analytics.
- Full dashboard mobile redesign, as long as no severe overflow is found during manual review.
- Event canvas entry points beyond the existing "Open event" link.
- File, scorecard, artifact, value ledger, and vendor response expansions.

## 7. Final Dashboard Decision

Decision: approve with small refinements.

The current dashboard is good enough to keep as the Source front door direction. It is not a redesign candidate. The right next move is a small, bounded dashboard refinement pass focused on hierarchy, copy, and decision salience before moving into event canvas or chat surfaces.

## 8. Recommended Next Slice

Recommended next slice: Source dashboard front-door refinement only.

Scope should be tightly limited to:

- First-viewport hierarchy.
- KPI label/copy clarity.
- Event table intro copy.
- Value-at-risk / next-action emphasis.
- Alert card pressure signals, using existing seeded fields only.
- Responsive fit checks for the existing dashboard.

Do not recommend the Nexus Engagement Canvas or event canvas until the dashboard front door is visually approved after this refinement pass.

## 9. Do-Not-Build Reminder

This review did not implement:

- Dashboard UI changes.
- Chat UI.
- API routes.
- Model calls.
- Upload/parsing.
- Event canvas expansion.
- Scorecard UI.
- Artifact drawer.
- Value ledger UI.
- Vendor response flow.
- AI/RFP generation.
- `/programs` integration.
- `/preview` or `/demo` surfaces.

