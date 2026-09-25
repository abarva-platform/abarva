# 2026-09-25-source-builder-vocabulary-render-coverage — Declared coverage for the Source builder-vocabulary render control

## Release ID

`2026-09-25-source-builder-vocabulary-render-coverage`

## Status

`candidate`

## Plain-English Summary

There is a good automated control that checks no internal storage vocabulary
reaches a client on a Source screen. It works by rendering the screen and
reading the text the browser would produce, which is the right way to do it.

What nobody had written down is **how much of the product it looks at**. It
looks at three screens. The Source component tree holds 205 non-test component
files, 102 of which a route can actually reach. So the control was covering, at
most, two of those 102 — and the control's name, and its previous release
record, gave a reader no way to tell that apart from a control over the whole
Source surface.

This change measures the coverage, commits the number, and makes the number
fail in both directions:

- a Source component added and left unaudited moves the gap, and the gate
  reddens naming that file;
- an audited screen removed from the control moves the covered set, and the
  gate reddens naming that screen.

The measured answer is **2 of 102, with 100 unaudited**. That was measured, not
assumed, and it contradicts the filing item's own guess that the real gap would
be smaller than 100: the three audited screens render no other Source
component, so following the import graph out of them adds nothing.

One of the three audited screens is one no route can reach. It stays audited —
a proof that runs is worth keeping — and it is explicitly excluded from the
coverage count, with the reason recorded next to the number, because a screen
nobody can open is not shipped product.

## Layer Impact

- **Layer 4 (Products · Source)** — no product behavior changes. No component,
  route, adapter, query or projection is touched. What changes is what the
  repository can say about how much of the Source surface one control proves.
- Layers 1–3 unaffected: no intake, adapter, or canonical-model change.

## Client Applicability

- All clients: no behavioral change.
- Specific clients: none.
- Internal only: yes — test infrastructure, a CI gate, and a committed
  measurement artifact.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/testing/source-builder-vocabulary-coverage.ts` — new. Declares the three
  audited render roots (with the reason the unreachable one is kept but not
  counted) and a pure `measureRenderCoverage` that derives the population,
  the covered upper bound and the remainder from inputs.
- `src/__tests__/behaviors/source-builder-vocabulary-render-coverage.test.ts` —
  new. Feeds the real tree into that function and holds the committed artifact
  to it, per path and per root; plus synthetic cases proving the arithmetic
  moves by exactly one in each direction.
- `docs/architecture/source-builder-vocabulary-render-coverage.json` — new,
  generated. The committed measurement, including every unaudited path.
- `src/components/source/__tests__/source-surface-builder-vocabulary.test.tsx` —
  each audited surface now names its root file, and the suite asserts its
  surface list and the coverage declaration agree per entry in both directions.

No migration, no route, no script, no workflow change.

## QA / Validation

**Method.** The population is walked from `src/components/source` using the same
`walk` / `isExcluded` the route-reachability audit uses, so the two audits cannot
disagree about what a component file is. Reachability is read from the
repository's own `docs/architecture/unreachable-components.json`. The covered set
is the transitive **import** closure of each audited root, computed with the same
`reachableFrom` the route-ownership map uses, intersected with the route-reachable
population.

**Stated as an upper bound, deliberately.** An import closure is a superset of a
render closure — importing a module is not rendering it, and a branch the
fixtures never take renders nothing. So `coveredUpperBound` is an upper bound on
what the control proves, and the remainder is a sound *lower* bound on the gap:
no audited root can reach any of the 100 under any props. Quoting the covered
figure as proven coverage would be this item's own defect in miniature.

**Reconciliation, asserted rather than quoted.** 205 = 102 + 103, and zero orphan
paths under the component tree fall outside the file population. The gate
asserts both, so the subtraction is a subtraction.

**Measured coverage.**

| | |
|---|---|
| non-test `.tsx` under `src/components/source` | 205 |
| of those, reachable by no route | 103 |
| route-reachable population | 102 |
| audited roots | 3 (one of them route-unreachable) |
| import closure of the three roots, all trees | 51 files |
| route-reachable population members in that closure | **2** |
| unaudited remainder | **100** |

Per-root closure sizes: `RenewalCockpitActionBar.tsx` 10, `SimpleStageFront.tsx`
40, `canvas/ArtifactBlockerList.tsx` 5. The union contributes **no** additional
route-reachable Source component beyond the two roots themselves — the three
roots pull library modules, not sibling components.

**The unreachable audited root, settled explicitly.**
`src/components/source/canvas/SimpleStageFront.tsx` is imported by exactly three
files, all of them test suites, and by nothing under `src/app`. The reachability
artifact is correct about it. Verdict: genuinely unreachable, kept in the
control, excluded from the numerator, reason committed beside the number. This is
the verdict item 41 records for `ProgramPressureCards`. The gate asserts the
declaration against the artifact in **both** directions, so if the component is
ever mounted the exemption reddens instead of silently outliving its subject.

**Baseline, same scope, clean worktree at `origin/main` `c8959c43c`.**

Both target scopes are non-deterministic under a parallel run — the baseline
tree alone produced 0, 3 and 4 failing behavior suites over three runs of the
same command, from an unrelated transient-probe race. So the comparable number
is the serial run:

| scope | `origin/main` | this branch |
|---|---|---|
| `jest src/__tests__/behaviors --runInBand` | 131 suites / 1239 tests, **0 failing** | 132 suites / 1256 tests, **0 failing** |
| `jest src/components/source/__tests__` | 27 suites / 185 tests, **0 failing** | 27 suites / 191 tests, **0 failing** |

No pre-existing failure is claimed as caused or fixed here.

**Red first, and the gate proven able to fail.** Recorded in the pull request:
each assertion was broken deliberately on the real tree and the named failure
observed, then restored.

- Typecheck: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
  --pretty false` — exit **0**, zero diagnostics.
