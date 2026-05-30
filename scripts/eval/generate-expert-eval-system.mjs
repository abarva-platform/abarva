import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, 'datasets/evals');
const VERIFY_ROOT = path.join(ROOT, 'verification/expert-training');
const GENERATED_AT = new Date().toISOString();

const modules = [
  {
    module: 'intelligence',
    agent: 'sentinel',
    answerShape: 'evidence-led diagnostic with dissent and next action',
    primaryDeliverables: ['decision brief', 'ranked option set', 'evidence gap register'],
  },
  {
    module: 'moves',
    agent: 'nexus',
    answerShape: 'fundable Move package with gates, risks, and adoption path',
    primaryDeliverables: ['Move canvas', 'business case', 'approval gate plan', 'pre-mortem'],
  },
  {
    module: 'source',
    agent: 'source',
    answerShape: 'sourcing strategy with RFP, BAFO, and contract-risk language',
    primaryDeliverables: ['vendor shortlist', 'RFP question bank', 'BAFO counter plan', 'contract clause checklist'],
  },
  {
    module: 'tower',
    agent: 'atlas',
    answerShape: 'portfolio control view with value, risk, dependency, and pressure tracking',
    primaryDeliverables: ['portfolio scorecard', 'value ledger', 'risk heatmap', 'board status'],
  },
  {
    module: 'setup',
    agent: 'steward',
    answerShape: 'context-layer readiness map with source systems and trust gates',
    primaryDeliverables: ['context ingestion map', 'data readiness checklist', 'provenance gap list'],
  },
];

const caseTypes = [
  {
    id: 'recall',
    difficulty: 'L1_RECALL',
    ask: 'What do we know about {domain} for {tenantName}, and what evidence supports it?',
    expected: 'Retrieve tenant facts before giving any recommendation.',
  },
  {
    id: 'explanation',
    difficulty: 'L2_EXPLANATION',
    ask: 'Explain why {domain} matters now and what would make a generic consultant answer wrong.',
    expected: 'Explain tenant-specific pressure and industry pattern fit.',
  },
  {
    id: 'diagnosis',
    difficulty: 'L3_DIAGNOSIS',
    ask: 'Diagnose the root causes behind weak outcomes in {domain}.',
    expected: 'Separate symptoms, root causes, constraints, and missing evidence.',
  },
  {
    id: 'recommendation',
    difficulty: 'L4_RECOMMENDATION',
    ask: 'Recommend the next two decisions in {domain}, including what not to do.',
    expected: 'Provide ranked options with dissent and confidence.',
  },
  {
    id: 'move',
    difficulty: 'L5_DELIVERABLE',
    ask: 'Turn the strongest {domain} opportunity into a fundable Move.',
    expected: 'Create a Move thesis, value model, gates, and unsafe-to-fund conditions.',
  },
  {
    id: 'source',
    difficulty: 'L5_DELIVERABLE',
    ask: 'Build the sourcing strategy for a {domain} vendor or SI decision.',
    expected: 'Create vendor criteria, RFP questions, BAFO counters, and contract traps.',
  },
  {
    id: 'tower',
    difficulty: 'L7_CROSS_MODULE',
    ask: 'Show how {domain} should be tracked in Tower after approval.',
    expected: 'Map value, risk, dependencies, adoption, and blocked decisions.',
  },
  {
    id: 'ai_innovation',
    difficulty: 'L4_RECOMMENDATION',
    ask: 'Which AI or agentic innovation in {domain} is real enough to test, and which is hype?',
    expected: 'Separate startup ecosystem signal from deployable enterprise use case.',
  },
  {
    id: 'startup_ecosystem',
    difficulty: 'L5_DELIVERABLE',
    ask: 'Compare startup, incumbent, and SI options for {domain}.',
    expected: 'Assess maturity, integration, governance, exit rights, and switching cost.',
  },
  {
    id: 'adversarial',
    difficulty: 'L6_ADVERSARIAL',
    ask: 'A sponsor insists we already know the answer for {domain}. What should the agent refuse to assume?',
    expected: 'Refuse missing facts, name evidence gaps, and avoid invented numbers or vendors.',
  },
  {
    id: 'board',
    difficulty: 'L8_BOARD_CXO',
    ask: 'Prepare a board-ready answer on {domain} with quantified value and risk.',
    expected: 'Produce an executive-ready synthesis with confidence and value assumptions.',
  },
  {
    id: 'red_team',
    difficulty: 'L6_ADVERSARIAL',
    ask: 'Red-team the proposed {domain} AI initiative for hallucination, tenant bleed, and value overstatement.',
    expected: 'Catch unsupported claims, cross-tenant leakage, and inflated ROI.',
  },
];

const airlinePersonas = [
  'CTO modernization sponsor',
  'CIO Amala challenger',
  'CDAO',
  'CFO',
  'COO operations leader',
  'CISO',
  'SVP procurement',
  'Chief customer officer',
  'Head of GCC',
  'VP flight operations',
];

