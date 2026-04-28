// PAT3 (Wave 30) · Vertical Pack — Retail
//
// AbarVa vertical pattern pack for retail technology sourcing.
// Covers AI-led retail programs, data platform sourcing for retail,
// vendor evaluation criteria specific to the retail sector, and
// the Sentinel risk signals most common in retail technology deals.
//
// This pack extends the generic pattern library with retail-specific:
//   - Evaluation criteria (retail data models, omnichannel requirements)
//   - Failure modes (vendor over-promises on AI retail use cases)
//   - Sentinel signals (holiday capacity risk, POS integration risk)
//   - BAFO readiness signals for retail technology contracts
//
// No model calls. No DB writes. No React hooks. No Date.now reads.
// Same input → identical output every time (deterministic seed).
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import type {
  PatternRegistryEntry,
  PatternEvidenceRequirement,
  PatternSentinelSignal,
} from '@/lib/solutions/pattern-registry-format';

// ---------------------------------------------------------------------------
// Retail-specific types
// ---------------------------------------------------------------------------

export type RetailPatternSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RetailPatternArea =
  | 'data-architecture'
  | 'ai-capabilities'
  | 'omnichannel'
  | 'supply-chain'
  | 'commercial-terms'
  | 'integration'
  | 'operations'
  | 'compliance';

export interface RetailEvaluationCriterion {
  id: string;
  area: RetailPatternArea;
  criterion: string;
  rationale: string;
  evidenceRequired: ReadonlyArray<string>;
  commonVendorWeakness: string;
  severity: RetailPatternSeverity;
  retailSpecific: true;
}

export interface RetailFailureMode {
  id: string;
  title: string;
  description: string;
  retailContext: string;
  frequencyNote: string;
  intervention: string;
  agentGuidance: string;
}

export interface RetailVerticalPattern {
  id: string;
  slug: string;
  name: string;
  retailSubsector: ReadonlyArray<string>;
  shortDescription: string;
  primaryQuestion: string;
  criteria: ReadonlyArray<RetailEvaluationCriterion>;
  failureModes: ReadonlyArray<RetailFailureMode>;
  bafoReadinessSignals: ReadonlyArray<string>;
  sentinelSignals: ReadonlyArray<string>;
  holidaySeasonConsiderations: ReadonlyArray<string>;
  relatedPatternSlugs: ReadonlyArray<string>;
  createdFrom: 'pat3_w30_vertical_pack_retail';
}

// ---------------------------------------------------------------------------
// Retail vertical patterns
// ---------------------------------------------------------------------------

