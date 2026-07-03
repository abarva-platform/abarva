# 2026-07-03-source-lakeshore-ava-binding — Source Lakeshore aVa Binding

## Release ID

`2026-07-03-source-lakeshore-ava-binding`

## Status

`candidate`

## Plain-English Summary

Source aVa now keeps Lakeshore vendor-advisory questions on the vendor evaluation and BAFO evidence path instead of letting client-final RFP governance answers take over. Specialized Source answers are preserved through the live answer-quality layer, the ask route uses the authenticated Source tenancy context for deterministic client binding, and the Source File Cabinet listing surfaces generated/uploaded registry artifacts when durable cabinet projections are absent.

## Layer Impact

- `global-control-lane`: shared Source answer routing and Source File Cabinet API behavior change for all clients.
- `client-data-lane`: no schema or data mutation; the File Cabinet API reads existing generated artifact-state rows and Source artifact registry rows for the active tenant/event.

## Client Applicability

- All clients: yes, for Source aVa routing and Source File Cabinet visibility.
- Specific clients: Lakeshore proof is the target validation case.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-answer-engine.ts`: prioritizes evaluation and BAFO answers before artifact-governance answers; artifact governance no longer hijacks vendor advancement questions.
- `src/lib/source/nexus-api.ts`: preserves specialized evaluation, BAFO, artifact-authority, and contract-optimization Source answers through the live answer-quality layer so the user-visible response stays advisory-specific.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: uses the richer authenticated Source tenancy context and stable client key when resolving the active Source event.
- `src/app/api/v1/source/events/[eventId]/artifacts/route.ts`: bridges linked generated artifact-state rows and tenant-scoped Source artifact registry rows into the File Cabinet generated/upload/session groups when durable File Cabinet rows are absent.
- `src/lib/source/__tests__/source-answer-engine.test.ts`: regression for vendor advancement vs. final RFP authority.
- `src/lib/source/__tests__/nexus-api-live-context.test.ts`: regression that the live API response preserves Vendor A/B/C evaluation answers through the quality gate.
- `src/app/api/v1/source/events/[eventId]/artifacts/__tests__/route.test.ts`: regression for generated artifact-state and Source artifact registry File Cabinet visibility.

## QA / Validation

- Pass — focused Jest: `source-answer-engine.test.ts`, `nexus-api-live-context.test.ts`, and Source File Cabinet route tests, 57 tests passed across targeted runs.
- Pass — touched-file ESLint.
- Pass — TypeScript: `tsc --noEmit --project tsconfig.json` with `NODE_OPTIONS=--max-old-space-size=8192`.
- Pending — live signed-in Lakeshore Source aVa/browser proof after deployment.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps lane, then run the signed-in Lakeshore Source proof against `LAKE-SHARED-SERVICES-AMS-2026`.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps web image only.
- Approved image digest: pending deployment.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% ingress traffic on the deployed revision.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Redeploy the previous healthy ACA web image/revision. No database rollback is required because this release is read-path and answer-routing only.

## Audit Evidence

- PR and deployed revision after merge.
- Focused Jest output, TypeScript output, ESLint output.
- Signed-in Lakeshore 20-question aVa proof report after deployment.
- File Cabinet API payload showing generated artifacts plus client-final artifact.

## Known Gaps

Live signed-in proof is pending until the candidate is deployed.
