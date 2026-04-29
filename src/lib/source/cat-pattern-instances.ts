// src/lib/source/cat-pattern-instances.ts
//
// Fixture SourceEventInstance records for 12 PAT-SRC-CAT category lifecycle patterns.
//
// Each instance is an Apex Retail demo event bound to one of the 12 category
// patterns added in PAT-SRC-CAT-* PRs #811-#826 and #830.
//
// Evidence maps are tuned to share ≥2 non-stop-words with each pattern's
// contradiction templates and failure modes — the threshold the keyword-matching
// detectors use to fire. These fixtures back the template-coverage audit at
// /admin/reasoning/coverage and provide demo paths through the category-pattern
// lifecycle, which were previously dark.
//
// Display rendering is unchanged — this is additive only.

import type { SourceEventInstance } from './source-event-instance';

// ── PAT-SRC-CAT-CDW-001 · Cloud Data Warehouse ────────────────────────────────
// Apex Retail is evaluating Snowflake vs BigQuery vs Redshift for its next-gen
// analytics warehouse. Vendor benchmark comparisons vs buyer workload reality
// are the central tension. Currently at BAFO stage.

export const APEX_CDW_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-cdw-eval-2026',
  displayId: 'DEMO-SRC-CDW-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Analytics Warehouse Platform Evaluation 2026',

  patternId: 'PAT-SRC-CAT-CDW-001',
  patternVersion: '1.0',

  currentStage: 'BAFO',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-01-10', exitedAt: '2026-02-04', advancedBy: 'priya.mehta' },
    { stageId: 'MarketScan', enteredAt: '2026-02-05', exitedAt: '2026-03-12', advancedBy: 'marcus.chen' },
    { stageId: 'RFP', enteredAt: '2026-03-15', exitedAt: '2026-04-15', advancedBy: 'fiona.wallace' },
    { stageId: 'BAFO', enteredAt: '2026-04-18', advancedBy: 'priya.mehta' },
  ],

  vendors: [
    {
      id: 'snowflake-inc',
      name: 'Snowflake',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP', 'BAFO'],
      riskFlags: [
        {
          id: 'RF-SNF-001',
          severity: 'high',
          label: 'Credit consumption model opaque for variable BI workloads',
          detail: 'Serverless credit consumption rates for concurrent BI dashboard loads not modeled against buyer workload traces.',
          status: 'open',
        },
      ],
      differentiators: ['Multi-cloud data sharing', 'Separation of storage and compute', 'Marketplace ecosystem'],
      pricingBand: 'high',
    },
    {
      id: 'google-bigquery',
      name: 'Google BigQuery',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP', 'BAFO'],
      riskFlags: [],
      differentiators: ['On-demand bytes-scanned pricing', 'Native GCP IAM integration', 'Capacity slot reservations'],
      pricingBand: 'medium',
    },
  ],

  responses: [
    {
      id: 'RESP-CDW-SNF',
      vendorId: 'snowflake-inc',
      stageId: 'RFP',
      receivedAt: '2026-04-07',
      status: 'under-review',
      claims: [
        'Lowest-cost warehouse for Apex Retail analytics workload — benchmark shows 40% below alternatives',
        'Serverless is simpler and cheaper for variable BI workloads',
        'Governance is built in with column-level security and data masking',
      ],
    },
    {
      id: 'RESP-CDW-BQ',
      vendorId: 'google-bigquery',
      stageId: 'RFP',
      receivedAt: '2026-04-08',
      status: 'under-review',
      claims: [
        'On-demand bytes-scanned model gives budget predictability',
        'Slot reservations available for steady-state workloads',
        'Native Data Catalog governance with column-level controls',
      ],
    },
  ],

  artifacts: [
    {
      id: 'ART-CDW-SCOPE-01',
      label: 'Workload Inventory and Scope Document',
      stageId: 'Scope',
      expectedArtifactId: 'GATE-CAT-SCOPE-01',
      status: 'locked',
      createdAt: '2026-01-28',
    },
    {
      id: 'ART-CDW-RFP-01',
      label: 'Scripted RFP with Workload Model',
      stageId: 'RFP',
      expectedArtifactId: 'GATE-CAT-RFP-01',
      status: 'locked',
      createdAt: '2026-03-18',
    },
  ],

  evidence: [
    // CON-CDW-001: lowest-cost claim vs workload replay
    {
      id: 'EV-CDW-001',
      kind: 'flag',
      field: 'vendor-benchmark-vs-workload-replay',
      value:
        'Snowflake benchmark claims lowest-cost warehouse but workload replay on buyer ELT, BI concurrency, storage growth, egress, and commitment model reveals total cost is comparable to BigQuery capacity model — headline benchmark does not reflect buyer workload shape.',
      source: 'Procurement cost model — workload replay Apr 2026',
      recordedAt: '2026-04-18',
      contradictionRef: 'CON-CDW-001',
    },
    // CON-CDW-002: serverless simplicity vs variable-cost behavior
    {
      id: 'EV-CDW-002',
      kind: 'measurement',
      field: 'serverless-variable-cost-behavior',
      value:
        'Snowflake serverless compute for variable BI dashboard refresh and ad hoc analyst queries produces budget-unpredictable credit consumption spikes — serverless cost behavior diverges from provisioned-warehouse baseline at peak concurrency.',
      source: 'PoC environment cost monitoring — Apr 2026',
      recordedAt: '2026-04-20',
      contradictionRef: 'CON-CDW-002',
    },
    // CON-CDW-003: governance built-in claim vs edition-gated controls
    {
      id: 'EV-CDW-003',
      kind: 'flag',
      field: 'governance-edition-gated-controls',
      value:
        'Row-level access policies and dynamic data masking governance controls require Business Critical edition or separate governance add-on SKU — governance is not built in to the standard Enterprise edition that vendor quoted.',
      source: 'Snowflake feature matrix review — Apr 2026',
      recordedAt: '2026-04-16',
      contradictionRef: 'CON-CDW-003',
    },
  ],

  linkedPrograms: [
    {
      programId: 'APX-CDP-2026',
      programName: 'Apex Retail CDP Activation',
      linkType: 'unblocks',
      description: 'Warehouse platform selection determines CDP data layer architecture and integration pattern',
      blockedAtStage: 'P3 Design',
    },
  ],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-CDW-001',
      kind: 'risk',
      description: 'Workload replay TCO diverges from vendor benchmark by 22% — normalized model required before BAFO close.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-20',
      status: 'open',
    },
  ],

  createdAt: '2026-01-10',
  lastModifiedAt: '2026-04-20',
  valueAtStakeUsd: 3800000,
};

// ── PAT-SRC-CAT-CDP-001 · Customer Data Platform ──────────────────────────────
// Apex Retail evaluating a CDP to unify loyalty, purchase, and digital profiles.
// Identity resolution quality and activation latency are the primary tensions.

