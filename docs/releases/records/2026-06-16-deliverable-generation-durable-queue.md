# 2026-06-16-deliverable-generation-durable-queue - Durable deliverable generation queue + retryable tenant lookup

## Release ID

`2026-06-16-deliverable-generation-durable-queue`

## Status

`candidate`

## Plain-English Summary

A Strategic-Move (and Source/Tower/Intelligence) board-grade deliverable run now always completes even if the web replica recycles mid-run. Previously the generation ran as a detached `void (async…)` promise inside the POST handler; on Azure Container Apps (minReplicas:0/maxReplicas:1) the replica is recycled right after the 202 returns, killing the orphaned promise and stranding the run at `running` forever.

The generate routes now do NO model work: they validate, persist a self-contained job row (`status='queued'` carrying the full job payload), and return 202. A separate ACA Job worker (`src/scripts/process-deliverable-queue.ts`) atomically claims the next queued row (`FOR UPDATE SKIP LOCKED`), runs the generation deterministically from the persisted payload + identity columns, heartbeats while alive, and completes the run — exactly the completion mapping the route used before. A stale claim (worker died) is reclaimable after a lease window; a hard deadline reaper fails anything stuck past 15 minutes so a run can never be non-terminal forever.

Separately (Fix B): a transient DB error during tenant lookup no longer surfaces as a misleading `no_client` 403. The tenant-row lookup re-throws all DB errors (only a genuine zero-row result returns null), and `requireTenancy` maps a lookup outage to a distinct retryable `503 tenant_lookup_unavailable`.

## Layer Impact

- `global-control-lane` lane: Changes shared control-plane behavior for all clients — the deliverable generate routes become enqueue-only, a new durable worker entrypoint runs queued generations, and tenant-lookup errors now distinguish a retryable outage (503) from a real "no client" (403). The generation engine itself (generate-service/orchestrator/model-caller/persistence) is unchanged.
- `client-data-lane` lane: Migration `20260616250000_deliverable_runs_durable.sql` extends the control-plane `deliverable_runs` table (new `queued` status, `claimed_at`, `worker_id`, `job_payload`, claim index). Additive + nullable; in-flight rows are unaffected. No tenant content/corpus rows change.

## Client Applicability

- All clients: Yes — every tenant's deliverable generation now runs through the durable queue, and the tenant-lookup error behavior changes for all signed-in requests.
- Specific clients: None singled out.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No (no new flag; behavior is the default path).

## Changes Included

- Migration `supabase/migrations/20260616250000_deliverable_runs_durable.sql`: adds `queued` to the status CHECK; adds `claimed_at timestamptz`, `worker_id text`, `job_payload jsonb`; adds `idx_deliverable_runs_claim (status, claimed_at)`.
- `src/lib/deliverables/orchestrator/runs-repository.ts`: `createDeliverableRun` now inserts `status='queued'` with `job_payload`; adds `claimNextDeliverableRun` (atomic `FOR UPDATE SKIP LOCKED` claim), `heartbeatDeliverableRun`, `sweepStaleDeliverableRuns`; `updateDeliverableRunProgress` doubles as a heartbeat when a `workerId` is passed; `DeliverableRunRecord`/`rowToRecord` extended for the new columns; new `DeliverableRunJobPayload` type.
- `src/scripts/process-deliverable-queue.ts` (new): the ACA Job worker — sweeps stale runs, claims runnable rows, reconstructs `GenerateDeliverableServiceInput` from the row, runs `runDeliverableForTenant`, heartbeats per pass, and completes the run. Bounded per invocation.
- `src/app/api/v1/deliverables/generate/route.ts`: deletes the inline detached-promise generation block; now enqueue-only, returns `202 {runId, status:'queued'}`.
- `src/app/api/v1/programs/[programId]/generate/route.ts`: same enqueue-only conversion (shared `createDeliverableRun` contract + same orphaned-promise risk).
- `src/app/api/v1/deliverables/runs/[runId]/route.ts`: poll endpoint surfaces `queued` (0% + "Queued — waiting for the generation worker" label).
- `src/components/deliverables/GenerateDeliverableButton.tsx`: treats `queued` as non-terminal (keeps polling).
- `src/lib/tenant/resolveTenant.ts`: `resolveClientRow` re-throws ALL DB errors (Fix B).
- `src/lib/active-client.ts`: `getActiveClientRow` re-throws DB errors as new `TenantLookupUnavailableError` instead of collapsing to null.
- `src/lib/auth/tenancy.ts`: `requireTenancy` maps `TenantLookupUnavailableError` to `TenancyError('tenant_lookup_unavailable')`; `tenancyErrorResponse` returns `503 tenant_lookup_unavailable`.
- Tests: `runs-repository.test.ts` (claim/sweep/queued-insert), `deliverables/generate/__tests__/route.test.ts` (202 queued, no model work), `process-deliverable-queue.test.ts` (new worker), `tenancy-error-response.test.ts` (new 503 mapping), poll-route queued case, programs-generate integration test updated to enqueue-only.

