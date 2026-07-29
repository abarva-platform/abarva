# Phase 2B-3C Azure Lab Implementation Charter

Generated: 2026-07-27

Purpose: move HC Demo New from local physical conformance into a governed Azure lab foundation and real source-to-knowledge run.

This package is an implementation lock, not an Azure apply. It freezes the boundary that is already approved, identifies missing Azure names that must be approved before provisioning, and packages the certified source corpus and evaluator-only separation contract for the first real run.

## Frozen tenant identity

- Tenant key: `hc-demo-new`
- Display name: `HC Demo New`
- Environment: `lab`
- Region: `eastus`
- Dedicated PostgreSQL server: `pg-abarva-hc-demo-new-lab-eus-001`
- Dedicated database: `abarva_hc_demo_new_knowledge_lab`
- Dedicated storage account: `stabhcdemonewlab001`
- Storage root: `hc-demo-new/`

## Non-negotiable boundaries

- Dedicated HC Demo New server/database only; do not load into the shared application database.
- No production product route, Home/V2/V4, Intelligence, Moves, Source, or Tower code changes in this phase.
- No `TENANT=all`, blank tenant, wildcard tenant, or tenant list.
- No public PostgreSQL or public storage fallback.
- No local DB passwords in Container Apps Jobs.
- Hidden truth and source-to-truth crosswalks are evaluator-only and must be invisible to parser, Claude, runtime, Home, and module projections.
- Claude output can land only in candidate working tables; it cannot seed accepted truth/read models.

## Current decision state

Status: **STOP BEFORE AZURE APPLY**.

Reason: the approved artifacts freeze tenant/database/storage/identity/process names, but this charter remains plan-only until Azure apply authority is separately granted and recorded. The current execution package reserves fourteen ACA jobs, including baseline publication, Home read-model refresh, reconciliation audit, and metric parity.
