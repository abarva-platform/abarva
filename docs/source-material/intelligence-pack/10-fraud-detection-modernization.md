# Part 3.3a · Fraud Detection Modernization (Financial Services)

## 3.3a · Fraud Detection Modernization

### YAML front-matter

```yaml
pattern_id: pattern_fraud_detection_modernization
slug: fraud-detection-modernization
name: Fraud Detection Modernization
version: 1.0.0
status: active
category: Financial Crimes & Risk
cross_industry: false
sector_applicability: [financial_services, insurance, payments, retail_finance]
primary_sector: financial_services
short_description: >
  The integrated program to modernize fraud detection across card, ACH, wire,
  account opening, account takeover, check, claims, and internal fraud vectors
  with modern AI — graph neural networks for mule and ring detection, transformer-
  based behavior modeling, device and behavioral biometrics, federated and
  consortium signals, real-time sub-100ms decisioning, link analysis,
  explainability for adverse action, and the investigator operating model
  that closes the feedback loop. Pattern addresses the failure mode of
  rule-engine-dominant fraud functions with high false-positive rates,
  channel-siloed teams, stale models, and weak network views.
long_description: >
  Fraud is a network problem, a speed problem, and a context problem — and
  the operational fraud function in most banks, processors, insurers, and
  retail-finance operations was built for a world of rule engines, overnight
  batch, manual review, and channel-siloed operations. Modern fraud moves
  faster (real-time payments, instant card issuance, instant account opening)
  and across more vectors (card-present, card-not-present, ACH, wire, RTP,
  Zelle, check, account opening, account takeover, synthetic identity, claims,
  money mules, internal fraud) than the incumbent stack can reasonably cover.
  AI modernization is now table stakes: graph neural networks for mule network
  and ring detection, transformer-based sequence modeling for transaction and
  behavior patterns, device and behavioral biometrics at the session level,
  federated and consortium signal integration, sub-100ms decisioning at the
  payment rail, advanced link analysis in investigator workflows, and
  explainability infrastructure for adverse action compliance. Equally important
  is the operating model — investigator teams unified across vectors, feedback
  loops from case dispositions to model learning, champion-challenger discipline,
  model risk management aligned to SR 11-7 and emerging AI RMF expectations,
  and governance that supports real-time model refresh without regulatory
  exposure. The pattern captures the integrated program across technology,
  data, models, operating model, and governance.
confidence_floor: 0.75
n_observations_floor: 6
related_patterns:
  - { id: pattern_customer_onboarding_kyc_ai, relationship: associative }
  - { id: pattern_analytics_modernization, relationship: parent }
  - { id: pattern_ai_governance_operating_model, relationship: associative }
  - { id: pattern_ai_use_case_portfolio, relationship: associative }
regulatory_frameworks:
  - id: framework_bsa_aml
    applicability: always
  - id: framework_ofac_sanctions
    applicability: always
  - id: framework_sr_11_7
    applicability: banks_with_material_models
  - id: framework_nist_ai_rmf
    applicability: always
  - id: framework_eu_ai_act
    applicability: eu_operations_or_consumers
  - id: framework_ecoa_reg_b
    applicability: us_credit_decisioning_adjacent
  - id: framework_psd2_sca
    applicability: eu_psd2
  - id: framework_ffiec_cyber
    applicability: us_banks
  - id: framework_cfpb_ufp
    applicability: us_consumer
authored_by: anand + claude
last_curated_by: anand
```

### Part A · Pattern Identity

**ID:** `pattern_fraud_detection_modernization`
**Name:** Fraud Detection Modernization
**Short description:** Integrated program to modernize fraud detection across all vectors (card, ACH, wire, RTP/Zelle, check, account opening/takeover, claims, internal) with graph neural networks, transformer behavior models, biometrics, consortium signals, real-time decisioning, link analysis, explainability, and investigator feedback loops.

**Long description:** Fraud modernization is simultaneously a technology problem, an organizational problem, and a regulatory problem. Technology: rule engines alone cannot keep pace with synthetic identity, authorized push payment fraud, mule networks, and adversarial behavior — graph, transformer, and behavioral biometric models are now necessary. Organizational: channel-siloed fraud teams (card fraud, ACH fraud, account opening, disputes) miss cross-vector patterns that are the real signature of organized fraud rings. Regulatory: model risk, adverse action, adverse inference in AI, and cross-border obligations create a governance envelope that shapes what can ship and how. The pattern captures the full modernization program — technology stack, data architecture, model portfolio, investigator operating model, governance — that takes fraud from a cost-of-doing-business function to a discriminating capability that protects the institution, its customers, and its regulatory standing without strangling good-customer experience in false positives.

### Part B · Classification

