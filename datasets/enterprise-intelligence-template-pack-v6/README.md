# Enterprise Intelligence Template Pack V6

Generated: 2026-06-28T20:18:40.646Z

V6 is the clean contract for future client intelligence loads. V4/V5 files are source inputs only; do not edit them in place to create the future contract.

## Non-Negotiable Rule

Every sheet column must have a business metadata name. A column is not V6-valid unless it appears in `V6_BUSINESS_METADATA_DICTIONARY.csv` with:

- business metadata name
- business definition
- business object family
- data type
- required level
- required product surfaces
- allowed answer types
- forbidden claims
- provenance rule
- example value

## Templates

| File | Business Object Family | Purpose |
| --- | --- | --- |
| `templates/V6_01_enterprise_profile.csv` | enterprise_profile | Client identity, business scale, operating model, and strategic context. |
| `templates/V6_02_business_functions.csv` | business_function | Business functions, capabilities, value streams, and executive ownership. |
| `templates/V6_03_org_ownership.csv` | org_ownership | Decision rights, reporting relationships, and technology/business accountability. |
| `templates/V6_04_workforce_personas.csv` | workforce_persona | Roles, populations, work context, and AI relevance for adoption analysis. |
| `templates/V6_05_applications_systems.csv` | application_system | Application, platform, and system inventory with ownership, criticality, costs, dependencies, and AI relevance. |
| `templates/V6_06_data_assets_integrations.csv` | data_asset_integration | Data assets, integration flows, lineage, freshness, quality, and governance. |
| `templates/V6_07_vendors_contracts.csv` | vendor_contract | Vendors, contracts, licenses, renewals, services, pricing, ownership, and risk. |
| `templates/V6_08_spend_value.csv` | spend_value | Spend, budget, value, benefits, unit economics, and commercial evidence. |
| `templates/V6_09_programs_initiatives.csv` | program_initiative | Programs and initiatives with owners, sponsors, budgets, spend, value, dates, dependencies, risks, and decisions. |
| `templates/source_system_export.csv` | ai_initiative | AI use cases, copilots, agents, adoption, model/tool usage, value, risk, readiness, and scale/hold/stop decisions. |
| `templates/V6_11_operations_risk_controls.csv` | operations_risk_control | Operational service, risk, control, compliance, incident, and readiness records. |
| `templates/V6_12_relationships.csv` | relationship | Explicit links between business objects with relationship type, direction, evidence, and confidence. |
| `templates/V6_13_evidence_sources.csv` | evidence_source | Source documents, exports, interviews, benchmarks, and evidence lineage. |
| `templates/V6_14_metric_definitions.csv` | metric_definition | Controlled metric vocabulary, formulas, units, owners, periods, and allowed claims. |
| `templates/V6_15_industry_corpus_patterns.csv` | industry_corpus_pattern | Industry and pattern context used as external lens, not tenant truth. |
| `templates/V6_16_expert_lenses.csv` | expert_lens | Expert perspectives that can be selected for advisory packets. |

## Loader Rule

Missing values must be explicit values such as `unknown`, `not_applicable`, or `data_thin`, with `known_gaps` populated. Missing columns are contract failures.

## Truth Boundary

Industry corpus and expert lenses are advisory context. They are not tenant facts. Tenant-specific claims must be grounded in tenant V6 rows and evidence sources.
