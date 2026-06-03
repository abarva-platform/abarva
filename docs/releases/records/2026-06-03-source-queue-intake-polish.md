# 2026-06-03-source-queue-intake-polish — Decision Queue + intake polish (audit M4)

## Release ID

`2026-06-03-source-queue-intake-polish`

## Status

`candidate`

## Plain-English Summary

Two UX polish items from the Source simplicity audit (Tier 2/4):

1. **Decision Queue entry rail:** Six peer "I have a vendor / renewal / RFP response / business request / I need to cut spend / compare vendors" chips were rendered in a row, competing with the queue cards for the eye. Now collapsed under a single `+ Already mid-stream? Start here` disclosure — zero visual competition with the cards, same affordance one click away.

2. **Intake triple-progress removed:** The new-event intake showed progress three ways simultaneously — a "N of M captured" counter in the context strip, a Capture Queue section showing the same state in a grid, and per-field completion chips. The Capture Queue render and the context-strip counter are removed. The per-field chips remain as the single, in-context progress conveyor.

## Layer Impact

- **global-control-lane**: shared Source UI components. No data, schema, logic, or API change.

## Client Applicability

- All clients. No flag.

## Changes Included

- `src/components/source/SourceDecisionQueueView.tsx` — `EntryRail` replaced from 6 flat chips to a `<details>` collapsed picker.
- `src/components/source/SourceOriginatePage.tsx` — `completedCount` memo removed; context-strip progress counter removed; `<CaptureQueue>` render removed. Component definition retained (unreferenced; future dead-code pass).

## QA / Validation

- `tsc --noEmit` clean on touched files.
- `jest` behaviors (trust gate, language canon, portfolio-metrics) → 11/11 pass.
- `jest` nav test → 13/13 pass.
- UI changes not author-verified in a signed-in browser (auth barrier); copy and structural changes only.

## Rollout Plan

Merge → Vercel deploy.

## Rollback Plan

Revert the PR.

## Audit Evidence

- `reports/2026-06-03-source-simplicity-audit/` — audit M4 (`10-execution-plan.md`), entry-chip finding (`03-clutter-inventory.md` E2/H1), triple-progress finding (R5).

## Known Gaps

- `CaptureQueue` component definition and its associated styles remain as dead code; intentional (safe to delete in a future cleanup pass without risk).
