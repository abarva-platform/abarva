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

<!-- LAKESHORE_PROBE_RESULT -->

## Honest state

- Lakeshore is **loader-backed synthetic context**, committed + indexed +
  retrievable (per the 2026-06 audits). What WS-E adds is the **canonical
  governance wrapping** (manifest + dimension map + the governed path + live
  answer-quality verification) so Lakeshore is treated identically to every
  other canonical tenant — not a one-off load.
- Setup/admin approval-ledger rows (`pilot_ingestion_*`) were not part of the
  original Lakeshore load; future loads via the WS-C path produce them.
