# 2026-06-23-moves-architecture-gate-repair — Moves Architecture Gate Repair

## Release ID

`2026-06-23-moves-architecture-gate-repair`

## Status

`candidate`

## Plain-English Summary

Repairs two shared Moves deliverable issues found during the live Meridian Slice 7 run: approving a P3 solution option no longer depends on a pre-seeded `deliverable_types` row, and architecture artifacts are prompted and scored more reliably for the required decision-record/tradeoff exhibit.

## Layer Impact

`global-control-lane`: shared Moves generation and quality-gate behavior for all clients.

## Client Applicability

- All clients: applies to Moves P3 option approval and visual artifact golden-bar checks.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/programs/[programId]/solution-options/approve/route.ts`
- `src/lib/deliverables/visual-artifact-contract.ts`
- `src/lib/deliverables/golden-bar.ts`
- Unit regressions for option approval and architecture golden-bar exhibit matching.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/__tests__/golden-bar.test.ts --runInBand`
- PASS: `npx jest --runTestsByPath src/app/api/v1/programs/[programId]/solution-options/approve/__tests__/route.test.ts --runInBand`
- PASS: touched-file `npx eslint`
- PASS: `npm run audit:control-plane-purity:check`
- PASS: TypeScript `tsc --noEmit`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PENDING: ACA deploy and live Meridian P3 architecture retry

## Rollout Plan

Merge to `main`, deploy through the repo-owned `aca-main-deploy` workflow, then live-verify on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps deployment only
- Approved image digest: PENDING deploy
- ACA runtime invariant: `app.abarva.ai` must serve the new ACA revision at 100% traffic
- Worker image invariant: no worker image change
- Feature/env flag update path: none
- Live signed-in proof required: agent-meridian P3 target architecture regeneration passes golden bar

## Rollback Plan

Revert the merge commit and redeploy the previous ACA digest through the same ACA workflow. No schema migration is introduced.

## Audit Evidence

PR, CI, deploy run, active ACA revision/digest, and live Meridian artifact IDs will be added after release.

## Known Gaps

The live run exposed a missing data-plane registry row for `solution_approach_options`; this release avoids relying on that precondition by using the existing complete-deliverable path.
