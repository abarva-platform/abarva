# 2026-09-26-intelligence-promotion-brief-panel-catalogued — One uncatalogued AI surface, catalogued and held to a test

## Release ID

`2026-09-26-intelligence-promotion-brief-panel-catalogued`

## Status

`candidate`

## Plain-English Summary

`docs/security/ai-surface-control-catalog.json` answers "which AI disclosure control is proven on
which surface". A previous change gave every `catalogClaimCoverage` row a *join* — either a
`surfaceId` pointing at a catalogued surface, or a `surfaceJoin` saying, in a field a validator
re-measures, why no single surface can be named. That made a gap countable for the first time:
**13 of the 37 rows were `uncatalogued` — the code path a legal catalog row declares is in the
tree, and no `controls[]` entry names it.** Each of those 13 is a claim, taken from a legal
document, that an AI-generated surface carries a citation, confidence or AI-label control, with no
catalog entry for the gate to hold it to.

Naming the gap did not close it. This change closes **one surface of the nine** those 13 rows span,
and deliberately only one: each is a judgement about what a surface actually guarantees, and a
batch of thirteen is a diff nobody reads.

The surface taken is the **Intelligence pattern promotion brief panel**
(`src/components/programs/origination/ProgramBriefPanel.tsx`), because it is the only uncatalogued
surface that is both reachable from a route and already carries, in running code, the controls its
legal row claims. The other eight were measured and rejected for stated reasons, recorded under
Known Gaps so the next agent does not repeat the search.

Three rows leave `uncatalogued`, and they do not all land in the same place — which is the point of
reporting per row rather than as a count:

| control kind | new state | why |
|---|---|---|
| `ai-label` | `covered`, `surfaceId` | The panel says in machine-pinned words that the brief was shaped from an AI pattern recommendation and that a human must accept it. |
| `citation` | `covered`, `surfaceId` | The panel renders the promotion's source thread, selected pattern and every evidence ref, and withholds submit when there are none. |
| `confidence` | `deferred`, `surfaceId` | No confidence disclosure exists on this surface. The confidence-label half of the legal claim rendered on pattern cards in a component that no longer exists. The gap is now attached to a named path instead of to no surface at all. |

`uncatalogued` goes from **13 to 10**. That number is recorded so a later split reads as a change
rather than as a figure nobody measured.

Two things this change is careful *not* to be. It does not assert that a control renders by adding a
string to a document: both declared controls are pinned to evidence tokens that must appear in
comment-stripped source, and to a behavioural test that the catalog's own CI job runs. And it does
not quietly promote the confidence claim to `covered` to make a count look better.

### A state the previous repair did not anticipate

Cataloguing a surface resolves *every* claim row naming its code path — including a row for a
control kind the new entry does not declare. That row may no longer carry a `surfaceJoin` (the
resolver says `resolved`, and the gate demands the `surfaceId`), but it is not `covered` either.
The existing tally counted it as `unbound`, and `unbound` reads as "nobody bound it". A fourth
bucket, `deferredWithSurfaceId`, now carries it, so `unbound: 0` keeps meaning that no row is
missing a join.

### One directory left the dark set — partially

Wiring the new suite into the control-catalog job moved
`src/components/programs/origination/__tests__` out of the committed dark-directory set. Stated
precisely, because the ratchet asks for the distinction: the directory moved from **uncovered to
partial**, not to fully wired. One of its suites now runs in CI; the other two still run in no
workflow. That is filed rather than glossed — see Known Gaps.

## Layer Impact

Release lane: `internal-admin`. An AbarVa-only audit document, a CI job, and tests. No client-visible
behaviour ships with it.

- **Layer 1–3 (intake, adapters, canonical model):** none.
- **Layer 4 — Products:** none. `ProgramBriefPanel.tsx` is **not modified**; it is described. No
  route, component, tenant read path or rendered output changes.
- **Governance/control plane:** `controls[]` gains one surface with two controls; three coverage
  rows gain a `surfaceId`; the catalog CI job gains one jest step; two committed baselines are
  refreshed.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — an audit document, a CI job and tests
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/security/ai-surface-control-catalog.json` — new `controls[]` entry
  `intelligence-pattern-promotion-brief-panel` (`ai-label`, `citation`); the three
  `generated-ui|Intelligence|Sentinel active pattern recommendations` rows re-joined by `surfaceId`.
- `src/components/programs/origination/__tests__/ProgramBriefPanel.controls.test.tsx` — new. Six
  cases; each control asserted separately, with the negative case for the label and the paired
  submit-allowed case for the evidence refs.
- `.github/workflows/ai-surface-control-catalog.yml` — runs that suite. A behavioural test the job
  does not run proves nothing.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts` — fourth tally bucket, with the reason.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — one line removed.
- `docs/architecture/test-ci-coverage-census.json` — regenerated by `npm run
  audit:test-ci-coverage:write`.

## QA / Validation

**Clean baseline, same scope.** Measured with this change's two new/edited source files reverted to
`origin/main` in the same checkout: `test-ci-coverage-census.test.ts` and
`product-directory-ci-coverage.test.ts` were **60 of 60 passing, 0 failing**, and
`scripts/quality/test-ci-coverage-census.mjs --check` exited `0`. So the two failures this change
first produced were **caused by it**, not inherited: 0 failing before, 2 after, 0 after the two
committed baselines were refreshed. Both were the ratchets correctly demanding that a state
transition be recorded.

