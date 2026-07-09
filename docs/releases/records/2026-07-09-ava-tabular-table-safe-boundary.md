# 2026-07-09-ava-tabular-table-safe-boundary — aVa Tabular Table and Safe Boundary Polish

## Release ID

`2026-07-09-ava-tabular-table-safe-boundary`

## Status

`candidate`

## Plain-English Summary

This release fixes a live aVa rendering defect where some Claude answers emitted tab-separated table rows and a literal dash separator row showed up in the chat/export view. It also replaces the terse "Could not complete this answer" chat text with a client-facing evidence-boundary response that explains what can safely be shown next.

## Layer Impact

- `global-control-lane`: Shared aVa chat rendering and Intelligence chat error display change for all tenants using the advisory chat shell.
- `public-demo`: Improves investor/client demo polish for tables, exports, and evidence-bound safe-fail behavior.

## Client Applicability

- All clients: Yes, applies to shared aVa Intelligence chat rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/agent/markdownTokens.tsx`: Normalize tab-separated table rows into GFM Markdown tables before rendering/export.
- `src/lib/agent/markdownTokens.tsx`: Add blank-line boundaries around normalized tables so prose-following tables parse as tables instead of paragraphs.
- `src/lib/agent/__tests__/markdownTokens.test.tsx`: Regression coverage for the live tab-separated table shapes.
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`: Replace raw error phrasing with evidence-boundary answer copy.

## QA / Validation

- Pass: `npx jest src/lib/agent/__tests__/markdownTokens.test.tsx --runInBand`
- Pass: `npx eslint src/lib/agent/markdownTokens.tsx src/lib/agent/__tests__/markdownTokens.test.tsx src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`
- Blocked: local `npx tsc --noEmit` was stopped after running actively for roughly ten minutes with no output; PR CI typecheck is required before merge.
- Pass: `npm run release:check`
- Not run after deploy: live signed-in six-turn suggested-followup audit against `https://app.abarva.ai`.

## Rollout Plan

Open a PR, squash merge to `main`, and allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the digest-pinned web image. No manual Azure runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow. The change is UI/normalization only and has no schema or migration rollback.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Live proof: Pending.
- Proof target: `proof/ava-suggested-followup-live-*`.

## Known Gaps

This release improves rendering and safe-fail wording. It does not prove every tenant-specific number in a Claude answer against the underlying source records; that remains a separate source-citation accuracy audit.
