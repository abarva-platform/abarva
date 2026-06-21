# 2026-06-21-source-d09-async-worker — Source artifact durable worker (d09 quality-gate rewrite fix)

## Release ID

`2026-06-21-source-d09-async-worker`

## Status

`candidate`

## Plain-English Summary

The d09 RFP pack took 450–550 seconds to generate. The synchronous generate route had a 110-second rewrite budget, meaning the quality-gate rewrite never fired — d09 was stuck at 7/10 because the rewrite that would raise weak dimensions never ran.

This release adds an async durable worker that drains the `source_artifact_generation_jobs` queue (table created in PR #3582) with no web-request deadline. When the worker calls the generate route it passes `X-Source-Worker-Call: 1`, which resets the rewrite budget clock at quality-gate time so the rewrite always runs regardless of how long generation took. Three new exports are added to the queue library: `findNextQueuedSourceArtifactGenerationJob`, `sweepStaleSourceArtifactGenerationJobs`, and the `defaultGenerateQueuedArtifact` internal function now passes the worker header. A new script `src/scripts/process-source-artifact-generation-queue.ts` is the worker entry point, following the exact pattern of the deliverable queue worker (PR #3585).

## Layer Impact

- **global-control-lane**: Generate route (`/api/v1/source/[eventId]/artifacts/[artifactCode]/generate`) gains header detection (`X-Source-Worker-Call`). No behavior change for web requests — the header is only sent by the worker. Existing sync path is byte-identical for all non-worker calls.
- **global-control-lane**: Queue library (`src/lib/source/artifact-generation-queue.ts`) adds two public exports and updates `defaultGenerateQueuedArtifact` to pass the worker header.
- **global-control-lane**: New worker script (`src/scripts/process-source-artifact-generation-queue.ts`) run as an ACA Job.

## Client Applicability

- All clients: the generate route change is universal (header-gated, so no runtime change for web callers).
- The worker must be run manually or via ACA Job for queued jobs to be processed; no jobs are auto-enqueued by this PR.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`: `isWorkerCall` detection + `requestStartedAtMs` override; `artifactId` added to 422 quality_gate_failed response
- `src/lib/source/artifact-generation-queue.ts`: `findNextQueuedSourceArtifactGenerationJob`, `sweepStaleSourceArtifactGenerationJobs`, worker header in `defaultGenerateQueuedArtifact`
- `src/scripts/process-source-artifact-generation-queue.ts`: new worker script
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/enqueue-worker/route.ts`: new `POST` endpoint to queue a worker job after a sync 422

## QA / Validation

- TypeScript: `tsc -p tsconfig.json --noEmit` passes (to be run in CI)
- Unit: existing queue library tests continue to pass
- Integration: d09 will be manually re-queued and processed via the worker on ACA after merge+deploy; quality-gate rewrite outcome recorded as audit evidence
- Rewrite budget logic reviewed: when `isWorkerCall=true`, `requestStartedAtMs=Date.now()` at quality-gate call time → `remainingBudgetMs ≈ 110_000ms` → rewrite always attempted

## Rollout Plan

1. Merge PR to main (squash)
2. ACA auto-deploys updated web image
3. To process queued d09 jobs: enqueue via the existing `enqueueSourceArtifactGenerationJob` API, then run the worker script via `az containerapp job start` pointing to the new worker image (or `npx tsx src/scripts/process-source-artifact-generation-queue.ts` from inside the ACA Job environment)

## Deployment Authority

- Repo-owned deploy workflow: aca-main-deploy auto-deploys on push to main
- Shared runtime mutators: none — no migration, no env var changes
- ACA runtime invariant: web replica + job worker share the same image; no separate image required for the first run (worker is invoked via tsx)
- Worker image invariant: no new image needed; worker runs via `npx tsx` from the repo image
- Feature/env flag update path: none required
- Live signed-in proof required: yes — d09 re-generation with rewrite observed via job logs after deploy

## Rollback Plan

Revert the PR. The generate route falls back to the sync path for all calls (no header set by web UI). The worker script is unused without explicit invocation. No migration rollback needed.

## Known Gaps

- The generate route `POST` endpoint does not yet auto-enqueue board-grade artifacts — a caller must explicitly enqueue via `enqueueSourceArtifactGenerationJob` or via the canvas UI (follow-on PR). For now the worker is invoked manually after a d09 sync attempt quality-gates at 7/10.
- No UI polling for async job status — the canvas shows the last persisted artifact body; refresh reveals the updated body after the worker completes.
- The worker processes jobs sequentially (one at a time per invocation); concurrent d09 jobs for different events must be run as separate ACA Job executions.

## Audit Evidence

- PR URL: (assigned on merge)
- CI: tsc + existing test suite
- Post-deploy: ACA Job run logs showing d09 rewrite attempted and quality-gate result
