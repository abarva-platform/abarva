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
- Live VNet loader attempt on the artifact-type follow-up failed because `intent='advise'` violated the existing `cio_tower.question_contracts_intent_check`. The next candidate stores the advisor morning brief as `intent='diagnose'`, which matches the live schema and keeps the visible answer behavior unchanged.
- Signed-in live trace on the intent follow-up passed 6/7 canaries and exposed one remaining route miss: advisor-posture phrasing was registered in the Tower question contract but was not admitted by the outer Atlas governed-Tower candidate gate, so it fell through to the general path and was correctly blocked by the visible-answer contract. The routing hotfix adds advisor/morning-brief/posture phrases to the governed Tower gate and adds an Atlas-boundary regression test.
- `npx jest src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand` passed after the routing hotfix: 3 suites, 34 tests.
- `npx eslint src/lib/atlas/tower-factual-spine.ts src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts src/lib/cio-tower/answer.ts scripts/qa/tower-prompt-raw-render-trace.mjs` passed after the routing hotfix.
- The deployed routing hotfix passed the signed-in Tower prompt/raw/render trace 7/7 on the latest `main` ACA image, but browser-visible `/tower` still exposed the legacy generic demo-safe label `Airline Demo`. The browser-label follow-up keeps the Tower page on the Tower canonical display-name resolver so signed-in executive chrome shows `SkyHarbor Air` while leaving non-Tower demo-safe mapping untouched.
- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts --runInBand` passed after the browser-label follow-up: 2 suites, 28 tests.
- `npx eslint src/app/'(maestro)'/tower/page.tsx src/lib/cio-tower/metric-packet.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts` passed after the browser-label follow-up.

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

- PR URL: #4284, #4287, #4290, #4293, and browser-label follow-up PR to be added after creation.
- CI run: To be added after PR checks.
- Local proof: Jest, ESLint, loader dry-run, and `release:check`.
- Live proof: To be added after deploy and signed-in trace.

## Known Gaps

- This is not a full physical advisor-brief cache table. It is the first governed fast path for CIO advisor posture using existing Tower facts and measure packets.
- The intent follow-up merged, deployed, and VNet-refreshed successfully. The routing hotfix is merged, deployed, and signed-in trace clean. The remaining release closure item is the browser-label follow-up deploy plus clean signed-in browser-visible Tower proof.
