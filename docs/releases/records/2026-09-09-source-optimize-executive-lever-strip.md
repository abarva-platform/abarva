# 2026-09-09-source-optimize-executive-lever-strip — Source Optimize Executive Lever Strip

## Release ID

`2026-09-09-source-optimize-executive-lever-strip`

## Status

`candidate`

## Plain-English Summary

Adds a compact executive summary strip to the Source Contract 360 optimization story. The strip summarizes governed opportunity rows by count, negotiable value, quantified opportunities, signal-stage opportunities, and finance-confirmed outcomes so a reader sees the commercial posture before drilling into the individual levers. Also hardens affected CI install steps against runner-provided apt source drift that can block browser/Postgres setup before tests execute.

## Layer Impact

Affected lane: `public-demo`.

Layer 4 products: updates the Source workspace contract canvas presentation. The strip reads the existing Contract 360 optimization view model and does not create, recalculate, or persist business facts.

## Client Applicability

- All clients: Source contract optimization pages that have governed opportunity rows.
- Specific clients: none.
- Internal only: none.
- Public/demo only: no special demo-only behavior.
- Feature flag: none.

## Changes Included

Adds the executive lever strip to the Source Contract 360 optimization story panel and regression coverage for the six-lever summary state. Disables runner-provided browser apt sources before CI dependency install steps that do not depend on those sources.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' --runInBand` — PASS.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx'` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — PASS.
- `npm run release:check` — PASS.
- Pending PR checks.
- Pending live signed-in Source smoke after deploy.

## Rollout Plan

Merge through PR, deploy the approved main SHA through the repo-owned Azure Container Apps main workflow, prove the digest-pinned runtime invariant, then run a live signed-in Source workspace smoke against a contract with governed optimization opportunities.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: not authorized outside the repo-owned deploy workflow.
- Approved image digest: pending deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: Source Workspace / Contract 360 Optimize.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data rollback is required because this is presentation-only.

## Audit Evidence

Inspect the PR, local validation output, CI checks, ACA deploy workflow, runtime-invariant proof, and live signed-in Source smoke output.

## Known Gaps

No data-layer gap is introduced by this change. The strip depends on the existing governed opportunity rows and therefore only appears as complete as the underlying Contract 360 optimization projection; contracts without optimization opportunities will not gain synthetic summary values.
