# SkyHarbor Air Group V6 Synthetic Intelligence Pack

Generated: 2026-06-30T00:00:00.000Z

This pack was generated from the existing V4 tenant pack into the shared Enterprise Intelligence V6 contract and enriched with a focused CTO/IROPS readiness storyline.

## Contract Rules

- Every tenant has the same V6 template files.
- Every V6 file has the same headers as the template pack.
- Every column is documented in `V6_BUSINESS_METADATA_DICTIONARY.csv`.
- Missing facts are explicit `data_thin:*` values and are also summarized in `known_gaps`.
- Industry corpus and expert lenses are advisory context, not tenant fact.
- The CTO/IROPS enrichment keeps facts in V6 rows; derived packets may assemble them but must not hide extra prompt-only facts.

## CTO/IROPS Enrichment

Principle: Advise now. Prove progressively. Upgrade to board-grade when evidence arrives.

Focused additions:

- 12 IROPS-critical systems
- 16 IROPS data assets/integrations
- 8 AI initiatives
- 8 modernization programs
- 8 planning spend lines
- 12 risks/controls
- 32 typed relationships
- 12 evidence sources
- populated expert lenses for airline CTO, IROPS, data readiness, AI governance, architecture modernization, and sourcing/commercial risk

## Summary

- Files: 16
- Rows: 14453
- Data-thin cells: 66466

| File | Family | Rows | Data-Thin Cells |
| --- | --- | ---: | ---: |
| `templates/V6_01_enterprise_profile.csv` | enterprise_profile | 1 | 2 |
| `templates/V6_02_business_functions.csv` | business_function | 55 | 110 |
| `templates/V6_03_org_ownership.csv` | org_ownership | 66 | 276 |
| `templates/V6_04_workforce_personas.csv` | workforce_persona | 18 | 36 |
| `templates/V6_05_applications_systems.csv` | application_system | 956 | 8276 |
| `templates/V6_06_data_assets_integrations.csv` | data_asset_integration | 2236 | 17760 |
| `templates/V6_07_vendors_contracts.csv` | vendor_contract | 320 | 2560 |
| `templates/V6_08_spend_value.csv` | spend_value | 491 | 2533 |
| `templates/V6_09_programs_initiatives.csv` | program_initiative | 308 | 3360 |
| `templates/V6_10_ai_initiatives.csv` | ai_initiative | 355 | 4574 |
| `templates/V6_11_operations_risk_controls.csv` | operations_risk_control | 1522 | 6421 |
| `templates/V6_12_relationships.csv` | relationship | 7230 | 17907 |
| `templates/V6_13_evidence_sources.csv` | evidence_source | 92 | 320 |
| `templates/V6_14_metric_definitions.csv` | metric_definition | 306 | 972 |
| `templates/V6_15_industry_corpus_patterns.csv` | industry_corpus_pattern | 489 | 1343 |
| `templates/V6_16_expert_lenses.csv` | expert_lens | 8 | 16 |
