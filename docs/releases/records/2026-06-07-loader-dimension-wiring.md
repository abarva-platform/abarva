# 2026-06-07-loader-dimension-wiring — Wire deepened landscape dimensions into the loader

## Release ID

`2026-06-07-loader-dimension-wiring`

## Status

`candidate`

## Plain-English Summary

Wires the enterprise technology-landscape model (PR #3282) into the loader's
runtime types so the intelligent mapper and the governed commit path can target
the deeper estate model:

- Adds two **new canonical dimensions** — `infrastructure_estate` (the L5 layer
  the model added: compute / virtualization / storage / network / datacenter /
  cloud account) and `business_capability` (the L1 anchor).
- **Deepens the application, data-analytics, and integration field catalogs** —
  applications now carry deployment model, architecture, hosting, lifecycle, and
  compliance scope; data/analytics distinguishes warehouse / lake / mart / cube /
  BI / ETL with engine + host; integration carries the pattern taxonomy
  (HL7/FHIR/EDI/API/event/batch) + middleware.
- Registers two **NorthStar templates** (`infrastructure-estate`,
  `business-capability-map`) so the new dimensions resolve to a template on
  commit, and maps them through `LOADER_DIMENSION_TO_CONTEXT` →
  `ContextDimension` → segment key.

No database migration is required: `ContextDimension` is a TypeScript union with
no DB enum/check constraint, and the dimension is carried in JSONB, not a
constrained column.

## Layer Impact

- **global-control-lane**: extends shared loader types, the mapper's field
  catalog, the template registry, and the commit-adapter dimension map. Additive
  — existing dimensions and templates are unchanged.

## Client Applicability

- All clients: Yes — any tenant loading infrastructure/capability artifacts can
  now have them mapped and committed. Existing loads are unaffected (additive).
- Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/types.ts` — `ContextDimension` += `infrastructure_estate`, `business_capability`.
- `src/lib/context-ingestion/loader/contract.ts` — `LoaderDimension` + `LOADER_DIMENSIONS` += the two dimensions.
- `src/lib/context-ingestion/loader/mapping-proposal.ts` — deepened `FIELD_CATALOG` + the two new dimension field lists.
- `src/lib/context-ingestion/template-registry.ts` — two NorthStar templates.
- `src/lib/context-ingestion/loader/commit-adapter.ts` — `LOADER_DIMENSION_TO_CONTEXT` mappings.
- `src/lib/context-ingestion/csv-upload-connector.ts` — segment-key mapping for the new context dimensions.
- `src/components/setup/loader/ReviewTable.tsx` — display labels for the new dimensions.

## QA / Validation

**Result: pass.**

- `jest` loader + context-ingestion: **22 suites / 131 tests pass**, including the
  commit-adapter test that asserts every non-`unknown` loader dimension maps to a
  `ContextDimension` and resolves to a registered template — so the two new
  dimensions resolve end-to-end.
- `tsc --noEmit`: 0 errors in any changed file (the exhaustive
  `Record<ContextDimension>` / `Record<LoaderDimension>` maps were all updated;
  the only remaining project errors are pre-existing `@azure-rest` / `@axe-core`
  install artifacts already on green `main`).
- `eslint`: clean on all changed files.

## Rollout Plan

Merge to `main`; ships with the normal control-lane deploy. No migration to
apply. The loader immediately proposes/commits the new dimensions once deployed.

## Rollback Plan

Revert the PR. Purely additive type/registry changes; reverting removes the two
dimensions and restores the prior field catalogs with no data impact (no rows
reference the new dimensions until something is loaded under them).

## Audit Evidence

- PR URL + CI (typecheck, jest, release:check).
- Test output: 131 passing, including dimension→template resolution.

## Known Gaps

- The deepened field catalog improves mapping *proposals*; the governed CSV
  connector still commits via the template's required/optional fields, so very
  rich attributes (e.g. every infra sub-field) land as chunk text unless the
  template's field set is expanded — a follow-up if per-attribute structured
  facts are needed for infra/capability.
- Reconciliation (cross-artifact identity merge from the model §4) is not yet
  implemented; this PR only adds the target dimensions.
