# Curation Prompt · Financial Services

**Hand this to Claude Code (or research-augmented agent) to populate the financial-services substrate of the corpus.**

---

## You are doing v0 hand-curation for the financial-services industry slice of the AbarVa knowledge corpus, against the v1.1 schema.

**Required reading before starting:**
1. `docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md` (v1.0 base entities)
2. `docs/knowledge-corpus/SCHEMA_EXTENSIONS_V1_1.md` (Proof Point · Persona · Move Cascade · Anti-Pattern + lifecycle/trajectory/quantified-signal fields)
3. `docs/knowledge-corpus/PROVENANCE_AND_VERSIONING.md`
4. `docs/knowledge-corpus/CROSS_REFERENCE_GRAPH.md` + v1.1 cross-reference additions in SCHEMA_EXTENSIONS_V1_1.md

**Your output:** Populated JSON files in:
- `docs/knowledge-corpus/use-cases/UC-FS-*.json`
- `docs/knowledge-corpus/patterns/P-FS-*.json` and `P-CROSS-*.json` for cross-industry patterns
- `docs/knowledge-corpus/vendors/V-FS-*.json` and `V-CROSS-*.json`
- `docs/knowledge-corpus/sis/SI-FS-*.json` and `SI-CROSS-*.json`
- `docs/knowledge-corpus/regulatory/REG-*.json`
- `docs/knowledge-corpus/proof-points/PP-FS-*.json`
- `docs/knowledge-corpus/personas/PER-*-*.json`
- `docs/knowledge-corpus/move-cascades/MC-FS-*.json`
- `docs/knowledge-corpus/anti-patterns/AP-FS-*.json` and `AP-CROSS-*.json`

**Total scope (v1.1):**
- ~22 financial-services use cases
- ~25 patterns (mix of finserv-specific + cross-industry)
- ~35 vendors
- ~12 SIs
- ~13 regulatory entries (heavy regulatory load — finserv carries more rules than retail or healthcare)
- ~25 proof points
- ~10 personas
- ~6 move cascades
- ~10 anti-patterns

---

## Use case inventory · financial services

Populate one Use Case entity per item below. Each gets full v1.1 schema treatment including `lifecycle_stage`, `position_history`, `applicable_personas`, `proof_points`, `anti_patterns`, `cascades_position`.

### Front Office (8 use cases) — customer-facing, advisor-facing, branch-facing

1. **UC-FS-FRONT-001 · Wealth Advisor Copilot**
   AI copilots embedded in advisor desktops (Salesforce Financial Services Cloud + Einstein, Glassbox, Bridgewise). Surfaces client context, generates meeting prep, recommends portfolio moves.

2. **UC-FS-FRONT-002 · Customer Service AI for Banking**
   Conversational AI for retail banking customer service — balance inquiries, transaction disputes, account servicing. Sierra, Decagon, Ada, Kasisto, Personetics.

3. **UC-FS-FRONT-003 · Voice AI for Call Centers**
   Voice-based AI in banking + insurance call centers. PolyAI, Cognigy, Replicant, Verint, NICE.

4. **UC-FS-FRONT-004 · Personalization Engine for Banking Apps**
   Next-best-action recommendations in mobile banking. Personetics, Bond.ai, Custom.

5. **UC-FS-FRONT-005 · Financial Health / Insights Coach**
   AI-driven financial health insights for retail customers. Personetics, MX, Plaid Beacon.

6. **UC-FS-FRONT-006 · Digital Onboarding + KYC AI**
   ML-driven KYC, fraud detection at account opening, ID verification. Alloy, Socure, Onfido, Sumsub.

7. **UC-FS-FRONT-007 · Robo-Advisor Modernization**
   Goals-based portfolio AI, tax-loss harvesting, dynamic rebalancing. Custom + BlackRock Aladdin Wealth, Envestnet.

8. **UC-FS-FRONT-008 · Insurance Underwriting Copilot**
   AI-assisted underwriting decisions for property/casualty + life. Munich Re Risk Suite, Tractable, Shift Technology.

### Middle Office (8 use cases) — risk, compliance, treasury, capital

