# 2026-10-08-moves-lab-e2e-tail — Moves terminal journey tests

## Release ID

`2026-10-08-moves-lab-e2e-tail`

## Status

`candidate`

## Plain-English Summary

Three signed-in browser tests exercise the Moves P4 to P5 gate, the P5 terminal Tower handoff, and one continuous P0 to Tower gate walk. They use the real phase approval route and read back the stored phase after each transition. A dedicated lab workflow requires three distinct disposable Move fixtures and a governed fixture proof reference.

## Layer Impact

- Release lane: `experimental`.
- Product projection: no production product behavior changes. The tests cover the Moves capture workspace and Tower handoff surfaces.
- Quality control: the manually dispatched lab run fails when a real gate, persisted phase readback, or terminal surface fails. Existing route integration gates remain in place.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: synthetic lab test operation.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `programs-phase-4-to-5.spec.ts` and `programs-phase-5-to-tower.spec.ts` target `/strategic-moves`, not the unrelated `/engagements` chat phase vocabulary.
- `programs-p0-to-tower.spec.ts` walks P0 through P5 gate submissions in one signed-in session.
- The shared browser helper rejects an unready fixture and proves each response's `newPhase` against the program readback.
- `.github/workflows/moves-lab-e2e.yml` discovers the specs on pull requests; its manual signed-in run accepts three disposable IDs and records the Playwright result as an artifact.

## QA / Validation

- Playwright discovery found all three specs.
- Local Playwright invocation discovered them but skipped all three because disposable lab fixture IDs were not supplied; this is not a passing lab E2E run.
- Full typecheck and scoped lint passed; workflow YAML parsed, the test census was regenerated, and release checks passed 11/11.
- The existing Programs gate, approval, and build route suites remain on their pull-request workflow.

## Rollout Plan

Merge via controlled PR. This change does not deploy product code. After a governed ACA fixture job has produced three distinct gate-ready disposable Moves, dispatch the workflow on `main` with its exact proof reference and IDs. Keep those fixtures out of client production data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the only shared web deploy path; this test change requires no web deploy for its behavior.
- Shared runtime mutators: none.
- Approved image digest: use the currently deployed approved digest for the lab run.
- ACA runtime invariant: verify before calling the lab run live proof.
- Worker image invariant: verify before calling the lab run live proof.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, from the workflow and its artifact.

## Rollback Plan

Revert the test and workflow PR. No tenant data is changed by a merge; any dispatched disposable test fixtures are governed by their separate fixture-build proof and cleanup contract.

## Audit Evidence

The PR, Playwright test list and local skip output, typecheck and lint output, and the future workflow run artifact with fixture proof reference.

## Known Gaps

No disposable fixture build or lab browser execution has been completed for these specs. The continuous spec exercises gate submissions against prebuilt, reviewed fixture inputs; a separate signed-in capture, generation, and sign-off walk remains required for full product acceptance. The existing Jest census covers `src/` suites, not these Playwright files. Pull-request CI verifies spec discovery; the manually dispatched lab workflow is their authenticated execution lane.
