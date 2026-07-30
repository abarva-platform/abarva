# 2026-07-30-airline-evidence-gap-publisher-grant — Evidence Gap Projection Grant

## Release ID

`2026-07-30-airline-evidence-gap-publisher-grant`

## Status

`candidate`

## Plain-English Summary

Adds the missing publisher permission needed for the governed projection builder to promote
source-backed evidence gaps into the Airline Knowledge consumption layer. This does not replay
review decisions, change the active baseline, or approve any new facts.

## Layer Impact

- Lane: `client-data-lane`
- Layer 3 — Canonical Model: updates the Airline PostgreSQL role contract so the publisher role can
  write the governed `governance.evidence_gap` rows derived from already-accepted source facts.
- Layer 4 — Products: unblocks rebuilding `consumption.evidence_gap_v1` from governed data so product
  surfaces do not show a false "no gaps" signal.

## Client Applicability

- All clients: No.
- Specific clients: Airline Demo New lab execution only.
- Internal only: Yes, execution helper and security-plan contract.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `clients/airline-demo-new/18-phase2b3c-azure-lab-implementation/12-postgres-security-plan/phase2b3c2c-postgres-readiness.sql`
- `scripts/knowledge/grant-airline-evidence-gap-publisher.mjs`

## QA / Validation

- PASS — `node --check scripts/knowledge/grant-airline-evidence-gap-publisher.mjs`
- PASS — `npm run release:check`

## Rollout Plan

Merge through the repo PR lane, deploy through the repo-owned ACA main workflow, then execute the
grant helper through the governed Airline VNet database migration job. After the helper verifies the
grant, rerun the projection build and live reconciliation readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, this is an internal data-plane grant. Live data-quality readback
  is required before product readiness is claimed.

## Rollback Plan

Revert the PR to remove the helper and contract update. If the live grant must be reversed, run a
governed admin SQL change revoking `INSERT` and `UPDATE` on `governance.evidence_gap` from the
publisher role, then rerun projection preflight.

## Audit Evidence

- PR URL: pending.
- ACA deploy run: pending.
- VNet grant-helper execution: pending.
- Projection rebuild: pending.
- Live reconciliation readback: pending.

## Known Gaps

This release only unblocks the evidence-gap projection writer. It does not certify source-to-Cube
quality, interview completeness, Source/Moves operational migration, or UI/demo readiness.
