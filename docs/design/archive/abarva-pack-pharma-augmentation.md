# AbarVa Build Pack K · Pharma Vertical + Healthcare Augmentation

**Date:** April 19, 2026
**Scope:** Add fourth composite client — Helix Therapeutics, $22B mid-cap biotech — with realistic AI portfolio. Create bidirectional integration with Meridian Health so cross-client intelligence becomes tangible.
**Effort:** ~2 days. Builds on Pack J pattern.
**Why it matters:** a pharma client makes the portfolio story complete. More importantly, the Helix ↔ Meridian integration is where "cross-client pattern learning" stops being an abstract claim and becomes a demonstrable feature — Nexus traverses the graph between them and surfaces insights neither client could generate alone.

---

## The augmentation concept

Pharma and healthcare aren't adjacent industries — they're co-dependent. Every pharma company runs trials at IDN sites, licenses RWE from them, sends MSLs to their specialists, and markets through their formularies. Any IDN with research centers has pharma counterparties as significant line items on both revenue (research partnerships) and spend (formulary decisions).

Representing just one side of this relationship makes the data feel thin. Representing both sides — with explicit shared touchpoints, revenue flows, and data licenses — makes the portfolio tell a story no single-client demo ever could.

### What gets built

1. **Helix Therapeutics** as fourth composite client with full AI portfolio
2. **Meridian gets enriched retroactively** — research partnership revenue line added, trial partnership entities made concrete, Helix MSL visit logs appear in clinical workflow data
3. **Graph edges between clients** — bidirectional, typed, queryable
4. **Cross-client reasoning queries** — Nexus can pull from both clients' contexts when they share touchpoints

---

# Client 4 · Helix Therapeutics

**Profile:** $22B revenue composite mid-cap biotech (think Regeneron/Biogen/Vertex scale), 18,000 employees, 32 country presence, headquartered US East Coast with research hubs in Basel + Singapore + Cambridge MA. 14 approved drugs on market, 280 compounds in pipeline (Phase 1-4), 340 active trials globally.

**Financials**

| Metric | Value |
|---|---|
| Annual revenue | $22B |
| R&D spend | $6.2B (28% of revenue) |
| IT budget | $420M/year (2% of revenue — pharma is capex-light on IT) |
| AI budget | $95M/year |
| Employees | 18,000 |
| Pipeline compounds | 280 (Phase 1-4) |
| Approved drugs | 14 |
| Active clinical trials | 340 globally |
| Manufacturing sites | 6 |

## AI portfolio — 38 use cases

### Research & Discovery (8)

| # | Name | Vendor / Product | Status | Users | Monthly Cost | Notes |
|---|---|---|---|---|---|---|
| 1 | AI-powered target identification | **Recursion Phenom** | Production · 18mo | Discovery biologists 240 | $420K | Partnership + platform license |
| 2 | Small molecule design | **Insitro + internal** | Production · 12mo | Computational chemists 85 | $280K | Tight integration with wet lab |
| 3 | Protein structure prediction | **AlphaFold + OpenFold** | Production · 24mo | Discovery 120 | $62K | Google DeepMind access |
| 4 | Compound screening | **Atomwise** | Production · 36mo | Screening team 40 | $180K | — |
| 5 | Literature surveillance | **Nference + Prime Scholar + Claude Enterprise** | Production · 14mo | All research 1,400 | $148K | Replaces expensive PubMed analyst hours |
| 6 | Antibody engineering | **Absci + internal** | Scaling pilot | Biologics team 62 | $220K | Expanding from 2 programs to 8 |
| 7 | Genomics/single-cell analysis | **Tempus Next + Komodo** | Production · 20mo | Translational science 85 | $180K | **Shared with Meridian research centers** |
| 8 | Competitive intelligence | **Ontosight + internal** | Production · 10mo | Strategy 28 | $38K | — |

### Clinical Operations (6)

