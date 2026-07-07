# 2026-06-09-governance-live-store-columns — Governance Store Catalog Live Schema Binding

## Release ID

`2026-06-09-governance-live-store-columns`

## Status

`candidate`

## Plain-English Summary

This release corrects the Context & Corpus Governance scanner and readiness backfill catalog so it matches the live Azure/Postgres schema for move, evidence, and deliverable stores. The previous catalog assumed every tenant-scoped store used `client_id` and every object used `id`; the live data plane uses `ai_initiatives.initiative_id`, `program_evidence_items.tenant_key`, and `deliverables_v2` scoped through `engagements.client_id`.

## Layer Impact

- `client-data-lane`: Governance inventory and readiness backfill now bind live tenant stores using their real columns and joins.
- `internal-admin`: Operator ACA jobs produce cleaner governance reports and sidecar rows for live tenant objects.

## Client Applicability

- All clients: applies to all canonical tenants scanned by the governance jobs.
- Specific clients: Apex, Meridian, SkyHarbor, Lakeshore, First Capital, and Northstar are directly affected in the live lab data plane.
- Internal only: yes, this changes operator governance scripts only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/scripts/governance/inventory-scan.ts`
- `src/scripts/governance/readiness-backfill.ts`

## QA / Validation

- PASS: `git diff --check`
- PASS: `npm run validate:context-corpus`
- PASS: `npx eslint src/scripts/governance/inventory-scan.ts src/scripts/governance/readiness-backfill.ts`
- PASS: `npx tsc --noEmit --pretty false --incremental false`

## Rollout Plan

Merge to `main`, build a new Azure Container Registry image from `main`, update the private Azure Container Apps operator job to that pinned image, then rerun governance inventory, readiness dry run, readiness commit, and tenant coverage against the private Azure/Postgres data plane.

## Rollback Plan

Revert the PR if the live operator job reveals a regression. Existing `governed_object_readiness` rows are sidecar-only and source data is not mutated.

## Audit Evidence

- PR URL after creation.
- GitHub CI checks.
- Azure Container Apps job logs for the rerun inventory/backfill/coverage sequence.

## Known Gaps

This release does not promote any object to `agent_ready`; promotion still requires separate evidence that objects are indexed, retrievable, and citation-render verified.
