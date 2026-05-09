# Knowledge Corpus · Schema Extensions v1.1

**Version:** 1.1.0 · proposed 2026-05-08
**Status:** Draft · awaits founder approval before locking
**Builds on:** `KNOWLEDGE_CORPUS_SCHEMA.md` v1.0.0 (locked 2026-05-08)

---

## Why an extensions doc

The v1.0 schema is correct but minimum-viable. Three things v1.0 doesn't carry that the Intelligence redesign needs:

- A way to cite **named real deployments** (not just "press release source URL")
- A way to score relevance per **persona** (CIO vs CFO vs CMIO ask different questions of the same corpus)
- A way to surface **anti-patterns and move cascades** as first-class entities, not inline failure_modes

Plus three field-level adds: lifecycle position, vendor share trajectory, quantified pattern strength.

Locking these now — before retail/healthcare/finserv curation runs — saves a corpus rewrite later. Curation prompts get the v1.1 schema; one population pass produces the complete corpus.

---

## What changes · summary

| Change | Type | Impact |
|---|---|---|
| **+ Proof Point** entity | New entity | Named customer · use case · outcome · date · source. Direct credibility carrier. |
| **+ Persona** entity | New entity | CIO/CFO/CMIO/CHRO/CDO etc. Per-role concerns + objections + KPI focus. |
| **+ Move Cascade** entity | New entity | "If you do X and succeed, the natural next bet is Y." Powers cascade reasoning. |
| **+ Anti-Pattern** entity | New entity | Cross-use-case failure modes promoted from inline `failure_modes`. |
| **+ Use Case · `lifecycle_stage` + `position_history`** | Field | Powers The Map (lifecycle X-axis) + "What changed" feed. |
| **+ Vendor · `share_trajectory` + `signal_basis`** | Field | Powers vendor-tier badges that read as live, not static. |
| **+ Pattern · `quantified_signal`** | Field | Turns "wisdom" into evidenced numbers (with-pattern vs without-pattern). |

Total: **4 new entities + 3 field-level adds.** Five-entity floor in v1.0 becomes nine in v1.1.

---

## Entity 6 · Proof Point

**Identifier:** `PP-{INDUSTRY}-{NUMBER}`
Examples: `PP-HC-001`, `PP-RTL-014`, `PP-CROSS-003`

**Purpose:** A named customer deployment of a specific use case with a measured outcome and a source. Proof Points are the credibility carrier — Sentinel and Source agents cite them inline ("Cleveland Clinic · DAX · 2024 · 67% adoption").

**Schema:**

```yaml
id: PP-HC-001
name: "Cleveland Clinic · DAX Copilot · 2024 deployment"
display_name_short: "Cleveland Clinic · DAX · 2024"

industry: healthcare
use_case_id: UC-HC-FRONT-001        # required
vendor_id: V-HC-001                  # required when a vendor is named
si_id: SI-CROSS-001                  # optional — when SI was involved

customer:
  name: "Cleveland Clinic"
  type: "academic_idn"               # IDN | community_hospital | academic | for_profit | retail_omnichannel | etc.
  size: "very_large"                 # small | mid | large | very_large
  geography: "US-Midwest"

deployment:
  start_date: 2023-10
  go_live_date: 2024-03
  scope: "8,000 physicians across 23 specialties"
  scale: "rolled out to 14 hospitals · 220+ outpatient facilities"

measured_outcomes:
  - metric: "Physician adoption rate"
    value: "67%"
    period: "12 months post go-live"
    confidence: HIGH
  - metric: "Documentation time per encounter"
    value: "−41% (from 18 min to 11 min)"
    period: "12 months"
    confidence: HIGH
  - metric: "Physician satisfaction (NPS)"
    value: "+22 pts"
    period: "year-over-year"
    confidence: MED              # self-reported survey

success_factors_observed:
  - "CMIO co-sponsorship (P-HC-005)"
  - "Primary-care-first pilot (P-HC-007)"

failure_factors_avoided:
  - "Specialty-only pilot (AP-HC-009)"

art_of_possible_quote: |
  "DAX let our physicians focus on patients, not screens."
  — Dr. R. Schreiber, CMIO, Cleveland Clinic
  [public statement · HIMSS 2024 keynote]

provenance:
  primary_sources:
    - source: "Cleveland Clinic + Microsoft joint press release"
      url: "https://newsroom.clinic.org/...."
      currency_date: 2024-04
      reliability: HIGH
    - source: "HIMSS 2024 conference keynote"
      currency_date: 2024-03
      reliability: HIGH
    - source: "JAMIA 2025 retrospective study (case study)"
      currency_date: 2025-Q1
      reliability: HIGH
  curation_pass: "v0-bootstrap-2026-05-08"

last_refreshed: 2026-05-08
refresh_cadence: semi_annually
```

