# Source Dashboard Light Visual Refinement Review

Date: 2026-04-25

## Scope

This slice refines the authenticated `/source` dashboard visual language after screenshot review. It does not change Source data models, routing, APIs, agent behavior, workflow logic, or persistence.

## Files Changed

- `src/components/source/AbarVaSourceDashboard.tsx`
- `src/components/source/SourcingEventTable.tsx`
- `src/components/source/SourceAlertPanel.tsx`
- `src/components/source/EventLifecycleStatusBadge.tsx`
- `CYCLE_STATE.md`
- `docs/abarva-source/build-pack/implementation-reviews/17_SOURCE_DASHBOARD_LIGHT_VISUAL_REFINEMENT_REVIEW.md`

## Before / After Design Intent

Before this slice, the authenticated dashboard had strong sourcing intelligence and a clear command read, but the primary canvas was too dark and heavy for AbarVa's intended premium, off-white, Apple-like workbench direction. The first viewport leaned toward a dark command center and placed the event table too far below the fold.

After this slice, the dashboard keeps the strong command-read content while shifting the overall surface to a warmer, lighter, data-forward composition. The event table now appears earlier in the page, pressure signals are more compact, and dark treatment is reserved for the high-impact Source Command Read panel.

## What Was Made Lighter

- Changed the dashboard shell to a warm off-white page canvas.
- Converted the KPI strip to compact light cards with dark navy typography.
- Converted Executive Pressure Signals to a crisp light priority list.
- Converted the Live Sourcing Events table to a light table variant for the dashboard.
- Reduced visual weight in table rows, metadata, and action links while preserving value-at-risk salience.
- Moved the table above the portfolio posture note so event data is visible sooner.

## Dark Elements Retained

- The Source Command Read remains a dark navy panel.
- This dark panel is intentionally retained as the one high-impact executive readout: it anchors urgency, value under management, and the most exposed event without making the whole page feel like dark mode.
- Other Source surfaces keep their existing dark defaults unless explicitly rendered with the new light variant, which avoids changing event canvas or other downstream views.

## Table Visibility Improvement

The Live Sourcing Events table now appears immediately after the command read, pressure signals, and compact KPI strip. This makes the page more portfolio-forward: the user can move from executive signal to event-level operating queue without scrolling through a separate posture block first.

## Visual Tradeoffs

- The dashboard is now more aligned with the warm, premium AbarVa direction, but authenticated screenshot review should still confirm exact fold behavior on the user's display.
- The command read remains dark to preserve the "decisive sourcing lead" tone; future polish may soften its shadow or compact it further if it still dominates the viewport.
- Light variants were added to reusable Source components with dark defaults preserved, limiting blast radius outside the dashboard.

## Validation Results

- `npx eslint src/components/source/AbarVaSourceDashboard.tsx src/components/source/SourcingEventTable.tsx src/components/source/SourceAlertPanel.tsx src/components/source/EventLifecycleStatusBadge.tsx src/components/source/foundationStyles.ts src/lib/source/mock-seed.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Screenshot / Manual Review Status

- Authenticated screenshot review was provided by the user before this slice and identified the dashboard as conceptually strong but too dark/heavy.
- Codex attempted local browser review at `/source` after implementation. The app correctly routed to `/sign-in?redirect=%2Fsource`, but Codex did not have an authenticated session to capture the rendered dashboard.
- Manual authenticated screenshot review is recommended after this PR is merged.

## Out-of-Scope Confirmation

No event canvas, chat UI, API routes, model calls, upload/parsing, scorecard UI, artifact drawer, value ledger UI, workflow engine, approval engine, vendor flow, AI/RFP generation, `/programs`, `/preview`, or `/demo` work was implemented.

