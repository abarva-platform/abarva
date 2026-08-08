# 2026-08-08-source-contract-relationship-story — Source Contract Relationship Story

## Release ID

`2026-08-08-source-contract-relationship-story`

## Status

`candidate`

## Plain-English Summary

Improves the Source contract detail experience so a selected contract tells a clearer evidence-backed story. The relationship map now lives in its own tab, the selected-contract Story tab no longer displays the portfolio optimization queue, and the leverage matrix explains what it proves before listing the underlying contract rows.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Updates the Source workspace UI and view model only.
- Canonical model: No schema or persistence changes.
- Source adapters: No ingestion changes.

## Client Applicability

- All clients: Yes, for tenants using the Source workspace contract portfolio.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Adds a dedicated Contract 360 `Relationship` tab.
- Moves the contract relationship graph out of the selected-contract Story tab.
- Adds plain-English value-ledger definitions beside the relationship flow.
- Replaces selected-contract portfolio-queue content with a contract-specific decision story and evidence guardrails.
- Adds a leverage-matrix contract register so selected quadrants resolve to actual contract rows.

## QA / Validation

- `npx tsc --noEmit --pretty false` passed.
- `npx eslint src/app/\(maestro\)/source/preview/workspace src/lib/source/data-model/contract-optimization-spine.ts src/lib/source/data-model/vendor-contract-portfolio.ts --max-warnings=0` passed.
- `npm test -- --runTestsByPath src/app/\(maestro\)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts --runInBand` passed. The repo emitted existing duplicate Jest mock warnings unrelated to this change.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps deploy workflow publishes the shared web runtime from main.

## Deployment Authority

- Repo-owned deploy workflow: Required for production activation.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Verify after deployment before calling live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for Source workspace contract detail and leverage matrix routes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI / deploy evidence: pending.
- Local validation commands listed above.

## Known Gaps

Live signed-in browser proof is still required after deployment.
