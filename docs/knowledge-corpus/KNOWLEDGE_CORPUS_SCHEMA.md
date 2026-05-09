# Knowledge Corpus Schema

**Version:** 1.0.0 · locked 2026-05-08
**Scope:** The data model for the cross-surface knowledge corpus.

---

## Five entity types

The corpus has exactly five entity types. Adding a sixth requires schema revision; don't add types informally.

1. **Use Case** — a named AI initiative pattern in industry (e.g., "Ambient AI Clinical Documentation")
2. **Pattern** — a recurring success/failure pattern observable across use cases
3. **Vendor** — a company providing AI products in this industry
4. **SI** (Systems Integrator) — a consulting/implementation firm with practice in AI initiatives
5. **Regulatory** — a regulation, guidance, or compliance frame relevant to AI in the industry

---

## Entity 1 · Use Case

**Identifier:** `UC-{INDUSTRY}-{OFFICE}-{NUMBER}`
Examples: `UC-RTL-FRONT-001`, `UC-HC-MIDDLE-008`

**Schema:**

```yaml
id: UC-RTL-FRONT-001
name: "Store Associate Copilot"
display_name_short: "Store Associate Copilot"

industry: retail
office: front  # front | middle | back
domain_tags: ["store_operations", "associate_productivity", "training"]

problem_statement: |
  Multi-line plain-language statement of the business problem this use case
  addresses. Written for a CIO. No jargon. No hype.

  Example: "Store associates spend 30+ minutes per shift looking up product
  details, return policies, customer history, and SKU information across
  multiple disconnected systems. Customer wait times degrade; associate
  productivity stalls. AI copilots embedded in associate-facing tools collapse
  these lookups into conversational queries."

target_business_outcomes:
  - outcome: "Reduce associate ramp time"
    typical_value_range: "30-50% reduction"
    confidence: HIGH
  - outcome: "Increase floor productivity (sales per associate hour)"
    typical_value_range: "8-15% increase"
    confidence: MED

business_value_ranges:
  per_company_size:
    small: "$0.5M-$2M annual"  # <$1B revenue
    mid: "$2M-$10M annual"     # $1-10B revenue
    large: "$10M-$50M annual"  # >$10B revenue
  time_to_value_months: 6-12
  adoption_curve: "S-curve"  # S-curve | linear | immediate | slow_burn
  confidence_band: MED

success_patterns:
  - pattern_id: P-RTL-005  # references a Pattern entity
    relevance: HIGH
  - pattern_id: P-RTL-012
    relevance: MED

failure_modes:
  - mode: "Adoption gap"
    description: "Active usage drops off after week 4-6 if no manager reinforcement"
    early_signal: "Daily active users below 40% by week 3"
    typical_recovery: "Manager-led re-engagement program; segmented rollout"
  - mode: "Wrong pilot site"
    description: "Pilot in flagship store with high-tenure associates produces inflated success metrics that don't replicate"
    early_signal: "Pilot adoption >75% but >5 years average tenure in pilot site"
    typical_recovery: "Re-pilot in median-store conditions before scaling"

vendor_landscape:
  incumbent:
    - vendor_id: V-RTL-001  # Microsoft (M365 Copilot)
    - vendor_id: V-RTL-008  # Salesforce (Einstein for Service)
  challenger:
    - vendor_id: V-RTL-024  # Sierra (custom retail copilot)
  emerging:
    - vendor_id: V-RTL-031  # Newer entrant
  contract_patterns:
    - "Per-seat monthly licensing dominant"
    - "Bundled with broader productivity suite often (M365 Copilot)"
    - "Outcome-based pricing emerging from challengers"

si_landscape:
  credible_practice:
    - si_id: SI-RTL-001  # Accenture
    - si_id: SI-RTL-005  # Deloitte
  emerging_practice:
    - si_id: SI-RTL-014  # Slalom
  typical_engagement: "12-24 week implementation; ongoing managed service for change management"

regulatory_context:
  applicable:
    - reg_id: REG-US-001  # State privacy laws (CA, VA, etc.)
    - reg_id: REG-US-003  # FTC AI guidance
  recent_changes: ["EU AI Act enforcement Feb 2026 affects EU operations"]
  upcoming_headwinds: ["Anticipated federal AI labeling requirement Q3 2026"]

benchmark_metrics:
  primary:
    - kpi: "Daily active user rate"
      industry_median: "32%"
      top_quartile: "58%"
      leading_indicator: true
  secondary:
    - kpi: "Customer wait time at checkout"
      industry_median: "-12% vs baseline"
      top_quartile: "-22% vs baseline"
      leading_indicator: false

art_of_possible_framing: |
  Opening hook for CIO when this use case is presented as a candidate Move:
  "Your associates spend ~30% of their shift on system lookups. A store
  copilot pilot at 5 stores produces measurable productivity gains in 60 days
  and pays back in 9 months at typical retailer scale. The question isn't
  'should we' — it's 'which 5 stores and which sponsor.'"

similar_substrate_initiatives:
  # Auto-populated when tenant has matching initiatives in AI Initiatives Registry
  # E.g., for Apex Retail: AR-01 (Store Associate Copilot)

provenance:
  primary_sources:
    - source: "Gartner Magic Quadrant for Retail AI 2026"
      currency_date: "2026-Q1"
      reliability: HIGH
    - source: "McKinsey Retail Tech Survey 2025"
      currency_date: "2025-Q4"
      reliability: HIGH
    - source: "Public earnings transcripts: Walmart, Target Q4 2025"
      currency_date: "2026-Q1"
      reliability: HIGH
  curation_pass: "v0-bootstrap-2026-05-08"
  reviewer: null  # populated when human review happens
  reviewed_at: null

version_history:
  - version: 1
    changed_at: 2026-05-08
    changed_by: "v0-bootstrap-curation"
    summary: "Initial entry"

last_refreshed: 2026-05-08
refresh_cadence: quarterly
next_refresh_due: 2026-08-08
```

