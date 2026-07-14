# SkyHarbor Air Derived Enterprise Read: Data Analytics Technology Landscape

Generated: 2026-06-18T23:51:21.307Z

## Executive Read

SkyHarbor is data-rich, but the analytics estate is still hybrid, batch-heavy, and tool-fragmented.

SkyHarbor Air has a large airline data and analytics estate rather than a simple cloud warehouse story. The authoritative current-state sources show Teradata Vantage on AWS, SAS, DataStage, Informatica, Tableau, BusinessObjects, AWS data lake/event streams, mainframe-adjacent operational feeds, SAP reporting/finance flows, and a growing data-product layer.

The important read is not that data is absent. It is that value depends on simplifying movement across 1,800 integrations, 420 data products, legacy/core transaction sources, and overlapping analytics tools before agentic IROPS, customer personalization, or CDP-scale AI can be trusted.

Volumetrically, the estate includes 900 applications/systems, 420 data products, 1,800 integrations/interfaces, $3.1B of analytics-adjacent application run cost, about 247,367 TB represented in data-product notes, 42,918 stated consumers, and 8,754 upstream source references. Specific EDW/platform highlights include 4,800 active EDW tables, 92,000 scheduled workloads/month, 380 SAS production flows, 25,660 DataStage jobs/month, 27,030 Informatica API calls/day, and 740 Tableau dashboards from the platform-volumetrics feed.

Compared with large network carriers, the north star is governed operational data products: real-time IROPS, customer/loyalty identity, maintenance, revenue management, and finance domains with certified semantics, lineage, and control evidence. The current architecture has enough cloud and data assets to move, but the sequence should be rationalization and governance before broad autonomous AI scale.

## Current-State Architecture

- Architecture pattern: Hybrid airline analytics estate: mainframe/core operational feeds plus Teradata/EDW, AWS data workloads, data-lake integrations, SAS/BI/reporting overlap, and emerging governed data products.
- Maturity read: Mature and data-rich, but not yet cleanly rationalized into governed real-time data products with a single semantic/control layer.
- Implication: AI and digital ambition are credible, but the data platform has to reduce integration drag, reporting duplication, and control-evidence gaps before autonomous workflows can scale safely.

## Confirmed Technology Stack

- Teradata Vantage on AWS
- AWS data lake / event streams
- SAS Grid Analytics
- IBM DataStage
- Informatica PowerCenter / IDMC
- Tableau Enterprise
- BusinessObjects
- IBM Z / CICS / DB2 / MQ mainframe feeds
- SAP enterprise reporting and finance flows
- Salesforce / Adobe customer stack without an enterprise CDP

## Data Quality Caution

Some generated inventory rows contain platform labels (Databricks, Snowflake, BigQuery, Fabric, Azure Synapse) that are not supported by the authoritative SkyHarbor current-state source docs. Treat those labels as review-required until source evidence confirms them.

## Volumetric Summary

- Applications/systems: 900
- Analytics-adjacent applications: 285
- Mainframe-adjacent applications: 228
- Data products: 420
- Integrations/interfaces: 1,800
- Critical/high integrations: 900
- Real-time or streaming integrations: 690
- Analytics-adjacent application run cost: $3.1B
- Represented data-product volume: 247,367 TB
- Represented data-product consumers: 42,918
- Represented upstream source references: 8,754

### Named Platform Metrics

- activeEdwTables: 4,800
- scheduledWorkloadsPerMonth: 92,000
- productionSasFlows: 380
- dataStageJobsPerMonth: 25,660
- informaticaCallsPerDay: 27,030
- tableauDashboards: 740

### Platform Highlights

