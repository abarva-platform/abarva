// src/lib/intelligence/source-lifecycle-patterns-cat.ts
//
// LifecyclePatternSeed wrappers for 12 PAT-SRC-CAT category patterns.
//
// The canonical knowledge content for these patterns lives in
// seed-patterns-sourcing-categories.ts (PatternSeed shape). These lifecycle
// wrappers extend that content with contradiction templates and failure modes
// derived from each pattern's `body` "Contradictions and failure modes" section
// and `riskFactors` array — enabling the template-coverage audit and the
// contradiction/failure-mode detectors to operate over category-level sourcing
// events in the same way they operate over AMS, RFP, and other lifecycle events.
//
// Patterns covered: CDW, CDP, LAKE, ERP, CRM, HCM, IAM, ITSM, BI, LLM, AGENT, FINOPS.

import type {
  LifecyclePatternSeed,
  LifecycleStage,
  GateCriterion,
  ContradictionTemplate,
  FailureMode,
} from './seed-types';

// ─── Shared category lifecycle stages ────────────────────────────────────────
// All 12 patterns follow the same 5-stage procurement lifecycle defined in
// seed-patterns-sourcing-categories.ts (CATEGORY_LIFECYCLE_STAGES).

const CAT_STAGES: LifecycleStage[] = [
  {
    id: 'Scope',
    label: 'Scope and operating model',
    order: 1,
    description:
      'Define the category boundary, business owner, system-of-record decision, integration footprint, and decision criteria before market contact.',
  },
  {
    id: 'MarketScan',
    label: 'Market scan and RFI',
    order: 2,
    description:
      'Map credible vendors to the buyer context, separating suite fit, specialist fit, and implementation dependencies.',
  },
  {
    id: 'RFP',
    label: 'Scripted RFP and proof',
    order: 3,
    description:
      'Require buyer-authored scenarios, evidence artifacts, and comparable pricing assumptions instead of generic demonstrations.',
  },
  {
    id: 'BAFO',
    label: 'Commercial normalization and BAFO',
    order: 4,
    description:
      'Normalize licenses, modules, usage limits, services, support, renewal terms, exit terms, and risk transfer before final award.',
  },
  {
    id: 'Contracting',
    label: 'Contracting and mobilization',
    order: 5,
    description:
      'Convert the selected solution into controlled contract terms, implementation gates, acceptance criteria, and transition commitments.',
  },
];

// ─── Shared minimal gate criteria for all CAT lifecycle patterns ─────────────

const CAT_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-CAT-SCOPE-01',
    description: 'Category boundary document signed by business owner',
    gateType: 'hard',
    stageId: 'MarketScan',
    evaluationHint: 'scope-boundary-approved=true in evidence map',
  },
  {
    id: 'GATE-CAT-RFP-01',
    description: 'Vendor responses received from at least 2 shortlisted vendors',
    gateType: 'hard',
    stageId: 'BAFO',
    evaluationHint: 'vendor-response-count≥2',
  },
  {
    id: 'GATE-CAT-BAFO-01',
    description: 'Normalized TCO model approved before award recommendation',
    gateType: 'hard',
    stageId: 'Contracting',
    evaluationHint: 'tco-model-approved=true in evidence map',
  },
];

// ─── PAT-SRC-CAT-CDW-001 · Cloud Data Warehouse ──────────────────────────────

const CDW_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-CDW-001',
    label: 'Lowest-cost claim vs workload-modeled TCO',
    severity: 'high',
    partyA: 'Vendor benchmark claim',
    partyB: 'Buyer workload-modeled total cost',
    detectionHint:
      'Vendor claims lowest-cost warehouse but workload replay, storage growth, egress, support, and commitment modeling reveal material cost divergence from headline benchmark.',
    resolutionPath:
      'Require vendor to price the buyer\'s representative workload traces — compute, storage, scan, transfer, support, and commitments — on a normalized three-year basis before BAFO.',
  },
  {
    id: 'CON-CDW-002',
    label: 'Serverless simplicity claim vs variable-cost reality',
    severity: 'medium',
    partyA: 'Vendor serverless simplicity claim',
    partyB: 'Measured variable-workload cost behavior',
    detectionHint:
      'Vendor asserts serverless is simpler and cheaper but variable workloads, network controls, and budget predictability create total cost divergence from steady-state provisioned baseline.',
    resolutionPath:
      'Run buyer workloads on both provisioned and serverless configurations; compare total cost, latency, concurrency, and budget-control options before selecting model.',
  },
  {
    id: 'CON-CDW-003',
    label: 'Built-in governance claim vs edition-gated control reality',
    severity: 'high',
    partyA: 'Vendor governance-included claim',
    partyB: 'Edition-gated or add-on control evidence',
    detectionHint:
      'Vendor claims governance is built in but required row/column controls, masking, lineage, or audit-log access require a higher edition, add-on SKU, or separate cloud-native configuration.',
    resolutionPath:
      'Map every required control to exact feature, SKU, edition, and configuration in the contract order form before award.',
  },
];

const CDW_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-CDW-001',
    label: 'Platform selected from benchmark slides without workload replay',
    description:
      'Team chooses a warehouse platform from vendor-presented benchmark data without replaying buyer workloads; actual cost and performance diverge significantly post-award.',
    stages: ['MarketScan', 'RFP'],
    mitigations: [
      'Require all shortlisted vendors to price the same buyer workload model',
      'Run representative ELT, dashboard, ad hoc, and governance workloads as proof gate before BAFO',
    ],
  },
  {
    id: 'FM-CDW-002',
    label: 'Cloud commitment and marketplace economics ignored',
    description:
      'Procurement optimises on list-price technical score without modelling cloud committed-use discounts and marketplace private-offer leverage that materially alter total cost.',
    stages: ['BAFO', 'Contracting'],
    mitigations: [
      'Separate technical score from procurement funding source',
      'Evaluate cloud-marketplace and committed-use discount options before final award',
    ],
  },
];

// ─── PAT-SRC-CAT-CDP-001 · Customer Data Platform ────────────────────────────

