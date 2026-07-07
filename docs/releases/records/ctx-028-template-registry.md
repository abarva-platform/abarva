# ctx-028-template-registry — Canonical IT System Landscape, Vendor, and Infrastructure templates

## Release ID

`2026-06-16-ctx-028-template-registry`

## Status

`candidate`

## Plain-English Summary

Adds three canonical context ingestion templates to the template registry: IT System Landscape (Dim 3, 12 required fields including domain_segment, business_function, criticality, and cmdb_ci_id), Vendor & Contract (Dim 11, 12 required fields including benchmark_present and systems_covered), and Infrastructure & Data Centre (9 required fields). Each template carries a full enumValues map so the ingestion UI can render validated dropdowns for classification fields (domain_segment, business_function, criticality, vendor_category, auto_renew, hosting environment, tier). Also adds `it_landscape` and `infrastructure_dc` to the ContextDimension union type.

## Layer Impact

`global-control-lane` — TypeScript/library layer only. No DB schema, no routes, no UI changed. The template registry is a static in-memory config; this extends it additively. No breaking changes to existing templates.

## Client Applicability

All clients — template registry is global. The new templates become available to any tenant operator using the CSV upload admin route. No data is written by this change alone.

## Changes Included

- `src/lib/context-ingestion/template-registry.ts` — 3 new templates added via push, `enumValues` field added to `ContextTemplateDefinition`
- `src/lib/context-ingestion/types.ts` — `it_landscape` and `infrastructure_dc` added to `ContextDimension` union
- `src/lib/context-ingestion/csv-upload-connector.ts` — `SEGMENT_BY_DIMENSION` map extended for new dimension keys

## QA / Validation

Typecheck passed (`npx tsc --noEmit` — clean, zero errors). ESLint passed. `node scripts/release-check.mjs --base origin/main --head HEAD` passed.

## Rollout Plan

Merge to main; Vercel/ACA deploys pick up the change automatically. No migration, no seed, no flag needed. The new templates are immediately available in the CSV upload admin route template selector.

## Rollback Plan

Revert the commit or remove the three template entries from `NORTHSTAR_CONTEXT_TEMPLATES` and restore `ContextDimension`. Risk is very low — additive code change only.

## Audit Evidence

PR #3560 on github.com/abarva-platform/abarva. CI green (all checks passing except release record which this record resolves).

## Known Gaps

The new templates are defined but not yet wired to auto-validation in the bulk upload UI — operators will see them in the template selector but field-level validation won't fire until the validation engine PR (#3561) is also merged.