**Cross-references:**

- Forward: `use_case_id`, `vendor_id`, `si_id` (required where applicable)
- Reverse on `Use Case`:
  ```yaml
  proof_points:
    - PP-HC-001
    - PP-HC-007
  ```
- Reverse on `Vendor`:
  ```yaml
  customer_roster:
    public_references:
      - proof_point_id: PP-HC-001     # promoted from inline customer reference
  ```

**Curation rules:**

1. Every Proof Point must have at least one HIGH-reliability source (press release, peer-reviewed study, public earnings, conference presentation).
2. Self-reported vendor case studies are MED reliability and require corroborating MED+ source to enter the corpus.
3. Outcomes without a date or scope are rejected ("X% adoption" alone is insufficient — needs "across N physicians, 12 months post go-live").
4. Customer must be **named** (anonymous case studies don't qualify as Proof Points; they may live as "qualitative evidence" on the Pattern entity instead).

---

## Entity 7 · Persona

**Identifier:** `PER-{ROLE}-{NUMBER}` (numbered for variants — e.g., academic-CIO vs community-CIO)
Examples: `PER-CIO-001` (default IDN CIO), `PER-CFO-001`, `PER-CMIO-001`

**Purpose:** A named role with concerns, objections, hypotheses, and KPI focus. Use Cases reference applicable personas; Sentinel uses persona context to shape voice and content. Castillo (CFO at Meridian) and Iyer (CIO at Meridian) ask the same corpus different questions; Persona makes that explicit.

**Schema:**

```yaml
id: PER-CMIO-001
name: "Chief Medical Information Officer · IDN"

role_canonical: "CMIO"
role_aliases: ["Chief Medical Officer", "Chief Health Informatics Officer"]

industry: healthcare
sub_segment: integrated_health_system    # IDN | community_hospital | academic | etc.

primary_concerns:
  - "Physician burnout / clinician satisfaction"
  - "Workflow imposition vs workflow improvement"
  - "Documentation quality + patient safety"
  - "Clinical informatics governance"

typical_kpi_focus:
  - "Physician documentation time"
  - "EHR satisfaction (Press Ganey clinician)"
  - "Adoption rate · daily active users"
  - "Quality measure compliance"
  - "Clinical informaticist FTE leverage"

typical_objections:
  - objection: "AI hallucinations in clinical documentation"
    evidenced_response: |
      DAX-style ambient documentation has demonstrated <0.5% material clinical error rates in production
      across 8,000+ physician deployments [JAMIA 2025-Q1]. Hallucination management is via human-in-the-loop
      sign-off (every note reviewed before commit), audit trail, and per-specialty model tuning.
    relevant_proof_points: [PP-HC-001, PP-HC-007]
  - objection: "EHR vendor lock-in if we go with Nuance/Epic"
    evidenced_response: |
      EHR-native AI (Epic AI, M365 in Cerner) does deepen lock-in. EHR-agnostic options (Suki, Abridge)
      preserve switching freedom but add a vendor surface. Pattern: large IDNs accept lock-in for execution
      speed; mid IDNs typically pick EHR-agnostic.
    relevant_proof_points: [PP-HC-014]
  - objection: "Physicians won't adopt"
    evidenced_response: |
      Adoption is binding to sponsorship structure (P-HC-005). With CMIO co-sponsorship · 65–75%; without · 25–40%.
      Pilot site selection (P-HC-007) is the second binding lever.

typical_hypotheses:
  - "Ambient AI is most valuable for primary care first, specialty second"
  - "Documentation time savings translates to physician retention, not throughput"
  - "Quality measures get *easier* to hit when documentation is AI-assisted"

primary_relationships:
  - other_role: "CIO"
    nature: "co-sponsor for clinical AI deployments"
  - other_role: "CMO"
    nature: "reports up; clinical strategy alignment"
  - other_role: "CFO"
    nature: "value-based-care model conversations"

provenance:
  primary_sources:
    - source: "AMDIS / CHIME survey 2025-Q4"
      currency_date: 2025-Q4
      reliability: HIGH
    - source: "JAMIA published study on CMIO role evolution"
      currency_date: 2025-Q3
      reliability: HIGH
  curation_pass: "v0-bootstrap-2026-05-08"

last_refreshed: 2026-05-08
refresh_cadence: semi_annually
```

**Cross-references:**

- Forward: `proof_points` (in objection responses), `relevant_patterns` (on hypotheses)
- Reverse on `Use Case`:
  ```yaml
  applicable_personas:
    - persona_id: PER-CMIO-001
      relevance: PRIMARY        # PRIMARY | SECONDARY | TANGENTIAL
      role_in_decision: "co-sponsor (binding per P-HC-005)"
    - persona_id: PER-CIO-001
      relevance: PRIMARY
      role_in_decision: "co-sponsor + budget owner"
  ```

**Standard persona set for v0 bootstrap:** CIO, CFO, CMIO (healthcare only), CHRO, CDO/CDAO, COO, Chief Compliance Officer, Chief Risk Officer (finserv only), Head of Digital Transformation. Per industry, ~7–10 personas.

---

## Entity 8 · Move Cascade

**Identifier:** `MC-{INDUSTRY}-{NUMBER}`
Examples: `MC-HC-003`, `MC-RTL-001`

**Purpose:** A sequence of use cases with pre/post conditions, typical lag, and success-conditional probability. The bet-shaping thesis isn't one bet — it's a *sequence* of bets where each enables the next. Cascades make this reasonable surface-level, not just inferred.

**Schema:**

```yaml
id: MC-HC-003
name: "Ambient docs → Revenue cycle → Population health (IDN cascade)"
display_name_short: "Docs → RevCycle → PopHealth"

industry: healthcare
applicable_personas: [PER-CIO-001, PER-CMIO-001, PER-CFO-001]
applicable_sub_segments: [integrated_health_system, academic_idn]

cascade_steps:
  - step: 1
    use_case_id: UC-HC-FRONT-001       # Ambient AI Clinical Documentation
    typical_duration_months: "12-18"
    success_threshold: "≥60% physician adoption · sustained for 6 months"
    enables_step_n_plus_1_via: |
      Once physicians are documenting in structured AI-assisted form, the resulting structured data quality
      (problem lists, encounter coding, clinical context) enables AI-driven RCM that wasn't possible on
      free-text documentation alone.

  - step: 2
    use_case_id: UC-HC-MIDDLE-001       # Epic AI Revenue Cycle
    typical_duration_months: "9-15"
    enabled_by_step_n_minus_1: "Structured documentation from step 1"
    success_threshold: "≥3% denial rate reduction · ≥5d AR reduction"
    enables_step_n_plus_1_via: |
      RCM AI's risk-stratification + coding accuracy is the substrate for Population Health AI's
      panel definition — without clean coding, panel risk-tiering misclassifies cohorts.

  - step: 3
    use_case_id: UC-HC-MIDDLE-007       # Population Health AI for ACOs
    typical_duration_months: "12-18"
    enabled_by_step_n_minus_1: "Clean encounter coding from step 2"
    success_threshold: "≥$5M MSSP shared savings · ≥80% panel coverage"

cascade_evidence:
  observation_count: "11 IDN deployments analyzed across 18 months 2024-2025"
  full_cascade_completion_rate: "7 of 11 reached step 3 successfully"
  partial_cascade_observations:
    - "3 of 11 stalled at step 2 due to RCM vendor selection mismatches"
    - "1 of 11 stalled at step 1 due to CMIO turnover"
  confidence: HIGH

failure_modes_at_handoff:
  - between_step: "1 → 2"
    mode: "Documentation structure not actually structured enough for downstream AI"
    early_signal: "RCM AI vendor flags <70% encounter codeability after 90 days"
    typical_recovery: "Tighten ambient AI templates; defer step 2 by 3-6 months"
  - between_step: "2 → 3"
    mode: "Panel definition skipped because 'we already have data warehouse'"
    early_signal: "Step 3 panel risk model accuracy <70% on validation cohort"
    typical_recovery: "Re-build panel definition from RCM AI codes, not legacy DW"

related_cascades:
  - cascade_id: MC-HC-005       # parallel cascade for finance side (Joule path)
  - cascade_id: MC-HC-007       # alternative cascade if step 1 is GitHub Copilot for engineering velocity instead

provenance:
  primary_sources:
    - source: "KLAS Research IDN AI Cascade Analysis 2025-Q4"
      currency_date: 2025-Q4
      reliability: HIGH
    - source: "AbarVa customer signal pool [n=11]"
      currency_date: 2026-Q1
      reliability: MED          # promoted from MED to HIGH once n>20
  curation_pass: "v0-bootstrap-2026-05-08"

last_refreshed: 2026-05-08
refresh_cadence: quarterly
```

**Cross-references:**

- Forward: `cascade_steps[].use_case_id`, `applicable_personas`, `related_cascades`
- Reverse on `Use Case`:
  ```yaml
  cascades_position:
    - cascade_id: MC-HC-003
      position: 1                # this use case is step 1 of MC-HC-003
    - cascade_id: MC-HC-005
      position: 2                # this use case is step 2 of MC-HC-005 (cross-cascade)
  ```

**Surface usage:** The Brief renders a "Move Cascade" rail card per the wireframe (`docs/training/intelligence-brief-wireframe.html`) — *"if MH-04 succeeds, the natural follow-on is..."*. Nexus references cascades during P0 Originate to surface follow-on Move opportunities.

---

## Entity 9 · Anti-Pattern

**Identifier:** `AP-{INDUSTRY}-{NUMBER}` or `AP-CROSS-{NUMBER}`
Examples: `AP-HC-002`, `AP-RTL-005`, `AP-CROSS-001`

**Purpose:** Cross-use-case failure modes promoted from inline `failure_modes` to first-class entities. "Pilot-to-scale gap" recurs across many use cases; one entity that multiple use cases reference beats 15 inline copies that drift over time.

**Schema:**

```yaml
id: AP-HC-002
name: "Pilot-to-scale gap"
display_name_short: "Pilot-to-scale gap"

scope: industry_specific           # industry_specific | cross_industry
applicable_industries: ["healthcare"]
related_to_pattern: P-HC-018       # complementary success pattern

description: |
  Single-hospital or single-clinic pilots produce inflated success metrics that don't
  generalize when scaled. Pilot environments self-select for engaged clinicians, supportive
  service-line leadership, and dedicated implementation support. Scaled rollouts hit
  median-conditions clinicians, distracted leadership, and self-service implementation —
  resulting in adoption rates 30–50% lower than pilot.

mechanism: |
  Pilot-to-scale gap is structural: the very factors that make a site good for piloting
  (engaged sponsors, willing clinicians, attentive vendor support) are precisely the factors
  that disappear at scale. Selection bias on the pilot site overstates what's achievable
  at population scale.

observed_in_use_cases:
  - UC-HC-FRONT-001       # Ambient documentation
  - UC-HC-MIDDLE-001      # Epic AI RCM
  - UC-HC-MIDDLE-007      # Population Health
  - UC-HC-MIDDLE-002      # Clinical Risk Stratification

observation_count: "9 of 24 IDN AI deployments analyzed 2023-2025"

quantified_signal:
  with_anti_pattern:
    metric: "Sustained adoption at 12 months"
    value_range: "25–40%"
    typical_value: "32%"
  without_anti_pattern:
    metric: "Sustained adoption at 12 months"
    value_range: "55–70%"
    typical_value: "63%"
  source: "KLAS 2025-Q4 IDN AI Survey · n=24"
  confidence: HIGH

early_signals:
  - signal: "Pilot site has tenure >5 years average among clinicians (above your IDN median)"
    severity: HIGH
  - signal: "Pilot site CMO is in pilot governance (not delegating)"
    severity: MED
  - signal: "Vendor success-management staffing >2 FTE on pilot (won't scale)"
    severity: MED

typical_recovery: |
  Re-pilot in median-store / median-clinic conditions before scaling. Specifically:
  - Pick a pilot site with median-tenure clinicians
  - Reduce vendor staffing during pilot to match scale-economics
  - Hold sponsorship structure constant from pilot to scale (no special pilot-only sponsor)
  - Validate adoption sustained for 6 months before greenlighting expansion

prevention_patterns:
  - pattern_id: P-HC-007       # Pilot-site selection pattern (median, not flagship)
  - pattern_id: P-HC-019       # Vendor staffing parity pilot-to-scale

related_anti_patterns:
  - AP-HC-009                  # IT-imposed-workflow anti-pattern (compounds)
  - AP-CROSS-001               # Cross-industry pilot bias anti-pattern

provenance:
  primary_sources:
    - source: "KLAS Research IDN AI Survey 2025-Q4"
      currency_date: 2025-Q4
      reliability: HIGH
    - source: "JAMIA 2025-Q3 published retrospective"
      currency_date: 2025-Q3
      reliability: HIGH
  curation_pass: "v0-bootstrap-2026-05-08"

last_refreshed: 2026-05-08
refresh_cadence: quarterly
```

**Cross-references:**

- Forward: `observed_in_use_cases`, `related_to_pattern`, `prevention_patterns`, `related_anti_patterns`
- Reverse on `Use Case`:
  ```yaml
  anti_patterns:
    - ap_id: AP-HC-002
      severity: HIGH        # HIGH | MED | LOW for this specific use case
  ```
- Reverse on `Pattern` (when `prevention_patterns` populated):
  ```yaml
  prevents_anti_patterns:
    - AP-HC-002
  ```

**Migration from v1.0:** Inline `failure_modes` on Use Case entities stay (they're per-use-case specifics). Anti-Patterns are the cross-use-case generalizations. Curation rule: if a `failure_mode` appears in 2+ use cases with substantially the same description, promote it to an Anti-Pattern and reference from each Use Case.

---

## Field-level extensions

### Use Case · `lifecycle_stage` + `position_history`

```yaml
lifecycle_stage: scaling          # emerging | scaling | mature | declining
lifecycle_basis: |
  Scaling stage as of 2026-Q1 — KLAS observed >40% of mid+ IDNs deploying or in active pilot;
  challenger vendors gaining customer count YoY; CMS quality reporting tailwind beginning.

position_history:
  - quarter: "2024-Q1"
    stage: emerging
  - quarter: "2024-Q4"
    stage: emerging
  - quarter: "2025-Q3"
    stage: scaling          # transition observed
  - quarter: "2026-Q1"
    stage: scaling
```

**Surface usage:** Powers The Map's X-axis and the "What changed this quarter" feed (transitions surface as ticker items).

### Vendor · `share_trajectory` + `signal_basis`

```yaml
share_trajectory: gaining           # gaining | holding | losing | retreating
trajectory_signal_basis: |
  Q3 2025 Series D + 30 net-new IDN customers in 2025 vs 18 in 2024 [Crunchbase + Innovaccer
  Q4 2025 customer roster disclosure]. Microsoft (incumbent) holding share but at premium
  pricing increasingly resisted in mid IDN segment.

trajectory_window: "rolling 12 months"
trajectory_history:
  - quarter: "2024-Q4"
    trajectory: emerging
  - quarter: "2025-Q4"
    trajectory: gaining
  - quarter: "2026-Q1"
    trajectory: gaining
```

**Surface usage:** Vendor tier badges read as live ("Innovaccer · Challenger · gaining") rather than static. Source agent surfaces trajectory in vendor evaluation responses.

### Pattern · `quantified_signal`

```yaml
quantified_signal:
  with_pattern:
    metric: "Physician adoption at 12 months"
    value_range: "65–75%"
    typical_value: "71%"
    n: 14
  without_pattern:
    metric: "Physician adoption at 12 months"
    value_range: "25–40%"
    typical_value: "32%"
    n: 12
  source: "KLAS Research 2025-Q4 + JAMIA 2025-Q1 + AMDIS survey"
  confidence: HIGH
  caveats: |
    Confidence is HIGH because three independent sources converge. Caveat: sample skews to
    mid+ IDN segment (200+ beds); small community hospitals underrepresented in n.
```

**Curation rule:** Patterns without quantified_signal are admitted only when qualitative ("bring CMIO into governance") and the rule is binary, not range-bound. Range claims require quantification.

**Surface usage:** Pattern citations in The Brief render as "P-HC-005 · with sponsor: 65–75% adoption · without: 25–40% [KLAS · n=12]" — the pattern is provable, not aspirational.

---

## Cross-reference graph · v1.1 additions

Five new edge types added to the v1.0 graph:

```
Use Case       ──→  Proof Point        (proof_points: [PP-...])
Use Case       ──→  Persona            (applicable_personas: [PER-...])
Use Case       ──→  Anti-Pattern       (anti_patterns: [{ap_id, severity}])
Use Case       ──→  Move Cascade       (cascades_position: [{cascade_id, position}])
Vendor         ──→  Proof Point        (customer_roster.public_references: [PP-...])
Pattern        ──→  Anti-Pattern       (prevents_anti_patterns: [AP-...])
Move Cascade   ──→  Move Cascade       (related_cascades: [MC-...])
```

All bidirectional · all enforced at write time per CROSS_REFERENCE_GRAPH.md `validateCrossReferences`. Asymmetric references reject before commit.

---

## Index file · v1.1 entity counts

`docs/knowledge-corpus/index.json` adds blocks for the four new entities:

```json
{
  "version": "2026-Q3",
  "entity_count": {
    "use_cases": 67,
    "patterns": 75,
    "vendors": 110,
    "sis": 35,
    "regulatory": 35,
    "proof_points": 80,
    "personas": 28,
    "move_cascades": 18,
    "anti_patterns": 30
  },
  "by_industry": {
    "retail":     { ... },
    "healthcare": { ... },
    "finserv":    { ... }
  },
  "use_case_links": {
    "UC-HC-FRONT-001": {
      "patterns": ["P-HC-005", "P-HC-007", "P-HC-012"],
      "proof_points": ["PP-HC-001", "PP-HC-007"],
      "personas": [
        { "id": "PER-CMIO-001", "relevance": "PRIMARY" },
        { "id": "PER-CIO-001",  "relevance": "PRIMARY" }
      ],
      "anti_patterns": [
        { "id": "AP-HC-003", "severity": "HIGH" },
        { "id": "AP-HC-009", "severity": "MED"  }
      ],
      "cascades_position": [
        { "cascade_id": "MC-HC-003", "position": 1 }
      ],
      "vendors":     { "incumbent": ["V-HC-001"], "challenger": ["V-HC-005"], "emerging": ["V-HC-008"] },
      "sis":         { "credible":  ["SI-CROSS-001", "SI-CROSS-005"], "emerging": ["SI-HC-007"] },
      "regulatory":  ["REG-US-005", "REG-US-007"]
    }
  }
}
```

Targets are illustrative — final counts emerge from population. v1.1 is **strictly additive** to v1.0 — every existing entity loads cleanly without v1.1 fields populated; the new fields default to safe absent values.

---

## Population scope · v1.1 (per industry)

| Entity | Retail | Healthcare | Finserv |
|---|---:|---:|---:|
| Use Case | ~22 | ~23 | ~22 |
| Pattern | ~25 | ~25 | ~25 |
| Vendor | ~35 | ~35 | ~35 |
| SI | ~12 | ~12 | ~12 |
| Regulatory | ~10 | ~12 | ~13 |
| **Proof Point** *(new)* | ~25 | ~30 | ~25 |
| **Persona** *(new)* | ~8 | ~10 | ~10 |
| **Move Cascade** *(new)* | ~6 | ~6 | ~6 |
| **Anti-Pattern** *(new)* | ~10 | ~10 | ~10 |

**Calendar impact:** v1.1 adds ~30% population work per industry (estimated 3 days additional per industry beyond v1.0's 1-2 weeks). Worth it — Proof Points alone carry the credibility load, and Personas + Cascades are what make the Brief and Map readable as McKinsey-grade.

---

## Curation prompt updates

Existing prompts (`CURATION_PROMPT_RETAIL.md`, `CURATION_PROMPT_HEALTHCARE.md`) need extensions to v1.1:

1. **Add Proof Point inventory section** — list ~25-30 named customer deployments per industry with source URLs. Examples per industry (illustrative):
   - Retail: Walmart × Microsoft · Lowe's × OpenAI · Target × Sierra · Best Buy × Salesforce · etc.
   - Healthcare: Cleveland Clinic · UPMC · Sutter · Kaiser · Geisinger · etc.
   - Finserv: JPMorgan × OpenAI · Bank of America · Wells Fargo · Goldman · Mastercard × Dynamic Yield · etc.

2. **Add Persona inventory section** — list ~8-10 personas per industry with the standard-set roles (CIO, CFO, CHRO, CDO, COO + industry-specific: CMIO for healthcare, Chief Compliance for finserv, Chief Merchandising Officer for retail, etc.)

3. **Add Move Cascade inventory section** — list ~6 cascades per industry with worked examples of cascade chains.

4. **Add Anti-Pattern inventory section** — list ~10 anti-patterns per industry, mostly promoted from inline failure_modes that recur across multiple use cases.

5. **Update existing entity sections** to include v1.1 field requirements (lifecycle_stage on Use Case, share_trajectory on Vendor, quantified_signal on Pattern).

**A new prompt** — `CURATION_PROMPT_FINSERV.md` — needs authoring for parity with retail and healthcare. Covers the same scope (use cases · patterns · vendors · SIs · regulatory · proof points · personas · cascades · anti-patterns) tuned to financial services.

---

## Surface implications · what v1.1 unlocks

**The Map** (`docs/training/intelligence-map-wireframe.html`):
- X-axis = lifecycle_stage (requires v1.1)
- Node engagement state = tenant overlay (works with v1.0)
- Edges = pattern co-occurrence + cascade adjacency (requires v1.1 cascades)

**The Brief** (`docs/training/intelligence-brief-wireframe.html`):
- "Why this bet" factor breakdown — works with v1.0 tenant overlay
- "Binding success patterns" with quantified_signal — requires v1.1
- "Anti-patterns to avoid" — requires v1.1 anti-pattern entities
- "Vendor short list" with trajectory pills — requires v1.1 share_trajectory
- "Proof points cited" rail card — requires v1.1 Proof Point entities
- "Move cascade · if MH-04 succeeds" rail card — requires v1.1 Move Cascade entities
- "Patterns triggered for you" rail card — requires v1.1 personas + quantified_signal

Both wireframes are **only credible at v1.1**. v1.0 surfaces would render but with hand-waved citations and no cascade reasoning.

---

## Three Tests gate · v1.1 entities

All four new entities follow the same Three Tests discipline as v1.0:

| Entity | Test 1 (source) | Test 2 (currency) | Test 3 (reliability) |
|---|---|---|---|
| Proof Point | Customer + vendor public source required | `last_refreshed` semi-annual cadence | Customer-named or rejected. Vendor case studies HIGH only with corroboration. |
| Persona | Survey or analyst published source | Per-field cadence; concerns + objections refresh annually | Anonymous "things people say" rejected. |
| Move Cascade | Multi-deployment observation OR analyst evidence | Quarterly refresh as cascades complete | n<5 confidence MED; n≥10 confidence HIGH. |
| Anti-Pattern | Observation_count ≥ 3 use cases · ≥1 HIGH-reliability source | Quarterly refresh | Quantified signal required for range claims. |

---

## Decision points

Three calls the founder makes before this doc locks:

1. **Proof Point as a first-class entity, OR keep customer references inline on Vendor + Use Case?**
   *Recommendation: first-class.* The wireframes show why — Proof Points appear on the Brief rail card AND inside use case detail AND on vendor detail. Three places, one source of truth. Inline duplication produces drift.

2. **Persona as a corpus entity, OR a tenant-substrate concern?**
   *Recommendation: corpus entity.* Personas describe *roles*, not *people*. Iyer (CIO at Meridian) is tenant substrate; the CIO-IDN persona is industry knowledge. Different layers.

3. **Move Cascade as a corpus entity, OR a derived view from use case + pattern adjacency?**
   *Recommendation: first-class.* Cascades have their own observed evidence (n=11 IDN deployments per the example), success thresholds per step, and failure modes at handoffs. Deriving from adjacency loses the per-cascade evidence basis.

If the founder agrees with all three recommendations, this doc locks as v1.1.0 and curation prompts get updated before population runs.

---

## What this doc does NOT do

- Does NOT change v1.0 entity schemas (additive only)
- Does NOT alter agent query contracts (those evolve in a follow-up; new tools added per new entity, but existing tools unchanged)
- Does NOT replace inline failure_modes (Anti-Pattern is for cross-use-case generalizations; per-use-case failure_modes stay)
- Does NOT introduce financial-services entities (the curation prompt does that; this doc just makes the schema ready)
- Does NOT specify the curation prompt itself (separate file: `CURATION_PROMPT_FINSERV.md` to be authored)

---

## Begin

Founder approves the three decision points → this doc locks → population runs against v1.1 schema → no rework.
