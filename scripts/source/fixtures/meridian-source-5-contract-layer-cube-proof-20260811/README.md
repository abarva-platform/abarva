# Meridian Source 5-Contract Layer/Cube Proof

SYNTHETIC DEMO DATA - NOT CLIENT DATA - PHI-FREE - OFFLINE SOURCE LAYER/CUBE PROOF ONLY

Scenario as-of date: 2027-06-30

This package is a generated companion report package. It does not overwrite Meridian V3 tenant-input files. It does not load Azure/Postgres, update Active Tenant Access, backfill retrieval indexes, deploy, or make a live-product/client claim.

## Current Meridian Sufficiency

The current Meridian files are not sufficient for a Source-deep five-contract package before enhancement. They provide planning context and several managed-services cues, but they do not contain five operative contract families with document inventory, hashes, page/span clause evidence, scope, pricing, AP/PO/invoice lines, SLA/KPI events, transition evidence, reviewer decisions, conflicts, calculations, or read-model/cube outputs.

## Generated Contract Panel

- MER-CTR-RCM-001: Revenue Cycle Managed Services (existing_contract_optimize_hero)
- MER-CTR-HR-BPO-001: HR Operations Payroll Benefits BPO (new_event_hr_bpo)
- MER-CTR-FIN-BPO-001: Finance Accounting Operations BPO (new_event_finance_bpo)
- MER-CTR-SC-BPO-001: Supply Chain Procure-to-Pay Operations BPO (new_event_supply_chain_bpo)
- MER-CTR-SSO-BPO-001: Shared Services Transition Multi-process BPO (shared_services_governance_control)

## Layer Outputs

- Layer 1 client intake/native feeds: source-owner organized extracts in `source_system_extracts/`.
- Layer 2 adapters: `layer2_adapter_outputs/adapter_contract_outputs.csv`.
- Layer 3 canonical: contracts, suppliers, evidence, facts, and calculations in `layer3_canonical/`.
- Layer 4 Source read models: portfolio, contract 360 case rooms, opportunities, and evidence gates in `layer4_source_read_models/`.
- Layer 4 Tower/cube proof: `layer4_tower_cube/tower_source_cube.csv` with blocked/allowed flags.

## Counts

- Contracts: 5
- Documents: 55
- Clause rows: 220
- Native/source extract rows: 806
- Adapter rows: 5
- Canonical rows: 95
- Source read-model rows: 70
- Cube rows: 20
- Depth review rows: 110

## Gate Summary

- MER-CTR-RCM-001 has evidence available, diagnosis ready, and limited offline optimize action allowed; Finance value is only partially proven and remains synthetic.
- MER-CTR-HR-BPO-001, MER-CTR-FIN-BPO-001, MER-CTR-SC-BPO-001, and MER-CTR-SSO-BPO-001 are intentionally blocked for action, vendor outreach, and value claims by unresolved conflicts/control gates.

## Validation

See `validation/validation_results.json`. The package validates manifest hashes for payload files, document inventory hashes, CSV row shapes, distinct role-specific document bodies, evidence links, fact assertions, native calculation inputs, economics support rows, unresolved-conflict gate blocking, date alignment, and depth-gate separation.

## Vendor 360 Offline Preview

Added an offline CPO-facing Vendor 360 preview under `layer4_vendor360_preview/`. It explains source-system extract mapping, native grain, Layer 1 -> Layer 4 movement, Vendor 360 card outputs, and blocked/allowed action gates. This is not runtime wiring and does not read from Azure/Postgres.