9. **UC-FS-MIDDLE-001 · Credit Decisioning Modernization**
   ML-driven credit scoring, alternative data, instant decisioning. Zest AI, Upstart, Pagaya, custom.

10. **UC-FS-MIDDLE-002 · AML / Transaction Monitoring AI**
    Modernized anti-money-laundering with ML/graph. Hawk AI, Featurespace, ComplyAdvantage, NICE Actimize.

11. **UC-FS-MIDDLE-003 · Fraud Detection AI**
    Real-time payment fraud + identity fraud. Featurespace, Forter, Sift, Riskified, Hawk AI.

12. **UC-FS-MIDDLE-004 · Trade Surveillance + Market Abuse**
    AI-driven trade surveillance for market abuse, insider trading patterns. NICE Actimize, NASDAQ TRACE, Eventus.

13. **UC-FS-MIDDLE-005 · Regulatory Reporting Automation**
    AI for CCAR/DFAST stress testing, Basel reporting, FINREP/COREP. Custom + Moody's, S&P, Wolters Kluwer.

14. **UC-FS-MIDDLE-006 · Loan Servicing AI**
    AI-driven loan servicing — collections triage, modification recommendations, hardship assistance.

15. **UC-FS-MIDDLE-007 · Treasury / Cash Management AI**
    Liquidity forecasting, intraday liquidity AI, FX optimization. Kyriba, GTreasury, ION.

16. **UC-FS-MIDDLE-008 · Insurance Claims Automation**
    AI for claims triage, fast-track claims, fraud-flag in claims. Tractable, Shift, Snapsheet, custom.

### Back Office (6 use cases) — IT, ops, finance, HR

17. **UC-FS-BACK-001 · GitHub Copilot / Cursor for Engineering Velocity**
    AI coding assistants in financial-services engineering teams. Heightened scrutiny on data exfiltration and audit trail.

18. **UC-FS-BACK-002 · ServiceNow Now Assist for Banking IT**
    ServiceNow's AI for IT service management. Often paired with regulatory ITGC controls.

19. **UC-FS-BACK-003 · Workday AI Agents for HR / Finance**
    Workday's AI for hiring, onboarding, finance close. Standard finserv adoption.

20. **UC-FS-BACK-004 · Process Automation Expansion (RPA + Agentic)**
    Combination RPA + agentic process redesign for back-office banking ops. UiPath, Automation Anywhere, MS Power Automate.

21. **UC-FS-BACK-005 · Document Intelligence for Finance Operations**
    AI for extracting structured data from financial documents (loan docs, contracts, statements). Hyperscience, Instabase, AWS Textract.

22. **UC-FS-BACK-006 · Model Risk Management Platform (MRM AI)**
    AI-driven model governance — model inventory, validation, monitoring per SR 11-7 / SS 1/23. Modeleq, custom + ML platforms.

---

## Pattern inventory · financial services

Populate ~25 pattern entities. Mix of finserv-specific patterns (P-FS-*) and cross-industry patterns relevant to finserv (P-CROSS-*).

**Each pattern requires `quantified_signal` (per v1.1)** with with-pattern vs without-pattern numbers. If quantification isn't available, flag and seek additional sources.

Suggested pattern themes:

**Sponsorship / governance patterns (finserv-specific):**
- "Chief Risk Officer co-sponsorship is binding for AML/credit AI" (without CRO: regulatory pushback risk +60%)
- "Three-lines-of-defense model integration during AI rollout" (audit findings -45% with vs without)
- "Model Risk Management governance from Day 1, not Day 365" (SR 11-7 audit failure rate)
- "Compliance + Tech co-sponsorship for customer-facing AI" (regulatory enforcement risk)

**Adoption patterns:**
- "Advisor Copilot adoption: peaks at week 6 if reps see meeting-prep value · valley if used as monitoring tool"
- "Retail banking AI: pilot in customer-service CSAT-low cohort first"
- "Claims AI: paired with adjuster-led pilot, not adjuster-replacement messaging"

