# Part 3.3b · Customer Onboarding & KYC AI (Financial Services)

## 3.3b · Customer Onboarding & KYC AI

### YAML front-matter

```yaml
pattern_id: pattern_customer_onboarding_kyc_ai
slug: customer-onboarding-kyc-ai
name: Customer Onboarding & KYC AI
version: 1.0.0
status: active
category: Identity, Onboarding & Customer Due Diligence
cross_industry: false
sector_applicability: [financial_services, insurance, payments, crypto_digital_asset]
primary_sector: financial_services
short_description: >
  The integrated program to modernize customer onboarding and Know Your
  Customer (KYC) operations with AI — document extraction and ID verification,
  liveness and biometric matching, behavioral signals and device intelligence,
  identity graph and synthetic identity detection, beneficial ownership and
  related-party resolution, sanctions and PEP screening, perpetual / event-
  driven KYC, risk-based authentication and EDD, and the operating model
  that converts onboarding from a drop-off-heavy friction layer into a
  risk-calibrated customer experience. Addresses failure modes of high
  digital drop-off, manual review bottlenecks, static KYC, and siloed
  consumer / commercial / wealth / crypto onboarding functions.
long_description: >
  Onboarding is where the bank or insurer or fintech meets the customer, the
  regulator meets the institution, and the fraudster meets both. It is the
  single most consequential touchpoint for customer acquisition economics, for
  fraud loss rate, and for financial crimes compliance posture. The traditional
  onboarding stack — manual document capture, rules-based verification, batch
  sanctions screening, manual EDD, periodic review cycles — produces drop-off
  rates of 30-60% on digital channels, manual review queues measured in days,
  static customer risk assessments that go stale between review cycles, and
  significant synthetic identity exposure. Modern onboarding is AI-first:
  document extraction with neural OCR and structured field validation;
  liveness and biometric matching at mobile capture; device and behavioral
  signals fused with consortium identity data; graph-based identity resolution
  for beneficial ownership, related-party, and synthetic identity detection;
  real-time sanctions and PEP screening with fuzzy matching and adverse media;
  risk-based authentication that calibrates friction to risk; perpetual KYC
  that refreshes risk continuously based on events and behavior; EDD workflow
  with evidence capture and audit trails. The pattern captures the integrated
  program across consumer, small business, commercial, wealth, and (where
  applicable) crypto onboarding — with the regulatory framing (CIP, CDD Rule,
  CTA, OFAC, EU AI Act biometric provisions, GDPR, state privacy) and the
  operating model shifts required to convert onboarding from a cost center
  and risk center into a competitive advantage.
confidence_floor: 0.75
n_observations_floor: 6
related_patterns:
  - { id: pattern_fraud_detection_modernization, relationship: associative }
  - { id: pattern_analytics_modernization, relationship: parent }
  - { id: pattern_ai_governance_operating_model, relationship: associative }
  - { id: pattern_ai_use_case_portfolio, relationship: associative }
regulatory_frameworks:
  - id: framework_bsa_cip
    applicability: always
  - id: framework_fincen_cdd_rule
    applicability: us_legal_entities
  - id: framework_corporate_transparency_act
    applicability: us_entities
  - id: framework_ofac_sanctions
    applicability: always
  - id: framework_fatca_crs
    applicability: cross_border
  - id: framework_nist_ai_rmf
    applicability: always
  - id: framework_eu_ai_act
    applicability: eu_operations_biometric
  - id: framework_gdpr
    applicability: eu_personal_data
  - id: framework_ccpa_cpra
    applicability: california_consumers
  - id: framework_finra_kyc
    applicability: broker_dealers
authored_by: anand + claude
last_curated_by: anand
```

### Part A · Pattern Identity

**ID:** `pattern_customer_onboarding_kyc_ai`
**Name:** Customer Onboarding & KYC AI
**Short description:** Integrated modernization program for onboarding across consumer, SMB, commercial, wealth, and crypto segments — document ID extraction, liveness/biometrics, identity graph, synthetic identity detection, beneficial ownership resolution, sanctions/PEP screening, perpetual KYC, and risk-based authentication with EDD workflow.

**Long description:** Onboarding modernization is an AI program, a regulatory program, and an operating model program at once. AI delivers the detection capability (document fraud, synthetic identity, related-party networks), the automation (straight-through processing for low-risk applicants), and the risk calibration (friction proportional to risk). Regulation shapes the envelope: CIP requires specific verification steps; CDD Rule requires beneficial ownership identification; the Corporate Transparency Act creates new reporting obligations; OFAC and PEP screening is non-negotiable; EU AI Act imposes constraints on biometric processing; GDPR and state privacy laws govern data use. Operating model ties it together: straight-through processing decisions, manual review queues, EDD workflow, perpetual KYC triggers, and model governance must all be redesigned. The pattern captures the integrated program that transforms onboarding from a drop-off-heavy cost center into a calibrated, straight-through-first, risk-aware customer experience with defensible compliance posture.

