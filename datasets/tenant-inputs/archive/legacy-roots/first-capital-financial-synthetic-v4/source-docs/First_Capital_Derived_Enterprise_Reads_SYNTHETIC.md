# First Capital Financial Derived Enterprise Read: Data Analytics Technology Landscape

Generated: 2026-06-18T23:51:21.307Z

## Executive Read

First Capital has a rich banking technology estate, but AI value is gated by core modernization, model risk, and evidence discipline.

First Capital Financial should be read through its business context, technology estate, data products, Tower investment rows, and industry corpus patterns together, with governed evidence deciding what can scale. First Capital has a rich banking technology estate, but AI value is gated by core modernization, model risk, and evidence discipline.

The loaded context shows 260 applications/systems, 140 data products, 320 integrations/interfaces, 12 platform volumetric rows, and 42 AI/control-tower initiatives. The useful executive view is not the row count; it is how these assets explain value, risk, readiness, and sequencing.

Current-state examples include Core banking and payment interfaces, Sanctions screening and fraud scoring, AML / BSA case operations, Customer 360 / deposits + cards + lending + wealth, Model-risk governance / SR 11-7 validation, plus data products such as Customer gold record (deposits+cards+lending+wealth) [customer_360; Databricks AWS; quality 56]; Transaction monitoring feature store [financial_crimes; Databricks AWS; quality 61]; Fraud real-time feature store [fraud; Feedzai / Databricks; quality 64]. Volumetric signals include posted transactions per month: 940,000,000 monthly volume (batch settlement window pressure); authorizations per month: 1,800,000,000 monthly volume (peak-season latency near SLA); ACH items per month: 410,000,000 monthly volume (return handling manual); real-time payments per month: 38,000,000 monthly volume (exception repair high-touch).

Compared with large regional and super-regional banks, the north star is Peer banks are moving toward real-time payments, fraud/AML feature stores, governed customer 360, automated credit workflows, and model-risk evidence that is captured by design rather than retrofitted before audit. First Capital can tell a strong modernization story, but peers will move faster if they connect core APIs, sanctions/fraud evidence, and AI value governance before First Capital clears its validation queue.

## Current-State Architecture

- Architecture pattern: Regulated bank data and technology estate: core banking, payments, sanctions/fraud/AML, lending, customer servicing, wealth, Databricks AWS target platforms, and model-risk-controlled AI workflows.
- Maturity read: Strategically mature, but value realization depends on simplifying core interfaces, certifying data products, and clearing model-risk evidence before scaling business-led AI.
- Implication: The decision layer should lead with business implications, peer benchmark/north-star context, and recommended moves, while keeping row/chunk/fact counts behind evidence and admin diagnostics.

## Confirmed Technology Stack

- Core banking and payment interfaces
- Sanctions screening and fraud scoring
- AML / BSA case operations
- Customer 360 / deposits + cards + lending + wealth
- Model-risk governance / SR 11-7 validation

## Data Quality Caution

Review-required data issues surfaced in the loaded data products: not_ready; partial; partial; not_ready; partial; not_ready.

## Volumetric Summary

- Applications/systems: 260
- Analytics-adjacent applications: 166
- Mainframe-adjacent applications: 116
- Data products: 140
- Integrations/interfaces: 320
- Critical/high integrations: 0
- Real-time or streaming integrations: 124
- Analytics-adjacent application run cost: $0

### Named Platform Metrics

- posted transactions per month: 940,000,000
- authorizations per month: 1,800,000,000
- ACH items per month: 410,000,000
- real time payments per month: 38,000,000
- alerts per month: 2,100,000
- scored events per month: 1,900,000,000
- contacts per month: 9,400,000
- sessions per month: 720,000,000

### Platform Highlights

