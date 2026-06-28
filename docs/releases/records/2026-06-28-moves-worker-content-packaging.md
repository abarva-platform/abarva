# 2026-06-28 Moves Worker Runtime Readiness

## Release ID

`2026-06-28-moves-worker-content-packaging`

## Status

`candidate`

## Plain-English Summary

This release fixes the runtime path that processes premium Moves artifacts outside the public web request. The public Lakeshore browser path already enqueues P2 Current Work Diagnostic generation quickly, but the private worker must also be able to boot, read the queued Move through a tenant-scoped service context, call the premium artifact generator, and persist the result to the Move File Cabinet.

## Layer Impact

- `global-control-lane`: updates shared runtime packaging and the shared private worker context used by durable deliverable runs.
- Runtime image packaging: the ACA image now includes `src/content` so server-side worker imports can resolve authored deliverable evidence JSON and timeline files.
- Private operator worker: premium Moves artifact jobs now use a tenant-pinned service context (`tenant_admin` / `client_admin`) scoped to the queued run's `clientId` and `tenantKey`.

## Client Applicability

- All clients: receive the safer runtime image and tenant-scoped worker authorization behavior.
- Specific clients: Lakeshore is the live proof tenant for the P2 Current Work Diagnostic path.
- Internal only: private operator execution uses `job-abarva-private-operator-eus`.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Dockerfile runtime stage copies `/app/src/content` into `/app/src/content`.
- `src/scripts/process-deliverable-queue.ts` uses a tenant-pinned service/admin context when processing premium Moves artifact runs.
- `src/scripts/__tests__/process-deliverable-queue.test.ts` asserts premium P2 jobs resolve the Move through that tenant-pinned service context.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/scripts/__tests__/process-deliverable-queue.test.ts --runInBand`
- PASS: `npx eslint src/scripts/process-deliverable-queue.ts src/scripts/__tests__/process-deliverable-queue.test.ts --max-warnings 0`
- Pre-fix live proof: signed-in Lakeshore CIO session enqueued P2 draft generation in 882 ms and received HTTP `202 queued`.
- Pre-fix private operator proof: `job-abarva-private-operator-eus-btu4bko` failed before claiming the run with `Cannot find module '@/content/deliverables/apex-retail/morrison/_evidence-base.json'`.
- Intermediate proof after content packaging: `job-abarva-private-operator-eus-3fx449q` no longer hit the content import failure, but exposed missing manual job secret env projection and a worker Move lookup denial.
- Post-deploy proof required: enqueue a fresh signed-in Lakeshore P2 run, run the digest-pinned private operator with required secret references, and confirm the artifact is generated, persisted to the Move File Cabinet, and downloadable.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then rerun the Lakeshore P2 operator proof on the digest-pinned image using `job-abarva-private-operator-eus`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: ACA web image and worker job image update performed by the repo-owned deploy workflow.
- Approved image digest: to be recorded after deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must shift 100% traffic to the healthy revision for the merged SHA.
- Worker image invariant: private/operator worker jobs must use the same digest-pinned image before proof.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Lakeshore CIO session plus private operator proof.

## Rollback Plan

Revert the Dockerfile copy line and the worker-context change, merge to `main`, and redeploy through the ACA main deploy workflow. No data rollback is required because this release does not change schema or mutate tenant data outside normal generation runs.

## Audit Evidence

- PR #4102 for runtime content packaging.
- Follow-up commit in this branch for worker service-context hardening.
- Live enqueue proof and failed operator logs stored under `/Users/anand/Downloads/moves-p2-async-review-20260628`.
- Post-deploy operator proof and generated deliverable will be added to the same Downloads review folder.

## Known Gaps

- Manual private operator invocation must pass required secret references such as `DATABASE_URL` and `ANTHROPIC_API_KEY`.
- The previously queued run `50e4aa9e-799c-45d2-9cd5-b71eba109ccb` is already failed; post-deploy proof must enqueue a fresh run.