**Re-verified on `origin/main` `c9755e242` before writing code.** 37 coverage rows: 18 with a
`surfaceId`, 4 `retired`, 2 `ambiguous`, 13 `uncatalogued`, spanning 9 surfaces. The filed
before-state holds exactly.

**The catalog gate, in both directions, per the item's requirement:**

1. With the `controls[]` entry added and the three rows still carrying `surfaceJoin`, the gate fails
   naming each row and the `surfaceId` it must now carry — 3 findings, one per row.
2. With one evidence token removed from the surface's source
   (`<BriefMiniRow label="Evidence refs" …>`), the gate fails:
   `missing evidence token "approval.evidenceRefs.join(', ')"`.
3. Bound correctly, it passes: 22 surfaces (was 21), 42 declared controls (was 40), behavioural
   coverage 35 of 35 reachable (was 33 of 33). Both new controls are route-reachable, so neither
   lands in the not-on-any-screen bucket.

**The behavioural test, proved able to fail.** Three mutations of the surface, each reverted after
measuring; each killed exactly one case, and the right one:

| mutation | result |
|---|---|
| AI label text replaced | 1 of 6 failed — `labels an AI-shaped brief as one, in the words the catalog pins` |
| evidence-refs row deleted | 1 of 6 failed — `renders every evidence ref the promotion carries, one by one` |
| `evidenceRefs.length > 0` dropped from the submit condition | 1 of 6 failed — `withholds submit when the promotion carries no evidence ref at all` |

`src/components/programs/origination/ProgramBriefPanel.tsx` is byte-identical to `origin/main`
afterwards; `git diff` over it is empty.

**The new tally bucket, proved decisive.** Unbinding the `confidence` row from the surface fails 3
assertions including a per-row one, not just the count.

**Suites:**

- `ProgramBriefPanel.controls.test.tsx` — 6 of 6.
- `ProgramBriefPanel.test.tsx`, `buildBriefSnapshot.test.ts`, `catalog-claim-binding.test.ts`
  together with it — 96 of 96.
- `npm run test:behaviors` — 143 suites, **1522 of 1522** passing, 0 failing.
- `npm run audit:ai-surface-controls` — passes.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, 0
  diagnostics. The exit code is judged, not grepped.
- `npx eslint` over both changed test files — exit 0.

## Rollout Plan

Merge to `main`. No runtime rollout: no route, image, flag, environment variable or worker job
changes. The new CI step runs on the next pull request that touches the control catalog's triggers.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp` command is part of this release.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: unaffected; nothing in this release alters a Container App template.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. This release changes an audit document, a CI job and
  tests. It renders nothing and reads no tenant data.

## Rollback Plan

Revert the commit. The catalog returns to 21 surfaces and the three rows to `uncatalogued`; the
gate passes in that state, as it does today. No migration, no data, nothing to unwind.

## Audit Evidence

- The pull request and its CI run.
- `npm run audit:ai-surface-controls` output, before and after.
- The three-mutation table above, each reproducible by the named edit.
- `docs/architecture/test-ci-coverage-census.json` and the dark-directory baseline diff.

## Known Gaps

- **10 `uncatalogued` rows remain, across 8 surfaces.** Measured, with the reason each was not
  taken in this change:
  - `NexusCurrentStateBriefingPanel.tsx` (citation, confidence) — both controls exist in running
    code, but **no module imports it**, so no route reaches it. Cataloguing it requires
    `routeReachable: false` with a reason; it is honest work and it is a different decision from
    this one.
  - `ProgramBriefPanel.tsx` (confidence) — deferred against the surface, above.
  - `SourceCommercialSummarySurface.tsx` (confidence) — 63 lines, no confidence control in code.
  - `TowerCommandCenterAvaShell.tsx` / `tower/page.tsx` (citation, confidence) — no citation or
    confidence rendering in either file; the chat opener's disclosure may belong to the already
    catalogued shared agent renderer, which is a taxonomy call, not a cataloguing one.
  - `api/tower/synthesis/route.ts` (citation) — `citationCount` is telemetry only; the response
    carries no citation control. Cataloguing it as `citation` would be an assertion the code does
    not support.
  - `AgentReadinessDeepDrill.tsx`, `shell-setup-fixture.ts` (confidence) — no confidence control in
    code.
  - **Two of the 13 look honestly retired on a closer read, and are recorded here rather than
    argued into a state:** the Source artifact-provenance and scorecard code paths the legal rows
    declare are now **pure `redirect()` shims**, 17 and 13 lines, rendering nothing. The measured
    state stays `uncatalogued` because the resolver's rule is whether the declared path is in the
    tree, and it is. Whether a redirect shim should count as retired is a change to the resolver, or
    a correction to the legal catalog's declared path — a decision, not a repair.
- **Two suites in `src/components/programs/origination/__tests__` still run in no workflow**
  (`ProgramBriefPanel.test.tsx`, `buildBriefSnapshot.test.ts`). The directory is `partial`, not
  wired. The census ranks it the top governed-risk directory by untriaged unrun tests.
- The regenerated census also absorbs **pre-existing staleness that is not from this change**:
  `testFiles` moved 2494 → 2502, of which **+7 were already uncommitted on `origin/main`** and +1 is
  the suite added here. Measured by running the check with this change's files reverted.