const CDP_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-CDP-001',
    label: 'Unified customer view claim vs identity resolution reality',
    severity: 'high',
    partyA: 'Vendor single-customer-view claim',
    partyB: 'Buyer-data identity resolution proof',
    detectionHint:
      'Vendor describes a unified profile without proving deterministic identifiers, merge rules, survivorship logic, consent behavior, and debugging capability on buyer data.',
    resolutionPath:
      'Require a live scripted proof using buyer-representative data covering match rules, profile lineage, survivorship, and consent behavior before shortlist.',
  },
  {
    id: 'CON-CDP-002',
    label: 'Real-time activation claim vs measured latency and limits',
    severity: 'high',
    partyA: 'Vendor real-time activation claim',
    partyB: 'Measured destination latency and API limits',
    detectionHint:
      'Vendor claims real-time activation but measured latency, destination-limit behavior, batch windows, API failure handling, retry logic, and suppression logic do not match claim.',
    resolutionPath:
      'Test activation latency end-to-end for critical use cases; document destination limits, retry behavior, and suppression rules in contract SLA schedules.',
  },
  {
    id: 'CON-CDP-003',
    label: 'Scalable pricing claim vs volume-modeled total cost',
    severity: 'high',
    partyA: 'Vendor scalable pricing claim',
    partyB: 'Buyer-volume modeled total cost including overages',
    detectionHint:
      'Vendor claims pricing is scalable but modeling events, profiles, rows, destinations, sync frequency, warehouse cost, implementation services, and support reveals material overage exposure.',
    resolutionPath:
      'Model full volume — events, active profiles, destinations, overages, warehouse impact, and services — and demand a volume cap before BAFO.',
  },
];

const CDP_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-CDP-001',
    label: 'Activation capability purchased before identity and consent model is ready',
    description:
      'Buyer invests in an impressive activation layer before establishing identity resolution quality, consent management operating model, and data-quality workflows; activation fires on poor data.',
    stages: ['Scope', 'MarketScan'],
    mitigations: [
      'Gate CDP selection on identity resolution and consent baseline assessment',
      'Require buyer data quality report as Scope exit criterion',
    ],
  },
  {
    id: 'FM-CDP-002',
    label: 'Public starter plan compared without enterprise volume reality',
    description:
      'Team compares public starter plans ignoring enterprise volume tiers, overage pricing, services, and renewal leverage; actual contract economics are materially different.',
    stages: ['RFP', 'BAFO'],
    mitigations: [
      'Build volume model from buyer data before issuing RFP',
      'Require vendors to quote against buyer volume model, not list-price tiers',
    ],
  },
];

// ─── PAT-SRC-CAT-LAKE-001 · Lakehouse and Data Lake ─────────────────────────

const LAKE_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-LAKE-001',
    label: 'Open platform claim vs catalog and control-plane lock-in',
    severity: 'high',
    partyA: 'Vendor open-platform claim',
    partyB: 'Metadata, policy, and write-path portability reality',
    detectionHint:
      'Vendor claims the platform is open with open storage but metadata, policies, lineage, or write paths remain tightly bound to proprietary catalog or control-plane services.',
    resolutionPath:
      'Validate metadata export, policy portability, cross-engine read/write semantics, and exit export obligations in contract before award.',
  },
  {
    id: 'CON-LAKE-002',
    label: 'Lakehouse lowers cost claim vs distributed service cost reality',
    severity: 'high',
    partyA: 'Vendor cost-reduction claim',
    partyB: 'Full workload bill of materials',
    detectionHint:
      'Vendor claims the lakehouse lowers cost but storage, compute, catalog, scan, orchestration, governance, support, and networking charges modeled together reveal TCO is comparable or higher than alternative.',
    resolutionPath:
      'Build a full workload bill of materials covering all cost drivers and run a cost replay with buyer workloads before award.',
  },
  {
    id: 'CON-LAKE-003',
    label: 'Unified governance claim vs cross-engine enforcement reality',
    severity: 'medium',
    partyA: 'Vendor unified governance claim',
    partyB: 'Cross-engine control enforcement proof',
    detectionHint:
      'Vendor claims governance is unified but row, column, tag, lineage, audit, and cross-engine enforcement behavior is inconsistent or limited to a single engine in buyer scenarios.',
    resolutionPath:
      'Test governance controls across all in-scope compute engines using buyer-representative scenarios before shortlist.',
  },
];

const LAKE_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-LAKE-001',
    label: 'Object storage openness treated as full platform portability',
    description:
      'Team assumes open storage formats mean full platform portability; proprietary catalog, policy, and lineage services create exit barriers not visible during evaluation.',
    stages: ['Scope', 'RFP'],
    mitigations: [
      'Require metadata export, policy portability, and exit-simulation test as RFP proof criteria',
      'Map every governance control to specific engine, catalog, and configuration',
    ],
  },
  {
    id: 'FM-LAKE-002',
    label: 'Compute rates compared without governance, storage, and operations cost',
    description:
      'Evaluation compares compute rates only; catalog, governance, networking, storage, scan, transactions, and operations burden create TCO significantly different from rate comparison.',
    stages: ['RFP', 'BAFO'],
    mitigations: [
      'Build a full cost model before RFP shortlist',
      'Require vendors to price the same workload model including all service components',
    ],
  },
];

// ─── PAT-SRC-CAT-ERP-001 · Cloud ERP ─────────────────────────────────────────

