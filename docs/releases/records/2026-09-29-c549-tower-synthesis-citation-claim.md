# 2026-09-29-c549-tower-synthesis-citation-claim — the Tower synthesis citation claim, measured and corrected

## Release ID

`2026-09-29-c549-tower-synthesis-citation-claim`

## Status

`candidate`

## Plain-English Summary

The AI-generated UI catalog (`docs/legal/AI_GENERATED_UI_CATALOG.md`) is the
document an auditor reads. Its row for the Tower synthesis endpoint
(`src/app/api/tower/synthesis/route.ts`) answered "Citations / evidence present?"
with "Yes", and the only basis it gave was that telemetry records a citation
count. A telemetry counter goes to an operator store. A reader of the answer
never sees it.

This change measures the claim by running the endpoint. A new test drives the
real handler for the one tenant whose portfolio fixture produces citation
pointers. It first proves that the context the route builds holds those pointers.
It then searches the body and every header of both the cache-miss and the
cache-hit response for any of them, and finds none. The response is the model's
plain text and nothing else.

So the legal row is corrected from "Yes" to "Partial", and the wording says what
was measured. The control catalog's coverage row for the old claim is removed
with it, because the gate derives that row from the "Yes". The test holds the
legal cell to what it observes: if the route ever forwards a citation, the
suite fails until the row says "Yes" again.

No product file changed. Whether the endpoint should forward its citations is
product work, and this change does not take it. The legal row's
"Required / next control" column now names that work.

## Layer Impact

Release lane: **`global-control-lane`**. The change is to the shared legal
catalog, the control catalog and tests. It is not gated to any client or flag.

- **Products**: Tower. Documents and tests only; no product file changed.
- **Canonical model / Client intake / Source adapters**: not touched.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes. Legal catalog, control catalog and CI.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/tower/synthesis/route.citation-claim.test.ts`: new, 4 cases.
  - A positive control: the context built for the fixture tenant holds at least
    one citation pointer.
  - Cache miss: no pointer appears in the body or any header. The pointer is
    identified by its pattern id, section label or excerpt, and a header named
    for citations, evidence or provenance also counts as a pointer.
  - Cache hit: the same check.
  - The legal row's citation cell starts with `Yes` exactly when the response
    carries a pointer. `startsWith('Yes')` is the predicate the control catalog
    gate uses.
  - Only the surroundings are stubbed: tenancy, access policy, active client,
    user context and AI egress. The portfolio loader and the context builder are
    real.
- `docs/legal/AI_GENERATED_UI_CATALOG.md`: the Tower synthesis row's citations
  cell changes from `Yes: telemetry records citation count.` to a `Partial:`
  statement of what was measured. The next-control cell adds "forward the
  citation pointers in the response".
- `docs/security/ai-surface-control-catalog.json`: the
  `generated-ui|Tower|Atlas synthesis API response|citation` coverage row is
  removed. It was `deferred` with an `uncatalogued` join. The gate refuses it once
  the legal cell no longer claims, because it then "does not match a current
  legal catalog claim".
- `src/__tests__/behaviors/catalog-claim-binding.test.ts`: the per-bucket tally
  pin `deferredWithJoin` moves from 12 to 11. The comment records why. The other
  three buckets did not move.

## QA / Validation

- **Red first.** On base `c5a2dd1bcc`, the new suite failed 1 of 4 (the legal
  case: expected `false`, received `true`). After the fix it passes 4 of 4.
- **Mutations:** 3 made, 3 caught.
  - M1: the route adds a header carrying the citation pattern ids on a miss.
    2 of 4 failed (miss, legal).
  - M2: the route appends the citation excerpts to the body on a miss. 2 of 4
    failed.
  - M3: the context builder returns no citations. 1 of 4 failed (the positive
    control). This shows the absence assertions are not vacuous.
- **The gate fails on each half-edit and passes on the whole:**
  - Legal row corrected, coverage row kept: `node
    scripts/audit/ai-surface-control-catalog.mjs` exits 1 (`does not match a
    current legal catalog claim`).
  - Coverage row removed, legal row still `Yes`: exits 1 (`missing
    catalogClaimCoverage entry`).
  - Both changed: exits 0.
- **`uncatalogued` coverage rows:** 6 at base, 5 on the branch.
- **Behaviors, clean worktree at base `c5a2dd1bcc` against the branch:**
  - Suites: 155 passed at base, 155 passed on the branch.
  - Tests: 1685 passed at base, 1683 passed on the branch.
  - The 2 cases that left are the two parameterized per-row cases
    `catalog-claim-binding` generated for the removed row: "names a join" and
    "declares the join state the repository actually has". This was checked by
    diffing test names.
- **Adjacent suites:** the three existing suites beside the route, plus
  `unlinked-control-roster` and `c574-tower-dock-catalog-entry`, all pass.
- **CI placement:** `node scripts/quality/test-ci-coverage-census.mjs --explain`
  lists no file under `src/app/api/tower/synthesis` as unrun with the new suite
  present. `--check` exits 0.
- **Checks:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
  false` exits 0. Scoped ESLint exits 0.

## Rollout Plan

This change ships on merge through the normal main deploy. No runtime behaviour
changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none added.
- Approved image digest: whatever the merge deploy produces; no runtime change.
- ACA runtime invariant: verified after merge as for any merge.
- Worker image invariant: as above.
- Feature/env flag update path: none.
- Live signed-in proof required: no. No product surface changed.

## Rollback Plan

Revert the squash commit. That restores the `Yes` claim together with its
coverage row, and the new suite goes with it.

## Audit Evidence

- The mutation and gate results above were measured locally on the branch.
- The CI run for the PR.

## Known Gaps

- The endpoint still forwards no citation. This change corrects the claim; it
  does not build the control.
- Its only UI caller, `src/components/tower/AtlasSynthesisQuote.tsx`, is listed
  in `docs/architecture/unreachable-components.json`. So no screen renders this
  response today, and no screen could show a citation even if the route
  forwarded one.
- The other five `uncatalogued` coverage rows are out of scope and stay open.
  - Two are redirect shims that are decision-gated.
  - The other three are `confidence` rows on the Source commercial summary,
    Setup guidance and the agent readiness drill-down. Their legal cells say
    `Yes` for disclosures that the control catalog records as not being a formal
    confidence control. Each needs its own measurement.
