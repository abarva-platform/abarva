# 2026-09-30-t791-artifact-refresh-event — Make the generated-artifact refresh event observable in its suite

## Release ID

`2026-09-30-t791-artifact-refresh-event`

## Status

`candidate`

## Plain-English Summary

Every save in `src/lib/artifacts/repository.ts` ends by emitting a context
refresh event, so that Intelligence and the change log learn a new generated
artifact exists. The emission is best-effort: if it throws, the repository logs
a warning and still returns the saved artifact.

`src/lib/artifacts/__tests__/repository.test.ts` stayed green while that
emission failed on every save it exercised. The suite mocked the data plane
with a write client only; the real refresh module also asks for a read client,
got `is not a function`, and the repository swallowed the throw as a warning.
Re-verified on `main` before any change: 12 saves across the 6 cases, 12
`refresh event failed` warnings, 6 of 6 passing. The refresh-after-save path was
therefore untested, and a regression in it — the call removed, the wrong
tenant, a missing receipt link — would have been equally silent.

This change mocks the refresh module at the repository's boundary and adds two
cases:

- **Emission.** One save through each path (`saveGeneratedArtifact` and
  `saveRenderedBoardGradeMoveArtifact`) must emit exactly one refresh event
  each, carrying the saving tenant's client id, the artifact title, the fixed
  trigger/surface fields, and a receipt link that equals the saved artifact's
  own `/api/v1/artifacts/<id>` URL.
- **Failure is contained.** When the refresh event rejects, the save still
  returns, the artifact is still readable, and the warning names the tenant and
  the error.

The suite now runs with no refresh warnings at all. No product code changes.

## Layer Impact

**Release lane: `global-control-lane`.** One test file only.

- **Layer 4 (Products):** no behavior change. `repository.ts` and
  `refresh-events.ts` are untouched.
- **Platform tooling / CI:** the suite already runs in CI — its directory was
  wired whole by the previous stale-suite wiring change — so the two new cases
  run there with no workflow edit.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. Test code only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/artifacts/__tests__/repository.test.ts`: a `jest.mock` of
  `@/lib/intelligence/refresh-events` routed to a recorded `jest.fn`, cleared
  before each case; two new cases as above.

The item suggested giving the data-plane mock a read client instead. That
would run the real refresh module, which also resolves a tenant key from
`clients` and kicks off insight evaluation — both outside this repository's
contract. Mocking at the module boundary asserts exactly what the repository
promises (which event, with which identifiers) and nothing it does not own.

## QA / Validation

**Status: pass.** Local runs below; CI runs the suite on the PR.

**Red first.** The two new cases, run against the suite's existing mocks
(a recording `jest.fn` defined but not wired): **2 failing / 8** —
"Expected number of calls: 2, Received: 0" and "Expected: 1, Received: 0".
With the boundary mock wired: **0 failing / 8**.

**Same-scope baseline** (`npx jest --runTestsByPath
src/lib/artifacts/__tests__/repository.test.ts --no-coverage --ci`, base
`1c8257aac2` vs this branch): 0 failing / 6 → 0 failing / 8; refresh warnings
12 → 0.

**Mutations.** Each is a one-line change to `src/lib/artifacts/repository.ts`,
run against the new suite and against the suite as it was on `main`, then the
file restored byte-for-byte from a saved copy.

| Mutation | New suite | Suite on `main` |
|---|---|---|
| M1: refresh call removed from `saveGeneratedArtifact` | 1 of 8 fails | 0 of 6 |
| M2: refresh call removed from the board-grade save | 2 of 8 fail | 0 of 6 |
| M3: receipt link sent as `null` | 1 of 8 fails | 0 of 6 |
| M4: board-grade event sent with another tenant's client id | 1 of 8 fails | 0 of 6 |
| M5: board-grade save rethrows a refresh failure | 1 of 8 fails | 3 of 6 fail |
| M6: wrong source label | 1 of 8 fails | 0 of 6 |
| M7: `change-log` dropped from affected surfaces | 1 of 8 fails | 0 of 6 |

New suite 7 of 7; suite on `main` 1 of 7, and that one only because its mock
made every refresh throw. A first version of M5 did not compile, which proves
nothing, so it was discarded and replaced by the rethrow above.

Other checks: `tsc --noEmit` exited 0, judged by exit code. ESLint reported 0
problems on the changed file.

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

- The red-first, baseline and mutation tables above, from local runs.
- The CI unit-suite job's run of `src/lib/artifacts/__tests__` on this PR.

## Known Gaps

- The real `recordContextRefreshEvent` (tenant-key resolution, insert,
  insight evaluation) is not exercised here, and no suite under `src` imports
  `@/lib/intelligence/refresh-events` other than this one, which now mocks it.
  That module has no direct test; it is filed as a follow-up rather than
  folded into this change.
