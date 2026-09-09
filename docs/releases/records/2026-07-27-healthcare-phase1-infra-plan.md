# 2026-07-27-healthcare-phase1-infra-plan - Healthcare Phase 1 Infrastructure Plan

## Release ID

`2026-07-27-healthcare-phase1-infra-plan`

## Status

`candidate`

## Plain-English Summary

This release adds a plan-only Azure infrastructure execution package for the approved Healthcare
Demo New synthetic reference tenant. It turns the frozen Phase 0 authority record into a concrete
pre-apply package with resource naming, Bicep parameters, what-if gates, RBAC, private DNS,
PostgreSQL extension planning, ACA job definitions, rollback conditions, and validation. It does
not create resources or load data.

Follow-up alignment: this plan now treats the merged Phase 3C-2D consumption contract as a mandatory
dependency before tenant completion. The first graph path is relational PostgreSQL consumption
tables with recursive SQL traversal. Apache AGE is explicitly deferred and is not part of Phase 1,
initial PostgreSQL bootstrap, zero-data acceptance, or source loading.

## Layer Impact

- Release lane: `client-data-lane` and `internal-admin`.
- Client intake and source corpus: no change.
- Source adapters and parsers: no execution and no schema change.
- Canonical model: no schema change and no tenant facts.
- Infrastructure planning: adds a Healthcare-only plan package for future Azure apply review.
- Consumption contract: references the shared Phase 3C-2D projection registry and blocks legacy
  module/demo/runtime tables from becoming upstream sources for the new pilot.
- Products: Home, Intelligence, Moves, Source, Tower, Learn, Cube, Superset, and Observable are not
  wired or changed.

## Client Applicability

- All clients: no.
- Specific clients: `healthcare-demo-new` synthetic reference implementation only.
- Internal only: yes, execution planning.
- Public/demo only: no runtime change.
- Feature flag: none.

## Changes Included

- `clients/healthcare-demo-new/20-phase1-azure-infrastructure-execution-package/`
- `clients/shared/20-phase3c2d-consumption-contracts/CONSUMPTION_PROJECTION_REGISTRY.json`
  (dependency reference only; no mutation in this PR)
- `scripts/knowledge/validate-healthcare-phase1-plan.mjs`
- This release record.

## QA / Validation

Planned and local validation:

- Phase 0 freeze manifest hash checked against
  `06f645913353988eb722eeccb2b89ee5f7d96fbf2b4c60d86d6bff3bee4412fd`.
- The package requires `tenant_key=healthcare-demo-new`,
  `release_id=healthcare-demo-new-source-corpus-v1.0.0`, and the exact manifest SHA.
- The package declares Azure what-if as not run in this plan PR.
- The package declares zero Azure, PostgreSQL, source, parser, publication, or runtime mutations.
- The package declares `age_enabled=false`; AGE is not an initial extension, graph dependency, or
  zero-data acceptance dependency.
- The package requires relational consumption projections including `consumption.relationship_node_v1`,
  `consumption.relationship_edge_v1`, and `consumption.relationship_evidence_v1`.
- `npm run release:check` required before merge.

## Rollout Plan

Merge only after review. This release has no runtime rollout and no ACA deploy. A future controlled
apply-record PR must attach actual Azure what-if output, parsed safety-gate results, deployment IDs,
and zero-data acceptance evidence before any infrastructure creation is considered approved.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: plan references a prior digest and requires refresh before future apply.
- ACA runtime invariant: not applicable because no runtime is deployed or updated.
- Worker image invariant: future apply PR must lock all ACA job definitions to a refreshed digest.
- Feature/env flag update path: none.
- Live signed-in proof required: not applicable until product wiring is separately approved.

## Rollback Plan

Before merge, rollback is deleting the plan package and this release record. After merge, rollback is
a docs-only revert. No Azure, PostgreSQL, or tenant data rollback is needed because this PR does not
mutate those layers.

## Audit Evidence

- Phase 0 merge commit: `dc6e3bf7e67103eaa25755326f3911a2ec22c01f`.
- Frozen release ID: `healthcare-demo-new-source-corpus-v1.0.0`.
- Approval manifest SHA:
  `06f645913353988eb722eeccb2b89ee5f7d96fbf2b4c60d86d6bff3bee4412fd`.
- Local validation command: `node scripts/knowledge/validate-healthcare-phase1-plan.mjs`.

## Known Gaps

- Azure what-if has not been run in this plan PR.
- Resource creation is not authorized.
- PostgreSQL bootstrap and RLS are Phase 2.
- Source landing is Phase 3.
- Parser waves, graph projection, reconciliation, and publication are later phases.
- AGE evaluation remains later-only and must follow the Phase 3C-2D evaluation thresholds.
- Product wiring and client-visible runtime claims remain prohibited until a certified published
  baseline exists.
