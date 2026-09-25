# 2026-09-25-u508-financial-values-prop-required — Make the Source financial-visibility prop a required answer

## Release ID

`2026-09-25-u508-financial-values-prop-required`

## Status

`candidate`

## Plain-English Summary

Eight Source components decided, on their caller's behalf, that a reader was
allowed to see exact financial figures. Each declared its financial-visibility
prop as optional and defaulted it to "yes", so a caller that simply omitted the
prop got exact amounts printed — no error, no warning, nothing in the rendered
page to say a decision had been made for it. One component in the same family
defaulted to "no", which is the evidence that the default was a choice rather
than a house convention.

The default is removed rather than flipped. Flipping it to "no" would still let
a caller stay silent and would still answer for them; the silent answer is the
defect, not its direction. The prop is now required, so the compiler makes every
caller state an answer, and at run time an absent value reads as "no" so a
JavaScript caller that slips past the type also fails closed.

This removes a latent defect, not a live leak. Seven of the nine components in
this family are unreachable from any route today, and the two with live mounts
already passed the flag explicitly. One call site on disk did omit it — the
Source dashboard component, which is imported only by two test files — and it
now takes the answer from its own caller instead of inventing one.

## Layer Impact

Release lane: `global-control-lane` — shared component behavior for all clients,
not feature-gated and not client-scoped.

- **Layer 4 — Products (Source).** Component prop contracts only. No read path,
  query, projection or canonical model changes. No rendered output changes for
  any mounted surface, because every mounted call site already passed the flag.

## Client Applicability

- All clients: yes — the components are shared, but no mounted surface changes
  its output, so no client sees a difference.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/` — eight components lose the `= true` default and the
  `?` on the prop: `SentinelEngagementCanvas`, `SourceAlertPanel`,
  `SourceEventsPortfolio`, `SourceOptimizeContractPage`,
  `SourcePortfolioBookPage`, `SourcePortfolioPage`, `SourceValueLedger`,
  `SourcingEventTable`. `SourceEventsViewToggle` is deliberately untouched: it
  already defaulted to `false`, so it has no fail-open default to remove.
- `src/components/source/AbarVaSourceDashboard.tsx` — takes the flag as a
  required prop of its own and threads it into its two financial children,
  rather than answering for its caller.
- `src/components/source/SentinelEngagementCanvas.tsx` — threads its own value
  into the alert panel it mounts. See Known Gaps: this changes no rendered
  output today.
- `src/components/source/__tests__/financial-values-prop-required.test.tsx` —
  new suite, 20 tests. Collected by the existing `Source component suites`
  workflow, which runs the directory as a unit, so no workflow edit is needed.
- 11 existing suites updated to state an answer at their mounts.

## QA / Validation

Red first, at both layers, before the fix:

- **Render:** 8 of 8 components printed the exact amount with the prop omitted.
  That is the measurement — 8 of 8, not "the suite went red".
- **Type:** 8 of 8 `@ts-expect-error` directives reported `TS2578 Unused` —
  the compiler stating that omitting the prop currently compiles.

After the fix: 20 of 20 pass; `tsc --noEmit` exits 0 with 0 errors (exit code
judged, not grep output); `eslint` 0 errors on the changed paths.

Baseline over the same scope, measured in a separate clean worktree at
`origin/main` (not a stash): the 11 pre-existing suites this change touches
failed **21 tests before and 21 after**, and the failing set is identical
test-by-test, not merely equal in count. Those 21 are pre-existing data-plane
failures in the Source integration suites and are not caused by, nor fixed by,
this change.

Four mutations, three killed and one proven unreachable:

| # | mutation | result |
|---|---|---|
| M1 | restore `= true` on one component | **killed** — that component's omitted-prop test fails |
| M2 | `= false` instead of removing the default | **killed by the type layer ONLY** — the render suite stays 20 of 20 green; `TS2578` fires. This is the decisive one: it proves the two layers are not redundant, and that a render-only proof cannot tell "removed" from "defaulted safe" |
| M3 | hard-code a literal `true` at the two forced dashboard call sites | **killed** — the threading test fails |
| M4 | hard-code a literal `true` at the canvas call site | **survives** — and the branch is proven unreachable rather than merely uncovered: with the two seeded alerts and no `eventContextById`, the panel's rendered HTML is byte-identical under `true` and `false`, because the flag is read only inside the `eventContext` branch |

- `npx jest src/components/source/__tests__` — 25 suites, 156 tests, all pass.
- `src/__tests__/behaviors/route-ownership-map-is-true.test.ts` and
  `source-language-canon.test.ts` — 36 tests, pass.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on
merge. No migration, no flag, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded on the deploy run keyed to the merge SHA.
- ACA runtime invariant: to be proven after merge by reading the Container App
  template image and the 100%-traffic revision image and showing they match.
- Worker image invariant: not asserted — this release requires no worker job and
  did not touch one.
- Feature/env flag update path: none.
- Live signed-in proof required: not for behavior, since no mounted surface
  changes output. See Known Gaps.

## Rollback Plan

Revert the PR and redeploy. The change is type-level plus prop threading with no
persisted state, so revert is complete and immediate.

## Audit Evidence

PR URL, its CI run, the deploy run keyed to the merge SHA, the ACA template and
revision digests, and the before/after baseline numbers recorded above.

## Known Gaps

- **The canvas pass-through is inert today.** `SentinelEngagementCanvas` mounts
  `SourceAlertPanel` without `eventContextById`, and that is the only branch in
  which the panel reads the flag. Threading the canvas's own value is the
  correct answer and is what keeps a literal out of the code, but it changes no
  rendered output at present. Stated rather than guarded, because there is no
  reachable branch to assert against.
- **The Source dashboard prints exact figures from its own body.** Independent
  of the two children fixed here, `AbarVaSourceDashboard` renders value-at-stake
  and under-management amounts through `formatUsd` calls that consult no flag at
  all. Out of scope for this item and filed separately.
- **Whether that dashboard should exist is unsettled.** It is imported only by
  two test files. Deleting it would also delete a route-ownership assertion and
  a production-readiness tracker entry, which is a product decision this item
  does not carry. Filed as a decision rather than guessed.
- No signed-in acceptance is claimed. None is owed for behavior here, since no
  mounted surface changes its output.
