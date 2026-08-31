# 2026-08-31-ava-text-value-column-format — aVa Text Value Column Format

## Release ID

`2026-08-31-ava-text-value-column-format`

## Status

`candidate`

## Plain-English Summary

aVa answer tables now respect explicit text-formatted columns even when the column label is "Value." This prevents count-like values from being reformatted as currency while preserving currency formatting for columns that are typed or inferred as money.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 PRODUCTS: updates shared aVa answer rendering and export formatting. No source data, canonical model, projection schema, loader, or tenant data changes.

## Client Applicability

All clients: applies to rendered aVa answer tables and exported answer artifacts that use the shared answer renderer.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- On-screen answer tables honor `format: "text"` before applying numeric inference.
- HTML and PDF answer exports honor the same explicit text-format rule.
- Regression tests cover value-labeled text columns containing count-like values.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/ava-answer/export/__tests__/render-answer-html.test.ts src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts --runInBand`.
- Pass: focused ESLint on changed renderer/export files.
- Pass: full TypeScript check with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.
- Pass: release check with `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected pull-request path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. After deployment, verify the runtime image, traffic revision, health endpoint, and a signed-in aVa response that renders a count-like value without currency decoration.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the main deploy workflow.
- ACA runtime invariant: verify template image and 100% traffic revision image after deployment.
- Worker image invariant: verify worker image alignment if the workflow updates shared images.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and allow the repo-owned main deploy workflow to publish the previous answer-rendering behavior. No data rollback is required.

## Audit Evidence

Inspect the pull request, focused test output, TypeScript output, release-check output, deploy workflow run, ACA runtime invariant output, and signed-in aVa table-rendering smoke proof.

## Known Gaps

No data-plane reload, projection rebuild, feature flag, or schema migration is included. This change does not alter how aVa selects tables or charts; it only protects explicit text columns from currency inference.
