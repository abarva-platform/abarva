# Customer Data Platform (CDP) — Request for Proposal

**Issued by:** Apex Retail Group, Inc.
**Issued date:** 2026-02-12
**Response deadline:** 2026-03-20 (extended from 2026-03-13 at vendor request)
**Program:** apex-cdp-2026
**Owner:** Priya Iyer (VP Digital & E-commerce Technology)
**Procurement lead:** Nathan Kohl (VP IT Procurement & Vendor Management)
**Confidentiality:** Confidential — for invited vendors only under NDA

---

## Section 1 — Background and intent

Apex Retail Group is a publicly-traded specialty retailer (NYSE: APXR), $2.4B revenue, 5,200 employees, 340 stores plus a growing e-commerce channel. We are launching a Customer Data Platform program to unify customer identity and event data across owned channels and to activate that data into customer experience, marketing, and analytics use cases.

This RFP invites response from CDP platform vendors. The Apex implementation will be led by an already-selected implementation partner (Deloitte Digital).

The program builds on the customer data lake delivered in 2023, which today consolidates customer data from 11 source systems into Snowflake. The CDP investment is the activation layer that completes the work begun in 2023.

The Apex tenant has the following relevant context:

- Loyalty member count: 14.2M (active definition: purchase in last 12 months)
- Total customer records (resolved + unresolved): ~22M
- Current identity match rate across source systems: 71%
- Channels in scope for activation: owned web, owned mobile app, email, SMS, in-store, paid social, paid search, programmatic display
- Current marketing technology: Klaviyo (email), Braze (mobile/push), Tealium (tag management), Segment (data pipeline), Adobe Target (testing), Salesforce (CRM + Commerce), Cloudflare (CDN)
- Current data infrastructure: Snowflake (data warehouse), Databricks (ML platform), Fivetran (ingestion), dbt Cloud (transformation), Pinecone (vector — under review)

## Section 2 — Scope and deliverables

The vendor's CDP platform must support the following capabilities:

**2.1 Identity resolution**

- Deterministic identity resolution across email, loyalty ID, mobile device ID, web cookie, transaction history
- Probabilistic identity resolution with explicit confidence scoring
- Support for cross-device, cross-channel identity unification at production volume
- Match rate target: 87% across all identifiable customer interactions
- Latency target: 95th percentile < 100ms for identity lookup at activation time
- Persistent identity graph with versioning and audit trail

**2.2 Event ingestion**

- Real-time event ingestion at production volume (peak: ~12,000 events/second)
- Native ingestion connectors for Salesforce Commerce, Klaviyo, Braze, Adobe Target, Salesforce Service Cloud, web SDK, mobile SDK
- Custom event schema support; ability to evolve event definitions without breaking downstream
- Backfill capability for historical event data from Snowflake

**2.3 Audience composition**

- Event-based, attribute-based, and ML-derived audience composition
- Real-time audience evaluation (target latency: <500ms for activation triggers)
- Audience overlap analysis
- Audience version control and change tracking

**2.4 Activation**

- Native activation to: Klaviyo (email), Braze (mobile push), Salesforce Service Cloud, Adobe Target, paid media platforms (Meta, Google, TikTok), web personalization
- Real-time activation triggers (target: <2 seconds end-to-end)
- Suppression and frequency capping at the customer level across all channels
- Consent and preference enforcement at activation time

**2.5 Consent and privacy**

- Native CCPA/CPRA, GDPR, state privacy law compliance with audit trail
- Integration with OneTrust for consent state enforcement
- DSR (data subject request) fulfillment integration
- Customer-level data residency control where applicable
- PII tokenization at ingestion; activation-time detokenization governed by tenant-defined policy

**2.6 Governance**

- Role-based access with least-privilege by audience, segment, attribute
- Audit trail for every audience composition, activation, and customer-data access
- Data lineage visibility (which source feeds which attribute, refreshed at what cadence, with what quality)
- Data quality monitoring with alerting

**2.7 Open architecture**

