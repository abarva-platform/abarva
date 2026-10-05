# 2026-10-05-moves-charter-assumptions-in-discover — Moves: charter assumptions carried into Discover (flag OFF)

## Release ID

`2026-10-05-moves-charter-assumptions-in-discover`

## Status

`candidate`

## Plain-English Summary

The P1 Charter basis control tells a workspace user, in four separate places,
that a field answered from an assumption "carries into Discover to be
validated" — it badges the question _Assumption · validate in Discover_, asks
for an owner and for "how Discover validates it", and rolls the count up on the
hand-off screen.

Nothing in Discover read any of it. The recorded basis (`p1_charter_basis`) is
loaded on phase 1 only, so when the person arrived at P2 the assumptions were
not there, and the owner and validation plan they had typed were never shown
again. The sentence named a handover the product did not perform.

This change performs it. Behind a feature flag
(`moves_charter_assumptions_discover_v1`, **off for every tenant**), P2 Discover
opens with the charter answers still standing on an assumption — each one with
the field it answers, the answer itself, the owner, and the validation plan the
person wrote when they declared it.

It is deliberately only a **read**. It closes nothing, edits nothing, and
re-classifies nothing: the basis stays owned by P1's capture state. It adds no
canonical field, table or key. And it never renders a carried row in evidence
wording — a carried row is marked _Assumption · open_, and the panel states in
words that none of these rows is covered by evidence.

One exclusion is worth naming: an answer **edited** after its basis was declared
does not appear. P1 already clears a basis when its answer changes, and carrying
the stale row would describe the new wording with a validation plan that was
agreed for the previous wording.

Because the flag is off everywhere, there is **no change to the live product**.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_charter_assumptions_discover_v1`, off for all tenants). When off, the
fold returns `null` and the P2 screen renders byte-for-byte as it does today.

- `4 PRODUCTS` (Moves): P2 Discover gains a flag-gated read-only opening band on
  its capture steps. No gate, advance check, save path, capture field or
  evidence classification changes anywhere.
- `3 CANONICAL MODEL`: unchanged. No new field, table, key or migration. The
  surface is a projection of the `p1_charter_basis` records P1 already writes,
  read through the existing `readP1CharterBasisRecord` (including its
  value-revision staleness check), with no new write path of any kind.

## Client Applicability

- All clients: No (flag off for all).
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_charter_assumptions_discover_v1` (tenant policy,
  `includeTenants: []`).

## Changes Included

- `src/lib/programs/charter-assumptions-carry-forward.ts` (new) — the pure fold.
  `charterAssumptionCarryForwardActive` gates the surface on the flag **and**
  phase 2; `carriedCharterAssumptions` folds the P1 module rows into the open
  assumptions, in canonical charter order. Returns `null` when inactive and `[]`
  when active-with-none, matching the `charterBasisRollupSections` discipline.
  No React, no flag lookup, no fetch.
- `src/components/strategic-moves/CharterAssumptionsCarryForward.tsx` (new) —
  the presentational panel. Renders nothing for `null` or `[]`, so it never
  announces an empty charter as a clean one.
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — adds an optional
  `openingBand` slot rendered above the step panel on capture steps (the
  hand-off keeps its existing `handoffSummary`). Default `null` leaves every
  existing render unchanged.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — accepts the
  already-gated rows and passes the panel as `openingBand`. The client re-checks
  no flag of its own.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` —
  resolves the flag per tenant and runs the fold. No extra load: `captureModules`
  already holds every module row for the Move, so P1's rows are in hand on P2.
- `src/lib/features/registry.ts` — registers the flag, off for all tenants.
- `.github/workflows/ai-surface-control-catalog.yml` — registers the new
  component suite by exact path; census refreshed.
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` — regenerated for the
  new flag row.

## QA / Validation

- `jest src/lib/programs/__tests__/charter-assumptions-carry-forward.test.ts` —
  **PASS**: 16/16.
- `jest src/lib/programs/__tests__` (whole directory) — **PASS**: 105 suites,
  946 tests.
- `jest src/components/strategic-moves/__tests__` (whole directory, covering the
  two host files changed) — **PASS**: 33 suites, 384 tests.
- Mutation checks on the new guards — **PASS**: each of the five load-bearing
  behaviours was inverted in turn and a named test failed for it — carrying a
  non-assumption basis (3 failed), dropping the phase guard (5 failed), removing
  the value-revision staleness check (1 failed), rendering a panel for an empty
  list (1 failed), and labelling a carried row as evidence-backed (2 failed).
  The last of these first passed under mutation and was found to be a defective
  assertion: `textContent` concatenates sibling elements with no separator, so a
  word-boundary pattern could not match the forbidden wording. The test harness
  now joins text nodes, and the mutation is caught.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0, no type errors.
- `eslint` on all changed files — **PASS**: 0 errors (3 pre-existing unused-var
  warnings in `MovesPhaseStandaloneClient.tsx`, untouched by this change).
- `npm run audit:test-ci-coverage:write` — **PASS**: covered test files
  2526 → 2528 (+2, the two new suites) with uncovered **unchanged at 164**,
  which is the proof both suites are actually wired into CI.
- `npm run release:check --base origin/main --head HEAD` — **PASS**.
- Signed-in visual walk — **NOT RUN**: the flag is off for every tenant, so
  there is no tenant on which this surface renders. Owed as part of the separate
  controlled change that enables a tenant.

## Rollout Plan

Merge to `main` via squash PR. The flag is off for all tenants, so there is no
runtime behaviour change on merge. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. Enabling a tenant is a separate
controlled change and should follow `moves_charter_basis_v1` for that tenant —
without the P1 control there are no recorded bases for this panel to read, and
it would correctly render nothing.

## Rollback Plan

Revert the PR, or leave `includeTenants: []` (already the state) — either leaves
every tenant's P2 screen exactly as it is today. No data migration: this change
writes nothing, so there is nothing to unwind.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; this change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template, env var or secret.
Because the flag is off for all tenants, the merged code is inert at runtime
until a separate controlled change enables a tenant.

## Known Gaps

- **No signed-in proof.** The flag is off everywhere, so the surface renders for
  no tenant and there is nothing to walk. Owed at enablement.
- **Read-only by design, and that is a real limit.** A person looking at a
  carried assumption in Discover cannot yet resolve it there — mark it
  confirmed, corrected, or superseded by evidence found in P2. Closing the loop
  needs a write path and a decision about where a resolution is stored, which is
  a larger change than this read and is deliberately not attempted here.
- **P3+ does not show carried assumptions.** The surface is scoped to P2 because
  the plan each assumption carries is literally "how Discover validates it". An
  assumption that survives Discover unresolved is therefore invisible from P3
  onward; that gap is real and is downstream of the resolve path above.
- The panel orders rows by canonical charter order, not by age or risk. With at
  most seven charter fields this is legible, but it is not a prioritisation.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- The flag/phase gate, the non-assumption exclusions, the value-revision
  staleness exclusion and the canonical ordering are covered by
  `src/lib/programs/__tests__/charter-assumptions-carry-forward.test.ts`.
- The never-as-evidence rule, the null-vs-empty render and per-row marking are
  covered by
  `src/components/strategic-moves/__tests__/CharterAssumptionsCarryForward.test.tsx`.