const ERP_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-ERP-001',
    label: 'Single source of truth claim vs spreadsheet dependency reality',
    severity: 'high',
    partyA: 'Vendor single-source-of-truth claim',
    partyB: 'Actual close and reporting dependency evidence',
    detectionHint:
      'Vendor claims ERP is the single source of truth but critical finance data still depends on spreadsheets, data lake reconciliation, or specialist close tools to produce board-ready outputs.',
    resolutionPath:
      'Require end-to-end close simulation using buyer chart of accounts and reporting requirements before shortlist; escalate spreadsheet dependencies as control deficiencies.',
  },
  {
    id: 'CON-ERP-002',
    label: 'Standard process claim vs localization and customization reality',
    severity: 'high',
    partyA: 'Vendor standard-process claim',
    partyB: 'Localization, revenue recognition, and reporting requirement evidence',
    detectionHint:
      'Vendor claims the implementation is mostly standard configuration but localization, revenue recognition, approval workflows, or reporting needs require material customization that inflates implementation cost and timeline.',
    resolutionPath:
      'Require a gap analysis against buyer process requirements and a resource-loaded implementation plan before award.',
  },
  {
    id: 'CON-ERP-003',
    label: 'AI-assisted close claim vs audit-evidence readiness',
    severity: 'high',
    partyA: 'Vendor AI-assisted close claim',
    partyB: 'Audit, control, and reviewer evidence requirement reality',
    detectionHint:
      'Vendor claims AI-assisted close will reduce manual effort but no buyer-specific evidence demonstrates outputs satisfy audit trail, control, and reviewer documentation requirements.',
    resolutionPath:
      'Require auditor involvement during proof phase; test AI close outputs against buyer audit and control requirements before award.',
  },
  {
    id: 'CON-ERP-004',
    label: 'Configuration-dominant implementation claim vs migration complexity reality',
    severity: 'high',
    partyA: 'Vendor configuration-dominant implementation claim',
    partyB: 'Actual migration, integration, and control-design complexity',
    detectionHint:
      'Vendor claims implementation is mostly configuration but chart-of-accounts redesign, data cleansing, integration remediation, and control redesign dominate the implementation plan and timeline.',
    resolutionPath:
      'Require resource-loaded implementation plan, data-migration approach with reconciliation gates, and named SI team before award.',
  },
];

const ERP_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-ERP-001',
    label: 'Finance platform selected without control-model proof',
    description:
      'Buyer selects an ERP platform without proving the control model, data model, integration architecture, and implementation plan; audit and compliance gaps surface post-go-live.',
    stages: ['Scope', 'RFP'],
    mitigations: [
      'Require auditor engagement during evaluation proof phase',
      'Gate award on control-evidence demonstration and reconciliation test',
    ],
  },
  {
    id: 'FM-ERP-002',
    label: 'SI effort under-scoped',
    description:
      'Implementation partner effort is materially under-scoped at award; cost and timeline overruns emerge during design as migration, integration, and process complexity is revealed.',
    stages: ['RFP', 'BAFO'],
    mitigations: [
      'Require resource-loaded SI plan with named team before award',
      'Hold a program-risk review with auditor, IT, and finance before contracting',
    ],
  },
];

// ─── PAT-SRC-CAT-CRM-001 · Enterprise CRM ────────────────────────────────────

const CRM_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-CRM-001',
    label: 'Native AI seller productivity claim vs buyer-measured adoption reality',
    severity: 'high',
    partyA: 'Vendor AI productivity claim',
    partyB: 'Buyer-measured adoption and outcome evidence',
    detectionHint:
      'Vendor claims native AI will improve seller productivity but buyer has no evidence of included features, usage limits, customer-data posture, opt-out controls, or measured pilot adoption.',
    resolutionPath:
      'Require AI feature inventory, usage entitlements, data-use exhibit, and buyer-run adoption pilot before award.',
  },
  {
    id: 'CON-CRM-002',
    label: 'Straightforward implementation claim vs data model and integration complexity',
    severity: 'high',
    partyA: 'Vendor straightforward implementation claim',
    partyB: 'Account hierarchy, integration, and acceptance test complexity',
    detectionHint:
      'Vendor claims implementation is straightforward but account hierarchy migration, duplicate-management rules, ERP/CPQ integration plan, sandbox deployment process, and acceptance tests reveal material complexity.',
    resolutionPath:
      'Require resource-loaded implementation plan and named SI team with ERP/CPQ integration experience before award.',
  },
  {
    id: 'CON-CRM-003',
    label: 'Suite consolidation cost-reduction claim vs full TCO reality',
    severity: 'high',
    partyA: 'Vendor suite consolidation savings claim',
    partyB: 'Full TCO including add-ons, services, and renewal economics',
    detectionHint:
      'Vendor claims suite consolidation lowers cost but full TCO including unused seats, add-ons, support tier, storage/API growth, implementation services, and renewal-year pricing reveals comparable or higher cost.',
    resolutionPath:
      'Build a five-year TCO model including all modules, support, storage, API growth, services, and renewal escalators before BAFO.',
  },
];

const CRM_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-CRM-001',
    label: 'Data model discovery deferred until post-award',
    description:
      'CRM selected from executive demo without testing customer data model, territory rules, reporting hierarchy, or ERP handoff against buyer operating model; gaps surface during implementation.',
    stages: ['MarketScan', 'RFP'],
    mitigations: [
      'Require buyer-scenario scripted proof covering account hierarchy, ERP handoff, and territory model',
      'Reject demos that use vendor sample data without buyer context',
    ],
  },
  {
    id: 'FM-CRM-002',
    label: 'Subscription price optimised while ignoring AI, storage, and renewal levers',
    description:
      'Negotiation focuses on subscription seat price while AI credits, storage, API limits, premium support, partner cost, renewal escalators, and exit costs are left unaddressed.',
    stages: ['BAFO', 'Contracting'],
    mitigations: [
      'Negotiate AI usage terms, storage and API caps, and renewal escalator ceiling before contracting',
      'Require contract exit and data-portability terms in base agreement',
    ],
  },
];

// ─── PAT-SRC-CAT-HCM-001 · Human Capital Management ─────────────────────────

const HCM_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-HCM-001',
    label: 'Unified suite claim vs cross-module workflow reality',
    severity: 'high',
    partyA: 'Vendor unified suite claim',
    partyB: 'End-to-end workflow proof across payroll and HR modules',
    detectionHint:
      'Vendor claims the suite is unified but an end-to-end workflow crossing core HR, payroll, time, security roles, reporting, and downstream finance involves manual rekeying or integration gaps.',
    resolutionPath:
      'Run end-to-end workflow proof across HR, payroll, time, and finance integration before shortlist; document any manual touchpoints.',
  },
  {
    id: 'CON-HCM-002',
    label: 'Standard implementation claim vs country, payroll, and integration complexity',
    severity: 'high',
    partyA: 'Vendor standard implementation claim',
    partyB: 'Country, payroll, and integration complexity evidence',
    detectionHint:
      'Vendor claims implementation is standard but country/pay-group rollout plan, integration count, data-cleaning assumptions, parallel payroll cycles, and named partner staffing reveal material complexity mismatch.',
    resolutionPath:
      'Require resource-loaded implementation plan with country/pay-group scripts, parallel payroll run criteria, and named SI team before award.',
  },
  {
    id: 'CON-HCM-003',
    label: 'AI governance claim vs explainability and opt-out evidence',
    severity: 'high',
    partyA: 'Vendor AI governance claim',
    partyB: 'Intended-use documentation and regulatory evidence',
    detectionHint:
      'Vendor claims AI is governed but cannot produce intended-use documentation, oversight controls, explainability evidence, model/data controls, audit logs, or customer opt-out mechanisms for employment-affecting AI features.',
    resolutionPath:
      'Require AI feature inventory, legal and bias-control review, and opt-out controls before award for any feature affecting hiring, performance, scheduling, or worker management.',
  },
];