### Part B · Classification

**Category:** Identity, Onboarding & Customer Due Diligence
**Cross-industry:** No — financial services core with insurance, payments, crypto, and specific industry extensions (broker-dealer, investment advisor, money services)
**Primary sector:** Financial Services (banks, credit unions, fintechs, broker-dealers, RIAs)
**Sector applicability:** Financial services, insurance (applicant onboarding), payments (merchant onboarding), crypto/digital asset (user onboarding with MSB obligations)
**Variant of:** None (foundational financial services vertical pattern paired with fraud modernization)

### Part C · Detection — Signals

Pattern activates when ≥3 signals present with sufficient severity:

1. **Digital onboarding drop-off elevated.** Consumer digital account opening funnel drop-off above 35%. Commercial and wealth onboarding measured in days to weeks rather than hours.

2. **Manual review queue bottleneck.** 25%+ of applications route to manual review. Manual review aging measured in days. Reviewers work in ticket systems without integrated evidence, risk scoring, or decision support.

3. **Static KYC refresh cycles.** Customer risk assessments refreshed on fixed cadence (annual, triennial) regardless of behavior changes. Event-driven refresh rare. Perpetual KYC absent.

4. **Synthetic identity exposure visible.** Synthetic identity fraud (fabricated identities combining real and fake elements) showing up in charge-off cohorts, particularly in unsecured credit portfolios. Identity graph capability weak or absent.

5. **Siloed onboarding functions.** Consumer, SMB, commercial, wealth, and (where applicable) crypto onboarding run by separate teams with separate technology stacks and inconsistent risk frameworks. Enterprise customer view fragmented.

6. **Beneficial ownership resolution manual.** CDD Rule and CTA-driven beneficial ownership identification managed with spreadsheets, PDFs, and email. Related-party graph lives in investigator heads.

7. **Screening technology dated.** Sanctions and PEP screening by exact match or basic fuzzy matching. Adverse media monitoring absent or ad-hoc. Batch orientation.

8. **Vendor proliferation without orchestration.** Multiple identity vendors (Jumio / Onfido / Socure / LexisNexis / Plaid / others) integrated point-to-point without orchestration. Waterfall logic hard-coded. Vendor rationalization stuck.

### Part D · Detection — Diagnostic Questions

1. What is your digital consumer onboarding drop-off rate? Where in the funnel does drop-off concentrate (ID capture, income verification, identity verification, sanctions screening, KYC questions, beneficial ownership)?

2. What percent of applications route to manual review? What is the queue aging? Do reviewers have integrated evidence, risk scores, and decision support?

3. How is customer risk assessment refreshed? Fixed cycle, event-driven, perpetual? How do behavior or product changes trigger reassessment?

4. What is your synthetic identity exposure by portfolio? What identity graph capability do you have to detect linked-account patterns, device clusters, synthetic network signatures?

5. How unified is onboarding across consumer / SMB / commercial / wealth / other segments? What's in common — identity data, risk framework, technology? What's fragmented?

6. How is beneficial ownership captured, verified, and monitored? Are you prepared for CTA reporting obligations? How are related-party relationships graphed?

7. How do you screen sanctions, PEPs, and adverse media? Real-time at onboarding and continuously on portfolio? Fuzzy matching quality? Adverse media coverage?

8. What identity orchestration layer do you use (or: are vendors integrated point-to-point)? How do you evolve vendor mix without re-platforming?

### Part E · Causal Structure

**Root causes:**

- **Organizational evolution by product line.** Consumer banking, commercial banking, wealth management, and (where applicable) fintech/crypto lines evolved onboarding independently with product-specific technology, processes, and operations teams.
- **Technology debt in ID verification and screening.** Incumbent ID verification tools were built for document OCR + structured checks, not neural extraction + biometric matching + behavioral signals. Screening tools were built for exact/fuzzy matching against small lists, not continuous adverse media + behavioral monitoring.
- **Regulatory layering without architectural rethink.** CIP, CDD Rule, CTA, FATCA, CRS, OFAC, FinCEN Beneficial Ownership Registry each added layers to onboarding processes without architectural re-baselining.
- **Manual review as release valve.** When AI/technology fails to make a confident decision, manual review catches the miss. Over time, manual review becomes a load-bearing part of the process instead of an exception handler.
- **Identity data fragmentation.** Authoritative identity data lives across ID verification vendor, device/behavioral signal provider, consortium data, internal customer file, third-party data aggregators. No single unified view.
- **Vendor management fragmentation.** Separate procurement / security / legal / operations for each vendor. No orchestration layer or mature vendor mixing capability.
- **Perpetual KYC as aspiration not operational capability.** Regulatory and industry language evolved faster than most institutions' operating capability.

**Immediate causes:**

- High digital drop-off on consumer and SMB flows.
- Commercial and wealth onboarding measured in weeks.
- Manual review queues long and expensive.
- Static KYC misses in-portfolio risk changes.
- Synthetic identity exposure growing.
- Beneficial ownership compliance manual and fragile.
- Sanctions screening quality uneven.

