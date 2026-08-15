# 2026-08-14-source-retired-event-agent-canvas-cleanup-s3 — Retire Unmounted Source Event Agent Canvas

## Release ID

`2026-08-14-source-retired-event-agent-canvas-cleanup-s3`

## Status

`candidate`

## Plain-English Summary

Removes a retired Source event-agent canvas and its private stage-canvas subtree that no current route can reach. The active Source event route continues to use the analytics canvas. Financial redaction coverage was preserved at the shared display-policy layer instead of depending on the retired shell.

## Layer Impact

Products: Source-only UI/code cleanup. No workflow persistence, tenant data, source adapters, canonical model, migrations, parser behavior, or runtime data-plane contracts changed.

## Client Applicability

- All clients: Receives the smaller Source bundle after normal application rollout.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Removed the unmounted `SourceEventAgentCanvas` shell.
- Removed the private `stage-canvases` subtree that was only imported by that retired shell.
- Updated the Source event shell integration test so restricted financial-value redaction is asserted through the shared financial-display contract.
- Regenerated the Source canvas reachability baseline from 128 to 120 known unreachable Source files.

## QA / Validation

- PASS: `node scripts/audit/source-canvas-reachability.mjs` — 616 route entry points, 120 known unreachable Source files, no new unreachable components.
- PASS: `npx jest src/__tests__/integration/source/source-event-canvas-shell.test.ts --runInBand -t "redacts restricted financial values"` — focused proof for the preserved financial-redaction contract. Jest also reports pre-existing duplicate manual mock warnings for markdown packages.
- BLOCKED: `npx jest src/__tests__/integration/source/source-event-canvas-shell.test.ts --runInBand` — full legacy shell suite is blocked in the isolated worktree because seeded event lookups return null; this is unrelated to the removed orphan shell and remains outside this cleanup slice.
- PASS: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main`, then use the repo-owned Azure Container Apps main deploy workflow. This cleanup has no manual runtime action and no data load.

## Deployment Authority

- Repo-owned deploy workflow: Required for production application rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned ACA workflow after merge.
- ACA runtime invariant: Required before claiming the new image is live.
- Worker image invariant: Required by the ACA workflow if worker images are updated.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes before claiming this cleanup is live in the product.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No database rollback is required.

## Audit Evidence

Before release, inspect the PR diff, CI checks, Source reachability audit output, targeted integration test output, release check output, and ACA deployment evidence after merge.

## Known Gaps

This slice reduces the known Source unreachable-file baseline only. Additional retired Source surfaces remain and should be handled in later scoped cleanup slices.
