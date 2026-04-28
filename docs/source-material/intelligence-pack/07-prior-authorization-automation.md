# Part 3.1b · Prior Authorization Automation (Healthcare)

## 3.1b · Prior Authorization Automation

### YAML front-matter

```yaml
pattern_id: pattern_prior_authorization_automation
slug: prior-authorization-automation
name: Prior Authorization Automation
version: 1.0.0
status: active
category: Utilization Management & Care Access
cross_industry: false
sector_applicability: [healthcare]
primary_sector: healthcare
short_description: >
  The application of AI across the prior authorization value chain —
  from request creation on the provider side, through clinical criteria
  review on the payer side, to denial management and appeal automation —
  with the objective of compressing authorization cycle time, reducing
  administrative cost, improving care access, and meeting CMS
  interoperability mandates for automated prior auth. Pattern covers
  provider-side, payer-side, and integrated approaches, as well as the
  common failure mode of treating prior auth as a transactional
  automation rather than a clinical workflow transformation.
long_description: >
  Prior authorization is the single largest source of administrative
  friction in US healthcare. Providers spend an average of 14 hours per
  physician per week on prior auth; payers operate expensive clinical
  review workflows; members experience delays measured in days to weeks
  for care that should be hours. The CMS Interoperability and Prior
  Authorization Final Rule (CMS-0057-F), phased in 2026-2027, mandates
  electronic prior authorization APIs for Medicare Advantage, Medicaid,
  CHIP, and QHPs. The regulatory forcing function coincides with mature
  AI capability (clinical criteria extraction, structured clinical
  reasoning, evidence matching, documentation automation). The result
  is a market in motion: provider-side AI automates request creation
  from ambient-captured encounter content; payer-side AI accelerates
  clinical review with auto-approval on clear criteria matches;
  integrated platforms mediate between the two. The common failure
  mode is deploying prior auth AI as a transactional automation
  (workflow shortcuts without clinical transformation) rather than
  a clinical workflow redesign (prior auth becoming a by-product of
  properly documented clinical decision-making). The pattern covers
  the detection signals, the interventions across provider-side,
  payer-side, and integrated deployments, the vendor landscape, and
  the regulatory framing.
confidence_floor: 0.65
n_observations_floor: 8
related_patterns:
  - { id: pattern_ambient_clinical_value_chain, relationship: associative }
  - { id: pattern_ai_use_case_portfolio, relationship: associative }
  - { id: pattern_ai_governance_operating_model, relationship: associative }
regulatory_frameworks:
  - id: framework_hipaa_privacy_rule
    applicability: always
  - id: framework_hipaa_security_rule
    applicability: always
  - id: framework_cms_interoperability_rule
    applicability: medicare_advantage_medicaid_chip_qhp
  - id: framework_no_surprises_act
    applicability: conditional
  - id: framework_nist_ai_rmf
    applicability: indirect
  - id: framework_eu_ai_act
    applicability: eu_healthcare_operations
authored_by: anand + claude
last_curated_by: anand
```

### Part A · Pattern Identity

**ID:** `pattern_prior_authorization_automation`
**Name:** Prior Authorization Automation
**Short description:** AI across the prior auth value chain — provider-side request creation, payer-side clinical review, denial management, appeals — with regulatory forcing function from CMS Interoperability Rule.

**Long description:** Prior authorization is a process of mutual frustration. Providers see it as delay and bureaucracy; payers see it as necessary utilization management; members experience it as obstacle to care. The process produces measurable harm: delayed treatment, administrative burden that contributes to provider burnout, and downstream cost (member complaints, bad-debt expense, brand damage). AI offers the opportunity to compress cycle time, reduce administrative cost on both sides, improve clinical appropriateness of decisions, and shift reviewer capacity to the complex cases that warrant human judgment. But AI deployment for prior auth requires clinical workflow integration that transactional automation approaches miss. The pattern distinguishes transactional PA automation (workflow shortcuts) from clinical PA workflow transformation (prior auth emerges from properly documented clinical decision-making) and identifies the operating model elements that produce durable outcomes.

### Part B · Classification