**Vendor selection patterns (finserv-specific):**
- "Buy-vs-build for credit AI: regional banks buy (Zest, Upstart); mega banks build (custom)"
- "Core banking-native AI vs best-of-breed: lock-in tradeoff favors best-of-breed for regional banks"
- "AML: incumbent (NICE Actimize) vs challenger (Hawk, Featurespace) — challenger wins on false-positive reduction; incumbent on regulatory comfort"

**Failure mode patterns:**
- "Black-box ML in credit decisioning fails fair-lending audit (ECOA / FCRA)"
- "AML AI without explainability stalls in second-line review"
- "Trade surveillance AI without analyst calibration produces alert fatigue · 70% dismissal rate"
- "Insurance underwriting AI without bias audit triggers state regulator action"

**Cross-industry patterns (finserv flavor):**
- "AI-driven decisions on credit/insurance require auditable reasoning trail (regulatory)"
- "PII-handling AI requires SOC 2 + per-jurisdiction privacy compliance"
- "Customer-facing AI failure modes are amplified in regulated industries"

Ground each pattern in evidence (multiple use case observations, analyst data, customer signal where available). Quantified signal is mandatory for range claims per v1.1.

---

## Vendor inventory · financial services

Populate ~35 vendors across all use cases. Include `share_trajectory` + `signal_basis` per v1.1.

**Finserv-specific vendors** (V-FS-*):

*Customer service / chat / voice:*
- Kasisto (banking-native conversational AI)
- Personetics (insights + customer engagement)
- Bond.ai
- MX (financial data + insights)
- Plaid Beacon
- Bridgewise (advisor-facing)

*Credit + decisioning:*
- Zest AI
- Upstart
- Pagaya
- Underwrite.ai

*KYC / Identity / Onboarding:*
- Alloy
- Socure
- Onfido (now Entrust)
- Sumsub
- Persona

*Fraud + AML:*
- Featurespace
- Hawk AI
- ComplyAdvantage
- NICE Actimize
- SymphonyAI Sensa
- NASDAQ Verafin
- Eventus (trade surveillance)

*Insurance:*
- Tractable
- Shift Technology
- Snapsheet
- CCC Intelligent Solutions
- Munich Re Risk Suite

*Treasury + Markets:*
- Kyriba
- GTreasury
- ION
- BlackRock Aladdin

*Document intelligence (finserv applications):*
- Hyperscience
- Instabase

*Model Risk:*
- Modelop
- Validmind

**Cross-industry vendors** (V-CROSS-*):
- Microsoft (M365 Copilot, GitHub Copilot, Dynamics, Fabric)
- Salesforce (Einstein, Financial Services Cloud, Service Cloud, Data Cloud)
- SAP (Joule, S/4HANA Finance)
- Oracle (Fusion AI, Financial Services-specific)
- Workday (AI agents, HR, Finance)
- ServiceNow (Now Assist)
- UiPath, Automation Anywhere
- AWS / Azure / Google Cloud (foundation models, AI services)
- OpenAI / Anthropic (foundation models — relevant when finservs build custom)
- Snowflake (Cortex AI for analytics)

For each vendor, populate per v1.1 schema with `share_trajectory` + `signal_basis` reflecting 12-month rolling trend.

---

## SI inventory · financial services

Populate ~12 SI entities. Mix of cross-industry SIs (SI-CROSS-*) and finserv-specific (SI-FS-*).

**Cross-industry SIs (already curated for retail/healthcare; just add finserv practice strength):**
- Accenture (deep finserv practice — particularly capital markets + banking transformation)
- Deloitte (top finserv consulting — particularly risk + regulatory)
- PwC (regulatory + audit-adjacent)
- EY (financial services tech + risk transformation)
- KPMG (finserv risk + compliance focus)
- IBM Consulting (banking modernization + core)
- Capgemini (banking + insurance — Europe-strong)
- Infosys / TCS / Wipro (offshore finserv delivery)
- Cognizant (insurance + banking ops)

**Finserv-specific SIs:**
- Sapient (Publicis Sapient — capital markets digital)
- Avaloq + Crealogix (wealth tech)
- Synechron (banking digital)
- Genpact (insurance + banking ops)

For each SI, populate finserv `practice_strength`, vendor alliances (especially Salesforce FS Cloud, NICE, Aladdin), use case coverage. Note alliance tier where relevant.

