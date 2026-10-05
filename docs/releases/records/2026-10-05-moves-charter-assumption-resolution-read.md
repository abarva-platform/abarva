# 2026-10-05-moves-charter-assumption-resolution-read — Moves: resolve a carried charter assumption (data model + resolution-aware read, flag OFF)

## Release ID

`2026-10-05-moves-charter-assumption-resolution-read`

## Status

`candidate`

## Plain-English Summary

P1 Charter lets someone answer a field from an assumption, provided they name an
owner and say how Discover will validate it. P2 Discover then shows those
assumptions back to them, with the owner and the plan. What it could not do was
let them record the answer: Discover checks the assumption, finds the volume
extract, and has nowhere to put what it found. The assumption stays open
forever, still addressed to its owner, still describing work that is finished.

This increment lands the data model for that answer, and the read that respects
it. A resolution says which of three things happened — the answer is
**confirmed** as P1 wrote it, **corrected** by what Discover found, or
**superseded** because approved evidence now covers it — plus what was found.
An outcome with no finding behind it is rejected rather than stored blank, so a
resolution can never render as "Discover validated this" while carrying nothing.
An assumption with a resolution standing against it stops being listed as open.

Two decisions are worth stating because they are the whole safety story:

- A resolution is stored on the same capture-module row as the recorded basis,
  under **its own key**, never nested inside the basis. The basis writer assigns
  that key wholesale, so a nested resolution would be silently discarded the
  next time anyone re-declared the basis.
- A resolution is **pinned to the revision of the answer it was written about**,
  the same rule the basis already follows. Edit the charter answer and the
  resolution stops applying — it described the previous wording, and the
  assumption goes back to open.

The write path and its control are the next increment. Nothing writes a
resolution yet, so with the flag on or off the product reads identically today.
Landing the read first is deliberate and not cosmetic: if the read were not
resolution-aware before anything could write one, the first resolution recorded
would leave the panel still listing that assumption as open and still owed.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_charter_assumption_resolution_v1`, off for all tenants). When off, the
carry-forward read is byte-for-byte the current behaviour: the new exclusion is
one conjunct behind the flag, and the flag is resolved to `false` everywhere.

- `4 PRODUCTS` (Moves): the P2 Discover carried-assumptions read gains a
  flag-gated notion of "still open". No surface, copy, or rendered row changes
  in this increment, because no resolution exists to exclude.
- `3 CANONICAL MODEL`: a resolution is persisted on the existing phase-capture
  module state under `p1_charter_assumption_resolution`, pinned to the field's
  value revision. No schema migration — it is stored in the existing capture
  state JSON, beside `p1_charter_basis` and readable only through its own
  reader. `readP1CharterBasisRecord` is untouched and cannot see it: that reader
  builds its result from a known field list and drops anything else on the raw
  object.
- No canonical charter field or capture section key is added, renamed, or
  removed. A resolution is never classified or rendered as approved evidence.

## Client Applicability

- All clients: No (flag off for all).
- Specific clients: None yet.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_charter_assumption_resolution_v1` (tenant policy,
  `includeTenants: []`).

## Changes Included