const HCM_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-HCM-001',
    label: 'Payroll treated as just another module',
    description:
      'Payroll accuracy, compliance, and parallel-run requirements are not given appropriate evaluation weight; retro pay, leave, time, union, benefit, and tax scenarios are not proven before award.',
    stages: ['Scope', 'RFP'],
    mitigations: [
      'Treat payroll parallel run as a hard gate criterion',
      'Require country/pay-group scripted demos with buyer data',
    ],
  },
  {
    id: 'FM-HCM-002',
    label: 'HR owns the event without payroll, IT, finance, legal, and works council',
    description:
      'HR function sponsors the event without adequate involvement from payroll, IT, finance, legal, security, works council, and frontline operations; compliance, integration, and labor-law risks emerge post-award.',
    stages: ['Scope'],
    mitigations: [
      'Mandate multi-function steering committee with payroll, IT, finance, legal, and security representation',
      'Gate Scope exit on all stakeholder sign-off',
    ],
  },
];

// ─── PAT-SRC-CAT-IAM-001 · Workforce IAM ─────────────────────────────────────

const IAM_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-IAM-001',
    label: 'MFA solved claim vs assurance-level and recovery reality',
    severity: 'high',
    partyA: 'Vendor MFA-solved claim',
    partyB: 'Assurance level, recovery, and admin-path reality',
    detectionHint:
      'Vendor claims MFA is solved but buyer cannot map push, TOTP, SMS, passkeys, and hardware-backed phishing-resistant authentication to assurance levels, high-risk user policies, recovery workflows, and admin-group exceptions.',
    resolutionPath:
      'Require assurance-level mapping, high-risk user policy design, recovery control evidence, and break-glass procedure before award.',
  },
  {
    id: 'CON-IAM-002',
    label: 'Lifecycle automation claim vs app coverage and deprovisioning reality',
    severity: 'high',
    partyA: 'Vendor lifecycle-automation claim',
    partyB: 'App inventory, connector proof, and leaver deprovisioning evidence',
    detectionHint:
      'Vendor claims lifecycle is automated but SSO rollout ignores legacy, private, admin, contractor, and long-tail SaaS applications; SCIM attribute mapping and deprovisioning evidence for critical apps is absent.',
    resolutionPath:
      'Require app inventory, connector proof for all in-scope apps, manual exception workflow, and timed deprovisioning test before award.',
  },
  {
    id: 'CON-IAM-003',
    label: 'Bundled identity free claim vs required control coverage and migration cost',
    severity: 'high',
    partyA: 'Vendor bundled-identity-free claim',
    partyB: 'Required control coverage, services, and migration cost reality',
    detectionHint:
      'Vendor claims identity is free or bundled but comparing required controls, full app coverage, professional services, support, and migration effort reveals material cost divergence from headline.',
    resolutionPath:
      'Model full control requirement against bundled coverage gaps; price services, migration, and support separately before BAFO.',
  },
];

const IAM_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-IAM-001',
    label: 'Platform selected on headline per-user price while long-tail apps remain manual',
    description:
      'IAM platform selected on per-user SSO price without covering long-tail apps, recovery workflows, and deprovisioning; audit reveals manual identity processes for significant app estate.',
    stages: ['Scope', 'RFP'],
    mitigations: [
      'Require full app inventory before RFP; gate shortlist on connector coverage',
      'Include deprovisioning response-time SLA in contract',
    ],
  },
  {
    id: 'FM-IAM-002',
    label: 'MFA adoption confused with phishing-resistant authentication',
    description:
      'Organisation reports high MFA adoption but assurance level remains low; SMS and push-notification methods remain in use for high-risk accounts without phishing-resistant alternatives.',
    stages: ['Scope', 'MarketScan'],
    mitigations: [
      'Require FIDO2/passkey or hardware-backed MFA for privileged and high-risk roles',
      'Document assurance-level gap and remediation plan as Scope exit criterion',
    ],
  },
];

// ─── PAT-SRC-CAT-ITSM-001 · IT Service Management ────────────────────────────

const ITSM_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-ITSM-001',
    label: 'AI ticket deflection claim vs baseline, scope, and pilot evidence',
    severity: 'high',
    partyA: 'Vendor AI deflection claim',
    partyB: 'Buyer ticket baseline and measured pilot evidence',
    detectionHint:
      'Vendor claims AI will deflect a significant portion of tickets but cannot produce current ticket baselines, in-scope topics, usage entitlements, escalation paths, human review, training/data posture, or measured pilot criteria.',
    resolutionPath:
      'Require buyer ticket baseline analysis, in-scope intent mapping, and a measured pilot before including AI deflection in business case.',
  },
  {
    id: 'CON-ITSM-002',
    label: 'CMDB included claim vs data owner and maintenance reality',
    severity: 'high',
    partyA: 'Vendor CMDB-included claim',
    partyB: 'Asset discovery, data owner, and reconciliation evidence',
    detectionHint:
      'Vendor claims CMDB is included but buyer lacks asset discovery scope definition, relationship model, data owners, reconciliation rules, and ongoing maintenance process to keep it accurate.',
    resolutionPath:
      'Define CMDB scope, discovery method, data owners, reconciliation cadence, and governance model before award.',
  },
  {
    id: 'CON-ITSM-003',
    label: 'ITIL alignment claim vs buyer process fit and workflow evidence',
    severity: 'medium',
    partyA: 'Vendor ITIL/ISO alignment claim',
    partyB: 'Buyer-specific process mapping and workflow evidence',
    detectionHint:
      'Vendor claims ITIL or ISO alignment is sufficient but buyer-specific process mapping, workflow evidence, and administrator operating model confirm material configuration gap.',
    resolutionPath:
      'Require buyer process gap analysis and workflow mapping before shortlist; document administrator operating model.',
  },
];

