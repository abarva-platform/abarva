# 2026-07-10-ava-retired-source-filter — Filter Retired Sources Before aVa Synthesis

## Release ID

`2026-07-10-ava-retired-source-filter`

## Status

`candidate`

## Plain-English Summary

Fixes a live Intelligence aVa failure where charts/tables appeared briefly during streaming and then disappeared. The final answer was being hard-blocked because one or more retrieved Lakeshore source rows still contained retired aliases such as HarborPoint, Riverton, or Keystone. The runtime now withholds unsafe source rows before model-visible packet assembly instead of collapsing the whole answer, while still blocking retired terms if they appear in final model output or follow-up questions.

## Layer Impact

- `global-control-lane`: Changes the shared Intelligence answer-safety runtime for all tenants.
- `client-data-lane`: Does not clean the underlying stale Lakeshore rows; it prevents unsafe rows from reaching model-visible packets until data cleanup is complete.

## Client Applicability

- All clients: Yes, the retired-source filter applies through the shared Intelligence ask path.
- Specific clients: Lakeshore Holdings is the live repro case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/retired-fact-gate.ts`: adds source-level filtering for rows that contain retired/stale/cross-tenant policy terms.
- `src/lib/intelligence/ask/index.ts`: filters selected sources before coverage, packet assembly, Claude synthesis, and final rendering.
- `src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts`: adds regression coverage for source filtering while preserving model-output blocking.

## QA / Validation

- `Fail` before fix: live signed-in Lakeshore Intelligence prompt returned a retired-fact error for `v7_01_enterprise_profile` with HarborPoint/Riverton/Keystone findings and final DOM `tableCount=0`.
- `Pass`: `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts --runInBand`.
- `Pass`: `npx eslint src/lib/intelligence/ask/retired-fact-gate.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts`.
- `Pass`: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- `Pass`: `npm run release:check`.
- `Not run`: live signed-in Intelligence prompt after ACA deployment.

## Rollout Plan

Open PR, squash merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then run a live signed-in Intelligence prompt that asks for a table/chart and verify the final DOM retains the rendered artifact or a clean governed visual boundary without a retired-fact error.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after ACA deployment.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Main deploy workflow managed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Lakeshore Intelligence aVa prompt with table/chart request.

## Rollback Plan

Revert this PR and redeploy the prior healthy digest through the ACA main deploy workflow. The older behavior is safer but over-blocks answers when stale source rows are present.

## Audit Evidence

- Pre-fix proof: `proof/ava-render-disappears-2026-07-10T12-35-59-578Z`.
- PR URL: pending.
- CI run: pending.
- ACA deployment evidence: pending.
- Live signed-in proof after deploy: pending.

## Known Gaps

Underlying Lakeshore V7 data still needs cleanup. This change prevents stale rows from becoming model-visible context; it does not delete HarborPoint, Riverton, Keystone, or other retired names from source datasets, chunks, indexes, or graph records.
