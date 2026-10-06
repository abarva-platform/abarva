# 2026-09-01-home-rail-two-levels — Stop the rail reading as one list of equal things

## Release ID

`2026-09-01-home-rail-two-levels`

## Status

`candidate`

## Plain-English Summary

The rail listed twenty destinations flat. Eight of them are a reading order and twelve are a
reference shelf, and nothing said which was which.

The briefing is numbered. The chapter being read expands in place to its own sections. One status
mark exists in the whole rail, carried only where the record rates something high.

Every destination stays reachable and nothing is renamed.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** rail structure only.

## Client Applicability

- All clients. Feature flag: none.

## Changes Included

- `Rail.tsx` — `RailItem` gains an index, its own sections, and a flag. A chapter's sections render
  only while it is the active one.
- `HomeV4App.tsx` — sections and the flag are derived from the same rows the chapter itself renders,
  so the rail cannot offer a destination the chapter does not have.

### The mark had to be rare to be readable

The mark was initially set on any chapter producing an exposure finding. That was **five of eight** —
a mark on most of a list is decoration, and it spent red on something red is not reserved for.

Red means _rated high severity_. The mark now follows the record's own rating rather than a computed
finding, and the assertion holds it to at most two.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **207/207**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- Asserted: every chapter numbered, exactly one chapter expanded at a time, every destination still
  reachable by name

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. The rail returns to twenty flat entries.

## Audit Evidence

- Test output covering numbering, single expansion, mark count and reachability.

## Known Gaps

- The evidence side is still flat. The design collapses it to two groups — estate views and
  registers — which is a further change and touches how those destinations are addressed.
- The rail's selected item still uses a left border as its state. That is the one single-side rule
  on this surface that is doing work rather than decorating, and it is left alone deliberately.
