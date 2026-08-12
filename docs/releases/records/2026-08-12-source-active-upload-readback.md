# 2026-08-12-source-active-upload-readback — Source Active Upload Readback

## Release ID

`2026-08-12-source-active-upload-readback`

## Status

`candidate`

## Plain-English Summary

When a Source stage asks the user to upload evidence, the focused step now shows a compact readback after upload. The readback states that the file was stored, whether typed facts were written, whether the parser reported unmapped or rejected inputs, and which downstream surfaces can reread the uploaded source.

## Layer Impact

`global-control-lane`; product layer only. This changes the shared Source workflow UI receipt for existing governed upload and fact-ingest behavior; it does not add a new data model, tenant-specific rule, migration, adapter, or calculation.

## Client Applicability

- All clients: Source events using the shared stage workflow upload component.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/TaskChecklist.tsx`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx --runInBand`
- Pass: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/TaskChecklist.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Pending: live signed-in verification after the repo-owned Azure Container Apps deploy.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. No manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the Source UI/readback PR and redeploy through the repo-owned ACA workflow. No database rollback is required.

## Audit Evidence

To be added after validation: PR URL, merge SHA, deploy run, runtime invariant proof, and live signed-in browser evidence.

## Known Gaps

This is not a full 11-stage Source journey QA pass. It only improves the user-visible readback for the existing upload and fact-ingest path.
