# Lakeshore — Canonical Reconciliation (WS-E) — 2026-06-09

Lakeshore Holdings (`lakeshore-holdings`, diversified / private-holdings) is
**already loaded** (per `LAKESHORE_LIVE_DATA_AUDIT_2026-06-05.md` +
`LAKESHORE_PRIVATE_PLANE_VECTOR_PROOF_2026-06-06.md`): 1,329 context records
across 9 segments, ~8,987 docs in the `lakeshore-patterns-v1` Azure Search index,
Kyriba treasury patterns vector-proven, 2 Source events, 6 Moves, CIO/CFO
personas. WS-E **reconciles** that load into the canonical
`CONTEXT_FRAMEWORK_v1` dimensions and the governed Admin bulk path — it is not an
empty tenant.

## Source → canonical dimension map

Source CSVs: `docs/build/lakeshore/loaded/data/*.csv` (18) +
`docs/build/lakeshore/current-state-load-v2/data/*` (admin-style).

| Loaded CSV | CONTEXT_FRAMEWORK_v1 dimension |
|------------|-------------------------------|
| `org-roles.csv` | organization_leadership |
| `enterprise-profile.csv`, `segment-pnl.csv` | company_scale |
| `financial-kpi-workbook.csv` | financials_kpis |
| `application-portfolio.csv`, `integration-topology.csv` | systems_applications |
| `erp-landscape-workbook.csv` | systems_applications (ERP) |
| `site-and-plant-inventory.csv`, `infrastructure-estate.csv` | cloud_infrastructure |
| `vendor-contracts.csv` | vendors_contracts |
| `initiative-portfolio.csv` | initiatives_moves |
| `product-portfolio.csv`, `business-capability-map.csv` | operating_model |
| `dora-baseline.csv` | process_workflow / value_ledger_baselines |
| `incidents-change-history.csv`, `qms-events.csv` | risks_controls |
| `ai-tool-footprint.csv` | systems_applications (AI/automation) |
| `data-platform-lineage.csv` | data_platforms_domains |
| `strategy-memo.csv`, `market-signals.csv`, `annual-quarterly-reports.csv` | artifacts_evidence / operating_model |

**Coverage:** all 12 canonical dimensions are represented by Lakeshore's loaded
data. No canonical dimension is empty.

## Reconciliation actions

1. **Manifest declared** —
   `docs/governance/dataset-manifests/lakeshore-holdings-current-state-v1.json`
   (passes `validate:context-corpus manifests`). This brings Lakeshore under the
   same governance gate as any new dataset.
2. **Canonical path** — the `current-state-load-v2` files are already
   admin-loader-shaped (`lakeshore-<dimension>.csv`), matching the WS-C governed
   Admin bulk path; future Lakeshore updates flow through that path with WS-B
   idempotent supersede (no duplicate facts on re-load).
3. **Live validation** — the WS-G answer-quality probe is run for
   `lakeshore-holdings` in-VNet to prove the reconciled load is grounded,
   cited, and tenant-safe (results appended below).

**Execution `job-ws-cde-eus-knkn1w5` → Succeeded** (6 SkyHarbor-style golden
questions for `lakeshore-holdings`, live Sentinel engine, private DB):

| Question | sources | answerability | isolation | leak |
|----------|--------:|---------------|-----------|------|
| leadership | 2 | ANSWERED_AND_GROUNDED | pass | — |
| company_scale | 3 | ANSWERED_AND_GROUNDED | **FAIL** | apex-retail |
| industry_corpus | 3 | ANSWERED_AND_GROUNDED | pass | — |
| move_context | 2 | ANSWERED_AND_GROUNDED | pass | — |
| artifacts_evidence | 0 | **NOT_LOADED** | pass | — |
| kpi_value | 0 | **NOT_LOADED** | pass | — |

**Summary:** 4/6 grounded · 4/6 cited · 0 unsupported · 1 leakage.

### Gaps classified (per the brief)

- **ingestion / retrieval gap** — `artifacts_evidence` and `kpi_value` returned
  no tenant context → derived answerability = `NOT_LOADED`. Lakeshore's artifact
  and KPI dimensions did not surface through the retrieval gate (either not in a
  retrievable segment, or the segment keyword gate did not match). Honest state:
  these two dimensions are NOT answerable for Lakeshore today despite the broader
  load — a real retrieval/ingestion gap, not a fabricated "loaded".
- **tenant isolation gap (P0)** — `company_scale` flagged a cross-tenant
  reference to **apex-retail**. With the precise detector this is a named
  finding; a snippet capture (one-line probe change) confirms real Apex Retail
  leak vs. generic "apex" before the tenant-pin fix. Routed to the
  tenant-isolation lane.
- **grounded** — leadership, company_scale, industry_corpus, move_context are
  grounded + cited on live data, confirming Lakeshore's reconciled load is
  agent-usable for those dimensions.

## Honest state

- Lakeshore is **loader-backed synthetic context**, committed + indexed +
  retrievable (per the 2026-06 audits). What WS-E adds is the **canonical
  governance wrapping** (manifest + dimension map + the governed path + live
  answer-quality verification) so Lakeshore is treated identically to every
  other canonical tenant — not a one-off load.
- Setup/admin approval-ledger rows (`pilot_ingestion_*`) were not part of the
  original Lakeshore load; future loads via the WS-C path produce them.