---

## Regulatory inventory · financial services

Populate ~13 regulatory entities relevant to financial-services AI. Heavy regulatory load — significantly more than retail or healthcare.

1. **REG-US-020 · ECOA / Reg B** — Equal Credit Opportunity Act + Regulation B for credit AI fairness
2. **REG-US-021 · FCRA** — Fair Credit Reporting Act for credit decisioning AI
3. **REG-US-022 · UDAAP** — Unfair, Deceptive, Abusive Acts/Practices (CFPB) applied to AI
4. **REG-US-023 · SR 11-7 / OCC 2011-12 / SS 1/23** — Model Risk Management guidance for AI/ML
5. **REG-US-024 · Bank Secrecy Act / AML rules** — AML AI obligations + FinCEN
6. **REG-US-025 · CFPB Section 1033** — Consumer financial data rights affecting AI personalization
7. **REG-US-026 · NYDFS Cybersecurity / AI-specific guidance** — NY state AI guidance
8. **REG-US-027 · CCPA / CPRA + state privacy** — Consumer data + AI overlay
9. **REG-EU-010 · GDPR** — for global finservs with EU operations
10. **REG-EU-011 · EU AI Act** — risk-tiered AI obligations including credit/insurance high-risk classifications
11. **REG-EU-012 · DORA (Digital Operational Resilience Act)** — third-party AI vendor obligations
12. **REG-INT-001 · Basel III/IV + capital frameworks** — implications for credit AI
13. **REG-XX-002 · Cross-jurisdictional AI labeling + transparency proposals** — emerging

For each, populate per schema. Cross-reference to finserv use cases that are affected. For high-impact regulations (SR 11-7, ECOA, EU AI Act) cross-reference applies broadly across most finserv use cases.

---

## Proof Point inventory · financial services *(v1.1 new)*

Populate ~25 named-customer deployments per `SCHEMA_EXTENSIONS_V1_1.md` Entity 6.

**Each Proof Point requires:** named customer · specific use case · measured outcome with date and scope · HIGH-reliability source.

Examples to research and populate (illustrative — confirm and expand):

*Banking customer service / advisor:*
- JPMorgan × Salesforce + custom AI · 2024 advisor copilot rollout
- Bank of America × Erica · 10+ years of conversational AI evolution + recent LLM upgrade
- Wells Fargo × custom advisor AI · 2024
- HSBC × Personetics · customer engagement AI

*Credit / underwriting:*
- Capital One × custom credit AI · long history; recent generative
- Upstart customer disclosures · partner banks (e.g., First National Bank of Omaha · Cross River)
- Citi × Zest AI · disclosed 2023

*Fraud / AML:*
- Mastercard × Decision Intelligence · network-wide AI fraud
- Visa × Visa Advanced Authorization · ML at scale
- HSBC × Quantexa · AML graph
- Standard Chartered × Featurespace

*Trading / capital markets:*
- Goldman Sachs × custom + OpenAI · disclosed engineering velocity gains
- JPMorgan × custom IndexGPT-style work
- BlackRock × Aladdin AI

*Insurance:*
- Zurich × Tractable · auto claims
- Allstate × custom + AI claims · disclosed
- Lemonade · LLM-powered customer service from day 1
- USAA × custom + chat AI

*Engineering / developer productivity:*
- Goldman × GitHub Copilot · disclosed 2024
- Morgan Stanley × OpenAI · disclosed enterprise rollout
- JPMorgan × custom code AI

*Regulatory / compliance:*
- Citi × Hawk AI · AML modernization
- Deutsche Bank × NICE Actimize × AI augmentation
- BNY Mellon × custom MRM platform

For each, follow the v1.1 Proof Point schema · cite measured_outcomes with period and confidence · capture art_of_possible_quote where a public statement exists.

---

## Persona inventory · financial services *(v1.1 new)*

Populate ~10 personas per `SCHEMA_EXTENSIONS_V1_1.md` Entity 7.

**Standard finserv personas:**