**Category:** Utilization Management & Care Access
**Cross-industry:** No — healthcare-specific
**Primary sector:** Healthcare
**Variant of:** None (distinct pattern)
**Related patterns:**
- `pattern_ambient_clinical_value_chain` (associative; ambient-captured clinical evidence feeds prior auth request creation)
- `pattern_ai_use_case_portfolio` (associative; prior auth often sequenced after ambient in portfolio)
- `pattern_ai_governance_operating_model` (associative; clinical AI governance applies)

### Part C · Detection

#### C.1 · Trigger symptoms

- Prior auth cycle time (request to decision) averaging days rather than hours for covered services
- Provider prior auth burden cited as retention / burnout issue
- Payer clinical reviewer capacity strained; backlog growing
- CMS Interoperability Rule compliance roadmap missing or incomplete (for payer organizations)
- Denials trending up; appeal rate trending up; appeal overturn rate high (indicating initial decision quality issues)
- Member / member services complaints about prior auth delays
- Prior auth AI pilot in place but scoped as isolated workflow automation without clinical integration
- No integration between ambient AI deployment and prior auth workflow (provider side)
- Gold card programs absent or narrow
- Multi-payer variance in prior auth requirements creating unusable workflow variation for providers
- Electronic prior auth (ePA) volume low; fax and portal still dominant channels

#### C.2 · Detection signals

**Signal 1 · Cycle time excess.**
- Type: `kpi_deviation`
- Threshold: Prior auth decision time p50 > 3 business days; p90 > 7 business days
- Evidence: prior auth system metrics

**Signal 2 · Provider burden signal.**
- Type: `evidence_pattern`
- Threshold: Provider surveys cite prior auth as top 3 administrative burden; retention exit interviews reference PA
- Evidence: provider surveys, exit interviews

**Signal 3 · Appeal overturn rate high.**
- Type: `kpi_deviation`
- Threshold: Appeal overturn rate > 60% (indicating initial decisions frequently wrong)
- Evidence: appeals system metrics

**Signal 4 · Reviewer capacity strained (payer).**
- Type: `kpi_deviation`
- Threshold: Clinical reviewer backlog > 2 business days; authorized overtime routine
- Evidence: UM team metrics

**Signal 5 · CMS compliance gap (payer).**
- Type: `audit_finding`
- Threshold: Medicare Advantage / Medicaid / CHIP / QHP payer without Prior Authorization API roadmap aligned to CMS-0057-F timelines
- Evidence: regulatory compliance roadmap

**Signal 6 · Transactional automation without clinical integration.**
- Type: `evidence_pattern`
- Threshold: Prior auth AI deployed on workflow surface (portal routing, form auto-fill) without integration to clinical documentation, ambient AI output, or clinical decision support
- Evidence: PA automation deployment documentation

**Signal 7 · Gold card program absence.**
- Type: `evidence_pattern`
- Threshold: No gold card or provider-trust program for high-volume services and high-trust providers
- Evidence: UM program documentation

**Signal 8 · Electronic prior auth penetration low.**
- Type: `kpi_deviation`
- Threshold: ePA volume < 40% of prior auth transactions; fax / portal still dominant
- Evidence: channel mix reports

#### C.3 · Diagnostic questions

1. What is your prior auth cycle time distribution, and what's driving the right tail?
2. How is prior auth AI integrated with clinical documentation workflow (ambient or otherwise)?
3. What is your CMS Interoperability Rule compliance roadmap and timeline?
4. Where is reviewer capacity constrained, and what fraction of reviewer time is spent on clear auto-approve cases?
5. What gold card or provider-trust programs exist, and what's the expansion path?
6. How is appeal overturn rate trended, and what operational response has it driven?
7. What is the member experience of prior auth today, and what does member satisfaction data say about cycle time?
8. For multi-payer providers, how does prior auth variance across payers affect provider workflow?

#### C.4 · Evidence requirements

- Prior auth system metrics (cycle time, volume, decision distribution)
- Appeal system metrics (overturn rate, appeal volume)
- Reviewer team capacity and workload
- CMS compliance documentation (if payer)
- Provider surveys and exit interviews
- Channel mix (ePA, portal, fax, phone)
- Vendor landscape inventory

#### C.5 · Confidence rubric

