# 2026-08-17-moves-canonical-reconciliation — Declared portfolio against tracked portfolio

## Release ID

`2026-08-17-moves-canonical-reconciliation`

## Status

`candidate`

## Plain-English Summary

Moves reads `engagements` and the `program_*` tables. Most of that is correct and stays: work items,
milestones, approvals and gate decisions are created **in the product**, so the product owns them and
canonical has no business overwriting them.

The programme **inventory** is different. Canonical `program_initiative` is the client's declared
portfolio — what they told us they are running, with budgets and expected value. `engagements` keeps
a second list beside it. Two lists of the same thing is a fork whether or not anyone calls it one,
and the failure is quiet: a programme the client declared never appears in Moves, or a Moves
programme carries a value the client would not recognise.

This reconciles them and shows the difference. It does **not** merge them.

## Layer Impact

**Release lane: `client-data-lane`.** Read-only. No writes to `engagements` or `program_*`.

## Client Applicability

- Specific clients: both active tenants
- Internal only: no
- Feature flag: none

## Changes Included

- `src/lib/programs/canonical-portfolio-reconciliation.ts`
- `src/app/(maestro)/strategic-moves/page.tsx`

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.

## Rollout Plan

Merge, deploy, confirm on the signed-in surface.

## Deployment Authority

Repo-owned ACA main deploy workflow. No job, no data write.

## Rollback Plan

Revert. The panel disappears; nothing else changes, because nothing else was touched.

## Audit Evidence

- The commit and its PR.
- The panel names its canonical build version on screen.

## Known Gaps

- **Deliberately not merged.** Overwriting live operational rows from a nightly projection would
  destroy work someone did in the product, and the first time that happened nobody would trust the
  surface again. Seeding a *new* tenant's inventory from canonical is a different and safe operation,
  and is not in this release.
- **Reconciled on a normalised name**, the only key the two stores share. `engagements` has no
  canonical programme id — a schema gap, and the correct long-term fix.
- **The diff is computed against the projection's sampled names, not the full list.** The projection
  carries up to eight named examples per dimension, so `declaredOnly` is indicative rather than
  exhaustive. The counts are exact; the named list is a sample and is presented as one.
- **`engagements` still has no budget column**, so canonical `program_initiative.budgetUsd` has
  nowhere to land inside Moves and is shown only in the reconciliation panel.