export const APEX_CDP_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-cdp-eval-2026',
  displayId: 'DEMO-SRC-CDP-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Customer Data Platform Evaluation 2026',

  patternId: 'PAT-SRC-CAT-CDP-001',
  patternVersion: '1.0',

  currentStage: 'RFP',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-02-01', exitedAt: '2026-02-28', advancedBy: 'priya.mehta' },
    { stageId: 'MarketScan', enteredAt: '2026-03-01', exitedAt: '2026-03-28', advancedBy: 'fiona.wallace' },
    { stageId: 'RFP', enteredAt: '2026-04-01', advancedBy: 'marcus.chen' },
  ],

  vendors: [
    {
      id: 'segment-twilio',
      name: 'Twilio Segment',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [
        {
          id: 'RF-SEG-001',
          severity: 'high',
          label: 'Identity resolution merge rules not demonstrated on buyer data',
          detail: 'Unified profile demo used vendor sample data — buyer loyalty, POS, and digital event data not tested.',
          status: 'open',
        },
      ],
      differentiators: ['Large connector library', 'Real-time event streaming', 'Public pricing tiers'],
      pricingBand: 'medium',
    },
    {
      id: 'adobe-real-time-cdp',
      name: 'Adobe Real-Time CDP',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [],
      differentiators: ['Adobe Experience Cloud integration', 'Identity graph depth', 'Activation breadth'],
      pricingBand: 'high',
    },
  ],

  responses: [
    {
      id: 'RESP-CDP-SEG',
      vendorId: 'segment-twilio',
      stageId: 'RFP',
      receivedAt: '2026-04-22',
      status: 'under-review',
      claims: [
        'We create a single unified customer view from loyalty, POS, and digital touchpoints',
        'Activation is real time to all destinations with sub-second latency',
        'Pricing is scalable — starter plan grows with profile volume',
      ],
    },
  ],

  artifacts: [
    {
      id: 'ART-CDP-SCOPE-01',
      label: 'Identity and Consent Baseline Assessment',
      stageId: 'Scope',
      status: 'locked',
      createdAt: '2026-02-22',
    },
  ],

  evidence: [
    // CON-CDP-001: unified customer view claim vs identity proof
    {
      id: 'EV-CDP-001',
      kind: 'flag',
      field: 'unified-profile-identity-resolution-proof',
      value:
        'Segment demo describes a unified profile with deterministic and probabilistic merge but cannot demonstrate merge rules, survivorship logic, or consent behavior on buyer loyalty POS and digital event data — proof used vendor sample data only.',
      source: 'RFP scripted proof session — Apr 22 2026',
      recordedAt: '2026-04-22',
      contradictionRef: 'CON-CDP-001',
    },
    // CON-CDP-002: real-time activation claim vs measured latency
    {
      id: 'EV-CDP-002',
      kind: 'measurement',
      field: 'activation-real-time-latency-measurement',
      value:
        'Measured activation latency end-to-end to Google Ads and Meta destinations showed 8-minute p95 latency against vendor real-time activation claim — destination API limits and batch windows explain discrepancy not disclosed in demo.',
      source: 'PoC destination activation test — Apr 24 2026',
      recordedAt: '2026-04-24',
      contradictionRef: 'CON-CDP-002',
    },
    // CON-CDP-003: scalable pricing claim vs volume model
    {
      id: 'EV-CDP-003',
      kind: 'measurement',
      field: 'cdp-volume-model-overage-exposure',
      value:
        'Volume model built from Apex Retail loyalty events, POS transactions, and digital data shows enterprise tier pricing with destination sync overages and warehouse egress charges materially exceeds starter-plan public pricing — scalable pricing claim does not reflect buyer volume profile.',
      source: 'Procurement volume model — Apr 2026',
      recordedAt: '2026-04-25',
      contradictionRef: 'CON-CDP-003',
    },
  ],

  linkedPrograms: [
    {
      programId: 'APX-CDP-2026',
      programName: 'Apex Retail CDP Activation',
      linkType: 'depends-on',
      description: 'CDP vendor selection directly determines the APX-CDP-2026 program platform and architecture',
    },
  ],
  linkedSourceEvents: [
    {
      sourceEventId: 'apex-retail-cdw-eval-2026',
      sourceEventName: 'Analytics Warehouse Platform Evaluation 2026',
      linkType: 'depends-on',
      description: 'CDP warehouse connector design depends on warehouse platform selection',
    },
  ],

  sponsor: { id: 'fiona.wallace', name: 'Fiona Wallace', title: 'VP Customer Experience' },
  flags: [
    {
      id: 'GOV-CDP-001',
      kind: 'risk',
      description: 'Identity resolution and activation latency claims unverified on buyer data — proof sessions to be re-run with buyer data before shortlist.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-24',
      status: 'open',
    },
  ],

  createdAt: '2026-02-01',
  lastModifiedAt: '2026-04-25',
  valueAtStakeUsd: 2200000,
};

// ── PAT-SRC-CAT-LAKE-001 · Lakehouse Platform ─────────────────────────────────
// Apex Retail evaluating Databricks vs Apache Iceberg on AWS S3 for its
// data lake and ML feature store strategy. Open-format vs lock-in is the tension.

