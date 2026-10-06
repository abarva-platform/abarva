# 2026-09-30-c415-vendor-platform-intelligence-directory-wiring — Wire the Programs vendor-platform intelligence registry test directory into CI

## Release ID

`2026-09-30-c415-vendor-platform-intelligence-directory-wiring`

## Status

`candidate`

## Plain-English Summary

One test suite for the Programs vendor-platform intelligence registry existed,
passed, and was run by no continuous-integration job. It proves that the
generic managed-analytics platform declares its capability categories once,
that a vendor profile built from public material is stored as a draft
hypothesis rather than client truth, that vendor-published capability is never
converted into client-observed usage, that client overlay evidence is what
distinguishes contracted from implemented from observed, and that discovery
tabs are generated from triggered gaps rather than the full catalog. If a
future change broke that contract, the build would not have noticed.

This change adds that directory to a job that runs on every pull request. It
also removes the directory from the two committed lists of test directories
that still run nowhere. Under `src/lib/programs` that list goes from 4 to 3.

The suite was run on its own **before** it was wired. It passes, with 6 cases.
So this change protects future work; it does not repair a break. The directory
is not coverage of nothing: the registry is imported at runtime by the
client-readiness scan (below).

This is slice 13 of backlog item C-415. Three directories remain.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling that applies to every
client's build equally, behind no feature gate.

- **Layer 4 (Products)** — no product behavior changes. No route, component,
  adapter, projection or canonical object is touched. The test file is
  unmodified.
- **Platform tooling / CI** — one job step added. Three committed measurements
  are updated to match what the repository now does: the coverage census and
  the two dark-directory baselines.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — CI coverage only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — one step,
  `Exercise the Programs vendor-platform intelligence registry suite`, running
  `npx jest src/lib/programs/vendor-platform-intelligence/__tests__ --runInBand`.
  Wired as a directory with no trailing slash. Nothing nests beneath it.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` —
  the directory's line is removed (4 → 3).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  directory's line is removed (set equality over the census's dark list).
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. On the base the committed census was
  current (`audit:test-ci-coverage:check` reported no drift). With this step:
  covered 2249 → 2250, uncovered 314 → 313, directories uncovered 137 → 136.
  The only test path that leaves the uncovered list is
  `src/lib/programs/vendor-platform-intelligence/__tests__/registry.test.ts`,
  and none joins.

## QA / Validation

**Measured before wiring, the suite run on its own:** registry 6/6. Green.

**Importer check, before wiring:** `listVendorPlatformProfiles` is imported at
runtime by `src/lib/deliverables/shared/client-readiness-scan.ts`, which
`client-readiness-gate.ts` calls, which the deliverable sign-off route
(`src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts`)
imports. The directory is not listed in
`docs/architecture/unreachable-components.json`.

**Source-text scanner judgement:** the suite reads no file's bytes (no
`readFileSync`, `fs` import, `__dirname` or `process.cwd`; it imports the
module under test), so `T-770` has nothing to refuse and `textIsTheSubject` is
negative.

**Baseline over the same scope, base `95cf1a593d` vs this branch**, measured in
this worktree before any edit:

- `npx jest src/__tests__/behaviors`: 156 suites / 1682 tests / 0 failing
  before, and 156 / 1682 / 0 after.
- `npm run audit:test-ci-coverage:check`: no drift before; census rewritten
  after.
- The two ratchet suites: 21 of 21 passing before. With the `T-770` scanner
  refusal added (28 tests): 0 of 28 failing after.

**Mutations.** Each changed the working tree before the run and was restored
after; the clean run was re-checked at 28/28 at the end.

| Mutation | Result |
|---|---|
| M1 — the step's command replaced with a no-op | 2 failing of 28: both ratchets name the directory as dark again |
| M2 — trailing slash on the path | 2 failing of 28: `T-062`'s known trap is caught by the visibility gate |
| M3 — both baselines restored to the base (directory still listed) | 2 failing of 28: a wired directory left on a dark list is refused |

`tsc --noEmit` exited 0 with no diagnostics. `release:check` result is in the
pull request.

## Rollout Plan

Merge to `main` through the repo-owned workflow. No runtime rollout: no image,
migration, flag, environment variable or traffic change. The step becomes active
on the next pull request and on push to `main`.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no** — no product surface changes

## Rollback Plan

Revert the pull request. That restores the step's absence, both baseline lines
and the previous census together; they are consistent only as a set, which is
why they ship as one change. Nothing to unwind in a running environment.

## Audit Evidence

- Per-suite pre-wiring count, the census comparison and the mutation table
  above.
- Runner proof comes from the pull request's `AI surface control catalog` job
  log — the step's per-suite `PASS` line and case total — recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- 3 directories under `src/lib/programs` still run in no workflow:
  `source-trigger` (2 files) and `mobilization` (1), both awaiting the
  retire-or-mount decision recorded as C-575; and `learning-writeback` (1),
  whose suite runs 2 failing of 16 pending an open canonical-tenant-list
  decision. None of the three is wireable by this rule today.
