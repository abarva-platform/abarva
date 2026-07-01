# 2026-07-01-source-moves-tenant-fence — Source and Moves Synthesis Tenant Fence

## Release ID

`2026-07-01-source-moves-tenant-fence`

## Status

`candidate`

## Plain-English Summary

Source and Moves synthesis can no longer fall back to the Apex demo fixtures when the signed-in user is on another tenant. If a tenant does not yet have a V6 Source event or Moves program loaded, the route returns a traceable unavailable response. If a user asks explicitly for an Apex instance while signed in to another tenant, the route returns `wrong_client` before building context or calling Claude.

## Layer Impact

- `global-control-lane`: Updates shared authenticated API behavior for `/api/source/synthesis` and `/api/programs/synthesis`.
- `client-data-lane`: No schema or data mutation. The release enforces that deterministic fixture instances are only usable by their owning tenant.

## Client Applicability

- All clients: Receive the tenant fence and no-fallback behavior.
- Specific clients: Retail Demo keeps access to the Apex Source/Moves fixtures. Airline Demo and Industrial Demo now receive unavailable/wrong-client responses until V6 Source/Moves data exists for those tenants.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/api/source/synthesis/route.ts`
- `src/app/api/source/synthesis/__tests__/route.test.ts`
- `src/app/api/programs/synthesis/route.ts`
- `src/app/api/programs/synthesis/__tests__/route.test.ts`

## QA / Validation

- `npx jest src/app/api/source/synthesis/__tests__/route.test.ts src/app/api/programs/synthesis/__tests__/route.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand` — passed, 37 tests.
- Production smoke before this candidate exposed Apex/APX-CDP Source/Moves content under non-Apex tenants, which this release blocks.

## Rollout Plan

Merge to `main`, build the exact git SHA through the repo-owned ACA main deploy workflow, shift 100% traffic to the new Azure Container Apps revision, then rerun signed-in Source/Moves tenant-fence probes plus the V6 contract smoke.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: Azure Container Apps web app and aligned worker jobs through the approved workflow.
- Approved image digest: To be captured by deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required through deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Roll back ACA traffic to the prior healthy revision if the route change blocks an intended Retail Demo workflow. No database rollback is required.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added after PR checks.
- Deployment run: to be added after merge.
- Smoke output: to be added after production tenant-fence proof.

## Known Gaps

Airline Demo and Industrial Demo still need their own V6 Source and Moves data packs. This release prevents cross-tenant fallback; it does not create those missing tenant-specific Source/Moves instances.
