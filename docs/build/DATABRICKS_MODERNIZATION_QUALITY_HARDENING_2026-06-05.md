# Azure Databricks Modernization Quality Hardening

Date: 2026-06-05

## Purpose

This hardening note turns the modernization pattern pack from a good framework into a stronger
CDAO-grade operating doctrine. It is written for Sentinel, Nexus, Source, Atlas, and Steward
grounding. The intent is not to claim exact Meridian source counts. The intent is to teach the
agents how to reason honestly about Epic, ERP, third-party datasets, silver/gold modeling, and
Databricks ingestion estimates until governed inventories are loaded.

## What Changed

The Meridian modernization overlays should now carry explicit vocabulary for:

- Azure Databricks Lakehouse
- Unity Catalog
- medallion architecture
- bronze, silver, and gold layers
- Delta tables
- Lakebridge or equivalent analyzer inventory
- Databricks Asset Bundles
- DLT or Lakeflow-style pipeline orchestration
- DBU/TCO controls
- Lakehouse Federation
- Epic Clarity and Caboodle
- FHIR bulk export
- ERP finance, HR, supply-chain, and procurement sources

Agents should use these terms when the user asks about Azure Databricks modernization, Epic
analytics modernization, healthcare CDAO planning, SI bid normalization, or lakehouse sourcing.

## The Honest Answer On Epic Table Counts

We should not claim a universal number of Epic tables. A health system's useful analytics footprint
depends on modules licensed, Clarity/Caboodle usage, custom extracts, reporting estate, historical
depth, local extensions, payer contracts, value-based-care scope, and operational use cases.

The right agent behavior is:

1. Ask whether the governed context loader has an Epic inventory, Clarity/Caboodle extract list,
   report inventory, interface inventory, and BI/dashboard inventory.
2. If loaded, estimate from observed objects.
3. If not loaded, use a planning range and label it as a planning range.

## Planning Ranges By Use Case

These are not facts about Meridian until loaded. They are planning bands for CDAO sizing.

| Use case | Epic / clinical source objects | Non-Epic sources | Transformation jobs | Gold outputs | Typical reports / dashboards |
|---|---:|---:|---:|---:|---:|
| Clinical operations command center | 50-150 | 10-35 | 40-120 | 8-20 | 15-50 |
| Population health / risk stratification | 75-250 | 20-80 | 75-200 | 12-35 | 25-80 |
| Revenue cycle / denial analytics | 75-200 | 20-60 | 60-160 | 10-30 | 30-100 |
| Quality measures / HEDIS / stars | 100-300 | 20-75 | 80-220 | 15-40 | 30-120 |
| Patient access / scheduling | 40-120 | 10-35 | 35-100 | 8-18 | 15-60 |
| Supply chain and perioperative margin | 30-100 | 20-80 | 40-120 | 8-25 | 15-60 |
| Workforce / productivity | 20-75 | 20-60 | 35-100 | 8-20 | 15-60 |
| Ambient documentation value chain | 30-90 | 10-35 | 30-90 | 8-18 | 10-40 |

Agent rule: never turn these into precise commitments. Say "planning range" unless a loaded source
inventory proves a narrower count.

## Third-Party Dataset Doctrine

Healthcare analytics needs different external datasets depending on whether the buyer is a provider,
a health plan, or an integrated delivery-and-financing system.

| Dataset family | Why it matters | Best fit |
|---|---|---|
| AHRQ HCUP | All-payer hospital utilization and encounter-level benchmarks for inpatient, ED, ambulatory surgery, readmission, utilization, and market-level comparisons. | Provider and system strategy |
| CMS public data | Provider compare, enrollment, program use, payment, Medicaid/CHIP, Marketplace, Open Payments, and public provider data. | Provider, plan, compliance, market analytics |
| CMS Limited Data Sets | Beneficiary-level health information without direct identifiers, governed by CMS request and data-use rules. | Advanced research and actuarial analytics |
| CMS-HCC / risk adjustment mappings | Diagnosis-to-risk model logic for Medicare Advantage and risk-adjusted plan economics. | Plan business and provider risk-contract analytics |
| CDC / NCHS | Mortality, survey, linked public-health and demographic datasets. | Population health and outcomes analytics |
| SDOH / Census / ACS / ADI | Community need, access, deprivation, transportation, language, housing, food, and equity context. | Population health, access, equity |
| State APCD / HIE / immunization / public-health feeds | Local market utilization, claims, encounter, immunization, and reporting context. | Provider and plan regional intelligence |
| Reference vocabularies | ICD-10, CPT/HCPCS, NDC, LOINC, SNOMED CT, RxNorm, DRG/APR-DRG, revenue codes, place-of-service. | All domains |

