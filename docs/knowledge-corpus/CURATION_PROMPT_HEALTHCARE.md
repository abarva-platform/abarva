# Curation Prompt · Healthcare

**Hand this to Claude Code (or research-augmented agent) to populate the healthcare substrate of the corpus.**

---

## You are doing v0 hand-curation for the healthcare industry slice of the AbarVa knowledge corpus.

**Required reading before starting:**
1. `docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md`
2. `docs/knowledge-corpus/PROVENANCE_AND_VERSIONING.md`
3. `docs/knowledge-corpus/CROSS_REFERENCE_GRAPH.md`

**Your output:** Populated JSON files in:
- `docs/knowledge-corpus/use-cases/UC-HC-*.json`
- `docs/knowledge-corpus/patterns/P-HC-*.json` and `P-CROSS-*.json` for cross-industry healthcare-relevant patterns
- `docs/knowledge-corpus/vendors/V-HC-*.json` and `V-CROSS-*.json`
- `docs/knowledge-corpus/sis/SI-HC-*.json` and `SI-CROSS-*.json`
- `docs/knowledge-corpus/regulatory/REG-*.json` (regulatory entries that touch healthcare use cases)

**Total scope:**
- ~23 healthcare use cases
- ~25 patterns (mix of healthcare-specific and cross-industry)
- ~30-40 vendors
- ~10-15 SIs
- ~10-15 regulatory entries (healthcare is regulation-dense)

---

## Use case inventory · healthcare

Populate one Use Case entity per item below.

### Front Office · patient-facing and clinician-facing (7 use cases)

1. **UC-HC-FRONT-001 · Ambient AI Clinical Documentation**
   AI scribes for clinical encounters. Nuance DAX (Microsoft), Suki, Abridge, Augmedix, DeepScribe.

2. **UC-HC-FRONT-002 · Patient-Facing Conversational AI**
   Patient-facing chatbots for appointment booking, symptom check, results explanation. Hyro, K Health, Conversa, custom.

3. **UC-HC-FRONT-003 · Clinician Copilot for Chart Review and Order Entry**
   AI assistants embedded in EHR for chart synthesis, order entry, decision support. Epic AI native, Microsoft Healthcare Copilot, Pieces.

4. **UC-HC-FRONT-004 · Telehealth AI Triage**
   AI-powered triage and intake before telehealth visits. Buoy, K Health, custom.

5. **UC-HC-FRONT-005 · Patient Portal AI**
   AI in patient portals for appointment booking, results explanation, medication reminders. MyChart AI, Epic native.

6. **UC-HC-FRONT-006 · Care Coordination AI**
   AI for handoffs between care teams, transitional care, discharge planning. Olive (defunct — capture lesson), Notable, custom.

7. **UC-HC-FRONT-007 · Mental Health Screening AI**
   AI-supported screening for depression, anxiety, suicide risk. Spring Health, Lyra, custom.

### Middle Office · clinical decisioning (9 use cases)

8. **UC-HC-MIDDLE-001 · Epic AI for Revenue Cycle**
   Prior auth automation, denials prediction, claim scrubbing. Epic-native AI features.

9. **UC-HC-MIDDLE-002 · Clinical Risk Stratification**
   Predictive identification of high-risk patients. Epic Cognitive Computing, Jvion, Health Catalyst, Innovaccer.

10. **UC-HC-MIDDLE-003 · Sepsis / Deterioration Early Warning**
    Real-time deterioration prediction. Epic Sepsis Model (with documented controversy), Bayesian Health, custom.

11. **UC-HC-MIDDLE-004 · Readmission Prediction**
    30-day readmission risk scoring. Vendor and custom solutions.

12. **UC-HC-MIDDLE-005 · Imaging AI**
    Radiology AI for triage, detection, workflow. Aidoc, Viz.ai, Rad AI, custom.

13. **UC-HC-MIDDLE-006 · Pathology AI**
    Digital pathology with AI assist. PathAI, Ibex, Paige.

14. **UC-HC-MIDDLE-007 · Population Health AI for ACOs**
    Population-level analytics for value-based care. Innovaccer, Arcadia, Health Catalyst, custom.

15. **UC-HC-MIDDLE-008 · Clinical Trial Patient Matching**
    AI to match patients to clinical trials. Deep 6 AI, Mendel, Tempus.

