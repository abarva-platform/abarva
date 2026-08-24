# 2026-08-24-ecl-clean-break-integrated-plan - ECL Clean Break Integrated Execution Plan

## Release ID

`2026-08-24-ecl-clean-break-integrated-plan`

## Status

`candidate`

## Plain-English Summary

Adds a repo-visible execution plan for the ECL clean break so agents and engineers share one
definition of the target layers, population pipeline, testing gates, product cutover, rollback, and
percent-complete reporting.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1 client intake/source room: documents the 14 source-room families and partial-data rules.
- Layer 2 adapters/source ingestion: documents `ecl_source` and origin enforcement.
- Layer 3 canonical context/commercial/review: documents canonical object, relationship, measure,
  contract, invoice, SLA, and review-event responsibilities.
- Layer 4 product projections and cubes: documents existing and missing projection surfaces plus
  cube enforcement.
- Layer 5 serving: documents the planned `serving` contract and 40 product views.
- Layer 6 products: documents route/browser QA and default cutover gates.

No runtime data, schema, route, deployment, tenant input, or Azure resource is changed by this PR.

## Client Applicability

- All clients: execution doctrine applies to future ECL-backed product surfaces.
- Specific clients: none.
- Internal only: this is an internal engineering/agent execution plan.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md`.
- Links the plan from `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md`.

## QA / Validation

- Pass: Markdown authored as documentation only.
- Pass: No application code or data-plane assets changed.
- Pass expected before merge: `npm run release:check`.

## Rollout Plan

Merge to `main`. No ACA deploy, migration, feature flag, data load, or product route repoint is
required for this documentation-only release.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the documentation commit if the plan needs replacement.

## Audit Evidence

- PR diff for the architecture plan and release record.
- `npm run release:check` output.

## Known Gaps

- This plan does not itself implement the missing projections, serving views, product repointing,
  browser proof, or legacy retirement. It makes those workstreams explicit and denominator-based.
