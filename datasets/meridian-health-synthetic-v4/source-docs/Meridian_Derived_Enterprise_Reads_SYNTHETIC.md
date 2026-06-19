# Meridian Health Derived Enterprise Read: Data Analytics Technology Landscape

Generated: 2026-06-18T23:51:21.307Z

## Executive Read

Meridian has the right healthcare data ambition, but automation value depends on a governed clinical, claims, pharmacy, and call-center lakehouse foundation.

Meridian Health should be read through its business context, technology estate, data products, Tower investment rows, and industry corpus patterns together, with governed evidence deciding what can scale. Meridian has the right healthcare data ambition, but automation value depends on a governed clinical, claims, pharmacy, and call-center lakehouse foundation.

The loaded context shows 150 applications/systems, 120 data products, 240 integrations/interfaces, 12 platform volumetric rows, and 14 AI/control-tower initiatives. The useful executive view is not the row count; it is how these assets explain value, risk, readiness, and sequencing.

Current-state examples include Claims, pharmacy, and CRM/member experience data, Databricks on AWS with Unity Catalog, FHIR / HL7 / EDI ingestion, HEDIS / STAR quality analytics, Prior authorization and utilization management workflows, plus data products such as Longitudinal patient/member gold record [clinical_claims_pharmacy; Databricks AWS; quality 58]; Prior authorization evidence corpus [utilization_management; Databricks AWS; quality 52]; Call center transcript and intent lake [member_experience; Databricks AWS; quality 49]. Volumetric signals include claims per month: 120,000 monthly volume (manual validation before executive use); encounters per month: 305,000 monthly volume (source-to-report lineage not certified); pharmacy fills per month: 490,000 monthly volume (identity matching incomplete); call transcripts per month: 675,000 monthly volume (sufficient for baseline reporting).

Compared with integrated payer-provider health systems, the north star is Peer health systems are moving toward governed longitudinal patient/member views, FHIR/HL7/EDI ingestion, certified quality and cost-of-care semantic products, and AI workflows with audit trails for prior authorization, coding, utilization management, and member experience. Meridian can use Databricks on AWS as the foundation, but peers will outperform if they certify clinical + claims + pharmacy products faster and tie automation to quality, cost, and member experience metrics.

## Current-State Architecture

- Architecture pattern: Integrated payer-provider data estate: Epic, claims, pharmacy, CRM/call center, utilization management, provider quality, finance, and Databricks on AWS target-state data products.
- Maturity read: The target state is clear, but current readiness is still constrained by PHI governance, semantic ownership, source lineage, and workflow integration.
- Implication: The decision layer should lead with business implications, peer benchmark/north-star context, and recommended moves, while keeping row/chunk/fact counts behind evidence and admin diagnostics.

## Confirmed Technology Stack

- Claims, pharmacy, and CRM/member experience data
- Databricks on AWS with Unity Catalog
- FHIR / HL7 / EDI ingestion
- HEDIS / STAR quality analytics
- Prior authorization and utilization management workflows

## Data Quality Caution

Review-required data issues surfaced in the loaded data products: not_ready; not_ready; nascent; partial; not_ready; nascent.

## Volumetric Summary

- Applications/systems: 150
- Analytics-adjacent applications: 97
- Mainframe-adjacent applications: 46
- Data products: 120
- Integrations/interfaces: 240
- Critical/high integrations: 0
- Real-time or streaming integrations: 28
- Analytics-adjacent application run cost: $0

### Named Platform Metrics

- claims per month: 120,000
- encounters per month: 305,000
- pharmacy fills per month: 490,000
- call transcripts per month: 675,000
- prior auth requests per month: 860,000
- HEDIS measure rows per month: 1,045,000
- provider contracts: 1,230,000
- GL journal lines: 1,415,000

### Platform Highlights

