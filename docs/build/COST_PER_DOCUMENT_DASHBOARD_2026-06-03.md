# Cost Per Document Dashboard Evidence Packet

Date: 2026-06-03

Backlog: T189 — cost-per-document dashboard.

## What Changed

The customer-admin read model now derives document-level economics from the
tenant-scoped `ai_egress_audit.request_metadata` usage spine. The existing
`/admin/customer` Cost and Usage panel now shows document count, metered
documents, parse cost, chat cost, total cost, cache-hit rate, and the most
expensive document-attributed rows when metadata is available.

## Data Contract

The dashboard reads recent tenant-scoped AI egress rows and looks for these
metadata fields:

- Document identity: `document_key`, `documentKey`, `document_id`,
  `source_document_id`, `file_manifest_id`, `parse_cache_key`, `artifact_code`,
  or `sha256`.
- Display label: `document_label`, `source_label`, `original_filename`,
  `filename`, or `artifact_code`.
- Token usage: `input_tokens`, `output_tokens`, `prompt_tokens`,
  `completion_tokens`, or camelCase equivalents.
- Cost usage: `cost_usd`, `estimated_cost_usd`, `parse_cost_usd`,
  `document_parse_cost_usd`, or `extraction_cost_usd`.
- Cache telemetry: `cache_hit`, `prompt_cache_hit`,
  `cache_read_input_tokens`, or `cache_creation_input_tokens`.

Nested `usage` metadata is supported.

## Files

- `src/lib/admin/customer-admin-read-model.ts`
- `src/app/(maestro)/admin/customer/page.tsx`
- `src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts`

## Local QA

- `npx jest src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts --runInBand` — passed.
- `npx eslint 'src/app/(maestro)/admin/customer/page.tsx' src/lib/admin/customer-admin-read-model.ts src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed,
  including the Pilot Data Loader Gate.
- `npx tsc --noEmit --pretty false` — local run blocked by the existing shared
  `node_modules` missing `@axe-core/playwright` for
  `tests/accessibility/public-axe.spec.ts`; no T189-specific TypeScript error
  surfaced before that dependency-resolution failure.

## Known Boundaries

- This slice does not add a billing table or migration.
- Parse cost appears only when parser/upload code emits cost metadata into the
  egress audit spine.
- Weekly client-facing reports and hard budget alerts remain follow-on work.
