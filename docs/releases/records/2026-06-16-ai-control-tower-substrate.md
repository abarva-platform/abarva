# 2026-06-16-ai-control-tower-substrate — AI Control Tower Substrate

## Release ID

`2026-06-16-ai-control-tower-substrate`

## Status

`candidate`

## Plain-English Summary

Adds the generic data substrate for AI Control Tower monthly refreshes. The schema is client-scoped and reusable across First Capital, Meridian, SkyHarbor, Lakeshore, Apex, and future clients. It supports source refresh runs, AI initiatives, tool usage, persona productivity, DORA before/after metrics, embedded agent outcomes, benefit realization, spend contracts, risks, generated or accepted actions, evidence, context facts, relationships, and Atlas context packs.

Actions are output-side objects. The client template captures source measurements, evidence, risks, spend, renewals, and any optional prior human decisions; AbarVa derives proposed actions from those facts and persists the recommendation/decision trail for audit.

## Layer Impact

- `client-data-lane`: Adds additive Postgres tables and views for AI Control Tower persistence with `client_id` and `refresh_run_id` scoping.
- `global-control-lane`: Adds TypeScript contracts and pure context-pack helpers that define how Atlas or a dashboard should interpret AI Control Tower data.

## Client Applicability

- All clients: Schema and contracts are generic.
- Specific clients: First Capital, Meridian, SkyHarbor, Lakeshore, and Apex can load the same template shape once the loader is wired.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Product UI binding remains future work.

## Changes Included

- Migration: `supabase/migrations/20260616170000_ai_control_tower_substrate.sql`
- Contracts: `src/lib/ai-control-tower/contracts.ts`
- Atlas context helper: `src/lib/ai-control-tower/atlas-context-pack.ts`
- Parse/load plan helper: `src/lib/ai-control-tower/load-plan.ts`
- Azure/Postgres persistence helper: `src/lib/ai-control-tower/persistence.ts`
- Tower ingest registry entry: `src/lib/tower/ingest/ai-control-tower/index.ts`
- Tower ingest registry update: `src/lib/tower/ingest/registry.ts`
- Tests: `src/lib/ai-control-tower/__tests__/contracts.test.ts`
- Tests: `src/lib/ai-control-tower/__tests__/atlas-context-pack.test.ts`
- Tests: `src/lib/ai-control-tower/__tests__/load-plan.test.ts`
- Tests: `src/lib/ai-control-tower/__tests__/persistence.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/ai-control-tower/__tests__/contracts.test.ts src/lib/ai-control-tower/__tests__/atlas-context-pack.test.ts src/lib/ai-control-tower/__tests__/load-plan.test.ts src/lib/ai-control-tower/__tests__/persistence.test.ts --runInBand`
  - Result: 4 suites passed, 11 tests passed.
  - Note: Jest emitted existing duplicate manual mock warnings unrelated to this slice.
- `npx tsc --noEmit --pretty false --skipLibCheck`
  - Result: failed only on pre-existing `vendorSpendRows` fixture errors in `src/lib/intelligence-v3/__tests__/sentinel-intel-context.test.ts` and `src/lib/pilot-dashboard/__tests__/aggregates.test.ts`; no AI Control Tower errors remained.
- `git diff --check -- supabase/migrations/20260616170000_ai_control_tower_substrate.sql src/lib/ai-control-tower/contracts.ts src/lib/ai-control-tower/atlas-context-pack.ts src/lib/ai-control-tower/load-plan.ts src/lib/ai-control-tower/persistence.ts src/lib/ai-control-tower/__tests__/contracts.test.ts src/lib/ai-control-tower/__tests__/atlas-context-pack.test.ts src/lib/ai-control-tower/__tests__/load-plan.test.ts src/lib/ai-control-tower/__tests__/persistence.test.ts src/lib/tower/ingest/ai-control-tower/index.ts src/lib/tower/ingest/registry.ts docs/releases/records/2026-06-16-ai-control-tower-substrate.md`
  - Result: passed.

## Rollout Plan

Merge to main, run release checks, apply the additive Postgres migration through the controlled Azure/Postgres migration path, then wire the AI Control Tower workbook parser/loader to commit into these tables. Product UI and Atlas runtime calls should consume the context-pack contract only after a committed client refresh exists.

## Rollback Plan

Before data is loaded, rollback can drop the new `ai_control_*` tables, enum types, and view. After data is loaded, rollback should first export affected client refresh receipts and context facts, then drop or disable consumers before dropping tables.

## Audit Evidence

- Migration file listed above.
- Focused Jest command and result listed above.
- Release record in this file.

## Context Ingestion Evidence

- Local artifact generated: migration, contracts, parse/load plan, Azure/Postgres persistence helper, Tower ingest registry entry, and tests created locally.
- Local parse/preflight: focused Jest contract/load-plan tests passed; SQL/code whitespace check passed.
- Product loader/API acceptance: not yet implemented in this slice.
- Azure Blob/object storage staging: not performed in this slice.
- Queue/private worker handoff: not performed in this slice.
- Parser extraction with source citations: canonical JSON package maps to substrate load plan with source keys, context facts, relationships, evidence, system-derived action recommendations, and concrete table-column commit rows. XLSX parsing and API-route acceptance remain pending.
- Review/approval queue: schema supports review-required evidence/actions; queue wiring not yet implemented.
- Client data-plane commit: migration file created locally; not applied to Azure/Postgres in this slice.
- Embedding/search refresh: not performed in this slice.
- Live signed-in retrieval or answer QA: not performed in this slice.

Path state: local schema/contract/test candidate only; not a live client load and not retrieval-proven.

## Known Gaps

- Generic XLSX parser/validator/committer still needs to be wired to this substrate.
- Actions are derived from loaded metrics, evidence, risks, renewals, and owner gaps. An optional `Action Decision Log` sheet can import existing human decisions, but the workbook should not require users to pre-author the Actions lens.
- Atlas runtime endpoint still needs to call the AI Control Tower context-pack builder against live rows.
- Azure/Postgres migration application and retrieval proof remain pending.
