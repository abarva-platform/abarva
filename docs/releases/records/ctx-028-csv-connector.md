# ctx-028-csv-connector — Classification fields written on CSV upload; NEEDS_CLASSIFICATION routing

## Release ID

`2026-06-16-ctx-028-csv-connector`

## Status

`candidate`

## Plain-English Summary

Updates the CSV upload connector so that when operators upload IT system landscape or vendor CSV files, the domain_segment, business_function, and criticality columns are written as first-class Postgres columns (not buried in the JSONB payload). If domain_segment is missing from the uploaded CSV, the connector calls the new inferDomainSegment() auto-infer rule (vendor-name pattern matching) to fill it at AUTO_INFERRED confidence. Records where classification cannot be inferred are routed to lifecycle_state='review' with classification_source='NEEDS_CLASSIFICATION', making them visible in the new Setup > Triage Queue (/admin/context-layer/triage). The API response now includes needsClassification and autoInferred counts, with a nudge message pointing operators to the triage queue when any records need classification.

## Layer Impact

`global-control-lane` — API route layer (`/api/admin/context-layer/csv-upload`) and library layer (`src/lib/context-ingestion/csv-upload-connector.ts`). No schema change in this PR (schema is in #3559). No UI change. The connector writes to new DB columns that must exist before this is live — merge #3559 first.

## Client Applicability

All clients — the CSV upload connector is global. Only affects the Admin CSV upload flow (operator-only route). No end-user or Sentinel-facing change.

## Changes Included

- `src/lib/context-ingestion/csv-upload-connector.ts` — classification resolution logic, DB write for domain_segment/business_function/criticality/classification_source, lifecycle_state='review' for NEEDS_CLASSIFICATION
- `src/app/api/admin/context-layer/csv-upload/route.ts` — response includes needsClassification, autoInferred counts and triage nudge message

## QA / Validation

Typecheck passed (`npx tsc --noEmit` — clean). `node scripts/release-check.mjs --base origin/main --head HEAD` passed. Context ingestion evidence: Not applicable for this PR — connector logic change only, no actual data load performed.

## Rollout Plan

Merge #3559 (schema migration) first, then merge this PR. The new columns must exist before the connector can write to them. No flag needed — the change is transparent to existing CSV uploads.

## Rollback Plan

Revert the commit. The DB columns (from #3559) remain but stop being written; they default to NULL / 'OPERATOR_CONFIRMED'. Existing records unaffected. Zero data loss.

## Audit Evidence

PR #3562 on github.com/abarva-platform/abarva. Typecheck clean. Release check passed.

## Context Ingestion Evidence

Not applicable — this PR modifies the ingestion connector logic but does not itself perform any data load. Data loads using this connector will produce per-load receipts after this is live.

## Known Gaps

The Lighthouse CI budget check failed on this PR due to diff noise from the parent codex/ai-control-tower-substrate branch (GenerateDeliverableButton.tsx and program generate route changes unrelated to this PR's change). The csv-upload-connector.ts and route.ts changes themselves add no frontend bundle weight.