- **0.9+:** Cycle time excess, provider burden cited, appeal overturn high, capacity strained, CMS gap, transactional-only automation
- **0.75-0.9:** 3-4 signals present; some mitigation in progress but insufficient
- **0.6-0.75:** Pattern forming; worth probing
- **Below 0.6:** Not surfaceable

### Part D · Causal Structure

**Root cause 1 · Prior auth designed as pre-AI process.**
Current prior auth workflow designed for human-to-human review with structured forms. AI capabilities (clinical criteria extraction, evidence matching, structured reasoning) not foundational to process design.

**Root cause 2 · Provider-side and payer-side incentives mis-aligned.**
Providers want automation that reduces their burden. Payers want automation that preserves utilization management effectiveness (i.e., reduces inappropriate utilization). Without aligned incentives, AI deployments stay in their own lane and don't compound.

**Root cause 3 · Clinical documentation quality insufficient for AI-based review.**
Prior auth AI benefits from structured, specific clinical documentation. Historic documentation — unstructured text, vague indications, missing criteria — doesn't feed AI well. Ambient AI addresses root documentation quality but only if prior auth AI is integrated.

**Root cause 4 · Multi-payer variance creates unusable workflow variation.**
Provider-side prior auth AI must handle variance across payers (different criteria, different evidence requirements, different channels). Variance drives workflow complexity; complexity drives workflow rejection.

**Root cause 5 · Gold card / trust programs absent or narrow.**
Systemic trust mechanism between payers and high-quality providers could eliminate prior auth for significant volume. Few payers operate gold card programs at scale; those that do find administrative savings large but concede trust cautiously.

**Root cause 6 · CMS Interoperability Rule phasing concentrates compliance pressure.**
CMS-0057-F requires phased implementation 2026-2027. Payers without early investment face tight compliance window; providers face variance across payers in rollout maturity.

**Causal chain:**

```
pre_ai_process_design
  + misaligned_incentives
  + clinical_documentation_quality_gap
  + multi_payer_variance
  + gold_card_absence
  + cms_rule_phasing_pressure
  → transactional_automation_dominant
  → cycle_time_excess
  → provider_burden
  → reviewer_capacity_strain
  → appeal_overturn_high
  → member_experience_damage
```

### Part E · Interventions

**Intervention 1 · Clinical workflow integration (provider side).**
Prior auth AI integrated with ambient clinical AI and EHR. Prior auth request auto-generated from encounter documentation when clinical trigger detected. Clinician reviews AI-generated request and submits; AI pulls supporting evidence from note, problem list, labs, imaging.
- *Success rate:* 0.66 (n=9 programs)
- *Effort:* Large · 9-15 months
- *Conditions:* Ambient AI deployment (ideally with value chain integration per pattern 3.1a); EHR integration; clinician workflow partnership; prior auth vendor with clinical integration capability

**Intervention 2 · Clinical criteria review automation (payer side).**
Payer UM team deploys AI to auto-approve clear criteria matches. Complex cases routed to clinical reviewers with AI-generated evidence summary and criteria comparison. Reviewer capacity redirected from clear-approve cases to complex cases.
- *Success rate:* 0.70 (n=11 programs)
- *Effort:* Medium-Large · 9-12 months
- *Conditions:* UM operating model redesign; reviewer training; clinical criteria codification; vendor with payer-side capability (Cohere Health, Rhyme, Optum, MCG, InterQual/Change Healthcare)

**Intervention 3 · Gold card program expansion.**
Payer establishes or expands gold card program for providers with high historical approval rate on specific services. Prior auth waived for qualifying providers / services. Monitored with outcome tracking.
- *Success rate:* 0.64 (n=8 programs)
- *Effort:* Medium · 6-12 months
- *Conditions:* UM leadership willingness; provider relations partnership; outcome measurement discipline; regulatory alignment

**Intervention 4 · CMS Interoperability Rule compliance implementation (payer).**
Prior Authorization API, Patient Access API, Provider Access API, Payer-to-Payer API implemented per CMS-0057-F. Phased implementation aligned to regulatory timelines. Integration with existing PA workflow; legacy channel support maintained during transition.
- *Success rate:* 0.72 (n=10 programs)
- *Effort:* Large · 12-24 months
- *Conditions:* Executive commitment; engineering capacity; vendor selection; FHIR implementation expertise; CMS timeline awareness

