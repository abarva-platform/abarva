# 2026-09-21-t516-green-suite-ci-wiring — T-516 Exact Green Suite CI Wiring

## Release ID

`2026-09-21-t516-green-suite-ci-wiring`

## Status

`candidate`

## Plain-English Summary

This release wires eleven already-green Jest suites into the pull-request CI workflow by exact file path. It does not change the suites themselves or any product behavior; it closes a CI visibility gap where passing tests existed but no workflow ran them.

## Layer Impact

Release lane: `global-control-lane`.

Release/control-plane quality: the pull-request workflow now runs the exact T-516 suite set, and a behavior guard verifies the workflow names all eleven files with `--runTestsByPath`.

Product layers: no Layer 1 intake, Layer 2 adapter, Layer 3 canonical model, or Layer 4 product runtime behavior changes.

## Client Applicability

- All clients: CI coverage improves for shared repository controls.
- Specific clients: None.
- Internal only: Engineering/release control only.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/unit-suites.yml` adds the exact eleven-file T-516 Jest step.
- `src/__tests__/behaviors/t516-green-suite-ci-wiring.test.ts` fails if the workflow step exists without all eleven exact files or without removing those directories from the unrun census.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` lowers the existing Programs dark-directory ratchet from 21 to 20 because T-516 now wires `src/lib/programs/queries.azure-read.test.ts`.
- `docs/architecture/test-ci-coverage-census.json` is refreshed after wiring.

## QA / Validation

Pass: Red-first guard before workflow wiring: `npx jest --runTestsByPath src/__tests__/behaviors/t516-green-suite-ci-wiring.test.ts --no-coverage --ci` failed because no workflow command named the T-516 files and the census still reported their directories unrun.

Pass: Exact T-516 local suite run: `npx jest --runTestsByPath ... --no-coverage --ci` passed 11 suites / 119 tests, and Jest printed every exact file path in the run.

Pass: Guard after wiring: `npx jest --runTestsByPath src/__tests__/behaviors/t516-green-suite-ci-wiring.test.ts --no-coverage --ci` passed 2 tests.

Pass: Census delta proof: `node scripts/quality/test-ci-coverage-census.mjs --json` moved `counts.untriagedUnrunTestFiles` from 501 before wiring to 490 after wiring, exactly eleven fewer.

Pass: `node scripts/quality/test-ci-coverage-census.mjs --write` refreshed the committed census and reported `census drift: committed census matches this run`.

Pass after ratchet update: `npm run test:behaviors` passed after the existing Programs dark-directory count moved from 21 to 20.

## Rollout Plan

Open a pull request and let the repository pull-request workflows run. The change becomes active for future PRs after merge to `main`.

## Deployment Authority

- Repo-owned deploy workflow: Not a runtime deployment change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. This changes CI wiring and measurement only.

## Rollback Plan

Revert the PR to remove the exact workflow step, the focused guard, and the refreshed census. No data rollback, migration rollback, or runtime rollback is required.

## Audit Evidence

Inspect the PR diff, pull-request workflow log for the step named `Run the T-516 exact green suite set`, the behavior guard log, and the refreshed `docs/architecture/test-ci-coverage-census.json`.

## Known Gaps

CI-side proof is owed until the pull request workflow runs and its log confirms all eleven exact files executed.