16. **UC-HC-MIDDLE-009 · Care Management AI for High-Risk Panels**
    AI-assisted care management for high-cost members. Health plan + provider deployments.

### Back Office · operations (7 use cases)

17. **UC-HC-BACK-001 · SAP Joule / Workday for Finance and HR**
    SAP Joule and Workday agents in healthcare finance / HR operations.

18. **UC-HC-BACK-002 · Revenue Cycle Automation**
    Beyond Epic-native: end-to-end RCM automation. Notable, Akasa, Olive (defunct — lesson). Often paired with UC-HC-MIDDLE-001.

19. **UC-HC-BACK-003 · Supply Chain AI for Medical Devices and Pharma**
    Healthcare-specific supply chain. GHX, Tecsys, Workday Supply Chain, custom.

20. **UC-HC-BACK-004 · Compliance AI (HIPAA monitoring, regulatory reporting)**
    AI for HIPAA audit trails, regulatory reporting automation. Symphony Industrial AI, custom on data warehouses.

21. **UC-HC-BACK-005 · Vibe Coding / Cursor for IT / EHR Customization**
    AI coding assistants for healthcare IT and EHR customization teams.

22. **UC-HC-BACK-006 · ServiceNow Now Assist for IT Helpdesk**
    ServiceNow AI in healthcare IT helpdesk.

23. **UC-HC-BACK-007 · Model Governance + FinOps Platform**
    Governance for clinical AI models + FinOps for AI infrastructure costs. Credo AI, Holistic AI, Fiddler.

---

## Pattern inventory · healthcare

Populate ~25 pattern entities. Healthcare patterns are particularly rich because of clinical workflow integration concerns.

**Sponsorship / governance patterns:**
- "CMIO sponsorship pattern: ambient AI succeeds with CMIO; fails with CIO-only"
- "Clinical informaticist embedded in pilot governance"
- "Multi-stakeholder approval (CMIO + CIO + CFO + privacy officer) for patient-facing AI"
- "Privacy officer involvement from P0, not P3"

**Adoption patterns:**
- "Pilot in primary care first, specialty second"
- "Median-physician-tenure pilot site, not academic-flagship"
- "Champion identification before pilot launch"
- "EHR integration pattern: epic-native > epic-adjacent > standalone"

**Regulatory / compliance patterns:**
- "BAA-before-pilot pattern: HIPAA business associate agreements take 4-6 weeks; start in P2"
- "Patient-facing AI requires opt-out workflow design in P3"
- "Audit trail requirements for clinical decisioning"
- "FDA AI/ML guidance: SaMD vs non-SaMD classification matters for go-to-market timeline"

**Failure mode patterns:**
- "Predictive ML in clinical: model performance is the smaller concern; clinician trust is the larger"
- "Sepsis early warning: alert fatigue produces clinician override patterns; cliff at 30% override"
- "Revenue cycle AI: vendor outcome claims usually 30-50% above measured outcomes"
- "Population health AI: ROI requires value-based contracts in place; otherwise theoretical"

**Vendor selection patterns:**
- "Epic-native AI vs third-party: Epic-native wins on integration; third-party wins on time-to-feature"
- "Healthcare AI startup financial health: watch funding round dates; <12 months runway is risk"
- "Olive's collapse pattern: lessons for healthcare AI vendor due diligence"

**Cross-industry patterns:**
- "Vendor lock-in patterns" (relevant for Epic, Cerner)
- "AI rollout sponsorship discipline"
- "Change management investment ratio"

---

## Vendor inventory · healthcare

Populate ~30-40 vendor entities.

