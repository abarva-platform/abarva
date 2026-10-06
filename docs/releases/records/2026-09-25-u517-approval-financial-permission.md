# 2026-09-25-u517-approval-financial-permission — Resolve the Source approval financial-value permission from policy

## Release ID

`2026-09-25-u517-approval-financial-permission`

## Status

`candidate`

## Plain-English Summary

Two Source surfaces showed a viewer the exact requested value of a sourcing event
without ever asking whether that viewer is allowed to see exact financial
figures.

The product has a per-user access policy that answers exactly that question, and
both surfaces already loaded it for a different question — may this person
approve a stage. Neither asked it the money question. Instead each passed a hard
`true` into the helper whose whole job is to return `Restricted` for a viewer who
may not see amounts. With the argument pinned true the helper could never
restrict anything, so the restriction existed in the code and never once applied
on these two surfaces.

Both now read the answer from the loaded policy, and both fail closed: when the
policy cannot be read at all, the figure is withheld rather than shown. A viewer
who is permitted still sees the amount — that direction is asserted too, so an
always-restrict page could not pass these tests either.

The surfaces are the standalone event approval page and the Strategy step of the
event canvas, which derives the same field through a shared builder. The shared
builder's permission argument is now required with no default, so a future caller
cannot reach the old behaviour by leaving it out.

## Layer Impact

Release lane: `global-control-lane`. The behaviour is shared app and
control-plane behaviour for every client, it is not feature-gated, and it is not
client-scoped data — what an individual viewer sees follows that viewer's own
access policy rather than their tenant.

- **Layer 4 — Products (Source).** Two read surfaces change what they render for
  a restricted viewer. No canonical value changes, no write path changes, and no
  loader, adapter or projection is touched.
- **Control plane (authorization).** A permission that was declared and never
  consulted on these surfaces is now consulted. This is a tightening: some
  viewers will see `Restricted` where they previously saw an amount. That is the
  policy's stated intent, not a regression.

No layer 1, 2 or 3 change. No migration, no schema change, no data build.

## Client Applicability

- All clients: yes — the behaviour follows each viewer's own access policy, so
  what any individual sees depends on their policy rather than on their tenant.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. A flag here would mean a flag on an authorization check.

## Changes Included

- `src/app/(maestro)/source/events/[eventId]/approval/page.tsx` — resolves
  `canViewFinancialValues` from the already-loaded access policy and passes it to
  `buildCapturedFacts`, replacing the literal `true` argument to
  `formatSourceFinancialValue`.
- `src/lib/source/facts/view/strategy-stage-builder.ts` —
  `deriveStrategyIntakeFacts` takes the permission as a **required** second
  parameter instead of assuming it. The same literal `true` lived here.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — reads the access policy
  once, before the derivation, and answers both questions from it. It previously
  read the policy only inside the approval branch, after the derivation, which is
  the structural reason the literal was there. `buildStrategyStageForRoute` is
  exported so its resolution is reachable from a test; the repository already
  does this with `renderTowerPage` in the Tower page module.
- `src/app/(maestro)/source/__tests__/approval-financial-permission.test.tsx` —
  new suite, nine cases.
- `src/app/(maestro)/source/__tests__/requester-estimate-disclosure.test.tsx` —
  the policy fixture now states that its viewer may see financial values. That
  was implicit while the page ignored the policy.
- `.github/workflows/unit-suites.yml` and
  `src/__tests__/behaviors/source-readiness-route-suite-ci-coverage.test.ts` —
  the new suite is wired into the pull-request job in the same change, and the
  ownership control's counts move with it.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

**Re-verified on `main` first.** Both literals were present on `origin/main`
`a32196ecd`, and both call sites are reachable from a mounted route.

**Red first.** The new suite fails 3 of 6 on the unmodified tree — the restricted
case, the unreadable-policy case, and the mirrored derivation. The permitted
cases pass before the change, because the old code always revealed. After the
change: 9 of 9 pass (three route-level cases were added once the route's builder
was reachable).