**Intervention 5 · Multi-payer variance reduction (provider side).**
Provider-side prior auth AI normalizes variance across payers: maintains payer-specific criteria and channels internally; presents unified clinician-facing workflow. AI translates clinical narrative into payer-specific evidence and submits through appropriate channel.
- *Success rate:* 0.58 (n=7 programs — newer)
- *Effort:* Large · 12-18 months
- *Conditions:* Multi-payer environment; sufficient prior auth volume; AI vendor with multi-payer capability

**Intervention 6 · Appeal and denial automation.**
AI automates appeal drafting from denial rationale + clinical evidence. Tracks denial patterns to identify systemic issues (payer criteria drift, documentation gaps, coding issues). Appeals generated faster; overturn rate higher.
- *Success rate:* 0.62 (n=8 programs)
- *Effort:* Medium · 6-9 months
- *Conditions:* Denial management team partnership; appeal workflow integration; evidence capture

**Intervention 7 · Pharmacy prior auth AI.**
Pharmacy prior auth has distinct workflow (formulary-driven, PBM-mediated, often specialty pharmacy). AI deployment addresses formulary navigation, criteria matching, PBM integration, specialty pharmacy coordination.
- *Success rate:* 0.66 (n=9 programs)
- *Effort:* Medium · 9-12 months
- *Conditions:* Pharmacy operations partnership; PBM integration; specialty pharmacy engagement

**Intervention 8 · Performance measurement and continuous improvement.**
End-to-end prior auth performance measurement: cycle time by service type, decision distribution, provider satisfaction, member satisfaction, reviewer productivity, appeal overturn rate. Continuous improvement cadence at UM leadership.
- *Success rate:* 0.68 (n=10 programs)
- *Effort:* Medium · 6-9 months
- *Conditions:* Measurement infrastructure; UM leadership cadence; provider + member feedback loops

### Part F · Anti-Patterns

- **Transactional-only automation.** Prior auth AI as portal routing or form auto-fill without clinical integration. *Severity: high.*
- **Provider-side deployment without payer-side evolution.** Provider-side AI produces beautiful requests; payer-side still has manual review; cycle time unchanged. *Severity: high.*
- **Payer-side deployment with narrow auto-approve threshold.** AI auto-approves only ultra-clear cases; reviewer capacity largely unchanged. *Severity: medium.*
- **Gold card theater.** Gold card program announced but scope narrow; minimal impact on PA volume. *Severity: medium.*
- **CMS compliance as checkbox.** API implementation per rule but not integrated with PA workflow redesign; regulatory compliance without operational improvement. *Severity: high.*
- **Appeal automation without root cause analysis.** Appeals automated but denial pattern analysis not fed back to initial decisions; systemic issues persist. *Severity: medium.*
- **Multi-payer variance tolerance.** Provider-side workflow accommodates variance rather than reducing it; clinician burden persists. *Severity: high.*
- **Member experience afterthought.** Cycle time improves but member experience of the process not measured or improved. *Severity: medium.*

### Part G · Vendor Landscape

**Payer-side prior auth AI:**
- **Cohere Health** — leader in clinical-informed prior auth decisioning; payer-side focus; rapid growth
- **Rhyme (formerly PriorAuthNow)** — integrated provider-payer platform
- **Optum Prior Authorization** — United Health Group enterprise offering
- **MCG Health / InterQual (Change Healthcare)** — clinical criteria providers with AI extensions
- **Availity** — claims and prior auth clearinghouse with AI features
- **Myndshft** — prior auth automation platform
- **InstaMed / JP Morgan Healthcare Payments** — prior auth among broader healthcare payments
- **Olive (defunct, remnants acquired by various including Waystar)** — cautionary example in the space

**Provider-side prior auth AI:**
- **Notable Health** — prior auth among provider-side automation suite
- **Augmedix PriorAuth** — prior auth extension of ambient
- **Abridge (extensions to prior auth)** — prior auth capabilities emerging
- **Nuance DAX + Prior Auth** — Microsoft stack integration emerging
- **Waystar Prior Authorization** — RCM-integrated
- **Kyruus / Solv (emerging)** — access + prior auth overlap

