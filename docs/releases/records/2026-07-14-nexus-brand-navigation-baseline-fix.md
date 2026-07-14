# 2026-07-14-nexus-brand-navigation-baseline-fix — NEXUS Navigation Baseline Fix

## Release ID

`2026-07-14-nexus-brand-navigation-baseline-fix`

## Status

`candidate`

## Plain-English Summary

This release corrects the visual baseline of the NEXUS top navigation after browser review showed the lockup still felt too large and too high. The NEXUS lockup renders at 80% of the prior deployed size, while the brand, navigation text, and action cluster sit lower in the bar.

## Layer Impact

- UI shell: CSS-only adjustment to the authenticated global navigation.
- Data plane: No impact.
- Auth/runtime behavior: No impact.

## Client Applicability

- All clients: Yes, for the authenticated product shell.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/navigation/NexusTopNav.module.css` reduces the rendered lockup width and lowers the brand/nav/action optical baseline.

## QA / Validation

- Pass: `npm run audit:nexus-navigation`
- Pass: focused NEXUS navigation Jest tests.
- Pass: targeted ESLint.
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: signed-in browser proof after ACA deploy.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deploy workflow will build and deploy the corrected image. Signed-in screenshot proof is required before calling the correction live-proven.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the approved main deploy workflow.
- Approved image digest: To be recorded after ACA deploy.
- ACA runtime invariant: Required after ACA deploy.
- Worker image invariant: Required after ACA deploy if the workflow updates worker jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by reverting this CSS-only PR or by redeploying the prior digest-pinned ACA image through the approved workflow if the visual result is worse.

## Audit Evidence

- PR URL: To be added after PR creation.
- Signed-in screenshots: To be captured after deploy.
- ACA revision and digest: To be captured after deploy.

## Known Gaps

No Home, Admin, data-plane, tenant-data, candidate, or module runtime behavior changes are included.