export const RETAIL_VERTICAL_PATTERNS: ReadonlyArray<RetailVerticalPattern> = [
  // -------------------------------------------------------------------------
  // Pattern 1: Retail Data Platform Sourcing
  // -------------------------------------------------------------------------
  {
    id: 'rvp-001',
    slug: 'retail-data-platform-sourcing',
    name: 'Retail Data Platform Managed Services: Sourcing Criteria',
    retailSubsector: ['grocery', 'fashion', 'electronics', 'omni-channel', 'marketplace'],
    shortDescription:
      'Structured criteria for selecting a data platform managed services partner in retail, covering retail data models (customer, product, store, transaction), CDP integration, real-time analytics, and holiday-season capacity.',
    primaryQuestion:
      'Does this vendor understand retail data architecture well enough to manage our data platform and support AI-led retail programs?',
    criteria: [
      {
        id: 'rvp-001-c001',
        area: 'data-architecture',
        criterion: 'Retail data model depth',
        rationale:
          'A vendor that has not modelled retail entities (SKU, store, customer, basket, transaction) will struggle to build meaningful analytics. This is the single most differentiating capability in retail data platform work.',
        evidenceRequired: [
          'Reference architecture for a retail data model',
          'Case study from a comparable retail client',
          'Sample ER diagram or schema for retail domain entities',
        ],
        commonVendorWeakness:
          'Generic data modelling experience presented as retail expertise. Ask specifically for retail entity models.',
        severity: 'critical',
        retailSpecific: true,
      },
      {
        id: 'rvp-001-c002',
        area: 'omnichannel',
        criterion: 'Omnichannel data unification',
        rationale:
          'Retail clients operating across online, mobile, store, and marketplace channels need a vendor that can unify data across those channels without losing identity resolution quality.',
        evidenceRequired: [
          'Technical description of identity resolution methodology',
          'Reference from a multi-channel retail client',
        ],
        commonVendorWeakness:
          'Vendors claim "unified commerce" but use batch ETL only, with no real-time event stream from POS or e-commerce.',
        severity: 'high',
        retailSpecific: true,
      },
      {
        id: 'rvp-001-c003',
        area: 'ai-capabilities',
        criterion: 'AI-led personalisation and demand forecasting readiness',
        rationale:
          'Retail AI programs frequently rely on personalisation (product recommendations, offer targeting) and demand forecasting. The data platform must support these as first-class use cases.',
        evidenceRequired: [
          'Description of ML feature store or feature engineering capabilities',
          'Evidence of personalisation or demand forecasting deployment',
        ],
        commonVendorWeakness:
          'Vendor conflates "AI-ready platform" with batch model scoring; real-time inference pipelines are often absent.',
        severity: 'high',
        retailSpecific: true,
      },
      {
        id: 'rvp-001-c004',
        area: 'operations',
        criterion: 'Holiday season capacity and SLA commitment',
        rationale:
          'Retail data platforms experience peak load during holiday season (Black Friday, Christmas). Vendors must demonstrate they can sustain SLAs under 3–10× normal load.',
        evidenceRequired: [
          'SLA documentation with peak load commitments',
          'Incident history during holiday season at a comparable client',
          'Capacity planning process documentation',
        ],
        commonVendorWeakness:
          'SLAs defined for normal load only. Holiday capacity requires explicit contractual commitment.',
        severity: 'critical',
        retailSpecific: true,
      },
      {
        id: 'rvp-001-c005',
        area: 'integration',
        criterion: 'POS and e-commerce integration depth',
        rationale:
          'Retail data platforms must ingest data from POS systems (POSTEK, Oracle Retail, NCR), e-commerce platforms (Shopify, Salesforce Commerce Cloud, Adobe Commerce), and loyalty platforms.',
        evidenceRequired: [
          'List of POS and e-commerce connectors available out of the box',
          'Description of custom integration approach for non-standard sources',
        ],
        commonVendorWeakness:
          'Vendor lists connectors in marketing materials but has never actually built them; validate with reference calls.',
        severity: 'high',
        retailSpecific: true,
      },
      {
        id: 'rvp-001-c006',
        area: 'compliance',
        criterion: 'Retail consumer data compliance (GDPR/CCPA/local)',
        rationale:
          'Retail data includes consumer PII at scale (purchase history, loyalty profiles). The vendor must demonstrate compliant data handling, right-to-erasure workflows, and data residency controls.',
        evidenceRequired: [
          'Data Processing Agreement (DPA) or equivalent',
          'Right-to-erasure implementation reference',
          'Data residency attestation',
        ],
        commonVendorWeakness:
          'Compliance posture described at platform level only; erasure workflows are often custom-built per client.',
        severity: 'high',
        retailSpecific: true,
      },
    ],
    failureModes: [
      {
        id: 'rvp-001-fm001',
        title: 'AI Retail Pilot Doesn\'t Scale',
        description:
          'Vendor delivers a successful AI pilot (e.g., product recommendations) but cannot scale to full production due to data quality gaps, missing feature engineering, or real-time inference infrastructure.',
        retailContext:
          'Very common in fashion and grocery where AI pilots are run on curated datasets that don\'t reflect real production data quality.',
        frequencyNote: 'Observed in roughly 60% of retail AI programs that begin with a pilot.',
        intervention:
          'Pre-commit the vendor to a production-equivalent data volume test before signing the SOW.',
        agentGuidance:
          'Sentinel should flag any pilot that uses less than 12 months of production data or fewer than 10% of active SKUs.',
      },
      {
        id: 'rvp-001-fm002',
        title: 'Holiday Season SLA Breach',
        description:
          'Data platform degrades or fails during peak holiday season, causing downstream BI, personalisation, and inventory systems to receive stale or incomplete data.',
        retailContext:
          'Black Friday and Cyber Monday represent 20–40× normal ingestion volume for large retailers.',
        frequencyNote: 'SLA breach risk is high for vendors without explicit peak load commitments.',
        intervention:
          'Require a contractual peak load multiplier commitment (e.g., SLA holds at 10× normal volume) and a documented load test.',
        agentGuidance:
          'Nexus should surface peak load SLA as a mandatory gate item in the evidence checklist for retail data platform programs.',
      },
      {
        id: 'rvp-001-fm003',
        title: 'POS Integration Underestimated',
        description:
          'POS integration is consistently underestimated in scope and timeline. POS systems are heterogeneous, often run on-premise, and have non-standard data formats.',
        retailContext:
          'Retailers with legacy POS (10+ years old) often face 2–3× the integration effort compared to modern cloud-native POS.',
        frequencyNote: 'Seen in over 70% of retail data platform programs.',
        intervention:
          'Scope a POS integration discovery sprint before committing to a fixed timeline.',
        agentGuidance:
          'Atlas should flag any retail data platform program that has not completed a POS system inventory as a risk in the program readiness score.',
      },
    ],
    bafoReadinessSignals: [
      'Vendor has provided a detailed holiday season capacity plan with contractual SLA multiplier',
      'Vendor has demonstrated at least 3 comparable retail data platform references',
      'Vendor has completed a POS integration discovery for this client\'s POS estate',
      'Vendor\'s DPA is reviewed and approved by client legal/DPO',
      'Vendor has demonstrated production-equivalent load test results',
    ],
    sentinelSignals: [
      'Vendor cannot provide a retail-specific reference customer in the same subsector',
      'SLA does not address peak season load explicitly',
      'Vendor proposes batch-only ingestion from POS with no real-time event stream',
      'Identity resolution methodology relies on email matching only (misses ~30% of omnichannel journeys)',
      'AI pilot uses curated dataset — scope for production data quality test before BAFO',
    ],
    holidaySeasonConsiderations: [
      'Black Friday to Cyber Monday: 20–40× normal ingestion volume',
      'Christmas/New Year: 5–10× normal volume',
      'All SLA breaches during holiday season are high-severity program risks',
      'Ensure vendor has an on-call SRE commitment during peak dates',
      'Load test with production data volumes must complete at least 6 weeks before peak',
    ],
    relatedPatternSlugs: [
      'data-platform-vendor-selection-criteria',
      'vendor-evaluation-scorecard',
    ],
    createdFrom: 'pat3_w30_vertical_pack_retail',
  },

  // -------------------------------------------------------------------------
  // Pattern 2: Retail AI Program Failure Modes
  // -------------------------------------------------------------------------
  {
    id: 'rvp-002',
    slug: 'retail-ai-program-failure-modes',
    name: 'Retail AI Program Failure Modes',
    retailSubsector: ['grocery', 'fashion', 'electronics', 'quick-service-restaurant', 'department-store'],
    shortDescription:
      'Taxonomy of the most common failure modes in retail AI programs — personalisation, demand forecasting, computer vision, and pricing — with interventions, Sentinel signals, and program gate recommendations.',
    primaryQuestion:
      'What are the most likely failure modes for this retail AI program and what gates should prevent them?',
    criteria: [
      {
        id: 'rvp-002-c001',
        area: 'ai-capabilities',
        criterion: 'Model drift governance for seasonal retail patterns',
        rationale:
          'Retail AI models (demand forecasting, personalisation) trained on pre-COVID or pre-inflation data can degrade rapidly when consumer behaviour shifts. Active model monitoring is essential.',
        evidenceRequired: [
          'Model monitoring and drift detection framework documentation',
          'Reference to a retail AI model retraining process',
        ],
        commonVendorWeakness:
          'Drift detection is reactive (notified by client complaint) rather than proactive (automated drift alerts).',
        severity: 'high',
        retailSpecific: true,
      },
      {
        id: 'rvp-002-c002',
        area: 'data-architecture',
        criterion: 'Ground truth data availability for model evaluation',
        rationale:
          'Retail AI models require ground truth data (actual sales, actual customer outcomes) to evaluate model performance. Missing ground truth makes it impossible to measure model quality.',
        evidenceRequired: [
          'Description of ground truth data pipeline',
          'Sample model evaluation report showing actual vs. predicted',
        ],
        commonVendorWeakness:
          'Ground truth data is collected inconsistently or with significant lag, masking model degradation.',
        severity: 'critical',
        retailSpecific: true,
      },
    ],
    failureModes: [
      {
        id: 'rvp-002-fm001',
        title: 'Personalisation Model Freezes During Promotional Periods',
        description:
          'During promotional events (flash sales, loyalty events), personalisation models trained on normal purchase behaviour produce poor recommendations because promotional behaviour is out-of-distribution.',
        retailContext:
          'A fashion retailer running a 40% off sale will see purchase behaviour shift dramatically. Models trained on normal-price behaviour will recommend wrong products.',
        frequencyNote: 'Common in any retail AI program that has not explicitly modelled promotional periods.',
        intervention:
          'Implement a promotional-mode flag that either excludes promotional data from training or uses a separate promo-period model.',
        agentGuidance:
          'Sentinel should check whether the model training pipeline explicitly handles promotional periods before a personalisation program goes live.',
      },
      {
        id: 'rvp-002-fm002',
        title: 'Demand Forecast Fails on New SKU Launches',
        description:
          'Demand forecasting models cannot predict demand for new SKUs with no historical data. Cold-start failures lead to stock-out or overstock at launch.',
        retailContext:
          'Fashion and electronics retailers launch new SKUs constantly. A demand forecasting model that cannot handle cold-start is not production-ready for these clients.',
        frequencyNote: 'Very common — all demand forecasting models have a cold-start challenge.',
        intervention:
          'Require the vendor to demonstrate a cold-start strategy (transfer learning, assortment similarity, manual overrides).',
        agentGuidance:
          'Atlas should surface cold-start failure mode as a mandatory gate item in demand forecasting program checklists.',
      },
    ],
    bafoReadinessSignals: [
      'Model drift detection and alerting is automated and tested',
      'Cold-start strategy is documented and demonstrated in POC',
      'Ground truth data pipeline is in place with <48h latency',
      'Promotional period model handling is explicitly addressed',
      'Model performance metrics are defined and agreed pre-go-live',
    ],
    sentinelSignals: [
      'Model evaluation uses RMSE only — no business-metric-aligned evaluation (revenue impact, gross margin)',
      'No cold-start strategy documented for new SKU launches',
      'Drift detection is manual/reactive rather than automated',
      'Promotional period data excluded from training data without explicit justification',
      'Ground truth data latency >7 days makes real-time evaluation impossible',
    ],
    holidaySeasonConsiderations: [
      'Personalisation models should have promotional-period variants deployed before Black Friday',
      'Demand forecasting models require fresh training data through late October for holiday season accuracy',
      'Model retraining windows must not overlap with peak trading periods',
    ],
    relatedPatternSlugs: [
      'retail-data-platform-sourcing',
      'vendor-evaluation-scorecard',
    ],
    createdFrom: 'pat3_w30_vertical_pack_retail',
  },
];

