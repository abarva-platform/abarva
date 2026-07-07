---
title: "Load Control Plan"
synthetic: true
synthetic_label: "SYNTHETIC / LAKESHORE PILOT / NOT REAL DATA"
pack: LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1
context_domain: manifest
source_owner: "AbarVa Delivery"
source_system: "AbarVa Generator"
source_date: 2026-06-06
sensitivity: Internal
evidence_usable: true
---

> **SYNTHETIC — LAKESHORE PILOT — NOT REAL DATA — ABARVA AI**

## Controlled load sequence

1. Generate pack + manifest (local generated state).
2. Upload ZIP through Setup Admin bulk loader → Azure Blob (`context-uploads`).
3. Parse each file (Document Intelligence / pdf-parse / exceljs / mammoth / Papa).
4. Commit chunks/facts/evidence to Azure Postgres `enterprise_context_chunks`.
5. Refresh Azure AI Search `tenant-context-v1` + vector index.
6. Verify counts by file type, context domain, source system, segment, DB table, search.
7. Signed-in QA against Lakeshore tenant auth state.
8. Publish proof index.

## Truth states (kept separate)

| State              | Meaning                                            |
| ------------------ | -------------------------------------------------- |
| local-generated    | Files exist on disk + in ZIP                       |
| azure-staged       | Original bytes in Azure Blob with retrievable path |
| db-committed       | Rows present in Azure Postgres                     |
| indexed-searchable | Retrievable from Azure AI Search / vector          |
| signed-in-qa       | Answered through the authenticated product         |

## Tenant scoping

- App client key: `lakeshore` · canonical/broker key: `lakeshore-holdings`.
- All chunks carry `tenant_key=lakeshore-holdings` and `client_id` = clients.id UUID.
