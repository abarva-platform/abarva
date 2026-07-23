# 2026-07-23-source-session-evidence-capture — Source session evidence capture

## Release ID

`2026-07-23-source-session-evidence-capture`

## Status

`deployed-signed-in-proven`

## Plain-English Summary

Source Files now gives sourcing teams a dedicated place to capture meeting notes and workshop output. The new panel posts those uploads through the existing governed Source upload route with explicit artifact family, kind, stage, and classification metadata, so the files enter the Azure/Postgres-backed evidence layer as session evidence rather than anonymous generic uploads.

The upload route also returns the existing substrate-sync receipt in its JSON response. The UI can now tell the user whether the file was parsed, linked to evidence/gates, or only registered because a persisted event row or parser path was unavailable.

## Layer Impact

- Release lane: `global-control-lane`.
- Source Files workspace: adds a compact session-evidence capture panel above the existing artifact lifecycle matrix.
- Source upload API: returns the already-computed upload-to-substrate sync receipt; no new write behavior is introduced by that response field.
- Source evidence data layer: uploads continue through the existing Blob/Postgres registry and first-mile parser. No schema or migration change.
- aVa readiness: notes and workshop outputs are classified into the families the parser already uses for `source_meeting_outcomes`; this slice does not change chat retrieval or enterprise-context promotion.

## Client Applicability

- All clients: yes, for Source event Files workspaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added by this slice.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: adds the dedicated Meeting Notes / Workshop Output capture panel and posts explicit governed metadata to the Source upload API.
- `src/app/api/v1/source/[eventId]/artifacts/upload/route.ts`: includes `substrateSync` in the successful upload response.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`: proves the Files workspace posts workshop/session evidence with explicit stage, family, kind, and classification fields.
- `src/lib/source/artifact-registry/__tests__/upload-contract.test.ts`: proves explicit `workshop_output` request metadata overrides generic filename/stage inference.
- `docs/backlog/source-product-backlog.md`: records `SOURCE-INGEST-001b` scope and follow-on gaps.

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand` — pass, 15/15. Same pre-existing duplicate Jest manual mock warnings observed.
- `npm test -- --runTestsByPath src/lib/source/artifact-registry/__tests__/upload-contract.test.ts --runInBand` — pass, 4/4. Same pre-existing duplicate Jest manual mock warnings observed.
- `npm test -- --runTestsByPath src/lib/source/artifact-registry/__tests__/upload-text-extraction.test.ts 'src/app/api/v1/source/[eventId]/artifacts/upload/__tests__/route.test.ts' src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/lib/source/artifact-registry/__tests__/upload-contract.test.ts --runInBand` — pass on 2026-07-23, 34/34 across the combined ingest regression set. Same pre-existing duplicate Jest manual mock warnings observed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx 'src/app/api/v1/source/[eventId]/artifacts/upload/route.ts' src/lib/source/artifact-registry/__tests__/upload-contract.test.ts` — pass.
- `npm run release:check -- --base origin/main --head HEAD` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — blocked by pre-existing missing optional Home graph packages in unrelated files: `@xyflow/react` and `@dagrejs/dagre`.

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. After deploy, verify the ACA runtime invariant and complete signed-in Source Files workspace proof.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: later independently verified production revision
  `ca-abarva-web-lab-eastus--me89b7e4d`, image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:24e692b4213213fede4a7921ffe8a53d3a1b9215989c0f81bb2cd308b3ff5185`,
  tag `main-e89b7e4d`, contains PR #5434.
- ACA runtime invariant: passed independently on 2026-07-23 for the superseding
  production revision above; web and worker images matched and 100% traffic was on
  that revision.
- Worker image invariant: no worker image changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Files workspace should show the session-evidence capture panel. A real production upload is optional and should use only safe test data.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. That removes the dedicated Files capture panel and the upload response receipt field. Uploaded artifacts remain durable registry rows; no migration rollback or data cleanup is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5434.
- Merge SHA: `8ac1adb5272208d9689678aec90600425344df15`.
- ACA deploy run / digest: ACA main run `29982980000` succeeded for the merge SHA;
  later production revision `ca-abarva-web-lab-eastus--me89b7e4d` was independently
  invariant-proven with digest
  `sha256:24e692b4213213fede4a7921ffe8a53d3a1b9215989c0f81bb2cd308b3ff5185`.
- Signed-in browser proof: non-mutating Files workspace proof captured in
  `audit-artifacts/source-ingest-files-workspace-live-proof-20260723/ui-proof-summary.json`;
  it confirms the Meeting Notes and Workshop Output capture lanes and honest
  Azure/Postgres persistence copy render on `app.abarva.ai`.

## Known Gaps

- No async parse worker or backfill job is added.
- No OCR/transcription exists for image/audio/video uploads.
- No vector indexing or enterprise-context promotion job is added; parsed Source evidence remains in the existing Source evidence tables until a governed context promotion slice is built.