**Category:** Financial Crimes & Risk
**Cross-industry:** No — financial services core, with variants in payments, insurance, and retail finance
**Primary sector:** Financial Services (banks, credit unions, credit card issuers, processors, fintechs)
**Sector applicability:** Financial services, insurance (claims fraud), payments, retail finance, crypto / digital asset (with framework variations)
**Variant of:** None (foundational financial services vertical pattern)

### Part C · Detection — Signals

Pattern activates when ≥3 signals present with sufficient severity:

1. **Rule engine dominance.** Fraud decisioning is 70%+ rule-driven. New rules added more often than new models; models retrained infrequently (annually or less). Rule count growing without corresponding performance improvement.

2. **False positive rate normalized.** Customer-facing false positive rate accepted as "that's how fraud works." Customer friction, call center volume, and churn attributed to fraud protection inevitably. Typical rule-based stacks run 10-40 false positives per confirmed fraud.

3. **Channel-siloed fraud operations.** Separate teams, separate systems, separate models for card-present, card-not-present, ACH, wire, account opening, account takeover, and disputes. Cross-channel link analysis absent or batch-only.

4. **No network / graph capability.** Fraud rings and mule networks detected only after individual transaction losses accumulate. No graph-based detection of account linkage, device sharing, IP clustering, or funds-flow patterns.

5. **Investigator workflow in ticket systems, not purpose-built tools.** Investigators work in ServiceNow, Jira, or a legacy case management tool without link analysis, entity resolution, or model explainability integration.

6. **Feedback loop absent.** Investigator case dispositions (fraud / not fraud / inconclusive) not systematically fed back to model training. Confirmed fraud patterns take months to appear in production detection.

7. **Real-time decisioning gap.** Real-time rails (RTP, Zelle, FedNow, card authorization) decisioned by the same batch-oriented stack used for overnight screening. Latency SLAs missed or simulated.

8. **Model risk management lags.** SR 11-7 tier classification not applied to AI/ML fraud models; validation cycle slow; no champion-challenger discipline; AI RMF expectations unmet; EU AI Act high-risk obligations not yet mapped.

### Part D · Detection — Diagnostic Questions

1. What is your false-positive rate on customer-facing fraud protection? How is that measured and attributed (by channel, by model, by rule)?

2. Across which fraud vectors do you have unified detection vs. siloed? Where are the organizational and technical seams?

3. Do you run graph-based detection for mule networks, account linkage, device clusters, and funds-flow patterns? If yes — what technology, what coverage? If no — what is the current approach to ring detection?

4. How are investigator case dispositions fed back into model training? What's the cadence from case closure to model learning?

5. What is the real-time decisioning latency at each major payment rail (RTP, Zelle, FedNow, card auth, ACH return, check)? Are SLAs met consistently?

6. How are your fraud models tiered under SR 11-7 (for banks) or equivalent model risk frameworks? What's the validation cadence? Is champion-challenger in production?

7. How do you handle EU AI Act high-risk obligations on fraud models that affect EU consumers — or the equivalent expectations from state regulators?

8. How do you integrate consortium and federated signals (card networks, industry consortia, public watchlists, sanctions lists)? Real-time at the decision point or batch?

### Part E · Causal Structure

**Root causes:**

- **Architectural inheritance.** Incumbent fraud stacks (FICO Falcon, SAS Fraud Management, Actimize, custom mainframe) were designed for rule engines, batch processing, and channel-specific deployments. Modernization requires architectural change, not just feature upgrades.
- **Organizational design by vector.** Fraud teams grew around specific products (card, ACH, deposits, loans) and specific regulatory drivers. Cross-vector integration runs against organizational sediment.
- **Model risk framework not extended to ML.** SR 11-7 was written pre-deep-learning. Many banks apply it to legacy scoring models but struggle to apply it rigorously to neural and graph models.
- **Data fragmentation across customer lifecycle.** Identity / device / transaction / behavioral / dispute data live in different systems built over different decades. Unified customer view required for modern fraud is non-trivial to achieve.
- **Investigator workflows under-invested.** Fraud operations competed with revenue-generating investments for platform spend; received inferior case management and analytics tooling.
- **Vendor lock on legacy platforms.** Replacing an incumbent fraud platform is operationally risky; many programs augment rather than replace, creating architectural complexity.

**Immediate causes:**

- Legacy stack cannot easily ingest new features, new models, or new consortium signals.
- Investigator cycle times long; feedback loop broken.
- Real-time rails under-protected.
- False positive rate chronically elevated, driving customer friction.
- Cross-vector ring detection absent.

**Effects:**

- Direct fraud losses (card, ACH, APP, account takeover, claims, internal).
- Customer friction and churn from false positives.
- Call center and dispute volume elevated.
- Regulatory exposure (MRAs, consent orders in severe cases, AI Act exposure for EU operations).
- Reputational risk from high-profile fraud events.
- Opportunity cost: fraud stack consumes technology capacity that could otherwise modernize other areas.

