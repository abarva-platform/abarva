# 2026-08-22-move-client-hygiene-and-current-artifact-guard — Move Client Hygiene and Current Artifact Guard

## Release ID

`2026-08-22-move-client-hygiene-and-current-artifact-guard`

## Status

`candidate`

## Plain-English Summary

Tightens the Moves phase-detail experience after a governed build is rejected by quality gates. The page no longer exposes internal proof/test prefixes in visible Move labels, and the File Cabinet no longer mixes older board-ready generated artifacts into the current view when a later same-phase rebuild is quarantined.

## Layer Impact

Layer 4 products only. Moves display and artifact-listing semantics change; no canonical data, tenant input, registry, graph, or data-plane load behavior changes.

## Client Applicability

- All clients: Moves phase-detail display hygiene and generated-artifact current-list filtering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Shared client-safe text scrubbing removes leading proof/test fixture prefixes from visible labels.
- Moves phase-detail screen uses the client-safe Move display name in breadcrumbs, side rail labels, visible phase context, and default decision titles.
- Generated-artifact File Cabinet current-only reads suppress stale same-phase generated artifacts when the newest generated artifact for that phase is quarantined.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' src/lib/__tests__/client-config-canonical.test.ts --runInBand` — pass, 15/15 tests.
- `npx eslint 'src/app/api/v1/programs/[programId]/artifacts/route.ts' 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' src/lib/client-config.ts src/lib/__tests__/client-config-canonical.test.ts src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — pass.
- `npx tsc --noEmit` initially exhausted local Node heap before type reporting; rerun with larger heap before merge.

## Rollout Plan

Merge to main through a PR. The repo-owned ACA main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy because the main workflow updates worker job images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the Moves phase detail no longer shows proof/test prefixes and current generated-artifact listing does not show stale same-phase outputs after a quarantined rebuild.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy the previous behavior. No migration rollback is required.

## Audit Evidence

PR, merge commit, deploy run, runtime invariant proof, focused test output, lint output, and signed-in Moves browser proof.

## Known Gaps

This does not alter underlying Move names already stored in the data plane, does not auto-approve failed quality gates, and does not repair the underlying P3 decision-clarity blocker.