**Mutation — eight run, eight killed.** Counts are over both Source approval
suites together, 14 passing at baseline:

| # | mutation | result |
|---|---|---|
| M1 | approval page passes the literal `true` again | 2 failed |
| M2 | approval page fails open (`!== false`) | 1 failed |
| M3 | shared builder pins its own flag to `true` | 1 failed |
| M4 | canvas route passes the literal `true` again | 2 failed |
| M5 | approval page always restricts | 2 failed |
| M6 | shared builder always restricts | 1 failed |
| M7 | canvas route fails open (`!== false`) | 1 failed |
| M8 | canvas route always restricts | 1 failed |

M5, M6 and M8 are the both-directions control: an always-restrict surface is as
wrong as an always-reveal one, and without those three a test suite that only
asserted `Restricted` would pass a page that never shows a figure to anyone.

M4 is worth recording because it **survived** the first version of this change.
With `buildStrategyStageForRoute` private there was no way to reach the route's
resolution from a test, so the only guard on that call site was the compiler —
and `deriveStrategyIntakeFacts(row, true)` typechecks. The required parameter
prevents omission; it does not prevent a literal. Exporting the function and
adding three route-level cases took M4 from survivor to 2 failed.

**CI wiring proven by mutation, not by a green run.** Removing the new suite's
path from the workflow step moves the census's `coveredTestFiles` for
`src/app/(maestro)/source/__tests__` from 4 to 3 while `testFiles` stays at 5,
and the ownership control fails. That difference is the wiring.

**Census, measured against a clean baseline over the same scope** — the tree
without the new test file versus with it:

| count | before | after |
|---|---|---|
| `src/app/(maestro)/source/__tests__` `testFiles` | 4 | 5 |
| `src/app/(maestro)/source/__tests__` `coveredTestFiles` | 3 | 4 |
| repository `testFiles` | 2438 | 2439 |
| repository `coveredTestFiles` | 1992 | 1993 |

The committed census read 2435 / 1989 before this change, so it was three files
stale independently of this work. The refresh absorbs that drift as well as this
change's one file; only the +1/+1 is attributable here.
`node scripts/quality/test-ci-coverage-census.mjs --check` passes.

**Other commands.**

- `npx tsc --noEmit --pretty false` with a 6144 MB heap — **exit 0**, no
  diagnostics. Judged on the exit code, because a bare run exits 134 on the
  author's machine with no output at all.
