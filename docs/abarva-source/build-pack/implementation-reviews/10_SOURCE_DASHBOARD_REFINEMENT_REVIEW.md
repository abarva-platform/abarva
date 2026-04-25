# Source Dashboard Refinement Review

Date: 2026-04-25

## 1. Files Changed

- `src/components/source/AbarVaSourceDashboard.tsx`
- `src/components/source/SourcingEventTable.tsx`
- `src/components/source/SourceAlertPanel.tsx`
- `src/components/source/EventLifecycleStatusBadge.tsx`
- `CYCLE_STATE.md`

No Source seed data, API route, model runtime, upload/parsing, workflow engine, approval engine, artifact versioning, document export/import, `/programs`, `/preview`, or `/demo` files were changed.

## 2. What Was Refined

The `/source` dashboard front door now puts the highest-signal operating read first:

- Added a first-viewport Source command read that names at-risk events, waiting/blocked states, and total value under management.
- Added a most-exposed-event summary using existing seeded event data: event name, owner, aging, exposed value, and next action.
- Reframed the KPI strip around `Active Events`, `Waiting / Blocked`, `At Risk`, and `Value At Stake`.
- Added value-in-waiting/blocked context under the Value At Stake KPI.
- Moved the alert panel into a first-viewport executive pressure role.
- Enriched alert rows with affected event, owner, aging, lifecycle status, exposed value, blocker, and recommended action where seeded data exists.
- Tightened the event table heading and copy.
- Increased event-name weight and table scanability.
- Added alert count, status pressure, owner/aging pressure, and exposed-value emphasis in the event table.
- Improved responsive fit by using `auto-fit` grid tracks and reducing the table minimum width slightly while preserving horizontal scroll.

## 3. Before / After Intent

Before this slice, the dashboard already exposed useful data, but the first viewport read more like a scaffolded portfolio summary. The event table carried much of the operating truth, but it appeared after a stacked summary/KPI/alert structure.

After this slice, the dashboard should answer faster:

- What needs attention?
- What value is exposed?
- Who owns the pressure point?
- How old is the blocker or waiting state?
- What should happen next?

The intent is a more decisive Source front door, not a redesign and not a new workflow surface.

## 4. Visual Tradeoffs

- The command read adds a stronger first-viewport statement, but it also makes the top section denser. This is intentional because Source is an operator workbench, not a marketing page.
- Alert cards now carry more metadata, which improves executive pressure signals but may need later visual tuning once real client data produces longer event names or blocker text.
- The table still uses horizontal scroll at narrower widths. That is acceptable for this slice because the event table is dense operational data and no mobile-specific redesign was approved.
- The value-at-risk emphasis uses existing seeded state only. It does not infer new risk weighting or invent client evidence.

## 5. Validation Results

Final validation passed:

```bash
npx eslint src/components/source/AbarVaSourceDashboard.tsx src/components/source/SourcingEventTable.tsx src/components/source/SourceAlertPanel.tsx src/components/source/EventLifecycleStatusBadge.tsx src/components/source/foundationStyles.ts src/lib/source/mock-seed.ts
npx tsc --noEmit --pretty false
```

Implementation note: the temporary `/tmp` worktree used a symlink to the main checkout's `node_modules` for validation. Turbopack cannot serve from that symlinked dependency layout, so browser preview was retried with `next dev --webpack`.

## 6. Screenshot / Manual Review Status

Browser preview was attempted at:

- Route: `/source`
- Local URL: `http://localhost:3028/source`
- Dev server mode: `next dev --webpack -p 3028`

The route compiled and returned `GET /source 200`, then redirected to Clerk sign-in:

`https://actual-ox-3.accounts.dev/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3028%2Fsource`

An authenticated dashboard screenshot was not captured because the browser was blocked at Clerk sign-in. The review for this slice is therefore code/static plus browser-auth-check based. Manual authenticated review should inspect `/source` after sign-in for:

- top command read fit
- KPI strip scanability
- alert metadata wrapping
- table horizontal scroll behavior
- no text overlap at desktop and narrow widths

## 7. Out-Of-Scope Confirmation

This slice did not implement:

- event canvas expansion
- chat UI
- API routes
- model calls
- upload/parsing
- scorecard UI
- artifact drawer UI
- value ledger UI
- vendor flow
- AI/RFP generation
- workflow engine
- approval engine
- artifact versioning
- document export/import
- `/programs`, `/preview`, or `/demo` work

## 8. Ready For PR

Yes. The slice is ready for PR as a bounded dashboard front-door refinement, pending authenticated visual review by a user with Clerk access.