| # | Name | Vendor / Product | Status | Trials Covered | Monthly Cost |
|---|---|---|---|---|---|
| 9 | Clinical trial patient recruitment | **Deep 6 AI** | Production · 14mo | 180 of 340 trials | $340K |
| 10 | Site selection & feasibility | **Saama + internal** | Production · 16mo | All new trial startups | $180K |
| 11 | EDC / trial data capture | **Medidata Rave + Medable** | Production · Core | All trials | $720K |
| 12 | Protocol design assistant | **Trialscope + Claude Enterprise** | Pilot | Phase 1/2 designs | $62K |
| 13 | eSource / remote monitoring | **Signant Health + Veeva Vault CDMS** | Production · 22mo | 260 trials | $420K |
| 14 | Real-world evidence generation | **Aetion + Komodo + Flatiron** | Production · 18mo | 8 of 14 approved drugs monitored | $680K |

### Regulatory & Safety (4)

| # | Name | Vendor / Product | Status | Monthly Cost |
|---|---|---|---|---|
| 15 | Pharmacovigilance automation | **Pharmora + Quinten Health** | Production · 12mo | $240K |
| 16 | Adverse event case processing | **Internal (Claude Enterprise)** | Production · 9mo | $180K — $6.4M eng build |
| 17 | Regulatory submission assembly | **Veeva Vault RIM + Claude Enterprise** | Scaling pilot | $120K |
| 18 | Medical writing copilot | **Yseop + Claude Enterprise** | Pilot | $48K |

### Commercial & Field (6)

| # | Name | Vendor / Product | Status | Users | Monthly Cost |
|---|---|---|---|---|---|
| 19 | Field sales next-best-action | **Veeva CRM Suggestions + Aktana** | Production · 30mo | 1,400 reps | $280K |
| 20 | HCP segmentation & targeting | **Trinity Life Sciences + internal** | Production · 24mo | Commercial ops 45 | $140K |
| 21 | Content personalization | **Veeva Vault PromoMats + Adobe** | Production · 18mo | Brand teams | $180K |
| 22 | Market access analytics | **IQVIA + internal** | Production · Core | Access team 80 | $320K |
| 23 | Patient support program AI | **TrialCard + Claude Enterprise** | Scaling | 12 of 14 approved drugs | $140K |
| 24 | Speaker program optimization | **Doximity Insights + internal** | Pilot | Medical affairs 65 | $38K |

### Medical Affairs (4)

| # | Name | Vendor / Product | Status | Users | Monthly Cost |
|---|---|---|---|---|---|
| 25 | MSL insights management | **Within3 + Claude Enterprise** | Production · 14mo | 340 MSLs | $120K |
| 26 | KOL identification | **Within3 + Doximity** | Production · 10mo | Medical affairs 85 | $64K |
| 27 | Medical information response | **Pharmora + Claude Enterprise** | Production · 8mo | Call center 60 | $48K |
| 28 | Publication planning | **Internal (Claude Enterprise)** | Pilot | Med comms 32 | $22K |

### Manufacturing & Supply (4)

| # | Name | Vendor / Product | Status | Sites | Monthly Cost |
|---|---|---|---|---|---|
| 29 | Process optimization | **Rockwell FactoryTalk + internal** | Production · 36mo | 6 sites | $180K |
| 30 | Quality analytics | **Veeva QualityOne + Dassault** | Production · 24mo | 6 sites | $140K |
| 31 | Supply chain demand | **o9 Solutions** | Production · 18mo | Global | $220K |
| 32 | Serialization & anti-counterfeit | **TraceLink AI** | Production · 24mo | Core | $180K |

### Corporate Functions (6)

| # | Name | Vendor / Product | Status | Users | Monthly Cost |
|---|---|---|---|---|---|
| 33 | M365 Copilot | **Microsoft Copilot** | Production | 14,200 seats | $426K |
| 34 | Engineering copilot | **GitHub Copilot** | Production | 680 engineers | $22K |
| 35 | IT service desk | **Moveworks** | Production | 18,000 | $84K |
| 36 | Legal copilot | **Harvey AI** | Production | 140 legal staff | $98K |
| 37 | Enterprise search | **Glean** | Production | 12,000 seats | $72K |
| 38 | Internal knowledge platform | **Notion AI + Claude Enterprise** | Production | Research 4,200 | $92K |

### Shadow AI discovered (5 separate entries)

