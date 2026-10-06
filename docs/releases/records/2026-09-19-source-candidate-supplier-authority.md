# 2026-09-19 — Source candidate-supplier authority contract

## Release ID

`2026-09-19-source-candidate-supplier-authority`

## Status

`candidate`

## Plain-English Summary

Adds the deterministic contract for a client-scoped candidate-supplier registry used by new sourcing events. Candidate suppliers are deliberately separate from vendors on existing contracts. The projection requires declared supplier identity, accepted authority state, source lineage, and event eligibility filters; it also keeps supplier eligibility separate from permission and readiness to contact that supplier.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: defines the typed authority row consumed by downstream Source projections. It does not create or load a database table.
- Layer 4 Source: adds a pure read-projection function. No route or user interface consumes it in this release.

## Client Applicability

- All clients: contract is client-scoped and reusable.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; the contract is not mounted in a runtime surface.

## Changes Included

- `src/lib/source/candidate-suppliers/candidate-supplier-authority.ts`
- `src/__tests__/behaviors/source-candidate-supplier-authority.test.ts`

## QA / Validation

- Focused Jest behavior suite: 8 of 8 pass, including blank tenant/event refusal.
- Targeted ESLint: pass.
- Mutation proof: removing the tenant filter fails the opposite-tenant test.
- Mutation proof: inferring selection for every eligible supplier fails the explicit-selection test.
- TypeScript and release-control results are recorded on the PR.

## Rollout Plan

Squash merge through a protected PR. This release has no schema apply, data load, supplier communication, invitation, NDA dispatch, selection write, or provider integration. A later release may consume the contract through a separately reviewed canonical adapter and read-only Source New panel.

## Deployment Authority

- Repo-owned deploy workflow: normal main workflow if invoked by the merge.
- Shared runtime mutators: none.
- Approved image digest: recorded by the repo-owned workflow if a web image is built.
- ACA runtime invariant: unaffected until a runtime consumer is added.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no; no mounted product surface changes.

## Rollback Plan

Revert the squash commit. There is no database or tenant-data rollback.

## Audit Evidence

- PR URL and CI run: recorded on the PR.
- Focused test and mutation results: recorded in the PR validation notes.

## Known Gaps

- Persistence, governed template ingestion, admin maintenance, and ERP/TPRM synchronization are not implemented.
- The Source New candidate panel is a separate UI item and is not part of this release.
- No supplier can be contacted or selected through this contract.
