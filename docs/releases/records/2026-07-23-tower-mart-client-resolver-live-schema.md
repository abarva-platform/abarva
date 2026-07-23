# 2026-07-23 Tower Mart Client Resolver Live Schema Fix

## Release ID

`2026-07-23-tower-mart-client-resolver-live-schema`

## Status

`candidate`

## Plain-English Summary

The Tower mart projection job now resolves client rows using the live-supported
`public.clients.tenant_key` and `public.clients.slug` columns, plus display-name
fallbacks. It no longer queries the retired/nonexistent `public.clients.key` column.

This is a follow-up to the demo-tenant Tower mart job packaging. The first live Airline
Demo operator retry reached Azure/Postgres and failed safely before mutation with:

```text
error: column "key" does not exist
```

## Layer Impact

- `internal-admin`: fixes the governed ACA operator job path for Tower mart projection.
- `client-data-lane`: enables tenant-scoped mart writes to resolve the correct
  `clients.id` before the tracked transaction begins.

## Client Applicability

- All clients: no direct runtime UI change.
- Specific clients: Airline Demo / `skyharbor-air` and FS Demo / `first-capital-financial`
  operator mart jobs are the immediate consumers.
- Internal only: yes, this changes an operator/data-build script.
- Public/demo only: no public route change.
- Feature flag: none.

## Changes Included

- `src/scripts/tower/project-tower-mart.ts` removes `clients.key` from the resolver query
  and resolves aliases via `tenant_key`, `slug`, and lower-cased `name`.
- `src/scripts/tower/__tests__/project-tower-mart-client-resolver.test.ts` pins the
  live-schema-safe query shape.

## QA / Validation

- `pass` — targeted Jest for the resolver query shape and existing mart projection tests.
- `pass` — focused ESLint for the changed script and regression test.
- `pass` — `npm run release:check`.
- `pass` — targeted TypeScript compile.
- `pass` — Airline Demo no-DB projection dry run.
- `pass` — FS Demo no-DB projection dry run.
- `blocked-before-fix` — live Airline Demo operator job failed safely before mutation on the
  old resolver query; no proof bundle was emitted.

## Rollout Plan

Merge through PR to `main`, deploy through the ACA main workflow, prove the ACA runtime
invariant, then rerun the governed operator job:

```bash
node scripts/ops/submit-aca-operator-job.mjs \
  --image <deployed-digest> \
  --script project:tower-mart:airline-demo:write-job \
  --secret-env DATABASE_URL=azure-postgres-control-database-url
```

If Airline succeeds and readback reconciles, run the same pattern for:

```text
project:tower-mart:fs-demo:write-job
```

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR; data mutation occurs only in the explicit
  governed operator job after deploy.
- Approved image digest: resolved by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy and before rerunning the operator job.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after successful mart write/readback for affected tenants.

## Rollback Plan

No schema change and no runtime UI path change. If the operator job fails, it fails before
or inside the tracked transaction and the shared operator job restores to idle. Revert this
PR to return to the previous resolver behavior.

## Audit Evidence

- Failed Airline operator proof folder:
  `audit-artifacts/aca-operator/tower-mart-skyharbor-air-rerun-20260723/`
- PR and CI evidence after this candidate is opened.
- Post-deploy ACA runtime invariant evidence after merge.
- Operator proof bundle and mart readback validation after rerun.

## Known Gaps

Live Airline/FS mart write, readback reconciliation, and signed-in `/tower` proof remain
pending until this resolver fix is merged and deployed.
