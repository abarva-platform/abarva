# Next Slice Plan: Source Dashboard Front-Door Refinement

Date: 2026-04-25

Status: planning only. Do not implement dashboard refinements until explicitly approved.

## 1. Purpose Of The Dashboard Refinement Slice

Refine the current `/source` dashboard front door so it feels more decisive, premium, and operator-ready without expanding Source scope.

The slice should make the dashboard answer these questions faster:

- What needs attention?
- Which sourcing event is most exposed?
- What value is at stake?
- Who owns the next action?
- What is aging, blocked, or waiting?

This is a bounded refinement pass, not a redesign and not a new Source surface.

## 2. Inputs From 09_SOURCE_DASHBOARD_VISUAL_REVIEW.md

The visual review decision was:

- Approve with small refinements.

Key findings to carry forward:

- The dashboard direction is credible and should not be redesigned.
- Source already appears as a first-class operator nav item.
- Nexus is framed as deterministic operating intelligence, not a generic chatbot.
- Value, owner, aging, blocker, status, and next action are present.
- The first viewport may be too stacked before the event table appears.
- The event table is the most decisive operating surface and should feel more central.
- The "Active Events" KPI can be semantically confusing because waiting events are included.
- The event table intro repeats "next action that should happen next."
- The dashboard shows total value, but value-at-risk prioritization is not yet decisive.
- Alert cards should surface pressure signals more sharply where seeded data supports it.
- Table horizontal scrolling and long action labels need responsive/manual review.

## 3. Specific Refinements To Make

Keep refinements limited to existing dashboard data and existing Source components.

Recommended implementation refinements:

- Tighten first-viewport hierarchy so the dashboard leads with attention, value at risk, and next action clarity.
- Rename or clarify the "Active Events" metric if it includes waiting events; likely direction: "Live Events" or "Open Events."
- Make the most important event comparison visible earlier or more visually central.
- Improve the Nexus portfolio read so it feels like an operating command summary, not a decorative text block.
- Surface value-at-risk or risk-weighted attention using existing seeded fields only.
- Add alert pressure signals from existing data where available, such as owner, aging, waiting state, or action label.
- Tighten table intro copy and remove repeated phrasing.
- Preserve the three seeded event comparison:
  - Data & AI Modernization SI Selection: at risk, waiting on client, `$18.5M`.
  - AMS Consolidation Assessment: active, `$42.0M`.
  - Digital App Build Partner Selection: waiting on vendor, `$2.8M`.
- Check responsive fit for KPI cards, alert cards, table scroll, long event names, long next actions, and action links.

Do not invent new event data, live AI behavior, generated artifacts, uploaded-file state, or persistence.

## 4. Files Likely To Change

Likely implementation files:

- `src/components/source/AbarVaSourceDashboard.tsx`
- `src/components/source/SourcingEventTable.tsx`
- `src/components/source/SourceAlertPanel.tsx`
- `src/components/source/foundationStyles.ts` if spacing or existing dashboard style primitives need small adjustments.

Possible data/copy file only if strictly needed:

- `src/lib/source/mock-seed.ts` for deterministic copy/label changes only, not new product behavior.
- `src/lib/source/types.ts` only if a tiny existing-field typing gap blocks pressure-signal display.

Expected review packet after implementation:

- `docs/abarva-source/build-pack/implementation-reviews/10_SOURCE_DASHBOARD_REFINEMENT_REVIEW.md`

Do not modify:

- event detail pages
- event canvas components
- scorecard UI components
- artifact drawer components
- value ledger UI components
- vendor response flow
- API routes
- model/runtime files
- `/programs`, `/preview`, or `/demo`

## 5. What Must Not Change

This slice must not build or modify:

- Event canvas.
- Chat UI.
- API routes.
- Model calls.
- Upload/parsing.
- Scorecard UI.
- Artifact drawer.
- Value ledger UI.
- Vendor response workflow.
- AI/RFP generation.
- `/programs` integration.
- `/preview` or `/demo` surfaces.
- `ProgramSurface`.
- `src/lib/programs/mock.ts`.

This slice must not imply:

- Live Nexus model responses.
- Live RFP generation.
- Real uploaded-file parsing.
- Real persistence beyond current seeded Source data.
- Production-ready workflow automation.

## 6. Acceptance Criteria

The refinement slice is acceptable when:

- `/source` still loads through the existing route family.
- Source remains first-class in operator navigation.
- The first viewport communicates portfolio attention faster than before.
- KPI labels are semantically accurate.
- Value at stake is still visible, and risk/value priority is clearer.
- Event table copy is tightened.
- The three seeded events remain visible and comparable.
- Next action, owner, aging, blocker, lifecycle status, and value are clearer, not less visible.
- Nexus content remains deterministic and does not imply live AI/model behavior.
- No new Source surface is introduced.
- No event canvas, scorecard, artifact drawer, value ledger, vendor workflow, upload, API, or model work is introduced.
- Text fits in the refined layout at desktop and narrow widths.
- The final review packet documents changes, screenshots/manual review notes, validation, and remaining risks.

## 7. Screenshot / Manual Review Requirement After Implementation

After implementation, the dashboard must be reviewed again.

Preferred review:

1. Start the local app.
2. Navigate to `/source`.
3. Sign in if needed.
4. Capture or inspect desktop view.
5. Capture or inspect narrow/mobile view.
6. Confirm no text overlap or incoherent stacking.
7. Confirm event table salience improved.
8. Confirm no scope creep into unapproved Source surfaces.

If browser preview is blocked by Clerk/auth:

- Record the exact redirect behavior.
- Perform code/static review.
- Provide exact route for manual review: `/source`.
- Do not treat auth redirect as a dashboard failure.

## 8. Validation Commands

Run focused validation after implementation:

```bash
npx eslint src/components/source/AbarVaSourceDashboard.tsx src/components/source/SourcingEventTable.tsx src/components/source/SourceAlertPanel.tsx src/components/source/foundationStyles.ts src/lib/source/mock-seed.ts src/lib/source/types.ts
npx tsc --noEmit --pretty false
```

If any listed file was not changed and does not need validation, the command may be narrowed, but `tsc` should still run.

If a browser/manual review is possible, record:

- Route reviewed: `/source`
- Browser/screenshot status
- Desktop findings
- Narrow/mobile findings
- Remaining visual risks