export const APEX_LAKE_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-lake-eval-2026',
  displayId: 'DEMO-SRC-LAKE-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Lakehouse Platform Evaluation 2026',

  patternId: 'PAT-SRC-CAT-LAKE-001',
  patternVersion: '1.0',

  currentStage: 'RFP',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-01-20', exitedAt: '2026-02-18', advancedBy: 'marcus.chen' },
    { stageId: 'MarketScan', enteredAt: '2026-02-19', exitedAt: '2026-03-28', advancedBy: 'marcus.chen' },
    { stageId: 'RFP', enteredAt: '2026-04-01', advancedBy: 'fiona.wallace' },
  ],

  vendors: [
    {
      id: 'databricks',
      name: 'Databricks',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [
        {
          id: 'RF-DBX-001',
          severity: 'high',
          label: 'Unity Catalog metadata export portability not demonstrated',
          detail: 'Catalog metadata, policies, and lineage tightly bound to Unity Catalog; cross-engine export not demonstrated.',
          status: 'open',
        },
      ],
      differentiators: ['Delta Lake format', 'MLflow integration', 'Unity Catalog governance'],
      pricingBand: 'high',
    },
    {
      id: 'aws-lake-formation',
      name: 'AWS Lake Formation with Iceberg',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [],
      differentiators: ['Open Iceberg format', 'Native S3 integration', 'Lake Formation governance'],
      pricingBand: 'medium',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-LAKE-SCOPE-01',
      label: 'Workload and Format Strategy Document',
      stageId: 'Scope',
      status: 'locked',
      createdAt: '2026-02-15',
    },
  ],

  evidence: [
    // CON-LAKE-001: open platform claim vs catalog lock-in
    {
      id: 'EV-LAKE-001',
      kind: 'flag',
      field: 'open-platform-catalog-portability-test',
      value:
        'Databricks claims the platform is open with Delta Lake open storage format but Unity Catalog metadata, policies, and lineage are tightly bound to Databricks control plane — metadata export and cross-engine policy portability not demonstrated in proof.',
      source: 'RFP proof session — Apr 8 2026',
      recordedAt: '2026-04-08',
      contradictionRef: 'CON-LAKE-001',
    },
    // CON-LAKE-002: lakehouse lowers cost claim vs distributed service cost
    {
      id: 'EV-LAKE-002',
      kind: 'measurement',
      field: 'lakehouse-distributed-service-cost-model',
      value:
        'Full workload bill of materials covering storage, compute, catalog, scan, orchestration, governance, support, and networking charges shows Databricks lakehouse TCO comparable to maintaining separate warehouse and lake — cost-reduction claim is workload-dependent and not substantiated for buyer profile.',
      source: 'Procurement cost replay model — Apr 15 2026',
      recordedAt: '2026-04-15',
      contradictionRef: 'CON-LAKE-002',
    },
    // CON-LAKE-003: unified governance claim vs cross-engine enforcement
    {
      id: 'EV-LAKE-003',
      kind: 'flag',
      field: 'unified-governance-cross-engine-enforcement',
      value:
        'Unified governance claim tested across Databricks SQL, Delta Sharing to BigQuery, and external Spark reader — row-level and column-level governance enforcement inconsistent across engines; audit log completeness varies by engine path.',
      source: 'Cross-engine governance proof test — Apr 10 2026',
      recordedAt: '2026-04-10',
      contradictionRef: 'CON-LAKE-003',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [
    {
      sourceEventId: 'apex-retail-cdw-eval-2026',
      sourceEventName: 'Analytics Warehouse Platform Evaluation 2026',
      linkType: 'depends-on',
      description: 'Lakehouse and warehouse platform selections must be architecturally coherent',
    },
  ],

  sponsor: { id: 'marcus.chen', name: 'Marcus Chen', title: 'VP Data and Analytics' },
  flags: [
    {
      id: 'GOV-LAKE-001',
      kind: 'risk',
      description: 'Catalog portability and cross-engine governance gaps detected — exit-simulation test required before shortlist.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-15',
      status: 'open',
    },
  ],

  createdAt: '2026-01-20',
  lastModifiedAt: '2026-04-15',
  valueAtStakeUsd: 2900000,
};

// ── PAT-SRC-CAT-ERP-001 · Cloud ERP ──────────────────────────────────────────
// Apex Retail evaluating Oracle Fusion vs SAP S/4HANA Cloud for its ERP
// modernisation. Control evidence and SI implementation scope are primary tensions.

export const APEX_ERP_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-erp-eval-2026',
  displayId: 'DEMO-SRC-ERP-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Cloud ERP Modernisation Evaluation 2026',

  patternId: 'PAT-SRC-CAT-ERP-001',
  patternVersion: '1.0',

  currentStage: 'RFP',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2025-11-01', exitedAt: '2025-12-15', advancedBy: 'priya.mehta' },
    { stageId: 'MarketScan', enteredAt: '2026-01-05', exitedAt: '2026-02-28', advancedBy: 'priya.mehta' },
    { stageId: 'RFP', enteredAt: '2026-03-10', advancedBy: 'fiona.wallace' },
  ],

  vendors: [
    {
      id: 'oracle-fusion',
      name: 'Oracle Fusion Cloud ERP',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [
        {
          id: 'RF-ORA-001',
          severity: 'critical',
          label: 'AI-assisted close outputs not verified against audit requirements',
          detail: 'Oracle AI close features demonstrated on generic datasets — buyer-specific audit trail and control evidence not produced.',
          status: 'open',
        },
      ],
      differentiators: ['Integrated AI close assistance', 'Cloud ERP depth', 'Pre-built retail industry content'],
      pricingBand: 'high',
    },
    {
      id: 'sap-s4hana-cloud',
      name: 'SAP S/4HANA Cloud',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [],
      differentiators: ['Best-practice process model', 'GROW with SAP for mid-market', 'Clean core philosophy'],
      pricingBand: 'high',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-ERP-SCOPE-01',
      label: 'Finance Control Requirements Document',
      stageId: 'Scope',
      status: 'locked',
      createdAt: '2025-12-10',
    },
  ],

  evidence: [
    // CON-ERP-001: single source of truth vs spreadsheet dependency
    {
      id: 'EV-ERP-001',
      kind: 'flag',
      field: 'erp-single-source-spreadsheet-dependency',
      value:
        'Oracle demo positions ERP as single source of truth for financial close but period-end reporting and board-pack preparation still depend on spreadsheet consolidation tools and data lake reconciliation in the vendor reference environment — spreadsheet dependency not eliminated.',
      source: 'Oracle reference site visit — Mar 22 2026',
      recordedAt: '2026-03-22',
      contradictionRef: 'CON-ERP-001',
    },
    // CON-ERP-003: AI-assisted close claim vs audit evidence
    {
      id: 'EV-ERP-002',
      kind: 'flag',
      field: 'ai-close-audit-evidence-requirement',
      value:
        'AI-assisted close demonstration showed automated journal suggestions but buyer auditor cannot confirm audit trail, control evidence, or reviewer documentation from AI outputs meet requirements — no buyer-specific evidence produced.',
      source: 'RFP proof session with external auditor — Apr 5 2026',
      recordedAt: '2026-04-05',
      contradictionRef: 'CON-ERP-003',
    },
    // CON-ERP-004: configuration-dominant claim vs migration complexity
    {
      id: 'EV-ERP-003',
      kind: 'flag',
      field: 'erp-implementation-migration-complexity',
      value:
        'Vendor-submitted implementation plan estimates 18 months heavily weighted to configuration — independent SI assessment identifies chart-of-accounts redesign, data cleansing for 8 years of legacy data, integration remediation across 14 systems, and control redesign as dominant effort drivers not reflected in vendor plan.',
      source: 'Independent SI assessment — Apr 18 2026',
      recordedAt: '2026-04-18',
      contradictionRef: 'CON-ERP-004',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-ERP-001',
      kind: 'blocker',
      description: 'SI effort independently assessed at 2.8x vendor estimate — CFO and auditor briefing required before RFP close.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-18',
      status: 'open',
    },
  ],

  createdAt: '2025-11-01',
  lastModifiedAt: '2026-04-18',
  valueAtStakeUsd: 14500000,
};

// ── PAT-SRC-CAT-CRM-001 · Enterprise CRM ─────────────────────────────────────
// Apex Retail CRM re-platform from legacy Siebel to Salesforce or Microsoft D365.
// AI productivity claims and data model migration are the primary tensions.