**Effects:**

- Customer acquisition cost (CAC) inflation from drop-off.
- Competitive disadvantage vs. AI-native challengers.
- Regulatory exposure (MRAs, consent orders on KYC failures).
- Fraud loss from synthetic identity and identity takeover.
- Operational cost from manual review and remediation.
- Onboarding brittleness under regulatory change (CTA, FATCA expansion, beneficial ownership refinements).

### Part F · Interventions

Eight interventions form the full program:

1. **Identity orchestration layer.** Deploy an identity decisioning orchestration platform (Alloy, Persona, custom) that sits above individual identity vendors (document / biometric / device / consortium / bank data). Enables mixing, waterfall, and A/B testing without re-platforming. Success rate 75% on vendor management agility.

2. **Neural document extraction + liveness + biometric matching.** Modernize from templated OCR + rule checks to neural extraction with structured field validation, liveness detection (passive or active), and face-to-ID biometric matching. Integrate with fraud detection models. Success rate 80% on automation rate at target fraud capture.

3. **Identity graph and synthetic identity detection.** Deploy graph capability (Quantexa, Neo4j-based custom, TigerGraph, Neptune) for related-account, device, IP, behavioral, and funds-flow relationships. Feed onboarding decisions and portfolio monitoring. Success rate 70% on synthetic identity capture.

4. **Risk-based authentication and friction calibration.** Replace uniform verification workflow with risk-based paths — low-risk applicants straight-through, elevated-risk applicants step-up authentication, high-risk applicants routed to EDD. Success rate 65% on drop-off reduction without fraud increase.

5. **Perpetual KYC / event-driven refresh.** Establish trigger-based risk reassessment: significant transaction pattern change, address change, beneficial owner change, adverse media hit, screening list update, geographic pattern change, product ownership change. Integrate with portfolio monitoring. Success rate 60% on in-portfolio risk timeliness.

6. **Enhanced due diligence (EDD) workflow modernization.** Purpose-built EDD case management with structured evidence capture, decision support, adverse media integration, UBO visualization, audit trail. Success rate 65% on EDD cycle time and quality.

7. **Beneficial ownership and Corporate Transparency Act compliance.** Operational capability to capture, verify, monitor, and report beneficial ownership at the 25% threshold (and substantial control) per FinCEN CDD Rule and CTA reporting to FinCEN Beneficial Ownership Information (BOI) Registry. UBO change monitoring. Related-party graph. Success rate 70% (regulatory imperative).

8. **Sanctions, PEP, adverse media modernization.** Real-time screening at onboarding, continuous screening of portfolio, fuzzy matching with quality measurement (false positive rate, miss rate), adverse media integration with NLP-based relevance filtering. Success rate 75% on screening quality.

### Part G · Anti-Patterns

1. **Drop-off treated as inevitable friction.** Accepting 40%+ drop-off as "that's what compliance requires" rather than as a design and calibration problem.

2. **Manual review as first response, not exception.** When AI / automation confidence is low, default is to route to manual. Queue grows; automation ratio stagnates.

3. **Static KYC sufficient for compliance.** Treating annual/triennial KYC refresh as the operational standard. Missing the regulatory and industry drift toward perpetual KYC expectations.

4. **Siloed onboarding by product line.** Consumer / SMB / commercial / wealth / fintech lines preserved as separate onboarding stacks. Enterprise customer view fragmented.

5. **Beneficial ownership in spreadsheets.** CDD Rule and CTA obligations managed with document uploads and tracker spreadsheets rather than operational data model.

6. **Sanctions screening "done" at onboarding.** Batch overnight continuous screening without real-time at critical events (wire initiation, new account, payment).

7. **Vendor proliferation without orchestration.** Each new identity capability = new point integration. Waterfall logic coded into app layer. Vendor change requires engineering time.

8. **Identity graph as investigator tool only.** Graph capability deployed for investigator case workbench but not integrated into onboarding decisioning.

### Part H · Vendor Landscape

**Identity verification & documents:**
- **Jumio.** Global ID verification, liveness, biometric matching.
- **Onfido (Entrust).** Global ID + biometric.
- **Mitek.** Mobile document capture + verification.
- **Persona.** Modern identity platform with orchestration capability.
- **Veriff.** ID verification + biometrics.
- **iProov.** Biometric liveness + matching.
- **IDology.** US-centric identity verification.
- **Trulioo.** Global identity data aggregator.
- **Incode.** Biometric identity.

**Consortium and data:**
- **Socure.** Identity + fraud consortium (Sigma).
- **LexisNexis Risk Solutions (ThreatMetrix, Bridger, InstantID).**
- **Ekata (Mastercard).** Global identity data.
- **Early Warning Services.** US bank consortium.
- **Plaid, MX, Pinwheel, Finicity (Mastercard).** Bank account / income / employment data.
- **Experian, Equifax, TransUnion CrossCore.** Credit bureau + identity data.