### Part F · Interventions

Eight interventions form the full program:

1. **Modern model architecture portfolio.** Deploy a combination of: gradient boosted models for tabular transaction scoring; transformer-based sequence models for behavior and transaction sequences; graph neural networks for mule network, ring, and device-cluster detection; behavioral biometrics models for session-level risk; anomaly detection for emerging pattern discovery. Success rate 75% on fraud detection rate at fixed false positive target.

2. **Unified cross-channel fraud platform.** Establish a central fraud decisioning platform that spans card-present / card-not-present / ACH / wire / RTP / Zelle / check / account opening / account takeover / claims — with shared customer and device identities, shared signal libraries, and shared case management. Success rate 60% (organizationally hard).

3. **Real-time decisioning infrastructure.** Low-latency scoring at <50ms p99 for card auth; <100ms for RTP/Zelle/FedNow; sub-second for account opening. Feature store with real-time enrichment. Success rate 80% on latency SLA achievement when architected well.

4. **Graph / network intelligence layer.** Graph database or columnar graph-of-entities layer. Continuous ingestion of account, device, IP, funds-flow, and identity signals. Graph queries integrated into real-time decisioning and investigator workflows. Success rate 70% on ring detection uplift.

5. **Investigator workflow modernization.** Purpose-built case management with link analysis, entity resolution, explainability visualizations, and structured disposition capture. Disposition flows back to model training systematically. Success rate 65% on investigator productivity and feedback loop closure.

6. **Model risk management alignment.** Apply SR 11-7 tiering rigorously to AI/ML fraud models. Establish champion-challenger discipline. Map AI RMF expectations. Where EU AI Act applies, establish high-risk compliance regime (documentation, human oversight, accuracy metrics, robustness testing, post-market monitoring). Success rate 70% when MRM is a first-class program element.

7. **Consortium and federated signal integration.** Real-time integration with card network signals (Visa Advanced Authorization, Mastercard Decision Intelligence), consortium-based signal providers (LexisNexis ThreatMetrix, Socure Sigma Network, Early Warning), sanctions lists (OFAC, EU, UN), watchlists, and federated learning partnerships where available. Success rate 75% on signal enrichment quality.

8. **Adverse action and explainability infrastructure.** Model explainability outputs (feature contributions, reason codes) surfaced to investigators, compliance, and customer communication workflows. Adverse action notice automation where applicable. Success rate 60% on compliance and customer experience outcomes.

### Part G · Anti-Patterns

1. **"More rules" as the fraud response.** Every new fraud pattern gets a new rule. Rule count grows; performance doesn't. Rule entropy accumulates until the system becomes unmaintainable.

2. **Accepting high false positive rates as inevitable.** Treating 10-40:1 false positive ratios as "that's fraud detection" rather than a solvable model quality and experience problem.

3. **Channel silos preserved as "that's how we're organized."** Fraud directors protecting turf; technology stacks preserving organizational seams; cross-vector patterns invisible.

4. **Graph as a science project.** Graph capability deployed in an innovation lab or data science showcase but not integrated into real-time decisioning or investigator workflows.

5. **Model retraining on calendar cadence, not performance.** Annual retraining regardless of performance drift; no triggered retraining when precision/recall moves beyond thresholds.

6. **Investigator feedback as unstructured notes.** Case dispositions captured in freetext narrative fields rather than structured labels that can be used for supervised learning.

7. **Consortium signals integrated batch-only.** Consortium data ingested overnight and joined in batch, missing real-time decisioning uplift.

8. **Model risk as legal exercise.** MRM documentation produced for examiners but not actually used to drive model selection, performance monitoring, or retirement decisions.

### Part H · Vendor Landscape

**Incumbent fraud platforms:**
- **FICO Falcon Fraud Manager.** Market incumbent for card fraud globally.
- **SAS Fraud Management, SAS Detection and Investigation.** Incumbent at many large banks.
- **NICE Actimize.** Broad financial crimes platform (fraud, AML, investigations, trade surveillance).
- **ACI Worldwide, ACI Fraud Management.** Payments-focused.
- **IBM Safer Payments, Trusteer.** Payments and account takeover.

**AI-native and modern challengers:**
- **Feedzai.** Payments fraud with strong real-time and graph capability.
- **Hawk AI.** AML + fraud with modern AI stack; growing in mid-market banks.
- **Sardine.** Risk and fraud platform with strong fintech adoption.
- **Unit21.** Fraud and AML with investigator-first design; growing enterprise adoption.
- **Sift.** Ecommerce fraud + account protection.
- **Forter, Riskified, Signifyd.** Ecommerce fraud with chargeback guarantees.