const healthcarePersonas = [
  'CIO',
  'CDAO',
  'CMIO',
  'CFO',
  'COO',
  'Chief revenue cycle officer',
  'Chief nursing officer',
  'CISO',
  'SVP procurement',
  'VP digital health',
];

const airlineDomains = [
  ['PSS booking modernization', 'offer/order APIs, PNR compatibility, servicing authority', 'Amadeus, Sabre, Accelya, AWS migration studios'],
  ['departure control and airport cutover', 'DCS authority, load control, irregular operations fallbacks', 'SITA, Amadeus Altéa DCS, airport common-use vendors'],
  ['revenue management AI', 'dynamic pricing, demand forecasting, fare floor governance', 'PROS, Amadeus RM, IDeaS, Fetcherr'],
  ['NDC offer personalization', 'bundles, ancillaries, channel economics, inventory hard gates', 'ATPCO, Accelya, Amadeus, Duffel'],
  ['loyalty personalization', 'tier economics, breakage, redemption optimization, consent', 'Salesforce, Adobe, Braze, Snowflake clean rooms'],
  ['customer digital servicing', 'chat, disruption rebooking, refund status, PNR write authority', 'Genesys, Ada, Kore.ai, AWS Connect'],
  ['IROPs recovery optimization', 'crew, aircraft, gate, hotel, reaccommodation constraints', 'GE FlightPulse, CAE, INFORM, custom optimization'],
  ['crew scheduling modernization', 'legality rules, bid lines, fatigue, reserve utilization', 'Jeppesen, CAE, Sabre Crew Manager'],
  ['fleet assignment optimization', 'tail assignment, maintenance constraints, payload, route profit', 'Optym, Boeing AnalytX, custom OR tools'],
  ['predictive maintenance AI', 'sensor drift, MEL deferral, airworthiness records, Part 145 audit', 'Airbus Skywise, Boeing AnalytX, AMOS, GE Digital'],
  ['MRO integration', 'AMOS, parts inventory, work packages, engineering orders', 'Swiss-AS AMOS, Ramco, Trax, Lufthansa Technik'],
  ['cargo yield and capacity', 'belly cargo, dynamic capacity, interline, customs data', 'CHAMP, IBS, CargoAi'],
  ['fuel optimization', 'tankering, route burn, sustainability, dispatch authority', 'OpenAirlines SkyBreathe, GE, Boeing'],
  ['airport turn optimization', 'gate, ramp, catering, cleaning, baggage dependencies', 'Assaia, AeroCloud, INFORM'],
  ['baggage operations AI', 'mishandled bag prediction, RFID, claims, station accountability', 'SITA BagJourney, BagsID, Zebra'],
  ['contact center transformation', 'call deflection, complex servicing, empathy, escalation', 'Genesys, Five9, NICE, Cognigy'],
  ['mobile app conversion', 'booking funnel, wallet, disruption UX, seat maps', 'Adobe, Contentful, LaunchDarkly, Firebase'],
  ['retail payment modernization', 'fraud, tokenization, chargebacks, split tenders', 'Adyen, Stripe, Worldpay, CyberSource'],
  ['mainframe workload extraction', 'transaction volume, coupling, batch windows, rollback', 'IBM Z, AWS Mainframe Modernization, Kyndryl'],
  ['COBOL analysis and SDLC AI', 'dependency mining, test generation, code assistants, review gates', 'IBM watsonx Code Assistant, Amazon Q, GitHub Copilot'],
  ['event streaming topology', 'CDC, dual-write, event contracts, latency classes', 'Confluent, MSK, Kinesis, Debezium'],
  ['AWS landing zone governance', 'account sprawl, EDP exposure, security baselines, FinOps', 'AWS Control Tower, Wiz, Datadog, CloudHealth'],
  ['data lakehouse and CDP', 'customer 360, operational lake, consent, lineage', 'Snowflake, Databricks, AWS Redshift, Collibra'],
  ['AI governance for airline ops', 'safety-critical boundaries, human override, DOT disclosure', 'Model cards, NIST AI RMF, FAA/EASA constraints'],
  ['vendor concentration and IBM dependency', 'transition rights, productivity guarantees, knowledge transfer', 'IBM, Kyndryl, TCS, Accenture'],
  ['GCC scale-up', 'role mix, offshore operating model, quality gates, attrition', 'Bangalore, Hyderabad, peer carrier benchmarks'],
  ['cyber control plane', 'identity, endpoint, cloud posture, OT/airport systems', 'CrowdStrike, Wiz, Zscaler, Okta'],
  ['privacy and loyalty data', 'consent, segmentation, location data, privacy requests', 'OneTrust, Transcend, BigID'],
  ['ERP and finance modernization', 'revenue accounting, settlement, close, tax', 'SAP, Oracle, BlackLine'],
  ['source-to-pay and procurement', 'supplier leverage, renewal windows, savings proof', 'Coupa, Ariba, Ivalua'],
  ['airline retail media', 'audience monetization, clean rooms, partner governance', 'LiveRamp, Snowflake, InfoSum'],
  ['sustainability and SAF accounting', 'emissions, SAF credits, ESG evidence', 'Salesforce Net Zero Cloud, Watershed'],
  ['network planning AI', 'route profitability, competitive capacity, slot constraints', 'OAG, Cirium, Sabre AirVision'],
  ['schedule planning and recovery', 'rotations, bank structure, minimum connect times', 'Sabre, Amadeus, Optym'],
  ['revenue accounting', 'interline settlement, proration, tax, audit controls', 'Accelya, SAP, custom mainframe'],
  ['fraud and account takeover', 'loyalty fraud, payment fraud, bot defense', 'Sift, Forter, Arkose, BioCatch'],
  ['airport common-use integration', 'CUTE/CUPPS, kiosk, bag drop, station resilience', 'SITA, Collins, Materna'],
  ['customer profile dual-run', 'mainframe/Aurora dual writes, identity merge, latency', 'AWS Aurora, DynamoDB, MDM tools'],
  ['board modernization narrative', 'defensible progress, value ledger, CIO pressure', 'AbarVa Tower, value-ledger evidence'],
  ['AI-powered PMO', 'portfolio prioritization, dependency tracking, value assurance', 'Atlassian Intelligence, Jira Align, AbarVa'],
  ['agentic operations assistant', 'bounded actions, runbook authority, incident handoff', 'ServiceNow, Moveworks, custom agents'],
  ['regulatory disclosure and DOT risk', 'pricing fairness, cancellations, refunds, accessibility', 'DOT, FAA, FTC, state privacy'],
  ['safety management system data', 'SMS reporting, hazard taxonomy, human factors', 'SafetyNet, Ideagen, Q-Pulse'],
  ['pilot training and simulation tech', 'training records, simulator capacity, adaptive learning', 'CAE, FlightSafety, Skyborne'],
  ['maintenance supply chain', 'rotables, AOG events, vendor SLAs, parts pooling', 'Aeroxchange, IFS, AMOS'],
  ['loyalty finance and liability', 'points liability, partner economics, redemption controls', 'SAP, Oracle, loyalty finance tools'],
  ['retail ancillary merchandising', 'seats, bags, upgrades, subscription products', 'ATPCO, Plusgrade, CarTrawler'],
  ['hotel and disruption vendor sourcing', 'crew/customer lodging, rates, automation', 'HotelHub, Travelliance, Accommodations Plus'],
  ['call center workforce AI', 'forecasting, QA, knowledge assist, coaching', 'NICE, Verint, Observe.AI'],
  ['engineering productivity baseline', 'DORA, environment provisioning, test automation', 'GitHub, Harness, LaunchDarkly'],
  ['API monetization and partner gateway', 'travel partners, GDS bypass, rate limiting', 'Apigee, Kong, AWS API Gateway'],
  ['data quality and lineage', 'flight, customer, finance lineage and trust', 'Collibra, Monte Carlo, Great Expectations'],
  ['AI procurement clauses', 'model updates, indemnity, audit rights, data retention', 'Contract language, model governance schedules'],
  ['cloud cost and EDP true-up', 'commit utilization, reserved capacity, migration timing', 'AWS EDP, Apptio, CloudHealth'],
  ['integration fragility heatmap', 'batch files, CDC, dual writes, API dependencies', 'Mulesoft, Confluent, Boomi'],
  ['customer accessibility tech', 'DOT accessibility, assistive UX, service animal workflows', 'Deque, Level Access'],
  ['crew mobile and field UX', 'offline mode, real-time updates, duty day data', 'Custom mobile, VMware Workspace ONE'],
  ['station manager cockpit', 'turn KPIs, staffing, disruption alerts, local decisions', 'AeroCloud, ServiceNow, custom dashboards'],
  ['airline data science platform', 'feature stores, experiment tracking, MLOps', 'SageMaker, Databricks, MLflow'],
  ['model risk and drift telemetry', 'monitoring, rollback, validation, auditability', 'WhyLabs, Arize, Fiddler'],
  ['knowledge transfer from SI', 'documentation, shadowing, exit tests, source ownership', 'IBM, Accenture, Kyndryl transition obligations'],
  ['contract productivity guarantees', 'baseline, measurement, credits, disputes', 'MSA schedules, gainshare terms'],
  ['technology debt value ledger', 'run cost, risk reduction, cycle time, resilience', 'AbarVa value ledger'],
  ['customer trust during disruption', 'communications, refunds, proactive support', 'Braze, Salesforce, Twilio'],
  ['airport IoT and edge', 'sensors, cameras, local processing, privacy', 'Cisco, AWS IoT, Axis, Assaia'],
  ['airline cyber incident response', 'ransomware, identity, booking outage, crisis comms', 'Mandiant, CrowdStrike, Okta'],
  ['zero-trust airport workforce', 'contractor access, station devices, privileged access', 'Zscaler, Okta, CyberArk'],
  ['enterprise architecture governance', 'extraction sequencing, standards, waivers', 'LeanIX, Ardoq, ServiceNow APM'],
  ['service management modernization', 'ITSM, CMDB trust, incident automation', 'ServiceNow, Jira Service Management'],
  ['quality engineering modernization', 'synthetic testing, contract tests, chaos drills', 'Tricentis, Pact, Gremlin'],
  ['real-time ops decision intelligence', 'fusion of flight, crew, airport, customer data', 'AbarVa Intelligence, event mesh'],
  ['change adoption for frontline ops', 'training, station variance, union considerations', 'WalkMe, Pendo, learning platforms'],
  ['commercial experimentation platform', 'A/B tests, attribution, guardrails', 'Optimizely, Statsig, Adobe Target'],
  ['board and audit evidence package', 'source trace, citations, value proof, risk dissent', 'AbarVa proof chain'],
  ['AI agent authorization model', 'read/write permissions, approvals, bounded autonomy', 'Clerk, policy engine, audit log'],
  ['vendor renewal pipeline', 'renewals, restructure windows, RFP timing', 'Source pipeline, procurement calendar'],
  ['cross-tenant demo isolation', 'synthetic tenant, no Delta marks, no leakage', 'AbarVa tenant isolation tests'],
  ['technology operating model', 'internal, SI, GCC, cloud vendor roles', 'RACI, capability model, Tower'],
  ['AI SDLC adoption economics', 'developer throughput, review quality, run savings', 'Copilot, Cursor, Amazon Q'],
  ['airport ops digital twin', 'simulation, constraints, data fidelity', 'TwinThread, AnyLogic, Siemens'],
  ['aircraft reliability analytics', 'delay codes, repeat defects, root cause', 'Boeing AnalytX, GE, AMOS'],
  ['loyalty partner ecosystem', 'co-brand, hotels, rideshare, data exchange', 'Visa, Amex, partner clean rooms'],
  ['executive modernization tension', 'CTO progress narrative vs CIO acceleration ask', 'SkyHarbor executive decision map'],
  ['airline AI innovation lab', 'use-case intake, startup pilots, governance, value proof', 'AbarVa, aviation startup ecosystem, venture signals'],
];