// ---------------------------------------------------------------------------
// Pattern registry entries (PatternRegistryEntry format for manifest integration)
// ---------------------------------------------------------------------------

export const RETAIL_REGISTRY_ENTRIES: ReadonlyArray<PatternRegistryEntry> = [
  {
    patternId: 'rvp-001-retail-data-platform',
    slug: 'retail-data-platform-sourcing',
    name: 'Retail Data Platform Managed Services: Sourcing Criteria',
    shortDescription:
      'Sourcing criteria for retail data platform managed services, covering retail data models, omnichannel, holiday capacity, POS integration, and consumer data compliance.',
    primaryQuestion:
      'Does this vendor understand retail data architecture well enough to manage our data platform and support AI-led retail programs?',
    categories: ['sourcing', 'evaluation', 'governance', 'vertical'],
    domains: ['data-platform', 'retail-technology'],
    maturity: 'draft',
    primaryAgent: 'nexus',
    consumerAgents: ['nexus', 'sentinel', 'atlas', 'steward'],
    evidenceRequirements: [
      {
        evidenceId: 'er-retail-001',
        label: 'Retail Data Model Reference Architecture',
        description: 'Reference architecture or schema showing the vendor\'s retail domain entity model.',
        required: true,
        acceptedFormats: ['PDF document', 'ER diagram', 'schema export', 'written reference'],
        maxStaleDays: 365,
      },
      {
        evidenceId: 'er-retail-002',
        label: 'Holiday Season Capacity Plan',
        description: 'Documentation of the vendor\'s peak load capacity commitment and SLA multiplier.',
        required: true,
        acceptedFormats: ['contractual SLA addendum', 'load test report', 'capacity plan document'],
        maxStaleDays: 180,
      },
      {
        evidenceId: 'er-retail-003',
        label: 'Comparable Retail Client Reference',
        description: 'Reference from a comparable retail client (same subsector or similar scale).',
        required: true,
        acceptedFormats: ['written reference', 'reference call', 'case study'],
        maxStaleDays: 730,
      },
    ] as ReadonlyArray<PatternEvidenceRequirement>,
    sentinelSignals: [
      {
        signalId: 'ss-retail-001',
        label: 'No retail subsector reference',
        description: 'Vendor cannot provide a reference from a comparable retail subsector.',
        level: 'high',
        trigger: 'Vendor has no retail-specific reference customers in the same subsector as the client.',
        recommendedAction: 'Request at least one retail reference call before advancing to BAFO.',
        blocksProgression: true,
      },
      {
        signalId: 'ss-retail-002',
        label: 'SLA does not address peak season',
        description: 'The SLA document does not contain explicit peak season load commitments.',
        level: 'critical',
        trigger: 'SLA document reviewed and no peak load multiplier or holiday season clause found.',
        recommendedAction: 'Require a contractual peak season SLA addendum before BAFO.',
        blocksProgression: true,
      },
      {
        signalId: 'ss-retail-003',
        label: 'Batch-only POS ingestion',
        description: 'Vendor proposes batch-only ingestion from POS with no real-time event stream.',
        level: 'high',
        trigger: 'Technical architecture review reveals no real-time POS event stream in the proposed solution.',
        recommendedAction: 'Challenge the vendor to propose a real-time or near-real-time POS ingestion option.',
        blocksProgression: false,
      },
    ] as ReadonlyArray<PatternSentinelSignal>,
    relatedPatternSlugs: ['data-platform-vendor-selection-criteria', 'vendor-evaluation-scorecard'],
    authoredInWave: 'wave-30',
    createdFrom: 'pat3_w30_vertical_pack_retail',
  },
  {
    patternId: 'rvp-002-retail-ai-failure-modes',
    slug: 'retail-ai-program-failure-modes',
    name: 'Retail AI Program Failure Modes',
    shortDescription:
      'Failure mode taxonomy for retail AI programs covering personalisation, demand forecasting, and model drift with interventions and Sentinel signals.',
    primaryQuestion:
      'What are the most likely failure modes for this retail AI program and what gates should prevent them?',
    categories: ['failure-modes', 'runtime-mapping', 'vertical'],
    domains: ['retail-technology', 'enterprise-ai', 'data-platform'],
    maturity: 'draft',
    primaryAgent: 'sentinel',
    consumerAgents: ['nexus', 'sentinel', 'atlas'],
    evidenceRequirements: [
      {
        evidenceId: 'er-retail-fm-001',
        label: 'Model Monitoring Framework',
        description: 'Documentation of the vendor\'s AI model monitoring and drift detection approach.',
        required: true,
        acceptedFormats: ['technical document', 'architecture diagram', 'written description'],
        maxStaleDays: 365,
      },
    ] as ReadonlyArray<PatternEvidenceRequirement>,
    sentinelSignals: [
      {
        signalId: 'ss-retail-fm-001',
        label: 'Reactive drift detection only',
        description: 'Model drift detection is manual or reactive, not automated.',
        level: 'high',
        trigger: 'Vendor describes drift detection as responding to client complaints rather than automated monitoring.',
        recommendedAction: 'Require automated drift alerting as a contractual deliverable.',
        blocksProgression: false,
      },
      {
        signalId: 'ss-retail-fm-002',
        label: 'No cold-start strategy for new SKUs',
        description: 'Demand forecasting model has no documented cold-start strategy.',
        level: 'critical',
        trigger: 'Vendor does not have a documented cold-start strategy for new SKU demand forecasting.',
        recommendedAction: 'Block go-live until cold-start strategy is demonstrated in a POC.',
        blocksProgression: true,
      },
    ] as ReadonlyArray<PatternSentinelSignal>,
    relatedPatternSlugs: ['retail-data-platform-sourcing', 'vendor-evaluation-scorecard'],
    authoredInWave: 'wave-30',
    createdFrom: 'pat3_w30_vertical_pack_retail',
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return all retail vertical patterns. Pure.
 */
export function getRetailVerticalPatterns(): ReadonlyArray<RetailVerticalPattern> {
  return RETAIL_VERTICAL_PATTERNS;
}

/**
 * Return retail patterns filtered by subsector. Pure.
 */
export function getRetailPatternsBySubsector(
  subsector: string,
): ReadonlyArray<RetailVerticalPattern> {
  return RETAIL_VERTICAL_PATTERNS.filter((p) =>
    p.retailSubsector.includes(subsector),
  );
}

/**
 * Return the retail registry entries in PatternRegistryEntry format. Pure.
 */
export function getRetailRegistryEntries(): ReadonlyArray<PatternRegistryEntry> {
  return RETAIL_REGISTRY_ENTRIES;
}

/**
 * Return all Sentinel signals across all retail patterns. Pure.
 */
export function getAllRetailSentinelSignals(): ReadonlyArray<string> {
  return RETAIL_VERTICAL_PATTERNS.flatMap((p) => p.sentinelSignals);
}

/**
 * Return all critical criteria (severity: 'critical') across all retail patterns. Pure.
 */
export function getCriticalRetailCriteria(): ReadonlyArray<RetailEvaluationCriterion> {
  return RETAIL_VERTICAL_PATTERNS.flatMap((p) =>
    p.criteria.filter((c) => c.severity === 'critical'),
  );
}

/**
 * Return all BAFO readiness signals across all retail patterns. Pure.
 */
export function getAllRetailBafoSignals(): ReadonlyArray<string> {
  return RETAIL_VERTICAL_PATTERNS.flatMap((p) => p.bafoReadinessSignals);
}

/**
 * Summarize the retail vertical pack. Pure.
 */
export interface RetailVerticalPackSummary {
  totalPatterns: number;
  totalCriteria: number;
  totalFailureModes: number;
  totalSentinelSignals: number;
  totalBafoSignals: number;
  criticalCriteriaCount: number;
  subsectorsAdressed: ReadonlyArray<string>;
  deterministicSeed: true;
}

export function summarizeRetailVerticalPack(): RetailVerticalPackSummary {
  const allSubsectors = new Set<string>();
  let totalCriteria = 0;
  let totalFailureModes = 0;
  let totalSentinelSignals = 0;
  let totalBafoSignals = 0;
  let criticalCriteriaCount = 0;

  for (const p of RETAIL_VERTICAL_PATTERNS) {
    totalCriteria += p.criteria.length;
    totalFailureModes += p.failureModes.length;
    totalSentinelSignals += p.sentinelSignals.length;
    totalBafoSignals += p.bafoReadinessSignals.length;
    criticalCriteriaCount += p.criteria.filter((c) => c.severity === 'critical').length;
    for (const s of p.retailSubsector) allSubsectors.add(s);
  }

  return {
    totalPatterns: RETAIL_VERTICAL_PATTERNS.length,
    totalCriteria,
    totalFailureModes,
    totalSentinelSignals,
    totalBafoSignals,
    criticalCriteriaCount,
    subsectorsAdressed: [...allSubsectors].sort(),
    deterministicSeed: true,
  };
}
