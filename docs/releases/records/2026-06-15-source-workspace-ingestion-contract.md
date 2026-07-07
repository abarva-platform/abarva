# 2026-06-15-source-workspace-ingestion-contract — Source Workspace File Contract

## Release ID

`2026-06-15-source-workspace-ingestion-contract`

## Status

`candidate`

## Plain-English Summary

The Source workspace file area now behaves more like a clean document workspace:
files and missing evidence are shown in a compact table, while gate approvals
stay with event/stage approval flows instead of appearing as workspace files.
This makes the workspace easier to understand and keeps evidence handling
separate from human approval decisions.

## Layer Impact

- `global-control-lane`: shared Source workspace behavior and explorer mapping
  for Source events. The center-pane file experience changes from stacked cards
  to a table with file, stage, need, status, owner, and usage columns.
- `client-data-lane`: no data schema, migration, ingestion, parser, or client
  data mutation is included. Existing ingestion/quarantine behavior is validated
  but not changed.

## Client Applicability

- All clients: Source workspace users receive the file-table behavior once this
  build is deployed.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none in this slice.

## Changes Included

- `src/components/workspace-explorer/WorkspaceExplorer.tsx` now filters approval
  items out of workspace file rows and renders a compact file table.
- `src/lib/workspace-explorer/source-adapter-mapping.ts` no longer emits Source
  gate criteria as workspace file items.
- Workspace and adapter tests cover table rendering, stage-specific evidence
  requirements, and approval separation.
- `docs/build/source-workspace-ingestion-contract/README.md` records the test
  plan, state truth standard, and known live-proof gaps.

## QA / Validation

Commands run:

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

Results:

- Workspace/adapter tests: 11 passed.
- Upload/quarantine/parser tests: 17 passed.
- ESLint touched files: passed.
- TypeScript: no touched-file errors. Local full typecheck still reports missing
  optional local dependencies for Azure Document Intelligence and Playwright
  axe packages.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image through the normal
pipeline, and deploy with the next web app revision. No migration or manual
data-plane action is required.

## Rollback Plan

Revert this PR to restore the prior stacked-card workspace list and previous
Source adapter mapping behavior. No data rollback is required.

## Audit Evidence

- PR diff and CI checks.
- `docs/build/source-workspace-ingestion-contract/README.md`.
- Focused Jest and ESLint command output.

## Known Gaps

- This does not implement new parser routing, server-side unzip, or new Azure
  Blob persistence.
- This does not claim signed-in production Azure/browser proof. A live crawl
  with screenshots remains required before declaring the full workspace upload
  flow production-ready.
