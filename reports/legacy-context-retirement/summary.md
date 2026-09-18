# Legacy Context Retirement

Status: FAIL

Generated: 2026-09-18T18:18:29.513Z

Scope: local repository audit only. No Azure/Postgres mutation, no tenant promotion, no deploy, and no archive/delete was performed by this script.

## Inventory

- Rows: 6340
- High-risk runtime/user-facing rows: 207
- Actions: archive=3351, keep_internal=1956, wrap=813, rename=220

## Replacement Proof

- PASS: v3-inputs:meridian-health — 19 standard v3 files present
- PASS: approved-home-knowledge:meridian-health — approved story blocks and visual specs present
- FAIL: v3-inputs:skyharbor-air — missing 00_enterprise_profile.csv;01_business_functions.csv;02_org_ownership.csv;03_workforce_roles.csv;04_applications_systems.csv;05_data_assets_integrations.csv;06_infrastructure_platforms.csv;07_vendors_contracts.csv;08_it_budget_spend_value.csv;09_programs_initiatives.csv;10_ai_automation_use_cases.csv;11_risks_controls.csv;12_relationships.csv;13_evidence_sources.csv;14_metrics_outcomes.csv;15_industry_context_patterns.csv;16_expert_lenses.csv;17_managed_services_scope.csv;18_operational_process_evidence.csv
- PASS: approved-home-knowledge:skyharbor-air — approved story blocks and visual specs present
- PASS: v3-inputs:first-capital — 19 standard v3 files present
- PASS: approved-home-knowledge:first-capital — approved story blocks and visual specs present
- VACUOUS: candidate-invisibility-guard — default runtime requires active pointer; candidate preview is explicit — NOT PROVEN: src/lib/home/v7-context-browser.ts no longer exists, so this check has no subject
- PASS: local-runtime-retrieval-proof — local runtime retrieval proof bundle exists

## Active Architecture Proof

- PASS: primary-v3-generation-script-present — package exposes generate:tenant-v3-data
- PASS: primary-v3-audit-script-present — package exposes v3 tenant input audit
- FAIL: home-approved-artifact-fallback-present — Home can render approved Claude-derived local artifacts
- VACUOUS: default-reader-active-pointer — default DB reader uses active pointer instead of latest loaded row — NOT PROVEN: src/lib/home/v7-context-browser.ts no longer exists, so this check has no subject
- VACUOUS: candidate-preview-explicit — candidate preview requires an intentional preview mode flag; default runtime uses active mode — NOT PROVEN: src/lib/home/v7-context-browser.ts no longer exists, so this check has no subject

## Language Audit

- WARN: src/app/(maestro)/admin/_cached-helpers.ts — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/agent-readiness/page.tsx — substrate — 2 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/context-layer/page.tsx — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/customer/page.tsx — substrate — 13 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/data-layer-explorer/__tests__/page-source.test.ts — projection — 2 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/admin/data-layer-explorer/page.tsx — projection — 3 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/data-trust/page.tsx — substrate — 2 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/dossiers/page.tsx — dossier — 24 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/knowledge-preview/page.tsx — context packet — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/segments/[segmentId]/page.tsx — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/setup/cxo-intel/page.tsx — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/setup/page.tsx — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/dossier/[threadId]/page.tsx — dossier — 5 visible occurrence(s), 28 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/home/__tests__/home-page-ecl-route.test.tsx — projection — 3 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/home/page.tsx — projection — 1 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/home/preview/page.tsx — projection — 1 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/intelligence/page.tsx — projection — 2 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/knowledge-preview/page.tsx — old Home — 1 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx — substrate — 1 visible occurrence(s), 14 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts — substrate — 2 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/events/[eventId]/page.tsx — substrate — 1 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/source/optimize/__tests__/page.financial-access.test.tsx — V4 — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/optimize/page.tsx — V4 — 1 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/source/preview/workspace/ContractAnatomy.tsx — projection — 1 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx — projection — 1 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx — substrate — 7 visible occurrence(s), 35 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx — source_record_id — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx — V4 — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx — projection — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx — source_record_id — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts — projection — 4 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts — V4 — 11 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts — source_record_id — 2 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/contractPerformanceCards.test.tsx — latest loaded — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts — projection — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts — V4 — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts — projection — 3 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts — V4 — 4 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts — V4 — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/source/preview/workspace/buildViewModel.ts — V4 — 5 visible occurrence(s), 5 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/preview/workspace/buildViewModel.ts — projection — 1 visible occurrence(s), 1 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx — V4 — 1 visible occurrence(s), 1 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts — V4 — 1 visible occurrence(s), 3 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts — projection — 5 visible occurrence(s), 7 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts — substrate — 1 visible occurrence(s), 1 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/value/page.tsx — V4 — 1 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/source/workspace/page.tsx — V4 — 2 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/strategic-moves/expert-kernel/dossier/page.tsx — dossier — 8 visible occurrence(s), 50 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/strategic-moves/page.tsx — projection — 1 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/tower/page.tsx — projection — 2 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.

- ...233 additional rows in language-audit.csv

## Next Action

Use inventory.csv to move low-risk archive/delete candidates into archive/legacy-context/<date>/ only after dependency review. Keep physical DB names wrapped behind neutral active context APIs until schema rename is approved.
