# 2026-08-17-home-respect-layout — Canonical belongs in the tabs, not above them

## Release ID

`2026-08-17-home-respect-layout`

## Status

`candidate`

## Plain-English Summary

The canonical landscape was added to Home as a new section above the existing tabs. That was a layout
change nobody asked for.

Home has a settled design: an executive read, four anchors, and eleven tabs — Summary, Patterns,
Context, Economics, Architecture, Architecture Evidence, Posture, Coherence, Trajectory, Watchlist,
Evidence. Putting canonical facts in a panel above that reads as a second page stapled to the top of
the first, and tells a reader there are two landscapes when there is one.

The panel is removed. The same facts now feed the tabs that already ask those questions:

- **Context** gains applications, infrastructure and data domains, each with named examples and its
  evidence count.
- **Evidence** gains the canonical record total and, where the client supplied nothing for a
  dimension, names it — so the tab's existing "missing sources" question has a real answer rather
  than an implied clean bill.

The four headline anchors were already correct and are untouched.

## Layer Impact

**Release lane: `client-data-lane`.** Presentation only. Same data, routed into the existing
structure.

## Client Applicability

- Specific clients: both active tenants
- Internal only: no
- Feature flag: none

## Changes Included

- `src/app/(maestro)/home/page.tsx` — `EnterpriseLandscapePanel` removed; `withCanonicalEconomics`
  now contributes `contextDomains` and `evidence` entries.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.

## Rollout Plan

Merge, deploy, confirm the tabs on the signed-in surface.

## Deployment Authority

Repo-owned ACA main deploy workflow. No job, no data write.

## Rollback Plan

Revert. The tabs return to authored content only.

## Audit Evidence

- The commit and its PR.
- Context and Evidence entries name the canonical build, so any figure is traceable.

## Known Gaps

- **This was a self-inflicted defect.** The design is settled and documented, and adding a section to
  it was not a data change dressed as one — it was a layout change made without asking. Canonical
  data should have gone into the existing structure from the start.
- **Only three tabs are fed.** Patterns, Posture, Coherence, Trajectory and Watchlist still render
  authored content. Each needs its own canonical mapping, and inventing one per tab to look complete
  would repeat the mistake this release fixes.
