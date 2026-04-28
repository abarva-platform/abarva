// SOL6 · Build / Buy / Partner Decision Framework.
//
// Pure deterministic library encoding the AbarVa point of view on how a
// tenant should reason about whether to BUILD a capability internally,
// BUY a packaged capability from a mature market, or PARTNER with a
// vendor / startup / system integrator. Programs, Atlas, Steward, and
// Nexus surfaces can subscribe to this framework to recommend, justify,
// and govern a build / buy / partner decision without inventing the
// criteria, the vendor-assessment factors, or the enterprise-readiness
// risks at runtime.
//
// This module is a *library*. It does NOT generate live architectures,
// invoke models, read tenant state, or call any external API. The
// evaluator is rule-based and deterministic over a typed input.
//
// No live runtime, no model-vendor invocation, no Date.now reads, no
// random IDs, no Supabase reads, no migrations, no UI changes.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type BuildBuyPartnerOption = 'build' | 'buy' | 'partner';

export const BUILD_BUY_PARTNER_CRITERIA = [
  'time_to_value',
  'strategic_differentiation',
  'data_rights_ip',
  'integration_complexity',
  'regulatory_risk',
  'enterprise_readiness',
  'total_cost_of_ownership',
  'vendor_lock_in',
  'model_governance',
  'talent_capacity',
  'workflow_fit',
  'scalability',
  'ecosystem_maturity',
  'change_management_burden',
] as const;
export type BuildBuyPartnerCriterion = typeof BUILD_BUY_PARTNER_CRITERIA[number];

export interface BuildBuyPartnerCriterionMetadata {
  key: BuildBuyPartnerCriterion;
  name: string;
  description: string;
  buildSignal: string;
  buySignal: string;
  partnerSignal: string;
  weight: 'high' | 'medium' | 'low';
}

export interface VendorStartupAssessmentFactor {
  key: string;
  name: string;
  category: 'capability' | 'commercial' | 'governance' | 'integration' | 'enterprise_readiness';
  description: string;
  redFlagSignals: readonly string[];
  greenFlagSignals: readonly string[];
}

export interface EnterpriseReadinessRisk {
  key: string;
  name: string;
  description: string;
  mitigations: readonly string[];
  severity: 'low' | 'medium' | 'high';
}

export interface BuildBuyPartnerScenarioInput {
  capabilityKey?: string;
  differentiation: 'high' | 'medium' | 'low';
  internalCapabilityPresent: boolean;
  timeToValuePressure: 'high' | 'medium' | 'low';
  marketCapabilityMaturity: 'mature' | 'emerging' | 'fragmented';
  regulatedContext: boolean;
  highRiskTags: readonly string[];
  dataRightsRequired: 'tenant_owned' | 'shared' | 'vendor_owned_acceptable';
  workflowComplexity: 'high' | 'medium' | 'low';
}

export type BuildBuyPartnerSignal =
  | { criterion: BuildBuyPartnerCriterion; favors: BuildBuyPartnerOption; rationale: string };

export interface BuildBuyPartnerRecommendation {
  recommendedOption: BuildBuyPartnerOption;
  confidence: 'low' | 'medium' | 'high';
  rationale: string;
  signals: readonly BuildBuyPartnerSignal[];
  governanceWarnings: readonly string[];
  vendorStartupChecks: readonly string[];
}

export interface BuildBuyPartnerEvaluationResult {
  input: BuildBuyPartnerScenarioInput;
  recommendation: BuildBuyPartnerRecommendation;
  createdFrom: 'deterministic_build_buy_partner_framework';
}

// ---------------------------------------------------------------------
// Criteria pack
// ---------------------------------------------------------------------

