# Lakeshore Current-State Admin Load v2

Generated at: 2026-06-08T12:30:00.000Z

SYNTHETIC / ILLUSTRATIVE. This package is not a real company disclosure.

## Purpose

This governed Admin ZIP closes Lakeshore current-state gaps for CXO questions:
leadership, IT organization, supply-chain organization, private cloud, hybrid
cloud, datacenters, ERP/HCM/treasury systems, supply-chain systems, data and
analytics architecture, vendors/contracts, top KPIs, active initiatives, risks,
controls, business capabilities, and company scale.

## Scale posture

Lakeshore is intentionally a smaller diversified holding-company pilot, closer
to a Morgan Street Holdings / HAVI-style operating model than Apex/Target or
SkyHarbor/Delta. The synthetic profile uses about $4.2B revenue, about 11k
employees, 12 countries, and five operating companies.

## Admin load contract

Upload `lakeshore-current-state-admin-load-v2-production-compatible.zip`
through `/admin/setup` → `Open upload workspace` → Bulk load. Use:

- Mode: Stage to Azure Blob and process now
- Attestation: accepted
- Note: Lakeshore current-state v2 synthetic admin load, generated 2026-06-08T12:30:00.000Z

The production-compatible ZIP contains root `manifest.json` plus structured
CSV/JSON files. It preserves the rich source files while mapping three deeper
dimensions to template IDs accepted by the currently deployed Admin loader:

- infrastructure estate → application portfolio
- data platform lineage → integration topology
- business capability map → strategy memo

The canonical `lakeshore-current-state-admin-load-v2.zip` keeps the deeper
intended template IDs for the branch/deploy that includes the expanded registry.
The governed bulk route expands the ZIP, validates the manifest, stages each
file to Azure Blob, writes tenant-context chunks, persists the job status
receipt, and emits an admin `intelligence.context_refreshed` notification
after success once this branch is deployed.

## Expected evidence

- Blob bucket: `context-uploads`
- Load name: `lakeshore-current-state-v2-production-compatible` for the first
  live production-compatible run; `lakeshore-current-state-v2` for the
  canonical deeper-template package after deployment.
- Files: 13
- Structured records in package: 179
- Source state: `synthetic_admin_loader_backed`

## Truth boundary

The Admin bulk CSV path commits retrievable tenant-context chunks with source
paths and provenance. It does not by itself populate every structured domain
table such as `applications`, `vendor_contracts`, `ai_initiatives`, or
`enterprise_context_facts`. The post-load audit must report those states
separately.