export const APEX_CRM_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-crm-eval-2026',
  displayId: 'DEMO-SRC-CRM-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Enterprise CRM Re-Platform Evaluation 2026',

  patternId: 'PAT-SRC-CAT-CRM-001',
  patternVersion: '1.0',

  currentStage: 'BAFO',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2025-12-01', exitedAt: '2026-01-08', advancedBy: 'fiona.wallace' },
    { stageId: 'MarketScan', enteredAt: '2026-01-10', exitedAt: '2026-02-15', advancedBy: 'marcus.chen' },
    { stageId: 'RFP', enteredAt: '2026-02-18', exitedAt: '2026-04-10', advancedBy: 'fiona.wallace' },
    { stageId: 'BAFO', enteredAt: '2026-04-14', advancedBy: 'priya.mehta' },
  ],

  vendors: [
    {
      id: 'salesforce-sales-cloud',
      name: 'Salesforce Sales Cloud',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP', 'BAFO'],
      riskFlags: [
        {
          id: 'RF-SFC-001',
          severity: 'high',
          label: 'AI seller productivity claims not measured on buyer data',
          detail: 'Einstein Copilot productivity demonstration used generic retail scenarios — no buyer-measured adoption metrics or usage-limit disclosure provided.',
          status: 'open',
        },
      ],
      differentiators: ['Large ecosystem', 'Retail industry cloud', 'Einstein AI built-in'],
      pricingBand: 'high',
    },
    {
      id: 'microsoft-d365-sales',
      name: 'Microsoft Dynamics 365 Sales',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP', 'BAFO'],
      riskFlags: [],
      differentiators: ['Microsoft 365 adjacency', 'Copilot for Sales', 'Power Platform integration'],
      pricingBand: 'medium',
    },
  ],

  responses: [
    {
      id: 'RESP-CRM-SFC',
      vendorId: 'salesforce-sales-cloud',
      stageId: 'BAFO',
      receivedAt: '2026-04-22',
      status: 'under-review',
      claims: [
        'Native AI will improve seller productivity by 30% based on retail industry benchmarks',
        'Implementation is straightforward — standard retail cloud configuration',
        'Suite consolidation lowers total cost across sales, service, and marketing',
      ],
    },
  ],

  artifacts: [
    {
      id: 'ART-CRM-RFP-01',
      label: 'Account Hierarchy Migration and ERP Integration Specification',
      stageId: 'RFP',
      status: 'approved',
      createdAt: '2026-03-20',
    },
  ],

  evidence: [
    // CON-CRM-001: AI seller productivity claim vs buyer-measured reality
    {
      id: 'EV-CRM-001',
      kind: 'flag',
      field: 'crm-ai-seller-productivity-claim-vs-measurement',
      value:
        'Salesforce claims native AI improves seller productivity 30% but buyer has no evidence of included AI feature inventory, data-use exhibit, opt-out controls, or buyer-measured pilot adoption metrics — productivity claim is industry benchmark not buyer evidence.',
      source: 'BAFO evaluation notes — Apr 22 2026',
      recordedAt: '2026-04-22',
      contradictionRef: 'CON-CRM-001',
    },
    // CON-CRM-002: straightforward implementation claim vs data model complexity
    {
      id: 'EV-CRM-002',
      kind: 'flag',
      field: 'crm-implementation-account-hierarchy-complexity',
      value:
        'Vendor claims implementation is straightforward standard configuration but account hierarchy migration from Siebel, duplicate-management rules for 2.4M accounts, ERP/CPQ integration plan, and sandbox deployment process reveal material implementation complexity not reflected in quoted timeline.',
      source: 'Implementation assessment — Mar 2026',
      recordedAt: '2026-03-28',
      contradictionRef: 'CON-CRM-002',
    },
    // CON-CRM-003: suite consolidation cost-reduction claim vs full TCO
    {
      id: 'EV-CRM-003',
      kind: 'measurement',
      field: 'crm-suite-consolidation-tco-model',
      value:
        'Suite consolidation cost model including unused seat cleanup, Einstein AI credits, storage/API growth, premium support tier, implementation partner cost, and renewal escalators shows five-year TCO 18% above current best-alternative — cost-reduction claim not substantiated.',
      source: 'Five-year TCO model — Apr 2026',
      recordedAt: '2026-04-20',
      contradictionRef: 'CON-CRM-003',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'fiona.wallace', name: 'Fiona Wallace', title: 'VP Sales' },
  flags: [
    {
      id: 'GOV-CRM-001',
      kind: 'risk',
      description: 'AI productivity claims unverified; five-year TCO shows cost increase vs current state — CPO briefing before BAFO close.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-22',
      status: 'open',
    },
  ],

  createdAt: '2025-12-01',
  lastModifiedAt: '2026-04-22',
  valueAtStakeUsd: 6200000,
};

// ── PAT-SRC-CAT-HCM-001 · Human Capital Management ───────────────────────────
// Apex Retail HCM transformation — evaluating Workday vs SAP SuccessFactors.
// Payroll accuracy and AI employment-law risk are the primary tensions.

export const APEX_HCM_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-hcm-eval-2026',
  displayId: 'DEMO-SRC-HCM-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'HCM Platform Transformation Evaluation 2026',

  patternId: 'PAT-SRC-CAT-HCM-001',
  patternVersion: '1.0',

  currentStage: 'RFP',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-01-15', exitedAt: '2026-02-20', advancedBy: 'priya.mehta' },
    { stageId: 'MarketScan', enteredAt: '2026-02-22', exitedAt: '2026-03-25', advancedBy: 'fiona.wallace' },
    { stageId: 'RFP', enteredAt: '2026-03-28', advancedBy: 'fiona.wallace' },
  ],

  vendors: [
    {
      id: 'workday-hcm',
      name: 'Workday HCM',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [
        {
          id: 'RF-WKD-001',
          severity: 'critical',
          label: 'Payroll parallel run criteria not defined',
          detail: 'Payroll parallel run exit criteria and retro pay scenarios not included in implementation plan.',
          status: 'open',
        },
      ],
      differentiators: ['Unified HCM and payroll', 'Skills cloud', 'Workday Extend platform'],
      pricingBand: 'high',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-HCM-SCOPE-01',
      label: 'Multi-Function Steering Committee Sign-Off Record',
      stageId: 'Scope',
      status: 'locked',
      createdAt: '2026-02-18',
    },
  ],

  evidence: [
    // CON-HCM-001: unified suite claim vs cross-module workflow
    {
      id: 'EV-HCM-001',
      kind: 'flag',
      field: 'hcm-unified-suite-cross-module-workflow',
      value:
        'Workday unified suite demo shows HR-to-payroll workflow but end-to-end test crossing core HR, payroll, time, security roles, reporting, and downstream finance integration revealed manual rekeying steps and integration gaps not disclosed in vendor-presented workflow.',
      source: 'Proof-of-concept cross-module test — Apr 4 2026',
      recordedAt: '2026-04-04',
      contradictionRef: 'CON-HCM-001',
    },
    // CON-HCM-002: standard implementation claim vs payroll and country complexity
    {
      id: 'EV-HCM-002',
      kind: 'flag',
      field: 'hcm-implementation-payroll-country-complexity',
      value:
        'Vendor claims standard implementation but independent payroll SI assessment identified country/pay-group rollout plan for 11 countries, 3 collective agreements, 8 union rules, and parallel payroll cycles as dominant effort drivers — implementation scope materially under-stated.',
      source: 'Independent payroll SI assessment — Apr 10 2026',
      recordedAt: '2026-04-10',
      contradictionRef: 'CON-HCM-002',
    },
    // CON-HCM-003: AI governance claim vs employment-law documentation
    {
      id: 'EV-HCM-003',
      kind: 'flag',
      field: 'hcm-ai-employment-law-governance-evidence',
      value:
        'Workday claims AI is governed but cannot produce intended-use documentation, explainability evidence, model/data controls, audit logs, or customer opt-out mechanisms for scheduling and performance-management AI features affecting employment decisions.',
      source: 'Legal and HR technology governance review — Apr 18 2026',
      recordedAt: '2026-04-18',
      contradictionRef: 'CON-HCM-003',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-HCM-001',
      kind: 'blocker',
      description: 'Payroll parallel run criteria undefined; AI employment-law governance documentation absent — legal and payroll escalation before RFP close.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-18',
      status: 'open',
    },
  ],

  createdAt: '2026-01-15',
  lastModifiedAt: '2026-04-18',
  valueAtStakeUsd: 8800000,
};

