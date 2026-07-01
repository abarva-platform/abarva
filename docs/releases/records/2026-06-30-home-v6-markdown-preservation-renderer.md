# 2026-06-30-home-v6-markdown-preservation-renderer — Home V6 Claude Markdown Preservation

## Release ID

`2026-06-30-home-v6-markdown-preservation-renderer`

## Status

`candidate`

## Plain-English Summary

Home V6 now preserves Claude's Markdown emphasis in the API answer text and lets the Home answer renderer format that Markdown. This keeps the model's selected prose intact while still displaying clean executive formatting in the browser.

## Layer Impact

- `global-control-lane`: adjusts shared Home KNOW answer synthesis and rendering behavior for all demo tenants using Home V6.
- `public-demo`: improves demo-readiness by removing an unnecessary prose rewrite that made preserved Claude answers look altered in traces.

## Client Applicability

- All clients: Home V6 tenants using the executive synthesis path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing `HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED` behavior applies.

## Changes Included

- Preserve Markdown emphasis markers through Home V6 answer sanitization.
- Render Home answer prose through the existing Markdown renderer so emphasis displays as formatting rather than literal `**` markers.
- Add focused tests for backend preservation and browser-facing Markdown rendering.

## QA / Validation

- Pass: `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx --runInBand`
- Pass: `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts src/components/home/know/HomeKnowAnswerRenderer.tsx src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx --max-warnings 0`
- Not-run yet: live ACA smoke for Claude raw response, API payload, and rendered UI text. This runs after merge and deployment.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the image, then verify `https://app.abarva.ai` against the active ACA revision with signed-in Home V6 smoke tests.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the approved ACA workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: `app.abarva.ai` must run the merge SHA image in Azure Container Apps with 100% traffic on the new healthy revision.
- Worker image invariant: no worker image change.
- Feature/env flag update path: no new flag.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR or redeploy the prior ACA revision/image if live rendering or trace integrity regresses.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4208
- CI run: pending.
- ACA revision and digest: pending.
- Local test output: pending.
- Live smoke output and screenshot: pending.

## Known Gaps

None known before validation.
