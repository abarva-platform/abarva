# Layer Refresh Status V2

Source SHA: `d7b2de2aac93cc379052a45f9e730281bb328236`

This is a report-only artifact generated from a detached `origin/main` worktree. Tenant identifiers are anonymized for public-repo disclosure discipline.

## Direct Answer

**No, all data layers are not yet refreshing from new source files.** Layer 2 dry-run is clean, but Layer 3 canonical writes, graph materialization, Layer 4 projection refresh, data-plane loads, and live proof remain closed.

## Layer Status

- Layer 1: 172 active source files across 7 active packages; 39 active files are not declared in the template contract.
- Layer 2: 133/133 dry-run rows are `would-run`; total failures 0.
- Layer 3: scaffold only; 19 object definitions, 11 fact-authority definitions, 40 relationship entries; canonical objects written 0.
- Graph: 9633 rows, 4454 candidates, 5179 quarantined; graph tables written false.
- Layer 4: 0/35 product surfaces refreshed.

## L1 Undeclared File Classification

| Class | Count | Proposed disposition |
| --- | ---: | --- |
| `genuine_new_source_contract_candidate` | 32 | Propose as a new owner-scoped AI source family; do not amend template-manifest.json without explicit approval. |
| `variant_of_declared_or_parallel_csv_source` | 5 | Prefer the declared CSV where present; keep the workbook quarantined from downstream refresh unless the intake contract explicitly accepts workbook variants. |
| `source_triage_required` | 2 | Hold outside downstream refresh until the source owner classifies it as a contract source, declared-file variant, or intake-root artifact. |

## Graph Quarantine Disposition

| Reason | Count | Disposition |
| --- | ---: | --- |
| `unresolved-to-node` | 3440 | Do not create synthetic nodes. Either catalogue the referenced object in the owning dimension from real evidence, or retire/drop the edge from materialization. |
| `unresolved-from-node` | 2713 | Do not create synthetic nodes. Either catalogue the referenced object in the owning dimension from real evidence, or retire/drop the edge from materialization. |
| `missing-from-object-name` | 519 | Permanent quarantine until upstream fields are populated from a real source or the tenant is declared to have no materializable graph for that slice. |
| `missing-to-object-name` | 519 | Permanent quarantine until upstream fields are populated from a real source or the tenant is declared to have no materializable graph for that slice. |
| `missing-from-object-type` | 510 | Permanent quarantine until upstream fields are populated from a real source or the tenant is declared to have no materializable graph for that slice. |
| `missing-relationship-type` | 510 | Permanent quarantine until upstream fields are populated from a real source or the tenant is declared to have no materializable graph for that slice. |
| `missing-to-object-type` | 510 | Permanent quarantine until upstream fields are populated from a real source or the tenant is declared to have no materializable graph for that slice. |

## Per-Tenant Anonymized Summary

| Tenant | L1 files | Undeclared files | L2 would-run | L2 failures | Graph candidates | Graph quarantined | L4 refreshed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| tenant-01 | 23 | 4 | 19 | 0 | 10 | 1703 | 0/5 |
| tenant-02 | 23 | 4 | 19 | 0 | 0 | 380 | 0/5 |
| tenant-03 | 24 | 5 | 19 | 0 | 1462 | 840 | 0/5 |
| tenant-04 | 23 | 4 | 19 | 0 | 0 | 364 | 0/5 |
| tenant-05 | 23 | 4 | 19 | 0 | 0 | 519 | 0/5 |
| tenant-06 | 25 | 6 | 19 | 0 | 0 | 1037 | 0/5 |
| tenant-07 | 31 | 12 | 19 | 0 | 2982 | 336 | 0/5 |

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
- `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-v2-layer-refresh.TD3w2Z/tenant-input-quality`
- `npm run validate:context-corpus`
- `node scripts/tower/fact-lineage-report.mjs`
- `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out /tmp/nexus-v2-layer-refresh.TD3w2Z/layer-reconciliation --no-package`
- `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-v2-layer-refresh.TD3w2Z/graph-reconciliation`

