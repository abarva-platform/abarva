# 2026-09-01-home-record-rating — Order the queue by what the record rates

## Release ID

`2026-09-01-home-record-rating`

## Status

`candidate`

## Plain-English Summary

Exposures were ordered by the order they were computed in. A leader reads that chapter top-down, so
the order is a claim about what matters most — and it was our claim, not the record's.

A finding built from a declared severity now carries that severity, the queue is ordered by it, and
the finding shows it as a rating the record made rather than a judgement the page formed.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** finding order and one badge.

## Client Applicability

- All clients. A finding built from rows that declare no severity carries no rating and is unchanged.
- Feature flag: none.

## Changes Included

- `page-tables.ts` — `Finding` gains `rated`, set **only** from a declared severity field and never
  inferred from how serious a finding reads. `rankFindings` orders by it within a kind.
- `TableSet.tsx` — a rated finding shows `high · rated by the record` in the reserved colour.

### An unrated finding is not a low-rated one

Ordering rated-high, then moderate, then unrated would let a **gap in the register** quietly demote
a real exposure — the register not saying is not the register saying "minor". Unrated sits between
high and moderate, so a missing rating cannot push a finding down a list a leader reads top-down.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **212/212**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- Asserted: rated-high leads, unrated is not demoted below moderate, and red appears only on a
  declared high rating

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. Findings return to computation order and carry no rating.

## Audit Evidence

- Test output covering order and colour.

## Known Gaps

- **The decision each exposure forces is not built.** The design gives every queue item the decision
  it puts in front of a leader, and the record carries no such field. Writing one per finding rule
  is authored copy about the client's situation, and inventing five of them to fill a layout is
  exactly what the rest of this work exists to prevent. It wants deliberate copy, reviewed, not a
  component change.
- Only one finding rule reads a declared severity today, so only one can be rated. The others draw
  from families that declare none.