// ── PAT-SRC-CAT-IAM-001 · Workforce IAM ──────────────────────────────────────
// Apex Retail replacing Ping Identity with Okta or Microsoft Entra ID.
// MFA assurance levels and long-tail app coverage are the primary tensions.

export const APEX_IAM_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-iam-eval-2026',
  displayId: 'DEMO-SRC-IAM-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Workforce IAM Platform Re-Evaluation 2026',

  patternId: 'PAT-SRC-CAT-IAM-001',
  patternVersion: '1.0',

  currentStage: 'RFP',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-02-10', exitedAt: '2026-03-08', advancedBy: 'priya.mehta' },
    { stageId: 'MarketScan', enteredAt: '2026-03-10', exitedAt: '2026-04-02', advancedBy: 'marcus.chen' },
    { stageId: 'RFP', enteredAt: '2026-04-06', advancedBy: 'priya.mehta' },
  ],

  vendors: [
    {
      id: 'okta-workforce',
      name: 'Okta Workforce Identity',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [
        {
          id: 'RF-OKT-001',
          severity: 'critical',
          label: 'Phishing-resistant MFA not mapped for privileged accounts',
          detail: 'Okta FastPass offered as phishing-resistant MFA but FIDO2/hardware token path for privileged admin groups not demonstrated.',
          status: 'open',
        },
      ],
      differentiators: ['Large SSO connector catalog', 'Adaptive MFA policies', 'Lifecycle management depth'],
      pricingBand: 'medium',
    },
    {
      id: 'microsoft-entra',
      name: 'Microsoft Entra ID',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [],
      differentiators: ['Microsoft 365 bundled', 'Conditional Access policies', 'Passkey support'],
      pricingBand: 'low',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-IAM-SCOPE-01',
      label: 'App Inventory and Assurance Level Requirements',
      stageId: 'Scope',
      status: 'locked',
      createdAt: '2026-03-05',
    },
  ],

  evidence: [
    // CON-IAM-001: MFA solved claim vs assurance-level reality
    {
      id: 'EV-IAM-001',
      kind: 'flag',
      field: 'mfa-assurance-level-phishing-resistant-gap',
      value:
        'Vendor claims MFA is solved with Okta FastPass but buyer cannot confirm push, TOTP, SMS, passkeys, and hardware-backed phishing-resistant authentication are mapped to assurance levels — privileged admin group FIDO2 path and recovery workflow for locked hardware tokens not demonstrated.',
      source: 'IAM proof session — Apr 10 2026',
      recordedAt: '2026-04-10',
      contradictionRef: 'CON-IAM-001',
    },
    // CON-IAM-002: lifecycle automation claim vs app coverage
    {
      id: 'EV-IAM-002',
      kind: 'flag',
      field: 'iam-lifecycle-automation-app-inventory-gap',
      value:
        'Lifecycle automation claim tested against app inventory of 186 applications — SCIM connector available for 43 apps; 68 legacy, private-hosted, and contractor-portal apps require manual provisioning exception workflow; timed deprovisioning test failed for 3 critical business apps.',
      source: 'App inventory connector assessment — Apr 14 2026',
      recordedAt: '2026-04-14',
      contradictionRef: 'CON-IAM-002',
    },
    // CON-IAM-003: bundled identity free claim vs control coverage cost
    {
      id: 'EV-IAM-003',
      kind: 'measurement',
      field: 'bundled-identity-control-coverage-migration-cost',
      value:
        'Microsoft Entra bundled identity claim examined against required control coverage gaps — Privileged Identity Management, Entra ID Governance IGA features, and migration professional services add 64% to headline bundled licence cost for full control-requirement coverage.',
      source: 'Microsoft Entra cost model — Apr 18 2026',
      recordedAt: '2026-04-18',
      contradictionRef: 'CON-IAM-003',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-IAM-001',
      kind: 'risk',
      description: 'Phishing-resistant MFA assurance gap for privileged accounts; 68 apps require manual provisioning — app inventory completion required before shortlist.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-14',
      status: 'open',
    },
  ],

  createdAt: '2026-02-10',
  lastModifiedAt: '2026-04-18',
  valueAtStakeUsd: 1850000,
};

// ── PAT-SRC-CAT-ITSM-001 · IT Service Management ─────────────────────────────
// Apex Retail replacing ServiceNow with a consolidation evaluation across
// ServiceNow vs Jira Service Management. CMDB and AI deflection are the tensions.

export const APEX_ITSM_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-itsm-eval-2026',
  displayId: 'DEMO-SRC-ITSM-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'ITSM Platform Consolidation Evaluation 2026',

  patternId: 'PAT-SRC-CAT-ITSM-001',
  patternVersion: '1.0',

  currentStage: 'RFP',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-02-15', exitedAt: '2026-03-15', advancedBy: 'marcus.chen' },
    { stageId: 'MarketScan', enteredAt: '2026-03-18', exitedAt: '2026-04-10', advancedBy: 'marcus.chen' },
    { stageId: 'RFP', enteredAt: '2026-04-14', advancedBy: 'fiona.wallace' },
  ],

  vendors: [
    {
      id: 'servicenow',
      name: 'ServiceNow',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [
        {
          id: 'RF-SNW-001',
          severity: 'high',
          label: 'CMDB data quality baseline absent',
          detail: 'ServiceNow CMDB demo assumed clean configuration data — buyer lacks asset owners and reconciliation rules.',
          status: 'open',
        },
      ],
      differentiators: ['Enterprise ITSM depth', 'CMDB-driven automation', 'Now Assist AI'],
      pricingBand: 'high',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-ITSM-SCOPE-01',
      label: 'Service Operating Model Design Document',
      stageId: 'Scope',
      status: 'approved',
      createdAt: '2026-03-12',
    },
  ],

  evidence: [
    // CON-ITSM-001: AI ticket deflection claim vs baseline evidence
    {
      id: 'EV-ITSM-001',
      kind: 'flag',
      field: 'itsm-ai-ticket-deflection-claim-vs-baseline',
      value:
        'Vendor claims AI will deflect 35% of tickets but buyer has no current ticket baselines, in-scope intent topics, AI usage entitlements, escalation path design, human review process, or measured pilot criteria — deflection claim is based on industry benchmark not buyer-specific evidence.',
      source: 'RFP proof session — Apr 18 2026',
      recordedAt: '2026-04-18',
      contradictionRef: 'CON-ITSM-001',
    },
    // CON-ITSM-002: CMDB included claim vs data owner reality
    {
      id: 'EV-ITSM-002',
      kind: 'flag',
      field: 'cmdb-included-data-owner-maintenance-gap',
      value:
        'CMDB is included in platform but buyer lacks asset discovery scope definition, configuration item relationship model, data owners for each CI class, reconciliation rules, and ongoing maintenance process — CMDB will degrade rapidly post-deployment without these operational foundations.',
      source: 'CMDB readiness assessment — Apr 12 2026',
      recordedAt: '2026-04-12',
      contradictionRef: 'CON-ITSM-002',
    },
    // CON-ITSM-003: ITIL alignment claim vs buyer process fit
    {
      id: 'EV-ITSM-003',
      kind: 'flag',
      field: 'itsm-itil-alignment-buyer-process-gap',
      value:
        'Vendor ITIL alignment claim tested against buyer process requirements — buyer-specific process mapping and workflow evidence identifies 22 custom workflow requirements and non-standard approval routing that require configuration beyond ITIL template; administrator operating model not defined.',
      source: 'Process gap analysis — Apr 16 2026',
      recordedAt: '2026-04-16',
      contradictionRef: 'CON-ITSM-003',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'marcus.chen', name: 'Marcus Chen', title: 'VP IT Operations' },
  flags: [
    {
      id: 'GOV-ITSM-001',
      kind: 'risk',
      description: 'CMDB data quality baseline absent; AI deflection claim unsubstantiated — operating model design gate required before award.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-18',
      status: 'open',
    },
  ],

  createdAt: '2026-02-15',
  lastModifiedAt: '2026-04-18',
  valueAtStakeUsd: 2400000,
};

