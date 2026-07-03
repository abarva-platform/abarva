# 2026-07-03-source-client-final-state-fallback — Source Client-Final Legacy Artifact-State Fallback

## Release ID

`2026-07-03-source-client-final-state-fallback`

## Status

`candidate`

## Plain-English Summary

This release lets the Source client-final acceptance workflow work on older generated Source events whose artifact-state rows were created before tenant-key normalization was consistent. The event is still resolved through the signed-in active client first; the fallback only changes how the already-authorized event's artifact row is found.

## Layer Impact

- `global-control-lane`: Updates the shared Source client-final API route used by all tenants.

## Client Applicability

- All clients: Yes, for Source events that use client-final artifact acceptance.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/client-final/route.ts`: keeps the strict tenant-key artifact-state lookup first, then falls back to event-scoped lookup for legacy rows after the source event has already been client-authorized.

## QA / Validation

- Pass: focused ESLint on `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/client-final/route.ts`.
- Pass: full TypeScript compile with `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`.
- Pass: `npm run release:check`.
- Pending: live signed-in SkyHarbor client-final proof against the existing AMS RFP event after deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, and rerun the live signed-in client-final proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Source client-final API route.
- Approved image digest: Pending deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% traffic after health.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback the ACA web app to the prior healthy revision or revert this route change. No schema changes are included in this follow-up release.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Live proof bundle: Pending.

## Known Gaps

This follow-up only fixes artifact-state lookup compatibility for legacy Source events. It does not change client-final UI copy, export rendering, gate semantics, or artifact generation latency; those behaviors remain covered by the original client-final release and live proof bundle.
