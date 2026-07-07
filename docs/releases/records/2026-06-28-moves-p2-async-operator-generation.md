# 2026-06-28-moves-p2-async-operator-generation — Moves P2 async premium generation

## Release ID

`2026-06-28-moves-p2-async-operator-generation`

## Status

`candidate`

## Plain-English Summary

Premium P2 Current Work Diagnostic generation no longer has to finish inside a single public web request. The signed-in web route now creates a durable generation job for P2 draft diagnostics, returns a run id quickly, and lets the private operator worker perform the heavy Claude generation, quality check, and File Cabinet persistence. This preserves the premium artifact standard without exposing users to the 240-second web timeout.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves generation behavior and the durable deliverable worker.
- `client-data-lane`: Reads and writes existing tenant-scoped `deliverable_runs`, `deliverables_v2`, and `move_artifacts` rows. No schema migration is included.

## Client Applicability

- All clients: yes, for Strategic Moves P2 Current Work Diagnostic draft generation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/programs/[programId]/generate/route.ts`: queues P2 `discovery_report` drafts instead of running the premium generator synchronously.
- `src/scripts/process-deliverable-queue.ts`: processes `moves_premium_artifact` jobs through the premium `generateArtifact` pipeline and persists to the Move File Cabinet.
- `package.json`: adds `moves:premium-artifacts:worker` so the private operator job can run the durable drainer directly for proof.
- `src/lib/deliverables/orchestrator/runs-repository.ts`: extends the existing durable run payload type with a premium Moves artifact job shape.
- `src/lib/deliverables/persist-move-generated-artifact.ts`: shared persistence helper for premium generated HTML artifacts.
- `src/app/api/v1/deliverables/runs/[runId]/route.ts`: returns Move File Cabinet download URLs for premium Moves artifact jobs.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`: routes the P2 Generate step through the new async premium job path and polls the existing run status endpoint.
- Regression tests for route enqueue, worker processing, and status URL behavior.

## QA / Validation

- PASS: `npm test -- --runTestsByPath 'src/app/api/v1/programs/[programId]/generate/__tests__/route.test.ts' src/scripts/__tests__/process-deliverable-queue.test.ts 'src/app/api/v1/deliverables/runs/[runId]/__tests__/route.test.ts' --runInBand`
- PASS: `npx eslint 'src/app/api/v1/programs/[programId]/generate/route.ts' 'src/app/api/v1/programs/[programId]/generate/__tests__/route.test.ts' 'src/app/api/v1/deliverables/runs/[runId]/route.ts' 'src/app/api/v1/deliverables/runs/[runId]/__tests__/route.test.ts' src/scripts/process-deliverable-queue.ts src/scripts/__tests__/process-deliverable-queue.test.ts src/lib/deliverables/orchestrator/runs-repository.ts src/lib/deliverables/persist-move-generated-artifact.ts src/components/strategic-moves/StrategicMovePhaseClient.tsx --max-warnings 0`
- PARTIAL: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` still reports pre-existing missing declaration/module diagnostics for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; it also caught and this change fixed one local refactor diagnostic in the generate route.

## Rollout Plan

Merge to `main`, build and deploy through the approved Azure Container Apps `aca-main-deploy` lane, and make sure the deliverable worker/private operator job is updated to the same digest-pinned image. Live proof must use a signed-in Lakeshore browser session and the private operator lane for the heavy generation job.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- Shared runtime mutators: web container app plus deliverable/private operator worker image update
- Approved image digest: to be recorded after deploy
- ACA runtime invariant: public web creates and polls jobs only; heavy P2 generation runs in the private/operator worker lane
- Worker image invariant: worker image must match the deployed app image so the new job payload shape is understood
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert this release and redeploy the prior digest. Since no schema migration is included, rollback is code-only. Queued `moves_premium_artifact` jobs created during the release window should be failed or requeued manually if the worker is rolled back before processing them.

## Audit Evidence

- PR URL: pending
- CI run: pending
- ACA revision and image digest: pending
- Signed-in proof: pending
- Private operator execution proof: pending
- P2 artifact id and File Cabinet proof: pending

## Known Gaps

- This release only moves P2 Current Work Diagnostic draft generation to async/operator execution. P3/P4/P5 premium artifacts remain out of scope for this pass.
- Review/regenerate is not moved to async in this pass; live proof should verify whether current review/regenerate completes for the generated P2 artifact or needs the same operator-lane treatment next.
