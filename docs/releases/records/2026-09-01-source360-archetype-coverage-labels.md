# 2026-09-01-source360-archetype-coverage-labels — Source 360 Archetype Coverage Labels

## Release ID

`2026-09-01-source360-archetype-coverage-labels`

## Status

`candidate`

## Plain-English Summary

Source 360 now distinguishes unclassified contract-register headers from classified contract-depth rows in the vendor archetype view. The change keeps placeholder categories out of executive charts while making the displayed coverage language clearer.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates Source 360 presentation copy only. No schema, ingestion, canonical model, tenant routing, or calculation behavior changes.

## Client Applicability

- All clients: Source 360 workspace users who can access the executive workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source 360 vendor archetype chart legend labels.
- Source 360 vendor archetype table coverage note.

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `git diff --check`

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Verified by the main deploy workflow.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before calling the product change live-proven.

## Rollback Plan

Revert the presentation-copy commit and redeploy through the same repo-owned Azure Container Apps workflow.

## Audit Evidence

- Pull request, CI checks, and ACA deploy workflow run after merge.
- Focused Source 360 unit and browser-harness tests listed above.

## Known Gaps

Live signed-in visual proof is still required after deployment.
