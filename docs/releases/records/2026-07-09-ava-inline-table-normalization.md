# 2026-07-09-ava-inline-table-normalization — aVa Inline Table Normalization

## Release ID

`2026-07-09-ava-inline-table-normalization`

## Status

`candidate`

## Plain-English Summary

Hardens the shared aVa renderer for a live follow-up audit defect where Claude emitted Markdown tables inline inside a paragraph. Those fragments did not become real tables, so separator rows such as `---` could appear as answer content. The renderer now expands inline pipe-table fragments into proper Markdown table blocks before rendering.

## Layer Impact

- `global-control-lane`: Updates shared aVa/AgentDock Markdown normalization.
- Presentation layer: Prevents inline table fragments from appearing as raw Markdown.
- Quality layer: Adds regression coverage for suggested-follow-up answer patterns found in the deployed product.

## Client Applicability

- All clients: Yes. This is shared aVa answer rendering behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/agent/markdownTokens.tsx`
- `src/lib/agent/__tests__/markdownTokens.test.tsx`

## QA / Validation

- Pass: `npx jest src/lib/agent/__tests__/markdownTokens.test.tsx --runInBand`
- Pass: `npx eslint src/lib/agent/markdownTokens.tsx src/lib/agent/__tests__/markdownTokens.test.tsx`
- Pending: focused TypeScript check for changed files.
- Pending: `npm run release:check`.
- Pending: live signed-in six-turn suggested-question click audit after deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds the digest-pinned image, updates `ca-abarva-web-lab-eastus`, verifies health and runtime invariant, and shifts traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No migrations, data changes, feature flags, or environment changes are involved.

## Audit Evidence

- PR URL: Pending.
- Live defect evidence: `proof/ava-suggested-followup-live-2026-07-09T04-09-46-110Z/` showed six submitted follow-up turns but failed formatting due to visible table separators.
- CI / local validation: See QA section.
- Live screenshot/export proof: Pending after deploy.

## Known Gaps

This release fixes rendering of inline table fragments. It does not independently verify that every tenant-specific number in the answer is source-accurate; grounding accuracy remains a separate audit dimension from display correctness.