**Identity and consortium signal providers:**
- **LexisNexis ThreatMetrix.** Device / identity / behavioral signals, consortium-based.
- **Socure.** Identity verification + Sigma Sync fraud consortium.
- **Alloy.** Identity decisioning orchestration.
- **Early Warning Services.** Bank consortium (deposit, payment, identity).
- **Jumio, Onfido (acquired by Entrust), Persona.** ID document verification.
- **Mitek.** Mobile capture + identity.
- **BioCatch, NuData (Mastercard).** Behavioral biometrics.
- **Chainalysis, TRM Labs, Elliptic.** Crypto/blockchain analytics.

**Network-level and card network:**
- **Visa Advanced Authorization, Visa Fraud Insights.**
- **Mastercard Decision Intelligence, Mastercard Brighterion.**

**Graph and analytics infrastructure:**
- **Neo4j, TigerGraph, Amazon Neptune.** Graph databases.
- **Quantexa.** Entity resolution + investigation platform.
- **Palantir Foundry Financial Crimes Suite.** Integration and investigation.
- **Databricks + MLflow + custom.** Build-your-own stacks, common at large banks.

Platform strategy should consider: incumbent replacement risk (operational and regulatory), augmentation vs. replacement tradeoffs, build-vs-buy for modern model architectures, and consortium signal access. Many large banks retain FICO Falcon or SAS Fraud for card while deploying AI-native platforms for RTP/Zelle, account opening, or ecommerce. AI orchestration layer (Alloy-style, or custom) becomes increasingly important.

### Part I · Regulatory Considerations

Fraud detection sits at the intersection of multiple regulatory regimes and the pattern must address each:

- **BSA/AML and FinCEN obligations.** Fraud and AML intersect (mule networks, structuring). Suspicious Activity Report (SAR) obligations drive investigator workflow requirements. FinCEN beneficial ownership and customer due diligence rules inform the identity layer.

- **OFAC and sanctions.** Real-time screening against sanctions lists at transaction and account opening. False negatives carry severe enforcement risk; false positives create customer friction.

- **SR 11-7 Model Risk Management (Fed/OCC, applicable to banks).** All material AI/ML fraud models require tiered validation, independent review, ongoing performance monitoring, and governance. AI-native models (graph NN, transformers) require thoughtful application of the framework — documentation and validation methods adapt to architecture.

- **OCC Heightened Standards, FRB SR letters, FDIC guidance.** Regulatory guidance on model risk, AI, and third-party risk all shape what ships.

- **NIST AI RMF.** Voluntary framework widely adopted as internal standard. Maps well to fraud models.

- **EU AI Act (in force 2026-2027).** Fraud detection for EU consumers likely falls under high-risk AI classifications for credit-adjacent uses; full documentation, human oversight, accuracy, robustness, transparency, and post-market monitoring obligations apply.

- **ECOA and Regulation B.** Where fraud decisions adversely affect credit access or account opening, adverse action notice with specific principal reasons required.

- **CFPB Unfair, Deceptive, and Abusive Practices.** Excessive false positives that materially impair consumer access can create UDAAP exposure.

- **FFIEC cybersecurity and authentication guidance.** Account takeover controls, authentication strength, and customer awareness are regulatory expectations.

- **PSD2 Strong Customer Authentication (EU).** Fraud exemption thresholds provide performance incentives but require documented fraud rate compliance.

- **GDPR and state privacy laws.** Profiling and automated decision-making constraints (Art. 22), data minimization in consortium data sharing.

- **Emerging state AI laws.** Colorado AI Act, California SB 1001, NYC bias audit law for automated employment decisions — not directly on fraud but shape broader AI compliance expectations.

### Part J · Observations from Composite Programs

1. **First Capital Financial payments fraud platform modernization.** Composite regional bank ($120B assets, full-service retail + commercial). Legacy stack: SAS Fraud for card, home-grown for ACH/wire, manual processes for account opening. RTP/Zelle introduction exposed inadequate real-time capability. Program scope: unified cross-channel platform on Feedzai + custom graph layer on Neo4j; investigator workflow modernization on Quantexa; retain SAS for card with augmentation. Outcomes over 24 months: confirmed fraud detection rate +34% at fixed false positive rate; false positive ratio from 22:1 to 9:1; RTP/Zelle real-time SLA achievement 99.4%; mule network detection uplift; investigator disposition-to-model-learning cycle from 90+ days to 10 days. Composite organization built from real-world data.

2. **Credit card issuer transformer-based transaction scoring.** Composite issuer (~40M cards). Deployed transformer sequence model alongside incumbent FICO Falcon as challenger; graduated to co-champion in select segments. Recall at 2% false positive rate +18%; adversarial robustness testing embedded in MRM. Composite.

3. **Account opening fraud consortium integration.** Composite digital bank. Identity consortium integration (Socure + Alloy orchestration) + device behavioral biometrics (BioCatch) + proprietary graph. Synthetic identity catch rate up meaningfully; legitimate customer friction reduced. Composite.

