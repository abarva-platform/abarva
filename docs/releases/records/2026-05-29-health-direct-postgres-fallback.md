# 2026-05-29-health-direct-postgres-fallback — Health Direct Postgres Fallback

## Release ID

`2026-05-29-health-direct-postgres-fallback`

## Status

`candidate`

## Plain-English Summary

This hotfix keeps `/api/health` green when the direct Postgres probe succeeds
even if the higher-level Azure read-adapter probe is temporarily degraded. The
response still reports both fields, so operators can see the degraded adapter,
but production liveness no longer reports a full outage when the database itself
is reachable.

## Layer Impact

- runtime-health lane: changes only the aggregate health decision for
  `/api/health`.
- data-plane observability: preserves `postgres`, `postgres_error`,
  `direct_postgres`, and `direct_postgres_error` fields for diagnosis.
- application behavior: no user-facing route, database query, schema, migration,
  auth, or write-path behavior changes.

## Client Applicability

- All clients: yes, shared public liveness endpoint.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/health/route.ts`
- `src/app/api/health/__tests__/route.test.ts`

## QA / Validation

- PASS: focused Jest for `/api/health`, 1 suite / 2 tests.
- PASS: focused ESLint for changed health files.
- PASS: release-control gate.
- NOT RUN YET: production `/api/health` smoke after deploy.

## Rollout Plan

Merge to main after CI is green. Vercel production deploy updates
`app.abarva.ai`. Verify `/api/health` returns HTTP 200 repeatedly after deploy.

## Rollback Plan

Revert this hotfix PR to restore the prior aggregate rule that required
`checks.postgres === true`. No database rollback is required.

## Audit Evidence

- PR URL and CI run after PR creation.
- Production `/api/health` smoke output after deploy.

## Known Gaps

This does not hide the read-adapter degradation; it only prevents direct
Postgres reachability from being reported as a full liveness outage. Follow-up
work should diagnose why the read-adapter probe intermittently fails while
`direct_postgres` succeeds.