- Lint: `npx eslint` over the three changed source files — exit 0.

**What was searched and judged out of scope**, so the next reader inherits it:

- No other product area has a render-measured vocabulary control sharing this
  detector. `src/components/home/v4/__tests__/record-not-served.test.tsx` has a
  one-component vocabulary assertion with its own hand-typed pattern list and no
  population source at all. It should arguably share
  `src/testing/source-builder-vocabulary.ts`; that is a separate item, filed.
- Extending the audited surface list is deliberately not done here. The filing
  item makes it conditional, and a worst-first ranking of the 100 was computed
  so the follow-on starts from evidence: a syntax-aware pass (TypeScript AST,
  JSX text and string literals only — not a regex over the file, which answers a
  different question) finds **34 of the 100** carrying at least one
  identifier-shaped token in a position that can reach a screen. Top of the
  ranking: `canvas/analytics/SourceAnalyticsCanvas.tsx` (32 candidate terms),
  `SourceOptimizeContractPage.tsx` (25), `new-workspace/SourceNewWorkspace.tsx`
  (17), `canvas/responses/VendorResponseFileReadinessPanel.tsx` (13),
  `canvas/analytics/insights/StepInsightPanel.tsx` (11). These are **candidates
  for ordering, not findings** — many are switch discriminants mapped to a label
  before render, which is exactly why the control must stay render-measured.
- A reader's confirmation on the deployed surface is outside this acceptance by
  the item's own wording. None is claimed.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is imported by a
route, a job, or a script. The new gate runs in the existing
`src/__tests__/behaviors` CI scopes and the changed suite in the existing Source
component suites scope, both on the first pull request that includes it.

## Deployment Authority

Not applicable — no Azure Container Apps, image, traffic, flag, env var, worker
job, DNS or environment-promotion surface is affected.

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none.
- Approved image digest: n/a — no runtime change.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — no product surface changes.

## Rollback Plan

Revert the commit. There is no migration, no data write, and no runtime
dependency, so revert is complete and immediate. The only effect of a revert is
that the coverage number stops being asserted.

## Audit Evidence

- The pull request, with the deliberate-break results for each assertion.
- `docs/architecture/source-builder-vocabulary-render-coverage.json` — the
  committed measurement, regenerable with
  `ABARVA_UPDATE_SOURCE_VOCAB_COVERAGE=1 npx jest --runTestsByPath
  src/__tests__/behaviors/source-builder-vocabulary-render-coverage.test.ts`.
- CI: the behaviors unit scopes and `Source component suites`.
- The prior record this one corrects the labelling of:
  `docs/releases/records/2026-09-24-source-builder-vocabulary-render-control.md`.