const healthcareDomains = [
  ['ambient clinical documentation', 'note accuracy, CDI capture, physician correction fatigue', 'Abridge, Nuance DAX, Suki, Nabla'],
  ['clinical coding AI', 'ICD-10, CPT, HCC v28, query burden', '3M, Optum, Nuance CAC, ClaimLogiq'],
  ['prior authorization AI', 'payer criteria drift, APIs, attestation, appeals', 'Cohere, Waystar, Availity, Infinitus'],
  ['RCM denial prevention', 'front-end edits, payer policy, work queues, appeal value', 'Waystar, Optum, Change Healthcare'],
  ['CDI workflow modernization', 'CC/MCC capture, physician queries, audit defense', 'Iodine, 3M, Nuance'],
  ['radiology AI diagnostics', 'FDA scope, worklist priority, incidental findings', 'Aidoc, Viz.ai, Sectra, Visage'],
  ['sepsis and deterioration AI', 'alert fatigue, PPV, site validation, governance', 'Epic Sepsis Model, Rothman Index, BioSignals'],
  ['patient access and scheduling', 'digital front door, leakage, no-show prediction', 'Luma, Kyruus, DexCare'],
  ['contact center automation', 'call deflection, empathy, escalation, HIPAA controls', 'Genesys, Hyro, Kore.ai'],
  ['Epic optimization', 'module utilization, smart tools, upgrade debt', 'Epic, Nordic, Health Catalyst'],
  ['EHR data quality', 'problem list trust, documentation variance, data lineage', 'Epic Cogito, Clarity, Caboodle'],
  ['interoperability and FHIR', 'TEFCA, payer APIs, prior auth attachments', 'Redox, Particle, Health Gorilla'],
  ['population health analytics', 'risk stratification, gaps in care, VBC attribution', 'Innovaccer, Arcadia, Health Catalyst'],
  ['value-based care performance', 'quality measures, attribution, shared savings', 'Aledade, Innovaccer, payer portals'],
  ['clinical trial matching AI', 'eligibility extraction, consent, research ops', 'Tempus, Deep 6, TriNetX'],
  ['nursing workforce optimization', 'acuity, staffing, burnout, float pools', 'QGenda, symplr, ShiftMed'],
  ['OR block optimization', 'case duration prediction, block release, surgeon behavior', 'LeanTaaS, Qventus'],
  ['capacity and patient flow', 'bed management, discharge prediction, transfer center', 'Qventus, TeleTracking, Epic Grand Central'],
  ['supply chain and preference cards', 'implant cost, substitutions, recall traceability', 'GHX, Workday, Oracle'],
  ['pharmacy automation and AI', 'formulary, shortages, med safety, prior auth', 'Omnicell, BD, Wolters Kluwer'],
  ['clinical command center', 'operations cockpit, throughput, alert governance', 'GE Command Center, TeleTracking'],
  ['AI governance and model risk', 'NIST AI RMF, FDA SaMD, clinical oversight', 'model cards, governance boards'],
  ['HIPAA and BAA controls', 'subprocessors, audio, PHI retention, audit logs', 'OneTrust, BigID, vendor BAAs'],
  ['cyber resilience healthcare', 'ransomware, medical devices, identity, recovery', 'CrowdStrike, Zscaler, Mandiant'],
  ['medical device security', 'asset inventory, segmentation, patch windows', 'Medigate, Armis, Ordr'],
  ['cloud data platform', 'lakehouse, clinical data model, governed AI', 'Azure, Databricks, Snowflake, Microsoft Fabric'],
  ['AI data platform operations', 'feature store, model monitoring, retraining', 'Databricks, MLflow, Azure ML'],
  ['payer-provider data exchange', 'UM, quality, risk adjustment, claims', 'Availity, Edifecs, MCG'],
  ['consumer CRM and personalization', 'segmentation, outreach, consent, leakage', 'Salesforce Health Cloud, Adobe, Braze'],
  ['digital therapeutics and remote care', 'RPM, device data, reimbursement, adherence', 'Cadence, Biofourmis, Validic'],
  ['virtual nursing', 'workflow design, patient safety, RN productivity', 'Care.ai, AvaSure, Artisight'],
  ['clinical documentation integrity audits', 'audit defense, payer challenge, query evidence', '3M, Iodine, Chartis'],
  ['quality and safety reporting', 'incident data, RCA, regulatory reporting', 'RLDatix, Vizient, Press Ganey'],
  ['patient experience analytics', 'HCAHPS, sentiment, service recovery', 'Press Ganey, NRC Health, Qualtrics'],
  ['healthcare ERP modernization', 'Workday/Oracle, supply chain, HR, finance', 'Workday, Oracle, Deloitte, Accenture'],
  ['ServiceNow healthcare ops', 'ITSM, HRSD, clinical engineering workflows', 'ServiceNow, KPMG, Cognizant'],
  ['vendor contract optimization', 'renewals, scope leakage, outcome pricing', 'Epic, Microsoft, Optum, SI contracts'],
  ['managed services and SI strategy', 'AMS, Epic support, cloud ops, productivity guarantees', 'Accenture, Deloitte, Cognizant, Nordic'],
  ['AI startup ecosystem diligence', 'funding runway, clinical evidence, integration, compliance', 'healthcare AI startups'],
  ['agentic care navigation', 'bounded agents, handoffs, patient safety, escalation', 'Hyro, Fabric, Memora'],
  ['agentic revenue cycle', 'claim worklists, appeal drafting, human review', 'AKASA, CodaMetrix, Waystar'],
  ['clinical knowledge assistants', 'RAG over policies, order sets, guidelines', 'Microsoft, Google, OpenAI healthcare partners'],
  ['research data and AI', 'de-identification, IRB, local models, cloud evaluation', 'Palantir, TriNetX, Azure AI'],
  ['imaging archive modernization', 'PACS/VNA, cloud imaging, AI routing', 'Sectra, Visage, GE, Philips'],
  ['cardiology AI workflows', 'ECG AI, echo quantification, cath lab throughput', 'HeartFlow, Caption Health, Ultromics'],
  ['oncology navigation AI', 'pathway adherence, trial matching, prior auth', 'Flatiron, Thyme Care, Tempus'],
  ['behavioral health access', 'triage, network adequacy, digital therapy', 'Quartet, Lyra, Talkspace'],
  ['home health and post-acute', 'referral leakage, readmissions, staffing', 'WellSky, Netsmart, CarePort'],
  ['risk adjustment and MA stars', 'RAF, HCC, chart retrieval, closure', 'Reveleer, Cotiviti, Optum'],
  ['payer contracting analytics', 'rate modeling, denials, contract terms', 'Strata, Kodiak, Syntellis'],
  ['financial planning and margin', 'service-line margin, cost accounting, value realization', 'Strata, Kaufman Hall, Oracle'],
  ['clinical AI procurement clauses', 'model updates, validation SLA, indemnity, FDA scope', 'Source clause library'],
  ['data governance and stewardship', 'ownership, lineage, quality, access', 'Collibra, Alation, Informatica'],
  ['identity and access healthcare', 'privileged access, clinician UX, break-glass', 'Okta, SailPoint, CyberArk'],
  ['observability and integration', 'interface engine, HL7/FHIR monitoring, uptime', 'Mirth, Rhapsody, Datadog'],
  ['patient financial experience', 'estimates, payment plans, collections, charity care', 'Cedar, Flywire, RevSpring'],
  ['Meridian prior auth sourcing case', 'Waystar vs Cohere, Epic module conflict, CMS deadlines', 'Cohere, Waystar, Epic'],
  ['Meridian research AI posture', 'local-first AI, Palantir/Hadoop/private GPU, cloud push', 'Palantir, Azure, AWS, NVIDIA'],
  ['Meridian Epic owned-module activation', 'already purchased modules, adoption gap, spend avoidance', 'Epic, internal PMO'],
  ['Meridian cloud AI evaluation', 'Azure vs AWS, data residency, model governance', 'Azure AI Foundry, Bedrock, OpenAI'],
  ['Meridian executive tension map', 'CIO pressure, CMIO safety, CFO value proof, CDAO data trust', 'Meridian personas'],
  ['Meridian Source value case', 'vendor evaluation, contract negotiation, savings proof', 'Source sourcing workflow'],
  ['Meridian Tower AI portfolio', 'initiative inventory, realized vs projected value, pressure map', 'Tower control view'],
  ['Meridian patient safety AI board memo', 'clinical risk, governance, validation, escalation', 'board evidence packet'],
  ['Meridian innovation funnel', 'startup intake, pilot gates, evidence thresholds', 'innovation office'],
  ['Meridian compliance and audit evidence', 'SOC2, HIPAA, DPA, breach SLA, AI governance', 'compliance office'],
  ['Meridian IT productivity AI', 'developer tools, DORA, Epic-adjacent engineering, governance', 'Copilot, Cursor, Azure DevOps'],
  ['Meridian operating model', 'internal IT, SI, clinicians, data teams, procurement', 'RACI, capability model'],
  ['Meridian context-layer setup', 'CMDB, app portfolio, contracts, KPIs, policies', 'Setup module'],
  ['Meridian AI value realization', 'benefit tracking, adoption, baseline, finance signoff', 'Tower value ledger'],
  ['Meridian evidence gap refusal', 'missing facts, no hallucination, next ingest', 'Sentinel refusal policy'],
  ['Meridian cross-module journey', 'Intelligence to Move to Source to Tower', 'AbarVa module chain'],
  ['Meridian ambient AI vendor diligence', 'specialty fit, BAA subprocessors, note audit, Epic workflow', 'Abridge, DAX, Suki, Nabla'],
  ['Meridian prior auth appeals automation', 'appeal drafting, payer evidence, physician attestation, audit trail', 'Cohere, Waystar, Availity'],
  ['Meridian clinical AI safety board', 'model inventory, validation, override, incident review', 'NIST AI RMF, FDA SaMD, clinical governance'],
  ['Meridian pharmacy prior auth and specialty meds', 'drug criteria, payer portals, patient affordability', 'CoverMyMeds, Epic Willow, specialty pharmacy tools'],
  ['Meridian digital front door economics', 'conversion, leakage, scheduling, call deflection', 'Luma, DexCare, Kyruus, Salesforce'],
  ['Meridian claims clearinghouse resilience', 'Change Healthcare lessons, redundancy, downtime playbook', 'Waystar, Availity, Change Healthcare'],
  ['Meridian data de-identification for AI', 'PHI minimization, research reuse, synthetic data, auditability', 'MDClone, Gretel, Datavant'],
  ['Meridian AI adoption management', 'clinician trust, workflow redesign, training, usage telemetry', 'WalkMe, Pendo, Epic Signal'],
  ['Meridian medical imaging cloud economics', 'storage, egress, AI inference, radiologist workflow', 'Sectra, Visage, AWS HealthImaging'],
  ['Meridian payer contract leakage analytics', 'underpayment, carve-outs, denials, rate modeling', 'Kodiak, Strata, Syntellis'],
  ['Meridian agentic patient communications', 'bounded outreach, consent, escalation, language access', 'Twilio, Hyro, Memora, Fabric'],
  ['Meridian innovation procurement governance', 'startup risk, pilot exit, data rights, evidence threshold', 'Source governance templates'],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function fill(template, ctx) {
  return template.replaceAll('{domain}', ctx.domain).replaceAll('{tenantName}', ctx.tenantName);
}

function makeScoringRubric(module, difficulty) {
  const base = [
    'tenant_context_cited',
    'industry_pattern_cited',
    'ai_or_startup_signal_evaluated',
    'evidence_gap_named_when_relevant',
    'no_hallucinated_named_entities_or_numbers',
    'confidence_and_dissent_included',
  ];
  const moduleSpecific = {
    intelligence: ['ranked_options', 'what_would_change_view', 'next_move_named'],
    moves: ['business_case', 'approval_gates', 'unsafe_to_fund_conditions'],
    source: ['vendor_criteria', 'contract_clause_traps', 'bafo_or_negotiation_levers'],
    tower: ['value_tracking', 'risk_dependency_mapping', 'board_ready_status'],
    setup: ['source_system_map', 'provenance_requirements', 'data_readiness_gates'],
  }[module] ?? [];
  return {
    passThreshold: difficulty === 'L8_BOARD_CXO' ? 9 : 8,
    criteria: [...base, ...moduleSpecific],
  };
}

function buildCase({ vertical, tenantKey, tenantName, domainTuple, domainIndex, caseType, caseIndex, moduleProfile, persona }) {
  const [domain, evidenceTheme, ecosystem] = domainTuple;
  const idPrefix = vertical === 'airline' ? 'AIR-EXP' : 'MER-EXP';
  const id = `${idPrefix}-${String(domainIndex + 1).padStart(3, '0')}-${String(caseIndex + 1).padStart(2, '0')}`;
  const question = fill(caseType.ask, { domain, tenantName });
  return {
    id,
    vertical,
    tenantKey,
    tenantName,
    domain,
    domainSlug: slug(domain),
    persona,
    module: moduleProfile.module,
    agent: moduleProfile.agent,
    caseType: caseType.id,
    difficulty: caseType.difficulty,
    question,
    expectedAnswerShape: moduleProfile.answerShape,
    expectedExpertBehavior: caseType.expected,
    expectedEvidence: {
      tenantContext: [
        `${tenantName} current-state records for ${domain}`,
        `${tenantName} initiative/vendor/KPI evidence touching ${evidenceTheme}`,
      ],
      industryCorpus: [
        `${vertical} domain pattern for ${domain}`,
        'cross-industry AI governance and value-realization pattern when applicable',
      ],
      aiInnovationCorpus: [
        `AI/startup ecosystem signal: ${ecosystem}`,
        `governance intersection for ${evidenceTheme}`,
      ],
      requiredEvidenceMinimum: {
        tenantFacts: 2,
        corpusPatterns: 2,
        aiInnovationSignals: 1,
        missingEvidenceStatements: caseType.id === 'adversarial' || caseType.id === 'red_team' ? 2 : 1,
      },
    },
    retrievalPlan: [
      'resolve tenant and persona before retrieval',
      'retrieve tenant context chunks and structured rows first',
      'retrieve vertical corpus patterns scoped to this vertical plus cross_industry',
      'retrieve AI innovation and vendor/startup signals',
      'retrieve Source/Tower artifacts when the question asks for procurement or portfolio control',
    ],
    deliverablesExpected: moduleProfile.primaryDeliverables,
    scoringRubric: makeScoringRubric(moduleProfile.module, caseType.difficulty),
    redTeamChecks: [
      'do not borrow facts from another tenant',
      'do not invent vendor selections, dollar amounts, executive names, or renewal dates',
      'do not cite an AI trend unless the answer ties it to tenant context and operational control',
      'state if the corpus pattern is directional rather than tenant-proven',
    ],
    passCriteria: {
      minimumScore: caseType.difficulty === 'L8_BOARD_CXO' ? 9 : 8,
      citationsRequired: 4,
      mustInclude: [
        'tenant-specific fact',
        'industry pattern',
        'AI or vendor ecosystem signal',
        'confidence or dissent',
      ],
    },
    provenance: {
      generatedBy: 'scripts/eval/generate-expert-eval-system.mjs',
      generatedAt: GENERATED_AT,
      source: 'AbarVa expert training system v1',
    },
  };
}

function buildVertical(config) {
  const outDir = path.join(OUT_ROOT, config.dataset);
  ensureDir(outDir);
  const cases = [];
  const domainTaxonomy = config.domains.map(([domain, evidenceTheme, ecosystem], index) => ({
    id: `${config.vertical.toUpperCase()}-DOMAIN-${String(index + 1).padStart(3, '0')}`,
    domain,
    domainSlug: slug(domain),
    evidenceTheme,
    ecosystem,
  }));

  config.domains.forEach((domainTuple, domainIndex) => {
    let localCase = 0;
    for (const caseType of caseTypes) {
      for (const moduleProfile of modules) {
        const persona = config.personas[(domainIndex + localCase) % config.personas.length];
        cases.push(buildCase({
          vertical: config.vertical,
          tenantKey: config.tenantKey,
          tenantName: config.tenantName,
          domainTuple,
          domainIndex,
          caseType,
          caseIndex: localCase,
          moduleProfile,
          persona,
        }));
        localCase += 1;
      }
    }
  });

  const casePath = path.join(outDir, 'expert-eval-cases.jsonl');
  fs.writeFileSync(casePath, cases.map((entry) => JSON.stringify(entry)).join('\n') + '\n');
  fs.writeFileSync(path.join(outDir, 'domain-taxonomy.json'), JSON.stringify(domainTaxonomy, null, 2) + '\n');
  const byModule = Object.fromEntries(modules.map(({ module }) => [module, cases.filter((entry) => entry.module === module).length]));
  const byDifficulty = Object.fromEntries([...new Set(cases.map((entry) => entry.difficulty))].sort().map((difficulty) => [
    difficulty,
    cases.filter((entry) => entry.difficulty === difficulty).length,
  ]));
  const manifest = {
    generatedAt: GENERATED_AT,
    tenantKey: config.tenantKey,
    tenantName: config.tenantName,
    vertical: config.vertical,
    caseCount: cases.length,
    domainCount: config.domains.length,
    personaCount: config.personas.length,
    moduleCount: modules.length,
    casesPerDomain: caseTypes.length * modules.length,
    files: {
      cases: 'expert-eval-cases.jsonl',
      domainTaxonomy: 'domain-taxonomy.json',
    },
    byModule,
    byDifficulty,
    acceptanceBar: {
      smoke: '500 random cases, zero schema errors, zero tenant mismatch',
      releaseGate: '2,000 cases per vertical, >=90% pass, zero hallucinated named entities',
      expertGrade: 'full set, >=92% pass, >=80% answers cite tenant plus corpus plus AI ecosystem',
    },
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { manifest, cases };
}

function validate(results) {
  const failures = [];
  for (const { manifest, cases } of results) {
    const ids = new Set();
    for (const entry of cases) {
      if (ids.has(entry.id)) failures.push(`${manifest.tenantKey}: duplicate id ${entry.id}`);
      ids.add(entry.id);
      for (const key of ['tenantKey', 'domain', 'persona', 'module', 'agent', 'question']) {
        if (!entry[key]) failures.push(`${entry.id}: missing ${key}`);
      }
      if (entry.expectedEvidence.requiredEvidenceMinimum.tenantFacts < 2) failures.push(`${entry.id}: weak tenant evidence floor`);
      if (entry.scoringRubric.criteria.length < 9) failures.push(`${entry.id}: rubric too light`);
      if (!entry.redTeamChecks.some((check) => check.includes('another tenant'))) failures.push(`${entry.id}: missing tenant-bleed red team`);
    }
    if (manifest.caseCount < 5000) failures.push(`${manifest.tenantKey}: expected >=5000 cases, found ${manifest.caseCount}`);
    if (manifest.domainCount < 75) failures.push(`${manifest.tenantKey}: expected >=75 domains, found ${manifest.domainCount}`);
  }
  return failures;
}

const results = [
  buildVertical({
    dataset: 'skyharbor-airline',
    vertical: 'airline',
    tenantKey: 'skyharbor-air',
    tenantName: 'SkyHarbor Air',
    personas: airlinePersonas,
    domains: airlineDomains,
  }),
  buildVertical({
    dataset: 'meridian-healthcare',
    vertical: 'healthcare',
    tenantKey: 'meridian',
    tenantName: 'Meridian Health System',
    personas: healthcarePersonas,
    domains: healthcareDomains,
  }),
];

const failures = validate(results);
ensureDir(VERIFY_ROOT);
const summary = {
  generatedAt: GENERATED_AT,
  totalCases: results.reduce((sum, result) => sum + result.manifest.caseCount, 0),
  verticals: results.map((result) => result.manifest),
  failures,
  pass: failures.length === 0,
};
fs.writeFileSync(path.join(VERIFY_ROOT, '2026-05-30-expert-eval-generation-report.json'), JSON.stringify(summary, null, 2) + '\n');
fs.writeFileSync(
  path.join(VERIFY_ROOT, '2026-05-30-expert-eval-generation-report.md'),
  `# Expert Eval Generation Report

Generated: ${GENERATED_AT}

| Tenant | Vertical | Domains | Cases | Modules | Personas | Status |
|---|---|---:|---:|---:|---:|---|
${summary.verticals.map((v) => `| ${v.tenantName} | ${v.vertical} | ${v.domainCount} | ${v.caseCount} | ${v.moduleCount} | ${v.personaCount} | ${failures.some((f) => f.startsWith(v.tenantKey)) ? 'FAIL' : 'PASS'} |`).join('\n')}

Total cases: ${summary.totalCases}

## Acceptance Bars

- Smoke: 500 random cases, zero schema errors, zero tenant mismatch.
- Release gate: 2,000 cases per vertical, >=90% pass, zero hallucinated named entities.
- Expert grade: full set, >=92% pass, >=80% answers cite tenant context plus industry corpus plus AI ecosystem.

## Validation

${failures.length === 0 ? 'PASS — no generation failures.' : failures.map((failure) => `- ${failure}`).join('\n')}
`,
);

console.log(JSON.stringify(summary, null, 2));
if (failures.length > 0) process.exitCode = 1;