const ITSM_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-ITSM-001',
    label: 'Service desk tool purchased while operating-model design is deferred',
    description:
      'Buyer purchases ITSM tool but discovers the hard work was service operating-model design; workflows, queues, SLAs, and knowledge management need significant effort post-award.',
    stages: ['Scope'],
    mitigations: [
      'Require operating-model design as a Scope gate deliverable',
      'Include service-design workshop in RFP as mandatory proof activity',
    ],
  },
  {
    id: 'FM-ITSM-002',
    label: 'Migration scope under-estimated',
    description:
      'Workflows, request types, queues, automations, SLAs, knowledge articles, asset records, CMDB relationships, integrations, identity groups, reports, and historical tickets are under-scoped in migration plan.',
    stages: ['RFP', 'BAFO'],
    mitigations: [
      'Require full migration inventory as part of RFP',
      'Hold vendor accountable to migration timeline and completeness in contract',
    ],
  },
];

// ─── PAT-SRC-CAT-BI-001 · Governed Business Intelligence ─────────────────────

const BI_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-BI-001',
    label: 'Self-service analytics analyst-burden-reduction claim vs metric governance reality',
    severity: 'high',
    partyA: 'Vendor self-service analytics claim',
    partyB: 'Semantic definitions, certified content, and governance evidence',
    detectionHint:
      'Vendor claims self-service analytics reduces analyst burden but teams publish duplicate dashboards for the same metric without semantic definitions, certified content workflow, or authoritative business definition ownership.',
    resolutionPath:
      'Require semantic layer proof, certified content workflow, and governance ownership model before shortlist.',
  },
  {
    id: 'CON-BI-002',
    label: 'AI answers business questions claim vs governed metrics and hallucination evidence',
    severity: 'high',
    partyA: 'Vendor AI analytics claim',
    partyB: 'Governed metrics, row-level access, and hallucination control evidence',
    detectionHint:
      'Vendor claims AI answers business questions but governed metrics, row-level access, hallucination controls, source traceability, and escalation to analysts are not demonstrated on buyer data.',
    resolutionPath:
      'Test AI analytics on buyer-representative data including governed metric queries, row-level access scenarios, and known-answer validation.',
  },
  {
    id: 'CON-BI-003',
    label: 'Inexpensive licence claim vs full capacity and compute TCO',
    severity: 'medium',
    partyA: 'Vendor inexpensive licence claim',
    partyB: 'Full role mix, capacity, embedded rights, and compute cost reality',
    detectionHint:
      'Vendor claims the licence is inexpensive but modelling role mix, capacity costs, embedded analytics users, support, migration, data-platform compute triggered by BI queries, and unused-seat cleanup reveals material total cost divergence.',
    resolutionPath:
      'Model full BI licence cost including capacity, embedded rights, query-driven compute, support, and migration before BAFO.',
  },
];

const BI_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-BI-001',
    label: 'Dashboard sprawl replaced with new dashboard factory',
    description:
      'BI tool migration replaces the old dashboard proliferation with a new one on the new platform; root-cause metric governance is not addressed.',
    stages: ['Scope', 'RFP'],
    mitigations: [
      'Require certified content workflow and metric ownership governance as platform selection criteria',
      'Gate migration on metric definition alignment, not dashboard count',
    ],
  },
  {
    id: 'FM-BI-002',
    label: 'AI analytics purchased before metric definitions are agreed',
    description:
      'AI analytics capability is purchased and deployed before the business agrees on metric definitions and certified content; AI produces confident but ungoverned answers.',
    stages: ['Scope'],
    mitigations: [
      'Gate AI analytics activation on semantic layer and certified content readiness',
      'Require metric ownership governance model before AI feature rollout',
    ],
  },
];

// ─── PAT-SRC-CAT-LLM-001 · Enterprise LLM and Generative AI ──────────────────

const LLM_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-LLM-001',
    label: 'Same model across channels claim vs price, quota, and terms divergence',
    severity: 'high',
    partyA: 'Vendor model-consistency-across-channels claim',
    partyB: 'Price, region, quota, latency, and terms evidence by channel',
    detectionHint:
      'Vendor claims the same model is available through multiple channels but price, region availability, quota, latency, feature support, data retention, logging, and terms diverge materially by channel.',
    resolutionPath:
      'Compare each deployment channel on price, region, quota, latency, retention, training use, abuse monitoring, and contract terms before selecting.',
  },
  {
    id: 'CON-LLM-002',
    label: 'Data protected claim vs residency, retention, and training use reality',
    severity: 'high',
    partyA: 'Vendor data-protected claim',
    partyB: 'Residency, retention, training use, and support access reality',
    detectionHint:
      'Vendor claims data is protected but residency, processing location, retention, training use, abuse monitoring, support access, and fine-tuning data handling differ materially across deployment types and features.',
    resolutionPath:
      'Require legal and security review of each deployment type and feature class; document residency, retention, training use, and support access in contract before award.',
  },
  {
    id: 'CON-LLM-003',
    label: 'Inexpensive workload claim vs agentic loop and tool-call cost reality',
    severity: 'high',
    partyA: 'Vendor low-cost workload claim',
    partyB: 'Agentic loop, retry, and tool-call cost model',
    detectionHint:
      'Vendor claims the workload is inexpensive but modelling prompts, outputs, retries, agent loops, tool calls, cache misses, batch eligibility, and observability reveals variable cost exposure that exceeds estimate.',
    resolutionPath:
      'Require vendor-assisted cost modelling of buyer workloads including agentic scenarios, tool calls, and retry paths before BAFO.',
  },
];

const LLM_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-LLM-001',
    label: 'AI experimentation approved without cost, data, and fallback controls',
    description:
      'AI experimentation proceeds without cost budgets, data boundary controls, or fallback plans; production usage behaves differently from prototype, creating unexpected cost and compliance exposure.',
    stages: ['Scope', 'MarketScan'],
    mitigations: [
      'Require cost budget and data boundary policy before any production workload',
      'Gate production deployment on fallback and observability plan',
    ],
  },
  {
    id: 'FM-LLM-002',
    label: 'Single provider path locked in without multi-provider leverage',
    description:
      'Buyer commits to one provider path and loses leverage when model deprecation, quota constraints, regional requirements, or application quality shifts require alternatives.',
    stages: ['BAFO', 'Contracting'],
    mitigations: [
      'Require abstraction layer or API-neutral integration before contracting',
      'Negotiate model-deprecation notice and transition assistance in contract',
    ],
  },
];

