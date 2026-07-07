# 2026-06-10-source-file-cabinet — Source File Cabinet / Artifact Vault

## Release ID

`2026-06-10-source-file-cabinet`

## Status

`candidate`

## Plain-English Summary

Implements the Source File Cabinet / Artifact Vault: every artifact tied to a Source event
(generated deliverables, uploaded evidence, templates, session artifacts, approval packets)
is stored durably in **Azure Blob**, registered in **Postgres** with full metadata, versioned
(regeneration never overwrites), and accessible through a per-event **File Cabinet** UI with
durable download links. This closes the "artifact only exists in Downloads" gap.

## Layer Impact

- `client-data-lane`: new control-plane table `source_artifacts` (migration
  `20260610203000_source_artifacts.sql`) with RLS (service_role all; authenticated read by
  `tenant_key`). Artifact bytes live in the existing Azure Blob object store.
- `global-control-lane`: file-cabinet library (blob-store, repository, persist service),
  two tenant-scoped API routes (list + Blob-backed download), and a File Cabinet UI panel +
  page under `/source/events/{eventId}/file-cabinet`.

## Client Applicability

- All clients: yes — any tenant's Source events get a durable, versioned artifact vault.
  Listing + download are tenant-scoped (client_id + tenant_key); blob paths are tenant-keyed.

## Changes Included

- `supabase/migrations/20260610203000_source_artifacts.sql`
- `src/lib/source/file-cabinet/{types,blob-store,repository,service,index}.ts`
- `src/app/api/v1/source/events/[eventId]/artifacts/route.ts` (list)
- `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts` (Blob-backed download)
- `src/components/source/FileCabinetPanel.tsx` + `src/app/(maestro)/source/events/[eventId]/file-cabinet/page.tsx`
- Tests: file-cabinet (paths + versioning), repository, list route, download route (15 tests)
- `docs/source/SOURCE_FILE_CABINET_REPORT.html`

## QA / Validation

- `jest src/lib/source/file-cabinet src/app/api/v1/source` → 15/15 pass.
- `tsc --noEmit` clean (scoped) · `eslint` clean · `release:check` pass · `audit:architecture-rules` 0 violations.
- Durable storage (Azure Blob upload + canonical paths), versioning (current/superseded, no
  overwrite), and tenant isolation are unit-proven with injected Blob/DB fakes.

## Rollout Plan

Squash-merge to main → apply the migration to the control DB (migrate job in the VNet) →
ship on the next web image roll. The list route degrades safely if the table is absent
(read throws → 500), so the migration must be applied before/with the image roll.

## Rollback Plan

Revert the PR (removes routes + UI + lib). The `source_artifacts` table may remain (harmless)
or be dropped. No other data/schema unwinds.

## Known Gaps

- This PR builds the vault + UI + durable persistence service. Wiring the deliverable
  generator to call `persistSourceArtifact` automatically (so generated RFP/pricing/SLA
  packages land in the cabinet) is the immediate follow-up, along with upload-evidence,
  session, and approval-packet write paths and source-register/context-trace deep links.
- Preview (in-browser) is via download for now; an inline HTML preview is a follow-up.

## Audit Evidence

Tests above; design report `docs/source/SOURCE_FILE_CABINET_REPORT.html`; migration file.