**Healthcare-specific vendors** (V-HC-*):
- Epic (V-HC-001) — dominant EHR with growing AI
- Oracle Cerner (V-HC-002) — EHR with AI features
- Microsoft Nuance / DAX (V-HC-003) — ambient AI documentation
- Suki (V-HC-004) — ambient AI
- Abridge (V-HC-005) — ambient AI
- Augmedix (V-HC-006) — ambient AI
- DeepScribe (V-HC-007) — ambient AI
- Innovaccer (V-HC-008) — population health, data platform — note in Meridian substrate as watch-status
- Health Catalyst (V-HC-009) — analytics platform
- Arcadia (V-HC-010) — population health
- Notable (V-HC-011) — RCM automation
- Akasa (V-HC-012) — RCM automation
- Olive (V-HC-013) — DEFUNCT — capture lesson
- Aidoc (V-HC-014) — imaging AI
- Viz.ai (V-HC-015) — imaging AI
- Rad AI (V-HC-016) — radiology workflow
- PathAI (V-HC-017) — pathology AI
- Ibex (V-HC-018) — pathology AI
- Paige (V-HC-019) — pathology AI
- Deep 6 AI (V-HC-020) — trial matching
- Mendel (V-HC-021) — trial matching
- Tempus (V-HC-022) — precision medicine
- Hyro (V-HC-023) — patient conversational AI
- K Health (V-HC-024) — patient AI / triage
- Conversa (V-HC-025) — patient AI
- Bayesian Health (V-HC-026) — sepsis early warning
- Pieces Technologies (V-HC-027) — clinician copilot
- Jvion (V-HC-028) — clinical risk
- Spring Health (V-HC-029) — mental health
- Lyra (V-HC-030) — mental health
- GHX (V-HC-031) — healthcare supply chain
- Tecsys (V-HC-032) — healthcare supply chain
- Credo AI (V-HC-033) — model governance (cross-industry but key for healthcare)
- Holistic AI (V-HC-034) — model governance
- Fiddler (V-HC-035) — model monitoring

**Cross-industry vendors** (V-CROSS-*) used in healthcare:
- Microsoft (M365 Copilot, GitHub Copilot, Healthcare Copilot, Fabric for Healthcare)
- Salesforce (Health Cloud + Einstein)
- SAP (Joule)
- Workday
- ServiceNow
- Oracle (Fusion AI for healthcare finance)