## QA / Validation

- PASS: `npx tsc --noEmit -p tsconfig.json` (filtering only the pre-existing `Cannot find module '@/…'`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright` noise unrelated to these files).
- PASS: `npx jest` on the 8 affected suites — 40 tests pass (runs-repository, deliverables generate route, deliverables runs poll route, process-deliverable-queue worker, tenancy-error-response, resolveTenant, programs-generate integration, moves-liability controls).
- PASS: `npx eslint` on all changed source + test files (0 problems).
- PASS: `npm run audit:architecture-rules` (8 files scanned, 0 violations).
- PASS: `npm run release:check -- --base origin/main --head HEAD` (run before push).

## Rollout Plan

Merge to `main` (squash) after CI is green. Apply migration `20260616250000_deliverable_runs_durable.sql` to the Azure private Postgres via the in-VNet migrate job. Build/deploy the ACA web image normally. Then create a new ACA Job that runs `npx tsx src/scripts/process-deliverable-queue.ts` on a short cron (e.g. every 1–2 min, scale-to-zero) inside the private VNet so it can reach Postgres and the AI egress path. The worker is bounded per invocation and idempotent across replicas, so multiple concurrent invocations are safe (`FOR UPDATE SKIP LOCKED`). Until the ACA Job exists, queued runs accumulate but are NOT generated — the queue is the durable buffer.

## Rollback Plan

Revert the PR and redeploy the web image; routes return to the previous inline behavior. Disable/delete the ACA worker Job. The migration is additive (new nullable columns + a new CHECK value + an index) and safe to leave in place; if a full DB rollback is required, drop `idx_deliverable_runs_claim`, drop columns `job_payload`/`worker_id`/`claimed_at`, and restore the prior status CHECK (no `queued`) — only after draining/failing any `queued` rows. Queued-but-unprocessed rows can be failed in bulk via the sweep or a manual UPDATE.

## Audit Evidence

- PR URL: Pending.
- CI checks: Pending (architecture-rules + release:check + jest).
- Migration replay: `20260616250000_deliverable_runs_durable.sql` (additive, idempotent `IF NOT EXISTS`).
- Local focused tests, lint, typecheck, and architecture-rules passed as listed above.
- How the `FOR UPDATE SKIP LOCKED` claim runs: via the write-side transaction session `createTxSession` in `src/lib/data-plane/read-adapters/azureSession.ts` (opens one pg connection, wraps the statement in BEGIN/COMMIT, ROLLBACKs on throw). The fluent `azureRead.query` helper is SELECT-only and rejects UPDATE, so the claim/sweep use this raw transactional escape hatch with parameterized SQL.

## Known Gaps

- LIVE ACA VERIFICATION PENDING: the new ACA Job to run `src/scripts/process-deliverable-queue.ts` must be created at deploy time (operator/Anand will create it). Until then, enqueue works but nothing drains the queue.
- The atomic claim is unit-tested with an injectable raw-SQL runner that simulates SKIP LOCKED; the real two-worker race and lease/heartbeat timing should be confirmed once against the private Postgres.
- Fix B re-throws DB errors from `getActiveClientRow` for all 169 render callers too (previously only infra-class errors threw; non-infra DB errors used to collapse to an empty-state). This is intentional (a DB blip should not render as "no client") but should be eyeballed on a render path once live.