**Identity orchestration:**
- **Alloy.** Identity decisioning orchestration; broadly adopted in fintech.
- **Persona.** Orchestration + verification.
- **Plaid Identity (with Plaid stack).**
- **Sardine.** Risk + identity orchestration for fintech.

**Sanctions, PEP, adverse media:**
- **Refinitiv World-Check (LSEG).**
- **LexisNexis Bridger Insight.**
- **Dow Jones Risk & Compliance.**
- **ComplyAdvantage.**
- **Accuity (LexisNexis).**
- **Quantifind.**

**Commercial / entity data:**
- **Dun & Bradstreet.**
- **Moody's Analytics Orbis / BvD.**
- **Refinitiv BvD.**
- **Fenergo.** Client Lifecycle Management for commercial / institutional.
- **Quantexa.** Entity resolution + investigation.
- **Pega Client Lifecycle Management.**

**Crypto / digital asset:**
- **Chainalysis KYT.** Know-your-transaction for crypto.
- **TRM Labs, Elliptic.** Crypto analytics + sanctions.

**Synthetic identity specialist:**
- **SentiLink.** Synthetic identity specialist.
- **Socure Sigma Synthetic.** Consortium-based synthetic detection.

Platform strategy: orchestration-first, then capability best-of-breed. Avoid vendor lock on a single ID verification provider. Build for waterfall and A/B. Align commercial onboarding (Fenergo or similar CLM) with consumer orchestration at the identity and screening layer even if workflow layers differ.

### Part I · Regulatory Considerations

The regulatory perimeter around onboarding is dense and evolving:

- **Bank Secrecy Act / Customer Identification Program (CIP).** Minimum identity verification standards for account opening — name, DOB, address, ID number (SSN or equivalent).

- **FinCEN CDD Rule.** Requires identification and verification of beneficial owners (25% ownership or substantial control) for legal entity accounts. Ongoing monitoring obligations.

- **Corporate Transparency Act (CTA) / FinCEN Beneficial Ownership Information Reporting.** Separate reporting regime for legal entities (effective 2024; enforcement posture evolving). Creates both direct reporting obligations for entities and integration opportunities for banks that verify entity customers.

- **OFAC / Sanctions.** Real-time screening against SDN and sectoral lists. 50% Rule on beneficial ownership of sanctioned parties. Cross-border sanctions (UK/OFSI, EU, UN).

- **Politically Exposed Person (PEP) screening.** FATF guidance drives bank-level expectations. No single official list — drives consortium vendor dependence.

- **FATCA and CRS.** US and international tax reporting based on account holder residence. Tax certification capture at onboarding.

- **EU AI Act.** Biometric processing classified under high-risk / prohibited use cases depending on context. Real-time remote biometric identification in public spaces prohibited; biometric categorization regulated. Onboarding biometric matching requires careful framing.

- **GDPR (EU) and UK GDPR.** Lawful basis for biometric and identity data processing. Data minimization. Rights of data subjects. Cross-border data transfer mechanisms.

- **CCPA / CPRA (California), CPA (Colorado), VCDPA (Virginia), CTDPA (Connecticut), UCPA (Utah), and expanding state regime.** Consumer privacy rights; opt-out for automated decision-making in some states.

- **FINRA Rule 2111 (Suitability) and Rule 2090 (KYC).** Broker-dealer specific obligations.

- **NAIC model laws and state insurance regulation.** Insurance producer and policy onboarding.

- **Crypto / Money Service Business regulation.** State MTL licensing; federal MSB registration; FinCEN crypto guidance.

- **Reg II / Durbin (card issuer side), FFIEC authentication guidance, NY DFS 500, OCC Heightened Standards.**

- **NIST AI RMF and SR 11-7.** Model risk framework applies to ML/AI used in onboarding decisions (especially credit-adjacent).

- **Emerging state AI laws.** Colorado AI Act, California, NYC bias audit — shape expectations on automated decisioning transparency and bias testing.

### Part J · Observations from Composite Programs

1. **First Capital Financial digital onboarding transformation.** Composite regional bank. Legacy: separate consumer, SMB, commercial onboarding with 42% consumer drop-off and 18-day commercial cycle. Program: Alloy orchestration layer, Jumio + Persona + Socure waterfall, Quantexa entity graph, Fenergo for commercial CLM, perpetual KYC engine on custom platform. Outcomes over 24 months: consumer drop-off to 21%; consumer straight-through-processing 72%; commercial cycle to 4 days; synthetic identity capture rate materially up; manual review rate from 31% to 12%. Composite organization built from real-world data.

2. **Digital bank biometric onboarding optimization.** Composite digital-first challenger bank. Optimization loop on liveness pass rate, biometric confidence thresholds, and waterfall vendor mix. Cost per onboarded customer down 34% while fraud holding flat. Composite.

