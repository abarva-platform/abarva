# Layer Refresh Status V2

Source SHA: `c4d5afd301ab24ec23ed86510f06469255b1b807`

This is a report-only artifact generated from the current worktree. Tenant identifiers are anonymized for public-repo disclosure discipline.

## Direct Answer

**No, all data layers are not yet refreshing from new source files.** Layer 2 dry-run is clean, but Layer 3 canonical writes, graph materialization, Layer 4 projection refresh, data-plane loads, and live proof remain closed.

## Layer Status

- Layer 1: 55 active source files across 2 active packages; 17 active files are not declared in the template contract.
- Layer 2: 38/38 dry-run rows are `would-run`; total failures 0.
- Layer 3: scaffold only; 19 object definitions, 11 fact-authority definitions, 40 relationship entries; canonical objects written 0.
- Graph: 5620 rows, 5556 candidates, 64 quarantined; graph tables written false.
- Layer 4: 0/10 product surfaces refreshed.

## L1 Undeclared File Classification

| Class                                        | Count | Proposed disposition                                                                                                                                          |
| -------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `genuine_new_source_contract_candidate`      |    12 | Propose as a new operational or maturity source candidate; do not flow to L3/L4 until the intake owner and template contract are approved.                    |
| `variant_of_declared_or_parallel_csv_source` |     5 | Prefer the declared CSV where present; keep the workbook quarantined from downstream refresh unless the intake contract explicitly accepts workbook variants. |

## Graph Quarantine Disposition

| Reason               | Count | Disposition                                                                                                                                                     |
| -------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unresolved-to-node` |    64 | Do not create synthetic nodes. Either catalogue the referenced object in the owning dimension from real evidence, or retire/drop the edge from materialization. |

## Per-Tenant Anonymized Summary

| Tenant    | L1 files | Undeclared files | L2 would-run | L2 failures | Graph candidates | Graph quarantined | L4 refreshed |
| --------- | -------: | ---------------: | -----------: | ----------: | ---------------: | ----------------: | -----------: |
| tenant-01 |       24 |                5 |           19 |           0 |             2302 |                 0 |          0/5 |
| tenant-02 |       31 |               12 |           19 |           0 |             3254 |                64 |          0/5 |

## Gates Left Closed

- No template-manifest.json amendment.
- No tenant data mutation, movement, deletion, or generated prose.
- No Azure/Postgres write or data-plane load.
- No registry/canonical store activation.
- No graph table materialization.
- No Layer 4 projection or product runtime refresh.
- No live-client truth claim.

## Verification Commands

- `npm run release:check`
- `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-tenant-input-quality-20260816`
- `npm run validate:context-corpus`
- `node scripts/tower/fact-lineage-report.mjs`
- `reports/tenant-layer-refresh-current`
- `reports/runtime-layer-refresh/latest/graph-reconciliation`