// ── PAT-SRC-CAT-BI-001 · Governed Business Intelligence ─────────────────────
// Apex Retail selecting a BI platform to replace Tableau with Power BI or Looker.
// Metric governance and compute cost are the primary tensions.

export const APEX_BI_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-bi-eval-2026',
  displayId: 'DEMO-SRC-BI-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Enterprise BI Platform Re-Platform Evaluation 2026',

  patternId: 'PAT-SRC-CAT-BI-001',
  patternVersion: '1.0',

  currentStage: 'RFP',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-02-01', exitedAt: '2026-03-01', advancedBy: 'marcus.chen' },
    { stageId: 'MarketScan', enteredAt: '2026-03-03', exitedAt: '2026-04-01', advancedBy: 'marcus.chen' },
    { stageId: 'RFP', enteredAt: '2026-04-05', advancedBy: 'fiona.wallace' },
  ],

  vendors: [
    {
      id: 'microsoft-power-bi',
      name: 'Microsoft Power BI / Fabric',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [],
      differentiators: ['Microsoft 365 bundled', 'Fabric compute integration', 'Copilot for BI'],
      pricingBand: 'low',
    },
    {
      id: 'looker-google',
      name: 'Google Looker',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [
        {
          id: 'RF-LKR-001',
          severity: 'medium',
          label: 'BigQuery compute triggered by Looker queries not modeled',
          detail: 'Looker dashboard-driven BigQuery query costs not included in per-seat licence comparison.',
          status: 'open',
        },
      ],
      differentiators: ['LookML semantic layer', 'BigQuery native integration', 'Governed metrics'],
      pricingBand: 'medium',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-BI-SCOPE-01',
      label: 'Metric Ownership Governance Model',
      stageId: 'Scope',
      status: 'locked',
      createdAt: '2026-02-25',
    },
  ],

  evidence: [
    // CON-BI-001: self-service analytics claim vs metric governance reality
    {
      id: 'EV-BI-001',
      kind: 'flag',
      field: 'bi-self-service-analytics-metric-governance-gap',
      value:
        'Vendor claims self-service analytics reduces analyst burden but current Apex Retail Tableau environment has 847 active dashboards for the same 120 business metrics — duplicate dashboards exist because semantic definitions, certified content workflow, and authoritative business definition ownership have not been established.',
      source: 'Tableau environment audit — Mar 2026',
      recordedAt: '2026-03-10',
      contradictionRef: 'CON-BI-001',
    },
    // CON-BI-002: AI answers business questions claim vs governance evidence
    {
      id: 'EV-BI-002',
      kind: 'flag',
      field: 'bi-ai-analytics-governed-metrics-hallucination',
      value:
        'Microsoft Copilot for BI tested on buyer sales data — AI produced revenue figure that diverged from certified finance source by 3.2% due to metric definition ambiguity; row-level access enforcement on AI-generated answer not demonstrated; hallucination controls and source traceability absent from response.',
      source: 'BI AI proof test — Apr 12 2026',
      recordedAt: '2026-04-12',
      contradictionRef: 'CON-BI-002',
    },
    // CON-BI-003: inexpensive licence claim vs compute cost model
    {
      id: 'EV-BI-003',
      kind: 'measurement',
      field: 'bi-licence-capacity-compute-cost-model',
      value:
        'Power BI Pro per-seat licence appears low but modelling Premium capacity, embedded analytics licences, Fabric compute for refresh and query, and unused-seat cleanup reveals five-year cost comparable to Looker enterprise — inexpensive licence claim does not hold at Apex Retail scale.',
      source: 'BI platform five-year cost model — Apr 2026',
      recordedAt: '2026-04-20',
      contradictionRef: 'CON-BI-003',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [
    {
      sourceEventId: 'apex-retail-cdw-eval-2026',
      sourceEventName: 'Analytics Warehouse Platform Evaluation 2026',
      linkType: 'depends-on',
      description: 'BI platform compute cost depends on underlying warehouse platform selection',
    },
  ],

  sponsor: { id: 'marcus.chen', name: 'Marcus Chen', title: 'VP Data and Analytics' },
  flags: [
    {
      id: 'GOV-BI-001',
      kind: 'risk',
      description: 'Metric governance model not established before platform selection — governance framework must precede platform RFP close.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-12',
      status: 'open',
    },
  ],

  createdAt: '2026-02-01',
  lastModifiedAt: '2026-04-20',
  valueAtStakeUsd: 1950000,
};

// ── PAT-SRC-CAT-LLM-001 · Enterprise LLM Access ──────────────────────────────
// Apex Retail procuring LLM API access for its AI program portfolio.
// Data boundary and variable cost are the primary tensions.

export const APEX_LLM_ACCESS_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-llm-access-2026',
  displayId: 'DEMO-SRC-LLM-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Enterprise LLM API Access Procurement 2026',

  patternId: 'PAT-SRC-CAT-LLM-001',
  patternVersion: '1.0',

  currentStage: 'BAFO',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-02-20', exitedAt: '2026-03-10', advancedBy: 'priya.mehta' },
    { stageId: 'MarketScan', enteredAt: '2026-03-12', exitedAt: '2026-04-01', advancedBy: 'marcus.chen' },
    { stageId: 'RFP', enteredAt: '2026-04-03', exitedAt: '2026-04-18', advancedBy: 'marcus.chen' },
    { stageId: 'BAFO', enteredAt: '2026-04-20', advancedBy: 'priya.mehta' },
  ],

  vendors: [
    {
      id: 'openai-azure',
      name: 'Azure OpenAI Service',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP', 'BAFO'],
      riskFlags: [
        {
          id: 'RF-AOI-001',
          severity: 'critical',
          label: 'Data residency and training use terms require legal review by deployment type',
          detail: 'Azure OpenAI, OpenAI API, and API via Azure differ on data residency, retention, logging, and training use.',
          status: 'open',
        },
      ],
      differentiators: ['Azure integration', 'Data residency options', 'GPT-4 and o1 access'],
      pricingBand: 'high',
    },
    {
      id: 'anthropic-api',
      name: 'Anthropic Claude API',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP', 'BAFO'],
      riskFlags: [],
      differentiators: ['Constitutional AI safety design', 'Long context window', 'Tool use / function calling'],
      pricingBand: 'high',
    },
  ],

  responses: [
    {
      id: 'RESP-LLM-AOI',
      vendorId: 'openai-azure',
      stageId: 'BAFO',
      receivedAt: '2026-04-24',
      status: 'under-review',
      claims: [
        'The same model is available through Azure OpenAI and OpenAI API — choose your preferred channel',
        'Customer data is protected — not used for training',
        'Workload costs are predictable at standard per-token rates',
      ],
    },
  ],

  artifacts: [
    {
      id: 'ART-LLM-SCOPE-01',
      label: 'AI Data Boundary and Deployment Type Policy',
      stageId: 'Scope',
      status: 'locked',
      createdAt: '2026-03-08',
    },
  ],

  evidence: [
    // CON-LLM-001: same model across channels claim vs terms divergence
    {
      id: 'EV-LLM-001',
      kind: 'flag',
      field: 'llm-channel-price-quota-terms-divergence',
      value:
        'Azure OpenAI and OpenAI API offer nominally the same model but legal review identifies divergence in data residency, processing location, retention, training use, abuse monitoring, support access, quota limits, regional availability, and pricing by channel — same-model claim obscures material terms divergence.',
      source: 'Legal and security channel comparison — Apr 22 2026',
      recordedAt: '2026-04-22',
      contradictionRef: 'CON-LLM-001',
    },
    // CON-LLM-002: data protected claim vs residency and retention reality
    {
      id: 'EV-LLM-002',
      kind: 'flag',
      field: 'llm-data-boundary-residency-retention-training-use',
      value:
        'Vendor claims customer data is protected and not used for training but legal review of Azure OpenAI, standard OpenAI API, fine-tuned model path, and abuse monitoring terms finds retention, training use, support access, and data residency obligations differ materially by deployment type and feature class.',
      source: 'Legal review of vendor DPA and terms — Apr 23 2026',
      recordedAt: '2026-04-23',
      contradictionRef: 'CON-LLM-002',
    },
    // CON-LLM-003: predictable cost claim vs agentic loop cost model
    {
      id: 'EV-LLM-003',
      kind: 'measurement',
      field: 'llm-agentic-loop-tool-call-variable-spend',
      value:
        'Standard per-token cost model underestimates agentic workload cost — modeling prompt tokens, completion tokens, retries, agent tool calls, cache misses, and observability API calls across planned Store Associate AI and CDP enrichment workloads reveals variable spend loop exposure 3.8x above simple token-rate estimate.',
      source: 'Agentic workload cost model — Apr 25 2026',
      recordedAt: '2026-04-25',
      contradictionRef: 'CON-LLM-003',
    },
  ],

  linkedPrograms: [
    {
      programId: 'APX-SAP-2026',
      programName: 'Store Associate Productivity AI',
      linkType: 'unblocks',
      description: 'LLM API contract is a prerequisite for APX-SAP-2026 P2 Synthesis model selection',
    },
  ],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-LLM-001',
      kind: 'blocker',
      description: 'Data boundary terms require legal sign-off by deployment type before BAFO; agentic cost model review required.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-25',
      status: 'open',
    },
  ],

  createdAt: '2026-02-20',
  lastModifiedAt: '2026-04-25',
  valueAtStakeUsd: 1200000,
};