3. **Wealth management UHNW onboarding modernization.** Composite wealth manager serving UHNW. Source of wealth / source of funds evidence capture modernized; adverse media monitoring continuous; related-party graph explicit. Onboarding cycle time from 45 days to 18 days. Composite.

4. **Broker-dealer FINRA KYC modernization.** Composite broker-dealer. Client profile data capture, suitability attestation, and FINRA 2090 refresh on event-driven cadence. Audit findings improved materially. Composite.

5. **Credit union digital member onboarding.** Composite credit union. Common-bond verification automated; SMB onboarding added as new capability. Member acquisition in digital channel +40% y/y. Composite.

6. **Insurance MGA producer and policyholder onboarding.** Composite insurance MGA. Producer onboarding (licensing, E&O, appointment) and policyholder onboarding unified on common identity backbone. Composite.

7. **Crypto-adjacent bank user onboarding with MSB registration.** Composite bank with crypto on-ramp. Incremental KYC for crypto transactions; Chainalysis KYT integration; travel rule compliance. Composite.

8. **SMB fintech payment processor onboarding.** Composite payment processor. Merchant onboarding with beneficial ownership, sanctions, SSN/EIN verification, bank account verification, underwriting, and ongoing monitoring. Onboarding cycle from 7 days to 1-2 days for standard merchants. Composite.

### Part K · Success Measures

**Funnel and experience:**
- Digital onboarding drop-off by stage (ID capture, personal info, income/employment, risk questions, beneficial ownership, screening)
- Straight-through-processing rate by segment
- Manual review rate and queue aging
- Time-to-account (median and tail)
- Customer NPS on onboarding (where measured)
- Abandoned session recovery rate

**Risk and compliance:**
- Fraud loss rate on new accounts (first-party, third-party, synthetic)
- Synthetic identity capture rate
- Sanctions screening quality (FPR, miss rate on known positives)
- PEP screening quality
- Adverse media relevance precision
- Beneficial ownership compliance rate
- CTA reporting timeliness (where applicable)
- Regulatory examination findings on onboarding/KYC program
- EU AI Act documentation and oversight compliance (where applicable)

**Operating model:**
- Identity orchestration vendor mix health
- Automation rate trend
- Manual reviewer productivity
- Perpetual KYC trigger firing rate and follow-through
- EDD cycle time and quality

**Financial outcomes:**
- Customer acquisition cost (CAC) reduction
- Onboarding operational cost per application
- Fraud loss reduction
- Revenue from reduced drop-off
- Commercial onboarding revenue acceleration

### Part L · Timeline

**Months 0-6:** Identity orchestration layer selection and initial deployment. Neural document extraction + liveness modernization. Beneficial ownership operational capability.
**Months 6-12:** Risk-based authentication deployment. Identity graph foundational build. Sanctions / PEP / adverse media modernization.
**Months 12-18:** Perpetual KYC operationalization. EDD workflow modernization. Cross-segment orchestration expansion.
**Months 18-24:** Straight-through-processing optimization loop. Synthetic identity detection maturity. Adverse media NLP relevance tuning.
**Months 24-36:** Continuous improvement, expansion to additional segments, commercial CLM full integration, crypto/emerging segment coverage.

Large banks: 36-48 months with full cross-segment coverage. Fintechs / digital challengers: often 12-18 months because greenfield.

### Part M · Governance Mechanism

**Onboarding & KYC Steering Committee.** Monthly. Members: Head of Financial Crimes (chair), Chief Compliance Officer, Head of Digital, Head of Commercial Banking, Head of Wealth, Head of Operations, Head of Technology. Reviews: onboarding funnel metrics, manual review queue, screening quality, beneficial ownership compliance, perpetual KYC health, EDD cycle time, regulatory posture.

**Identity Orchestration Working Group.** Biweekly. Vendor mix decisions, waterfall adjustments, A/B testing, cost-per-decision tracking.

**Perpetual KYC Operating Forum.** Weekly. Trigger firing review, false-positive trigger calibration, follow-through execution, escalation handling.

**AI Council linkage.** All AI/ML models used in onboarding and KYC decisions flow through enterprise AI Council per pattern 2.3. Biometric models receive heightened scrutiny under EU AI Act.

**Regulatory Engagement.** Proactive dialogue with bank regulators on onboarding modernization, particularly where AI/ML is used for CIP, CDD, or EDD decisions.

### Part N · Sector Variants

- **Large bank.** Full cross-segment scope; commercial CLM integration; wealth onboarding tail; cross-border obligations.
- **Community / regional bank.** Scope concentrated on consumer + SMB; consortium dependence high.
- **Digital bank / fintech.** AI-native typical; heavy waterfall vendor strategy; optimization loop culture.
- **Credit union.** Common-bond verification; member-focused experience.
- **Wealth manager.** Source of wealth / funds evidence; related-party graph; UHNW specific.
- **Broker-dealer.** FINRA 2090 and 2111 obligations; suitability attestation.
- **RIA.** Form ADV-aligned client intake.
- **Insurance.** Producer + policyholder; state variation.
- **Payment processor.** Merchant onboarding with underwriting.
- **Crypto / digital asset.** MSB-registered; chain analytics; travel rule.
- **BNPL / consumer credit.** High-velocity onboarding; fraud-heavy; synthetic identity exposure.

