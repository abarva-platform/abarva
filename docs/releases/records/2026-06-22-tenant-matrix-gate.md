# 2026-06-22-tenant-matrix-gate — Cross-tenant live gate (not Apex-only)

## Release ID

`2026-06-22-tenant-matrix-gate`

## Status

`candidate`

## Plain-English Summary

Adds a tenant-matrix live gate (`scripts/qa/tenant-matrix-gate.mjs`) that runs the canonical surface checks across **all tenants, not one**. The grounding-hedge failure pattern — an answer claiming "context not loaded" while the tenant's v4 pack clearly has it — is **cross-tenant** (it showed up on Apex *and* SkyHarbor/Intelligence), so the gate must be a matrix rather than a per-tenant one-off. Per tenant it asserts: `render` (React `/home`), `synthesis` (not the fake `Also:` row-dump), **`grounded`** (no "context not loaded" hedge — the failure pattern as a first-class column, ideally citing tenant evidence), `noRawId`, `experts` (routing landed), and `fence` (cross-tenant probe refused). It prints a tenant × check matrix. Auth is per-tenant (a session is a tenant; the fence blocks cross-tenant reads), so a cookie per tenant is supplied; a partial matrix is fine, and the tenant set is widened by editing one list.

## Layer Impact

`internal-admin` lane — an operator QA / verification script only. No product surface, client-data-lane, schema, flag, or runtime behavior change.

## Client Applicability

Not applicable — internal QA tooling run by an operator against the deployed app. No client receives anything from this change.

- All clients: no
- Specific clients: no
- Internal only: yes (operator QA script)
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/qa/tenant-matrix-gate.mjs` — the cross-tenant matrix gate.

## QA / Validation

- `node --check scripts/qa/tenant-matrix-gate.mjs` passes. Run signed-in it prints a tenant × check matrix and exits non-zero if any tested tenant fails a hard check. No runtime/product code changes. Status: **passed** (syntax) / not run (live is the operator's signed-in step).

## Rollout Plan

Merge to `main`. No runtime rollout — a QA script run on demand. No migration, image, flag, or worker change.

## Deployment Authority

- Repo-owned deploy workflow: none triggered by behavior (QA script only)
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unchanged
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: no (this is itself the verification tool)

## Rollback Plan

Revert the file. No runtime impact (QA script only).

## Audit Evidence

- PR URL + `node --check` output.
- The gate's tenant × check matrix output when an operator runs it against the deployed app.

## Known Gaps

The matrix proves the shared answer engine (Home + Intelligence both ride `/api/intelligence/ask`) via the `grounded` column; it does not separately render-check the `/intelligence` page — extend it if a surface-specific render regression is suspected. Auth is per-tenant by design (the cross-tenant fence forbids reading another tenant from one session), so a complete matrix needs one cookie per tenant.