For each vendor, populate financial health carefully (healthcare AI startups have variable runway; Olive's collapse is recent precedent).

---

## SI inventory · healthcare

Populate ~10-15 SI entities.

**Cross-industry SIs with healthcare practice** (SI-CROSS-*):
- Accenture (SI-CROSS-001) — strong healthcare AI practice
- Deloitte (SI-CROSS-002)
- PwC, EY, KPMG
- IBM Consulting (with Watson Health legacy/lessons)
- Capgemini
- Cognizant (acquired Tegria 2024 — important for healthcare practice)

**Healthcare-specific SIs** (SI-HC-*):
- Tegria (SI-HC-001) — formerly Providence-owned, Cognizant-acquired; healthcare-native
- Nordic Consulting (SI-HC-002) — Epic implementation specialty
- Impact Advisors (SI-HC-003) — healthcare advisory
- Chartis Group (SI-HC-004) — healthcare advisory
- Galen Healthcare Solutions (SI-HC-005) — Epic-focused
- Optimum Healthcare IT (SI-HC-006) — healthcare IT
- HCTec (SI-HC-007)
- Bluetree Network (SI-HC-008)

For each SI, populate Epic / Cerner alliance details (these are foundational for healthcare AI implementation).

---

## Regulatory inventory · healthcare

Populate ~10-15 regulatory entities. Healthcare is regulation-dense.

1. **REG-US-005 · HIPAA Privacy Rule** (already templated in schema doc)
2. **REG-US-006 · HIPAA Security Rule**
3. **REG-US-007 · HITECH Act**
4. **REG-US-008 · CMS rules on AI in clinical decisioning**
5. **REG-US-009 · FDA SaMD (Software as a Medical Device) guidance**
6. **REG-US-010 · FDA AI/ML guidance for clinical AI**
7. **REG-US-011 · ONC Information Blocking Rule (relevant for AI access to records)**
8. **REG-US-012 · Medicare ACO regulations (relevant for population health AI)**
9. **REG-US-013 · State medical board AI rules (varies by state)**
10. **REG-EU-004 · GDPR for healthcare**
11. **REG-EU-005 · EU AI Act for healthcare (high-risk classifications)**
12. **REG-EU-006 · Medical Device Regulation (MDR)**
13. **REG-XX-005 · ICH GCP for AI in clinical trials**
14. **REG-US-014 · 21st Century Cures Act AI provisions**

For each, populate per schema. Cross-reference to healthcare use cases that are affected.

---

## Curation rules

Identical to retail prompt — see `CURATION_PROMPT_RETAIL.md` for the 8 rules. Plus healthcare-specific:

9. **Capture Olive lessons.** Olive's collapse in 2023 is the canonical "healthcare AI vendor failure" case. Multiple use cases (RCM, Care Coordination) reference Olive. Populate as DEFUNCT with detailed failure pattern. Cross-reference to vendor-due-diligence patterns.

10. **Capture Epic Sepsis Model controversy.** The published critique of Epic's sepsis model (JAMIA, NEJM) is a canonical lesson in healthcare AI validation. Capture in patterns and regulatory context.

11. **PHI considerations everywhere.** Almost every healthcare use case touches PHI. Cross-reference REG-US-005 (HIPAA Privacy Rule) on every patient-touching use case.

12. **Clinician trust is binding.** Healthcare patterns repeatedly show clinician trust > model accuracy. Patterns should reflect this.

13. **Vendor financial health volatility.** Healthcare AI vendors have higher financial health volatility than retail vendors. Populate financial signals carefully. Multiple vendors have failed in 2022-2025.

---

## Output format

Same JSON-per-entity format as retail. See CURATION_PROMPT_RETAIL.md for skeleton example.

---

## Stop conditions

Identical to retail. Plus healthcare-specific:

7. **PHI exposure ambiguity** — if a use case's PHI handling is unclear from sources, halt and confirm before populating. Don't speculate on HIPAA exposure.

8. **Clinical accuracy claims** — if vendor claims clinical performance (e.g., "95% accuracy on sepsis detection") but no peer-reviewed validation, mark as MED reliability and note vendor-self-reported.

9. **Regulatory uncertainty** — if a regulation's applicability to a use case is genuinely ambiguous (active rulemaking, conflicting guidance), capture the ambiguity rather than picking a side.

---

## Output reporting

Identical to retail. Output to `docs/build/corpus-curation-healthcare-{date}/`.

---

## Begin

Read schema (v1.0 + v1.1 in `SCHEMA_EXTENSIONS_V1_1.md`), provenance discipline, cross-reference graph rules. Order of population: use cases → vendors + SIs → patterns → proof points → personas → cascades → anti-patterns → regulatory.

Take it slow. Healthcare credibility depends on regulatory accuracy and clinical workflow understanding. Better to have 18 fully-curated v1.1-complete use cases than 23 sparse ones.

---

## v1.1 ADDITIONS · healthcare

After v1.0 entities are populated, this prompt extends to v1.1 entity types per `SCHEMA_EXTENSIONS_V1_1.md`.

### v1.1 use case fields · update each Use Case entry

Add to every UC-HC-* Use Case: `lifecycle_stage`, `position_history`, `applicable_personas`, `proof_points`, `anti_patterns`, `cascades_position`.

### v1.1 vendor field

Add `share_trajectory` + `trajectory_signal_basis` + `trajectory_history` per Vendor.

### v1.1 pattern field

Add `quantified_signal` (with vs without numbers, source, confidence).

### Healthcare Proof Point inventory · ~30 named deployments

Per `SCHEMA_EXTENSIONS_V1_1.md` Entity 6. Examples to research and populate:

*Ambient documentation:*
- Cleveland Clinic × DAX Copilot · 2024 (8000+ physicians)
- Stanford Healthcare × Abridge · disclosed 2024
- Mass General Brigham × DAX · 2024 deployment
- HCA Healthcare × custom + Suki/DAX
- Northwell Health × DAX
- Banner Health × Augmedix

*Revenue cycle / claims:*
- Mayo Clinic × Epic AI / Notable
- Mount Sinai × Notable Health
- UPMC × custom RCM AI · disclosed earnings impact
- Atrium Health × Olive (note: Olive defunct 2023 — capture as cautionary case)

*Population health / ACO:*
- UPMC × Population Health AI · MSSP $31M shared savings disclosed
- Geisinger × custom population health
- Intermountain × custom + Innovaccer
- Chenmed × care management AI

*Clinical AI (sepsis, risk):*
- Sutter Health × custom sepsis EWS · NEJM Catalyst 2023
- Johns Hopkins × custom sepsis AI · published JAMIA
- Northwell × clinical risk stratification
- Mercy × custom predictive
- Kaiser Permanente × custom population AI (multiple disclosures)

*Imaging:*
- Mass General × custom + Aidoc
- Cedars-Sinai × custom imaging AI
- Penn Medicine × Aidoc

*Prior auth:*
- Kaiser × custom prior auth automation · earnings disclosure
- Cigna × custom + Notable
- Anthem × custom

*Engineering / IT:*
- Mayo × GitHub Copilot
- Cleveland Clinic × custom + Microsoft Fabric

*Voice / triage:*
- Memorial Sloan Kettering × patient-facing AI
- Cedars × patient chatbot

For each: customer · use case ID · vendor ID · scope · measured outcomes with date · HIGH-reliability sources (peer-reviewed studies preferred for clinical outcomes; press releases acceptable for operational outcomes).

### Healthcare Persona inventory · ~10 personas

Per `SCHEMA_EXTENSIONS_V1_1.md` Entity 7:

- PER-CIO-001 · Chief Information Officer · IDN
- PER-CMIO-001 · Chief Medical Information Officer · IDN (prototypical co-sponsor for clinical AI)
- PER-CMO-001 · Chief Medical Officer · IDN
- PER-CFO-001 · Chief Financial Officer · IDN (margin pressure, value-based-care economics)
- PER-CHRO-002 · Chief Human Resources Officer · IDN (workforce shortage context)
- PER-CDO-001 · Chief Digital Officer · IDN
- PER-CCO-004 · Chief Clinical Officer / Chief Quality Officer
- PER-CNIO-001 · Chief Nursing Informatics Officer
- PER-CNO-001 · Chief Nursing Officer (workflow + adoption focus)
- PER-COO-001 · Chief Operating Officer · IDN

For each: primary_concerns · typical_kpi_focus · 3+ typical_objections (each with evidenced_response + proof_point references). CMIO persona is especially important to populate richly — referenced as the binding co-sponsor across multiple healthcare use cases.

### Healthcare Move Cascade inventory · ~6 cascades

Per `SCHEMA_EXTENSIONS_V1_1.md` Entity 8:

1. **MC-HC-001 · Ambient docs → Epic AI Rev Cycle → Population Health for ACOs** (the IDN cascade — worked example in SCHEMA_EXTENSIONS_V1_1.md)
2. **MC-HC-002 · Clinical risk stratification → Care management AI → Sepsis early warning** (clinical-side cascade)
3. **MC-HC-003 · Engineering velocity → Custom clinical AI tooling → Differentiated patient experience AI**
4. **MC-HC-004 · Imaging AI → Multi-modal clinical AI → Cross-specialty AI orchestration**
5. **MC-HC-005 · Prior auth automation → Claims denial prediction → Population health revenue uplift**
6. **MC-HC-006 · ServiceNow Now Assist → SAP Joule (finance) → Workday agents (HR) — back-office cascade**

For each: cascade_steps · success_threshold · enables_step_n_plus_1_via mechanism · failure_modes_at_handoff · cascade_evidence with completion_rate.

### Healthcare Anti-Pattern inventory · ~10 anti-patterns

Per `SCHEMA_EXTENSIONS_V1_1.md` Entity 9:

1. AP-HC-001 · CIO-only sponsorship for clinical AI (P-HC-005 prevents) — applies across UC-HC-FRONT-001, MIDDLE-001, MIDDLE-002
2. AP-HC-002 · Pilot-to-scale gap (worked example in SCHEMA_EXTENSIONS_V1_1.md)
3. AP-HC-003 · Adoption gap (no manager/CMIO reinforcement)
4. AP-HC-004 · BAA-after-pilot (HIPAA) — applies broadly
5. AP-HC-005 · Specialty-led pilot (selection bias) — UC-HC-FRONT-001
6. AP-HC-006 · Risk-model bias drift (post-COVID training data drift) — UC-HC-MIDDLE-002, MIDDLE-007
7. AP-HC-007 · Risk-tier panel skipping (population health) — UC-HC-MIDDLE-007
8. AP-HC-008 · IT-imposed workflow framing — applies broadly to clinical AI
9. AP-HC-009 · Alert fatigue (in clinical AI) — UC-HC-MIDDLE-003, MIDDLE-002
10. AP-HC-010 · Detection without intervention protocol — UC-HC-MIDDLE-003

For each: quantified_signal · early_signals[] · typical_recovery · prevention_patterns reference.

### Output reporting · v1.1

Update `COMPLETION_REPORT.md` to include v1.1 entity counts and cross-reference counts (PP↔UC, AP↔UC, MC↔UC, PER↔UC).
