# Legacy Context Retirement

Status: PASS

Generated: 2026-07-17T00:00:05.526Z

Scope: local repository audit only. No Azure/Postgres mutation, no tenant promotion, no deploy, and no archive/delete was performed by this script.

## Inventory

- Rows: 3736
- High-risk runtime/user-facing rows: 131
- Actions: archive=2112, keep_internal=813, wrap=677, rename=134

## Replacement Proof

- PASS: v3-inputs:meridian-health — 19 standard v3 files present
- PASS: approved-home-knowledge:meridian-health — approved story blocks and visual specs present
- PASS: v3-inputs:skyharbor-air — 19 standard v3 files present
- PASS: approved-home-knowledge:skyharbor-air — approved story blocks and visual specs present
- PASS: v3-inputs:first-capital — 19 standard v3 files present
- PASS: approved-home-knowledge:first-capital — approved story blocks and visual specs present
- PASS: candidate-invisibility-guard — default runtime requires active pointer; candidate preview is explicit
- PASS: local-runtime-retrieval-proof — local runtime retrieval proof bundle exists

## Active Architecture Proof

- PASS: primary-v3-generation-script-present — package exposes generate:tenant-v3-data
- PASS: primary-v3-audit-script-present — package exposes v3 tenant input audit
- PASS: home-approved-artifact-fallback-present — Home can render approved Claude-derived local artifacts
- PASS: default-reader-active-pointer — default DB reader uses active pointer instead of latest loaded row
- PASS: candidate-preview-explicit — candidate preview requires an intentional preview mode flag; default runtime uses active mode
- PASS: v3-inputs:meridian-health — 19 standard v3 files present
- PASS: approved-home-knowledge:meridian-health — approved story blocks and visual specs present
- PASS: v3-inputs:skyharbor-air — 19 standard v3 files present
- PASS: approved-home-knowledge:skyharbor-air — approved story blocks and visual specs present
- PASS: v3-inputs:first-capital — 19 standard v3 files present
- PASS: approved-home-knowledge:first-capital — approved story blocks and visual specs present
- PASS: candidate-invisibility-guard — default runtime requires active pointer; candidate preview is explicit
- PASS: local-runtime-retrieval-proof — local runtime retrieval proof bundle exists

## Language Audit

- WARN: src/app/(maestro)/admin/_cached-helpers.ts — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/agent-readiness/page.tsx — substrate — 2 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/context-layer/page.tsx — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/customer/page.tsx — substrate — 13 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/data-layer-explorer/__tests__/page-source.test.ts — projection — 2 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/admin/data-layer-explorer/page.tsx — projection — 3 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/data-trust/page.tsx — substrate — 2 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/dossiers/page.tsx — dossier — 23 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/knowledge-preview/page.tsx — context packet — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/segments/[segmentId]/page.tsx — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/setup/cxo-intel/page.tsx — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/admin/setup/page.tsx — substrate — 1 occurrence(s) in internal/admin control surface, not CXO-facing tenant context.
- WARN: src/app/(maestro)/dossier/[threadId]/page.tsx — dossier — 5 visible occurrence(s), 24 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts — V7 — 1 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/(maestro)/home/page.tsx — V6 — 1 occurrence(s) in wrapped internal storage/reader lineage code; not rendered language.
- WARN: src/app/(maestro)/home/page.tsx — V7 — 1 visible occurrence(s), 2 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx — substrate — 1 visible occurrence(s), 14 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/events/[eventId]/page.tsx — dossier — 1 visible occurrence(s), 1 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/(maestro)/source/events/[eventId]/page.tsx — substrate — 3 occurrence(s) in code identifier, import, route name, or non-rendered implementation text.
- WARN: src/app/(maestro)/strategic-moves/expert-kernel/dossier/page.tsx — dossier — 8 visible occurrence(s), 50 total occurrence(s), in active runtime source outside generated CXO/context artifacts.
- WARN: src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts — source_record_id — 2 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/api/chat/agent/route.ts — dossier — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/chat/agent/route.ts — substrate — 5 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/debug/tower-substrate/route.ts — substrate — 2 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/home/know/ask/route.ts — V6 — 10 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/home/know/ask/route.ts — V7 — 6 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/home/summary-snapshot/route.ts — V6 — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/home/summary-snapshot/route.ts — V7 — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts — V7 — 6 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts — dossier — 2 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts — substrate — 3 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/api/intelligence/ask/route.ts — dossier — 2 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/intelligence/ask/route.ts — substrate — 6 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/intelligence/ask/route.ts — source_record_id — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/programs/synthesis/__tests__/route.test.ts — V6 — 9 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/api/programs/synthesis/route.ts — V6 — 7 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/reasoning/_auth.ts — substrate — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/reasoning/audit/route.ts — substrate — 2 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/source/synthesis/__tests__/route.test.ts — V6 — 9 occurrence(s) in test fixture or regression assertion; not runtime-visible.
- WARN: src/app/api/source/synthesis/route.ts — V6 — 7 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/tower/ask/route.ts — V6 — 4 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/tower/initiative-detail/route.ts — substrate — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/v1/agent/attachments/route.ts — V4 — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/v1/moves/board-grade-master-dossier/route.ts — dossier — 21 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/body/route.ts — substrate — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/client-final/route.ts — substrate — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts — substrate — 7 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-comparison-xlsx/route.ts — substrate — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-docx/route.ts — substrate — 2 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.
- WARN: src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-pdf/route.ts — substrate — 1 occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.

- ...114 additional rows in language-audit.csv

## Next Action

Use inventory.csv to move low-risk archive/delete candidates into archive/legacy-context/<date>/ only after dependency review. Keep physical DB names wrapped behind neutral active context APIs until schema rename is approved.
