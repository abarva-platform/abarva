# Healthcare Demo New Phase 1 Infrastructure Execution Package

Status: `plan_only`

This package converts the frozen Phase 0 authority record into a Healthcare-only Azure
infrastructure execution plan. It does not apply Azure infrastructure, run PostgreSQL migrations,
land source files, execute parsers, publish Knowledge, or wire a product surface.

This package is also aligned to the merged Phase 3C-2D consumption contract
(`phase3c2d-consumption-contracts-v1.0.0`, PR #5680). Phase 1 may create only a zero-data
Healthcare lab foundation. Tenant completion later requires publication into versioned
`consumption.*` projections from the approved source corpus, not from legacy Home packs, V6/V7 demo
packs, current module operational tables, old chat/session facts, hidden truth, or evaluator
artifacts.

## Boundary

| Field | Value |
| --- | --- |
| Tenant | `healthcare-demo-new` |
| Frozen release ID | `healthcare-demo-new-source-corpus-v1.0.0` |
| Approval manifest SHA | `06f645913353988eb722eeccb2b89ee5f7d96fbf2b4c60d86d6bff3bee4412fd` |
| Phase 0 merge commit | `dc6e3bf7e67103eaa25755326f3911a2ec22c01f` |
| Authorized phase | Phase 1 zero-data infrastructure plan |
| Expected mutations in this PR | None |

## What This Package Contains

- Final tenant, subscription, resource, network, identity, job, and storage naming plan.
- Bicep parameter file for the reviewed Healthcare lab infrastructure lane.
- Exact Azure what-if and apply command contract, including the required tenant key, release ID,
  and manifest SHA.
- Machine-readable pre-apply report, destructive-change gate, RBAC matrix, private DNS checklist,
  PostgreSQL extension plan, ACA job stage map, rollback plan, and validation summary.
- Machine-readable consumption-contract alignment proving relational Postgres is the initial graph
  substrate, recursive SQL is the initial traversal path, AGE is disabled, and Home/Cube are sibling
  consumers of the same governed consumption layer.

## Hard Stops

The next PR may not apply infrastructure unless all of these are true:

- The Azure account and subscription match `abarva-lab-sub`.
- The command includes `tenant_key=healthcare-demo-new`.
- The command includes `release_id=healthcare-demo-new-source-corpus-v1.0.0`.
- The command includes
  `approval_manifest_sha=06f645913353988eb722eeccb2b89ee5f7d96fbf2b4c60d86d6bff3bee4412fd`.
- Azure what-if has been captured and parsed.
- The what-if result contains creates only and no public-network enablement.
- No Airline blocked manifest, evaluator-only hidden truth, product runtime, or shared ACA web
  runtime is included in the change set.
- No AGE extension or AGE runtime dependency is included in the initial PostgreSQL apply or
  zero-data acceptance path.
- The plan still points at the merged Phase 3C-2D projection registry before any source landing,
  publication, product wiring, Cube certification, or aVa packet exposure is approved.

## Explicitly Out Of Scope

- PostgreSQL schema bootstrap and RLS apply.
- Source landing.
- Parser, enrichment, graph, reconciliation, publication, and read-model jobs.
- Cube, Superset, Observable, Moves, Source, Tower, Home, or Intelligence product wiring.
- Runtime claims that Healthcare Demo New is live.
- Apache AGE setup, `shared_preload_libraries` changes for AGE, AGE graph projection, or AGE as a
  zero-data acceptance dependency.
