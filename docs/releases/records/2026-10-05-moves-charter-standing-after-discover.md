# 2026-10-05-moves-charter-standing-after-discover — Moves: what a charter answer is worth after Discover closes (read, flag OFF)

## Release ID

`2026-10-05-moves-charter-standing-after-discover`

## Status

`candidate`

## Plain-English Summary

P1 Charter lets someone answer a field from an assumption, provided they name an
owner and say how Discover will validate it. P2 Discover inherits those
assumptions, and can now record what it found. Both of those reads are scoped to
their own phase — the carry-forward is P2-only, the resolution read is P2-only —
so from P3 onward all of it disappears. A charter answer that was proved against
approved evidence, one that was assumed and never checked, and one that Discover
checked and found wrong all read as the same flat sentence.

That matters because of what the later phases do with that sentence. P3 routes a
solution off the charter's scope boundary. P4 builds a business case on its
success criteria. P5 mobilises against its decision rights. Each of them quotes
an answer whose standing it cannot see.

This increment is the read that outlives Discover. From P3 onward it reports two
standings, kept separate because they are two different problems:

- **unvalidated** — the field was answered from an assumption and Discover
  closed without resolving it. Nobody has said the answer is wrong; nobody has
  said it is right either, and the phase whose job was to check is over. The
  validation plan travels with the row but is named `plannedValidation`, because
  it describes work that was planned and not performed.
- **known-wrong** — Discover recorded a **correction**, and the charter still
  carries the wording the correction was written about.

That second standing is an inference, and it is worth saying why the data
supports it rather than merely suggesting it. A resolution carries the revision
of the answer it was recorded against, and the resolution read returns it only
while that revision still matches. So a correction that is _readable at all_
proves the answer is byte-identical to the one Discover judged wrong — had
anyone rewritten it, the correction would have stopped reading and the field
would carry no basis and no resolution. The standing comes off the same revision
pin the rest of the family already uses, not off a comparison this read invents.

The third decision is a refusal. This read requires the resolution read to be
enabled, and reports nothing at all without it. At P2 an over-inclusive list is
a to-do list with a stale row on it. At P3 the same row is a verdict about work
that is finished — "nobody validated this" — and saying that about an answer
Discover really did confirm is a false statement about real work, rendered in
the one place a reader would trust it. There is no safe degraded mode here, so
the surface stays inactive rather than reporting the wrong thing confidently.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_charter_standing_after_discover_v1`, off for all tenants). The flag is
off for every tenant, so the product is byte-for-byte unchanged on merge; the
fold returns `null` and the band renders nothing.

- `4 PRODUCTS` (Moves): adds the read AND the surface that consults it. The
  phase page folds the rows server-side (same Move-wide `captureModules` the P2
  carry-forward already uses, so no second load) and passes them to
  `MovesPhaseStandaloneClient`, which renders `CharterStandingAfterDiscover` in
  the capture flow's `openingBand` slot — above the first question, because the
  band qualifies the answers rather than footnoting them. The two charter bands
  share that slot and are phase-exclusive by construction: the carry-forward
  owns P2, this owns P3+.
- `3 CANONICAL MODEL`: read-only. No schema migration, no new persisted field,
  no new state key. The module reads the existing `p1_charter_basis` and
  `p1_charter_assumption_resolution` entries on the P1 capture-module rows
  through their existing readers, and writes nothing.
- No canonical charter field or capture section key is added, renamed, or
  removed. A standing is never classified or rendered as approved evidence, and
  a planned validation is never rendered as a validation performed.

## Client Applicability

- All clients: No (flag off for all).
- Specific clients: None yet.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_charter_standing_after_discover_v1` (tenant policy,
  `includeTenants: []`).

## Changes Included

- `src/lib/programs/charter-standing-after-discover.ts` — **new.** The
  post-Discover read. `charterStandingAfterDiscoverActive` (three conjuncts: its
  own flag, the resolution read, and phase ≥ 3 — P2 is excluded and stays with
  the carry-forward, so one field is never reported twice under two framings on
  one phase). `charterStandingAfterDiscover` returns the standings in canonical
  charter order, with `null` for an inactive surface and `[]` for an active
  all-clear. `charterStandingForSection` is the point-of-use lookup for a later
  phase about to quote one field; it takes the already-computed list so a
  surface cannot run a second, differently-configured read beside the one it
  displays. Pure: no React, no flag lookup, no fetch, no write.
- `src/lib/features/registry.ts` — registers
  `moves_charter_standing_after_discover_v1` (off for all tenants). Its
  description's "the consuming surface is a later slice" is replaced with where
  the surface actually is, now that this release carries it.
