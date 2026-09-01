# 2026-08-31-home-visual-impact — Make the page lead rather than report

## Release ID

`2026-08-31-home-visual-impact`

## Status

`candidate`

## Plain-English Summary

Every finding on a Home page looked equally important. Seven cards, seven identical treatments, and
a reader had to read all seven to discover that one was a patient-data exposure and another was a
note about how a cost was calculated. The page was doing the reporting and leaving the triage to the
reader.

Four changes, none of which alter a single number:

1. **Findings arrive in reading order** — what the record says is wrong now, then what it cannot tell
   you, then what it confirms. The leading finding gets more room.
2. **The figure a claim opens on is set at the weight it deserves**, in the display face, rather than
   at the same size as the word beside it.
3. **A count column carries a bar behind its numbers**, so three figures read as one shape without
   losing any precision.
4. **The page states its own shape before it is scrolled** — how many tables, findings, exposures,
   and views it could not build.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 / canonical model:** unchanged. No figure changes, none is recomputed.
- **Layer 4 / products:** presentation only.

## Client Applicability

- All clients: yes
- Feature flag: none

## Changes Included

- `src/components/home/v4/page-tables.ts` — `rankFindings`, `splitLeadingFigure`, and a `barColumn`
  on the six tables whose counts are of the same thing down the rows.
- `src/components/home/v4/TableSet.tsx` — ranked rendering, weighted leading figure, in-cell bars,
  exposure count on the block header, and `PageShape`.
- `src/components/home/v4/ChapterPage.tsx`, `NotDraftedPage.tsx` — render the shape line.
- 14 new test cases.

### Restraint that is deliberate

A bar is only drawn where the column counts the same thing down the rows. Where rows measure
different units a bar would imply they are comparable, so those tables declare none. The number
itself never moves: the bar sits behind it, and a reader loses no precision to gain the shape.

The leading figure is extracted only where a claim actually opens on one. A claim that opens on a
word reads as an ordinary sentence rather than having a figure manufactured for it.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — 109/109, twelve suites
- PASS `tsc --noEmit -p tsconfig.json` · `npx eslint` (0 errors)
- Rendered against the live snapshot and inspected in a browser

### What the block reads as now

```
WHAT DOES NOT RECONCILE — SEVEN TODAY    3 THE RECORD SAYS ARE WRONG NOW

108  applications holding PHI authenticate on local accounts.      CISO
196  regulated data assets are not yet production-governed.        CDO
101  data assets sit on one on-premise platform, 74 regulated.     CDO
 53  applications carry a declared end-of-support date.            Transformation Office
     Every cost figure on this estate is modelled, not booked.     CFO
64%  of the estate is self-hosted.                                 CIO
```

The three the record says are wrong now come at the top, and the reader knows that before reading
any of them.

## Rollout Plan

Merge to main. No migration, no data-plane mutation, no traffic change.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, before this is called live-proven

## Rollback Plan

Revert the commit. Findings return to source order at one size, tables lose their bars, the shape
line disappears. No figure is affected either way.

## Audit Evidence

- Test output, including the bar-scaling assertion and the no-bar-column case.

## Known Gaps

- **The three charts from the design are still unbuilt** — segment gap, cost concentration, renewal
  timeline. The in-cell bars cover the common case; those three show what a table cannot.
- Verified by component render in a browser; a signed-in product proof is still owed.