| # | What | Vendor | Risk |
|---|---|---|---|
| S1 | Medical science liaisons using ChatGPT Plus for literature Q&A | OpenAI consumer | MEDIUM — MSL output quality concerns |
| S2 | Computational chemists running local Llama 3 for molecule generation | Meta | MEDIUM — IP exfiltration risk |
| S3 | Commercial team using Jasper for email copy | Jasper | LOW — brand compliance risk |
| S4 | Clinical operations using Anthropic Claude.ai (consumer, not Enterprise) | Anthropic consumer | HIGH — trial data exposure |
| S5 | Regulatory team using Harvey trial unsanctioned | Harvey | MEDIUM — eventually sanctioned |

## Active AI projects — 12

| Project | Vendor | Budget | Phase | % Complete |
|---|---|---|---|---|
| Recursion partnership extension (Phase 2 of platform access) | Recursion | $42M | 2 of 3 | 48% |
| AlphaFold in-house deployment | Google DeepMind | $8M | 1 of 2 | 35% |
| Deep 6 AI trial recruitment expansion (to 280 of 340 trials) | Deep 6 AI | $6.4M | 2 of 3 | 55% |
| Pharmacovigilance AI overhaul | Pharmora + internal | $14M | 3 of 4 | 72% |
| RWE platform consolidation (Aetion + Komodo + Flatiron) | 3 vendors | $22M | 1 of 3 | 22% |
| M365 Copilot full deployment | Microsoft | $14M | 3 of 3 | 85% |
| Medical affairs transformation | Within3 + Claude | $8.2M | 2 of 3 | 48% |
| Manufacturing digital twin | Rockwell + PTC | $38M | 2 of 4 | 32% |
| Veeva Vault modernization (CRM + Clinical + Quality + RIM) | Veeva | $62M | 3 of 5 | 45% |
| AI governance & ICH E6(R3) compliance | Internal + Credo AI | $6.8M | 1 of 2 | 58% |
| Data platform (Databricks + Snowflake hybrid) | Databricks + Snowflake | $28M | 2 of 3 | 65% |
| Shadow AI discovery | Netskope | $2.2M | 2 of 2 | 88% |

## Contradictions — 7 structured

1. **HIGH · Cost trajectory** — Recursion partnership + AlphaFold in-house + Atomwise + Insitro together: $940K/mo for overlapping discovery AI. Three platforms, unclear which drives the most pipeline decisions. Governance board hasn't reviewed consolidation.

2. **HIGH · Risk vs Data** — Clinical operations shadow ChatGPT use (S4) touches interim trial data. GCP + ICH compliance violation potential. IT knows; governance hasn't forced remediation.

3. **HIGH · Vendor overlap (RWE)** — Aetion + Komodo + Flatiron all in production for RWE at $680K/mo. Three vendors, overlapping data (all source from same EHR networks partially). No consolidation plan.

4. **MEDIUM · Shadow research AI** — Computational chemists' local Llama 3 generates candidate molecules. Some IP concerns (training data contamination). Patent filings from this workflow flagged for audit.

5. **MEDIUM · Value vs Adoption** — Aktana next-best-action at $180K/mo, field rep adoption 58%. Rep feedback: suggestions feel generic. CRM team defending; commercial ops skeptical.

6. **MEDIUM · Cross-region governance gap** — Basel + Singapore research hubs have independent AI procurement budgets. Neither feeds into central US inventory. At least 4 use cases exist outside the 38 counted.

7. **LOW · Unlabeled data exhaust** — Veeva Vault PromoMats AI-generated content comingles with human-authored; promotional review can't distinguish at scale.

## Cost breakdown monthly

| Category | Monthly $ |
|---|---|
| LLM APIs (direct) | $1.1M |
| AI-SaaS licenses | $2.4M |
| Copilot seats | $448K |
| Discovery platforms (Recursion, Insitro, Atomwise) | $940K |
| Clinical tech (Medidata, Veeva, Deep 6) | $1.6M |
| Compute (ML + GPU) | $980K |
| Data platform (Databricks + Snowflake) | $420K |
| Staff aug (AI-specific) | $1.4M |
| Services (SI) | $640K |
| Observability + governance | $180K |
| **Total** | **$10.1M/mo** |

$121M/year — realistic for a $22B biotech with 28% R&D intensity. Discovery AI is the biggest line by far, which matches where the money actually goes in pharma.