- posted transactions per month: 940,000,000 monthly volume — batch settlement window pressure (F08_platform-volumetrics.csv#FC-VOL-001)
- authorizations per month: 1,800,000,000 monthly volume — peak-season latency near SLA (F08_platform-volumetrics.csv#FC-VOL-002)
- ACH items per month: 410,000,000 monthly volume — return handling manual (F08_platform-volumetrics.csv#FC-VOL-003)
- real-time payments per month: 38,000,000 monthly volume — exception repair high-touch (F08_platform-volumetrics.csv#FC-VOL-004)
- alerts per month: 2,100,000 monthly volume — false-positive rate >95% (F08_platform-volumetrics.csv#FC-VOL-005)
- scored events per month: 1,900,000,000 monthly volume — scam typologies outpace models (F08_platform-volumetrics.csv#FC-VOL-006)
- contacts per month: 9,400,000 monthly volume — no unified agent context (F08_platform-volumetrics.csv#FC-VOL-007)
- sessions per month: 720,000,000 monthly volume — auth friction on high-risk flows (F08_platform-volumetrics.csv#FC-VOL-008)

## Derived Insights

### Core and payments modernization decide whether digital value shows up.

FedNow/RTP, ACH, wire, sanctions, fraud, and API gateway dependencies mean payments value should be sequenced as a cross-domain modernization path, not a channel feature.

Severity: high
Evidence: source-docs/First_Capital_2025_Annual_Report_SYNTHETIC.md; fc-payments-value-gate; FC-AI-040

### AI scale is blocked by model-risk evidence, not by lack of use cases.

Fraud, AML, lending, HR, servicing, and wealth AI need validation, restricted-data attestations, explainability, and monitoring before production scale.

Severity: high
Evidence: source-docs/First_Capital_Corporate_Policies_and_AI_Use_SYNTHETIC.md; fc-model-risk-ai-scale-gate; FC-AI-001

### Customer and transaction data products are the CDAO control point.

Customer 360, fraud feature stores, transaction monitoring, and credit data products need certified semantics and lineage before the CIO can defend AI value claims.

Severity: high
Evidence: source-docs/First_Capital_Digital_Payments_and_Core_Modernization_SYNTHETIC.md; fc-aml-false-positive-reduction; FC-AI-023

### Usage-only AI reporting is not enough for the CFO.

Tower spend and usage have to connect to realized value, control readiness, and risk status before expansion or renewal decisions.

Severity: medium
Evidence: source-docs/First_Capital_Financial_V4_Source_05_SYNTHETIC.md; first-capital-v4-pattern-05; FC-AI-013

## Corpus Pattern Matches

- Payments value gated by core and sanctions dependencies (fc-payments-value-gate): Matched signals: core banking interfaces, sanctions screening
- Model-risk gate before bank AI scale (fc-model-risk-ai-scale-gate): Matched signals: restricted data
- AML false-positive reduction with review controls (fc-aml-false-positive-reduction): Use when AI triage is proposed for alert/case workload.
- First Capital Financial V4 context-to-move pattern 5 (first-capital-v4-pattern-05): Apply when context, corpus, Tower spend, and evidence rows together show an executive decision point.
- First Capital Financial V4 context-to-move pattern 6 (first-capital-v4-pattern-06): Apply when context, corpus, Tower spend, and evidence rows together show an executive decision point.

## Peer / North-Star Read

Peer banks are moving toward real-time payments, fraud/AML feature stores, governed customer 360, automated credit workflows, and model-risk evidence that is captured by design rather than retrofitted before audit.

First Capital can tell a strong modernization story, but peers will move faster if they connect core APIs, sanctions/fraud evidence, and AI value governance before First Capital clears its validation queue.

## Recommended Moves

### Sunset Real-time scam & APP fraud detection and reallocate budget

Owner: Chief Risk Officer
Decision: Sunset Real-time scam & APP fraud detection and reallocate budget
Expected impact: $47.0M

### Approve monitored scale of SAR narrative drafting copilot

Owner: BSA/AML Officer
Decision: Approve monitored scale of SAR narrative drafting copilot
Expected impact: $38.0M

### Re-baseline Contact center next-best-action assist to a single high-value workflow

Owner: Head of Customer Experience
Decision: Re-baseline Contact center next-best-action assist to a single high-value workflow
Expected impact: $41.0M

## Sentinel Answer Contract

Answer style: plain-English senior CIO/CDAO/CFO advisor
Must include: business context, current platforms, volumetrics, architecture read, peer/north-star read, recommended moves, evidence
Must not lead with: chunk count, graph edge count, raw fact count