4. **Regional credit union real-time fraud uplift.** Composite credit union ($18B assets). Migration from legacy batch-oriented stack to modern real-time decisioning (Hawk AI) with Visa/Mastercard network signal integration. RTP fraud under control during FedNow rollout. Composite.

5. **Insurance claims fraud modernization.** Composite P&C insurer. Claims fraud historically siloed in SIU (Special Investigations Unit) with batch analytics. Modern graph-based claims fraud (provider networks, claimant linkages, body shop networks) deployed. SIU referral quality up; false-positive-driven customer experience improved. Composite.

6. **Consumer lender adverse action automation.** Composite consumer lender. Model-driven decisioning with reason code generation integrated with adverse action notice workflow. Compliance cycle time reduced; audit posture improved. Composite.

7. **Wealth management insider fraud monitoring.** Composite wealth manager. Internal fraud / rogue advisor detection via behavior analytics + client outcome monitoring. Early detection of advisor misconduct patterns. Composite.

8. **Crypto-adjacent bank chain analytics integration.** Composite bank with crypto on-ramp/off-ramp capability. Chainalysis integration at transaction decisioning for crypto-touched transactions; mule and sanctioned-address detection. Composite.

### Part K · Success Measures

**Detection performance:**
- Confirmed fraud detection rate at fixed false positive rate (ROC / PR curve movement)
- False positive ratio (by channel, overall, trending)
- Fraud loss rate (basis points of volume, by vector)
- Ring / mule network detection uplift
- Real-time SLA achievement at each payment rail
- Model precision, recall, F1 by tier and segment

**Operating model:**
- Investigator case cycle time (open to disposition)
- Disposition-to-model-learning cycle
- Investigator productivity (cases per investigator)
- Cross-channel case linkage rate
- Rule vs. model contribution to decisions (trending toward model)

**Customer experience:**
- Customer contact volume on fraud alerts
- Customer complaint volume on false positives
- Customer NPS on fraud protection experience (for banks that measure)
- Friction-to-catch ratio improvement

**Risk and regulatory:**
- MRM validation coverage of AI/ML models
- Regulatory examination findings on fraud program
- SAR quality and timeliness
- EU AI Act documentation and oversight compliance (where applicable)
- Adverse action notice accuracy and timeliness

**Financial outcomes:**
- Direct fraud loss reduction
- Operational cost (investigator hours, dispute operations, call center)
- Chargeback loss reduction
- AML fine avoidance (indirect)

### Part L · Timeline

**Months 0-6:** Data architecture foundation — unified customer/device/identity view; feature store; real-time feature pipeline. Cross-channel case management selection and design.
**Months 6-12:** Initial modern model deployments (transformer transaction scoring, graph ring detection) as challengers. Investigator workflow first wave. Consortium signal integration.
**Months 12-18:** Unified cross-channel platform going live at scale. Real-time decisioning SLA achievement at all major rails. MRM alignment for AI models.
**Months 18-24:** Champion rotation, feedback loop operationalized, governance in steady state. Investigator disposition-to-learning cycle down to days.
**Months 24-36:** Continuous improvement, advanced capabilities (federated learning partnerships, adversarial robustness programs, behavioral biometrics expansion).

Larger banks: 36-48 month horizon with heavier MRM and regulatory engagement.

### Part M · Governance Mechanism

**Fraud Operating Committee.** Weekly. Members: Head of Fraud (chair), Head of Financial Crimes, Head of Payments, Head of Digital, Head of Risk, Head of Compliance, Head of Data Science. Reviews: weekly fraud metrics across all vectors, open investigator queues, model performance, real-time SLA health, emerging fraud trends, consortium signal quality.

**Model Risk Committee / MRM Process.** Per SR 11-7 cadence. All material fraud models reviewed at tiered cadence. Champion-challenger status. Drift monitoring. Retirement decisions.

**AI Council linkage.** Material model architecture changes (new graph algorithm, new transformer variant, new biometric model) flow through enterprise AI Council per pattern 2.3.

**Regulatory Engagement.** Proactive regulatory engagement on fraud program modernization. Ongoing dialogue with bank supervisors, CFPB (where applicable), and state regulators. EU AI Act compliance program for EU-facing operations.

**Investigator Operating Forum.** Biweekly. Investigator leads review case queues, disposition quality, model explanation utility, case management workflow health. Surfaces friction to technology and model teams.

### Part N · Sector Variants