- active_edw_tables: 4,800 tables — Teradata Vantage on AWS current state (F08_platform-volumetrics.csv#SHA-VOL-002)
- monthly_scheduled_workloads: 92,000 jobs/month — Includes ELT, regulatory, loyalty, revenue management (F08_platform-volumetrics.csv#SHA-VOL-003)
- tableau_dashboards: 740 dashboards — Certified content coverage only 54% (F08_platform-volumetrics.csv#SHA-VOL-005)
- monthly_users: 22,920 users — Volumetric baseline for Teradata Vantage on AWS EDW (F08_platform-volumetrics.csv#SHA-VOL-115)
- incidents: 28,400 incidents/month — Volumetric baseline for Tableau Enterprise (F08_platform-volumetrics.csv#SHA-VOL-119)
- daily_pnr_transactions: 28,600,000 txn/day — PSS transaction volume remains mainframe-centered (F08_platform-volumetrics.csv#SHA-VOL-001)
- daily_transactions: 3,740 txn/day — Volumetric baseline for Departure Control Mainframe (F08_platform-volumetrics.csv#SHA-VOL-101)

## Derived Insights

### Data volume is not the blocker; governed real-time operating data products are.

The estate has large EDW/data-product/integration footprint, but IROPS and customer AI need certified operational domains, freshness controls, and lineage that can survive audit and disruption events.

Severity: high
Evidence: F09_data-analytics-estate.csv; F10_integrations-interfaces.csv; SkyHarbor_IROPS_Agentic_Roadmap_SYNTHETIC.md

### Teradata/SAS/BI rationalization is a modernization move, not just a cost takeout.

The corpus pattern fit says Teradata, SAS, DataStage, Informatica, Tableau, and BusinessObjects should be mapped by usage, semantic ownership, and retirement path before the CDAO funds a lakehouse or CDP narrative.

Severity: high
Evidence: corpus-patterns/move-patterns.jsonl#sha-teradata-rationalization; SHA-ACT-003

### Mainframe-adjacent feeds still determine how fast digital and AI can move.

The PNR/core operational load and IBM Z estate mean API exposure and capability-by-capability strangling is safer than a broad replacement story.

Severity: high
Evidence: F07_infrastructure-cloud.csv#SHA-INF-001; F08_platform-volumetrics.csv; corpus-patterns/move-patterns.jsonl#sha-mainframe-modernization-sequencing

### Customer AI scale needs CDP and identity governance first.

Delta-style Digital Concierge is already identified, but the blocker says No CDP; consent and identity fragmented. That makes identity and consent a prerequisite, not a later cleanup task.

Severity: medium
Evidence: T01_initiative-registry.csv; corpus-patterns/move-patterns.jsonl#sha-cdp-identity-value-gate

## Corpus Pattern Matches

- Mainframe modernization sequencing (sha-mainframe-modernization-sequencing): Matched signals: IBM Z, CICS, DB2, MQ
- Teradata/SAS/BI rationalization path (sha-teradata-rationalization): Matched signals: Teradata Vantage, SAS, Tableau, DataStage
- IROPS agentic readiness gate (sha-irops-agentic-readiness): Matched signals: crew legality
- Customer identity/CDP value gate (sha-cdp-identity-value-gate): Use when personalization value depends on fragmented identity and consent.
- SkyHarbor Air V4 context-to-move pattern 6 (skyharbor-air-v4-pattern-06): Apply when context, corpus, Tower spend, and evidence rows together show an executive decision point.

## Peer / North-Star Read

Large airline peers are moving toward real-time operational data products, certified customer/loyalty identity, predictive maintenance data products, and AI-assisted disruption recovery with human approval and audit trails.

SkyHarbor has the ingredients, but peers will outperform if they turn data into governed products faster than SkyHarbor rationalizes EDW, SAS, BI, and mainframe-adjacent data movement.

## Recommended Moves

### Create a data estate rationalization move

Owner: CDAO
Decision: Approve usage-based mapping of Teradata, SAS, Tableau, BusinessObjects, DataStage, Informatica, and lake/data-product workloads.
Expected impact: $122.0M

### Gate IROPS agentic scale on operational data readiness

Owner: EVP Operations + CDAO
Decision: Scale only after proving Data readiness, crew legality, DOT obligation guardrails.
Expected impact: $270.0M

### Treat CDP/identity graph as a foundation for customer AI

Owner: President Loyalty + CDAO
Decision: Fund CDP/identity sequencing before scaling digital concierge or personalization agents.
Expected impact: $180.0M

## Sentinel Answer Contract

Answer style: plain-English senior CDAO advisor
Must include: current platforms, volumetrics, architecture read, peer/north-star read, recommended moves, evidence
Must not lead with: chunk count, graph edge count, raw fact count
