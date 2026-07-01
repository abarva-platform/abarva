# 2026-07-01-tower-value-realization-deterministic-fallback — Tower Value Realization Deterministic Answer

## Release ID

`2026-07-01-tower-value-realization-deterministic-fallback`

## Status

`candidate`

## Plain-English Summary

Tower now answers value-realization questions such as "Where is spend producing value, and where should leadership press for proof?" from the governed Tower metric/read-model packet instead of relying on Claude to produce a valid JSON envelope. This prevents a production 502 while preserving the rule that Tower owns numbers, Claude owns narrative, and the renderer only places visible output.

## Layer Impact

- `global-control-lane`: Updates the shared Tower answer contract path for all tenants using CIO Tower V6 answers.
- `client-data-lane`: No schema, seed, or tenant-data changes. The answer continues to use existing `cio_tower.measure_results` and `cio_tower.facts`.

## Client Applicability

- All clients: Applies to tenants whose Tower value-realization questions route through `tower_value_realization`.
- Specific clients: Verified locally with the SkyHarbor/Airline Demo style value-realization question and planned for Airline Demo plus Industrial Demo production audit.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`: Routes `tower_value_realization` through the existing governed value-profile deterministic table.
- `src/lib/cio-tower/__tests__/answer.test.ts`: Adds the exact spend/value/proof phrasing regression.

## QA / Validation

- pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- pass: `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts`
- not-run yet: `npm run release:check` will be rerun after this release record update.
- not-run yet: Production 20-question generic demo answer audit will run after merge and ACA deployment.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, verify the new revision owns 100% traffic, then rerun the signed-in production answer audit.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: None outside the approved deploy workflow.
- Approved image digest: Filled after ACA deploy.
- ACA runtime invariant: Required before production proof.
- Worker image invariant: Covered by ACA deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the commit or redeploy the prior healthy ACA image. No data rollback is required because the change does not modify schema or tenant data.

## Audit Evidence

- Candidate PR: To be filled after PR creation.
- Local QA: To be filled after commands run.
- Production audit: To be filled after ACA deployment.

## Known Gaps

This does not broaden Tower data coverage or change metric formulas. It only prevents a value-realization question from failing when a Claude JSON envelope is not parseable.
