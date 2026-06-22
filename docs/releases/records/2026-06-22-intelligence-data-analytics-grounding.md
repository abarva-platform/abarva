# 2026-06-22-intelligence-data-analytics-grounding — Intelligence tenant retrieval wording

## Release ID

`2026-06-22-intelligence-data-analytics-grounding`

## Status

`candidate`

## Plain-English Summary

This change makes Ava treat common buyer wording such as "data & analytics landscape", "platforms", and "owners" as tenant-data questions. The shared Ask engine will route those questions into the tenant data/context retrievers instead of answering from generic expert context or prior session memory alone. It also classifies live surface evidence as tenant evidence when rendering AgentAnswer citations.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence retrieval classification and AgentAnswer citation mapping used by Home and Intelligence.
- `client-data-lane`: No schema or data migration; this only improves reads against already-loaded tenant data.

## Client Applicability

- All clients: Yes, every tenant using `/api/intelligence/ask`.
- Specific clients: Not tenant-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag; existing surface/SCB flags still control exposure.

## Changes Included

- `src/lib/knowledge/tenant-enterprise-context.ts`
- `src/lib/knowledge/tenant-technology-context.ts`
- `src/lib/intelligence/answer/structured-exhibits.ts`
- Targeted unit coverage for routing and citation mapping.

## QA / Validation

- `npx jest src/lib/knowledge/__tests__/segment-routing-landscape.test.ts src/lib/knowledge/__tests__/tenant-technology-context.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` passed.
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
- Live signed-in proof required: Yes, rerun the tenant matrix gate and require all non-auth-blocked tenants to cite tenant evidence for the data/analytics probe.

## Rollback Plan

Revert the PR and redeploy the previous approved main image. No data rollback is needed.

## Audit Evidence

- PR and CI once opened.
- Tenant matrix gate output after deployment.
- ACA image/traffic invariant after deployment.

## Known Gaps

Apex auth is separately failing by redirecting to sign-in in the tenant matrix. This change does not provision or repair that Clerk session.
