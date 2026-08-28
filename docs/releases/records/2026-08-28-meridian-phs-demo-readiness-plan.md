# 2026-08-28-meridian-phs-demo-readiness-plan — Meridian Demo Readiness Plan

## Release ID

`2026-08-28-meridian-phs-demo-readiness-plan`

## Status

`candidate`

## Plain-English Summary

Adds a repo-visible execution plan for the current Meridian/PHS demo focus. The plan separates the
executive demo across Home, Moves, Intelligence and Tower from the separate Source sourcing-CXO
demo, and records that airline-specific end-to-end demo proof is intentionally deferred for this
sprint.

## Layer Impact

- Product proof/control layer: documents the demo proof denominators and next proof slices.
- No data-plane layer: this change does not load, mutate, promote, or retire data.
- No runtime layer: this change does not alter application routing, feature flags, deployments, or
  ACA state.

## Client Applicability

- All clients: no runtime effect.
- Specific clients: current sprint planning is scoped to the synthetic Meridian/PHS demo tenant.
- Internal only: agent coordination and proof planning.
- Public/demo only: demo planning artifact.
- Feature flag: none.

## Changes Included

- `docs/architecture/MERIDIAN_PHS_DEMO_READINESS_PLAN_2026_08_28.md`
- Link from `docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md`
- `scripts/ecl/write_meridian_phs_demo_status.mjs`
- `docs/architecture/meridian-phs-demo-readiness-status.json`
- `package.json` npm script for refreshing the Meridian/PHS demo status

## QA / Validation

Documentation-only candidate.

- `node --check scripts/ecl/write_meridian_phs_demo_status.mjs` — pass.
- `npm run ecl:meridian-phs-demo-status:write -- --json` — pass.
- `npm run release:check` — pass.
- Markdown/link inspection for the new architecture document — pass; relative links point inside
  `docs/architecture`.

## Rollout Plan

Merge through PR. No ACA deploy is required for the plan itself.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, documentation-only.

## Rollback Plan

Revert the documentation PR.

## Audit Evidence

- PR diff and `npm run release:check` output.

## Known Gaps

- The Moves PHS route denominator is not yet enumerated.
- Current plan does not modify product code or prove live routes.
