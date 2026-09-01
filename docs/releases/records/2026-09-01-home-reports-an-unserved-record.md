# 2026-09-01-home-reports-an-unserved-record — Home reports an unserved record instead of crashing

## Release ID

`2026-09-01-home-reports-an-unserved-record`

## Status

`candidate`

## Plain-English Summary

Home for the composite reference client is returning **HTTP 500** in the live lab environment. The
governed rows it reads returned nothing, and the reader raises an exception when that happens, so
the exception reached the browser as an application error on the opening client surface.

An unserved record is a state the surface should report, not an exception it should propagate.
The page now says so.

This does not restore the rows. It removes the crash while that is investigated separately.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No read query, no schema, no data is altered.
- **Layer 4 / products:** the Home route catches the unserved case and renders a stated page.

## Client Applicability

- All clients whose Home reads the governed serving path.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/home/page.tsx` — the projection read is guarded. On the unserved error the
  route renders a stated page inside the normal shell instead of letting the exception escape.
- `src/components/home/v4/HomeRecordNotServed.tsx` (new) — that page.
- `src/components/home/v4/__tests__/record-not-served.test.tsx` (new) — 4 test cases.

### Why it does not fall back to the stored copy

A stored copy of this client's record exists and could be rendered. It is not, deliberately.

Its figures differ from the served record's, and a reader has no way to tell which they are looking
at. A stale number presented as the current one is a worse failure than no number, because it is
the failure that does not announce itself.

The page therefore shows **no figure at all** — not a stale one, and not a zero. A zero on this
surface reads as an assessment that came back empty rather than a read that returned nothing. The
tests assert both absences.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **178/178**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- Live error confirmed from the running container before the change:
  `Home ECL preview: no serving Home rows for <client>/<assessment>.`

## Rollout Plan

Merge to main and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes — the route currently returns 500 and must be re-checked

## Rollback Plan

Revert the commit. The route returns to raising the exception, and the page returns to 500.

## Audit Evidence

- Container console log line showing the unserved error, captured before the change.
- Test output for the 178-case suite.

## Known Gaps

- **The rows are still missing.** This change makes the surface honest about that; it does not fix
  it. Restoring them is a separate data-plane action and is not attempted here.
- The provenance stamp on this bundle names a physical table rather than the read API the
  application actually queries, which misled two independent investigations of this incident. It
  should name what is queried. Not changed here to keep this change to the crash.