// ── PAT-SRC-CAT-AGENT-001 · Enterprise AI Agent Platform ─────────────────────
// Apex Retail evaluating LangChain vs LlamaIndex vs Vertex AI Agent Builder for
// its agentic AI workloads. Identity, policy, and evaluation are primary tensions.

export const APEX_AGENT_PLATFORM_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-agent-platform-2026',
  displayId: 'DEMO-SRC-AGENT-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'AI Agent Platform Evaluation 2026',

  patternId: 'PAT-SRC-CAT-AGENT-001',
  patternVersion: '1.0',

  currentStage: 'RFP',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-03-01', exitedAt: '2026-03-28', advancedBy: 'marcus.chen' },
    { stageId: 'MarketScan', enteredAt: '2026-03-30', exitedAt: '2026-04-18', advancedBy: 'marcus.chen' },
    { stageId: 'RFP', enteredAt: '2026-04-21', advancedBy: 'priya.mehta' },
  ],

  vendors: [
    {
      id: 'vertex-ai-agents',
      name: 'Google Vertex AI Agent Builder',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [
        {
          id: 'RF-VAI-001',
          severity: 'critical',
          label: 'Agent identity and authority policy not demonstrated',
          detail: 'Agent demo showed successful task completion but delegated identity, least privilege, and human approval workflow for high-risk actions not designed or tested.',
          status: 'open',
        },
      ],
      differentiators: ['Managed agent runtime', 'Grounding with Search', 'No-code agent builder'],
      pricingBand: 'medium',
    },
    {
      id: 'langchain-open',
      name: 'LangChain / LangGraph (open source)',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [],
      differentiators: ['Framework flexibility', 'LangSmith tracing', 'Community ecosystem'],
      pricingBand: 'low',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-AGENT-SCOPE-01',
      label: 'Agent Identity and Authority Policy Framework',
      stageId: 'Scope',
      status: 'approved',
      createdAt: '2026-03-25',
    },
  ],

  evidence: [
    // CON-AGENT-001: production-ready agents claim vs identity and policy evidence
    {
      id: 'EV-AGENT-001',
      kind: 'flag',
      field: 'agent-production-ready-identity-policy-audit-trace',
      value:
        'Vertex AI agent demo showed successful production-ready task completion but identity design, policy enforcement, tool failure handling, trace export, human approval workflow for high-risk order modifications, rollback procedures, and cost caps not demonstrated — production authority without policy design is the primary risk.',
      source: 'Agent platform proof session — Apr 24 2026',
      recordedAt: '2026-04-24',
      contradictionRef: 'CON-AGENT-001',
    },
    // CON-AGENT-002: no-code business-user safety claim vs environment controls
    {
      id: 'EV-AGENT-002',
      kind: 'flag',
      field: 'agent-no-code-business-user-environment-separation',
      value:
        'Vendor claims no-code agent builder is safe for business users but environment separation between development and production agents, publishing approval workflow, tool allowlists, and audit trail are not enforced — business user agent could publish to production without security review.',
      source: 'No-code governance review — Apr 25 2026',
      recordedAt: '2026-04-25',
      contradictionRef: 'CON-AGENT-002',
    },
    // CON-AGENT-003: framework portability claim vs connector and telemetry lock-in
    {
      id: 'EV-AGENT-003',
      kind: 'flag',
      field: 'agent-framework-portability-memory-connector-telemetry',
      value:
        'Vertex AI Agent Builder claims framework portability prevents lock-in but memory schema, tool connector mappings, evaluation data, and production telemetry export are tightly bound to Vertex AI — migration to alternative would require memory schema redesign and connector re-mapping.',
      source: 'Portability assessment — Apr 26 2026',
      recordedAt: '2026-04-26',
      contradictionRef: 'CON-AGENT-003',
    },
  ],

  linkedPrograms: [
    {
      programId: 'APX-SAP-2026',
      programName: 'Store Associate Productivity AI',
      linkType: 'unblocks',
      description: 'Agent platform selection determines agentic architecture for Store Associate AI',
    },
  ],
  linkedSourceEvents: [
    {
      sourceEventId: 'apex-retail-llm-access-2026',
      sourceEventName: 'Enterprise LLM API Access Procurement 2026',
      linkType: 'depends-on',
      description: 'Agent platform depends on LLM API contract for model access',
    },
  ],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-AGENT-001',
      kind: 'blocker',
      description: 'Agent identity and authority policy not designed before RFP — required as gate criterion before any production deployment.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-26',
      status: 'open',
    },
  ],

  createdAt: '2026-03-01',
  lastModifiedAt: '2026-04-26',
  valueAtStakeUsd: 980000,
};

