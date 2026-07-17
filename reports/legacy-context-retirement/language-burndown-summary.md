# Legacy Context Language Burndown PR1

Status: PASS

Generated: 2026-07-17T00:00:05.525Z

Scope: local runtime/proof language audit only. No Azure/Postgres mutation, no tenant promotion, no deploy, and no archive/delete was performed.

## Results

- Blocked visible/generated/proof findings remaining: 0
- Allowed internal/test/API/admin compatibility findings: 164
- Original active-language findings burned down or classified: 164

## Remaining Blockers

- PASS: no blocked visible/generated/proof legacy terms remain.

## Allowed Internal Uses

- src/app/(maestro)/admin/_cached-helpers.ts: substrate — allowed-internal-admin
- src/app/(maestro)/admin/agent-readiness/page.tsx: substrate — allowed-internal-admin
- src/app/(maestro)/admin/context-layer/page.tsx: substrate — allowed-internal-admin
- src/app/(maestro)/admin/customer/page.tsx: substrate — allowed-internal-admin
- src/app/(maestro)/admin/data-layer-explorer/__tests__/page-source.test.ts: projection — allowed-test-fixture
- src/app/(maestro)/admin/data-layer-explorer/page.tsx: projection — allowed-internal-admin
- src/app/(maestro)/admin/data-trust/page.tsx: substrate — allowed-internal-admin
- src/app/(maestro)/admin/dossiers/page.tsx: dossier — allowed-internal-admin
- src/app/(maestro)/admin/knowledge-preview/page.tsx: context packet — allowed-internal-admin
- src/app/(maestro)/admin/segments/[segmentId]/page.tsx: substrate — allowed-internal-admin
- src/app/(maestro)/admin/setup/cxo-intel/page.tsx: substrate — allowed-internal-admin
- src/app/(maestro)/admin/setup/page.tsx: substrate — allowed-internal-admin
- src/app/(maestro)/dossier/[threadId]/page.tsx: dossier — existing-runtime-copy-outside-dataset-sunset-boundary
- src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts: V7 — allowed-test-fixture
- src/app/(maestro)/home/page.tsx: V6 — allowed-internal-storage-lineage
- src/app/(maestro)/home/page.tsx: V7 — existing-runtime-copy-outside-dataset-sunset-boundary
- src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx: substrate — existing-runtime-copy-outside-dataset-sunset-boundary
- src/app/(maestro)/source/events/[eventId]/page.tsx: dossier — existing-runtime-copy-outside-dataset-sunset-boundary
- src/app/(maestro)/source/events/[eventId]/page.tsx: substrate — allowed-code-identifier-or-route
- src/app/(maestro)/strategic-moves/expert-kernel/dossier/page.tsx: dossier — existing-runtime-copy-outside-dataset-sunset-boundary
- src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts: source_record_id — allowed-test-fixture
- src/app/api/chat/agent/route.ts: dossier — allowed-api-implementation
- src/app/api/chat/agent/route.ts: substrate — allowed-api-implementation
- src/app/api/debug/tower-substrate/route.ts: substrate — allowed-api-implementation
- src/app/api/home/know/ask/route.ts: V6 — allowed-api-implementation
- src/app/api/home/know/ask/route.ts: V7 — allowed-api-implementation
- src/app/api/home/summary-snapshot/route.ts: V6 — allowed-api-implementation
- src/app/api/home/summary-snapshot/route.ts: V7 — allowed-api-implementation
- src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts: V7 — allowed-test-fixture
- src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts: dossier — allowed-test-fixture
- src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts: substrate — allowed-test-fixture
- src/app/api/intelligence/ask/route.ts: dossier — allowed-api-implementation
- src/app/api/intelligence/ask/route.ts: substrate — allowed-api-implementation
- src/app/api/intelligence/ask/route.ts: source_record_id — allowed-api-implementation
- src/app/api/programs/synthesis/__tests__/route.test.ts: V6 — allowed-test-fixture
- src/app/api/programs/synthesis/route.ts: V6 — allowed-api-implementation
- src/app/api/reasoning/_auth.ts: substrate — allowed-api-implementation
- src/app/api/reasoning/audit/route.ts: substrate — allowed-api-implementation
- src/app/api/source/synthesis/__tests__/route.test.ts: V6 — allowed-test-fixture
- src/app/api/source/synthesis/route.ts: V6 — allowed-api-implementation

- ...124 additional allowed rows in allowed-internal-legacy-uses.csv
