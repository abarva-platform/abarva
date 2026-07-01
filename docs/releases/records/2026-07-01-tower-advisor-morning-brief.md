# 2026-07-01-tower-advisor-morning-brief — Tower Advisor Morning Brief

## Release ID

`2026-07-01-tower-advisor-morning-brief`

## Status

`candidate`

## Plain-English Summary

Tower advisory posture questions now use the governed Tower portfolio value facts instead of falling through to a cold advisor-model path. Questions such as "Which investment posture should the CIO take?" return a CIO morning brief with the relevant program, posture, budget, actual spend, promised value, measured value, value gap, owner, and source boundary. This keeps the first advisory slice fast and reconciled with the same Tower measures that power the dashboard.

## Layer Impact

- `global-control-lane`: Adds a shared Tower question contract and deterministic answer path for all tenants with `cio_tower` portfolio value data.
- `client-data-lane`: The loader seeds one additional Tower question contract. No tenant-specific private data is changed by this code candidate.

## Client Applicability

- All clients: Any tenant with governed Tower portfolio value facts and measure packets receives the new advisor morning brief path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `tower_advisor_morning_brief` to the Tower question contract loader.
- Maps advisor brief and investment-posture questions to the new contract.
- Requires governed measure packets for initiative budget, actual spend, promised value, and measured value.
- Builds a visible CIO morning brief answer and table from governed facts.
- Updates the Tower prompt/raw/render trace harness so the advisory-posture canary is treated as deterministic.
- Adds regression tests for contract matching, fact selection, visible answer validation, and governed answer content.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand` passed: 2 suites, 32 tests.
- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/metric-packet.ts src/lib/cio-tower/__tests__/answer.test.ts scripts/qa/tower-prompt-raw-render-trace.mjs` passed.
- `node scripts/tower/load-cio-tower-standardized-v1.mjs --dry-run | jq '{measureCount, questionContractCount, measureResultCount, tenants}'` passed with 8 measures, 10 question contracts, 40 measure results, and all five tenants present.
- `npm run release:check` must pass before PR merge.
- Live VNet loader attempt on the first candidate failed because `artifact_type='card'` violated the existing `cio_tower.question_contracts_artifact_type_check`. The follow-up candidate keeps the CIO Morning Brief as a visible brief/table but stores the governed question contract as `artifact_type='table'`, which matches the live schema.

## Rollout Plan

1. Merge the PR to `main`.
2. Let the repo-owned Azure Container Apps main deploy build and deploy the approved main image.
3. Run the Tower standardized loader in write mode from the private VNet so the new question contract is present in Azure/Postgres.
4. Run the signed-in Tower prompt/raw/render trace against `https://app.abarva.ai`.
5. Record the ACA revision, image digest, traffic split, health result, loader counts, and trace report.

## Deployment Authority

- Repo-owned deploy workflow: Required; `app.abarva.ai` must move only through the ACA main deploy lane.
- Shared runtime mutators: No branch/local/Codex worktree may mutate shared ACA traffic or template image.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match the approved main digest.
- Worker image invariant: Private operator jobs should use the approved deployed image for VNet-only DB refresh/proof tasks.
- Feature/env flag update path: None for this slice.
- Live signed-in proof required: Yes, Tower prompt/raw/render trace plus browser-visible Tower check.

## Rollback Plan

Revert the PR and redeploy `main` through the ACA main deploy workflow. If the loader has already seeded the contract, rerun the prior approved loader or remove the `tower_advisor_morning_brief` question contract from `cio_tower.question_contracts` through the private VNet operator path. The dashboard measure results are not changed by this release candidate.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI run: To be added after PR checks.
- Local proof: Jest, ESLint, loader dry-run, and `release:check`.
- Live proof: To be added after deploy and signed-in trace.

## Known Gaps

- This is not a full physical advisor-brief cache table. It is the first governed fast path for CIO advisor posture using existing Tower facts and measure packets.
- First candidate merged and deployed, but the VNet DB refresh failed on the artifact-type constraint noted above. The follow-up candidate must be merged, deployed, VNet-refreshed, and browser-proven before release closure.