// ── PAT-SRC-CAT-FINOPS-001 · FinOps and Cloud Cost Management ────────────────
// Apex Retail selecting a FinOps platform to govern its $6M annual AWS spend.
// Savings attribution and commitment automation risk are the primary tensions.

export const APEX_FINOPS_EVAL_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-finops-eval-2026',
  displayId: 'DEMO-SRC-FINOPS-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'FinOps Platform Evaluation 2026',

  patternId: 'PAT-SRC-CAT-FINOPS-001',
  patternVersion: '1.0',

  currentStage: 'RFP',
  stageHistory: [
    { stageId: 'Scope', enteredAt: '2026-03-05', exitedAt: '2026-03-28', advancedBy: 'marcus.chen' },
    { stageId: 'MarketScan', enteredAt: '2026-03-30', exitedAt: '2026-04-20', advancedBy: 'marcus.chen' },
    { stageId: 'RFP', enteredAt: '2026-04-22', advancedBy: 'priya.mehta' },
  ],

  vendors: [
    {
      id: 'apptio-cloudability',
      name: 'Apptio Cloudability',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [
        {
          id: 'RF-CLD-001',
          severity: 'high',
          label: 'Savings attribution methodology not validated on buyer billing data',
          detail: 'Vendor savings claim based on industry benchmarks; attribution method not tested against buyer AWS billing data.',
          status: 'open',
        },
      ],
      differentiators: ['FOCUS billing data standard', 'Commitment management automation', 'Multi-cloud breadth'],
      pricingBand: 'medium',
    },
    {
      id: 'aws-cost-explorer',
      name: 'AWS Native Tools (Cost Explorer + Budgets)',
      status: 'shortlisted',
      invitedToStages: ['MarketScan', 'RFP'],
      riskFlags: [],
      differentiators: ['Zero incremental cost for AWS-native', 'Native reservation and savings plan visibility', 'Direct billing integration'],
      pricingBand: 'low',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-FINOPS-SCOPE-01',
      label: 'Cloud Cost Ownership and Showback Workflow Design',
      stageId: 'Scope',
      status: 'approved',
      createdAt: '2026-03-25',
    },
  ],

  evidence: [
    // CON-FINOPS-001: guaranteed savings claim vs attribution evidence
    {
      id: 'EV-FINOPS-001',
      kind: 'flag',
      field: 'finops-guaranteed-savings-attribution-methodology',
      value:
        'Vendor claims guaranteed savings of 15-20% of AWS spend but buyer has no validated cloud cost baseline, cost owner accountability workflow, engineering action capacity, or savings attribution methodology — guaranteed savings claim is industry benchmark without buyer-specific validation.',
      source: 'RFP evaluation — Apr 26 2026',
      recordedAt: '2026-04-26',
      contradictionRef: 'CON-FINOPS-001',
    },
    // CON-FINOPS-002: native tools insufficient claim vs buyer complexity
    {
      id: 'EV-FINOPS-002',
      kind: 'measurement',
      field: 'finops-native-tools-vs-buyer-complexity-comparison',
      value:
        'Structured comparison of AWS Cost Explorer, Budgets, and Cost and Usage Reports against buyer complexity — Apex Retail has 3 AWS accounts, 2 business units, and moderate multi-team complexity; native tools cover core allocation, chargeback, and reservation visibility requirements adequately at buyer scale.',
      source: 'Native vs third-party capability assessment — Apr 24 2026',
      recordedAt: '2026-04-24',
      contradictionRef: 'CON-FINOPS-002',
    },
    // CON-FINOPS-003: safe automation claim vs commitment overreach risk
    {
      id: 'EV-FINOPS-003',
      kind: 'flag',
      field: 'finops-automation-commitment-forecast-rollback-evidence',
      value:
        'Vendor claims commitment purchase automation is safe but forecast stability test on buyer workload pattern shows 31% demand variance over 90 days — automation purchasing commitments against variable workloads without approval workflow and rollback creates over-commitment budget exposure.',
      source: 'Automation safety assessment — Apr 25 2026',
      recordedAt: '2026-04-25',
      contradictionRef: 'CON-FINOPS-003',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [
    {
      sourceEventId: 'apex-retail-cdw-eval-2026',
      sourceEventName: 'Analytics Warehouse Platform Evaluation 2026',
      linkType: 'depends-on',
      description: 'FinOps platform must cover warehouse platform costs once selected',
    },
  ],

  sponsor: { id: 'marcus.chen', name: 'Marcus Chen', title: 'VP IT Operations' },
  flags: [
    {
      id: 'GOV-FINOPS-001',
      kind: 'risk',
      description: 'Savings attribution unvalidated; commitment automation safety not proven for buyer workload variance profile.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-26',
      status: 'open',
    },
  ],

  createdAt: '2026-03-05',
  lastModifiedAt: '2026-04-26',
  valueAtStakeUsd: 420000,
};

// ─────────────────────────────────────────────────────────────────────────────
// Aggregate export — all 12 CAT pattern fixture instances
// ─────────────────────────────────────────────────────────────────────────────

export const CAT_PATTERN_INSTANCES: SourceEventInstance[] = [
  APEX_CDW_EVAL_2026_INSTANCE,
  APEX_CDP_EVAL_2026_INSTANCE,
  APEX_LAKE_EVAL_2026_INSTANCE,
  APEX_ERP_EVAL_2026_INSTANCE,
  APEX_CRM_EVAL_2026_INSTANCE,
  APEX_HCM_EVAL_2026_INSTANCE,
  APEX_IAM_EVAL_2026_INSTANCE,
  APEX_ITSM_EVAL_2026_INSTANCE,
  APEX_BI_EVAL_2026_INSTANCE,
  APEX_LLM_ACCESS_2026_INSTANCE,
  APEX_AGENT_PLATFORM_2026_INSTANCE,
  APEX_FINOPS_EVAL_2026_INSTANCE,
];