const CRITERIA_PACK: Record<BuildBuyPartnerCriterion, BuildBuyPartnerCriterionMetadata> = {
  time_to_value: {
    key: 'time_to_value',
    name: 'Time to value',
    description:
      'How quickly a usable, governed capability must reach production to satisfy the business pressure behind the request.',
    buildSignal:
      'Build only when time-to-value pressure is low and internal teams already carry the patterns required to deliver.',
    buySignal:
      'Buy when time-to-value pressure is high and the market capability is mature enough to deploy without invention.',
    partnerSignal:
      'Partner when time-to-value pressure is high but the market is fragmented and shared delivery accelerates first value.',
    weight: 'high',
  },
  strategic_differentiation: {
    key: 'strategic_differentiation',
    name: 'Strategic differentiation',
    description:
      'How much the capability defines competitive position rather than table-stakes parity.',
    buildSignal:
      'Build when the capability is core to differentiation and shipping it externally would erode strategic moat.',
    buySignal:
      'Buy when the capability is non-differentiating commodity and parity at lower cost is the target.',
    partnerSignal:
      'Partner when the capability sits adjacent to the moat and a co-developed asset preserves differentiation.',
    weight: 'high',
  },
  data_rights_ip: {
    key: 'data_rights_ip',
    name: 'Data rights and intellectual property',
    description:
      'Who owns the underlying data, the derived signals, and any artifacts the capability produces over time.',
    buildSignal:
      'Build when tenant-owned data rights and downstream IP retention are non-negotiable.',
    buySignal:
      'Buy when shared or vendor-owned data rights are acceptable and the contract preserves required exit rights.',
    partnerSignal:
      'Partner when data rights must be tenant-owned but the partner contributes domain models that justify shared IP terms.',
    weight: 'high',
  },
  integration_complexity: {
    key: 'integration_complexity',
    name: 'Integration complexity',
    description:
      'How many internal systems, identities, and event paths must be reconciled for the capability to operate end to end.',
    buildSignal:
      'Build when integration complexity is high and only internal teams hold the canonical contracts and access patterns.',
    buySignal:
      'Buy when integration complexity is low and the vendor publishes well-documented, supported connectors.',
    partnerSignal:
      'Partner when integration complexity is high and the partner brings reusable accelerators that internal teams cannot.',
    weight: 'medium',
  },
  regulatory_risk: {
    key: 'regulatory_risk',
    name: 'Regulatory risk',
    description:
      'How much regulated context (privacy, financial reporting, health, safety, cross-border) the capability touches.',
    buildSignal:
      'Build when regulatory exposure is severe and only internal control mappings can demonstrate compliance.',
    buySignal:
      'Buy when the vendor already carries the required certifications and audit posture in the relevant jurisdictions.',
    partnerSignal:
      'Partner when regulated context is high and the partner contributes accredited control frameworks tenant teams lack.',
    weight: 'high',
  },
  enterprise_readiness: {
    key: 'enterprise_readiness',
    name: 'Enterprise readiness',
    description:
      'How mature the candidate solution is across SSO, RBAC, audit logs, observability, support tiers, and incident response.',
    buildSignal:
      'Build when enterprise-readiness expectations exceed every available offering and parity is required at launch.',
    buySignal:
      'Buy when the offering is already enterprise-ready and procurement, security, and support pass without exceptions.',
    partnerSignal:
      'Partner when the offering is close to enterprise-ready and a joint hardening plan closes the documented gaps.',
    weight: 'high',
  },
  total_cost_of_ownership: {
    key: 'total_cost_of_ownership',
    name: 'Total cost of ownership',
    description:
      'The lifetime cost of the capability across licensing, infrastructure, operations, governance, and talent.',
    buildSignal:
      'Build when long-run usage volume makes per-seat or per-call licensing more expensive than internal operations.',
    buySignal:
      'Buy when packaged pricing remains lower than the loaded cost of building, operating, and refreshing the capability.',
    partnerSignal:
      'Partner when shared investment lowers lifetime cost relative to either solo build or pure license consumption.',
    weight: 'medium',
  },
  vendor_lock_in: {
    key: 'vendor_lock_in',
    name: 'Vendor lock-in',
    description:
      'How costly it is to migrate away from a chosen path if the vendor, partner, or internal owner becomes unavailable.',
    buildSignal:
      'Build when the capability sits on a critical path where any third-party single point of failure is unacceptable.',
    buySignal:
      'Buy when standardized formats, exportable data, and contractual exit rights keep migration cost bounded.',
    partnerSignal:
      'Partner when shared assets and joint ownership clauses leave the tenant with a usable position if the partner exits.',
    weight: 'medium',
  },
  model_governance: {
    key: 'model_governance',
    name: 'Model governance',
    description:
      'How much oversight, evaluation, and control is required across model selection, prompts, retrieval, and outputs.',
    buildSignal:
      'Build when bespoke evaluation harnesses and human-in-loop gates are mandatory and cannot be delegated.',
    buySignal:
      'Buy when packaged governance hooks (eval, redaction, audit, kill switch) match the tenant policy without rework.',
    partnerSignal:
      'Partner when a partner brings opinionated governance scaffolding the tenant has not yet built.',
    weight: 'high',
  },
  talent_capacity: {
    key: 'talent_capacity',
    name: 'Talent and capacity',
    description:
      'Whether internal engineering, product, governance, and change capacity exist to deliver and operate the capability.',
    buildSignal:
      'Build when internal capability is already present and the team has bandwidth to deliver and operate without backfill.',
    buySignal:
      'Buy when internal capacity is constrained and the offering ships with mature operations playbooks.',
    partnerSignal:
      'Partner when internal capacity is partial and the partner closes a specific, named skill or bandwidth gap.',
    weight: 'medium',
  },
  workflow_fit: {
    key: 'workflow_fit',
    name: 'Workflow fit',
    description:
      'How closely the capability must match an unusual, high-touch, or proprietary workflow rather than a generic one.',
    buildSignal:
      'Build when workflow complexity is high and packaged offerings would force the tenant to bend its operating model.',
    buySignal:
      'Buy when the workflow is generic and the offering already encodes the canonical pattern.',
    partnerSignal:
      'Partner when the workflow is moderately specialized and a co-developed configuration layer is the cheapest path.',
    weight: 'medium',
  },
  scalability: {
    key: 'scalability',
    name: 'Scalability',
    description:
      'Whether the capability must scale with tenant growth, peak events, or new geographies without re-platforming.',
    buildSignal:
      'Build when scale envelope and topology are tightly tied to internal infrastructure choices already in place.',
    buySignal:
      'Buy when the offering carries proven scale references at or beyond the projected envelope.',
    partnerSignal:
      'Partner when the partner brings scale references the tenant lacks and a joint path to internal autonomy exists.',
    weight: 'medium',
  },
  ecosystem_maturity: {
    key: 'ecosystem_maturity',
    name: 'Ecosystem maturity',
    description:
      'How mature, fragmented, or emerging the surrounding market and integration ecosystem is for the capability.',
    buildSignal:
      'Build when the ecosystem is too immature for any third party to meet the durability and trust bar.',
    buySignal:
      'Buy when the ecosystem is mature, multi-vendor, and standards-aligned so swap risk is bounded.',
    partnerSignal:
      'Partner when the ecosystem is fragmented and a partner can stitch best-of-breed pieces while the market settles.',
    weight: 'medium',
  },
  change_management_burden: {
    key: 'change_management_burden',
    name: 'Change-management burden',
    description:
      'How much organizational change, role redesign, and adoption work is implicit in the capability rollout.',
    buildSignal:
      'Build when change-management is best owned by the same team that designs the capability so feedback is tight.',
    buySignal:
      'Buy when the offering includes a packaged change program and the lift is mostly enablement rather than redesign.',
    partnerSignal:
      'Partner when change is heavy and the partner brings rollout playbooks and field experience the tenant lacks.',
    weight: 'low',
  },
};

