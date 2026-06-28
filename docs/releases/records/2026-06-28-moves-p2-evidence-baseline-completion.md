# 2026-06-28-moves-p2-evidence-baseline-completion — Moves P2 Evidence Baseline Completion

## Release ID

`2026-06-28-moves-p2-evidence-baseline-completion`

## Status

`candidate`

## Plain-English Summary

Moves P2 discovery reports now preserve first-class evidence even when the model underuses it. If a P2 diagnostic has extracted metrics, exception taxonomy, risk-owner signals, or client-actionable missing inputs, the artifact generator can add a client-facing Evidence Baseline Completion Exhibit and then rerun the golden-bar check. This prevents a visually strong diagnostic from passing while omitting the exact evidence that should anchor the analysis.

## Layer Impact

- `global-control-lane`: Shared Moves artifact generation behavior changes for all tenants and Moves using the P2 discovery report generator.
- `client-data-lane`: No schema, seed, migration, tenant data, or RLS behavior changes.

## Client Applicability

- All clients: Yes, for Moves P2 discovery reports that bind first-class evidence metrics or taxonomy.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/generate-artifact.ts`: adds deterministic P2 Evidence Baseline Completion Exhibit when exact evidence terms or taxonomy are missing from model output.
- `src/lib/deliverables/__tests__/generate-artifact.test.ts`: adds regression coverage for a visually strong P2 report that omits exact evidence.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/deliverables/__tests__/generate-artifact.test.ts src/lib/deliverables/__tests__/golden-bar.test.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts src/lib/programs/__tests__/assemble-solution-context.test.ts --runInBand` passed: 4 suites / 36 tests.
- `npx eslint src/lib/deliverables/generate-artifact.ts src/lib/deliverables/__tests__/generate-artifact.test.ts` passed.
- `npm run audit:control-plane-purity:check` passed with no new hardcoded tenant strings.
- `npm run release:check` must pass before merge.

## Rollout Plan

Merge to main, deploy through the approved Azure Container Apps main lane, then regenerate the Lakeshore P2 Current Work Diagnostic through the signed-in Moves flow and private operator job. The live artifact must contain the exact evidence metrics and taxonomy before it is treated as review-ready.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps web image and private operator job use the deployed application image.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% traffic only after the new revision is healthy.
- Worker image invariant: heavy artifact generation uses `job-abarva-private-operator-eus`, not the public web container.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, regenerate P2 and verify exact evidence terms in the downloaded artifact.

## Rollback Plan

Revert this release commit and redeploy the prior healthy ACA image. No database rollback is required because this release does not change schema or data.

## Audit Evidence

- PR URL and merge commit to be recorded after PR creation.
- Local test output from the focused Jest suite.
- Live signed-in P2 regeneration proof and downloaded HTML validation after deployment.

## Known Gaps

Full `tsc --noEmit` may still be blocked by unrelated pre-existing dependency declaration gaps already present in the workspace. This release is scoped to the P2 evidence completion path and its focused tests.