- Bidirectional Snowflake integration (Apex's source-of-truth data warehouse stays in place)
- Reverse-ETL capability so the CDP enriches operational systems
- Open API for custom audience composition and activation paths
- Compatible with Apex's data engineering toolchain (dbt, Fivetran, Databricks)

## Section 3 — Evaluation criteria and weightings

Evaluation will be conducted over three rounds. Round 1 (response review) includes all vendors meeting the qualification floor. Round 2 (proof-of-concept + reference check) includes vendors selected from Round 1. Round 3 (BAFO + final commercial) includes 2 vendors selected from Round 2.

| Dimension | Weight | What is evaluated |
|---|---|---|
| Identity resolution capability | 25% | Match rate at Apex scale; explainability; persistence; production proof |
| Activation breadth and latency | 20% | Native channel coverage; latency at activation; consent enforcement |
| Open architecture | 15% | Snowflake integration; reverse-ETL; API quality; vendor lock-in posture |
| Governance, privacy, security | 15% | Privacy compliance maturity; audit trail completeness; lineage |
| Total cost of ownership | 15% | 5-year TCO including data volumes, activation volumes, support |
| Implementation timeline | 10% | Realistic time-to-pilot; reference customers at similar scale |

## Section 4 — Apex-specific requirements (non-negotiable)

The following are required; vendors that cannot demonstrate compliance will not advance past Round 1.

- **Data residency:** customer data must remain in US data centers with no cross-border replication except where Apex explicitly authorizes for international customers (~2% of e-commerce traffic from UK).
- **Snowflake co-existence:** the vendor's data plane must be capable of operating without becoming Apex's customer-data system of record. Apex's Snowflake stays the source of truth for customer master data.
- **No customer data used for vendor-trained ML models without explicit Apex authorization:** customer data must not be incorporated into vendor model training pipelines unless Apex has signed a specific data-use addendum.
- **Exit assistance:** the contract must include explicit exit assistance terms (data export in industry-standard formats; cooperation on transition; price-locked extension during transition) with no time limit on exit-preparedness.
- **Approved third-party assessments:** the vendor must have current SOC 2 Type II and ISO 27001 certifications; PCI-DSS Level 1 compliance for any handling of cardholder data (explicitly out-of-scope for this CDP, but required if scope expands).

## Section 5 — Pricing structure required

Vendors must propose pricing structured as:

- **Base platform fee:** annual subscription
- **Volume tier:** customer record count + monthly event volume + monthly activation volume — with explicit quantity bands and per-unit cost above each band
- **Data egress / activation charges:** per-channel pricing if applicable (must be transparent, not bundled in opaque "platform fee")
- **Implementation cost:** decoupled from platform; Apex will negotiate implementation separately with Deloitte
- **Support tier:** business-hours included; 24x7 priority support priced as add-on
- **Renewal escalator cap:** vendor must propose maximum YoY price increase

Vendors should clearly state assumptions on data volumes and activation volumes; Apex's anticipated scale will be shared in the qualification round.

## Section 6 — Submission requirements

- Vendor company information, including financial stability documentation (latest audited financials or equivalent)
- Technical architecture documentation
- Reference customers at retail scale ≥$2B revenue (3 minimum, with permission for direct contact)
- Pricing structure per Section 5
- Implementation timeline with milestones
- Transition-out / exit assistance documentation
- Any required clarifying questions (deadline: 2026-03-01)

## Section 7 — Process timeline

- 2026-02-12: RFP issued
- 2026-02-26: Optional vendor introduction calls
- 2026-03-01: Vendor questions deadline
- 2026-03-08: Apex Q&A response shared
- 2026-03-20: Response deadline (extended)
- 2026-04-10: Round 1 qualification decisions communicated
- 2026-04-15 to 2026-05-15: Round 2 — proof-of-concept demonstrations
- 2026-05-22: Round 2 → Round 3 advance decision
- 2026-05-29 to 2026-06-19: Round 3 BAFO
- 2026-06-30: Selection decision
- 2026-07-15: Contract signature
- 2026-09-30: Pilot start

## Section 8 — Apex evaluation team

- **Sponsor:** Jennifer Park, Chief Marketing Officer
- **Co-sponsor:** Lynne Stratham, Chief Data Officer
- **Program lead:** Priya Iyer, VP Digital & E-commerce Technology
- **Technical lead:** James Wright, VP Data Engineering & Platform
- **Architecture review:** Linda Mwangi, VP Enterprise Architecture
- **Security review:** Sarah Whitfield, CISO
- **Privacy review:** Rebecca Singh, General Counsel
- **Procurement lead:** Nathan Kohl, VP IT Procurement & Vendor Management

All vendor communication during the process must route through procurement (Nathan Kohl) and the program lead (Priya Iyer). Direct vendor outreach to evaluation team members outside of scheduled meetings will result in disqualification.

---

**Document metadata:**

- Source basis: `tenant_authored`
- Confidence: 1.00
- Last reviewed by: Nathan Kohl (Procurement) + Rebecca Singh (Legal)
- Last reviewed at: 2026-02-10
- Approval: signed by Carlos Rivera (CIO), Jennifer Park (CMO), Lynne Stratham (CDO), Margaret Chen (CFO)
