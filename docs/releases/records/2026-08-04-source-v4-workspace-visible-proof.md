# 2026-08-04-source-v4-workspace-visible-proof - Source V4 Workspace Visible Proof

## Release ID

`2026-08-04-source-v4-workspace-visible-proof`

## Status

`candidate`

## Plain-English Summary

The signed-in Source workspace now leads with the governed Source V4 semantic snapshot instead of
making the older contract register look like the full analytical layer. The first screen shows V4
portfolio scale, scope-confidence counts, invoice-line depth, service-credit evidence, SaaS/cloud
observations, rate-card exceptions, sourcing-event rows, and off-contract exposure with period and
value labels that avoid overclaiming savings.

This also hardens the Intelligence aVa visible stream against malformed structured artifact leakage
where decision-table rows are emitted as raw inline JSON instead of fenced chart/table payloads.

## Layer Impact

- Release lane: `global-control-lane`
- Layer 3 canonical/semantic projection: preserves explicit and inferred scope counts returned by
  the V4 workspace snapshot query so the product can display the actual scope-confidence split.
- Layer 4 products: updates `/source/preview/workspace` presentation and aVa-visible context
  labels; no product-owned facts are introduced. Also updates the shared Intelligence answer
  renderer/filter so raw chart/table JSON does not appear in the chat prose.

## Client Applicability

- All clients: the Source workspace rendering pattern applies to any tenant with a V4 snapshot.
- Specific clients: none named in this public record.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/source-v4-workspace-snapshot.ts`
- `src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- `src/lib/intelligence/answer/structured-fence-stream-filter.ts`
- `src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts`
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`
- `src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts`

## QA / Validation

- PASS: `npx eslint src/lib/source/data-model/source-v4-workspace-snapshot.ts src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts src/app/(maestro)/source/preview/workspace/buildViewModel.ts src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- PASS: `npx eslint src/lib/intelligence/answer/structured-fence-stream-filter.ts src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts`
- PASS: `npx jest --runTestsByPath src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `git diff --check`

## Rollout Plan

Merge through the normal PR path. The repo-owned Azure Container Apps main deploy workflow builds
and deploys the web image. After deploy, run signed-in Source workspace proof and verify the V4
semantic proof panel is visible for the intended tenant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned main deploy workflow only
- Approved image digest: resolved by the deploy workflow after merge
- ACA runtime invariant: verified by the deploy workflow and post-deploy proof
- Worker image invariant: no worker code changed; existing invariant still applies
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy the prior web image. No data
rollback is required because the change only exposes already-loaded V4 projections and one retained
snapshot field.

## Audit Evidence

- PR URL after publication
- GitHub Actions checks and ACA main deploy artifact after merge
- Signed-in `/source/preview/workspace` screenshots, browser console logs, network trace and visible
  text scrape proving the V4 semantic proof panel.

## Known Gaps

The browser still receives the server-built Source workspace payload rather than making direct Cube
HTTP calls. Cube runtime and Postgres reconciliation remain separate proof artifacts until a product
API bridge explicitly proxies Cube query IDs into the Source workspace.
