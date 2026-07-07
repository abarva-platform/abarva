---
title: "README — Load Notes"
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

## LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1

Fully synthetic enterprise context pack for **Lakeshore Holdings** (`lakeshore-holdings`).

- **Files:** 133 source documents (excludes root manifest/dictionary/register).
- **Watermark:** every file carries `SYNTHETIC / LAKESHORE PILOT / NOT REAL DATA` in content + metadata.
- **manifest.json** at ZIP root carries per-file: context_domain, source_owner,
  source_system, source_date, sensitivity, synthetic_flag, evidence_usable_flag, loader_route.

## How to load (Setup Admin)

1. Go to `/admin/context-layer/uploads` while switched to the Lakeshore tenant.
2. Use the **Bulk / ZIP** connector; upload `LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1.zip`.
3. Choose mode `stage_and_process` (structured) / `stage_and_enqueue` (rich docs).
4. Confirm attestation; the loader stages to Azure Blob `context-uploads/` and
   commits chunks to `enterprise_context_chunks`.
5. Run `npm run embed:pending-chunks -- --tenant lakeshore-holdings` (requires OPENAI_API_KEY)
   and the Azure AI Search backfill to make chunks searchable.

## Files per domain

- **ai_use_cases_moves**: 11
- **data_analytics_reporting**: 11
- **enterprise_profile**: 9
- **finance_performance**: 11
- **it_systems_architecture**: 14
- **manifest**: 4
- **operations_business_process**: 9
- **org_decision_rights**: 8
- **risk_controls_responsible_ai**: 12
- **servicenow_support_workload**: 10
- **strategy_initiatives**: 9
- **treasury_kyriba**: 14
- **vendors_contracts_source**: 11
