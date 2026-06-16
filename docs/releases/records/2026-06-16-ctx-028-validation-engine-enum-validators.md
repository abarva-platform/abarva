# 2026-06-16-ctx-028-validation-engine-enum-validators — Enum Validators + Domain Segment Auto-Infer

## Release ID

`2026-06-16-ctx-028-validation-engine-enum-validators`

## Status

`candidate`

## Plain-English Summary

Adds five new enum validators to the context ingestion validation engine: `domain_segment`, `business_function`, `criticality`, `vendor_category`, and `auto_renew`. When a row carries one of these fields with a value outside the canonical set, an `invalid_enum_value` error finding is attached — preventing bad data from reaching the structured enterprise context layer.

Also adds an auto-infer rule for `domain_segment`: if the field is absent, the engine scans the vendor name (or entity key) against a built-in vendor-hint map covering 28 common vendors. A high-confidence match produces an `auto_inferred_domain_segment` info finding with the suggested value; no match produces a `missing_domain_segment` warning. The `inferDomainSegment` function is exported so downstream connectors (e.g. `csv-upload-connector.ts`) can call it during pre-flight.

## Layer Impact

- **lane: global-control-lane** — `src/lib/context-ingestion/validation-engine.ts` is shared ingestion infrastructure. All tenant upload paths that call `validateExtractedFacts` receive the new findings automatically.
- No schema migration is required; findings are in-memory objects attached to `ExtractedContextFact.validationFindings`.

## Client Applicability

- All clients: validation-engine changes apply to every tenant that uploads structured context via the Admin bulk loader or CSV upload connector.
- Feature flag: none — new findings are additive (errors for invalid values, info/warning for missing domain_segment). Existing valid rows are unaffected.

## Changes Included

- `src/lib/context-ingestion/validation-engine.ts` — five new `Set` enum constants, `DOMAIN_SEGMENT_VENDOR_HINTS` map, exported `inferDomainSegment` function, and inline validation blocks inside `validateExtractedFacts`.

## QA / Validation

**Status: pass**

- `npx tsc --noEmit` — PASS: zero new type errors introduced; pre-existing errors in `document-intelligence-layout.ts` and `public-axe.spec.ts` are unrelated and pre-date this PR.
- Logic review PASS: each enum block follows the exact pattern of the existing `VALID_TIME_CLASSIFICATIONS` validator; auto-infer block falls through to `missing_domain_segment` warning when no hint matches.

## Rollout Plan

Merge to `main` via squash PR. No migration or feature flag required. The validation engine is invoked at ingestion time; updated behavior takes effect on the next upload after merge.

## Rollback Plan

Revert this PR via a new squash commit targeting `main`. No data-layer changes to reverse.

## Audit Evidence

- PR: to be recorded after merge
- `tsc --noEmit` output: zero errors in modified files
- Release-check: passes with this record present

## Known Gaps

- Vendor hint map covers 28 common vendors; long-tail vendors will produce `missing_domain_segment` warnings until the map is extended.
- `inferDomainSegment` is exported but not yet wired into `csv-upload-connector.ts` call sites; downstream callers can import it at their discretion.