// ─── PAT-SRC-CAT-AGENT-001 · Enterprise AI Agent Platform ────────────────────

const AGENT_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-AGENT-001',
    label: 'Production-ready agents claim vs identity, policy, and trace evidence',
    severity: 'high',
    partyA: 'Vendor production-ready agents claim',
    partyB: 'Identity, policy, tool failure, and audit trace evidence',
    detectionHint:
      'Vendor claims agents are production-ready but identity design, policy enforcement, tool failure handling, trace export, human approval workflow, rollback procedures, and cost caps are not demonstrated.',
    resolutionPath:
      'Require live proof of agent identity policy, human approval for high-risk actions, tool failure handling, trace export, and rollback before any production deployment.',
  },
  {
    id: 'CON-AGENT-002',
    label: 'No-code business-user safety claim vs environment and tool control evidence',
    severity: 'high',
    partyA: 'Vendor no-code business-user-safe claim',
    partyB: 'Environment separation, publishing controls, and audit evidence',
    detectionHint:
      'Vendor claims no-code agents are safe for business users but environment separation, publishing controls, tool allowlists, and audit trail are not enforced or provable.',
    resolutionPath:
      'Require environment separation, publishing approval workflow, tool allowlist enforcement, and audit log evidence before enabling business-user authoring.',
  },
  {
    id: 'CON-AGENT-003',
    label: 'Framework portability prevents lock-in claim vs connector and telemetry export reality',
    severity: 'high',
    partyA: 'Vendor framework portability claim',
    partyB: 'Memory, connector mapping, evaluation data, and telemetry export reality',
    detectionHint:
      'Vendor claims framework portability prevents lock-in but memory schema, tool schema, evaluation data, connector mappings, and production telemetry export are tightly bound to the vendor platform.',
    resolutionPath:
      'Test memory export, tool schema portability, evaluation data ownership, connector re-mapping, and telemetry export before award.',
  },
];

const AGENT_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-AGENT-001',
    label: 'Demo becomes production authority without identity and policy design',
    description:
      'A successful agent demo is promoted to production without designing agent identity scope, least privilege, delegated authority, approval workflows, or audit trail; agents act with excessive authority.',
    stages: ['Scope', 'RFP'],
    mitigations: [
      'Require identity and policy design as Scope gate exit criterion before any production deployment',
      'Gate production activation on completed agent authority and approval matrix',
    ],
  },
  {
    id: 'FM-AGENT-002',
    label: 'Agent loop cost multiplier not modelled',
    description:
      'Evaluation ignores that agent loops multiply model, tool, runtime, memory, and telemetry costs; production cost is materially higher than prototype estimate.',
    stages: ['RFP', 'BAFO'],
    mitigations: [
      'Require cost model including agent loop depth, tool calls, memory ops, and telemetry before BAFO',
      'Set cost-cap and monitoring alerting as contract deliverables',
    ],
  },
];

// ─── PAT-SRC-CAT-FINOPS-001 · FinOps and Cloud Cost Management ───────────────

const FINOPS_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-FINOPS-001',
    label: 'Guaranteed savings claim vs buyer baseline and attribution reality',
    severity: 'high',
    partyA: 'Vendor guaranteed savings claim',
    partyB: 'Buyer baseline, owner workflow, and attribution evidence',
    detectionHint:
      'Vendor claims guaranteed savings but buyer has no validated baseline, owner accountability workflow, engineering action capacity, or savings attribution methodology to substantiate the claim.',
    resolutionPath:
      'Require vendor to demonstrate savings attribution methodology on buyer billing data; define owner accountability and engineering action workflow before award.',
  },
  {
    id: 'CON-FINOPS-002',
    label: 'Native tools insufficient claim vs buyer complexity comparison',
    severity: 'medium',
    partyA: 'Vendor native-tools-insufficient claim',
    partyB: 'Buyer-complexity comparison against cloud-native capabilities',
    detectionHint:
      'Vendor claims native cloud tools are insufficient but a structured comparison against AWS, Azure, or Google native FinOps capabilities for buyer\'s actual multi-account and multi-team complexity reveals capability overlap.',
    resolutionPath:
      'Conduct structured comparison of native and third-party capabilities against buyer requirements before shortlist.',
  },
  {
    id: 'CON-FINOPS-003',
    label: 'Safe automation claim vs commitment forecast and rollback evidence',
    severity: 'high',
    partyA: 'Vendor automation safety claim',
    partyB: 'Forecast stability, approval, and rollback evidence',
    detectionHint:
      'Vendor claims automation is safe but forecast stability, approval workflow, rollback procedures, and workload eligibility criteria for commitment purchasing and workload shifting are not demonstrated.',
    resolutionPath:
      'Require approval workflow, rollback procedure, workload eligibility criteria, and scenario forecast test before enabling any automation for commitments.',
  },
];

const FINOPS_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-FINOPS-001',
    label: 'Dashboards purchased without cost ownership',
    description:
      'FinOps tool delivers spend visibility but teams do not trust allocation logic and do not own remediation actions; dashboards accumulate without accountability.',
    stages: ['Scope', 'RFP'],
    mitigations: [
      'Require owner accountability and showback workflow design as Scope exit criterion',
      'Gate tool deployment on business unit allocation mapping sign-off',
    ],
  },
  {
    id: 'FM-FINOPS-002',
    label: 'Commitment overreach from automation without stability analysis',
    description:
      'Automation purchases commitments or shifts workloads without workload stability analysis, demand forecast, or rollback governance; over-commitment creates budget exposure.',
    stages: ['BAFO', 'Contracting'],
    mitigations: [
      'Set approval thresholds, utilisation bands, and scenario forecasts before enabling commitment automation',
      'Require rollback capability and owner accountability for all automated recommendations',
    ],
  },
];

// ─── Exported LifecyclePatternSeed array ──────────────────────────────────────

