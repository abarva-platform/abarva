# 2026-08-11-source-optimize-evidence-readiness — Source Optimize Evidence Readiness

## Release ID

`2026-08-11-source-optimize-evidence-readiness`

## Status

`candidate`

## Plain-English Summary

The Source Optimize Contract selected-case page now reads as a decision cockpit instead of a generic case page. It separates the contract exposure, loaded opportunity rows, open evidence gaps, calculation input counts, and source-system requests so a sourcing leader can see what is ready, what is missing, and what evidence blocks an external value claim.

## Layer Impact

- Lane: `global-control-lane`, because this is shared Source product UI and workflow guidance for every tenant with governed contract optimization projections.
- Product projection layer: The Optimize Contract page now presents selected-contract readiness, evidence requirements, and calculation traceability more clearly.
- Canonical model layer: No schema or persistence semantics changed. The page continues to read the existing governed contract optimization spine, opportunity set, calculation run, and evidence requirement projections.
- Workflow layer: No approval state or event creation semantics changed. This slice improves the decision surface before the user opens or continues the optimization case.

## Client Applicability

- All clients: Yes, for tenants with Source Optimize Contract enabled and governed contract projections.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tightened the Optimize Contract header and stage labels.
- Reframed the selected-contract panel as an optimization decision brief.
- Added readiness cells for contract exposure, opportunity rows, and open evidence gaps.
- Added calculation input counts to the opportunity table.
- Replaced the generic missing-evidence list with an evidence request board that names required evidence, source system, grain/history, blocker, and next action.
- Renamed the realized-value ledger label to make the finance proof gate explicit.
- Expanded focused component tests around evidence readiness and calculation input visibility.

## QA / Validation

- Pass: `npx prettier --check src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx docs/releases/records/2026-08-11-source-optimize-evidence-readiness.md`.
- Pass: `npx eslint src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/contract-optimization-ledger.ts`.
- Pass: `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — 1 suite, 4 tests passed. Existing duplicate manual mock warnings were emitted by Jest.
- Pass: `npx jest src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts --runInBand` — 2 suites, 6 tests passed. Existing duplicate manual mock warnings were emitted by Jest.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`. The command regenerated legacy-purge report timestamps locally; those generated report changes were not included in this release candidate.
- PR, deploy, and live signed-in proof are still pending.

## Rollout Plan

Merge to main through the GitHub PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the production image. After deploy, verify the live Optimize Contract route with a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the main deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: No worker change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned ACA workflow. No migration rollback is required because this release does not alter database schema or data.

## Audit Evidence

- PR URL: pending.
- Focused Jest output: 3 suites / 10 tests passed.
- ESLint output: passed.
- Prettier output: passed.
- TypeScript output: passed with explicit heap setting.
- Release check output: passed.
- ACA deployment proof: pending.
- Live signed-in browser proof: pending.

## Known Gaps

This slice improves the selected-contract readiness surface. It does not complete the full case workspace, New Event 11-stage journey QA, rich vendor-response parsing, aVa chart/table benchmark, or artifact-quality scoring backlog.
