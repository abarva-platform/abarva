# 2026-06-05-meridian-phs-azure-private-data-plane-handoff - Meridian/PHS Azure private data plane handoff

## Release ID

`2026-06-05-meridian-phs-azure-private-data-plane-handoff`

## Status

`candidate`

## Plain-English Summary

Adds a pilot-ready architecture handoff for the Meridian/PHS Azure private data plane. The handoff separates what is live today from what is only designed or partially implemented, documents the Azure Blob and worker ingestion path, lists environment variables without exposing secrets, and states the production cutover and rollback plan.

## Layer Impact

- `client-data-lane`: Documents the governed Meridian/PHS ingestion architecture, template contract, private-network constraints, and tenant-scoped persistence requirements.
- `internal-admin`: Gives AbarVa operators a concrete checklist for Azure env alignment, Blob landing, Service Bus worker readiness, audit evidence, and rollback.

## Client Applicability

- All clients: The architecture pattern can later be reused for other private data-plane pilots.
- Specific clients: Meridian Health System / PHS-style pilot.
- Internal only: This is an internal execution handoff.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/build/meridian-phs-demo/AZURE_PRIVATE_DATA_PLANE_HANDOFF_2026-06-05.md`.
- Added this release record.
- No runtime code, routes, migrations, corpus content, UX copy, or demo artifacts changed.

## QA / Validation

- PASS: Read and audited current code paths:
  - `src/lib/data-plane/objectStorage.ts`
  - `src/app/api/admin/context-layer/csv-upload/route.ts`
  - `src/lib/context-ingestion/csv-upload-connector.ts`
  - `src/lib/context-ingestion/template-registry.ts`
  - `src/lib/ingestion/azure-landing-zone-consumer.ts`
  - `src/scripts/azure-context-ingestion-worker.ts`
  - `src/lib/ingestion/azure-landing-zone-types.ts`
  - `src/lib/ingestion/document-upload-parser.ts`
  - `src/lib/ingestion/defender-storage-scan-gate.ts`
  - `src/lib/ingestion/event-grid-normalizer.ts`
- PASS: Verified Meridian/PHS template catalog alignment by script: 26 catalog templates, 26 registry matches, 0 missing.
- PASS: Checked local environment variable presence without printing values.
- BLOCKED: Checked Azure resource reachability from local Mac. Private Azure Postgres, Key Vault, and Azure AI Search are private-network/RBAC blocked from the Mac, so live DB/Search validation must run from an approved private-network runner.
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- NOT RUN: Runtime build, typecheck, and browser smoke. This PR is documentation only and does not change runtime code, routes, migrations, product UI, corpus content, or demo artifacts.

## Rollout Plan

Merge the documentation PR to main. No production deployment is required because this is architecture documentation only.

## Rollback Plan

Revert the documentation PR. No runtime rollback, migration rollback, or Azure resource rollback is needed.

## Audit Evidence

- PR URL to be added after PR creation.
- Architecture handoff document under `docs/build/meridian-phs-demo/`.
- Validation command output from `git diff --check` and `npm run release:check`.

## Known Gaps

- Blob-first Admin bulk ingestion is not yet the canonical production path.
- Worker default mode remains `audit_only`; tenant chunk persistence and embedding handoff are future cutover slices.
- Live async Azure processing is not claimed until Service Bus, Blob, worker, Postgres, and retrieval smoke evidence is captured from inside the private data plane.
