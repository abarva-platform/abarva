# 2026-09-25-source-contract360-opportunity-count-labels — Two opportunity counts on one contract page, told apart

## Release ID

`2026-09-25-source-contract360-opportunity-count-labels`

## Status

`candidate`

## Plain-English Summary

One contract page printed the word "opportunities" against two different numbers,
from two reads that count two different things, and nothing on the page said so.

- The Story tab's evidence-state list read a persisted coverage column. That
  column is a count of governed **action-candidate rows loaded as evidence** for
  the contract — `count(*)` over `source.contract_action_candidate_v1` in
  `supabase/migrations/20260910203000_source_contract_tab_intelligence.sql`.
- Six other counts on the same page read the contract's **optimization
  opportunity set** — `source.optimization_opportunity`, or a set derived from
  the `source.golden_contract_*` tables when no persisted one exists.

When the evidence lane was unloaded and the opportunity set was not, the page
printed `Opportunities · 0` a few inches from a sentence counting three of them.

**The decision, in one sentence:** these two reads measure different populations,
so neither is the authoritative count of the other, and the page now names which
one each number is rather than forcing them to agree. The evidence lane reads
`Opportunity evidence rows`; the plain word stays with the opportunity set.

A second, separate defect in the same panel: the opportunity queue rendered the
first five of the set while the sentences above it counted all of them, with no
disclosure. The relationship graphic plotted the same first five under an
unqualified heading. Both now say `Showing 5 of N` when the set is larger. The
cap is reached, not theoretical — the densest opportunity fixture in the
repository carries six rows for one contract. Measured over every
`optimization_opportunities.csv` under `datasets/source/contract-depth/` and
`datasets/source/cloud-consumption/`, grouped by `contract_id`: the densest
single contract holds **six**, and three other packages hold five or four. The
suite beside this one already renders a six-lever view model.

Nothing about how opportunities are computed changed. This is what the page says
about them.

## Layer Impact

**Release lane: `global-control-lane`.** Shared app behaviour for all clients, not
feature-gated: two rendered labels change for every tenant that opens a Contract
360 workspace.

- **Layer 4 — Products (Source).** Two rendered labels and two cap disclosures on
  the Contract 360 workspace surfaces. No read path, query, projection or number
  changed.
- **Layers 1–3.** Untouched. No intake, adapter or canonical-model change; no
  migration; no schema or type change.

## Client Applicability

- All clients: yes — the labels are tenant-independent and no flag gates them.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added or changed.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/Contract360Surfaces.tsx` — the
  evidence-state lane is named for the rows it counts, with the two reads and
  their sources recorded beside it.
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx` — the
  opportunity queue and the relationship graphic disclose the five-row cap when
  the set is larger.
- `src/app/(maestro)/source/preview/workspace/__tests__/contract360-opportunity-count-labels.test.tsx`
  — new behavioural suite, asserting from rendered DOM.
- `.github/workflows/unit-suites.yml` — the new suite is named in the
  pull-request job. This directory is covered by ENUMERATION, so a file that is
  not named runs nowhere; that is the shape T-478 found hiding seven files in
  this same directory, and a suite proving two labels are distinct would
  otherwise have been dark.
- `docs/architecture/test-ci-coverage-census.json` — refreshed, because the
  committed census is the input that ranks which directory gets wired next.

## QA / Validation

**Red first, from rendered output, at the surface.** Every assertion renders the
real components and reads the DOM; none inspects an adapter return value.

- Before the fix, on the disagreeing fixture (coverage `opportunity_rows` 0,
  opportunity set 3), the rendered evidence lanes were
  `["Scope rows · 4", "Spend months · 12", "Service performance · 6", "Document page text · 88", "Opportunities · 0"]`
  — the defect, quoted from the test's own failure output.
- New suite: **3 failed / 2 passed of 5 before the fix → 7 passed of 7 after**
  (two cases were added with the relationship-graphic disclosure). The two that
  passed before the fix are the negative controls and are meant to.
- **Negative controls, both directions.** A fixture where coverage and the
  opportunity set already agree (3 and 3) stays green throughout — the change is
  a labelling change, not a recount. A four-opportunity fixture must show no cap
  disclosure at all, on both the queue and the graphic.
