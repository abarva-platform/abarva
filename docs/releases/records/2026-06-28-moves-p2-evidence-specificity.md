# 2026-06-28-moves-p2-evidence-specificity — Moves P2 Evidence Specificity Gate

## Release ID

`2026-06-28-moves-p2-evidence-specificity`

## Status

`candidate`

## Plain-English Summary

Moves P2 Current Work Diagnostic generation now treats exact extracted evidence as mandatory input, not optional color. When uploaded evidence contains concrete metrics, exception categories, owners, risk levels, or finance-validation caveats, the P2 prompt foregrounds those items and the golden-bar gate fails artifacts that ignore them.

## Layer Impact

- `global-control-lane`: Shared Moves deliverable generation, prompt assembly, and golden-bar validation are updated for all clients using the strategic Moves artifact path.
- `client-data-lane`: No data-plane schema or tenant data changes are included. The change reads existing solution context and promoted evidence signals only.

## Client Applicability

- All clients: Applies to Strategic Moves P2 discovery/current-work diagnostic artifacts.
- Specific clients: No tenant-specific code.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added P2 evidence-specific signal extraction for metrics, taxonomy, owners, risk levels, and missing-input actions.
- Promoted extracted P2 evidence into the assembled `SolutionContext`.
- Updated the Strategic Moves artifact standard and prompt brief with an evidence priority rule.
- Updated premium golden-bar validation to require exact evidence/taxonomy terms when they are available.
- Added a guard against client-facing raw Move ID labels in P2 artifacts.
- Added unit coverage for prompt binding, context promotion, and golden-bar failures.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/deliverables/__tests__/visual-and-prompt.test.ts src/lib/deliverables/__tests__/golden-bar.test.ts src/lib/programs/__tests__/assemble-solution-context.test.ts --runInBand` passed: 3 suites / 30 tests.
- Additional lint, TypeScript, release-check, live async regeneration, and signed-in proof are pending for this candidate.

## Rollout Plan

Merge to main, deploy through the approved Azure Container Apps main lane, then regenerate the Lakeshore P2 Current Work Diagnostic through the private operator lane. Signed-in browser proof will confirm the generated artifact is visible in the File Cabinet and uses the evidence-specific premium bar.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy lane.
- Shared runtime mutators: Web image and private operator job use the same deployed application image.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Public web is used for signed-in UI/API proof only; private operator job is used for heavy artifact generation.
- Worker image invariant: Private operator must run the deployed image for product-path artifact generation.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the code changes and redeploy the prior ACA image. No destructive data-plane changes or migrations are included.

## Audit Evidence

- PR, commit SHA, ACA revision/digest, async operator proof, generated artifact ID, golden-bar output, and Downloads proof bundle will be attached after rollout.

## Known Gaps

Live regenerated artifact proof is pending.