---

# Helix ↔ Meridian integration

This is where cross-client intelligence becomes tangible.

## Shared touchpoints (8 concrete relationships)

| # | Relationship | Direction | Numbers |
|---|---|---|---|
| 1 | Clinical trial sites | Helix runs trials at Meridian research centers | 47 active trials at Meridian, of 340 Helix total |
| 2 | RWE license | Meridian licenses de-identified RWE to Helix | $8.4M/yr to Meridian (shows in Meridian research revenue) |
| 3 | MSL visits | Helix MSLs visit Meridian specialists | 180 MSL visits/quarter to Meridian clinicians |
| 4 | Patient recruitment funnel | Deep 6 AI pulls Meridian patients into Helix trials | Meridian yields 4.2x the per-site recruitment rate of Helix's other IDNs |
| 5 | Genomics platform | Both use Tempus Next | Data-sharing agreement in place |
| 6 | Oncology RWE | Both use Flatiron | Subscription overlap |
| 7 | Formulary presence | 8 of 14 Helix drugs on Meridian formulary | Affects Meridian medication order data |
| 8 | Medical information queries | Meridian clinicians submit questions to Helix medical info | ~340 queries/month |

## What changes in Meridian's seed retroactively

To make the integration visible, Pack J's Meridian seed gets three additions:

1. **Research revenue line** — $8.4M/year from Helix + similar from 3 other pharma partners ($22M total research partnership revenue). Shows in Meridian's `cost_centers` with positive value (revenue offset).

2. **Trial partnership entities** — `trial_partnerships` table (or tags on existing `clinical_workflows`) linking to Helix trials. 47 Helix trials appear alongside Meridian's own clinical research portfolio.

3. **Medical affairs contacts** — MSL visit logs show up as a recurring pattern in Meridian's clinical workflow data. Meridian cardiologists record ~38 MSL touchpoints/month from Helix alone.

All flagged `is_demo_data: true` like the rest of the seed.

## Graph edges introduced

```cypher
// Client-to-client relationships
MATCH (helix:Client {name: 'Helix Therapeutics'})
MATCH (meridian:Client {name: 'Meridian Health System'})

MERGE (helix)-[:PARTNERS_WITH {type: 'clinical_trials', active_trials: 47}]->(meridian)
MERGE (helix)-[:LICENSES_DATA_FROM {type: 'rwe', annual_usd: 8400000}]->(meridian)
MERGE (helix)-[:ENGAGES_SPECIALISTS_AT {type: 'msl', quarterly_visits: 180}]->(meridian)
MERGE (helix)-[:SHARES_VENDOR {vendor: 'Tempus Next'}]->(meridian)
MERGE (helix)-[:SHARES_VENDOR {vendor: 'Flatiron'}]->(meridian)

// Drug-level relationship
MATCH (helix_drug:Product {vendor: 'Helix Therapeutics'})
MATCH (meridian:Client {name: 'Meridian Health System'})
MERGE (helix_drug)-[:ON_FORMULARY_AT]->(meridian)
```

## Cross-client reasoning queries — add to Pack C's library

### Query A — shared-touchpoint surface

```cypher
// "When I'm in an engagement with Meridian, what are my Helix-side implications?"
MATCH (currentClient:Client {id: $currentClientId})
MATCH (counterparty:Client)-[rel]-(currentClient)
WHERE type(rel) IN ['PARTNERS_WITH','LICENSES_DATA_FROM','ENGAGES_SPECIALISTS_AT','SHARES_VENDOR']
RETURN counterparty.name, type(rel) AS relationship_type, properties(rel) AS details
```

### Query B — upstream dependency detection

```cypher
// "Helix's patient recruitment is dependent on Meridian's cardiology workflow
//  health. If Meridian's ambient doc adoption drops, what happens to Helix?"
MATCH (meridian_wf:Workflow)<-[:PERFORMS]-(:Clinician)-[:AT_SITE_FOR]->(trial:ClinicalTrial)<-[:RUNS]-(helix:Client {name: 'Helix'})
WHERE meridian_wf.specialty = 'cardiology'
RETURN trial.id, trial.enrollment_status, meridian_wf.id, meridian_wf.adoption_pct
```

### Query C — vendor-shared posture diff