Source anchors:

- AHRQ describes HCUP as a family of databases and tools with all-payer, encounter-level inpatient,
  ED, and ambulatory surgery information.
- CMS describes public data products as de-identified public datasets, tables, dashboards, mapping
  tools, downloads, views, and APIs across CMS open data sites.
- CMS describes Limited Data Set files as beneficiary-level health information available under
  data-use rules without specific direct identifiers.

## Provider/Hospital Analytics Versus Plan Analytics

Provider and plan analytics overlap, but the decision models are different.

Provider / hospital analytics:

- census, throughput, length of stay, ED boarding, OR utilization, discharge delay
- quality, safety, readmissions, mortality, infection, sepsis, deterioration, falls
- service-line margin, contribution margin, DRG yield, payer yield, denial leakage
- clinician productivity, panel size, access, no-show, schedule utilization
- supply, implant, pharmacy, 340B, preference-card variance
- documentation, coding, CDI, charge capture

Plan business analytics:

- enrollment, eligibility, member months, churn, acquisition, retention
- risk adjustment, HCC capture, coding completeness, suspect conditions
- claims cost, PMPM, MLR, trend, IBNR, utilization management
- network adequacy, provider performance, leakage, steerage
- Star ratings, HEDIS, CAHPS, medication adherence
- prior authorization, appeal, grievance, fraud/waste/abuse

Integrated system analytics:

- attributed lives and panel economics
- contract performance by payer, network, facility, service line, and cohort
- total cost of care
- avoidable utilization
- care-gap closure
- access-to-outcome chain
- risk-contract margin
- clinical quality plus financial yield

## KPI Families That Matter

| Domain | KPIs |
|---|---|
| Clinical operations | ADC, ALOS, LOS index, discharge before noon, ED boarding hours, left-without-being-seen, bed turns, transfer acceptance |
| Quality and safety | readmissions, mortality, complications, HAIs, sepsis bundle compliance, falls, pressure injuries, adverse drug events |
| Revenue cycle | net collection rate, denial rate, preventable denial rate, days in AR, clean-claim rate, coder productivity, CDI query response, underpayment recovery |
| Population health | risk score, gap closure, avoidable ED, admission rate per 1,000, medication adherence, chronic-condition control, equity gaps |
| Patient access | third-next-available appointment, schedule utilization, referral leakage, no-show rate, call abandonment, digital completion |
| Workforce | vacancy, overtime, premium labor, productivity, turnover, span of control, agency spend, training completion |
| IT/data platform | pipeline freshness, data-quality pass rate, lineage coverage, access-control exceptions, DBU spend, job failure rate, report retirement |
| AI governance | model inventory completeness, drift alerts, override rate, accepted recommendation rate, validation coverage, incident count |

## Silver Versus Gold Model Doctrine

Bronze:

- Preserve raw or near-raw source shape.
- Capture source system, extract timestamp, load batch, file/API/interface id, and PHI classification.
- Do not over-normalize.

Silver:

- Normalize identity, encounter, provider, department, location, payer, diagnosis, procedure, order,
  medication, observation, claim, invoice, supply, workforce, and contract entities.
- Reconcile Epic/ERP/source-system grain differences.
- Apply standard terminology mappings and minimum data-quality rules.
- Store conformed dimensions and atomic facts.

Gold:

- Publish business-ready data products such as patient 360, provider performance, service-line
  margin, denial workbench, quality measure mart, risk-contract mart, access command center, and
  AI feature/label store.
