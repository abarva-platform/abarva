# 2026-09-30-t795-stale-suite-updates — Repair three stale suites the T-795 triage found red

## Release ID

`2026-09-30-t795-stale-suite-updates`

## Status

`candidate`

## Plain-English Summary

The T-795 triage executed 19 test files that no continuous-integration job
runs and found three of them red. In all three the product is right and the
test is stale. This change takes the **update half** of T-795 for those three
files only:

- `src/lib/observability/__tests__/tenant-bleed-alerts.test.ts` (0 of 1
  passing). It pinned the requested tenant's display name to a fixture value
  that a later change deliberately replaced. The expectation now reads that
  name from the client registry, which is the input the resolver itself reads.
- `src/lib/source/pricing-submissions/__tests__/parser.test.ts` (6 of 9
  passing). Six cases wrote the vendor name to the fixed cell `B16`. The Cover
  sheet grew and the renderer's "Vendor name" slot moved, so those writes landed
  in an unlabeled cell. Three cases went red; the other three stayed green only
  because they never checked the vendor name. The fixture now finds the slot by
  its label, asserts there is exactly one, and those three cases now assert the
  vendor name too.
- `src/__tests__/features/neo4j-gate.test.ts` (3 of 4 passing). Case 4 asserted
  that turning the flag on opens an external graph driver. The driver module is
  now an Azure Postgres compatibility boundary that loads no external driver by
  design. The case now asserts the opposite guarantee: with the flag on, no
  driver is returned and the work function is never called.

**Nothing is wired.** The workflow file, the coverage census and the dark
baseline are held by sibling items (T-786, T-788) while this runs, so wiring
these suites is left to the next wiring run. This change makes them green and
able to fail, so that run can wire them as-is.

## Layer Impact

**Release lane: `global-control-lane`.** Test files only.

- **Layer 4 (Products):** no product behavior changes. No route, component,
  adapter, projection or canonical object is touched.
- **Platform tooling / CI:** three test files change. No workflow, census or
  baseline changes; `npm run audit:test-ci-coverage:check` matches the
  committed census.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. Test code only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/observability/__tests__/tenant-bleed-alerts.test.ts`: requested
  tenant name read from `ALL_CLIENTS`, with the reason inline.
- `src/lib/source/pricing-submissions/__tests__/parser.test.ts`: a
  `vendorNameCell` helper that locates the slot by label; five writes moved to
  it; vendor-name assertions added to the three cases that lacked one, plus an
  assertion that the partial-status case is not partial for a missing name.
- `src/__tests__/features/neo4j-gate.test.ts`: case 4 rewritten; header comment
  updated.

## QA / Validation

**Same-scope baseline, base `c334308aed` vs this branch** (each file run alone
with `npx jest --runTestsByPath <file> --no-coverage --ci`):

| File | Before | After |
|---|---|---|
| tenant-bleed-alerts | 1 failing / 1 | 0 failing / 1 |
| pricing parser | 3 failing / 9 | 0 failing / 9 |
| neo4j-gate | 1 failing / 4 | 0 failing / 4 |
| **Total** | **5 failing / 14** | **0 failing / 14** |

**Mutations.** Each is a deliberate change to product code, run against the
repaired suite, then restored with `git checkout` (the tree showed only the
three test files changed afterward).

| Mutation | Result |
|---|---|
| M1: resolver returns the requested client's id as its name | 1 of 1 fails |
| M2: resolver returns the active client's name as the requested name | 1 of 1 fails |
| M3: `getGraphDriverIfEnabled` returns a driver when the flag is on | 1 of 4 fails |
| M4: `withGraphSession` calls the work function when the flag is on | 1 of 4 fails |
| M5: parser reads the vendor name from column C | 5 of 9 fail |
| M6: parser's vendor-name label never matches | 5 of 9 fail |
| M7: parser ignores the Cover sheet name | 5 of 9 fail |

M5–M7 fail 5 cases, including the two that previously passed without
checking the vendor name.

Other checks: `tsc --noEmit` exited 0, judged by exit code. ESLint reported 0
problems on the three files.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a (no runtime image change)
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. There is nothing to unwind in a running environment.

## Audit Evidence

- The before/after table and mutation table above, from local runs.
- The T-795 triage verdicts in the operator backlog.

## Known Gaps

- None of the three suites runs in CI yet. Wiring them is the next wiring run's
  work, once the shared workflow and census files are free.
- The fourth T-795 update, the byte-scan case in
  `src/lib/setup/__tests__/ai-initiatives.test.ts`, is not taken here.