**CMS Interoperability implementation:**
- **Edifecs** — FHIR / EDI platform; prior auth API implementation
- **InterSystems HealthShare** — FHIR-forward
- **Smile Digital Health, Redox, 1upHealth** — FHIR / HL7 interoperability platforms
- **Availity, Waystar** — clearinghouse-based ePA

**Pharmacy prior auth:**
- **CoverMyMeds (McKesson)** — largest pharmacy ePA platform
- **Surescripts ePA** — standards body + platform

**Clinical criteria and policy:**
- **MCG Health** — clinical guidelines
- **InterQual (Change Healthcare/Optum)** — clinical criteria
- **CCS Clinical, AllMed, MedSolutions** — criteria extensions

**AbarVa positioning:** Platform-agnostic; scored on operating model discipline (clinical integration, multi-payer normalization, gold card expansion, CMS compliance). Strong opinion on integration with ambient AI value chain (patterns sequenced together); prior auth is a natural compounding use case on top of ambient.

### Part H · Regulatory Considerations

- **CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F)** — mandates electronic prior auth APIs for Medicare Advantage, Medicaid, CHIP, QHPs; phased 2026-2027; includes decision notification timelines
- **HIPAA Privacy Rule** — prior auth involves PHI; permitted disclosure for payment/operations but minimum necessary applies
- **HIPAA Security Rule** — PA system security, API security
- **No Surprises Act** — certain emergency services exempted from prior auth; balance billing implications
- **State prior auth laws** — Texas SB 1138 (gold card requirements), Illinois, California, New York and other state rules
- **Medicare Advantage Marketing Rule** — PA-related member communications
- **ERISA** — self-insured plan prior auth governance
- **Parity Act (Mental Health Parity)** — behavioral health prior auth parity with medical/surgical
- **CMS Clinical Decision Support Rule (AUC)** — prior auth adjacent for advanced imaging
- **FDA Clinical Decision Support scope** — prior auth AI may cross FDA device threshold depending on intended use

### Part I · Observations

**Obs 1 · Medicare Advantage plan payer-side transformation.**
Mid-sized Medicare Advantage plan (composite) deployed payer-side clinical prior auth AI with Cohere Health. Year 1: auto-approve rate rose from 11% baseline to 34%; clinical reviewer capacity redeployed from clear cases to complex cases; provider appeals down 28%; appeal overturn rate declined (better initial decisions). Cycle time p50 compressed from 4 business days to 1 business day.

**Obs 2 · Multi-state IDN provider-side integration.**
IDN (composite) integrated prior auth AI with ambient AI platform (completing value chain from pattern 3.1a). Prior auth requests auto-drafted from encounter; clinician review time down 70%; provider reported burden reduction; cycle time compressed due to first-submission completeness. Integration required EHR rework (Epic Gateway mostly); ambient vendor extension; prior auth AI vendor coordination.

**Obs 3 · Payer CMS compliance program.**
Large regional payer (composite, Medicare Advantage + Medicaid + commercial) launched CMS-0057-F compliance program 18 months ahead of effective dates. Prior Authorization API, Patient Access API, Provider Access API implementation. Integration with UM platform; clinical criteria codification. Program complete on time; operational improvement realized alongside regulatory compliance.

**Obs 4 · Community hospital system gold card expansion.**
Community hospital system (composite) with 4 major contracted payers advocated for gold card programs. Two payers established gold card for specific services (elective surgeries, diagnostic imaging). Volume of gold-carded services reduced prior auth administrative burden 22% over 12 months.

**Obs 5 · Pharmacy prior auth automation.**
Regional pharmacy benefit organization (composite) deployed pharmacy PA AI across specialty pharmacy workflow. Cycle time from prescriber submission to dispensing compressed; member satisfaction improved; call center volume reduced.

**Obs 6 · Appeal automation with root cause feedback.**
National payer (composite) automated appeal drafting + denial pattern analysis. Root cause feedback loop surfaced specific documentation gaps, coding issues, and criteria drift patterns. Systemic fixes applied to initial decision workflow; appeal volume reduced 30% over 18 months.

