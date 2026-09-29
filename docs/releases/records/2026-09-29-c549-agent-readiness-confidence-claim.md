# 2026-09-29-c549-agent-readiness-confidence-claim — the Agent readiness drill-down confidence claim, measured and corrected

## Release ID

`2026-09-29-c549-agent-readiness-confidence-claim`

## Status

`candidate`

## Plain-English Summary

The AI-generated UI catalog (`docs/legal/AI_GENERATED_UI_CATALOG.md`) is the
document an auditor reads. Its row for the Agent readiness drill-down
(`src/components/admin/AgentReadinessDeepDrill.tsx`) answered "Confidence /
assumption disclosure present?" with "Yes", and the basis it gave was a
deterministic source caption and a generated timestamp. A caption saying a view
is not live execution, and a hardcoded date, say where the page came from.
Neither tells a reader how far to trust any readiness verdict on it.

This change measures the claim by rendering the component. A new test renders
the real component over the real builder and finds:

1. the caption and the date the legal row cited are on the page, so the
   measurement is not over an empty render;
2. no rendered text is a confidence value, a certainty or assumption statement,
   or a percentage. The only confidence text on the page is the component's own
   `confidence_scoring` factor, which reports that capability as deferred
   ("modeled but not wired");
3. no non-test source file imports the component, and the unreachable-components
   baseline lists it, so no reader can open the screen.

So the legal row is corrected from "Yes" to "Partial", and the wording says what
was measured. The control catalog's coverage row for the old claim is removed
with it, because the gate derives that row from the "Yes". The test holds the
legal cell to what it observes: it may say "Yes" exactly when a confidence
disclosure renders on a screen something mounts.

No product file changed. Whether the drill should be mounted, and whether it
should then show confidence per verdict, is product work that this change does
not take. The legal row's "Required / next control" column now names it.

## Layer Impact

Release lane: **`global-control-lane`**. The change is to the shared legal
catalog, the control catalog and tests. It is not gated to any client or flag.

- **Products**: Setup/admin. Documents and tests only; no product file changed.
- **Canonical model / Client intake / Source adapters**: not touched.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes. Legal catalog, control catalog and CI.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/admin/__tests__/AgentReadinessDeepDrill.confidence-claim.test.tsx`:
  new, 4 cases.
  - A positive control: the render carries the caption and the date the legal
    row cited, and neither is itself confidence text.
  - No confidence disclosure: every rendered text node matching confidence,
    certainty, assumption or a percentage belongs to a confidence factor the
    builder reports as deferred or blocked. The case also proves that factor's
    note is on the page, so the exclusion removes something real.
  - Mounted by nothing: a walk of `src/` finds no non-test file importing the
    component, and the unreachable baseline lists it.
  - The legal row's confidence cell starts with `Yes` exactly when a disclosure
    renders and something mounts the component. `startsWith('Yes')` is the
    predicate the control catalog gate uses.
  - Nothing is stubbed.
- `docs/legal/AI_GENERATED_UI_CATALOG.md`: the Agent readiness drill-down row's
  confidence cell changes from `Yes: deterministic source caption and generated
  timestamp.` to a `Partial:` statement of what was measured. The next-control
  cell now says to mount the drill before claiming any disclosure on it.
- `docs/security/ai-surface-control-catalog.json`: the
  `generated-ui|Setup|Agent readiness drill-down|confidence` coverage row is
  removed. It was `deferred` with an `uncatalogued` join. The gate refuses it
  once the legal cell no longer claims.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts`: the per-bucket tally
  pin `deferredWithJoin` moves from 11 to 10. The comment records why. The other
  three buckets did not move.

## QA / Validation

Status: **pass** for every check below; CI on the PR is the remaining gate.

- **Red first.** On base `63e3d5f05d`, the new suite failed 1 of 4 (the legal
  case: expected `false`, received `true`). After the fix it passes 4 of 4.
- **Mutations:** 4 made, 4 caught, each confirmed to change a file before the
  run and each failing exactly one case:
  - M1: the legal cell restored to `Yes`. Fails the legal case.
  - M2: the component renders `Confidence 80%` beside the date. Fails the
    no-disclosure case.
  - M3: a page under `src/app` imports and renders the component. Fails the
    mounted-by-nothing case.
  - M4: the builder reports `confidence_scoring` as `ready`. Fails the
    no-disclosure case, because the factor's note then counts as a disclosure.
- **The gate fails on each half-edit and passes on the whole:**
  - Legal row corrected, coverage row kept: `node
    scripts/audit/ai-surface-control-catalog.mjs` exits 1 (`does not match a
    current legal catalog claim`).
  - Coverage row removed, legal row still `Yes`: exits 1 (`missing
    catalogClaimCoverage entry`).
  - Both changed: exits 0.
- **`uncatalogued` coverage rows:** 5 at base, 4 on the branch.
- **Admin components plus behaviors, clean worktree at base `63e3d5f05d`
  against the branch** (`npx jest src/components/admin src/__tests__/behaviors`):
  - Suites: 186 passed at base, 187 passed on the branch.
  - Tests: 1854 passed at base, 1856 passed on the branch: 4 new cases, less the
    2 parameterized per-row cases `catalog-claim-binding` generated for the
    removed row.
  - 0 failing on either side.
- **CI placement:** the new suite sits in `src/components/admin/__tests__`,
  which `.github/workflows/unit-suites.yml` runs by directory on every pull
  request ("Run the admin component suites").
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
- Live signed-in proof required: no. No product surface changed, and the
  component is mounted by no route.

## Rollback Plan

Revert the squash commit. That restores the `Yes` claim together with its
coverage row, and the new suite goes with it.

## Audit Evidence

- The mutation and gate results above were measured locally on the branch.
- The CI run for the PR, including the admin component step's job log.

## Known Gaps

- The drill still shows no confidence per verdict, and no route mounts it. This
  change corrects the claim; it does not build or mount the control.
- The other four `uncatalogued` coverage rows are out of scope and stay open:
  two decision-gated redirect shims, and the `confidence` rows on the Source
  commercial summary and Setup guidance. The Source commercial summary
  component is also listed in the unreachable baseline. Each needs its own
  measurement.
