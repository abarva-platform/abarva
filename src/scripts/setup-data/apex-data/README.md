# Apex Retail Group — Synthetic Tenant Dataset

**Tenant key:** `apex-retail`
**Generated:** 2026-04-29
**Purpose:** Test dataset for AbarVa knowledge layer. Apex Retail Group is a fictional mid-market specialty retailer used as the lead synthetic tenant for the platform's tenant-grounded reasoning capabilities.

## Tenant personality

Apex Retail Group is a fictional ~$2.4B revenue specialty retailer (apparel + home + lifestyle), publicly traded, ~5,200 employees across 340 stores in North America plus a growing e-commerce channel. Mid-market in retail terms; large enough to have full enterprise IT complexity but small enough that organizational fragility is real.

The personality is **strong customer/martech depth, weak supply chain instrumentation**. Investment in customer data and digital experience has outpaced investment in supply chain modernization. AI investment is skewed to customer-facing use cases (CDP activation, contact-center deflection, demand forecasting at the customer-cohort level) rather than to supply-chain or store-operations AI.

Recent context: a new CDO joined 6 months ago, a major CDP RFP is in flight, the AMS consolidation program is mid-flight after a previous attempt was abandoned 18 months ago, and Q1 earnings missed guidance on margin pressure from e-commerce competition.

## Dataset families

| # | Family | Files | Format |
|---|---|---|---|
| 01 | Enterprise profile | 1 | Markdown |
| 02 | Org structure & people graph | 4 | JSON, CSV, Markdown |
| 03 | IT system landscape | 3 | CSV, JSON |
| 04 | IT financials | 2 | CSV |
| 05 | KPI dictionary | 1 | CSV |
| 06 | Active program inventory | 5 | JSON, Markdown |
| 07 | Sourcing artifacts | 4 | Markdown, CSV |
| 08 | Program deliverables | 4 | Markdown |
| 09 | Evidence ledger | 1 | JSON |
| 10 | Operating telemetry | 3 | JSON, Markdown |
| 11 | Vendor contracts | 2 | CSV, JSON |
| 12 | Compliance & regulatory | 2 | Markdown, JSON |
| 13 | Industry context | 1 | JSON |
| 14 | Cross-program signals | 1 | JSON |

## Realism techniques applied

The dataset has been deliberately built with five techniques that distinguish it from generic demo data:

1. **Imperfection.** ~12% of fields have missing values; some KPIs lack working instrumentation; some systems have "owner: vacant" or "owner: acting"; vendor contracts include 4 with renewals due in <90 days.
2. **Contradictions.** CFO's stated 18% YoY cost-takeout target conflicts with CIO's modernization roadmap. Data classification policy says one thing; actual storage of customer data in 3 systems shows another. Marketing's claimed customer count differs from CDP fragmentation analysis.
3. **History.** Apex's previous AMS consolidation attempt (2023-2024) is documented in the change-failure record. The previous CDO left under unclear circumstances. Two failed initiatives are catalogued with post-mortems.
4. **Specificity.** KPIs have specific definitions with caveats. "NPS — measured 24h post-interaction, 22% response rate, biased toward extreme experiences."
5. **Asymmetric depth.** Customer/martech systems are richly instrumented (~28 systems, dense KPIs). Supply chain has only 4 systems and many KPI gaps.

## Knowledge-layer integration

Each file maps to specific knowledge-layer artifacts:

- Org structure → `enterprise_graph_nodes` of type `person`, `role`; edges of type `REPORTS_TO`, `OWNS`, `SPONSORS`
- IT landscape → `enterprise_graph_nodes` of type `system`, `vendor`; edges of type `OWNED_BY`, `INTEGRATED_WITH`, `LICENSED_FROM`
- KPIs → `enterprise_graph_nodes` of type `kpi`; edges of type `MEASURED_BY`, `OWNED_BY`, `FEEDS_PROGRAM`
- Programs → `enterprise_graph_nodes` of type `program`, `phase`, `gate`; edges of type `SPONSORED_BY`, `LED_BY`, `INVOLVES_VENDOR`
- Evidence → `evidence_ledger` rows, `enterprise_context_chunks` with embeddings
- Documents (deliverables, sourcing artifacts, compliance) → `enterprise_context_chunks` with embeddings, evidence_ledger entries

Provenance is preserved on every record: `source_basis`, `last_updated`, `data_classification`, `approval_state`.

## Tenant boundary

All data in this dataset is scoped to `tenant_key: apex-retail`. The knowledge layer must enforce this scope on every query; cross-tenant retrieval (e.g., from `meridian` or `retired-client` queries) must return zero records from this dataset.