### Part O · Graph Schema Contribution

```cypher
// Pattern + topics
MERGE (p:Pattern {id: 'pattern_customer_onboarding_kyc_ai'})
ON CREATE SET
  p.name = 'Customer Onboarding & KYC AI',
  p.category = 'Identity, Onboarding & Customer Due Diligence',
  p.cross_industry = false,
  p.primary_sector = 'financial_services',
  p.confidence_floor = 0.75,
  p.n_observations_floor = 6,
  p.version = '1.0.0';

MERGE (t_orch:Topic {id: 'topic_identity_orchestration'})
ON CREATE SET t_orch.name = 'Identity Orchestration Layer';
MERGE (t_docbio:Topic {id: 'topic_document_biometric_verification'})
ON CREATE SET t_docbio.name = 'Neural Document & Biometric Verification';
MERGE (t_idgraph:Topic {id: 'topic_identity_graph_synthetic'})
ON CREATE SET t_idgraph.name = 'Identity Graph & Synthetic Detection';
MERGE (t_rba:Topic {id: 'topic_risk_based_authentication'})
ON CREATE SET t_rba.name = 'Risk-Based Authentication';
MERGE (t_pkyc:Topic {id: 'topic_perpetual_kyc'})
ON CREATE SET t_pkyc.name = 'Perpetual / Event-Driven KYC';
MERGE (t_edd:Topic {id: 'topic_edd_workflow'})
ON CREATE SET t_edd.name = 'Enhanced Due Diligence Workflow';
MERGE (t_ubo:Topic {id: 'topic_beneficial_ownership_cta'})
ON CREATE SET t_ubo.name = 'Beneficial Ownership & CTA Compliance';
MERGE (t_screen:Topic {id: 'topic_sanctions_pep_adverse_media'})
ON CREATE SET t_screen.name = 'Sanctions, PEP & Adverse Media Screening';

MERGE (p)-[:COVERS_TOPIC]->(t_orch);
MERGE (p)-[:COVERS_TOPIC]->(t_docbio);
MERGE (p)-[:COVERS_TOPIC]->(t_idgraph);
MERGE (p)-[:COVERS_TOPIC]->(t_rba);
MERGE (p)-[:COVERS_TOPIC]->(t_pkyc);
MERGE (p)-[:COVERS_TOPIC]->(t_edd);
MERGE (p)-[:COVERS_TOPIC]->(t_ubo);
MERGE (p)-[:COVERS_TOPIC]->(t_screen);

// Related patterns
MERGE (p_fr:Pattern {id: 'pattern_fraud_detection_modernization'});
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(p_fr);

MERGE (p_am:Pattern {id: 'pattern_analytics_modernization'});
MERGE (p)-[:CHILD_OF]->(p_am);

MERGE (p_gov:Pattern {id: 'pattern_ai_governance_operating_model'});
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(p_gov);

MERGE (p_port:Pattern {id: 'pattern_ai_use_case_portfolio'});
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(p_port);

// Sector
MERGE (s_fs:Sector {id: 'sector_financial_services', name: 'Financial Services'});
MERGE (p)-[:APPLIES_TO]->(s_fs);
MERGE (s_ins:Sector {id: 'sector_insurance', name: 'Insurance'});
MERGE (p)-[:APPLIES_TO]->(s_ins);
MERGE (s_pay:Sector {id: 'sector_payments', name: 'Payments'});
MERGE (p)-[:APPLIES_TO]->(s_pay);

// Vendors — ID verification
MERGE (v_jumio:Vendor {id: 'vendor_jumio'})
ON CREATE SET v_jumio.name = 'Jumio', v_jumio.category = 'ID Verification + Biometrics';
MERGE (v_jumio)-[:APPEARS_IN]->(p);

MERGE (v_onf:Vendor {id: 'vendor_onfido_entrust'})
ON CREATE SET v_onf.name = 'Onfido (Entrust)', v_onf.category = 'ID Verification + Biometrics';
MERGE (v_onf)-[:APPEARS_IN]->(p);

MERGE (v_per:Vendor {id: 'vendor_persona'})
ON CREATE SET v_per.name = 'Persona', v_per.category = 'Identity Platform + Orchestration';
MERGE (v_per)-[:APPEARS_IN]->(p);

MERGE (v_mit:Vendor {id: 'vendor_mitek'})
ON CREATE SET v_mit.name = 'Mitek', v_mit.category = 'Mobile Document Capture';
MERGE (v_mit)-[:APPEARS_IN]->(p);

MERGE (v_ver:Vendor {id: 'vendor_veriff'})
ON CREATE SET v_ver.name = 'Veriff', v_ver.category = 'ID + Biometrics';
MERGE (v_ver)-[:APPEARS_IN]->(p);

// Orchestration
MERGE (v_al:Vendor {id: 'vendor_alloy'})
ON CREATE SET v_al.name = 'Alloy', v_al.category = 'Identity Decisioning Orchestration';
MERGE (v_al)-[:APPEARS_IN]->(p);

// Consortium / data
MERGE (v_soc:Vendor {id: 'vendor_socure'})
ON CREATE SET v_soc.name = 'Socure', v_soc.category = 'Identity & Fraud Consortium';
MERGE (v_soc)-[:APPEARS_IN]->(p);

MERGE (v_ln:Vendor {id: 'vendor_lexisnexis'})
ON CREATE SET v_ln.name = 'LexisNexis Risk Solutions', v_ln.category = 'Identity Data & Screening';
MERGE (v_ln)-[:APPEARS_IN]->(p);

MERGE (v_ek:Vendor {id: 'vendor_ekata'})
ON CREATE SET v_ek.name = 'Ekata (Mastercard)', v_ek.category = 'Identity Data';
MERGE (v_ek)-[:APPEARS_IN]->(p);

MERGE (v_ews:Vendor {id: 'vendor_early_warning'})
ON CREATE SET v_ews.name = 'Early Warning Services', v_ews.category = 'Bank Consortium';
MERGE (v_ews)-[:APPEARS_IN]->(p);

MERGE (v_pl:Vendor {id: 'vendor_plaid'})
ON CREATE SET v_pl.name = 'Plaid', v_pl.category = 'Bank Data + Identity';
MERGE (v_pl)-[:APPEARS_IN]->(p);

// Sanctions / PEP / adverse media
MERGE (v_wc:Vendor {id: 'vendor_refinitiv_world_check'})
ON CREATE SET v_wc.name = 'Refinitiv World-Check (LSEG)', v_wc.category = 'Sanctions, PEP, Adverse Media';
MERGE (v_wc)-[:APPEARS_IN]->(p);

MERGE (v_br:Vendor {id: 'vendor_lexisnexis_bridger'})
ON CREATE SET v_br.name = 'LexisNexis Bridger Insight', v_br.category = 'Sanctions & PEP Screening';
MERGE (v_br)-[:APPEARS_IN]->(p);

MERGE (v_dj:Vendor {id: 'vendor_dow_jones_risk'})
ON CREATE SET v_dj.name = 'Dow Jones Risk & Compliance', v_dj.category = 'Sanctions, PEP, Adverse Media';
MERGE (v_dj)-[:APPEARS_IN]->(p);

MERGE (v_ca:Vendor {id: 'vendor_complyadvantage'})
ON CREATE SET v_ca.name = 'ComplyAdvantage', v_ca.category = 'AML / Screening';
MERGE (v_ca)-[:APPEARS_IN]->(p);

// Commercial / entity
MERGE (v_fen:Vendor {id: 'vendor_fenergo'})
ON CREATE SET v_fen.name = 'Fenergo', v_fen.category = 'Commercial CLM';
MERGE (v_fen)-[:APPEARS_IN]->(p);

MERGE (v_qx:Vendor {id: 'vendor_quantexa'})
ON CREATE SET v_qx.name = 'Quantexa', v_qx.category = 'Entity Resolution';
MERGE (v_qx)-[:APPEARS_IN]->(p);

MERGE (v_dnb:Vendor {id: 'vendor_dun_bradstreet'})
ON CREATE SET v_dnb.name = 'Dun & Bradstreet', v_dnb.category = 'Commercial Data';
MERGE (v_dnb)-[:APPEARS_IN]->(p);

// Synthetic identity specialist
MERGE (v_sl:Vendor {id: 'vendor_sentilink'})
ON CREATE SET v_sl.name = 'SentiLink', v_sl.category = 'Synthetic Identity Specialist';
MERGE (v_sl)-[:APPEARS_IN]->(p);

// Crypto
MERGE (v_chn:Vendor {id: 'vendor_chainalysis_kyt'})
ON CREATE SET v_chn.name = 'Chainalysis KYT', v_chn.category = 'Crypto Know-Your-Transaction';
MERGE (v_chn)-[:APPEARS_IN]->(p);

// Regulatory frameworks
MERGE (f_cip:RegulatoryFramework {id: 'framework_bsa_cip'})
ON CREATE SET f_cip.name = 'BSA Customer Identification Program';
MERGE (f_cip)-[:APPLIES_TO]->(p);

MERGE (f_cdd:RegulatoryFramework {id: 'framework_fincen_cdd_rule'})
ON CREATE SET f_cdd.name = 'FinCEN Customer Due Diligence Rule';
MERGE (f_cdd)-[:APPLIES_TO]->(p);

MERGE (f_cta:RegulatoryFramework {id: 'framework_corporate_transparency_act'})
ON CREATE SET f_cta.name = 'Corporate Transparency Act / FinCEN BOI Registry';
MERGE (f_cta)-[:APPLIES_TO]->(p);

MERGE (f_ofac:RegulatoryFramework {id: 'framework_ofac_sanctions'})
ON CREATE SET f_ofac.name = 'OFAC Sanctions';
MERGE (f_ofac)-[:APPLIES_TO]->(p);

MERGE (f_fatca:RegulatoryFramework {id: 'framework_fatca_crs'})
ON CREATE SET f_fatca.name = 'FATCA / CRS';
MERGE (f_fatca)-[:APPLIES_TO]->(p);

MERGE (f_ai:RegulatoryFramework {id: 'framework_eu_ai_act'})
ON CREATE SET f_ai.name = 'EU AI Act';
MERGE (f_ai)-[:APPLIES_TO]->(p);

MERGE (f_gdpr:RegulatoryFramework {id: 'framework_gdpr'})
ON CREATE SET f_gdpr.name = 'EU GDPR';
MERGE (f_gdpr)-[:APPLIES_TO]->(p);

MERGE (f_finra:RegulatoryFramework {id: 'framework_finra_kyc'})
ON CREATE SET f_finra.name = 'FINRA Rule 2090 / 2111';
MERGE (f_finra)-[:APPLIES_TO]->(p);
```