- **Large bank.** Full scope across retail, commercial, wealth, payments; heavy MRM; cross-border obligations.
- **Community / regional bank.** Scope concentrated on payments and account opening; consortium signals especially valuable for scale; platform economics favor AI-native SaaS.
- **Credit union.** Scale constraints drive consortium dependence; member experience sensitivity high.
- **Credit card issuer.** Card-focused; card network signal integration central; dispute operations co-located with fraud.
- **Payment processor.** Network effects in fraud detection across merchants; merchant-level risk scoring; chargeback guarantee economics.
- **Fintech neobank.** AI-native from founding is common; identity and account opening weighted.
- **Insurance.** Claims fraud (P&C, life, health, workers comp); provider networks; SIU workflow; AI explainability central.
- **Wealth management.** Insider fraud, rogue advisor detection, elder exploitation detection.
- **Crypto / digital asset.** Chain analytics; sanctions screening; mule network detection adapted to on-chain patterns.

### Part O · Graph Schema Contribution

```cypher
// Pattern + topics
MERGE (p:Pattern {id: 'pattern_fraud_detection_modernization'})
ON CREATE SET
  p.name = 'Fraud Detection Modernization',
  p.category = 'Financial Crimes & Risk',
  p.cross_industry = false,
  p.primary_sector = 'financial_services',
  p.confidence_floor = 0.75,
  p.n_observations_floor = 6,
  p.version = '1.0.0';

MERGE (t_modelarch:Topic {id: 'topic_modern_model_architecture_fraud'})
ON CREATE SET t_modelarch.name = 'Modern Model Architecture Portfolio';
MERGE (t_unified:Topic {id: 'topic_unified_cross_channel_fraud'})
ON CREATE SET t_unified.name = 'Unified Cross-Channel Fraud Platform';
MERGE (t_realtime:Topic {id: 'topic_realtime_decisioning_fraud'})
ON CREATE SET t_realtime.name = 'Real-Time Decisioning Infrastructure';
MERGE (t_graph:Topic {id: 'topic_graph_network_intelligence_fraud'})
ON CREATE SET t_graph.name = 'Graph & Network Intelligence';
MERGE (t_invwf:Topic {id: 'topic_investigator_workflow'})
ON CREATE SET t_invwf.name = 'Investigator Workflow Modernization';
MERGE (t_mrm:Topic {id: 'topic_model_risk_management_ai'})
ON CREATE SET t_mrm.name = 'Model Risk Management for AI/ML';
MERGE (t_consort:Topic {id: 'topic_consortium_federated_signals'})
ON CREATE SET t_consort.name = 'Consortium & Federated Signal Integration';
MERGE (t_explain:Topic {id: 'topic_adverse_action_explainability'})
ON CREATE SET t_explain.name = 'Adverse Action & Explainability';

MERGE (p)-[:COVERS_TOPIC]->(t_modelarch);
MERGE (p)-[:COVERS_TOPIC]->(t_unified);
MERGE (p)-[:COVERS_TOPIC]->(t_realtime);
MERGE (p)-[:COVERS_TOPIC]->(t_graph);
MERGE (p)-[:COVERS_TOPIC]->(t_invwf);
MERGE (p)-[:COVERS_TOPIC]->(t_mrm);
MERGE (p)-[:COVERS_TOPIC]->(t_consort);
MERGE (p)-[:COVERS_TOPIC]->(t_explain);

// Related patterns
MERGE (p_kyc:Pattern {id: 'pattern_customer_onboarding_kyc_ai'});
MERGE (p)-[:RELATED_TO {relationship_type: 'associative'}]->(p_kyc);

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

// Vendors — incumbent platforms
MERGE (v_fico:Vendor {id: 'vendor_fico_falcon'})
ON CREATE SET v_fico.name = 'FICO Falcon Fraud Manager', v_fico.category = 'Card Fraud Platform';
MERGE (v_fico)-[:APPEARS_IN]->(p);

MERGE (v_sas:Vendor {id: 'vendor_sas_fraud'})
ON CREATE SET v_sas.name = 'SAS Fraud Management', v_sas.category = 'Enterprise Fraud Platform';
MERGE (v_sas)-[:APPEARS_IN]->(p);

MERGE (v_act:Vendor {id: 'vendor_nice_actimize'})
ON CREATE SET v_act.name = 'NICE Actimize', v_act.category = 'Financial Crimes Platform';
MERGE (v_act)-[:APPEARS_IN]->(p);

MERGE (v_aci:Vendor {id: 'vendor_aci_worldwide'})
ON CREATE SET v_aci.name = 'ACI Worldwide', v_aci.category = 'Payments Fraud';
MERGE (v_aci)-[:APPEARS_IN]->(p);

// Vendors — AI-native
MERGE (v_fdz:Vendor {id: 'vendor_feedzai'})
ON CREATE SET v_fdz.name = 'Feedzai', v_fdz.category = 'AI-native Payments Fraud';
MERGE (v_fdz)-[:APPEARS_IN]->(p);

MERGE (v_hawk:Vendor {id: 'vendor_hawk_ai'})
ON CREATE SET v_hawk.name = 'Hawk AI', v_hawk.category = 'AML + Fraud AI-native';
MERGE (v_hawk)-[:APPEARS_IN]->(p);

MERGE (v_sar:Vendor {id: 'vendor_sardine'})
ON CREATE SET v_sar.name = 'Sardine', v_sar.category = 'Risk & Fraud (Fintech)';
MERGE (v_sar)-[:APPEARS_IN]->(p);

MERGE (v_u21:Vendor {id: 'vendor_unit21'})
ON CREATE SET v_u21.name = 'Unit21', v_u21.category = 'Fraud & AML (Investigator-first)';
MERGE (v_u21)-[:APPEARS_IN]->(p);

MERGE (v_sift:Vendor {id: 'vendor_sift'})
ON CREATE SET v_sift.name = 'Sift', v_sift.category = 'Ecommerce Fraud';
MERGE (v_sift)-[:APPEARS_IN]->(p);

MERGE (v_for:Vendor {id: 'vendor_forter'})
ON CREATE SET v_for.name = 'Forter', v_for.category = 'Ecommerce Fraud';
MERGE (v_for)-[:APPEARS_IN]->(p);

MERGE (v_rsk:Vendor {id: 'vendor_riskified'})
ON CREATE SET v_rsk.name = 'Riskified', v_rsk.category = 'Ecommerce Fraud (Chargeback Guarantee)';
MERGE (v_rsk)-[:APPEARS_IN]->(p);

MERGE (v_sig:Vendor {id: 'vendor_signifyd'})
ON CREATE SET v_sig.name = 'Signifyd', v_sig.category = 'Ecommerce Fraud (Chargeback Guarantee)';
MERGE (v_sig)-[:APPEARS_IN]->(p);

// Identity & consortium
MERGE (v_tm:Vendor {id: 'vendor_lexisnexis_threatmetrix'})
ON CREATE SET v_tm.name = 'LexisNexis ThreatMetrix', v_tm.category = 'Device & Identity Consortium';
MERGE (v_tm)-[:APPEARS_IN]->(p);

MERGE (v_soc:Vendor {id: 'vendor_socure'})
ON CREATE SET v_soc.name = 'Socure', v_soc.category = 'Identity Verification & Consortium';
MERGE (v_soc)-[:APPEARS_IN]->(p);

MERGE (v_all:Vendor {id: 'vendor_alloy'})
ON CREATE SET v_all.name = 'Alloy', v_all.category = 'Identity Decisioning Orchestration';
MERGE (v_all)-[:APPEARS_IN]->(p);

MERGE (v_ews:Vendor {id: 'vendor_early_warning'})
ON CREATE SET v_ews.name = 'Early Warning Services', v_ews.category = 'Bank Consortium';
MERGE (v_ews)-[:APPEARS_IN]->(p);

MERGE (v_bc:Vendor {id: 'vendor_biocatch'})
ON CREATE SET v_bc.name = 'BioCatch', v_bc.category = 'Behavioral Biometrics';
MERGE (v_bc)-[:APPEARS_IN]->(p);

MERGE (v_ca:Vendor {id: 'vendor_chainalysis'})
ON CREATE SET v_ca.name = 'Chainalysis', v_ca.category = 'Blockchain Analytics';
MERGE (v_ca)-[:APPEARS_IN]->(p);

MERGE (v_qx:Vendor {id: 'vendor_quantexa'})
ON CREATE SET v_qx.name = 'Quantexa', v_qx.category = 'Entity Resolution & Investigation';
MERGE (v_qx)-[:APPEARS_IN]->(p);

// Network-level
MERGE (v_visa:Vendor {id: 'vendor_visa_advanced_auth'})
ON CREATE SET v_visa.name = 'Visa Advanced Authorization', v_visa.category = 'Card Network Fraud Scoring';
MERGE (v_visa)-[:APPEARS_IN]->(p);

MERGE (v_mc:Vendor {id: 'vendor_mastercard_decision_intelligence'})
ON CREATE SET v_mc.name = 'Mastercard Decision Intelligence / Brighterion', v_mc.category = 'Card Network Fraud Scoring';
MERGE (v_mc)-[:APPEARS_IN]->(p);

// Regulatory frameworks
MERGE (f_bsa:RegulatoryFramework {id: 'framework_bsa_aml'})
ON CREATE SET f_bsa.name = 'Bank Secrecy Act / AML';
MERGE (f_bsa)-[:APPLIES_TO]->(p);

MERGE (f_ofac:RegulatoryFramework {id: 'framework_ofac_sanctions'})
ON CREATE SET f_ofac.name = 'OFAC Sanctions';
MERGE (f_ofac)-[:APPLIES_TO]->(p);

MERGE (f_sr117:RegulatoryFramework {id: 'framework_sr_11_7'})
ON CREATE SET f_sr117.name = 'Federal Reserve SR 11-7 Model Risk Management';
MERGE (f_sr117)-[:APPLIES_TO]->(p);

MERGE (f_nist:RegulatoryFramework {id: 'framework_nist_ai_rmf'})
ON CREATE SET f_nist.name = 'NIST AI Risk Management Framework';
MERGE (f_nist)-[:APPLIES_TO]->(p);

MERGE (f_eu:RegulatoryFramework {id: 'framework_eu_ai_act'})
ON CREATE SET f_eu.name = 'EU AI Act';
MERGE (f_eu)-[:APPLIES_TO]->(p);

MERGE (f_ecoa:RegulatoryFramework {id: 'framework_ecoa_reg_b'})
ON CREATE SET f_ecoa.name = 'Equal Credit Opportunity Act / Regulation B';
MERGE (f_ecoa)-[:APPLIES_TO]->(p);

MERGE (f_psd2:RegulatoryFramework {id: 'framework_psd2_sca'})
ON CREATE SET f_psd2.name = 'PSD2 Strong Customer Authentication';
MERGE (f_psd2)-[:APPLIES_TO]->(p);
```

