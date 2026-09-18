# Legacy Context Language Burndown PR1

Status: FAIL

Generated: 2026-09-18T18:18:29.512Z

Scope: local runtime/proof language audit only. No Azure/Postgres mutation, no tenant promotion, no deploy, and no archive/delete was performed.

## Results

- Blocked visible/generated/proof findings remaining: 5
- Allowed internal/test/API/admin compatibility findings: 278
- Original active-language findings burned down or classified: 278

## Remaining Blockers

- datasets/context-artifacts/approved/apex-retail/home-knowledge/approved-home-knowledge-design-contract-pack.json: V4 — 2 occurrence(s) in generated/proof artifact.
- datasets/context-artifacts/approved/apex-retail/home-knowledge/approved-home-knowledge-design-contract-pack.json: synthetic demo — 2 occurrence(s) in generated/proof artifact.
- datasets/context-artifacts/approved/first-capital/home-knowledge/approved-home-knowledge-design-contract-pack.json: V4 — 3 occurrence(s) in generated/proof artifact.
- datasets/context-artifacts/approved/first-capital/home-knowledge/approved-home-knowledge-design-contract-pack.json: synthetic demo — 2 occurrence(s) in generated/proof artifact.
- datasets/context-artifacts/approved/lakeshore-holdings/home-knowledge/approved-home-knowledge-design-contract-pack.json: synthetic demo — 1 occurrence(s) in generated/proof artifact.

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
- src/app/(maestro)/home/__tests__/home-page-ecl-route.test.tsx: projection — allowed-test-fixture
- src/app/(maestro)/home/page.tsx: projection — allowed-code-identifier-or-route
- src/app/(maestro)/home/preview/page.tsx: projection — allowed-code-identifier-or-route
- src/app/(maestro)/intelligence/page.tsx: projection — allowed-code-identifier-or-route
- src/app/(maestro)/knowledge-preview/page.tsx: old Home — allowed-code-identifier-or-route
- src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx: substrate — existing-runtime-copy-outside-dataset-sunset-boundary
- src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts: substrate — allowed-test-fixture
- src/app/(maestro)/source/events/[eventId]/page.tsx: substrate — allowed-code-identifier-or-route
- src/app/(maestro)/source/optimize/__tests__/page.financial-access.test.tsx: V4 — allowed-test-fixture
- src/app/(maestro)/source/optimize/page.tsx: V4 — allowed-code-identifier-or-route
- src/app/(maestro)/source/preview/workspace/ContractAnatomy.tsx: projection — allowed-code-identifier-or-route
- src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx: projection — allowed-code-identifier-or-route
- src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx: substrate — existing-runtime-copy-outside-dataset-sunset-boundary
- src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx: source_record_id — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx: V4 — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx: projection — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx: source_record_id — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts: projection — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts: V4 — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts: source_record_id — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/contractPerformanceCards.test.tsx: latest loaded — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts: projection — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts: V4 — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts: projection — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts: V4 — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts: V4 — allowed-test-fixture
- src/app/(maestro)/source/preview/workspace/buildViewModel.ts: V4 — existing-runtime-copy-outside-dataset-sunset-boundary

- ...238 additional allowed rows in allowed-internal-legacy-uses.csv
