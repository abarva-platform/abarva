# 2026-06-22-matrix-gate-intel-column — Matrix gate: add /intelligence render column

## Release ID

`2026-06-22-matrix-gate-intel-column`

## Status

`candidate`

## Plain-English Summary

Adds an `intel` column to the tenant-matrix gate (`scripts/qa/tenant-matrix-gate.mjs`) so each tenant row also asserts that `/intelligence` serves the canonical v2 Lens (`IntelligenceV2Surface`, root `class="iv2"`), not a fallback or error page. The gate already proved the shared answer engine via the `grounded` column; this adds the *page-render* assertion for the second surface, so the matrix covers both `/home` and `/intelligence` per tenant.

## Layer Impact

`internal-admin` lane — an operator QA / verification script only. No product surface, client-data-lane, schema, flag, or runtime change.

## Client Applicability

Not applicable — internal QA tooling run by an operator against the deployed app. No client receives anything.

- All clients: no
- Specific clients: no
- Internal only: yes (operator QA script)
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/qa/tenant-matrix-gate.mjs` — new `intelIsV2()` check + `intel` matrix column.

## QA / Validation

- `node --check scripts/qa/tenant-matrix-gate.mjs` passes. Run signed-in it prints the tenant × check matrix including the new `intel` column. No runtime/product change. Status: **passed** (syntax) / not run (live operator step).

## Rollout Plan

Merge to `main`. No runtime rollout — a QA script run on demand. No migration, image, flag, or worker change.

## Deployment Authority

- Repo-owned deploy workflow: none (QA script only)
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unchanged
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: no (this is the verification tool)

## Rollback Plan

Revert the change. No runtime impact (QA script only).

## Audit Evidence

- PR URL + `node --check` output + the gate's matrix output showing the `intel` column.

## Known Gaps

The `intel` check confirms the v2 Lens page renders; the answer-grounding for Intelligence is already covered by the shared `grounded` column (both surfaces ride `/api/intelligence/ask`). No separate per-surface grounding run is needed unless surface-specific retrieval divergence is suspected later.
