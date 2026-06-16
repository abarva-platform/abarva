# Source Workspace Ingestion Contract

## Status

Candidate implementation slice, 2026-06-15.

This record covers the Source workspace file-explorer contract: what belongs in
the workspace, how event-specific evidence should be shown, and what must be
tested before calling uploads, parsing, generation, or File Cabinet behavior
production-ready.

## Design Alignment

The workspace should follow the Setup/Admin interaction model without importing
Setup-only implementation tokens:

- one primary job at a time;
- compact, table-first file browsing;
- progressive disclosure for advanced details;
- clear states instead of generic "loaded" language;
- event/stage-specific requirements, not a global cookie-cutter checklist;
- approvals handled by event and stage gates, not by the file workspace.

## Workspace Ownership

Workspace owns:

- evidence files;
- generated artifacts;
- vendor response folders;
- parse/readiness state;
- preview/download;
- lineage;
- missing evidence prompts.

Workspace does not own:

- approval queues;
- gate approval decisions;
- approval checklist management;
- Source setup/admin policy;
- parser configuration governance.

Approval records can be referenced as lineage, but they should not appear as a
file bucket or workspace document row.

## Current Implementation Slice

The Source workspace explorer now:

- filters approval items out of workspace file rows;
- renders the center pane as a compact table with File, Stage, Needed for,
  Status, Owner, and Used by;
- keeps stage-specific missing evidence requirements visible in the same table;
- keeps upload actions on missing requirement rows;
- preserves preview behavior for real documents;
- keeps Source gate criteria out of `buildSourceWorkspaceItems`.

## State Truth Standard

The word "loaded" is not sufficient. A file is only fully usable when the
applicable states are proven:

1. UI accepted the file.
2. Original file persisted to Azure Blob.
3. Source artifact registry row exists with tenant, event, stage, family, and
   version.
4. Sensitive-data guard ran before normal parsing, indexing, or model use.
5. Parser was selected by file type and evidence family.
6. Text, tables, and facts were extracted with source citations where
   applicable.
7. Evidence mapped to the current event's archetype and stage requirements.
8. Restricted or quarantined items were excluded from preview, generation,
   search, and Claude/OpenAI context.
9. Workspace table reflects the correct state.
10. File Cabinet or workspace preview opens the artifact or a safe preview.
11. Generation uses only eligible evidence and records lineage.

## Test Matrix

| Area | Required Proof | Status In This Slice |
| --- | --- | --- |
| Workspace table | File table renders with required columns | Covered by RTL/Jest |
| Stage needs | Canonical stage-specific evidence requirements render | Covered by RTL/Jest |
| Approval separation | Gate approvals are not workspace file rows | Covered by RTL/Jest and adapter test |
| Source adapter | Gate criterion states are not emitted as file items | Covered by unit test |
| Upload MIME/family | Allowed formats and family inference are stable | Existing unit tests pass |
| Defender/quarantine | Malicious blobs quarantine before download/parse | Existing ingestion unit tests pass |
| Parser handoff | PDF/document parser output passes to pipeline | Existing ingestion unit tests pass |
| Parser failure | Parse failure does not produce usable evidence | Existing ingestion unit tests pass |
| Live Azure Blob | Blob + registry + UI state verified in production/lab | Not run in this slice |
| Live browser crawl | Signed-in app click path/screenshots | Not run in this slice |

## Required End-To-End Tests

Before production-ready sign-off, run a signed-in Source workspace crawl:

1. Open Source portfolio for the active tenant.
2. Open an event.
3. Open the workspace from the event detail page.
4. Confirm the workspace table shows only event-relevant files.
5. Confirm approval/gate items are absent from file buckets.
6. Upload safe CSV/XLSX/PDF/DOCX/PPTX fixtures.
7. Verify original files are staged in Azure Blob.
8. Verify registry rows include tenant, event, stage, family, version, state, and
   source path.
9. Upload synthetic sensitive fixtures with fake SSN, MRN/DOB, and bank account
   patterns.
10. Verify sensitive files are quarantined before normal parse, preview, search,
    generation, or model use.
11. Generate an artifact only from eligible evidence.
12. Verify generated output is saved to Blob, visible in the workspace/File
    Cabinet, and has lineage to allowed sources only.

## Commands Run

```bash
npx jest src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx \
  src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts --runInBand

npx jest src/lib/source/artifact-registry/__tests__/upload-contract.test.ts \
  src/lib/ingestion/__tests__/azure-landing-zone-consumer.test.ts --runInBand

npx eslint src/components/workspace-explorer/WorkspaceExplorer.tsx \
  src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx \
  src/lib/workspace-explorer/source-adapter-mapping.ts \
  src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts

npx tsc --noEmit --pretty false
```

## Validation Notes

- Focused workspace and adapter tests passed.
- Existing upload-contract and ingestion quarantine/parser tests passed.
- ESLint for touched files passed.
- Full local typecheck still reports missing local optional dependencies:
  `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`. No touched
  file type errors remain.

## Known Gaps

- This slice does not implement new server-side unzip, new parser routing, or
  new Blob persistence behavior.
- This slice does not claim signed-in production Azure proof.
- The full browser crawl with screenshots still needs a valid signed-in session
  and live Azure verification.
