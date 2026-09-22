# 2026-09-22-analytics-repatriation-method-library — Analytics repatriation methods resolve

## Release ID

`2026-09-22-analytics-repatriation-method-library`

## Status

`candidate`

## Plain-English Summary

The analytics repatriation archetype declared two analysis methods that the shared method library did
not define. This release authors those two distinct method specs instead of withdrawing the
archetype declarations or merging non-equivalent methods together.

## Layer Impact

- `global-control-lane`: updates authored Moves archetype guidance and CI coverage for all
  environments.
- Layer 4 product projection only: no canonical data, adapter, source-intake, schema, migration, or
  tenant data changes.

## Client Applicability

- All clients: yes, when this draft archetype is selected.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `strategic_control_repatriation_readiness` to `ANALYSIS_METHODS`.
- Adds `capability_parity_traceability` to `ANALYSIS_METHODS`.
- Adds a wired behavioral assertion that the analytics repatriation archetype resolves both methods
  as distinct specs.
- Adds the formerly quarantined Program archetype resolver suite to the unit-suites workflow step.
- Updates the Programs CI coverage behavior note to reflect that the old exact quarantine is closed.

## QA / Validation

| What | Result |
|---|---|
| Red-first focused test before method specs | 30 passed / 1 failed; failure was `strategic_control_repatriation_readiness` undefined |
| Focused analytics repatriation test after fix | 31 passed / 0 failed |
| Formerly quarantined resolver suite | 9 passed / 0 failed |
| Exact Program archetype workflow command | 4 suites / 54 tests passed |
| Programs unit-directory behavior guard | 11 passed / 0 failed |
| Mutation: renamed `capability_parity_traceability` library key | 30 passed / 1 failed; new analytics method case caught undefined parity method |
| `npm run audit:named-suite-requiredness` | passed |
| `npm run typecheck` | exit 0; clean |
| Focused TypeScript ESLint | exit 0; clean |
| `npm run release:check` | passed |

## Rollout Plan

Merge to `main` by pull request. The repo-owned unit-suites workflow then runs all four Program
archetype suites on subsequent pull requests. The normal repo-owned ACA deploy may build this commit,
but this change has no data-plane or runtime operator step.

## Deployment Authority

- Repo-owned deploy workflow: ordinary main deploy only.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: to be reported separately if the repo-owned deploy runs after merge.
- Worker image invariant: to be reported separately if the repo-owned deploy runs after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: no; the change is authored method metadata, tests, workflow wiring,
  and documentation, with no rendered route or stored tenant value changed.

## Rollback Plan

Revert the PR. The analytics repatriation archetype would again contain dangling method declarations
unless the workflow quarantine was also restored, so rollback should be used only if a replacement
authored-content decision is ready.

## Audit Evidence

- Pull request and hosted CI checks.
- Local red-first, green, and mutation test output.
- `npm run audit:named-suite-requiredness`, `npm run typecheck`, `npx eslint`, and
  `npm run release:check` output.
- ACA deploy workflow and runtime invariant output if a repo-owned deploy is triggered after merge.

## Known Gaps

- No signed-in product acceptance was performed or required; no product surface behavior changes.
