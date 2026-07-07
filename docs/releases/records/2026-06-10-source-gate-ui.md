# 2026-06-10-source-gate-ui — Source Stage-Gate UI panel

## Release ID

`2026-06-10-source-gate-ui`

## Status

`candidate`

## Plain-English Summary

Adds the interactive Maestro/Admin Stage-Gate surface for a Source event: it shows the full
recommended standard (met / gap), the minimum-viable bar, the gaps with risk + downstream
impact, the honest gate status, and Nexus guidance — and lets Maestro record a decision
(approve, approve-with-gaps, mark preliminary, etc.). Approving past gaps requires a
rationale; on success the panel links to the durable approval record in the File Cabinet.

## Layer Impact

- `global-control-lane`: a client component `GateDecisionPanel` + a page at
  `/source/events/{eventId}/gate`. No schema/data change. Calls the gate routes (#3393) by
  URL (no code import), so it is independent at compile time.

## Client Applicability

- All clients (when the gate routes are deployed): per-event, tenant-scoped via the routes.

## Changes Included

- `src/components/source/GateDecisionPanel.tsx`
- `src/app/(maestro)/source/events/[eventId]/gate/page.tsx`

## QA / Validation

- `tsc --noEmit` clean (scoped) · `eslint` clean · `release:check` pass · `audit:architecture-rules` 0 violations.
- Behavior is exercised end-to-end by the gate routes' tests (#3393); this PR is the
  presentation layer over those routes.

## Rollout Plan

Squash-merge to main → ships on the next web image roll. Fully functional once the
gate-decision/gate routes (#3393) and the File Cabinet (#3390) are deployed.

## Rollback Plan

Revert the PR (removes the component + page). No data/schema unwind.

## Known Gaps

- The satisfied-requirements checklist is interim (the user marks current state); binding it
  to live evidence-readiness + File Cabinet artifact presence (auto-derived completion) is
  the follow-up.

## Audit Evidence

This record; gate route tests in #3393.
