# 2026-09-19-enum-unresolved-comparison-triage — Enum Unresolved Comparison Triage

## Release ID

`2026-09-19-enum-unresolved-comparison-triage`

## Status

`candidate`

## Plain-English Summary

The enum reachability sweep now records every unresolved comparison with an explicit bucket and reason instead of reporting only a total count. It also resolves a narrow SQL parser gap for qualified references that use the table name rather than an alias, when the statement names that table unambiguously.

## Layer Impact

Release lane: `global-control-lane`.

Control/app tooling only. The change affects a repository quality script, its behavioral coverage, and a generated triage artifact; it does not change product runtime behavior, data-plane schema, tenant data, auth, prompts, routes, or user-visible UI.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: None.
- Internal only: Repository quality gate and audit evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/quality/enum-reachability.mjs` records unresolved comparisons, writes a sanitized unresolved-triage report, and resolves exact table-name qualifiers without guessing.
- `src/__tests__/behaviors/enum-reachability.test.ts` adds failing-first coverage for table-name qualifier resolution and for refusing the same syntax when the table has no CHECK-constrained domain.
- `reports/quality/enum-reachability-unresolved-triage.json` records the current unresolved inventory with public-safe sanitized locations and values.

## QA / Validation

- Failing-first focused suite before the parser change: `npx jest src/__tests__/behaviors/enum-reachability.test.ts --runInBand` failed 2 tests, proving the qualified table-name case was unresolved and unresolved rows were not exposed for triage.
- Focused suite after the fix: `npx jest src/__tests__/behaviors/enum-reachability.test.ts --runInBand` passed 22/22.
- Sweep after the fix: `npm run audit:enum-reachability -- --unresolved-report=reports/quality/enum-reachability-unresolved-triage.json` passed with 633 CHECK-constrained columns, 5733 source files, 375 comparisons considered, 149 resolved, and 84 unresolved.
- Triage buckets after the fix: 80 not-a-subject, 2 ambiguous, 2 resolvable-with-work.
- Public-content scan over the triage report found no registry tenant terms.

## Rollout Plan

Merge the pull request. The existing enum reachability audit command is already wired in CI; no new workflow, deployment, migration, feature flag, or data-plane operation is required.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable; tooling-only change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the pull request to restore the previous scanner behavior and remove the generated triage artifact. No database rollback or runtime rollback is involved.

## Audit Evidence

- Pull request: https://github.com/abarva-platform/abarva/pull/7941
- Focused behavior suite: `npx jest src/__tests__/behaviors/enum-reachability.test.ts --runInBand`.
- Enum sweep and report generation: `npm run audit:enum-reachability -- --unresolved-report=reports/quality/enum-reachability-unresolved-triage.json`.
- Triage artifact: `reports/quality/enum-reachability-unresolved-triage.json`.

## Known Gaps

The remaining 84 unresolved rows are not hidden. Two are ambiguous by design, two need focused SQL/parser work around an unknown qualifier, and 80 are not subjects for this CHECK-domain sweep because the queried table does not own the constrained column name that collided elsewhere.
