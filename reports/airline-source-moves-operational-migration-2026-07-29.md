# Airline Source and Moves Operational Migration Inventory

Generated: 2026-07-29T17:22:53.667Z

Tenant: `airline-demo-new`  
Database host: `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com`  
Database name: `abarva_airline_demo_new_knowledge_lab`

## Executive Status

The Knowledge foundation is complete and immutable. This report covers only Source and Moves operational persistence.

Current state:

- Tenant-aware DB selection has been added for the core Source/Moves selectors that already receive tenant context.
- Full operational migration is **not complete** until DB rows, Blob paths, signed-in actions, negative fallback tests, and rollback/restore are proven.
- Source/Moves generated and uploaded file-byte paths still require canonical Airline Blob proof.

## Route Inventory Counts

| Area | Count |
|---|---:|
| Source pages/layouts | 28 |
| Source API routes | 50 |
| Moves pages/layouts | 11 |
| Moves API routes | 37 |

## Static Guard Checks

| Check | File | Found |
|---|---|---:|
| source-events-read-selector | `src/lib/data-plane/read-adapters/sourceEventsReadAdapter.ts` | yes |
| source-events-read-callers | `src/lib/source/queries.ts` | yes |
| source-work-items-read-selector | `src/lib/data-plane/read-adapters/sourcingWorkItemsReadAdapter.ts` | yes |
| source-work-items-write-selector | `src/lib/data-plane/write-adapters/sourcingWorkItemsWriteAdapter.ts` | yes |
| moves-programs-read-selector | `src/lib/data-plane/read-adapters/programsReadAdapter.ts` | yes |
| moves-programs-read-callers | `src/lib/programs/queries.ts` | yes |
| moves-preferences-read-selector | `src/lib/data-plane/read-adapters/strategicMovesPreferencesReadAdapter.ts` | yes |
| moves-attachment-write-selector | `src/lib/data-plane/write-adapters/attachmentsWriteAdapter.ts` | yes |
| moves-attachment-write-caller | `src/lib/programs/attachments/index.ts` | yes |
| object-storage-azure | `src/lib/data-plane/objectStorage.ts` | yes |

## Certification Matrix

| Module | UI action | API | DB host | Schema/table | Blob destination | New plane | Legacy dependency | Proof |
|---|---|---|---|---|---|---|---|---|
| Source | Open Source portfolio and event lists | `src/lib/source/queries.ts` | `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` | source_events | none | tenant-aware DB selector patched | Seed overlay still exists for non-foundation tenants; Airline selector now fails closed from Supabase | source-events-read-selector, source-events-read-callers |
| Source | Create/open sourcing event | `createSourcingEvent in src/lib/source/queries.ts` | `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` | source_events | none | partial | Direct getAzureWriteFluentClient write path still needs runtime DB role/table proof | inventory only |
| Source | Create/list Source work items and Tower-watch items | `src/lib/source/work-items/service.ts` | `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` | sourcing_work_items | none | tenant-aware read/write selector patched | No Supabase fallback for foundation tenant after this patch | source-work-items-read-selector, source-work-items-write-selector |
| Source | Upload artifact/source file | `src/app/api/v1/source/[eventId]/artifacts/upload/route.ts` | `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` | source artifact metadata tables | Airline tenant-scoped Azure Blob path required; route-level proof pending | pending | Storage path and container must be proven by signed-in upload; no old storage fallback may remain for Airline | blob runtime proof pending |
| Source | Generate/retrieve/accept Source artifact | `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/*` | `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` | source artifact/state tables | Airline tenant-scoped Azure Blob path required; route-level proof pending | partially fenced | Known legacy synthesis/fixture routes are fenced; full artifact lifecycle still needs signed-in DB/blob proof | existing Source fence PRs plus this inventory |
| Moves | Open Moves portfolio and Move detail | `src/lib/programs/queries.ts` | `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` | engagements | none | tenant-aware DB selector patched | Explicit Supabase adapter option remains for legacy callers; foundation tenant default is Azure when ctx.clientKey is supplied | moves-programs-read-selector, moves-programs-read-callers |
| Moves | Read Strategic Moves preferences | `src/lib/programs/strategic-moves-preferences.ts` | `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` | tower_user_preferences.default_filters | none | tenant-aware DB selector patched | No Supabase fallback for foundation tenant after this patch | moves-preferences-read-selector |
| Moves | Upload Move evidence/artifact metadata | `src/lib/programs/attachments/index.ts` | `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` | program_attachments | Airline tenant-scoped Azure Blob path required; route-level proof pending | metadata tenant-aware; file-byte proof pending | Storage upload route still needs canonical Airline Blob proof and old-storage-disabled proof | moves-attachment-write-selector, moves-attachment-write-caller |
| Moves | Generate board-grade artifacts | `src/app/api/v1/moves/board-grade-*` | `pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` | artifact/generated-output tables pending route proof | Airline tenant-scoped Azure Blob path required; route-level proof pending | partially fenced | Reference fallback guards exist; operational persistence and generated-file storage still need signed-in proof | existing Moves fence PRs plus this inventory |

## Open Migration Items

- Source: Create/open sourcing event — partial. Direct getAzureWriteFluentClient write path still needs runtime DB role/table proof
- Source: Upload artifact/source file — pending. Storage path and container must be proven by signed-in upload; no old storage fallback may remain for Airline
- Source: Generate/retrieve/accept Source artifact — partially fenced. Known legacy synthesis/fixture routes are fenced; full artifact lifecycle still needs signed-in DB/blob proof
- Moves: Upload Move evidence/artifact metadata — metadata tenant-aware; file-byte proof pending. Storage upload route still needs canonical Airline Blob proof and old-storage-disabled proof
- Moves: Generate board-grade artifacts — partially fenced. Reference fallback guards exist; operational persistence and generated-file storage still need signed-in proof

## Required Next Proof

1. Verify all referenced operational tables exist in the Airline Azure PostgreSQL database.
2. Migrate only required active Airline rows; do not copy retired tenants.
3. Define and prove canonical Airline Blob destinations for Source and Moves file bytes.
4. Execute signed-in Source and Moves workflows and capture DB-side row IDs plus Blob hashes.
5. Run negative proof with Supabase, old Blob credentials, fixtures, and SkyHarbor mappings unavailable.
6. Only after proof, disable old storage writes and remove fallback.