```cypher
// "Both Helix and Meridian use Tempus Next. Are their DPAs aligned?
//  Any gaps worth flagging in either engagement?"
MATCH (v:Vendor {name: 'Tempus Next'})<-[:USES_VENDOR]-(c:Client)
WITH v, collect({client: c.name, posture: c.dpa_last_reviewed}) AS postures
RETURN v.name, postures
```

Nexus with access to these queries can say things a single-client product never could:

- *"Anand, I noticed Helix just completed Phase 2 of their Recursion platform expansion. Since Meridian runs 47 Helix trials, expect protocol amendments on 4 of them in the next 60 days — worth flagging to Sarah."*

- *"If Meridian's ambient doc adoption slides in cardiology (currently 78%, trending down 2pt/mo), Helix's cardiac Phase 3 recruitment will feel it in roughly 60 days. Two clients, one chain."*

- *"Helix and Meridian both use Tempus Next. Helix's DPA was refreshed October 2025; Meridian's was 2023. That's a Meridian-side gap — I'd prioritize it in Sarah's next governance review."*

That is the moat visible.

---

## Vendor whitelist expansion (pharma-specific)

Add to `src/scripts/seed/_shared/vendor-whitelist.ts` under a PHARMA section:

```typescript
export const ALLOWED_PHARMA_VENDORS = [
  // Discovery
  'Recursion', 'Insitro', 'Atomwise', 'Absci', 'Iktos', 'Cyclica',
  'Relay Therapeutics', 'Isomorphic Labs', 'AlphaFold', 'OpenFold',

  // Clinical operations
  'Medable', 'Saama', 'Signant Health', 'Medidata Rave', 'Veeva Vault',
  'Veeva Vault CDMS', 'Veeva Vault RIM', 'Veeva Vault PromoMats',
  'Veeva CRM Suggestions', 'Veeva QualityOne', 'Deep 6 AI', 'Antidote',
  'TrialSpark', 'Inato', 'Trialscope',

  // RWE & data
  'Aetion', 'Flatiron', 'Komodo Health', 'Nference', 'Ontosight',
  'IQVIA', 'Prime Scholar', 'OpenEvidence',

  // Safety & regulatory
  'Pharmora', 'Quinten Health', 'Genpact AI', 'Yseop',

  // Commercial
  'Aktana', 'Trinity Life Sciences', 'Doximity Insights', 'Within3',
  'TrialCard',

  // Manufacturing
  'Rockwell FactoryTalk', 'Dassault', 'TraceLink AI', 'PTC', 'Siemens',

  // Genomics shared (also in healthcare)
  'Tempus Next',
];
```

`vendor-whitelist.ts` becomes the canonical reference. Anytime a seed script inserts a row with a vendor, the guard checks against this list (approved) plus `FORBIDDEN_CLIENT_NAMES` (rejected).

---

## Industry classifier extension

Extend `clients.industry_code` to accept `PHARMA`:

```sql
-- Already flexible, just document new code
-- Industries: HEALTHCARE_IDN, FINSERV, RETAIL, PHARMA, GENERAL
```

Domain keyword routing in `src/lib/agent/domain-router.ts` (from Pack I Phase 5) gets a pharma block:

```typescript
DOMAIN_KEYWORDS.pharma_discovery = ['target identification', 'molecule', 'compound', 'drug discovery', 'recursion', 'alphafold'];
DOMAIN_KEYWORDS.pharma_clinical = ['clinical trial', 'protocol', 'recruitment', 'site selection', 'edc', 'ectd'];
DOMAIN_KEYWORDS.pharma_regulatory = ['pharmacovigilance', 'adverse event', 'regulatory submission', 'fda', 'ema', 'pmda'];
DOMAIN_KEYWORDS.pharma_commercial = ['msl', 'hcp', 'formulary', 'market access', 'speaker program'];
DOMAIN_KEYWORDS.pharma_medaffairs = ['medical affairs', 'medical information', 'publication', 'kol'];
```

Nexus in a Helix conversation auto-pulls from `client:helix:pharma_discovery` etc. In a Meridian conversation, the shared touchpoints (Tempus Next, Flatiron, trial partnerships) still surface because the graph reasoning picks them up automatically.

