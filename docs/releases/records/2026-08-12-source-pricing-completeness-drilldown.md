# 2026-08-12-source-pricing-completeness-drilldown — Source Pricing Completeness Drilldown

## Release ID

`2026-08-12-source-pricing-completeness-drilldown`

## Status

`candidate`

## Plain-English Summary

The Source Pricing decision lens now answers why a vendor is not comparable. It shows missing pricing sections, unresolved assumptions, exclusions, transition versus steady-state issues, cross-vendor comparability gaps, and the next clarification action.

## Layer Impact

- Product surface: Source Pricing UI only.
- Canonical/data layer: No schema, migration, persistence, loader, adapter, upload, parser, or live data-plane change.
- Evidence governance: The view uses the existing deterministic pricing completeness model and keeps live clarification dispatch disabled.

## Client Applicability

- All clients: Yes, for Source Pricing-stage UI.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Expanded `src/components/source/canvas/workspace-tabs/StageDecisionLensPanel.tsx` pricing view from counts into a real comparability drilldown.
- Added focused regression coverage in `src/components/source/canvas/workspace-tabs/__tests__/StageDecisionLensPanel.test.tsx`.
- Marked `SRC43` complete in `docs/backlog/tracks/04-source-commercial/BACKLOG.md`.
- Added this release record.

## QA / Validation

- PASS: Focused Jest for pricing decision lens: `npm test -- --runTestsByPath src/components/source/canvas/workspace-tabs/__tests__/StageDecisionLensPanel.test.tsx --runInBand`.
- PASS: ESLint for affected files: `npx eslint src/components/source/canvas/workspace-tabs/StageDecisionLensPanel.tsx src/components/source/canvas/workspace-tabs/__tests__/StageDecisionLensPanel.test.tsx`.
- PASS: TypeScript check: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- PASS: Release check: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: Whitespace diff check: `git diff --check`.
- NOT RUN YET: GitHub PR checks.
- NOT RUN YET: Signed-in live Source Pricing proof after ACA deployment.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA to the shared lab/product web runtime. After deploy, verify the ACA runtime invariant and perform signed-in browser proof on the Source Pricing decision lens.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Only the main deploy workflow.
- Approved image digest: Pending deploy workflow.
- ACA runtime invariant: Pending deploy workflow evidence.
- Worker image invariant: Pending deploy workflow evidence.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Pricing route.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to deploy the reverted `main` image. No database rollback is required because there are no schema, persistence, or data-plane changes.

## Audit Evidence

To be filled after PR, CI, deploy, and live proof:

- PR URL:
- Merge commit:
- ACA deploy run:
- Runtime digest:
- Live screenshot:

## Known Gaps

This does not implement live pricing workbook parsing, vendor communication dispatch, persisted clarification workflow, TCO scoring calibration, or approval automation. It presents deterministic pricing-readiness guidance only.