### Part P · Retrieval Contribution

~72 chunks. Namespace `global:patterns:financial_services`. Sub-variants across large-bank / regional / community / credit-union / credit-card-issuer / processor / fintech / insurance / wealth / crypto. Chunks carry `institution_type`, `fraud_vector` (card / ach / wire / rtp / account-opening / account-takeover / check / claims / internal / crypto), and `capability_area` (model-arch | cross-channel | realtime | graph | investigator | mrm | consortium | explainability).

### Part Q · Prompting Contract

**Detection fragment:**

```
PATTERN: pattern_fraud_detection_modernization (FINANCIAL_SERVICES)
Summary: Cross-channel fraud modernization — modern model architecture portfolio (transformers, GNN, biometrics), unified cross-channel platform, real-time decisioning, graph/network intelligence, investigator workflow, MRM alignment, consortium signal integration, adverse action + explainability.
Activates when:
- Rule engine dominance (>70% of decisioning)
- False positive ratio 10:1+ treated as normal
- Channel-siloed fraud ops (card/ACH/account/takeover separate)
- No graph/network intelligence for rings/mules
- Investigator workflow in generic ticket systems
- Case disposition not flowing back to model training
- Real-time rails under-protected or SLA-miss
- MRM framework not rigorously applied to AI/ML
Diagnostic questions focus on false positive rates by channel, cross-channel unification, graph capability, investigator feedback loop, real-time SLA, MRM for AI/ML, EU AI Act posture, consortium signal integration.
If active, output pattern_id, confidence, signals_triggered, rationale.
```

