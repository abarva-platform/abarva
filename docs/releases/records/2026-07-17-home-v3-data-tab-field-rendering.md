# 2026-07-17-home-v3-data-tab-field-rendering — Home V3 Data Tab Field Rendering

## Release ID

`2026-07-17-home-v3-data-tab-field-rendering`

## Status

`candidate`

## Plain-English Summary

Home's Data tab now shows domain-specific fields for source-backed context instead of forcing every context area into generic `Dataset`, `Record`, `Category`, `Owner / System`, `Status`, and `Source` columns. This keeps Meridian budget, program, and AI context reviewable because budget rows can expose run budget, change budget, funding status, AI spend flags, and evidence posture when those fields are already present in the active Home packet.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI layer: Updates the Home Context Explorer Data tab rendering so it selects client-readable columns from the existing Home context packet.
- Context visibility layer: Makes already-loaded source fields visible to operators and buyers; it does not create, transform, promote, or reload tenant facts.

## Client Applicability

- All clients: Yes, for Home context areas with matching budget/value, program/initiative, or AI/automation fields.
- Specific clients: Meridian / Healthcare Demo is the regression target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx` now carries row display values and chooses area-specific Data tab columns when relevant fields are available.
- `src/components/home/__tests__/HomeSurface.test.tsx` adds a regression for V3 budget rows showing `Run Budget USD` and `Change Budget USD` instead of the generic `Owner / System` header.

## QA / Validation

- Pass: `/Users/anand/Projects/nexus/node_modules/.bin/jest --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Note: Jest emitted pre-existing duplicate manual mock warnings for markdown/GFM mocks; the HomeSurface suite passed.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow will build and deploy the next main image. After deploy, run signed-in Home proof against Meridian / Healthcare Demo and verify the IT Budget, Programs, and AI Data tabs expose the expected fields without candidate data leakage.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home `/home` for Meridian / Healthcare Demo.

## Rollback Plan

Revert the PR or redeploy the previous ACA digest. Rollback restores the generic Home Data tab rendering and does not affect tenant source data or candidate state.

## Audit Evidence

- PR URL: To be added when opened.
- Focused test output: HomeSurface test suite, 14 passed.
- Live proof after deploy: Capture screenshot/text for Meridian Home IT Budget Data tab showing run/change budget fields.

## Known Gaps

- This PR does not reload data, update Active Tenant Access, promote candidates, change Tower runtime behavior, or make Intelligence/aVa retrieval consume the new Meridian facts.