---

## Entity 2 · Pattern

**Identifier:** `P-{INDUSTRY}-{NUMBER}` or `P-CROSS-{NUMBER}` for cross-industry

**Schema:**

```yaml
id: P-HC-005
name: "CMIO sponsorship pattern for ambient AI"

scope: industry_specific  # industry_specific | cross_industry
applicable_industries: ["healthcare"]

pattern_type: success  # success | failure | mixed

description: |
  Plain language description of the pattern, ~100-200 words.

  Example: "Ambient AI clinical documentation deployments succeed when
  sponsored by the CMIO with active clinician participation in vendor
  selection, pilot design, and rollout cadence. Deployments led by CIO
  alone (without CMIO co-sponsorship) experience adoption stalls in
  weeks 6-12 because clinicians perceive the rollout as IT-imposed
  workflow change rather than clinical workflow improvement."

evidence_basis:
  observed_in_use_cases:
    - UC-HC-FRONT-001  # Ambient AI Clinical Documentation
  observation_count: "10+ deployments analyzed across health systems 200-2000+ beds"
  confidence: HIGH

failure_consequence: |
  When ignored: physician adoption stalls at 25-40% (vs 65-75% with CMIO
  sponsorship), pilot expansion paused, vendor renewal at risk in year 2.

recommended_response: |
  Sponsorship structure: CMIO as primary sponsor with CIO as co-sponsor.
  CMIO leads vendor selection. Clinical informaticist in pilot governance.
  Rollout cadence aligned to clinical service line preferences, not IT
  release calendar.

related_patterns:
  - P-HC-007  # Pilot site selection pattern (companion)
  - P-HC-018  # Multi-stakeholder sponsorship in healthcare

provenance:
  primary_sources:
    - source: "KLAS Research: Ambient AI for Clinical Documentation 2025"
      currency_date: "2025-Q4"
      reliability: HIGH
    - source: "JAMIA published study on AI documentation adoption"
      currency_date: "2025-Q3"
      reliability: HIGH
  curation_pass: "v0-bootstrap-2026-05-08"
  reviewer: null
  reviewed_at: null

version_history:
  - version: 1
    changed_at: 2026-05-08
    summary: "Initial entry"

last_refreshed: 2026-05-08
refresh_cadence: quarterly
```

---

## Entity 3 · Vendor

**Identifier:** `V-{INDUSTRY}-{NUMBER}` or `V-CROSS-{NUMBER}` for vendors serving multiple industries (e.g., Microsoft)

**Schema:**