- Every gold product needs owner, SLA, freshness target, lineage, quality checks, access policy,
  retention rule, and downstream report/application consumers.

Agent rule: if a user asks "what should go in silver versus gold," answer in terms of grain,
ownership, data quality, lineage, and decision use, not just table names.

## Estimating Integrations, Tables, ETL, And Reports

Use this formula when the inventory is not loaded:

`modernization_scope = source_objects + inbound_feeds + transform_jobs + semantic_outputs + reports + operational_consumers`

| Driver | What to count |
|---|---|
| Source objects | Clarity/Caboodle/FHIR objects, ERP tables/views, vendor extracts, flat files, APIs |
| Inbound integrations | HL7 v2 feeds, FHIR APIs, batch files, CDC streams, SFTP drops, ERP interfaces, claims feeds |
| Transform jobs | DataStage jobs, SQL stored procedures, dbt models, SAS programs, notebooks, scheduled scripts |
| Semantic outputs | marts, gold tables, metrics layers, feature sets, governed data products |
| Reports | Tableau, Power BI, BusinessObjects, Epic reports, operational dashboards, extracts |
| Operational consumers | AI models, worklists, APIs, downstream apps, vendors, regulatory submissions |

Planning ratios:

- One source object rarely maps to one output table.
- One inbound interface can create many bronze objects and many silver transformations.
- One report can depend on many upstream objects, but many reports may collapse into one gold data product.
- Stored procedure and SAS migration effort is driven more by logic complexity than row count.
- Table count alone is a weak estimator unless paired with transformation complexity and report consumption.

## Metadata-Driven ETL Framework For Databricks

A credible Databricks ingestion framework for Epic and ERP should have these control tables:

| Control table | Purpose |
|---|---|
| `source_system_registry` | Epic, ERP, HR, supply chain, payer, claims, external datasets |
| `source_object_registry` | table/view/API/file/feed, owner, PHI class, extract pattern |
| `ingestion_contracts` | schedule, load type, CDC key, watermark, schema drift policy |
| `bronze_landing_manifest` | file/API batch id, checksum, source timestamp, load timestamp |
| `data_quality_rules` | required fields, referential checks, value ranges, duplicate rules |
| `lineage_edges` | source-to-bronze-to-silver-to-gold relationships |
| `privacy_access_policy` | Unity Catalog policy group, PHI tag, masking, row/column rules |
| `reconciliation_controls` | source row counts, financial totals, claim totals, encounter totals |
| `pipeline_run_ledger` | job status, retries, exceptions, owner, SLA breach |
| `gold_product_catalog` | business owner, metric definitions, consumers, refresh SLA |

The target operating model:

1. Land raw data into bronze with metadata and lineage.
2. Normalize into silver by entity and event grain.
3. Publish gold data products by decision domain.
4. Govern with Unity Catalog or equivalent policy, audit, and lineage.
5. Operate with pipeline run ledgers, data-quality checks, and cost tags.
6. Estimate with real inventory first; otherwise disclose planning-range assumptions.

## Golden Question Themes

The golden deck added with this hardening pass covers:

- Epic table-count honesty
- HCUP, CMS, SDOH, and risk-adjustment dataset fit
- provider versus plan analytics
- silver/gold medallion boundaries
- metadata-driven ETL
- integration versus table versus report estimating
- Unity Catalog and PHI governance
- DBU/TCO and FinOps
- SI bid normalization
- Lakebridge/analyzer intake
- cross-tenant refusal
- stale Meridian profile rejection

## Agent Answer Standard

For Azure Databricks modernization questions, a strong answer should include:

1. Tenant context: Meridian is a Sacramento-based integrated health system with a 30+ hospital
   footprint.
2. Decision frame: what the executive needs to decide.
3. Modernization doctrine: Unity Catalog, medallion, Delta, Lakebridge/analyzer inventory,
   metadata-driven ingestion, DBU/TCO, and governance.
4. Evidence basis: loaded context fields or a clear statement that inventory is not loaded.
5. Planning range: only where exact counts are unavailable.
6. Next move: the concrete artifact to create, load, or validate.