**Obs 7 · Provider-side deployment standalone — limits of unilateral automation.**
Large provider group (composite) deployed provider-side PA AI without aligned payer-side evolution. Request quality improved substantially; cycle time improved marginally (because payer-side processing unchanged). Program value primarily in provider burden reduction; downstream cycle time limited by payer workflow.

**Obs 8 · Member experience integration.**
IDN (composite) integrated prior auth workflow with member-facing communication: members receive automated status updates, estimated decision timelines, contact options. Member satisfaction with prior auth improved from 34% to 58% over 12 months. Call center volume about PA status reduced.

### Part J · Success Measures

**Leading indicators (monthly):**
- Prior auth cycle time p50 and p90
- Auto-approve rate (payer side)
- First-submission completeness rate (provider side)
- Gold-carded service volume
- ePA volume as % of total PA

**Lagging indicators (quarterly):**
- Appeal volume and overturn rate
- Provider satisfaction with PA workflow
- Member satisfaction with PA experience
- Clinical reviewer capacity allocation
- Administrative cost per PA transaction
- CMS rule compliance status (for payers)

**Maturity thresholds:**
- **Emerging:** transactional PA automation; no clinical integration; no gold card
- **Scaling:** clinical integration on one side (provider or payer); gold card program limited; ePA growing
- **Mature:** clinical integration both sides; gold card program expanding; CMS compliance on track; appeal automation
- **Optimized:** end-to-end clinical workflow transformation; multi-payer normalization; gold card at scale; continuous improvement discipline

### Part K · Timeline & Sequencing

**Months 0-6 · Foundation**
- Strategy: provider side, payer side, or integrated
- Vendor selection
- Clinical workflow integration architecture (especially if integrating with ambient AI)
- CMS compliance roadmap (if payer)

**Months 6-12 · Core deployment**
- First deployment in pilot scope (specific service line or payer contract or provider group)
- Clinical integration (ambient → PA on provider side; UM integration on payer side)
- Gold card program pilot (if payer)
- Appeal automation v1

**Months 12-24 · Scale**
- Expansion across service lines / contracts / provider groups
- CMS compliance implementation
- Multi-payer normalization (provider side)
- Performance measurement discipline
- Pharmacy PA integration (if applicable)

**Months 24-36 · Optimize**
- Continuous improvement
- Gold card expansion
- Appeal root cause feedback loop institutionalized

### Part L · Governance Mechanism

| Decision | Owner | Review body | Cadence |
|---|---|---|---|
| PA AI strategy (provider/payer/integrated) | CMIO + CMO (provider); CMO + UM leader (payer) | Executive committee | Annual |
| Clinical integration scope | CMIO + Clinical AI exec | Clinical leadership + AI Council | Semi-annual |
| Gold card scope (payer) | UM leader + medical director | UM committee + Regulatory | Quarterly |
| CMS compliance roadmap (payer) | CIO + Compliance officer | Executive committee | Quarterly |
| Multi-payer normalization (provider) | CMIO + Practice leadership | Operations committee | Semi-annual |
| Performance review | CMIO/CMO/UM leader | Clinical leadership | Quarterly |

### Part M · Sector Sub-Variants

**Medicare Advantage plan:** CMS compliance driver strong; Stars rating downstream impact; member experience critical.

**Medicaid plan:** CMS compliance driver; state Medicaid agency relationship; social determinants integration relevant.

**Commercial health plan:** Employer customer experience driver; network management integration; ACO / VBC arrangements.

**Medicare fee-for-service:** Limited PA historically; AUC for advanced imaging; Medicare Advantage transition relevant.

**Integrated delivery network (provider side):** Multi-payer variance reduction critical; ambient AI integration opportunity.

**Specialty practice:** High-PA-volume specialty (oncology, cardiology, orthopedics) where PA is major workflow surface.

**Pharmacy / PBM:** Pharmacy PA distinct from medical PA; formulary and specialty pharmacy integration.

### Part N · Related Patterns

- **`pattern_ambient_clinical_value_chain`** (associative) — ambient AI provides documentation substrate that prior auth AI consumes; integration multiplies value
- **`pattern_ai_use_case_portfolio`** (associative) — prior auth typically sequenced after ambient in portfolio maturity
- **`pattern_ai_governance_operating_model`** (associative) — clinical AI governance; CMS compliance integration; clinical decision support governance if PA AI crosses FDA threshold