- claims per month: 120,000 monthly volume — manual validation before executive use (F08_platform-volumetrics.csv#MER-VOL-001)
- encounters per month: 305,000 monthly volume — source-to-report lineage not certified (F08_platform-volumetrics.csv#MER-VOL-002)
- pharmacy fills per month: 490,000 monthly volume — identity matching incomplete (F08_platform-volumetrics.csv#MER-VOL-003)
- call transcripts per month: 675,000 monthly volume — sufficient for baseline reporting (F08_platform-volumetrics.csv#MER-VOL-004)
- prior auth requests per month: 860,000 monthly volume — manual validation before executive use (F08_platform-volumetrics.csv#MER-VOL-005)
- HEDIS measure rows per month: 1,045,000 monthly volume — source-to-report lineage not certified (F08_platform-volumetrics.csv#MER-VOL-006)
- provider contracts: 1,230,000 monthly volume — identity matching incomplete (F08_platform-volumetrics.csv#MER-VOL-007)
- GL journal lines: 1,415,000 monthly volume — sufficient for baseline reporting (F08_platform-volumetrics.csv#MER-VOL-008)

## Derived Insights

### Clinical + claims unification is the foundation, not a side project.

Longitudinal patient/member views require Epic, claims, pharmacy, and CRM records to be harmonized with PHI-safe governance and certified semantic products.

Severity: high
Evidence: source-docs/Meridian_Annual_Report_and_Databricks_Strategy_SYNTHETIC.md; mer-clinical-claims-lakehouse; MER-AI-001

### Prior authorization AI must prove policy evidence and auditability.

Automation should not scale from workflow enthusiasm alone; it needs medical policy evidence, denial rationale, appeal support, and utilization management ownership.

Severity: high
Evidence: source-docs/Meridian_Call_Center_and_Prior_Auth_AI_SYNTHETIC.md; mer-prior-auth-evidence; MER-AI-013

### Call-center agent assist needs operational context, not transcripts alone.

Useful next-best-action depends on benefits, claims status, care gaps, provider network, pharmacy, and consent controls.

Severity: medium
Evidence: source-docs/Meridian_Corporate_Policies_and_AI_Use_SYNTHETIC.md; mer-payment-integrity-leakage; MER-AI-006

### Payment integrity value depends on closing the feedback loop.

FWA and leakage analytics need provider-pattern evidence, recovery outcomes, and false-positive control before finance can claim value.

Severity: medium
Evidence: source-docs/Meridian_Health_V4_Source_04_SYNTHETIC.md; meridian-health-v4-pattern-05; MER-AI-004

## Corpus Pattern Matches

- Clinical and claims lakehouse foundation (mer-clinical-claims-lakehouse): Matched signals: Epic, claims, pharmacy, FHIR, EDI
- Prior authorization automation evidence gate (mer-prior-auth-evidence): Matched signals: medical policy, utilization management, audit trail
- Payment integrity leakage reduction (mer-payment-integrity-leakage): Matched signals: recovery feedback
- Meridian Health V4 context-to-move pattern 5 (meridian-health-v4-pattern-05): Apply when context, corpus, Tower spend, and evidence rows together show an executive decision point.
- Meridian Health V4 context-to-move pattern 6 (meridian-health-v4-pattern-06): Apply when context, corpus, Tower spend, and evidence rows together show an executive decision point.

## Peer / North-Star Read

Peer health systems are moving toward governed longitudinal patient/member views, FHIR/HL7/EDI ingestion, certified quality and cost-of-care semantic products, and AI workflows with audit trails for prior authorization, coding, utilization management, and member experience.

Meridian can use Databricks on AWS as the foundation, but peers will outperform if they certify clinical + claims + pharmacy products faster and tie automation to quality, cost, and member experience metrics.

## Recommended Moves

### Approve guarded pilot for Databricks AWS clinical + claims lakehouse foundation

Owner: Chief Data Officer
Decision: Approve guarded pilot for Databricks AWS clinical + claims lakehouse foundation
Expected impact: $76.3M

### Close evidence gap for Unified semantic layer for automation-ready data products

Owner: Chief Data Officer
Decision: Close evidence gap for Unified semantic layer for automation-ready data products
Expected impact: $30.7M

### Sequence dependency before scaling Prior authorization automation evidence cockpit

Owner: Chief Health Plan Officer
Decision: Sequence dependency before scaling Prior authorization automation evidence cockpit
Expected impact: $39.0M

## Sentinel Answer Contract

Answer style: plain-English senior CIO/CDAO/CFO advisor
Must include: business context, current platforms, volumetrics, architecture read, peer/north-star read, recommended moves, evidence
Must not lead with: chunk count, graph edge count, raw fact count
