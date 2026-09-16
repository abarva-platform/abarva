# 2026-09-16-source-event-read-tenant-boundary - Fail-Closed Event Reads

## Release ID

`2026-09-16-source-event-read-tenant-boundary`

## Status

`candidate`

## Plain-English Summary

A Source event lookup now requires the authenticated tenancy to match the requested client before it queries an event. A caller that omits tenancy or supplies a different client gets no event, including when it opts out of the separate event access-policy check.

## Layer Impact

`global-control-lane`: Layer 4 Source server-read authorization. No intake, adapter, canonical records, schema, policy migration, or tenant data change.

## Client Applicability

- All clients: Source event detail reads through the shared helper.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

`src/lib/source/queries.ts` and focused tenant-boundary tests. The existing policy-bypass option remains limited to its prior policy check; it cannot bypass the new tenancy match.

## QA / Validation

The two new negative tests failed before the guard and passed after it. All 14 focused tenant-scope tests passed, including an authorized event and a foreign row returned by an adapter. Scoped ESLint and TypeScript passed. CI and signed-in checks remain pending.

## Rollout Plan

Squash-merge through the protected PR path. The repo-owned ACA main deploy workflow builds and deploys the exact main SHA; no manual shared-runtime or data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolve after the workflow builds.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: authorized event opens and opposite-tenant event remains unavailable.

## Rollback Plan

If an authorized event read unexpectedly fails, review the role-to-client alias mapping and correct the match through a reviewed PR. Do not remove the tenant check as a workaround; a rollback would use the prior digest only under incident governance.

## Audit Evidence

Protected PR checks, before/after negative test output, deploy run, digest-pinned runtime readback and signed-in tenant-positive/negative proof to be attached after rollout.

## Known Gaps

The separate historical policy migration is tracked independently. This change does not prove every Source query is tenant-safe, nor does it replace an application-wide access audit.