```yaml
id: V-CROSS-001
name: "Microsoft"
product_lines:
  - product_name: "Microsoft 365 Copilot"
    serves_use_cases: ["UC-RTL-FRONT-001", "UC-RTL-FRONT-008", "UC-HC-FRONT-005", ...]
  - product_name: "GitHub Copilot"
    serves_use_cases: ["UC-RTL-BACK-005", "UC-HC-BACK-005"]
  - product_name: "Microsoft Fabric for Healthcare"
    serves_use_cases: ["UC-HC-MIDDLE-009"]

vendor_type: incumbent  # incumbent | challenger | emerging
financial_health: strong  # strong | moderate | watch | at_risk

financial_health_signals:
  - signal: "Public company; Q1 2026 cloud growth +25% YoY"
    date: 2026-04
    source: "MSFT earnings transcript"
  - signal: "AI revenue disclosed at $XB run-rate"
    date: 2026-04
    source: "MSFT earnings"

customer_roster:
  public_references:
    - customer: "Walmart"
      use_case: "UC-RTL-FRONT-001"
      source: "Walmart-Microsoft press release 2025-10"
    - customer: "Cleveland Clinic"
      use_case: "UC-HC-FRONT-001"
      source: "Cleveland Clinic press release 2025-08"
  general_market_position: "Default vendor for enterprise productivity AI; ~70% of Fortune 500 has at least one Copilot SKU"

contract_patterns:
  pricing_models:
    - "Per-seat monthly ($30/user/month for M365 Copilot as of 2026)"
    - "Bundled discounts with Azure commitments"
    - "Volume tiers above 10K seats"
  typical_terms_length: "1-3 year"
  renewal_pattern: "High retention; high upsell to expanded SKUs"
  negotiation_levers: "Azure commit · multi-year · volume · early-renew"

failure_modes:
  - mode: "Over-licensing"
    description: "Customers license more seats than they activate; renewal often reduces seat count by 20-40%"
  - mode: "Bundle confusion"
    description: "M365 Copilot vs GitHub Copilot vs Bing Chat Enterprise — buyers often unclear which serves which use case"

related_sis:
  - SI-CROSS-001  # Accenture (Microsoft Alliance Diamond Partner)
  - SI-CROSS-005  # Deloitte
  - SI-CROSS-014  # Slalom

provenance:
  primary_sources:
    - source: "Microsoft public earnings + investor materials"
      currency_date: "2026-Q1"
    - source: "Gartner Magic Quadrant analyses"
      currency_date: "2026-Q1"
    - source: "Customer press releases (curated 2025-2026)"
  curation_pass: "v0-bootstrap-2026-05-08"

version_history:
  - version: 1
    changed_at: 2026-05-08
    summary: "Initial entry"

last_refreshed: 2026-05-08
refresh_cadence: quarterly  # vendors change fast; consider monthly
next_refresh_due: 2026-08-08
```

---

## Entity 4 · SI (Systems Integrator)

**Identifier:** `SI-{INDUSTRY}-{NUMBER}` or `SI-CROSS-{NUMBER}` for SIs serving multiple

**Schema:**

```yaml
id: SI-CROSS-001
name: "Accenture"

industry_practices:
  - industry: retail
    practice_strength: established  # established | growing | emerging | nominal
    notable_capabilities: ["AI for retail commerce", "Store digitization"]
  - industry: healthcare
    practice_strength: established
    notable_capabilities: ["EHR optimization", "Clinical AI deployment"]

vendor_alliances:
  - vendor_id: V-CROSS-001  # Microsoft
    alliance_tier: "Diamond Alliance Partner"
  - vendor_id: V-CROSS-008  # Salesforce
    alliance_tier: "Global Strategic Partner"
  - vendor_id: V-HC-002  # Epic
    alliance_tier: "Implementation Partner"

use_case_coverage:
  serves_use_cases: ["UC-RTL-FRONT-001", "UC-RTL-MIDDLE-009", "UC-HC-FRONT-001", ...]

engagement_patterns:
  typical_engagement_size: "$2M-$50M, 6-24 months"
  typical_team_shape: "1 partner + 2-4 senior managers + 8-20 consultants per engagement"
  managed_services_capability: HIGH
  delivery_geography: "Global, with onshore/nearshore/offshore mix"

quality_signals:
  - signal: "Top quartile in Forrester AI Services Wave 2025"
    source: "Forrester Wave 2025"
  - signal: "Ranked #1 in Gartner Magic Quadrant for AI services 2025"
    source: "Gartner MQ"

risk_signals:
  - signal: "Concurrent demand creates scarcity for top AI talent; staffing risk on tight timelines"
    severity: MED
  - signal: "Pricing typically premium 20-30% vs second-tier alternatives"
    severity: LOW

provenance:
  primary_sources:
    - source: "Accenture public reporting + analyst rankings"
      currency_date: "2026-Q1"
  curation_pass: "v0-bootstrap-2026-05-08"

last_refreshed: 2026-05-08
refresh_cadence: semi_annually
```

---

## Entity 5 · Regulatory