- `npx eslint` over all six changed source and test files — exit 0.
- The full wired workflow step, all eight suites: 65 of 65 pass.
- `src/components/source/canvas/analytics/__tests__/StrategyStage.test.tsx`
  (the builder's other consumer): 9 of 9 pass.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` passes.
- `src/__tests__/integration/source/source-event-canvas-shell.test.ts` fails 10
  of 12 **both before and after** — measured by restoring the three changed
  source files to `HEAD` and re-running. It is a pre-existing red suite that
  needs a reachable data plane; it is not caused by this change and is not
  repaired by it.

**Permission-helper census.** Nine files call `formatSourceFinancialValue`.
Per file:

| file | verdict |
|---|---|
| `src/app/(maestro)/source/events/[eventId]/approval/page.tsx` | **real defect — fixed here.** Mounted route, literal `true`. |
| `src/lib/source/facts/view/strategy-stage-builder.ts` | **real defect — fixed here.** Literal `true`, reached from the mounted event detail route. |
| `src/components/source/SourceValueLedger.tsx` | correct already. Its only mount, `(maestro)/source/value/page.tsx`, resolves the flag from the access policy and passes it. |
| `src/components/source/SentinelEngagementCanvas.tsx` | no restricted reader today. Takes the flag as a prop; imported by no route — `src/lib/qa/active-route-ownership-map.ts` records that explicitly. |
| `src/components/source/SourceEventsPortfolio.tsx` | no restricted reader today. Prop-driven, and three route suites assert no route contains it. |
| `src/components/source/SourcingEventTable.tsx` | no restricted reader today. Prop-driven; reached only from the two unmounted components above. |
| `src/components/source/SourceAlertPanel.tsx` | no restricted reader today. Prop-driven; reached only from unmounted components. |
| `src/components/source/SourceEventsViewToggle.tsx` | no restricted reader today, and its prop already defaults to `false` — the safe direction. |
| `src/components/source/AbarVaSourceDashboard.tsx` | no restricted reader today. It mounts `SourcingEventTable` **without** the prop, which would reveal by default via that component's `= true`; imported only by tests. |

Eight Source components default this prop to `true`, which is the same
fail-open shape one mount away from being live; only `SourceEventsViewToggle`
defaults to `false`. That is filed rather than fixed here, because changing a
shared default touches surfaces this item did not measure. See **Known Gaps**.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds the
image and deploys it; no manual Azure command, no migration, no data build, no
flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, triggered
  by the merge to `main`. No other path is used.
- Shared runtime mutators: none. This change runs no `az` command and does not
  touch env vars, flags, scale, secrets or traffic weights.
- Approved image digest: assigned by the deploy run for the merge SHA; recorded
  in the execution pulse once the run completes.
- ACA runtime invariant: to be proven after the deploy by reading the Container
  App template image and the 100%-traffic revision image from both sides and
  confirming they are the same digest and the revision is Healthy.
- Worker image invariant: not applicable; no worker job changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **yes, and it is owed, not claimed.** The
  behaviour is per-viewer authorization, and the honest acceptance is two
  signed-in sessions — one whose policy permits exact financial values and one
  whose policy restricts them — on the event approval page and the canvas
  Strategy step. That needs two real accounts with differing policies and cannot
  be performed by an agent.

## Rollback Plan

Revert the squash commit and let the deploy workflow ship the previous image;
there is no state to unwind. Rolling back restores a surface that shows exact
figures to restricted viewers, so prefer a forward fix unless the revert is
required for an unrelated reason.

## Audit Evidence

- The pull request for this record, including the red-first counts and the
  eight-mutation table above.
- The pull-request CI run, in which the new suite runs inside
  **Run Source readiness and route suites**.
- The refreshed `docs/architecture/test-ci-coverage-census.json` and a passing
  `test-ci-coverage-census.mjs --check`.
- The deploy run for the merge SHA, and the digest comparison named under
  **Deployment Authority**.

## Known Gaps

- **The signed-in acceptance is owed**, as stated above. Nothing here should be
  read as live-proven.
- **Eight Source components default `canViewFinancialValues` to `true`**:
  `SentinelEngagementCanvas`, `SourceAlertPanel`, `SourcePortfolioBookPage`,
  `SourcePortfolioPage`, `SourceValueLedger`, `SourceEventsPortfolio`,
  `SourceOptimizeContractPage` and `SourcingEventTable`. One,
  `SourceEventsViewToggle`, defaults to `false`. A default that reveals is the
  wrong default for a permission-gated argument: an omitted prop reveals, and an
  omitted prop is the easiest thing in the world to write. `SourceValueLedger`
  and `SourceOptimizeContractPage` have mounts that do pass the flag, so the
  default is dormant rather than active there; the rest are prop-driven
  components whose mounts are unreachable today. Each was left alone rather than
  changed on the strength of measurements this item did not take. Filed as a
  follow-on, with the recommendation that the default be removed entirely so the
  caller must answer.
- **The canvas Strategy proof is at the route builder, not at rendered DOM.**
  The event detail route has no render harness, and building one is larger than
  this change. The three route cases assert the `StageAnalyticsView` the canvas
  renders from, which is one layer short of the DOM; the approval page's cases
  are DOM.
- **`src/__tests__/integration/source/source-event-canvas-shell.test.ts` remains
  red** at 10 of 12, unchanged by this work.
- The restricted rendering reads `Requester estimate: Restricted (not
  validated)`, composing the U-514 provenance label around the withheld amount.
  That is deliberate — provenance is not the restricted part, and a bare
  `Restricted` would leave a viewer unable to tell a withheld declared estimate
  from a withheld measured value — but it is a wording choice worth a second
  opinion rather than a proven one.
