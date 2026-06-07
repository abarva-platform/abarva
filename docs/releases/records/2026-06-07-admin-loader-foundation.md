# 2026-06-07-admin-loader-foundation — Admin Loader foundation modules

## Release ID
`2026-06-07-admin-loader-foundation`

## Status
`candidate`

## Plain-English Summary
Foundation for the perfected Admin Loader (parallel-built): a shared contract, the Gate 0
blob-preservation service, the Steward deterministic-validation engine, the (Claude-backed)
mapping-proposal service, and the presentational UI components — plus the Gate 0 schema
migration. Backend services are pure/injectable and unit-tested; UI is presentational only.
Not yet wired into the live admin route (that is the next, integration PR).

## Layer Impact
- `internal-admin`: the Admin loader capability (services + UI components).
- `client-data-lane`: Gate 0 migration adds `blob_url`/`blob_object_key`/`blob_container`/
  `byte_size` to `enterprise_context_source_files` so every fact resolves to a preserved
  original (additive, idempotent; no data change).

## Client Applicability
- Internal only (loader internals). Applies to all clients once the route is wired.

## Changes Included
- `src/lib/context-ingestion/loader/contract.ts` (shared types + confidence thresholds)
- `…/loader/preserve-original.ts` (Gate 0: sha256 + Blob staging; injectable BlobWriter)
- `…/loader/steward-validation.ts` (deterministic conflict/realism/orphan/dupe checks + compose)
- `…/loader/mapping-proposal.ts` (any-format → canonical mapping; Anthropic-only model; deterministic fallback)
- `src/components/setup/loader/*` (DropZone, ReviewTable, ClarificationStep, AskStewardDock, LandingZonePanel, UnderstandingProgress, LoaderStatePills)
- `supabase/migrations/20260607170000_loader_gate0_blob_preservation.sql`

## QA / Validation
- **PASS** — `jest` loader suites: 4 suites / 33 tests.
- **PASS** — `tsc --noEmit`: no errors in loader files (3 repo-wide = pre-existing missing optional deps).
- **PASS** — ESLint loader dirs clean.
- `audit:architecture-rules` + `release:check`: see PR CI.

## Rollout Plan
Merge to `main`. No runtime behavior change yet (modules unused until the admin route is wired
in the follow-up PR). Apply the Gate 0 migration via the governed Azure `db:migrate`.

## Rollback Plan
Revert the PR (code) — modules are unreferenced so removal is safe. The migration is additive;
the new columns can remain or be dropped (no data depends on them yet).

## Audit Evidence
PR CI; per-module unit tests; `docs/build/setup-admin-loader/` design + wireframe.

## Known Gaps
- Not wired into the live admin upload route / landing-zone scan endpoint yet (next PR).
- Claude-backed Steward agent reviewer is an injected interface; the live wrapper + the
  Azure-DI parse step are wired in the integration PR. Then pressure-test (DESIGN §9).
