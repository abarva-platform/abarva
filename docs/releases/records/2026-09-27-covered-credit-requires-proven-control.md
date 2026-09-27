# 2026-09-27-covered-credit-requires-proven-control — A `covered` control credit now has to name a proven control

## Release ID

`2026-09-27-covered-credit-requires-proven-control`

## Status

`candidate`

## Plain-English Summary

`docs/security/ai-surface-control-catalog.json` is the machine-readable answer to "which AI
surfaces have which safety controls, and is each one actually tested". Two parts of that file
disagreed, about a thousand lines apart, and the CI gate had no opinion about the disagreement.

For each legal-catalog claim the file records a coverage row saying `covered` or `deferred`. The
gate validated a `covered` row for two things: that the surface it names exists in `controls[]`,
and that the surface declares the control kind the row is about. It never asked the question the
word `covered` means — whether that control has a behavioral test. So a row could claim credit
over a control that this same file records, in its own words, as having none.

Measured over all 22 `covered` rows (not sampled): exactly one was in that state. The Tower
pressure-brief `confidence` row claimed `covered` against a control whose `behavioralTest.status`
is `"none"`, because nothing mounts the component, so nothing proves the confidence label ever
reaches a reader. The covered count therefore overstated by one, on the single surface this file
has been repeatedly careful to record as unproven.

Two changes, in this order. The row is corrected to `deferred` with a concrete reason — the
vocabulary this file already has for "there is no proven control to name here" — and the gate now
refuses that shape outright, naming the surface, the control kind and the control's own reason in
the failure. The covered count goes from 22 to 21, and exactly one row moved.

This is bookkeeping, deliberately. It does not ask anyone to write a render test for a component
nothing mounts, and it must not be closed that way: the mount-or-retire decision for that
component is owned elsewhere and is not reopened here.

## Layer Impact

- `global-control-lane` — the AI surface control catalog and its CI gate are shared control-plane
  governance artifacts. One audit script, one JSON document, one behavioral suite.

No product code, no data plane, no schema, no runtime surface. Nothing a signed-in user can see
changes.

## Client Applicability

- All clients: no behavior change — this is an audit-artifact correction and a CI gate.
- Specific clients: none.
- Internal only: yes, in effect — the gate runs in CI.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/ai-surface-control-catalog.mjs` — a `covered` coverage row whose joined control
  declares `behavioralTest.status: "none"` is now a failure. The message carries the surface, the
  kind, and the control's own reason quoted rather than restated, so the sentence a reader has to
  reconcile is the one that can go stale.
- `docs/security/ai-surface-control-catalog.json` — the one offending row is `deferred` with a
  reason. Separately, the new suite names the component in prose, so the gate's derived
  `knownSuites` check correctly demanded it be declared on that surface's five uncovered controls,
  with a sentence in each reason saying what it does not prove. That is the existing control
  working, not an exemption.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts` — six cases, both directions.

## QA / Validation

Baseline and after measured over the same scope, in two clean worktrees at the same commit
(`origin/main` `4a4d3984d4`); no stash.

- `npm run test:behaviors` — before: 148 suites, 1580 tests, 0 failing. After: 148 suites, 1586
  tests, 0 failing. The 6 new tests are the whole difference; no suite changed verdict.
- `node scripts/audit/ai-surface-control-catalog.mjs` — green on the catalog as it stood, red on
  the *same bytes* once the check existed (one finding, naming the surface, the kind and the
  reason), green again after the row was corrected. The check was written before the data was
  fixed, so the red is against the live row rather than an invented one.
- Covered credits: 22 before, 21 after. `deferredWithSurfaceId` 1 to 2, `deferredWithJoin`
  unmoved at 14. No other row moved — the gate reports every problem it finds, and it reported
  exactly one.
- Mutation, two independent directions, each verified to have really changed behavior before the
  suite was consulted:
  - Gate check disabled (`false &&`): the previously-red fixture goes green, confirming the
    mutation landed; the suite then fails 2 of 73 — the two cases that provoke the refusal.
  - Row restored to `covered` in the catalog, gate intact: the gate goes red, confirming the data
    mutation landed; the suite then fails 6 of 73, including the live-catalog invariant and the
    per-bucket census.
  - Both restored: 73 of 73 pass, gate exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, no
  diagnostics (exit code judged, not grepped).
- `npx eslint` on both changed source files — exit 0.

The guard asserts its own precondition: it checks that the control it demotes in the fixture is
still at `behavioralTest.status: "none"`, so if that control is ever proven the case fails loudly
rather than passing over a branch it can no longer reach.

## Rollout Plan

Merge to `main`. No runtime rollout: the gate runs in CI, and neither changed file is read at
runtime. The ACA deploy that follows the merge carries no behavior from this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image behavior changes.
- ACA runtime invariant: unaffected; recorded after merge as routine.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no. Nothing a signed-in user renders is touched.

## Rollback Plan

Revert the commit. The gate returns to its previous validation and the coverage row returns to
`covered`. No migration, no data, no runtime state.

## Audit Evidence

- The PR, its diff and its CI run.
- `node scripts/audit/ai-surface-control-catalog.mjs` output before and after the row was
  corrected — the red run is the one worth reading, because it is the live bytes.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts`, whose per-bucket census records the
  22/14/1 to 21/14/2 movement in the assertion itself rather than in prose.

## Known Gaps

The Tower pressure-brief surface still has five controls with no behavioral test, because nothing
mounts the component. That is unchanged and is deliberately not addressed here: this release makes
the catalog stop claiming otherwise. Whether that component is mounted or retired is a separate,
owner-held decision, and when it is mounted and a render test names the confidence label, the row
becomes `covered` honestly.
