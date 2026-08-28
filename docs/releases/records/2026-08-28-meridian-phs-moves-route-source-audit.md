# 2026-08-28-meridian-phs-moves-route-source-audit - Moves Route Source Audit

## Release ID

`2026-08-28-meridian-phs-moves-route-source-audit`

## Status

`candidate`

## Plain-English Summary

Adds a route/source audit for the Meridian/PHS Moves demo lane. The audit records the Moves routes
needed for the executive walkthrough, what each route reads today, and which proof is still needed
before Moves can be called demo-ready.

## Layer Impact

- Product proof/control layer: documents the Moves denominator and current data-source posture.
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

- `docs/architecture/MERIDIAN_PHS_MOVES_ROUTE_SOURCE_AUDIT_2026_08_28.md`
- Link from `docs/architecture/MERIDIAN_PHS_DEMO_READINESS_PLAN_2026_08_28.md`
- Status-writer output now records the Moves route audit and the generated-content import state.

## QA / Validation

Documentation/status-tooling candidate.

- `node --check scripts/ecl/write_meridian_phs_demo_status.mjs` - pass.
- `npm run ecl:meridian-phs-demo-status:write -- --json` - pass.
- `git diff --check` - pass.
- `npm run release:check` - initially fail on release-record QA wording; fixed before merge.

## Rollout Plan

Merge through PR. No ACA deploy is required for the audit itself.

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

- PR diff and local validation output.

## Known Gaps

- This does not perform signed-in browser proof for Moves.
- This does not update runtime code or generated Moves content.