**Injection fragment:** Interventions emphasizing modern model architecture portfolio (transformers + graph NN + biometrics), unified cross-channel platform, real-time decisioning infra, graph/network intelligence layer, investigator workflow modernization, MRM alignment, consortium signal integration, explainability infrastructure. Observations: First Capital Financial cross-channel modernization (primary reference); card issuer transformer scoring; account opening consortium integration; credit union real-time uplift; insurance claims fraud; consumer lender adverse action; wealth insider detection; crypto-adjacent chain analytics. Anti-patterns: "more rules" response, accepting false positive rates, channel silos preserved, graph as science project, retraining on calendar cadence, investigator feedback as freetext, consortium batch-only, MRM as legal exercise.

**Diagnostic fragment:** Sequenced probing: false positive ratio with channel detail; unified platform scope; graph capability depth and integration; investigator workflow maturity and feedback cycle time; real-time SLA across rails; MRM tier classification for AI models; EU AI Act / adverse action posture; consortium signal depth and integration pattern.

### Part R · Rendering Contract

`/intelligence/patterns/fraud-detection-modernization`. Light hero + dark working zone.

Hero copy: **"Fraud is a network problem. Most detection stacks still treat it like a transaction problem."**

Unique rendering element: live fraud detection performance dashboard — ROC / PR curves across model generations, false positive ratio trend by channel, graph network visualization showing mule cluster detection, investigator disposition-to-learning cycle time, real-time SLA heatmap across rails. Composite tenant-connected version pulls from First Capital Financial reference program.

Right sidebar (tenant): current FPR by channel, current fraud loss rate (bps), graph coverage score, real-time SLA health, MRM validation coverage for AI models, EU AI Act posture (if applicable), consortium integration score.

Cross-links to customer onboarding / KYC AI pattern, analytics modernization parent, AI governance operating model pattern, and AI use case portfolio.

Composite tenant callout: First Capital Financial cross-channel fraud modernization shown as primary reference program. Always labeled "composite organization built from real-world data."

---

*End of Part 3.3a · Fraud Detection Modernization*

*Next in file sequence: `11-customer-onboarding-kyc-ai.md` — Part 3.3b Financial Services*

---