const CRITERIA_LIST: readonly BuildBuyPartnerCriterionMetadata[] = BUILD_BUY_PARTNER_CRITERIA.map(
  (k) => CRITERIA_PACK[k],
);

// ---------------------------------------------------------------------
// Vendor / startup assessment factors
// ---------------------------------------------------------------------

const VENDOR_STARTUP_FACTORS: readonly VendorStartupAssessmentFactor[] = [
  {
    key: 'capability_depth',
    name: 'Capability depth and roadmap',
    category: 'capability',
    description:
      'Evidence that the offering already solves the named problem, with a credible roadmap that does not depend on the tenant funding core gaps.',
    redFlagSignals: [
      'Demoware that breaks under tenant data shapes',
      'Roadmap items required for parity have no committed delivery date',
      'Single named engineer carries the differentiating capability',
    ],
    greenFlagSignals: [
      'Reference deployments at peer scale and complexity',
      'Public changelog showing steady delivery against a published roadmap',
      'Independent third-party evaluation of capability claims',
    ],
  },
  {
    key: 'evaluation_evidence',
    name: 'Evaluation and benchmark evidence',
    category: 'capability',
    description:
      'Documented evaluation harnesses, regression tests, and benchmark posture that justify the quality claims made in sales materials.',
    redFlagSignals: [
      'Quality claims rest on unrepeatable demo screenshots',
      'No documented eval harness or regression suite',
      'Tenant-supplied evaluation data is refused or heavily restricted',
    ],
    greenFlagSignals: [
      'Documented eval methodology and reference datasets',
      'Tenant-runnable evaluation harness available pre-purchase',
      'Public regression posture across releases',
    ],
  },
  {
    key: 'commercial_durability',
    name: 'Commercial durability',
    category: 'commercial',
    description:
      'Funding posture, customer concentration, gross retention, and pricing stability that indicate the offering will still exist at the renewal horizon.',
    redFlagSignals: [
      'Runway under twelve months without disclosed plan',
      'Customer concentration above the prudent threshold for the segment',
      'Pricing changes more than once in the prior twelve months without notice',
    ],
    greenFlagSignals: [
      'Multi-year funding runway disclosed under NDA',
      'Diversified customer base across segments and geographies',
      'Stable, indexed pricing with notice clauses',
    ],
  },
  {
    key: 'contract_exit_rights',
    name: 'Contract terms and exit rights',
    category: 'commercial',
    description:
      'Standard contract posture covering data export, model export where applicable, pricing protection, SLAs, and termination assistance.',
    redFlagSignals: [
      'Data export blocked or behind a non-standard fee',
      'No documented termination assistance period',
      'SLA carries no service credit or remedy',
    ],
    greenFlagSignals: [
      'Standardized data export in open formats',
      'Termination-assistance period scaled to integration depth',
      'SLA with credits, remedies, and incident reporting commitments',
    ],
  },
  {
    key: 'governance_posture',
    name: 'Governance and audit posture',
    category: 'governance',
    description:
      'Documented controls, attestations, and audit trails covering security, privacy, model governance, and incident response.',
    redFlagSignals: [
      'No third-party security attestation',
      'No model governance policy or evaluation gating',
      'Incident history is undisclosed or marketing-curated',
    ],
    greenFlagSignals: [
      'Independent attestation aligned to the tenant risk profile',
      'Documented model governance and human-in-loop policy',
      'Transparent incident postmortem practice',
    ],
  },
  {
    key: 'data_handling',
    name: 'Data handling and residency',
    category: 'governance',
    description:
      'How tenant data is stored, segregated, retained, and deleted, including residency, sub-processor disclosure, and training-use posture.',
    redFlagSignals: [
      'Tenant data is used to train shared models without opt-out',
      'No residency control in the required jurisdictions',
      'Sub-processor list is undisclosed or stale',
    ],
    greenFlagSignals: [
      'Tenant data isolation with documented retention windows',
      'Residency control aligned to required jurisdictions',
      'Live sub-processor disclosure with change notice',
    ],
  },
  {
    key: 'integration_surface',
    name: 'Integration surface and APIs',
    category: 'integration',
    description:
      'Quality of APIs, webhooks, identity, and event integration surface, plus backwards-compatibility posture for breaking changes.',
    redFlagSignals: [
      'APIs are undocumented or version-pinned without deprecation policy',
      'No webhook or event surface for state changes',
      'Identity integration is custom for every tenant',
    ],
    greenFlagSignals: [
      'Documented API with versioning and deprecation policy',
      'Webhook or event surface for the integration paths the tenant needs',
      'Standards-aligned identity integration across the major providers',
    ],
  },
  {
    key: 'enterprise_support',
    name: 'Enterprise support and operations',
    category: 'enterprise_readiness',
    description:
      'Support tiering, named contacts, escalation paths, observability surface, and operational readiness for tenant-grade incidents.',
    redFlagSignals: [
      'No tiered support or named technical account contact',
      'Status page is absent, stale, or selectively updated',
      'No documented escalation matrix for severity-one incidents',
    ],
    greenFlagSignals: [
      'Tiered support with documented response targets',
      'Live status page with historical reliability record',
      'Named escalation matrix and joint runbook posture',
    ],
  },
  {
    key: 'enterprise_change_partnership',
    name: 'Change partnership and references',
    category: 'enterprise_readiness',
    description:
      'Whether the offering ships with enablement assets, change playbooks, and willing reference customers at the tenant maturity level.',
    redFlagSignals: [
      'No reference customers willing to discuss live operations',
      'Enablement assets are sales-deck level only',
      'No documented adoption or value realization framework',
    ],
    greenFlagSignals: [
      'Reference customers at peer maturity willing to discuss outcomes',
      'Packaged enablement assets covering rollout, training, and measurement',
      'Documented value realization framework with measurable outcomes',
    ],
  },
];

