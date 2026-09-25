# 2026-09-25-u509-source-own-body-financial-gate — Source components gate the figures they print themselves

## Release ID

`2026-09-25-u509-source-own-body-financial-gate`

## Status

`candidate`

## Plain-English Summary

Two Source screens passed the "can this person see exact money?" answer correctly to every panel
they contain, and then printed the same amounts themselves, from their own markup, without ever
asking the question. The command-centre screen redacted its alert list and its event table and two
lines higher still read "$98.3M under management". This change makes those lines ask the same
question everything around them already asks.

Nothing a signed-in reader sees changes today, and this must not be reported as a disclosure
incident. Both places were unreachable with the restricted answer: one screen is not mounted on any
route, and on the other the page deliberately loads no contract data when the answer is "no", so
there was no figure to print. What is removed is the possibility — the screens now fail closed on
their own rather than depending on someone upstream to starve them.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not feature-gated.

- **Layer 4 — Products (Source).** Presentation only. Two components changed; no canonical data,
  adapter, query, schema or entitlement logic was touched.
- The entitlement decision itself is unchanged: it is still computed once, in the route, from
  `loadUserSourceAccessPolicy`. This change only makes two components consume the answer they were
  already being handed.

## Client Applicability

- All clients: yes, on the Optimize Contract page — as a defence-in-depth change with no visible
  difference in either direction today.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/AbarVaSourceDashboard.tsx` — four `formatUsd` calls in the component's own
  body now go through `formatSourceFinancialValue(value, canViewFinancialValues)`. The direct
  `formatUsd` import is gone, so the component no longer holds an ungated formatter at all.
- `src/components/source/SourceOptimizeContractPage.tsx` — `ModuleHeader` takes
  `canViewFinancialValues` and reads it. It renders outside the `!canViewFinancialValues` branch, so
  it was the one ungated call site in this directory on a route-mounted page.
- `src/components/source/__tests__/source-own-body-financial-disclosure.test.tsx` — new, 10 cases.
- This record.

## The census the item asked for, which is the deliverable

Every `formatUsd` / `formatCompactUsd` render invocation under `src/components/source/`, measured on
`origin/main` `685c7a4c5`:

| file | render invocations | gated | ungated |
|---|---|---|---|
| `SourceOptimizeContractPage.tsx` | 10 | 9 (branch) | 1 |
| `RenewalCockpitView.tsx` | 9 | 0 | 9 |
| `AbarVaSourceDashboard.tsx` | 4 | 0 | 4 |
| `SourceDecisionQueueView.tsx` | 3 | 0 | 3 |
| `SourcePortfolioPage.tsx` | 3 | 3 (ternary) | 0 |
| `canvas/bafo/BafoScenarioComparePanel.tsx` | 3 | 0 | 3 |
| `canvas/responses/VendorResponseDecisionProofPanel.tsx` | 2 | 0 | 2 |
| `SourceExecutionRoomPage.tsx` | 1 | 0 | 1 |
| `SourcePortfolioReactivePanel.tsx` | 1 | 0 | 1 |
| **total** | **36** | **12** | **24** |

**24 of 36 are ungated.** Of those 24, only 5 sit in a file that receives the visibility answer at
all — the 4 this change fixes plus the header site it found. The other 19 are in seven components
with no such prop anywhere in the file, which is a per-component design question rather than a
missing argument, and is filed rather than absorbed here.

## Where the gate belongs, and why the item's preferred option was not available

The item offered two mechanisms: each call site reads the flag, or the formatter takes the flag as a
required argument so an omission is a compile error. It preferred the second, and asked that the
first not be chosen without a reason.

The second is not available as written, because **there is no single formatter.**
`src/components/source/` contains eight independent local `formatUsd` / `formatCompactUsd`
definitions, and the shared `@/lib/source/value-ledger` export is the *implementation* of
`formatSourceFinancialValue` — so requiring a flag on it would force that helper to pass `true` and
re-author this exact defect one layer further down. The shared export also has non-display consumers
that are not entitlement decisions.

What was chosen instead keeps the second option's enforceability at a boundary that already exists:
the changed sites call `formatSourceFinancialValue`, whose flag is already a required positional
parameter, so at a changed site an omission is a compile error (`TS2554`). Mutation M9 below proves
that arity is load-bearing rather than merely asserted.

## QA / Validation

**Red first.** The new suite on the unfixed tree: **3 failed, 4 passed of 7.** Both defects
reproduced from rendered output, not read from source — the restricted render contained
`$98.3M under management`, `Value exposed$18.5M`, `Value At Stake$98.3M`,
`$21.3M sits in waiting or blocked events`, in the same render where the alert panel printed
`Restricted exposed` and the event table printed `Restricted`.

**A survivor, and what it changed.** The first draft's granted-direction assertion matched a
magnitude anywhere in the container. Mutation M5 — make the body restrict *unconditionally* — passed
it **10 of 10**, because the alert panel and the event table are granted in the same render and their
figures satisfied a container-wide match. Each of the four sites is now asserted against the label it
sits beside, and M5 fails 4 of 10. Without that pass this suite could not tell "reads the flag" from
"always says no", which is exactly what acceptance clause (3) exists to prevent.

**Mutations — nine, each asserted to change the file's bytes before the suite ran. All nine killed.**

| # | mutation | result |
|---|---|---|
| M1 | narrative `under management` back to the ungated formatter | 2 of 10 fail |
| M2 | `sits in waiting or blocked` back to ungated | 2 of 10 fail |
| M3 | `Value exposed` back to ungated | 1 of 10 fails |
| M3b | `Value At Stake` KPI back to ungated | 1 of 10 fails |
| M4 | `ModuleHeader` back to ungated | 1 of 10 fails |
| M5 | dashboard restricts unconditionally | 4 of 10 fail |
| M6 | Optimize header restricts unconditionally | 1 of 10 fails |
| M7 | `ModuleHeader` receives a literal `true` instead of its caller's value | 1 of 10 fails |
| M9 | `formatSourceFinancialValue`'s flag given a default | `tsc` exit **2**, `TS2578 Unused '@ts-expect-error' directive` |

M7 matters on its own: a literal `true` satisfies the compiler and reinstates the defect one level
up, which is how this family was authored the first time. Only a mount that restricts distinguishes
the two.

**Baseline over the same scope, from a separate clean worktree at `origin/main` `685c7a4c5` — not a
stash.** The six pre-existing suites that reference either component: **73 passed, 0 failing before;
83 passed, 0 failing after** (the +10 are this change's new cases). No absolute failure count is
quoted as though this change caused it.

- `npx jest src/components/source/__tests__ --no-coverage --ci` — the command
  `.github/workflows/source-component-suites.yml:35` runs — **26 suites, 166 tests, 0 failing.** The
  new file lands in a directory that workflow already runs as a directory, so no workflow edit was
  needed and none was made.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit **0**, judged on the
  exit code, with `tsconfig.tsbuildinfo` removed first.
- `npx eslint` on the three changed files — exit **0**.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys. No migration, no flag,
no data build, no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded against the deploy run keyed to this change's merge SHA.
- ACA runtime invariant: to be proven after deploy — Container App template image, 100%-traffic
  revision image and required worker job images equal the approved digest.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No mounted surface changes its output in either direction.
  One component is route-unreachable; on the other, the route already starves the data when the
  answer is "no", so the branch this change gates is not reachable through the product today.

## Rollback Plan

Revert the PR. Two components, presentation only, no schema or data dependency, so a revert restores
the prior rendering exactly.

## Audit Evidence

- The PR and its check runs.
- `src/components/source/__tests__/source-own-body-financial-disclosure.test.tsx` — the permanent
  control, run by `source-component-suites.yml`.
- The red-first and per-mutation numbers in the QA section above, each reproducible by applying the
  named mutation to the named line.

## Known Gaps

- **19 ungated render sites remain** in seven components that have no visibility prop at all:
  `RenewalCockpitView` (9), `SourceDecisionQueueView` (3), `BafoScenarioComparePanel` (3),
  `VendorResponseDecisionProofPanel` (2), `SourceExecutionRoomPage` (1), `SourcePortfolioReactivePanel`
  (1). Filed as `U-520`. Each needs a per-component answer about where its entitlement comes from;
  none is fixed here and none is claimed to be.
- **Eight duplicate local formatter definitions** in this directory are the structural reason the
  item's preferred mechanism was unavailable. Consolidating them is in `U-520`'s scope statement, not
  this change's.
- Whether `AbarVaSourceDashboard` should exist at all — it is imported by tests and by no route — is
  `U-519`, a decision item, and was deliberately not touched.