1. **PER-CIO-002 · Chief Information Officer · Bank** — modernization, vendor consolidation, regulatory IT spend
2. **PER-CFO-002 · Chief Financial Officer · Bank** — return on AI spend, capital allocation, ROIC
3. **PER-CRO-001 · Chief Risk Officer · Bank** — AML/credit risk, model risk, regulatory exposure
4. **PER-CDO-002 · Chief Data Officer · Bank** — data foundation, AI substrate quality, governance
5. **PER-CCO-001 · Chief Compliance Officer · Bank** — UDAAP exposure, ECOA fair lending, audit readiness
6. **PER-CDIGITAL-001 · Chief Digital Officer · Bank** — customer experience, mobile banking, advisor experience
7. **PER-CMO-002 · Chief Marketing Officer · Bank** — personalization, customer engagement, attribution
8. **PER-CTO-001 · Chief Technology Officer · Insurance** — claims tech modernization, underwriting platforms
9. **PER-CCO-002 · Chief Claims Officer · Insurance** — claims automation, customer experience in claims
10. **PER-CWMO-001 · Chief Wealth Management Officer / Head of Wealth** — advisor productivity, AUM growth

For each, capture `primary_concerns`, `typical_kpi_focus`, `typical_objections` (with evidenced_response and proof_point references), `typical_hypotheses`, and `primary_relationships` per the v1.1 schema.

---

## Move Cascade inventory · financial services *(v1.1 new)*

Populate ~6 cascades per `SCHEMA_EXTENSIONS_V1_1.md` Entity 8.

Suggested cascades to research and populate:

1. **MC-FS-001 · Engineering velocity → Custom AI products → Differentiated customer AI**
   GitHub Copilot ramp → custom internal AI tooling → customer-facing differentiated AI experiences. Goldman / JPMorgan / Capital One have walked this.

2. **MC-FS-002 · KYC modernization → Onboarding AI → Personalization → Lifecycle marketing**
   Cleaner identity substrate enables onboarding personalization which enables lifecycle marketing AI.

3. **MC-FS-003 · AML modernization → Trade surveillance → Holistic financial-crime platform**
   AML AI maturity creates substrate for trade surveillance which consolidates into one financial-crime platform.

4. **MC-FS-004 · Credit AI → Loan servicing AI → Collections AI**
   Credit decisioning AI's risk-tier substrate enables AI-driven servicing which enables intelligent collections.

5. **MC-FS-005 · Advisor Copilot → Personalized client portfolio AI → AI-driven plan generation**
   Cascade of wealth-side AI from advisor productivity to client-facing personalization to plan generation.

6. **MC-FS-006 · Document intelligence → Process automation → Agentic workflow**
   Doc AI cleans the input substrate, RPA modernizes, agentic redesigns the workflow itself.

For each, follow the v1.1 Move Cascade schema · capture `cascade_steps[]` with success_threshold and enables_step_n_plus_1_via mechanism · capture `failure_modes_at_handoff[]` · cite cascade_evidence (observation count + completion rate).

---

## Anti-Pattern inventory · financial services *(v1.1 new)*

Populate ~10 anti-patterns per `SCHEMA_EXTENSIONS_V1_1.md` Entity 9.

Finserv-specific anti-patterns to populate:

1. **AP-FS-001 · Black-box AI in credit decisioning** — fails ECOA / FCRA explainability requirements
2. **AP-FS-002 · AML AI without analyst calibration** — alert fatigue · false-positive saturation
3. **AP-FS-003 · Customer-facing AI without human-escalation path** — UDAAP exposure
4. **AP-FS-004 · Model Risk Management bolted on after deployment** — SR 11-7 audit failure
5. **AP-FS-005 · Personalization without consent infrastructure** — Section 1033 + state privacy violations
6. **AP-FS-006 · Bias drift in credit/insurance models** — fair-lending exposure as substrate shifts
7. **AP-FS-007 · Cross-border data leak via AI vendor** — DORA + jurisdictional compliance gap
8. **AP-FS-008 · "Advisor replacement" messaging on advisor copilot** — adoption collapse + union/regulatory pushback
9. **AP-FS-009 · AI-driven trading without surveillance integration** — market abuse exposure
10. **AP-CROSS-002 · Vendor lock-in via foundation-model embeddings** — cross-industry but acute in finserv given regulatory portability requirements