**Identifier:** `REG-{JURISDICTION}-{NUMBER}` (e.g., `REG-US-001`, `REG-EU-003`)

**Schema:**

```yaml
id: REG-US-005
name: "HIPAA Privacy Rule (with AI/automated decision-making considerations)"

jurisdiction: US-Federal
issuing_body: "HHS Office for Civil Rights"

applicable_industries: ["healthcare"]
applicable_use_cases: ["UC-HC-FRONT-001", "UC-HC-MIDDLE-001", ...]  # all healthcare use cases that touch PHI

summary: |
  HIPAA Privacy Rule applies to any AI system processing protected health
  information. Recent OCR guidance (2024-2025) clarifies that AI vendors
  processing PHI are business associates requiring BAAs. Automated
  decision-making with PHI must include patient-rights notifications.

key_requirements:
  - "Business Associate Agreement (BAA) with any AI vendor processing PHI"
  - "Audit trail for any AI decisioning affecting patient care"
  - "Patient right to opt-out of automated decision-making in certain contexts"
  - "Data minimization principles applied to AI training data"

recent_changes:
  - change: "OCR 2024 guidance clarifying AI vendor BAA requirements"
    date: 2024-10
    impact: "Forced renegotiation of BAAs across health systems"
  - change: "Proposed rule on patient rights re: automated decisions"
    date: 2025-Q3
    impact: "May require workflow changes; comment period closed; final rule expected 2026"

upcoming_headwinds:
  - headwind: "Anticipated final rule on AI decisioning notifications"
    expected: 2026-Q3
    impact: "May require UI changes to patient-facing AI surfaces"

implications_for_bet_shaping: |
  Any healthcare AI initiative touching PHI requires BAA in place before
  pilot. Move shaping should include compliance review as a P2 (Discover &
  Diagnose) deliverable. Patient-facing AI requires opt-out workflow design
  in P3 (Design Future State).

provenance:
  primary_sources:
    - source: "HHS Office for Civil Rights guidance"
      currency_date: "2026-Q1"
    - source: "Federal Register HIPAA proposed rule docket"
      currency_date: "2026-Q1"
  curation_pass: "v0-bootstrap-2026-05-08"

last_refreshed: 2026-05-08
refresh_cadence: quarterly  # regulations change frequently
```

---

## Storage and indexing

**Recommended storage shape:**

Repo-committed JSON files for v0/v1. Each entity in its own file:

```
docs/knowledge-corpus/
├── use-cases/
│   ├── UC-RTL-FRONT-001.json
│   ├── UC-RTL-FRONT-002.json
│   └── ...
├── patterns/
│   ├── P-RTL-001.json
│   └── ...
├── vendors/
│   ├── V-CROSS-001.json
│   └── ...
├── sis/
│   ├── SI-CROSS-001.json
│   └── ...
└── regulatory/
    ├── REG-US-001.json
    └── ...
```

Why JSON in repo:
- Versioned via git (no separate version columns needed)
- Reviewable via PR (curation has a review process)
- Loadable by agents at startup or on-demand
- No DB migration needed for schema changes

When the corpus grows to >5,000 entries, migrate to a DB-backed store. Until then, JSON-in-repo is operationally simpler.

**Indexing for retrieval:**

A separate index file `docs/knowledge-corpus/index.json` carries:
- Entity ID → file path
- Industry → list of entity IDs
- Office → list of entity IDs
- Use case → linked patterns / vendors / SIs / regulatory
- Vendor → use cases served
- SI → use cases served + vendor alliances
- Pattern → use cases observed in

Index is regenerated when entities change (build step on commit). Agents query the index for fast lookup, then load the entity JSON for details.

---

## Required fields per entity

Every entity has at minimum:

- `id` (typed identifier)
- `name`
- `provenance` block (sources + currency + reliability)
- `version_history` (at least version 1)
- `last_refreshed`
- `refresh_cadence`

Without these fields, the entity rejects on commit. Provenance and versioning are not optional.

---

## What this schema does NOT do

- Does NOT capture analyst report PDFs, vendor whitepapers, etc. Those are *sources* cited in provenance, not entities themselves.
- Does NOT include customer-specific data (that's the AI Initiatives Registry; different layer).
- Does NOT capture pricing tables (those are too volatile for this corpus; capture pricing *patterns* in vendor entries instead).
- Does NOT include implementation playbooks (those live in Strategic Moves phase doctrine).

The corpus is the *industry knowledge layer*. It's what agents reference when they need to know "what's the landscape." It's not a CRM, not a vendor management database, not a project plan repository.