// ---------------------------------------------------------------------
// Enterprise readiness risks
// ---------------------------------------------------------------------

const ENTERPRISE_READINESS_RISKS: readonly EnterpriseReadinessRisk[] = [
  {
    key: 'identity_and_access',
    name: 'Identity and access integration risk',
    description:
      'The offering does not align cleanly with the tenant identity provider, group provisioning, or role mapping, forcing custom glue and weakening least-privilege posture.',
    mitigations: [
      'Require standards-aligned single sign-on prior to contract',
      'Map tenant roles to offering roles before pilot scope is approved',
      'Document a periodic access review cadence and owner',
    ],
    severity: 'high',
  },
  {
    key: 'data_residency_and_retention',
    name: 'Data residency and retention risk',
    description:
      'Tenant data flows to jurisdictions or retention windows that the regulatory profile does not allow, creating downstream exposure during audits or incidents.',
    mitigations: [
      'Pin residency to approved jurisdictions in the contract',
      'Set retention windows aligned to record-management policy',
      'Require sub-processor change notice with a defined objection window',
    ],
    severity: 'high',
  },
  {
    key: 'audit_and_observability',
    name: 'Audit logging and observability risk',
    description:
      'Audit logs and telemetry surface are insufficient to reconstruct material actions, forcing tenant teams to operate the capability without an evidence trail.',
    mitigations: [
      'Require immutable audit export to tenant log destinations',
      'Define mandatory event taxonomy for material state changes',
      'Verify log retention and search depth meet investigation requirements',
    ],
    severity: 'medium',
  },
  {
    key: 'model_governance_gap',
    name: 'Model governance gap risk',
    description:
      'Model selection, prompt scaffolding, retrieval grounding, and output gating are opaque, leaving the tenant unable to demonstrate human-in-loop discipline to regulators or executives.',
    mitigations: [
      'Require disclosure of model selection and update policy',
      'Require an evaluation harness that the tenant can run against tenant data',
      'Define human-in-loop checkpoints for every material action category',
    ],
    severity: 'high',
  },
  {
    key: 'support_and_escalation',
    name: 'Support tier and escalation risk',
    description:
      'Severity-one incidents land in a generic queue with no named contact, weak service credits, and no documented escalation path, leaving operations exposed during outages.',
    mitigations: [
      'Negotiate named technical account contact and joint runbook',
      'Require tiered SLA with credits and incident reporting commitments',
      'Document a tested escalation matrix to executive owners',
    ],
    severity: 'medium',
  },
  {
    key: 'roadmap_and_continuity',
    name: 'Roadmap and continuity risk',
    description:
      'The offering depends on a small number of contributors or unfunded roadmap items, raising the probability of stagnation, sunset, or acquisition that breaks the tenant deployment.',
    mitigations: [
      'Require quarterly roadmap alignment reviews with the tenant',
      'Require source code escrow or equivalent continuity arrangement',
      'Document an internal exit playbook before go-live',
    ],
    severity: 'medium',
  },
  {
    key: 'change_adoption_burden',
    name: 'Change and adoption burden risk',
    description:
      'Rollout assumes mature change capacity that the tenant does not have, leading to low adoption, anecdotal value, and an inability to justify renewal.',
    mitigations: [
      'Require a packaged enablement plan tied to measurable outcomes',
      'Set adoption thresholds before scope expansion is funded',
      'Tie value realization measurement to a value ledger owned by the tenant',
    ],
    severity: 'low',
  },
];