### Part O · Graph Contribution

```cypher
MERGE (p:Pattern {id: 'pattern_prior_authorization_automation'})
SET p.slug = 'prior-authorization-automation',
    p.name = 'Prior Authorization Automation',
    p.version = '1.0.0',
    p.category = 'Utilization Management & Care Access',
    p.cross_industry = false,
    p.primary_sector = 'healthcare',
    p.confidence_floor = 0.65,
    p.n_observations_floor = 8,
    p.status = 'active';

MERGE (s:Sector {id: 'healthcare'})
MERGE (p)-[:APPLIES_TO_SECTOR {primary: true}]->(s);

// Regulatory frameworks including CMS-0057-F
MERGE (f_cms:RegulatoryFramework {id: 'framework_cms_interoperability_rule'})
ON CREATE SET f_cms.name = 'CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F)',
              f_cms.jurisdiction = 'US',
              f_cms.applicability = 'medicare_advantage_medicaid_chip_qhp';
MERGE (f_cms)-[:APPLIES_TO {applicability_note: 'Mandates electronic prior auth APIs; phased 2026-2027'}]->(p);

// Vendors (payer side)
MERGE (v_cohere:Vendor {id: 'vendor_cohere_health'})
ON CREATE SET v_cohere.name = 'Cohere Health', v_cohere.category = 'Prior Authorization AI (payer-side)';
MERGE (v_cohere)-[:APPEARS_IN]->(p);

MERGE (v_rhyme:Vendor {id: 'vendor_rhyme'})
ON CREATE SET v_rhyme.name = 'Rhyme', v_rhyme.category = 'Prior Authorization Platform (integrated)';
MERGE (v_rhyme)-[:APPEARS_IN]->(p);

// Related patterns
MATCH (p:Pattern {id: 'pattern_prior_authorization_automation'})
MATCH (t1:Pattern {id: 'pattern_ambient_clinical_value_chain'})
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(t1);
```

### Part P · Retrieval Contribution

~54 chunks. Namespace `global:patterns:healthcare`. Sub-variants include Medicare Advantage, Medicaid, commercial, IDN provider-side, specialty practice, pharmacy.

### Part Q · Prompting Contract

**Detection fragment:**

```
PATTERN: pattern_prior_authorization_automation (HEALTHCARE)
Summary: AI across prior auth value chain; CMS-0057-F forcing function; transactional-vs-clinical-integration distinction.
Activates when:
- PA cycle time p50 > 3 business days
- Provider burden signal (surveys, exit interviews)
- Appeal overturn rate > 60%
- Clinical reviewer capacity strained (payer)
- CMS compliance roadmap missing/incomplete (payer)
- Transactional PA automation without clinical integration
- Gold card absence or narrow
- ePA volume < 40%
Diagnostic questions focus on clinical integration depth, CMS compliance, gold card expansion, multi-payer variance, appeal root cause.
If active, output pattern_id, confidence, signals_triggered, rationale.
```

**Injection fragment:** Interventions keyed to provider-side vs payer-side vs integrated; reference observations from MA plan, IDN integrated, CMS compliance program, gold card expansion, pharmacy PA, appeal automation. Regulatory emphasis on CMS-0057-F timelines.

**Diagnostic fragment:** probing sequence on cycle time, CMS compliance, reviewer capacity redirection, gold card, multi-payer variance, appeal root cause, member experience.

### Part R · Rendering Contract

`/intelligence/patterns/prior-authorization-automation`. Light hero + dark working zone.

Unique rendering element: interactive prior auth cycle time visualization showing provider-side → payer-side → decision → member notification with cycle time attribution. Show intervention impact ranges.

Right sidebar (tenant): CMS-0057-F compliance status; current cycle time metrics; gold card program status.

Cross-links prominent to ambient clinical value chain pattern (integration opportunity).

---

*End of Part 3.1b · Prior Authorization Automation*

*Next in file sequence: `08-owned-brand-margin-recovery.md` — Part 3.2a Retail*

---
