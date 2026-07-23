# 2026-07-23 — Moves P3 Worker Freshness Leaf

## Release ID

`2026-07-23-moves-p3-worker-freshness-leaf`

## Status

`candidate`

## Plain-English Summary

The P3 architecture worker now checks Move Context Extract freshness through a read-only, worker-safe data module. The previous import pulled request-scoped Clerk/Next dependencies into the standalone worker and crashed before the architecture prompt ran.

## Layer Impact

- `global-control-lane`: changes the shared async Moves P3 lineage-validation path.
- No evidence, gate, selected-option, prompt, or architecture-model policy is weakened.

## Client Applicability

- All clients: yes, when P3 architecture runs carry decision lineage.
- Specific clients: live proof uses only the disposable First Capital proof Move.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing P3 architecture assembly behavior only.

## Changes Included

- Add `move-context-extract-freshness.ts`, a read-only Azure/Postgres leaf with no Clerk, Next request, audit, ingestion, or UI dependencies.
- Route the durable worker's context-lineage check through the leaf.
- Re-export the existing API from the broad Context Extract module for compatibility.
- Add stack logging to ACA worker failures while preserving bounded persisted error text.
- Add a subprocess regression test under the exact `react-server` condition used by ACA.

## QA / Validation

- Pass: the worker entry point and freshness leaf import under the exact ACA `react-server` condition.
- Pass: focused worker/freshness Jest (11/11), Context Extract/generate-phase Jest (16/16), ESLint, TypeScript, Context Extract audit, Moves tenant-isolation audit, architecture rules, and diff check.
- Pending: release check rerun after this record update.
- Not run until post-merge: ACA runtime invariant for web and both worker jobs.
- Not run until post-deploy: controlled P3 architecture retry on the disposable First Capital proof Move. P3 gate approval remains out of scope.

## Rollout Plan

Merge by PR. The repo-owned ACA main workflow builds and deploys one digest to web and both deliverable workers. Rerun the disposable P3 architecture assembly only after the runtime invariant passes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow-owned only.
- Approved image digest: pending deployment.
- ACA runtime invariant: required.
- Worker image invariant: required for both jobs.
- Feature/env flag update path: none.
- Live signed-in proof required: controlled API/browser proof on the disposable Move.

## Rollback Plan

Revert this PR and redeploy the prior digest. Queued runs remain durable. Do not approve or advance the affected P3 Move during rollback.

## Audit Evidence

- PR, CI, deploy, runtime-invariant bundle, worker logs, and P3 retry proof: pending.

## Known Gaps

- This release repairs worker freshness validation only. It does not approve P3 or change the architecture approach/prompt contract.