---

## Seed script — Helix Therapeutics

File: `src/scripts/seed/helix-enterprise.ts`

Same pattern as the three healthcare/FS/retail seed scripts. Parameterized by size (large — $22B is at the upper-mid cap edge). All 38 use cases, 12 projects, 7 contradictions, 5 shadow AI entries ingested as specified above.

Additionally, `src/scripts/seed/helix-meridian-integration.ts` writes the 8 touchpoint entities + graph edges + updates Meridian's research revenue line. Runs after both individual seeds complete.

## Run

```bash
npm run seed:enterprise -- --clients meridian,firstcapital,apex,helix --refresh
npm run seed:integrate -- --source helix --target meridian
```

Idempotent upsert throughout. Every row flagged `is_demo_data: true`.

---

## Acceptance

### Scale credibility test (pharma side)

A Phase 2 biotech exec or pharma CIO looks at Helix and checks:

- **Is the AI spend plausible?** $10.1M/mo for a $22B biotech: yes.
- **Is Recursion/Insitro/Atomwise present?** A serious pharma in 2026 would have at least two of those. We have three plus AlphaFold + Absci. Credible.
- **Is the vendor mix right?** Veeva across CRM + Clinical + Quality + RIM, Medidata Rave, Deep 6 AI for recruitment, Aetion/Komodo/Flatiron for RWE, Pharmora for PV. This is the actual 2026 biotech AI stack. Credible.
- **Are the contradictions real-world?** Aetion + Komodo + Flatiron overlap in RWE is a genuine pharma consolidation pattern. Commercial ops vs CRM next-best-action tension is real. Shadow AI in clinical ops with interim trial data is a known compliance problem. Credible.

### Cross-client intelligence test

Anand opens Meridian and asks Nexus: *"What's my exposure if Helix has a clinical setback?"*

Nexus responds:

*"Meridian's direct exposure to Helix is $8.4M/year in RWE license revenue plus $3.2M in trial-site services — 0.08% of Meridian revenue, not material at the macro level. But Helix runs 47 trials here, of which 12 are Phase 3 cardiac — those represent ~$4M in per-site fees through 2027. If Helix pauses its cardiac program, Meridian's research center runs at 85% capacity through Q3, not 100%. Worth flagging to the research leadership for contingency planning."*

That answer requires traversing: Meridian cost centers → Helix partnership edge → Helix trial portfolio → Helix therapeutic areas → specific trial status. Five-hop query across two clients. Not retrieval. Reasoning.

### Dashboard integration test

Open Meridian Tower. Research revenue line shows $22M/year inflow (previously: $0). Drill-down shows Helix contributes $8.4M. Click Helix → opens Helix Tower from within Meridian's context. Sarah (client_viewer at Meridian) cannot see this navigation (other clients are hidden from her) — Anand as Maestro can.

---

## Paste-to-Claude-Code

> "Pack K · Pharma Vertical + Healthcare Augmentation. Add Helix Therapeutics as fourth composite ($22B biotech) with 38 use cases, 12 projects, 7 contradictions. Expand vendor whitelist with 30+ pharma-specific vendors. Run `src/scripts/seed/helix-enterprise.ts` + `src/scripts/seed/helix-meridian-integration.ts`. Graph: add bidirectional edges between Helix and Meridian (PARTNERS_WITH, LICENSES_DATA_FROM, ENGAGES_SPECIALISTS_AT, SHARES_VENDOR). Retroactively update Meridian seed with research revenue line ($22M/yr from 4 pharma partners, Helix is $8.4M), trial partnerships (47 Helix trials visible in Meridian research portfolio), MSL visit logs in clinical workflow data. Extend domain-router.ts with 5 pharma keyword blocks. All rows `is_demo_data: true`. Report after ship."

---

## What this pack ships

A fourth composite that makes the portfolio complete **and** a demonstration of cross-client intelligence that no single-client demo can replicate.

When Shail asks *"what's the moat?"* — instead of explaining it, you show him Nexus traversing from Meridian's cardiology workflow health to Helix's cardiac Phase 3 enrollment risk in a single answer. The graph surfaces the connection neither client could generate alone. The flywheel, visible in one screen.

That's the demo moment this pack unlocks.
