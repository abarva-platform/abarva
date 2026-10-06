# 2026-09-09-source-optimize-executive-lever-strip — Source Optimize Executive Lever Strip

## Release ID

`2026-09-09-source-optimize-executive-lever-strip`

## Status

`live-proven`

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

Adds the executive lever strip to the Source Contract 360 optimization story panel, the live Source Workspace product-shell Optimize queue, and the Contract 360 Optimize subtab. Adds regression coverage for the six-lever summary state and for the product shell retaining the strip. Disables runner-provided browser apt sources before CI dependency install steps that do not depend on those sources.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' --runInBand` — PASS.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` — PASS.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` — PASS.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx'` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — PASS.
- `npm run release:check` — PASS.
- PR checks for the presentation change passed before merge.
- ACA main deploy run `34390274043` for merge SHA `936240a7a8090e727b95f1fc9f382311e0b9107a` completed successfully and proved digest `sha256:f473ead5fe447453d3771517f5ed8858c1cca7a32c5180f31c98b9641a89254b`.
- The later main deploy run `34391038983` for SHA `dc9326e8fa614ca35f71cf2540cb08b97a35a672` completed successfully and proved product-surface digest `sha256:0c2ed0b0468f246cdb0caf3bb526a99a33832da90b4684846b5bbd7b813ce687`.
- Independent runtime-invariant check passed for `acrabarvalab001.azurecr.io/abarva/web@sha256:0c2ed0b0468f246cdb0caf3bb526a99a33832da90b4684846b5bbd7b813ce687`: web template image, 100% traffic revision image, and required worker job images matched.
- Live signed-in Source smoke passed on Source Workspace / Contract 360 Optimize for `contractId=MER-TECH-DBX-001`: the executive strip rendered 6 levers, $1.8M negotiable value, 4 quantified rows, 2 signal-stage rows, and 0 finance-confirmed outcomes, with no conflict sentinel.
- Live advisor smoke passed on the same route: aVa returned the six optimization rows with dollar values, confidence, evidence grade, and signal-stage upgrade gaps, without an empty contract-ID artifact.
- Record-only deploy run `34392947258` for SHA `9849e2892406584cbdfeed26852ad8cd8b7cad34` completed successfully and proved digest `sha256:25f07785e41eb6bd8a4fbad728d8a8683dc6f55c15d2c5390f6fd5697d3b9ac0`; the same signed-in Source and advisor smoke checks remained clean after that deploy.

## Rollout Plan

Completed through PR merge, repo-owned Azure Container Apps main deploy, digest-pinned runtime invariant, and live signed-in Source workspace smoke against a contract with governed optimization opportunities.

## Deployment Authority

- Repo-owned deploy workflow: completed.
- Shared runtime mutators: not authorized outside the repo-owned deploy workflow.
- Product-surface proof digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:0c2ed0b0468f246cdb0caf3bb526a99a33832da90b4684846b5bbd7b813ce687`.
- Record-only proof digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:25f07785e41eb6bd8a4fbad728d8a8683dc6f55c15d2c5390f6fd5697d3b9ac0`.
- ACA runtime invariant: passed for active revisions `ca-abarva-web-lab-eastus--mdc9326e8` and `ca-abarva-web-lab-eastus--m9849e289` at 100% traffic.
- Worker image invariant: passed for required worker jobs.
- Feature/env flag update path: none.
- Live signed-in proof: passed for Source Workspace / Contract 360 Optimize.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data rollback is required because this is presentation-only.

## Audit Evidence

Inspect the PR, local validation output, CI checks, ACA deploy workflow, runtime-invariant proof, and live signed-in Source smoke output. The signed-in Source proof URLs used were `https://app.abarva.ai/source/workspace?client=meridian-health&contractId=MER-TECH-DBX-001&contractTab=Optimize&proof=contract-optimize-strip-live-20260909T1901Z` and `https://app.abarva.ai/source/workspace?client=meridian-health&contractId=MER-TECH-DBX-001&contractTab=Optimize&proof=contract-optimize-strip-live-20260909T1926Z`.

## Known Gaps

No data-layer gap is introduced by this change. The strip depends on the existing governed opportunity rows and therefore only appears as complete as the underlying Contract 360 optimization projection; contracts without optimization opportunities will not gain synthetic summary values.
