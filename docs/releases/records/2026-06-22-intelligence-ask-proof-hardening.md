# 2026-06-22-intelligence-ask-proof-hardening — Ask proof isolation and prose cleanup

## Release ID

`2026-06-22-intelligence-ask-proof-hardening`

## Status

`candidate`

## Plain-English Summary

This change prevents the tenant matrix proof from reusing stale Ask session memory, and keeps raw internal record IDs out of Ava's prose. The answer can still cite the underlying records through structured citations, but the user-facing text should name business assets and owners instead of leaking internal row IDs.

## Layer Impact

- `global-control-lane`: Updates the shared Ask response sanitizer and the live tenant matrix QA harness.
- `client-data-lane`: No schema, ingestion, or tenant data changes.

## Client Applicability

- All clients: Yes, every surface using Ask prose benefits from the sanitizer; every tenant matrix run uses isolated tab IDs.
- Specific clients: Not tenant-specific.
- Internal only: The QA harness change is internal.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/ask/response-policy.test.ts`
- `scripts/qa/tenant-matrix-gate.mjs`

## QA / Validation

- `npx jest src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed.
- `node --check scripts/qa/tenant-matrix-gate.mjs` passed.
- `npm run release:check` must pass before PR.

## Rollout Plan

Merge to `main`; repo-owned ACA main deploy builds and rolls the shared web runtime. No migration, queue job, DNS change, or feature flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: No manual runtime mutation required.
- Approved image digest: Filled by ACA main deploy.
- ACA runtime invariant: Template image, traffic revision, and active revision image must match after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Yes, rerun `BASE_URL=https://app.abarva.ai node scripts/qa/tenant-matrix-gate.mjs` after deploy.

## Rollback Plan

Revert the PR and redeploy the previous approved main image. No data rollback is needed.

## Audit Evidence

- PR and CI once opened.
- Tenant matrix gate output after deployment.
- ACA image/traffic invariant after deployment.

## Known Gaps

None known for this narrow hardening change.
