# 2026-09-12-source-l4-view-diagnostic — inspect the Layer 4 read-model contract

## Release ID

`2026-09-12-source-l4-view-diagnostic`

## Status

`draft`

## Plain-English Summary

Adds a read-only operator diagnostic for the Source Layer 4 projection. It reports the live view columns, dependent views, active load markers, load-run distribution, and package-backed contract rows so a projection repair can be designed against the actual Azure/Postgres contract.

## Layer Impact

- `client-data-lane`: read-only diagnostic for governed Source data operations.
- **Layer 3 (Canonical model):** unchanged.
- **Layer 4 (Products · Source):** unchanged.

## Client Applicability

- All clients: operator diagnostic only.
- Data mutation: none.
- UI behavior: none.

## Changes Included

- Adds `scripts/source/inspect-source-contract-360-definition.mjs` output for live view columns, view dependencies, active load markers, load-run distribution, and package-backed rows.
- Keeps the operation read-only and tenant-scoped.

## QA / Validation

- Script is read-only and tenant-scoped.
- Output includes no database credentials.
- `node --check`: pass.
- `npm run release:check`: blocked until this record was completed; rerun before merge.
- ESLint: not run locally because the clean worktree has no installed dependency tree; CI is required.
- Azure execution uses the digest-pinned ACA operator job and restores the idle job state.

## Rollout Plan

The diagnostic is available in the operator image after the normal ACA deploy. Rollback is a normal code redeploy; no schema, source rows, or product projections are changed.

## Deployment Authority

- Repo-owned workflow: `.github/workflows/aca-main-deploy.yml`.
- Data-plane execution: digest-pinned ACA operator job only.
- Shared web traffic mutation: none.
- Live signed-in product proof: not applicable; this is an operator diagnostic.

## Rollback Plan

Revert and redeploy the operator image. No database rollback is required because the diagnostic performs no writes.

## Audit Evidence

- Local proof: `node --check` pass.
- Azure proof: operator job output and idle restoration will be recorded before release completion.

## Known Gaps

This diagnostic does not repair or activate a projection. Its output is a prerequisite for the forward Layer 4 projection repair and batch readback.
