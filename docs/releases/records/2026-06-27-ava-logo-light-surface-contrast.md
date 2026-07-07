# 2026-06-27-ava-logo-light-surface-contrast — aVa Logo Light-Surface Contrast Fix

## Release ID

`2026-06-27-ava-logo-light-surface-contrast`

## Status

`candidate`

## Plain-English Summary

Fixes the canonical aVa wordmark contrast on light agent surfaces. The prior default asset still carried a white foreground segment, which made the leading `a` disappear on white Home/aVa rails.

## Layer Impact

- `global-control-lane`: Shared aVa brand asset behavior changes for all surfaces that render `AvaAskMark`.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Corrected `/public/brand/ava/ava-wordmark-2tone-dark.svg` so the light-surface wordmark uses dark foreground plus cyan.
- Corrected `/public/brand/ava/ava-wordmark-2tone-light.svg` so the dark-surface wordmark uses white foreground plus cyan.
- Added an asset regression test for the default light-surface wordmark.

## QA / Validation

- Pass: focused Jest for aVa agent mark and surfaces: 4 suites / 9 tests.
- Pass: focused ESLint for changed TypeScript files.
- Pass: `npm run release:check`.
- Not run: post-deploy visual smoke on Home, Intelligence, Tower, `/source/new`, and `/strategic-moves/new`; required before declaring production proof complete.

## Rollout Plan

Merge to `main`, build through the Azure Container Apps main deploy workflow, shift 100% traffic to the new revision, then run signed-in browser visual smoke.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Azure Container Apps web image only.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: New revision must be healthy and receive 100% traffic.
- Worker image invariant: Updated by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this asset commit and redeploy through the ACA main lane, or roll back ACA traffic to the prior healthy revision if a deploy-level issue appears.

## Audit Evidence

- PR URL: To be recorded.
- ACA deploy run: To be recorded.
- Signed-in screenshots: To be recorded.

## Known Gaps

This release only corrects the shared aVa mark assets and does not redesign Source or Moves page layout. Source and Moves proof must be captured on their create/originate pages because their index pages may not render an aVa logo instance.
