# 2026-07-18-intelligence-top-gap-polish — Intelligence Top Gap Polish

## Release ID

`2026-07-18-intelligence-top-gap-polish`

## Status

`candidate`

## Plain-English Summary

The Intelligence aVa page no longer adds a second navigation-height offset above the chat and briefing canvas. The page now begins directly below the Nexus navigation bar instead of showing a large blank band.

## Layer Impact

- `global-control-lane`: adjusts the shared aVa chat shell spacing contract for the normal-flow Nexus top navigation layout used by the Intelligence page.
- Experience layer: removes the duplicate navigation-height gap above the chat and executive briefing canvas.
- Test layer: adds a focused regression that the aVa shell supplies the zero sticky-top override.

## Client Applicability

- All clients: Intelligence page users receive the spacing correction.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/ava-chat/AvaChatShell.tsx`
- `src/components/ava-chat/__tests__/AvaChatShell.test.tsx`

## QA / Validation

- `npm test -- AvaChatShell.test.tsx --runInBand` passed.
- `npx eslint src/components/ava-chat/AvaChatShell.tsx src/components/ava-chat/__tests__/AvaChatShell.test.tsx` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` passed.
- Live DOM proof on the currently deployed app confirmed the issue and the fix variable: gap before was 72px; after applying `--agent-dock-sticky-top: 0px`, gap was 0px.

## Rollout Plan

Merge to main through PR, build/deploy via the repo-owned Azure Container Apps main lane, then verify the signed-in Intelligence page on `https://app.abarva.ai/intelligence`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main lane. No migrations or data changes are involved.

## Audit Evidence

- PR URL: Pending.
- Screenshot proof: `/Users/anand/Downloads/intelligence-gap-css-var-injection-proof.png`
- Live DOM measurement: currently deployed gap 72px; patched variable gap 0px.

## Known Gaps

Live production acceptance is pending merge and ACA deploy.