- **Five mutations, five caught** (failing cases in brackets):
  1. lane label reverted to `Opportunities` — caught [2]
  2. queue cap disclosure removed from the subtitle — caught [1]
  3. relationship-graphic cap disclosure removed — caught [1]
  4. cap disclosure fires unconditionally (`> 0` on both sites) — caught [2],
     by the negative controls, so the guard fails in both directions
  5. queue slice widened to six while the sentence still says five — caught [1]

  Each mutation was restored from a byte copy taken before the run and the suite
  re-confirmed green afterwards.
- **Scope baseline, clean, same scope both sides:** `npx jest
  'src/app/(maestro)/source/preview/workspace'` — **35 suites / 303 tests / 0
  failing before → 36 / 310 / 0 after**. The before run excluded only the new
  file, which did not yet exist on `origin/main`.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after
  removing `tsconfig.tsbuildinfo`: **exit 0, judged by exit code**, 0 diagnostics.
- `npx eslint` over the three changed source files: exit 0.
- `npm run audit:test-ci-coverage:check`: exit 0. Shape matches; the counts moved
  `testFiles 2442 → 2443`, `coveredTestFiles 1998 → 1999` — the new file is
  counted as covered, which is the evidence that the CI wiring took. The census
  was then refreshed and re-checked clean.
- `src/__tests__/behaviors/t478-source-workspace-dark-suite-ci-coverage.test.ts`
  (the guard over this directory's wiring record): 22 passed of 22.
- **The CI-gated `src/__tests__/behaviors` scope is non-deterministically red at
  base and that is not this change.** Two consecutive full runs of that scope on
  *this identical tree* gave **1 failing, then 4 failing** — a count that moves
  without the tree moving. Every failure carries one signature: the census
  subprocess dying on `ENOENT` at `test-ci-coverage-census.mjs:424` reading
  `src/lib/agent/__tests__/t743-coverage-probe.generated.test.ts`, a probe file
  another suite writes and deletes mid-run. That is filed as **T-759**, and as
  residual (c) of T-758, which measured the same signature red 2 of 6 runs on a
  clean worktree of `origin/main`. Run individually, the affected suites pass
  (`test-ci-coverage-census.test.ts` 51 of 51).

**No live-environment walk was performed and none is claimed.** The item's
acceptance scopes its proof to rendered output in a jest render and says
explicitly not to open one.

## Rollout Plan

Merge to `main` by squash. The repo-owned `aca-main-deploy` workflow builds the
digest-pinned image and shifts Product/Lab web traffic. No migration, no data
build, no flag or environment change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to
  `main`. No hand-run Azure command is part of this release.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the deploy run keyed to the squash SHA;
  recorded in the claim register when read.
- ACA runtime invariant: to be proven after the deploy by reading both sides —
  the Container App template image and the image of the sole 100%-traffic
  revision — rather than inferred from the workflow succeeding.
- Worker image invariant: **no worker claim is owed.** This change touches three
  files under `src/app` and two CI/report artifacts; no worker job code is in the
  diff, so a worker digest comparison here would be a proof with no subject.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **not for this item.** Its acceptance scopes
  closure to the panel's DOM in a jest render and excludes a live walk. A
  signed-in read of these two labels on a real tenant remains a separate lane
  and is not claimed here.

## Rollback Plan

Revert the squash commit and merge the revert; the deploy workflow ships the
previous digest. Nothing persisted, nothing migrated, so a revert is complete.
The CI wiring and the census refresh revert with it.

## Audit Evidence

- The pull request, its check-runs, and the squash SHA.
- The new suite's own output before and after, and the five mutation runs
  recorded above.
- The deploy run keyed to the squash SHA, and the template-versus-100%-traffic
  digest comparison read from Azure.
- The `optimization_opportunities.csv` files under
  `datasets/source/contract-depth/` and `datasets/source/cloud-consumption/`,
  grouped by `contract_id` — the six-row contract is what makes the cap branch
  reachable rather than theoretical.

## Known Gaps

- **The two reads are still two reads.** This change makes the page honest about
  that; it does not reconcile them, and reconciling them is a data-plane question
  about whether an action candidate and an optimization opportunity should be one
  governed population. Out of scope here by the item's own exclusion.
- **`opportunity_rows` at zero still reads `None found`** in the lane's state
  column. That is accurate about the evidence lane and was not widened here.
- The `src/__tests__/behaviors` race described above is open as T-759 and is not
  touched by this change.