### Part P · Retrieval Contribution

~68 chunks. Namespace `global:patterns:financial_services`. Sub-variants across large-bank / regional / community / credit-union / digital-bank / fintech / wealth / broker-dealer / insurance / payment-processor / crypto / BNPL. Chunks carry `institution_type`, `customer_segment` (consumer | smb | commercial | wealth | crypto | merchant), and `capability_area` (orchestration | document-biometric | identity-graph | rba | perpetual-kyc | edd | beneficial-ownership | screening).

### Part Q · Prompting Contract

**Detection fragment:**

```
PATTERN: pattern_customer_onboarding_kyc_ai (FINANCIAL_SERVICES)
Summary: Cross-segment onboarding & KYC modernization — identity orchestration, neural document/biometric verification, identity graph & synthetic detection, risk-based authentication, perpetual KYC, EDD workflow, beneficial ownership + CTA, sanctions/PEP/adverse media modernization.
Activates when:
- Digital onboarding drop-off >35%
- Manual review rate >25%
- Static KYC refresh cycles (annual/triennial only)
- Synthetic identity exposure visible in loss cohorts
- Siloed onboarding by product line
- Beneficial ownership managed manually (spreadsheet/PDF)
- Screening dated (exact/basic fuzzy, batch orientation)
- Vendor proliferation without orchestration
Diagnostic questions focus on funnel drop-off by stage, manual review rate/aging, KYC refresh model, synthetic identity posture, segment unification, beneficial ownership + CTA, screening quality, orchestration maturity.
If active, output pattern_id, confidence, signals_triggered, rationale.
```

