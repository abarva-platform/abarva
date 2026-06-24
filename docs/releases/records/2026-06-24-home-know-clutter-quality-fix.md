# 2026-06-24-home-know-clutter-quality-fix — Home KNOW Clutter and Partial-Answer Fix

## Release ID

`2026-06-24-home-know-clutter-quality-fix`

## Status

`candidate`

## Plain-English Summary

This release removes the bulky always-open Home aVa side rail and renders Home questions as a compact ask bar above the context explorer. It also gives the Home KNOW synthesis pass the actual answer table rows, not just counts and gaps, so aVa does not turn partial org evidence into an overbroad "cannot characterize" answer. The Home route now carries non-rendered composer trace metadata so developers can prove whether the Golden semantic synthesis composer or deterministic fallback generated an answer.

## Layer Impact

- `global-control-lane`: Updates the shared Home surface, Home KNOW ask component, Home KNOW answer renderer, and Home KNOW synthesis context.
- `experimental`: The LLM synthesis behavior is still controlled by `home_know_llm_synthesis`; the UI cleanup applies to the Home surface.

## Client Applicability

- All clients: Home surface layout cleanup.
- Specific clients: SkyHarbor receives the synthesis-context improvement while `home_know_llm_synthesis` is tenant-enabled.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `home_know_llm_synthesis` for the LLM prose path.

## Changes Included

- Removes the persistent left Home aVa rail and places the ask bar inline above the context explorer.
- Stops reprinting the user's question as a large chat bubble under the ask bar.
- Renames mechanical answer labels from "Directional answer" and "Sources and exhibits" to simpler user-facing labels.
- Passes populated Home KNOW tables into the Claude synthesis prompt.
- Rejects false no-data synthesis language when source-backed facts or table rows are available.
- Adds route/composer trace metadata and gated server logging for `/api/home/know/ask`.
- Adds business-function routing for cross-dimension Home questions such as "how is our IT and business organized today?"

## QA / Validation

- PASS: `npx eslint src/app/api/home/know/ask/route.ts src/components/home/HomeSurface.tsx src/components/home/know/HomeKnowAsk.tsx src/components/home/know/HomeKnowAnswerRenderer.tsx src/lib/home/know/home-know-contract.ts src/lib/home/know/home-know-engine.ts src/lib/home/know/home-know-synthesis.ts src/lib/home/know/__tests__/home-know-engine.test.ts src/lib/home/know/__tests__/home-know-synthesis.test.ts`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- PASS: `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts src/lib/home/know/__tests__/home-know-synthesis.test.ts --runInBand` (27 tests), including the exact SkyHarbor-style IT/business organization question regression.
- PENDING: Local browser visual smoke and post-deploy live verification.

## Rollout Plan

Merge to `main`, deploy through the ACA main deploy workflow, then verify `https://app.abarva.ai/home` shows the inline ask bar and no left transcript rail.

## Deployment Authority

- Repo-owned deploy workflow: ACA `aca-main-deploy`.
- Shared runtime mutators: Next.js app image only.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required by deploy workflow.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing static feature registry.
- Live signed-in proof required: Yes, for Home UX.

## Rollback Plan

Revert this commit and redeploy the prior ACA image. No database migration or data-plane mutation is included.

## Audit Evidence

- Codex run logs for local TypeScript, Jest, ESLint, release check, browser smoke, PR, and ACA deployment.
- Post-deploy screenshot or browser proof for Home layout.

## Known Gaps

Signed-in browser automation still depends on fresh Clerk storage state or Clerk env credentials.
