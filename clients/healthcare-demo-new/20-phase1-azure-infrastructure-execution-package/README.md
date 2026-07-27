# Healthcare Demo New Phase 1 Infrastructure Execution Package

Status: `plan_only`

This package converts the frozen Phase 0 authority record into a Healthcare-only Azure
infrastructure execution plan. It does not apply Azure infrastructure, run PostgreSQL migrations,
land source files, execute parsers, publish Knowledge, or wire a product surface.

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

## Explicitly Out Of Scope

- PostgreSQL schema bootstrap and RLS apply.
- Source landing.
- Parser, enrichment, graph, reconciliation, publication, and read-model jobs.
- Cube, Superset, Observable, Moves, Source, Tower, Home, or Intelligence product wiring.
- Runtime claims that Healthcare Demo New is live.
