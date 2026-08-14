# 2026-08-14-source-retired-shell-cleanup-s1 — Source Retired Shell Cleanup S1

## Release ID

`2026-08-14-source-retired-shell-cleanup-s1`

## Status

`candidate`

## Plain-English Summary

This removes the retired Source universal canvas shell that no route can reach. The live Source event route already mounts `SourceAnalyticsCanvas`; keeping the retired shell in the tree created a place where agents could spend effort on UI that no user would ever see.

The cleanup also removes the obsolete direct-render test for that retired shell and updates static smoke checks to point at the live Source event route or value proof page instead of reading the dead component file.

## Layer Impact

Layer 4 Products: Source code cleanup only. The change deletes an unreachable presentation component and stale tests that asserted against it.

No Layer 1 client intake, Layer 2 adapter, Layer 3 canonical model, parser, schema, workflow persistence, approval automation, tenant data, or live data-plane mutation is included.

## Client Applicability

- All clients: No expected rendered behavior change; the deleted shell was not route-mounted.
- Specific clients: None.
- Internal only: Yes, this reduces dead Source UI maintenance surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Deletes `src/components/source/canvas/UniversalCanvasShell.tsx`.
- Deletes the obsolete `src/__tests__/integration/source/source-event-canvas-render.test.tsx` direct-render suite for the retired shell.
- Updates smoke/static checks that read the retired shell to instead check the live Source route/value page.
- Refreshes `docs/architecture/source-canvas-orphans.json` from 131 to 130 unreachable Source components.
- Updates stale comments that still pointed agents to the retired shell as the event-detail canvas.

## QA / Validation

Pre-merge local validation:

- Pass: `npx eslint scripts/smoke/p22-decision-dossier.spec.ts scripts/smoke/p23-source-value-proof.spec.ts src/__tests__/integration/source/source-access-control-static.test.ts src/__tests__/integration/source/source-authenticated-route-smoke.test.ts src/__tests__/integration/source/source-route-shell-enforcement.test.ts src/__tests__/integration/source/source-old-surface-archive.test.ts src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts src/lib/source/agent-generation/server.ts src/lib/source/agent-generation/index.ts src/__tests__/integration/programs/programs-detail-prog23-source-link.test.ts`
- Pass: `npm test -- --runTestsByPath src/components/source/__tests__/source-canvas-reachability.test.ts src/__tests__/integration/source/source-access-control-static.test.ts src/__tests__/integration/source/source-old-surface-archive.test.ts src/__tests__/integration/source/source-route-shell-control.test.ts src/__tests__/integration/source/source-route-shell-enforcement.test.ts src/__tests__/integration/source/source-context-action-enforcement.test.ts src/__tests__/integration/source/source-authenticated-route-smoke.test.ts src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts src/__tests__/integration/programs/programs-detail-prog23-source-link.test.ts --runInBand` — 9 suites passed, 64 tests passed. Jest printed pre-existing duplicate manual mock warnings for markdown mocks.
- Pass: `npx tsx scripts/smoke/p22-decision-dossier.spec.ts`
- Pass: `npx tsx scripts/smoke/p23-source-value-proof.spec.ts`
- Pass: `node scripts/audit/source-canvas-reachability.mjs` — 616 route entry points, 130 unreachable files, no new unreachable components.
- Pass: `git diff --check`
- Pass: `npm run release:check` — Release Control Gate, Deploy Authority Gate, Azure deployment lane check, and Pilot Data Loader Gate passed.

Live signed-in Source route proof is not claimed for this cleanup slice. The deleted shell was unreachable and not route-mounted; active canvas signed-in proof remains a separate auth/session-gated validation lane.

## Rollout Plan

Open a PR, merge through the protected repository flow, and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge through `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Not used by this change.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: Required after deployment before claiming deployed main healthy.
- Worker image invariant: Required after deployment before claiming deployed main healthy.
- Feature/env flag update path: None.
- Live signed-in proof required: No for the deleted shell itself; the component was not live-mounted. Signed-in Source route proof remains valuable for the active canvas but is a separate auth/session blocker.

## Rollback Plan

Revert the PR or redeploy the prior healthy Azure Container Apps image through the approved repo-owned deployment lane. No migration rollback is required.

## Audit Evidence

Local validation evidence is listed above. PR, merge, deploy, and ACA invariant proof will be recorded after the protected repository and repo-owned deployment flow completes.

## Known Gaps

This is the first cleanup slice only. The reachability baseline still lists 130 unreachable Source components after this deletion.