- `src/lib/programs/charter-assumption-resolution.ts` — **new.** The resolution
  data model and read: the three outcomes, `parseCharterAssumptionResolutionInput`
  (rejects an unrecognised outcome, and a blank or whitespace-only finding),
  `createCharterAssumptionResolutionRecord` (stamps resolver, timestamp and the
  answer's value revision), `readCharterAssumptionResolutionRecord` (null unless
  the stored record is well formed AND its revision matches the answer standing
  now), and `charterAssumptionResolutionActive` (flag + P2, the same shape as the
  carry-forward's own gate). Pure: no React, no flag lookup, no fetch, no write.
- `src/lib/programs/charter-assumptions-carry-forward.ts` —
  `carriedCharterAssumptions` takes an optional `resolutionReadEnabled`. Default
  **false** = every open assumption carries exactly as today, including one with
  a resolution stored against it. True excludes an assumption whose resolution
  applies to the current answer.
- `src/lib/features/registry.ts` — registers
  `moves_charter_assumption_resolution_v1` (off for all tenants). Deliberately
  separate from `moves_charter_assumptions_discover_v1` so a tenant can inherit
  the assumptions read-only without the resolve path acting on them.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` —
  resolves the flag per tenant and passes it to the carry-forward read.
- `src/lib/programs/__tests__/charter-assumption-resolution.test.ts` — **new**
  suite: the active gate, input parsing and rejection, the revision pin, a
  resolution refusing to travel to a different section, blank resolver and blank
  timestamp pinned one at a time with the rest valid, and the sibling-key
  decision in both directions (the basis read is unchanged by a resolution
  beside it; a resolution survives a wholesale rewrite of the basis key).
- `src/lib/programs/__tests__/charter-assumptions-carry-forward.test.ts` — the
  open-vs-resolved discriminators, with each half of the new guard pinned while
  the other is satisfied.
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` — regenerated for the
  new registry entry (`npm run docs:nexus-manual`).

## QA / Validation

- `jest` (`charter-assumption-resolution`, `charter-assumptions-carry-forward`) —
  **PASS**: 54/54.
- `jest src/lib/programs/__tests__/` (the whole directory, not only the suites I
  touched) — **PASS**: 106 suites, 984/984.
- Mutation check on the new guard — **PASS**: removing the flag conjunct fails 1
  test; removing the exclusion entirely fails 2. Neither half is decoration.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0, whole project.
- `eslint` — **PASS**: 0 errors, 0 warnings on all changed files.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**.
- Signed-in live walk — **NOT RUN**. See Known Gaps; this record does not claim
  `live-proven`.
- Phone-width layout — **NOT RUN**: this increment renders nothing new.

## Rollout Plan

Merge to `main` via squash PR with auto-merge. The flag is off for all tenants
and nothing writes a resolution, so there is no runtime behaviour change on
merge. Ships with the next ACA web image via the repo-owned `aca-main-deploy`
workflow. Enabling a tenant is a separate controlled change and should follow
the write path and its control, since an enabled tenant has no way to record a
resolution until then.

## Rollback Plan

Revert the PR, or leave `includeTenants: []` (already the state) — either
returns the carry-forward read to listing every open assumption, with no data
migration. A persisted resolution is simply unread by the off path, and no
resolution can exist until the write path ships.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; this change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template, env var, or secret.
Because the flag is off for every tenant, the merged code is inert at runtime
until a separate controlled change enables one.

## Known Gaps

- **No write path, so no control.** This is the data model and the read. A
  person in Discover still cannot record a resolution; that needs the API
  persistence and the UI, and is the next increment. Until then the flag is on
  nothing and should not be enabled for any tenant.
- **No signed-in proof.** The flag is off everywhere and the increment renders
  nothing new, so there is nothing for a walk to confirm. Owed at enablement,
  for the charter-basis family as a whole.
- **Three outcomes, and `superseded` does not check.** An answer resolved as
  superseded by approved evidence asserts that evidence exists; nothing here
  joins it to an actual approved upload the way the `approved_evidence` basis
  does. That join is real work and is deliberately not attempted in a read-only
  slice — the finding text carries it for now, which is weaker than a reference.
- **P3+ still does not see a surviving assumption.** An assumption Discover
  leaves unresolved is still invisible from P3 onward. This increment makes that
  gap addressable (there is now a notion of unresolved that outlives P2) but
  does not close it.
- **The host call site remains untested.** The flag resolution and the
  pass-through sit in a page component with no suite, so a mis-wired call site
  would still pass every test here. Same gap the basis host-join record states.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- The revision pin, the input rejections, and the sibling-key decision are
  covered by `src/lib/programs/__tests__/charter-assumption-resolution.test.ts`.
- Flag-off equivalence and the open-vs-resolved discriminators are covered by
  `src/lib/programs/__tests__/charter-assumptions-carry-forward.test.ts`.
