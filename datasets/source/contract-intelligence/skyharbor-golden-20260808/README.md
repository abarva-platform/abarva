# SkyHarbor Golden Contracts Source Evidence Package

Generated: 2026-08-08
Tenant: skyharbor_global
Dataset version: v4-golden-contract-evidence
Status: synthetic demo package, not loaded

## Purpose

This package creates two true golden contracts for Source Contract 360 and Door 1 optimization:

1. CTR-090 - Vantage Data Platform Agreement 3
2. CTR-061 - Northgate Cloud Platform Agreement 2

The package is designed to align before loading. It contains client-facing extraction templates, populated synthetic source-system extracts, a data dictionary, reconciliation totals, and a compact UI wireframe for the Contract 360 redesign.

## Collection Rule

Use source-system extracts first. PDFs and contract documents provide terms, scope, rates, obligations, and clauses; systems of record provide invoices, usage, SLA, credits, and finance confirmation. Do not invent values. Blanks become evidence gaps.

## Required Signoff Before Load

- Vendor management or legal operations confirms contract terms and pricing schedule.
- AP/procurement operations confirms invoice and PO extracts.
- Service owner/platform admin confirms usage and SLA extracts.
- Finance confirms realized value rows.

## Generated Files

- manifest.json - n/a rows - sha256 2a0274f1de3c99dbbbade7228e97ec28a060dae1a0241115a7675243acfcf848
- templates/field_level_extraction_guide.csv - 14 rows - sha256 59f9ab5e7b3f1a29dc85129bf966e4123e73fc3dd9f4ce7472b23bcca1d2baad
- templates/evidence_source_inventory.csv - 20 rows - sha256 0353a9352667fbb5f89388602c68bff26bdcf46b3b1b85c799c644f785fbecbb
- synthetic/contract_overview.csv - 2 rows - sha256 4bac11ae9505ee6878349d83d7972c4b1f6f85e9e06d3e239622efa9727e3220
- synthetic/contract_pricing_schedule.csv - 10 rows - sha256 cb0a49b353e355e9b16a6bc166bace9495185a103d77a469e36725354336efd4
- synthetic/invoice_lines.csv - 96 rows - sha256 7fcc126e62931f0c126e700c757b5dee0079d39eec85a7a63316c60851a62b8f
- synthetic/po_contract_match.csv - 6 rows - sha256 0d206d0edaae0165a75fe5adb701b3f939aeb4b5e27fe62332f16834356645c2
- synthetic/usage_entitlement_monthly.csv - 192 rows - sha256 bdd8fcbb4d15a8085d3c7d4fb492a0c60a5d6881394ba84a4f4a6702201fbdb7
- synthetic/sla_incident_service_credit_monthly.csv - 48 rows - sha256 fa98e4ecec693e99411dca895a5dc7e38cb81b58ef2387f867a963f037e5a6c0
- synthetic/rate_card_variance.csv - 6 rows - sha256 eb76fc5faee9a1f25b4ac53acb84ae8a43c2d05988f0dd989adee2c3534698c5
- synthetic/renewal_negotiation_history.csv - 6 rows - sha256 e5d3784ec7847fd9cee2805dd94885dda0abbba893ad527dfd9325d14b9723d7
- synthetic/finance_value_confirmation.csv - 2 rows - sha256 2dd092e7343e0724c299a7ee84eceb1f51b1959b328245d85282fb37aeab854d
- synthetic/contract_application_scope.csv - 8 rows - sha256 efcc13ad05c4aff16f46a00a5039a91cddd4125488a8546d8150c10ed0336ca1
- reconciliation/golden_contract_reconciliation.csv - 2 rows - sha256 c69fbf619f0bfbf7760e9f9a5e335e1e51d4af592f563cce6a5851e08ea03f4e
- story/contract_fact_based_talk_track.csv - 12 rows - sha256 dae03127655dc3227e2cd3aad8aeca47b6149edd5e648247a6b609b5bcb4ebe3
- implementation/parser_persistence_mapping.csv - 10 rows - sha256 abf4a4ce7f1dc36e944aa9b74727a83daba86162e012573b408c8a91c8655ccc
- wireframe/CONTRACT360_GOLDEN_UX_SPEC.md - n/a rows - sha256 87add049101ddf07fecb05a8656b2a0fbaf000722ded22dd08301de16946cacb

## What Contract 360 Should Show After Load

- Decision: rank, why this contract, why now, four-ledger values, next action.
- Scope: plain-English overview, function/system map, contract line-item table.
- Economics: actual spend, invoice exceptions, PO coverage, contract-to-actual bridge.
- Performance: SLA attainment, incidents, credits earned/claimed/received over 24 months.
- Leverage: benchmark rights, alternatives, renewal timing, discount/term levers.
- Evidence: source files, source systems, source record ids, review status, row lineage.
