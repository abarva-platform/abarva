# 2026-08-23 Moves Section Object Renderer Cleanup

## Release ID

`2026-08-23-moves-section-object-renderer-cleanup`

## Status

`candidate`

## Plain-English Summary

Moves generated deliverables can be re-rendered from persisted structured
artifact state. This release hardens that renderer so a malformed section body
that contains a serialized section object is displayed as the nested prose body,
not as raw object keys or JSON fencing in client-facing DOCX, PPTX, PDF, or HTML
exports.

## Layer Impact

- **Layer 4 — Products:** Affected lane: `global-control-lane`. Changes Moves
  artifact rendering only. No source intake, adapter, canonical model,
  projection, registry, migration, routing, tenant data, or runtime flag changes.

## Client Applicability

- All clients: Applies to Moves generated artifact exports.
- Specific clients: None hard-coded.
- Internal only: No. This protects client-facing generated artifacts.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Normalizes generated section Markdown before rendering it to DOCX, PPTX, PDF,
  or HTML.
- Replaces JSON section-object bodies with their nested `bodyMarkdown` value when
  that structured value exists.
- Keeps existing duplicate-section-heading suppression behavior.
- Adds renderer regression tests for malformed section-object bodies.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand`.
- PASS: `npx eslint src/lib/deliverables/orchestrator/renderers.tsx src/lib/deliverables/orchestrator/__tests__/renderers.test.ts`.
- PASS: `git diff --check`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- PASS: `npm run release:check`.
- Pending: PR checks.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow may
build and deploy the resulting image. Re-run the existing Moves artifact
cleanliness dry-run against the deployed image to verify the current artifacts no
longer show section-object blocker findings.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None beyond the repo-owned main deploy workflow.
- Approved image digest: To be captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming the runtime is
  current.
- Worker image invariant: Covered by the repo-owned deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: No. The relevant proof is artifact export scan
  output from the scoped Moves dry-run.

## Rollback Plan

Revert the release commit and redeploy through the repo-owned main workflow.
Persisted artifact state is unchanged by this release.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6739.
- Local validation: focused renderer suite above.
- Runtime/operator evidence: follow-up `moves-artifact-cleanliness-report.json`
  from the deployed image.

## Known Gaps

- This does not alter stored artifact metadata. It changes how persisted
  structured artifact state is rendered into export formats.