// ---------------------------------------------------------------------
// Helpers · listing
// ---------------------------------------------------------------------

export function listBuildBuyPartnerCriteria(): readonly BuildBuyPartnerCriterionMetadata[] {
  return CRITERIA_LIST;
}

export function listVendorStartupAssessmentFactors(): readonly VendorStartupAssessmentFactor[] {
  return VENDOR_STARTUP_FACTORS;
}

export function listEnterpriseReadinessRisks(): readonly EnterpriseReadinessRisk[] {
  return ENTERPRISE_READINESS_RISKS;
}

// ---------------------------------------------------------------------
// Deterministic evaluator
// ---------------------------------------------------------------------

function classifyOptionForCriterion(
  criterion: BuildBuyPartnerCriterion,
  input: BuildBuyPartnerScenarioInput,
): BuildBuyPartnerSignal {
  const meta = CRITERIA_PACK[criterion];
  switch (criterion) {
    case 'time_to_value': {
      if (input.timeToValuePressure === 'high' && input.marketCapabilityMaturity === 'mature') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      if (input.timeToValuePressure === 'high' && input.marketCapabilityMaturity === 'fragmented') {
        return { criterion, favors: 'partner', rationale: meta.partnerSignal };
      }
      if (input.timeToValuePressure === 'low') {
        return { criterion, favors: 'build', rationale: meta.buildSignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'strategic_differentiation': {
      if (input.differentiation === 'high') {
        return { criterion, favors: 'build', rationale: meta.buildSignal };
      }
      if (input.differentiation === 'low') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'data_rights_ip': {
      if (input.dataRightsRequired === 'tenant_owned') {
        return { criterion, favors: 'build', rationale: meta.buildSignal };
      }
      if (input.dataRightsRequired === 'vendor_owned_acceptable') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'integration_complexity': {
      if (input.workflowComplexity === 'high') {
        return { criterion, favors: 'partner', rationale: meta.partnerSignal };
      }
      if (input.workflowComplexity === 'low') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'regulatory_risk': {
      if (input.regulatedContext && input.highRiskTags.length > 0) {
        return { criterion, favors: 'build', rationale: meta.buildSignal };
      }
      if (input.regulatedContext) {
        return { criterion, favors: 'partner', rationale: meta.partnerSignal };
      }
      return { criterion, favors: 'buy', rationale: meta.buySignal };
    }
    case 'enterprise_readiness': {
      if (input.marketCapabilityMaturity === 'mature') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      if (input.marketCapabilityMaturity === 'emerging') {
        return { criterion, favors: 'partner', rationale: meta.partnerSignal };
      }
      return { criterion, favors: 'build', rationale: meta.buildSignal };
    }
    case 'total_cost_of_ownership': {
      if (input.marketCapabilityMaturity === 'mature' && input.differentiation !== 'high') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      if (input.differentiation === 'high' && input.internalCapabilityPresent) {
        return { criterion, favors: 'build', rationale: meta.buildSignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'vendor_lock_in': {
      if (input.dataRightsRequired === 'tenant_owned' && input.differentiation === 'high') {
        return { criterion, favors: 'build', rationale: meta.buildSignal };
      }
      if (input.marketCapabilityMaturity === 'mature') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'model_governance': {
      if (input.regulatedContext || input.highRiskTags.length > 0) {
        if (input.internalCapabilityPresent) {
          return { criterion, favors: 'build', rationale: meta.buildSignal };
        }
        return { criterion, favors: 'partner', rationale: meta.partnerSignal };
      }
      return { criterion, favors: 'buy', rationale: meta.buySignal };
    }
    case 'talent_capacity': {
      if (input.internalCapabilityPresent && input.differentiation === 'high') {
        return { criterion, favors: 'build', rationale: meta.buildSignal };
      }
      if (!input.internalCapabilityPresent && input.marketCapabilityMaturity === 'mature') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'workflow_fit': {
      if (input.workflowComplexity === 'high' && input.differentiation === 'high') {
        return { criterion, favors: 'build', rationale: meta.buildSignal };
      }
      if (input.workflowComplexity === 'low') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'scalability': {
      if (input.marketCapabilityMaturity === 'mature') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      if (input.internalCapabilityPresent && input.differentiation === 'high') {
        return { criterion, favors: 'build', rationale: meta.buildSignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'ecosystem_maturity': {
      if (input.marketCapabilityMaturity === 'mature') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      if (input.marketCapabilityMaturity === 'fragmented') {
        return { criterion, favors: 'partner', rationale: meta.partnerSignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
    case 'change_management_burden': {
      if (input.workflowComplexity === 'high' && !input.internalCapabilityPresent) {
        return { criterion, favors: 'partner', rationale: meta.partnerSignal };
      }
      if (input.workflowComplexity === 'low') {
        return { criterion, favors: 'buy', rationale: meta.buySignal };
      }
      return { criterion, favors: 'partner', rationale: meta.partnerSignal };
    }
  }
}

function decideTopLevelOption(
  input: BuildBuyPartnerScenarioInput,
): { option: BuildBuyPartnerOption; rationale: string } {
  if (input.differentiation === 'high' && input.internalCapabilityPresent) {
    return {
      option: 'build',
      rationale:
        'High differentiation combined with present internal capability favors building so the moat is preserved and feedback stays internal.',
    };
  }
  if (
    input.timeToValuePressure === 'high' &&
    input.marketCapabilityMaturity === 'mature' &&
    input.differentiation !== 'high'
  ) {
    return {
      option: 'buy',
      rationale:
        'High time-to-value pressure against a mature market with no differentiation lock-in favors buying a packaged offering.',
    };
  }
  if (input.marketCapabilityMaturity === 'fragmented' && input.differentiation !== 'low') {
    return {
      option: 'partner',
      rationale:
        'A fragmented market combined with non-trivial differentiation favors partnering so best-of-breed pieces can be stitched while the market settles.',
    };
  }
  if (input.marketCapabilityMaturity === 'emerging') {
    return {
      option: 'partner',
      rationale:
        'An emerging market without a clear top-level rule favors partnering to share invention risk and shape the offering around the tenant operating model.',
    };
  }
  return {
    option: 'partner',
    rationale:
      'No primary rule fired cleanly; the conservative default is to partner so the tenant retains optionality while signals firm up.',
  };
}

function classifyConfidence(
  signals: readonly BuildBuyPartnerSignal[],
  option: BuildBuyPartnerOption,
): 'low' | 'medium' | 'high' {
  let agree = 0;
  for (const s of signals) {
    if (s.favors === option) agree += 1;
  }
  if (agree >= 4) return 'high';
  if (agree >= 2) return 'medium';
  return 'low';
}

function buildGovernanceWarnings(input: BuildBuyPartnerScenarioInput): readonly string[] {
  const out: string[] = [];
  if (input.regulatedContext) {
    out.push(
      'Regulated context flagged on input. Require documented control mappings, audit log export, and human-in-loop checkpoints before pilot.',
    );
  }
  if (input.highRiskTags.length > 0) {
    const tags = [...input.highRiskTags].sort().join(', ');
    out.push(
      `High-risk data tags present (${tags}). Require tenant-side data minimization, residency pinning, and incident reporting commitments.`,
    );
  }
  if (input.dataRightsRequired === 'tenant_owned') {
    out.push(
      'Tenant-owned data rights requirement is non-negotiable. Reject any offering that reserves training rights without an opt-out clause.',
    );
  }
  return out;
}

function buildVendorStartupChecks(option: BuildBuyPartnerOption): readonly string[] {
  if (option === 'build') {
    return [];
  }
  return [
    'Run the capability-depth and evaluation-evidence checks before contract.',
    'Run the commercial-durability and contract-exit-rights checks before contract.',
    'Run the governance-posture and data-handling checks before tenant data flows.',
    'Run the integration-surface check against the tenant identity, event, and observability surface.',
    'Run the enterprise-support and change-partnership checks against documented severity-one and adoption scenarios.',
  ];
}

export function evaluateBuildBuyPartnerScenario(
  input: BuildBuyPartnerScenarioInput,
): BuildBuyPartnerEvaluationResult {
  const signals: BuildBuyPartnerSignal[] = BUILD_BUY_PARTNER_CRITERIA.map((c) =>
    classifyOptionForCriterion(c, input),
  );
  const decision = decideTopLevelOption(input);
  const confidence = classifyConfidence(signals, decision.option);
  const governanceWarnings = buildGovernanceWarnings(input);
  const vendorStartupChecks = buildVendorStartupChecks(decision.option);

  const recommendation: BuildBuyPartnerRecommendation = {
    recommendedOption: decision.option,
    confidence,
    rationale: decision.rationale,
    signals,
    governanceWarnings,
    vendorStartupChecks,
  };

  return {
    input,
    recommendation,
    createdFrom: 'deterministic_build_buy_partner_framework',
  };
}

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

export function summarizeBuildBuyPartnerRecommendation(
  result: BuildBuyPartnerEvaluationResult,
): string {
  const r = result.recommendation;
  const warnSegment =
    r.governanceWarnings.length > 0
      ? ` Governance warnings: ${r.governanceWarnings.length}.`
      : ' No governance warnings.';
  const checkSegment =
    r.vendorStartupChecks.length > 0
      ? ` Vendor / startup checks queued: ${r.vendorStartupChecks.length}.`
      : ' Vendor / startup checks not required.';
  return `Recommended option: ${r.recommendedOption} (confidence ${r.confidence}). ${r.rationale}${warnSegment}${checkSegment}`;
}