**Injection fragment:** Interventions emphasizing identity orchestration layer (foundational), neural document + liveness + biometric matching, identity graph + synthetic detection, risk-based authentication, perpetual KYC / event-driven refresh, EDD workflow modernization, beneficial ownership + CTA compliance, sanctions/PEP/adverse media modernization. Observations: First Capital Financial cross-segment program (primary reference); digital bank biometric optimization; wealth UHNW; broker-dealer FINRA; credit union member onboarding; insurance MGA; crypto-adjacent bank; SMB payment processor. Anti-patterns: drop-off as inevitable, manual review as default, static KYC sufficient, product-line silos, UBO in spreadsheets, screening "done" at onboarding, vendor proliferation, identity graph investigator-only.

**Diagnostic fragment:** Sequenced probing: drop-off by funnel stage; manual review rate/aging; KYC refresh cadence; synthetic identity exposure/detection; segment unification scope; beneficial ownership/CTA posture; screening quality; orchestration maturity + vendor mix health.

### Part R · Rendering Contract

`/intelligence/patterns/customer-onboarding-kyc-ai`. Light hero + dark working zone.

Hero copy: **"Onboarding is where customer acquisition, fraud, and compliance meet. Most stacks treat it as three separate problems."**

Unique rendering element: onboarding funnel visualization showing drop-off at each stage, with AI-native target overlay; identity orchestration vendor waterfall diagram showing current vs. optimized mix; perpetual KYC trigger dashboard showing trigger firing rate and follow-through; synthetic identity network example (anonymized from composite). Composite tenant-connected version pulls from First Capital Financial reference program.

Right sidebar (tenant): current consumer drop-off %, manual review %, straight-through-processing %, synthetic identity capture rate, beneficial ownership compliance %, perpetual KYC health score, orchestration maturity score.

Cross-links to fraud detection modernization pattern, analytics modernization parent, AI governance operating model, and AI use case portfolio.

Composite tenant callout: First Capital Financial onboarding transformation shown as primary reference program. Always labeled "composite organization built from real-world data."

---

*End of Part 3.3b · Customer Onboarding & KYC AI*

*Next in file sequence: `12-predictive-maintenance-modernization.md` — Part 3.4a Energy*

---