export const CAT_LIFECYCLE_PATTERNS: LifecyclePatternSeed[] = [
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-CDW-001',
    id: 'PAT-SRC-CAT-CDW-001',
    slug: 'cloud-data-warehouse-sourcing',
    title: 'Cloud Data Warehouse Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'Cloud data warehouse sourcing should compare workload economics, governance posture, ecosystem fit, and operational control separately.',
    applicability: 'Apply when evaluating Snowflake, BigQuery, Amazon Redshift, Databricks SQL, or adjacent warehouse and lakehouse SQL platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['SOC-2-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CDP-001', 'PAT-SRC-CAT-LAKE-001', 'PAT-SRC-CAT-BI-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'Cloud data warehouse sourcing should compare workload economics, governance posture, ecosystem fit, and operational control separately. Apply when evaluating Snowflake, BigQuery, Amazon Redshift, Databricks SQL, or adjacent warehouse and lakehouse SQL platforms. Common failure modes include selecting a platform from benchmark slides without workload replay and ignoring cloud commitment and marketplace economics.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: CDW_CONTRADICTIONS,
    failureModes: CDW_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-CDP-001', 'PAT-SRC-CAT-BI-001'],
    typicalDurationDays: { min: 60, max: 180 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-CDP-001',
    id: 'PAT-SRC-CAT-CDP-001',
    slug: 'customer-data-platform-sourcing',
    title: 'Customer Data Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'CDP sourcing should score architecture fit, identity quality, activation coverage, governance, and pricing transparency.',
    applicability: 'Apply when evaluating CDPs for unified customer profiles, audience activation, consent management, and identity resolution.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['GDPR', 'CCPA'],
    relatedPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-CRM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'CDP sourcing should score architecture fit, identity quality, activation coverage, governance, and pricing transparency. Apply when evaluating CDPs for unified customer profiles, audience activation, consent management, and identity resolution. Key failure modes include purchasing activation capability before identity and consent models are ready, and comparing public starter plans without enterprise volume reality.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: CDP_CONTRADICTIONS,
    failureModes: CDP_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-CDW-001'],
    typicalDurationDays: { min: 60, max: 150 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-LAKE-001',
    id: 'PAT-SRC-CAT-LAKE-001',
    slug: 'lakehouse-data-lake-platform-sourcing',
    title: 'Lakehouse and Data Lake Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'Lakehouse sourcing must separate open-format claims from actual catalog portability, governance enforcement, and workload economics.',
    applicability: 'Apply when evaluating Delta Lake, Apache Iceberg, Hudi, or managed lakehouse platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['SOC-2-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-ETL-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'Lakehouse sourcing must separate open-format claims from actual catalog portability, governance enforcement, and workload economics. Apply when evaluating Delta Lake, Apache Iceberg, Hudi, or managed lakehouse platforms. Failure modes include treating object storage openness as full platform portability and comparing compute rates without governance, storage, and operations cost.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: LAKE_CONTRADICTIONS,
    failureModes: LAKE_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-ETL-001'],
    typicalDurationDays: { min: 60, max: 180 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-ERP-001',
    id: 'PAT-SRC-CAT-ERP-001',
    slug: 'cloud-erp-financial-systems-sourcing',
    title: 'Cloud ERP and Financial Systems Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'ERP sourcing fails when it treats a finance platform as a configuration project without proving the control model, data model, and implementation plan.',
    applicability: 'Apply when sourcing or renewing cloud ERP, financial management, or core accounting systems.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['SOX-if-applicable', 'GDPR'],
    relatedPatternIds: ['PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-HCM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'ERP sourcing fails when it treats a finance platform as a configuration project without proving the control model, data model, and implementation plan. Apply when sourcing or renewing cloud ERP, financial management, or core accounting systems. Failure modes include selecting without control-model proof and under-scoping SI effort at award.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: ERP_CONTRADICTIONS,
    failureModes: ERP_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-HCM-001'],
    typicalDurationDays: { min: 90, max: 270 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-CRM-001',
    id: 'PAT-SRC-CAT-CRM-001',
    slug: 'enterprise-crm-platform-sourcing-playbook',
    title: 'Enterprise CRM Platform Sourcing Playbook',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'Enterprise CRM sourcing fails when it treats CRM as a sales-seat subscription instead of a customer operating layer.',
    applicability: 'Apply when sourcing or renewing enterprise CRM platforms for sales force automation, forecasting, and customer data integration.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['GDPR'],
    relatedPatternIds: ['PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-CDP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'Enterprise CRM sourcing fails when it treats CRM as a sales-seat subscription instead of a customer operating layer. Apply when sourcing or renewing enterprise CRM platforms for sales force automation, forecasting, and customer data integration. Failure modes include deferring data model discovery until post-award and optimising subscription price while ignoring AI, storage, and renewal levers.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: CRM_CONTRADICTIONS,
    failureModes: CRM_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-CDP-001'],
    typicalDurationDays: { min: 60, max: 180 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-HCM-001',
    id: 'PAT-SRC-CAT-HCM-001',
    slug: 'hcm-platform-sourcing',
    title: 'Human Capital Management Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'HCM sourcing must treat the event as a workforce system-of-record decision, not an HR software purchase; payroll, compliance, AI governance, and integration must be proven before award.',
    applicability: 'Apply when sourcing or renewing HCM, HRIS, payroll, or talent management platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['GDPR', 'employment-law-if-applicable'],
    relatedPatternIds: ['PAT-SRC-CAT-ERP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'HCM sourcing must treat the event as a workforce system-of-record decision, not an HR software purchase; payroll, compliance, AI governance, and integration must be proven before award. Apply when sourcing or renewing HCM, HRIS, payroll, or talent management platforms. Failure modes include treating payroll as just another module and excluding payroll, IT, finance, legal, and works council from the sourcing event.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: HCM_CONTRADICTIONS,
    failureModes: HCM_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-ERP-001'],
    typicalDurationDays: { min: 90, max: 270 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-IAM-001',
    id: 'PAT-SRC-CAT-IAM-001',
    slug: 'workforce-iam-sourcing',
    title: 'Workforce IAM Sourcing for SSO, MFA, Lifecycle, and Conditional Access',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'IAM sourcing must prove assurance-level coverage, full app inventory, and deprovisioning reliability — not just SSO headline per-user price.',
    applicability: 'Apply when sourcing or renewing workforce IAM, SSO, MFA, identity lifecycle, or conditional access platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.83,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['SOC-2-review', 'ISO-27001-if-required'],
    relatedPatternIds: ['PAT-SRC-CAT-IGA-001', 'PAT-SRC-CAT-PAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'IAM sourcing must prove assurance-level coverage, full app inventory, and deprovisioning reliability — not just SSO headline per-user price. Apply when sourcing or renewing workforce IAM, SSO, MFA, identity lifecycle, or conditional access platforms. Failure modes include selecting on headline per-user price while long-tail apps remain manual, and confusing MFA adoption with phishing-resistant authentication.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: IAM_CONTRADICTIONS,
    failureModes: IAM_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-IGA-001', 'PAT-SRC-CAT-PAM-001'],
    typicalDurationDays: { min: 60, max: 150 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-ITSM-001',
    id: 'PAT-SRC-CAT-ITSM-001',
    slug: 'itsm-platform-sourcing',
    title: 'IT Service Management Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'ITSM sourcing is an operating-model and workflow-platform decision — process depth, CMDB maturity, AI support, and migration burden must be proven together.',
    applicability: 'Apply when sourcing or renewing ITSM, help-desk, CMDB, or service management platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['ISO-27001-if-required'],
    relatedPatternIds: ['PAT-SRC-CAT-ERP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'ITSM sourcing is an operating-model and workflow-platform decision — process depth, CMDB maturity, AI support, and migration burden must be proven together. Apply when sourcing or renewing ITSM, help-desk, CMDB, or service management platforms. Failure modes include purchasing the service desk tool while deferring operating-model design, and under-estimating migration scope.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: ITSM_CONTRADICTIONS,
    failureModes: ITSM_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-ERP-001'],
    typicalDurationDays: { min: 60, max: 180 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-BI-001',
    id: 'PAT-SRC-CAT-BI-001',
    slug: 'governed-bi-platform-sourcing',
    title: 'Governed Business Intelligence Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'BI sourcing should shift competition from dashboard aesthetics to governed metrics, adoption economics, semantic control, and downstream compute exposure.',
    applicability: 'Apply when sourcing or renewing BI and analytics platforms for governed reporting, self-service analytics, or embedded analytics.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-FAB-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'BI sourcing should shift competition from dashboard aesthetics to governed metrics, adoption economics, semantic control, and downstream compute exposure. Apply when sourcing or renewing BI and analytics platforms for governed reporting, self-service analytics, or embedded analytics. Failure modes include replacing dashboard sprawl with a new dashboard factory and purchasing AI analytics before metric definitions are agreed.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: BI_CONTRADICTIONS,
    failureModes: BI_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-FAB-001'],
    typicalDurationDays: { min: 60, max: 150 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-LLM-001',
    id: 'PAT-SRC-CAT-LLM-001',
    slug: 'enterprise-llm-model-access-sourcing',
    title: 'Enterprise LLM and Generative AI Model Access Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'LLM sourcing must prove data boundaries, cost variability, and model-quality evidence — not accept public benchmarks as procurement proof.',
    applicability: 'Apply when procuring access to LLM APIs, foundation models, managed AI services, or generative AI platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['GDPR', 'AI-Act-if-applicable'],
    relatedPatternIds: ['PAT-SRC-CAT-AGENT-001', 'PAT-SRC-CAT-FAB-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'LLM sourcing must prove data boundaries, cost variability, and model-quality evidence — not accept public benchmarks as procurement proof. Apply when procuring access to LLM APIs, foundation models, managed AI services, or generative AI platforms. Failure modes include approving AI experimentation without cost, data, and fallback controls, and locking in a single provider path without multi-provider leverage.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: LLM_CONTRADICTIONS,
    failureModes: LLM_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-AGENT-001', 'PAT-SRC-CAT-FAB-001'],
    typicalDurationDays: { min: 30, max: 90 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-AGENT-001',
    id: 'PAT-SRC-CAT-AGENT-001',
    slug: 'enterprise-ai-agent-platform-sourcing',
    title: 'Enterprise AI Agent Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'AI agent sourcing must prove identity, policy, evaluation, and cost discipline — not extend a demo to production authority.',
    applicability: 'Apply when evaluating AI agent frameworks, orchestration platforms, or multi-agent infrastructure for enterprise production deployment.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: ['AI-Act-if-applicable', 'GDPR'],
    relatedPatternIds: ['PAT-SRC-CAT-LLM-001', 'PAT-SRC-CAT-MLOPS-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'AI agent sourcing must prove identity, policy, evaluation, and cost discipline — not extend a demo to production authority. Apply when evaluating AI agent frameworks, orchestration platforms, or multi-agent infrastructure for enterprise production deployment. Failure modes include promoting a successful demo to production authority without identity and policy design, and failing to model agent loop cost multipliers.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: AGENT_CONTRADICTIONS,
    failureModes: AGENT_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-LLM-001', 'PAT-SRC-CAT-MLOPS-001'],
    typicalDurationDays: { min: 45, max: 120 },
  },
  {
    kind: 'lifecycle',
    patternId: 'PAT-SRC-CAT-FINOPS-001',
    id: 'PAT-SRC-CAT-FINOPS-001',
    slug: 'finops-cloud-cost-management-sourcing',
    title: 'FinOps and Cloud Cost Management Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'FinOps tooling delivers value only when paired with cost ownership workflows, reliable allocation, and safe automation governance.',
    applicability: 'Apply when evaluating FinOps platforms, cloud cost management tools, or chargeback/showback solutions.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-CSP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'FinOps tooling delivers value only when paired with cost ownership workflows, reliable allocation, and safe automation governance. Apply when evaluating FinOps platforms, cloud cost management tools, or chargeback/showback solutions. Failure modes include purchasing dashboards without cost ownership accountability and enabling commitment automation without workload stability analysis.',
    stages: CAT_STAGES,
    gateCriteria: CAT_GATE_CRITERIA,
    expectedArtifacts: [],
    contradictionTemplates: FINOPS_CONTRADICTIONS,
    failureModes: FINOPS_FAILURE_MODES,
    coAppliesWithPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-CSP-001'],
    typicalDurationDays: { min: 45, max: 120 },
  },
];
