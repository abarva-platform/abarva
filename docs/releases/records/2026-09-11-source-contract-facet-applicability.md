# 2026-09-11 - Source Contract Facet Applicability

## Release ID

`2026-09-11-source-contract-facet-applicability`

## Status

`candidate`

## Plain-English Summary

Makes Contract 360 distinguish an evidence lane that is missing from one that does not apply to the declared contract archetype. Cloud consumption and software subscription contracts no longer present an empty Performance tab as an SLA evidence failure; they explain that the lane is not required unless the executed agreement declares a service-level obligation. Managed-services contracts continue to require performance evidence.

## Layer Impact

- `global-control-lane`: Layer 4 Source read-path and Contract 360 presentation behavior.
- The shared contract-intelligence education model now carries archetype-keyed facet applicability for Story, Scope, Economics, Performance, Relationship, Evidence, and Optimize.
- No canonical facts, tenant rows, document records, or Azure data are mutated by this change.

## Client Applicability

- All clients using the Source Contract 360 surface.
- No client data is activated by this candidate.
- No feature flag is required.

## Changes Included

- Add deterministic archetype-to-facet applicability to the contract education model.
- Read optional persisted facet requirements when present and derive the controlled fallback for older records.
- Render a plain-English `not required` state for non-applicable Performance evidence.
- Keep managed-services Performance as a required evidence lane.

## QA / Validation

- PASS: focused education and Source workspace tests, 4 tests passed.
- PASS: ESLint for changed files.
- PASS: TypeScript project check with increased Node heap.
- PASS: `git diff --check`.
- Pending after merge: signed-in Databricks Contract 360 smoke across all tabs, including the non-applicable Performance state and governed Optimize rows.

## Rollout Plan

Merge through the protected pull-request path. The repo-owned ACA main-deploy workflow builds and deploys the digest-pinned web image. No data-build job or migration apply is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators outside that workflow: none.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Signed-in Source proof: required after deploy.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to roll the web and worker images back to the reverted digest. No data rollback is required because this candidate changes only the governed read path and presentation state.

## Audit Evidence

- Focused education and Source workspace test output.
- ESLint and TypeScript output.
- Release-control check output.
- Post-merge ACA runtime invariant and authenticated Source tab smoke.

## Known Gaps

- The pending contract-intelligence migration and any VNet data refresh remain separate operator-gated actions.
- This change does not manufacture SLA, invoice, benchmark, or document rows for a contract whose archetype does not require them.
- The persisted Layer 3 record can add explicit `facet_requirements`; older records use the deterministic archetype mapping until refreshed.