For each, capture `quantified_signal` (with vs without anti-pattern numbers) · `early_signals[]` with severity · `typical_recovery` · `prevention_patterns[]` reference.

---

## Curation rules (carried from v1.0 + v1.1 additions)

1. **Use real names.** "Goldman Sachs," not "Major investment bank."

2. **Provenance on every claim.** Every value range, vendor health signal, regulatory citation traces to a source. Finserv has higher reliability standards — vendor claims about regulatory compliance must be corroborated by analyst or regulatory source.

3. **Reliability ratings.** HIGH for analyst firms (Gartner, Forrester, Celent on finserv); HIGH for public earnings + regulatory filings; MED for trade press; treat vendor compliance claims as MED until corroborated.

4. **Cross-references bidirectional.** Including v1.1 cross-references (Proof Point ↔ Use Case ↔ Vendor; Anti-Pattern ↔ Use Case; Cascade steps ↔ Use Case position).

5. **Currency dates per claim.** Especially aggressive in finserv given regulatory volatility — `last_refreshed` quarterly minimum on regulatory entries, monthly preferred.

6. **No fabrication.** Especially: don't invent vendor compliance posture or proof-point outcomes. Banking + insurance customers will fact-check.

7. **Three Tests per entity.** Source identifiable, currency tracked, reliability rated.

8. **Cross-industry recognition.** Vendors and patterns spanning industries get CROSS- IDs.

9. **v1.1 specifics:**
   - `lifecycle_stage` populated on every Use Case
   - `share_trajectory` populated on every Vendor with 12-month signal basis
   - `quantified_signal` populated on every Pattern with range claims
   - Proof Points: customer + use case + vendor + measured outcome + HIGH source
   - Personas: at least 3 typical_objections each with evidenced_response
   - Move Cascades: cascade_evidence with observation_count + completion_rate
   - Anti-Patterns: quantified_signal (with vs without numbers) + early_signals

---

## Output format

Each entity is a JSON file matching the v1.0 + v1.1 schema. Validate against schema before commit.

---

## Stop conditions

Halt and request human input when:

1. **Source unavailable** for a critical claim (vendor financial health · regulatory ruling)
2. **Vendor status ambiguous** (alive · acquired · defunct unclear)
3. **Schema gap discovered** — v1.1 doesn't carry a needed field
4. **Cross-reference cycle** — references break bidirectional consistency
5. **Conflicting sources** of similar reliability — capture both with disagreement note
6. **Regulatory ambiguity** — when finserv regulatory interpretation is contested, capture both interpretations and flag for legal review
7. **More than 4 hours of agent run time** elapsed without significant progress — pause for direction

For all stop conditions: capture state, write to `docs/build/corpus-curation-finserv-{date}/stop-conditions.md`, halt.

---

## Output reporting

After each entity committed, log to `docs/build/corpus-curation-finserv-{date}/commit-log.md`.

After full finserv population complete, output `docs/build/corpus-curation-finserv-{date}/COMPLETION_REPORT.md`:
- Total entities created (by type · v1.0 + v1.1)
- Total cross-references (incl. v1.1 edges)
- Provenance source distribution
- Stop conditions encountered
- Recommended next refresh dates

---

## What this prompt does NOT do

- Does not populate retail or healthcare (separate prompts)
- Does not wire agents to corpus (separate: AGENT_INTEGRATION_PROMPT.md)
- Does not modify schema (v1.0 + v1.1 are locked)
- Does not make competitive judgments
- Does not include AbarVa-internal data

---

## Begin

Read schema (v1.0 + v1.1), provenance discipline, cross-reference graph rules. Then start with use cases (UC-FS-FRONT-001 onwards), populate vendors and SIs as you go (so cross-references are available), then patterns (which reference back to use cases), then proof points (which require vendor + use case to exist), then personas (which reference proof points), then cascades (which require multiple use cases to exist), then anti-patterns (which require multiple use cases for cross-reference), then regulatory.

Take it slow. Provenance discipline is more important than speed. Better to have 15 fully-curated v1.1-complete use cases than 22 sparse ones.
