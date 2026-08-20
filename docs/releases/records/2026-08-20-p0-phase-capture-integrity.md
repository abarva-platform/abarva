# 2026-08-20-p0-phase-capture-integrity — P0 capture can no longer overwrite authoritative data

## Release ID

`2026-08-20-p0-phase-capture-integrity`

## Status

`candidate`

## Plain-English Summary

A client defect let the P0 phase page display synthetic placeholder text as if
it were the client's own captured answers, and then write that placeholder back
over the real, correctly-persisted data.

The mechanism: the page synthesized its P0 input values from a `draftedBrief`
state that was declared with no setter and never hydrated, so it always fell
through to a hardcoded list of generic drafts. Those drafts were rendered in the
inputs rail, and "Approve & Build" POSTed them back as authoritative capture.
The route merged them over the persisted values — and on phase 0 also mirrored
them into `engagements.charter`, the authoritative origination record.

Three things are fixed:

1. **The client no longer synthesizes anything.** P0 values are preloaded
   server-side from the persisted record and rendered as-is. An empty field now
   means "not captured", which is the truth.
2. **A no-edit save writes nothing.** The route diffs incoming values against
   persisted ones and skips every unchanged section, including the phase-0
   charter mirror. Approve & Build with no edits validates and advances without
   touching a single value.
3. **The server refuses to be lied to.** Known placeholder text is rejected
   outright, and writes carry a revision that must match the persisted state or
   the write is refused as stale.

Guards 2 and 3 are the durable protection: they hold even against an older
browser tab replaying the original bug, and against whatever component
reintroduces a default value next.

## Layer Impact

Release lane: `global-control-lane` (shared phase-capture route and the Moves
phase page; no schema change, no migration).

- **Layer 4 (Products) — Moves.** P0 inputs rail now renders persisted values.
  The capture route gains a revision contract and two write guards.
- **Layer 3 (Canonical Model) — protective only.** No schema change. The change
  _prevents_ unauthorized writes to `program_modules` and `engagements.charter`;
  it adds none.

## Client Applicability

- **All clients, globally. No feature flag, deliberately.** A flag would leave
  unflagged tenants exposed to a destructive overwrite. This is an integrity
  floor, not a capability.
- Behaviour change: a no-edit Approve & Build no longer rewrites P0 values (it
  previously overwrote them with boilerplate). Real edits behave as before, minus
  the ability to persist placeholder text.
- Internal only: no. Public/demo only: no.

## Changes Included

- New: `src/lib/programs/phase-capture-integrity.ts` —
  `LEGACY_ORIGINATE_PLACEHOLDERS`, `isKnownPlaceholderValue`,
  `findPlaceholderValues`, `computeCaptureRevision`, `diffCaptureValues`,
  `normalizeForCompare`.
- New: `src/lib/programs/__tests__/phase-capture-integrity.test.ts`.
- Modified: `src/app/api/v1/programs/[programId]/phase-capture/route.ts` — GET
  returns `values` + `revision`; POST accepts `expectedRevision` and rejects
  mismatches with 409 `stale_revision`; rejects placeholder text with 422
  `placeholder_value_rejected`; writes only changed sections; the phase-0
  charter mirror runs only when a value actually changed.
- Modified: `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` —
  deletes `ORIGINATE_FIELDS`, `textOrDraft` and `draftedBrief`; the phase-0
  branch of `buildPhaseCaptureItems` returns preloaded persisted values;
  finalize sends `expectedRevision`.
- Modified: `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`
  — preloads authoritative capture values and their revision server-side and
  passes them as props.

## Design Notes

**Revision is content-addressed, not a stored counter.** A truncated SHA-256 of
the sorted persisted values. No migration, it cannot drift out of sync with the
rows it describes, and it detects change regardless of which path wrote it.

**Server-side preload rather than fetch-after-mount.** The phase page already
renders on the server. Passing one authoritative snapshot avoids the loading
window in which the previous defect displayed boilerplate as real answers. The
GET route remains available for reload and conflict recovery.

**The client no longer maps charter fields to capture keys at all.** It renders
what the server holds. Duplicating the server's mapping in the client is exactly
how the two drifted apart in the first place.

## QA / Validation

- `npx tsc --noEmit --pretty false` — 0 errors, full project.
- `npx eslint` on all five touched files — 0 errors, 0 warnings.
- 19 new tests covering the invariants provable without I/O:
  - **Invariant 7** (defaults can never serialize): every legacy boilerplate
    string is recognised, including under reformatting, case change and
    whitespace padding; real client answers are not rejected; empty and
    non-string values are correctly treated as not-placeholder; offending keys
    are named so the sending client can be fixed.
  - **Invariant 6** (stale revision cannot overwrite): revision is stable across
    key order, changes on any value/key change, cannot be confused by values
    that concatenate identically (`{a:"xy",b:"z"}` vs `{a:"x",b:"yz"}`), and
    treats null and empty as the same absent value.
  - **Invariants 3 and 4** (reload and no-edit save change nothing): an exact
    echo, a partial echo, and whitespace drift from a round-trip all diff to
    zero changes.
  - **Invariant 5** (an edit changes only the intended field): returns exactly
    the edited key with before/after; detects filling an empty field; detects
    clearing a field as a real edit; treats an absent key as untouched rather
    than cleared.
- Regression sweep `src/lib/programs` + `src/components/strategic-moves`: 3,550
  tests, 9 failing. Stashed-baseline: 3,531 tests, the **same 9** failing.
  Net: 19 added, all passing, **zero new failures**.

## Rollout Plan

Merge to `main`; `.github/workflows/aca-main-deploy.yml` builds and deploys.
Global, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none. Approved image digest: n/a.
- ACA runtime invariant: unaffected. Worker image invariant: unaffected.
- Live signed-in proof required: **yes** — see Known Gaps.

## Rollback Plan

Revert and merge. No migration to reverse; `revision` is computed per request
and nothing persists it. Reverting restores the destructive path, so prefer
fixing forward.

## Audit Evidence

- Local typecheck/lint/test output including the stashed-baseline comparison,
  captured in this session's transcript.
- Defect diagnosis with file:line citations recorded in the session task record.

## Known Gaps

- **Invariants 1 and 2 are not yet proven live.** The pure primitives are
  tested; the full chain (origination submit → persisted → page render →
  Approve & Build → unchanged) needs the signed-in walkthrough on Move
  `5dff496f-f5fc-40f1-8d22-e784893e4ceb`, whose authoritative data is intact and
  which is reserved as the regression vehicle.
- **Blast radius is not yet measured.** Any Move where someone already clicked
  P0 Approve & Build may carry boilerplate in `program_modules` and in
  `engagements.charter` top-level fields. `charter.scaffold` survives (it is not
  in the mirror's overwrite list), so rehydration remains possible. The
  diagnostic and repair are deliberately a separate PR — read-only first.
- **The blast radius is wider than the original report suggested.** All eight
  keys the old client sent are candidates, not only the three that surfaced as
  "Needs input". The other five rendered boilerplate that merely _looked_
  plausible.
- **`expectedRevision` is optional.** Existing non-Move callers keep working
  without it; only clients that send it get the fence. Making it mandatory is a
  follow-up once all callers are known to send it.