- `src/components/strategic-moves/CharterStandingAfterDiscover.tsx` — **new.**
  The consuming surface: purely presentational, the host owns the flag gate and
  the fold. `null` and `[]` both render nothing — an all-clear is not announced
  here, because the panel's whole subject is the answers that carry a caveat.
  The two standings are rendered as separate groups, since a corrected answer
  read as merely unchecked would understate it, and a group with no rows is
  omitted rather than rendered empty.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — accepts the
  folded rows as one prop and renders the band in the capture flow's
  `openingBand` slot beside the P2 carry-forward band. It re-reads no flag,
  re-derives no row and re-counts nothing.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` —
  resolves the flag beside its two siblings and folds the rows off the same
  Move-wide `captureModules` the carry-forward already uses, so P1's rows are in
  hand on a P3+ render without a second load.
- `.github/workflows/ai-surface-control-catalog.yml` — registers the new
  component suite by path. `src/components/strategic-moves/__tests__` is listed
  file-by-file rather than swept, so an unregistered suite there would be dark.
- `src/lib/programs/__tests__/charter-standing-after-discover.test.ts` — **new**
  suite, 25 tests: each conjunct of the active gate pinned with the other two
  satisfied; P2 pinned separately as a boundary, not as an off-by-one; the two
  standings asserted as whole row objects; `confirmed` and `superseded` reported
  as nothing; approved-evidence and no-basis fields reported as nothing; an
  answer edited after its basis was declared dropped entirely; a correction
  written about older wording falling back to `unvalidated` rather than
  mislabelling the current answer; canonical order asserted against reversed
  module order; and each standing's row asserted not to carry the other's field.
- `docs/architecture/test-ci-coverage-census.json` — refreshed
  (`npm run audit:test-ci-coverage:write`). `src/lib/programs/__tests__` is swept
  as a whole directory by the control-catalog workflow, so the new suite needs no
  by-path registration; `uncoveredTestFiles` is unchanged at 164, which is the
  proof it is covered rather than merely present.
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` — regenerated for the new
  registry entry (`npm run docs:nexus-manual`).

## QA / Validation

- `jest src/lib/programs/__tests__/charter-standing-after-discover.test.ts` plus
  the two sibling suites it builds on — **PASS**: 3 suites, 79/79.
- `jest src/lib/programs/__tests__` (the whole directory, not only the suites
  touched) — **PASS**: 107 suites, 1013/1013.
- Mutation check on the new module — **PASS**: 6 of 6 mutations killed, against a
  green 25/25 baseline restored between each. Returning `null` instead of
  `unvalidated` when no resolution stands fails 5; dropping the `corrected`
  standing fails 2; widening the phase gate from ≥ 3 to ≥ 2 fails 2; dropping the
  `resolutionReadEnabled` conjunct fails 1; accepting any declared basis instead
  of only an assumption fails 2; making the per-section lookup ignore its
  `sectionKey` fails 1.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0, whole project.
- `eslint` — **PASS**: 0 errors, 0 warnings on all changed files.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**.
- Signed-in live walk — **NOT RUN**. See Known Gaps; this record does not claim
  `live-proven`.
- `jest` (`CharterStandingAfterDiscover.test.tsx`, new) — **PASS**: 9/9.
- `jest` (`MovesPhaseStandaloneClient.test.tsx`, 5 host cases added) —
  **PASS**: 208/208.
- `npm run audit:lib-orphans` — **PASS**: "No change against the baseline". The
  module was a `testOnly` orphan on the required `Agent context broker
  boundary` check until the host mount landed; it is now reached by product.
- **Mutation check** — 12 mutations, each asserted to match its anchor exactly
  once, **12 killed**. Component (8): rendering on an empty list; dropping the
  known-wrong group; putting every row in the unvalidated group; hiding the
  correction; hiding the planned validation; badging a caveated answer
  "Confirmed"; miscounting the rows; dropping the answer wording. Host (4):
  passing `null` instead of the prop; unmounting the band; passing a truncated
  slice; dropping the carry-forward band beside it. The two host pass-through
  mutations are the ones a component-only suite would have missed.
- Phone-width layout — **NOT RUN**: the band reuses the carry-forward's grid,
  which collapses to one column under 640px, but this is unverified visually.

## Rollout Plan

Merge to `main` via squash PR with auto-merge. The flag is off for every tenant,
so the fold returns `null`, the band renders nothing and there is no runtime
behaviour change on merge. Ships with the next ACA web image via the repo-owned `aca-main-deploy`
workflow. Enabling a tenant should follow the consuming surface and the
resolution write path, since without a write path no resolution exists and every
declared assumption would read as `unvalidated` — true today, but a thin thing to
show a person.

## Rollback Plan

Revert the PR, or leave `includeTenants: []` (already the state). With the flag
off the module is reached but returns `null`, and nothing persists through it, so
there is no data to migrate back
and no surface to restore.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; this change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template, env var, or secret.
Because the flag is off for every tenant and nothing calls the module, the merged
code is inert at runtime until a separate controlled change wires and enables it.

## Known Gaps

- **No surface, so nobody sees a standing yet.** This is the read. Rendering it
  at P3, P4 and P5 — and deciding where it sits on each, which is a per-phase
  composition question rather than one shared panel — is the next increment.
- **No write path, so `known_wrong` is unreachable today.** Nothing records a
  resolution yet, so the only standing the module can currently produce is
  `unvalidated`. The corrected branch is fully specified and tested against
  constructed records, but it has never run against a resolution a person wrote.
- **The refusal is honest and also a cliff.** With the resolution read off, the
  module reports nothing — including the assumptions it could have reported
  safely, because an unresolved assumption is unresolved either way. That is
  deliberate: distinguishing "safe to report" from "unsafe to report" needs the
  resolution read, which is the thing that is off. The cost is that a tenant
  cannot get the weaker half of this surface without the stronger one.
- **`superseded` still does not check.** An assumption resolved as superseded by
  approved evidence asserts that evidence exists; this read trusts the outcome
  rather than joining it to an approved upload, so it drops such a field from the
  standings on the strength of a claim. Same gap the resolution read records, and
  it is inherited here rather than introduced.
- **No signed-in proof.** The flag is off everywhere and nothing renders, so
  there is nothing for a walk to confirm. Owed at enablement, for the
  charter-basis family as a whole.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- The active gate's three conjuncts, the two standings, the revision-pin
  fallback, and the canonical ordering are covered by
  `src/lib/programs/__tests__/charter-standing-after-discover.test.ts`.
- The revision pin this read derives `known_wrong` from is covered upstream by
  `src/lib/programs/__tests__/charter-assumption-resolution.test.ts`.
