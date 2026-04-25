// SOL6 · Build / Buy / Partner Decision Framework.
//
// Pure deterministic, rule-based decision framework that grades a
// capability scenario against twelve canonical criteria and returns
// a single recommended option (build, buy, or partner) with rationale,
// trade-offs, governance warnings, vendor / startup assessment factors,
// and enterprise readiness risks.
//
// This module is a *library*. It does NOT invoke models, read tenant
// state, fetch vendor catalogs, or score against live market data.
// Every output is a deterministic function of the input.
//
// No live runtime, no Claude / OpenAI / Pinecone invocation, no
// Date.now() reads, no random IDs, no Supabase reads, no migrations.
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

export type BuildBuyPartnerCriterion =
  | 'time_to_value'
  | 'strategic_differentiation'
  | 'data_rights_ip'
  | 'integration_complexity'
  | 'regulatory_risk'
  | 'enterprise_readiness'
  | 'total_cost_of_ownership'
  | 'vendor_lock_in'
  | 'model_governance'
  | 'talent_capacity'
  | 'workflow_fit'
  | 'scalability';

export interface BuildBuyPartnerCriterionDescriptor {
  key: BuildBuyPartnerCriterion;
  name: string;
  description: string;
  buildSignal: string;
  buySignal: string;
  partnerSignal: string;
}

export interface BuildBuyPartnerScenarioInput {
  scenarioName: string;
  capabilityName: string;
  differentiationLevel: 'low' | 'medium' | 'high';
  internalCapabilityMaturity: 'absent' | 'emerging' | 'established';
  marketCapabilityMaturity: 'nascent' | 'fragmented' | 'mature';
  timeToValueUrgency: 'low' | 'medium' | 'high';
  regulatedContext: boolean;
  criticalRiskTags: string[];
  constraints?: string[];
}

export interface VendorStartupAssessmentFactor {
  key: string;
  name: string;
  definition: string;
  assessmentQuestions: string[];
}

export interface EnterpriseReadinessRisk {
  key: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export interface BuildBuyPartnerRecommendation {
  scenarioName: string;
  recommendedOption: BuildBuyPartnerOption;
  confidence: 'low' | 'medium' | 'high';
  rationale: string[];
  tradeoffs: string[];
  governanceWarnings: string[];
  vendorStartupAssessmentFactors: VendorStartupAssessmentFactor[];
  enterpriseReadinessRisks: EnterpriseReadinessRisk[];
  createdFrom: 'deterministic_build_buy_partner_framework';
}

// ---------------------------------------------------------------------
// Canonical criteria (12)
// ---------------------------------------------------------------------

export const BUILD_BUY_PARTNER_CRITERIA: ReadonlyArray<BuildBuyPartnerCriterion> =
  Object.freeze([
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
  ] as const);

const DESCRIPTORS: Record<BuildBuyPartnerCriterion, BuildBuyPartnerCriterionDescriptor> = {
  time_to_value: {
    key: 'time_to_value',
    name: 'Time to value',
    description:
      'Elapsed time from kickoff to a defensible first realized outcome that the sponsor can grade against the value ledger.',
    buildSignal:
      'Favors build when the organization can absorb a longer ramp because the capability compounds inside the value ledger over multiple cycles.',
    buySignal:
      'Favors buy when the urgency to realize value is high and a market offering already covers the canonical workflow without heavy customization.',
    partnerSignal:
      'Favors partner when urgency is high but no single market offering covers the scenario end-to-end and a co-development arrangement closes the gap fastest.',
  },
  strategic_differentiation: {
    key: 'strategic_differentiation',
    name: 'Strategic differentiation',
    description:
      'Whether the capability is a source of competitive advantage that the organization wants to own end-to-end versus a commodity workflow.',
    buildSignal:
      'Favors build when the capability is a primary differentiator and outsourcing it would erode the moat that the strategy depends on.',
    buySignal:
      'Favors buy when the capability is a commodity workflow with no defensible differentiation and the sponsor accepts parity with the market.',
    partnerSignal:
      'Favors partner when the capability is differentiating but the organization lacks the depth to build alone and a co-development partner can extend reach without ceding the moat.',
  },
  data_rights_ip: {
    key: 'data_rights_ip',
    name: 'Data rights and intellectual property',
    description:
      'Who holds rights to the data, the trained models, the prompts, and the derived insights produced by the capability.',
    buildSignal:
      'Favors build when retaining full data and model rights is a strategic constraint and any third-party arrangement would compromise the rights posture.',
    buySignal:
      'Favors buy when standard vendor terms on data residency, derivative rights, and training opt-out meet the sponsor and counsel posture without negotiation.',
    partnerSignal:
      'Favors partner when bespoke data and model-rights terms are achievable through a co-development arrangement that neither pure build nor pure buy delivers.',
  },
  integration_complexity: {
    key: 'integration_complexity',
    name: 'Integration complexity',
    description:
      'Effort required to connect the capability to existing systems of record, identity, observability, and downstream consumers without creating fragility.',
    buildSignal:
      'Favors build when integration paths are deeply idiosyncratic and a market offering would still require the same integration scaffolding the team would build anyway.',
    buySignal:
      'Favors buy when the market offering ships hardened connectors for the system-of-record landscape the organization already runs.',
    partnerSignal:
      'Favors partner when integration requires joint engineering with a vendor or system integrator to bridge a non-standard landscape inside the agreed timeline.',
  },
  regulatory_risk: {
    key: 'regulatory_risk',
    name: 'Regulatory risk',
    description:
      'Exposure to sector regulators, regional data-protection regimes, sectoral compliance frameworks, and audit obligations triggered by the capability.',
    buildSignal:
      'Favors build when regulator interpretation requires direct organizational accountability that a third-party arrangement cannot satisfy.',
    buySignal:
      'Favors buy when an established market offering carries audited certifications already accepted by the relevant regulators and counsel.',
    partnerSignal:
      'Favors partner when regulator-accepted certification is achievable jointly faster than a pure-build path and a pure-buy path lacks the bespoke controls the regulator expects.',
  },
  enterprise_readiness: {
    key: 'enterprise_readiness',
    name: 'Enterprise readiness',
    description:
      'Whether the capability and any candidate vendor meet the organization-grade controls expected for identity, audit, change management, and operational support.',
    buildSignal:
      'Favors build when the organization has reusable platform building blocks for identity, audit, and change management that can be applied without bespoke vendor onboarding.',
    buySignal:
      'Favors buy when the candidate vendor demonstrates production references at comparable scale with the organization-grade controls already in place.',
    partnerSignal:
      'Favors partner when no market offering meets the organization-grade controls today but a co-development path is willing to harden them inside a defined runway.',
  },
  total_cost_of_ownership: {
    key: 'total_cost_of_ownership',
    name: 'Total cost of ownership',
    description:
      'Total cost across capital, run, support, change-management, and exit over the agreed planning horizon, expressed as relative weighting rather than fabricated figures.',
    buildSignal:
      'Favors build when run economics improve sharply with internal scale and the organization already carries the platform that absorbs the marginal cost.',
    buySignal:
      'Favors buy when subscription economics undercut the fully loaded internal run cost on the agreed horizon and exit terms are acceptable.',
    partnerSignal:
      'Favors partner when shared-investment economics distribute capital cost while preserving access to the realized capability over the planning horizon.',
  },
  vendor_lock_in: {
    key: 'vendor_lock_in',
    name: 'Vendor lock-in',
    description:
      'Risk of becoming dependent on a single vendor for pricing, roadmap, or platform direction without a defensible exit path.',
    buildSignal:
      'Favors build when lock-in to any single vendor is unacceptable to the sponsor and an internal platform preserves optionality.',
    buySignal:
      'Favors buy when the candidate offering uses portable formats, documented exit paths, and standards the organization can migrate from if needed.',
    partnerSignal:
      'Favors partner when contractual exit terms and joint intellectual-property terms reduce single-vendor lock-in without abandoning the time-to-value advantage.',
  },
  model_governance: {
    key: 'model_governance',
    name: 'Model governance',
    description:
      'Controls over model training, evaluation, drift monitoring, prompt provenance, and responsible-AI sign-off across the capability lifecycle.',
    buildSignal:
      'Favors build when the organization runs a mature model-governance practice and applying it directly is cleaner than auditing a third-party governance posture.',
    buySignal:
      'Favors buy when the candidate offering exposes evaluation, drift, and audit hooks that the existing model-governance practice can subscribe to without rebuilding.',
    partnerSignal:
      'Favors partner when joint governance is the only viable path because no market offering exposes the controls the responsible-AI posture requires today.',
  },
  talent_capacity: {
    key: 'talent_capacity',
    name: 'Talent capacity',
    description:
      'Availability of internal product, engineering, data, and responsible-AI talent to staff the build, the run, and the change management without unacceptable opportunity cost.',
    buildSignal:
      'Favors build when the organization has staffed engineering and product capacity that can absorb the workload without starving higher-priority initiatives.',
    buySignal:
      'Favors buy when internal capacity is constrained and a market offering reduces the staffing burden to vendor-management and integration only.',
    partnerSignal:
      'Favors partner when the build path is attractive but internal capacity is insufficient to staff it alone and a co-development arrangement supplies the missing skills.',
  },
  workflow_fit: {
    key: 'workflow_fit',
    name: 'Workflow fit',
    description:
      'Alignment between the capability and the organization-specific workflow, role topology, and change-management posture of the affected operating units.',
    buildSignal:
      'Favors build when the workflow is genuinely organization-specific and shaping the capability around it preserves adoption in ways a generic offering would not.',
    buySignal:
      'Favors buy when the candidate offering already mirrors the canonical workflow shape and adoption can land inside standard change management.',
    partnerSignal:
      'Favors partner when the workflow is organization-specific in places but standard elsewhere and a co-development arrangement can extend a market offering to fit.',
  },
  scalability: {
    key: 'scalability',
    name: 'Scalability',
    description:
      'Ability of the capability to scale across the portfolio of business units, regions, and use cases without proportional rework or cost step-functions.',
    buildSignal:
      'Favors build when the capability must scale across an idiosyncratic portfolio in ways no market offering anticipates and an internal platform amortizes the investment.',
    buySignal:
      'Favors buy when the candidate offering already scales to comparable portfolio breadth at organizations of comparable size and complexity.',
    partnerSignal:
      'Favors partner when scale is achievable jointly faster than a pure-build path and a pure-buy path lacks the deployment topology the portfolio demands.',
  },
};

export const BUILD_BUY_PARTNER_CRITERION_DESCRIPTORS: Readonly<
  Record<BuildBuyPartnerCriterion, BuildBuyPartnerCriterionDescriptor>
> = Object.freeze(DESCRIPTORS);

// ---------------------------------------------------------------------
// Vendor / startup assessment factors (>=6)
// ---------------------------------------------------------------------

const VENDOR_STARTUP_ASSESSMENT_FACTORS: ReadonlyArray<VendorStartupAssessmentFactor> = Object.freeze([
  {
    key: 'funding_stage',
    name: 'Funding stage and runway',
    definition:
      'Capital posture and remaining runway of the candidate provider relative to the organization\'s planning horizon for the capability.',
    assessmentQuestions: [
      'What is the most recent funding stage and how does the disclosed runway compare to the planning horizon?',
      'What is the contingency plan if the provider raises a down round or pauses fundraising during the engagement?',
      'Has the provider published a sustainability or path-to-profitability statement that survives sponsor scrutiny?',
    ],
  },
  {
    key: 'customer_references',
    name: 'Customer references at comparable scale',
    definition:
      'Reference customers operating at scale and complexity comparable to the organization, willing to be cited under named diligence.',
    assessmentQuestions: [
      'Which named reference customers operate the capability at scale and complexity comparable to the organization?',
      'What references are available specifically inside the same regulatory regime or sector as the sponsor?',
      'What reference dropouts or failed deployments has the provider disclosed inside the last twelve months?',
    ],
  },
  {
    key: 'data_security_posture',
    name: 'Data security posture',
    definition:
      'Independent attestations, residency posture, encryption posture, and breach history governing the data the provider would handle.',
    assessmentQuestions: [
      'Which independent attestations does the provider hold that are accepted by the sponsor and counsel without renegotiation?',
      'How does the provider segregate tenant data and demonstrate the segregation in audit?',
      'What disclosed incidents has the provider had inside the last twenty-four months and what remediation followed?',
    ],
  },
  {
    key: 'model_provenance',
    name: 'Model provenance and training-data posture',
    definition:
      'Disclosure of model lineage, training-data sources, retention posture, and opt-out controls that affect responsible-AI sign-off.',
    assessmentQuestions: [
      'Which model families does the provider rely on and what is the disclosed lineage and training-data posture?',
      'What training-data opt-out and retention controls are exposed to the organization as the customer?',
      'What evaluation, red-team, and drift-monitoring artifacts does the provider produce that the responsible-AI practice can subscribe to?',
    ],
  },
  {
    key: 'support_sla',
    name: 'Support service-level agreements',
    definition:
      'Commitments around response time, escalation paths, named technical contacts, and operational runbooks accepted by the organization.',
    assessmentQuestions: [
      'What response and resolution commitments apply to severity classes the organization will declare?',
      'Which named technical contacts are assigned and how are escalation paths documented?',
      'How does the provider participate in joint incident reviews and runbooks for the integrated capability?',
    ],
  },
  {
    key: 'roadmap_alignment',
    name: 'Roadmap alignment',
    definition:
      'Alignment between the provider\'s published roadmap and the organization\'s planning horizon for the capability, with disclosed influence channels.',
    assessmentQuestions: [
      'Which items on the provider\'s published roadmap align with the planning horizon and which do not?',
      'How does the organization influence prioritization beyond a generic feedback channel?',
      'What is the provider\'s posture on retiring features the organization depends on and what notice is contractually guaranteed?',
    ],
  },
  {
    key: 'integration_partner_ecosystem',
    name: 'Integration and partner ecosystem',
    definition:
      'Breadth and depth of certified integration partners, system integrators, and platform partners that reduce delivery risk.',
    assessmentQuestions: [
      'Which certified system-integration partners can staff the engagement at the required scale?',
      'How do the provider and the system integrator divide accountability inside a joint engagement?',
      'What gaps in the partner ecosystem would force the organization to staff or train internally?',
    ],
  },
]);

// ---------------------------------------------------------------------
// Enterprise readiness risks (>=4)
// ---------------------------------------------------------------------

const ENTERPRISE_READINESS_RISKS: ReadonlyArray<EnterpriseReadinessRisk> = Object.freeze([
  {
    key: 'phi_compliance_gap',
    name: 'Protected health information compliance gap',
    severity: 'high',
    description:
      'Capability touches protected health information or equivalently regulated data class without an attested control posture acceptable to the sponsor and counsel.',
    mitigation:
      'Stage rollout behind responsible-AI and counsel sign-off; require independent attestation acceptance before any production data flows; keep a documented rollback path until attestations clear.',
  },
  {
    key: 'model_drift_governance',
    name: 'Model drift governance gap',
    severity: 'high',
    description:
      'No evaluation, drift, or audit hooks expose model behavior over time, so responsible-AI sign-off cannot be defended at quarterly governance review.',
    mitigation:
      'Require evaluation and drift telemetry as a contractual deliverable; subscribe the organization-wide model-governance practice to the telemetry; define re-evaluation triggers in the governance runbook.',
  },
  {
    key: 'vendor_concentration',
    name: 'Vendor concentration risk',
    severity: 'medium',
    description:
      'Capability concentrates portfolio dependence on a single provider whose pricing, roadmap, or platform direction the organization cannot influence.',
    mitigation:
      'Capture a portable-format and documented-exit clause; maintain a dual-source feasibility study; review concentration posture inside the portfolio governance forum every planning cycle.',
  },
  {
    key: 'change_management_capacity',
    name: 'Change management capacity gap',
    severity: 'medium',
    description:
      'Affected operating units lack the change-management capacity to absorb the workflow shift the capability introduces, eroding adoption and value realization.',
    mitigation:
      'Stage adoption behind a documented change-management plan with named owners per operating unit; gate scale-out on baseline adoption telemetry rather than calendar milestones.',
  },
  {
    key: 'observability_gap',
    name: 'Observability gap',
    severity: 'medium',
    description:
      'Capability does not emit the audit, performance, and incident telemetry the platform observability posture expects, which blocks defensible operations review.',
    mitigation:
      'Require observability hooks as a contractual deliverable; integrate with the existing audit and incident pipelines; add observability gaps to the joint runbook before scale-out.',
  },
  {
    key: 'identity_audit_gap',
    name: 'Identity and audit gap',
    severity: 'low',
    description:
      'Capability does not integrate cleanly with the organization\'s identity provider and audit pipeline, which extends onboarding and complicates access review.',
    mitigation:
      'Require identity-provider integration before production rollout; route audit events to the canonical pipeline; document access-review cadence as part of the runbook.',
  },
]);

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Return the twelve canonical decision criteria in canonical order. Pure: same call →
 * byte-equal output.
 */
export function listBuildBuyPartnerCriteria(): BuildBuyPartnerCriterionDescriptor[] {
  return BUILD_BUY_PARTNER_CRITERIA.map((k) => DESCRIPTORS[k]);
}

/**
 * Evaluate a build / buy / partner scenario against the canonical
 * criteria using deterministic, rule-based logic. Pure: same input →
 * deeply equal output.
 */
export function evaluateBuildBuyPartnerScenario(
  input: BuildBuyPartnerScenarioInput,
): BuildBuyPartnerRecommendation {
  const buildRuleFires =
    input.differentiationLevel === 'high' &&
    input.internalCapabilityMaturity !== 'absent';

  const buyRuleFires =
    input.timeToValueUrgency === 'high' &&
    input.marketCapabilityMaturity === 'mature' &&
    (input.differentiationLevel === 'low' || input.differentiationLevel === 'medium');

  const partnerRuleFires =
    input.timeToValueUrgency === 'high' &&
    input.marketCapabilityMaturity === 'fragmented' &&
    (input.differentiationLevel === 'medium' || input.differentiationLevel === 'high');

  let recommendedOption: BuildBuyPartnerOption;
  let confidence: 'low' | 'medium' | 'high';
  let rationale: string[];
  let tradeoffs: string[];

  if (buildRuleFires) {
    recommendedOption = 'build';
    const borderline = input.internalCapabilityMaturity === 'emerging';
    confidence = borderline ? 'medium' : 'high';
    rationale = [
      `Differentiation level for ${input.capabilityName} is high, so owning the capability end-to-end protects the moat the strategy depends on.`,
      `Internal capability maturity is ${input.internalCapabilityMaturity}, so the organization has the standing capacity to absorb a build path without starving higher-priority initiatives.`,
      'Build keeps data, model, and workflow rights inside the organization and aligns with the model-governance practice already in place.',
    ];
    tradeoffs = [
      'Build accepts a longer time-to-value than buy or partner and depends on sustained product, engineering, and responsible-AI staffing across the build, the run, and the change-management horizon.',
      'Build retains exit and concentration optionality at the cost of carrying total-cost-of-ownership across capital and run inside the organization.',
      'Build raises talent-retention exposure because the capability has no external owner if key contributors depart during the planning horizon.',
    ];
  } else if (buyRuleFires) {
    recommendedOption = 'buy';
    const borderline = input.internalCapabilityMaturity === 'established';
    confidence = borderline ? 'medium' : 'high';
    rationale = [
      `Time-to-value urgency for ${input.capabilityName} is high and the market capability is mature, so a market offering can land inside the agreed horizon without bespoke construction.`,
      `Differentiation level is ${input.differentiationLevel}, so the capability is a commodity workflow where parity with the market is acceptable to the sponsor.`,
      'Buy converts a capital-heavy build into subscription run economics and reduces the staffing burden to vendor-management and integration only.',
    ];
    tradeoffs = [
      'Buy accepts vendor-concentration exposure on pricing, roadmap, and platform direction over the planning horizon and depends on portable formats and exit terms staying defensible.',
      'Buy ties data, model, and workflow rights to standard vendor terms unless those terms are negotiated upward, and that negotiation surface is itself a sunk cost.',
      'Buy concentrates incident and audit dependence on the provider\'s support service-level agreement and joint runbook posture rather than internal control.',
    ];
  } else if (partnerRuleFires) {
    recommendedOption = 'partner';
    const borderline = input.internalCapabilityMaturity === 'absent';
    confidence = borderline ? 'medium' : 'high';
    rationale = [
      `Time-to-value urgency for ${input.capabilityName} is high but the market capability is fragmented, so no single market offering covers the scenario end-to-end.`,
      `Differentiation level is ${input.differentiationLevel}, which keeps the capability worth co-owning rather than ceding to a commodity buy path.`,
      'Partner blends shared-investment economics with bespoke data, model, and workflow rights that neither pure build nor pure buy delivers inside the agreed horizon.',
    ];
    tradeoffs = [
      'Partner accepts joint-engineering coordination cost and a shared-accountability model that depends on disciplined contracting and a joint runbook posture.',
      'Partner introduces vendor-relationship risk if the partner pivots, raises a down round, or shifts roadmap priorities that diverge from the planning horizon.',
      'Partner adds intellectual-property and exit-clause complexity that requires named counsel attention before any production data flows.',
    ];
  } else {
    recommendedOption = 'partner';
    confidence = 'low';
    rationale = [
      `No canonical rule fires unambiguously for ${input.capabilityName} given the supplied differentiation, market maturity, and time-to-value posture.`,
      'Partner is the cautious fallback because it preserves optionality on both build and buy paths while a deeper diligence loop runs.',
      'Confidence is reported as low so the sponsor and the responsible-AI practice can route the scenario into a follow-on workshop before commitment.',
    ];
    tradeoffs = [
      'A low-confidence partner recommendation risks paying joint-engineering coordination cost without the benefit of a clear differentiation case.',
      'Without a firing rule, the recommendation depends on subsequent diligence and should not be treated as a defensible decision until that diligence completes.',
      'Holding the decision in fallback mode delays time-to-value, which is itself a real cost against the value ledger.',
    ];
  }

  const governanceWarnings: string[] = [];
  if (input.regulatedContext) {
    governanceWarnings.push(
      'Regulated context flagged: route through responsible-AI and counsel sign-off before any production data flows; require regulator-accepted attestations and document the audit trail.',
    );
  }
  if (input.criticalRiskTags.length > 0) {
    governanceWarnings.push(
      `Critical risk tags surfaced (${input.criticalRiskTags.join(', ')}): each tag requires a named owner, a documented mitigation, and a revisit trigger before scale-out.`,
    );
  }

  const vendorStartupAssessmentFactors =
    recommendedOption === 'buy' || recommendedOption === 'partner'
      ? VENDOR_STARTUP_ASSESSMENT_FACTORS.map((f) => ({
          key: f.key,
          name: f.name,
          definition: f.definition,
          assessmentQuestions: f.assessmentQuestions.slice(),
        }))
      : [];

  const enterpriseReadinessRisks = ENTERPRISE_READINESS_RISKS.map((r) => ({
    key: r.key,
    name: r.name,
    severity: r.severity,
    description: r.description,
    mitigation: r.mitigation,
  }));

  return {
    scenarioName: input.scenarioName,
    recommendedOption,
    confidence,
    rationale,
    tradeoffs,
    governanceWarnings,
    vendorStartupAssessmentFactors,
    enterpriseReadinessRisks,
    createdFrom: 'deterministic_build_buy_partner_framework',
  };
}

/**
 * Summarize a recommendation into a one-line headline plus the leading
 * rationale and a count of governance warnings. Pure.
 */
export function summarizeBuildBuyPartnerRecommendation(
  result: BuildBuyPartnerRecommendation,
): { headline: string; topRationale: string; warningsCount: number } {
  const optionLabel =
    result.recommendedOption === 'build'
      ? 'Build'
      : result.recommendedOption === 'buy'
        ? 'Buy'
        : 'Partner';
  const headline = `${optionLabel} recommended for ${result.scenarioName} with ${result.confidence} confidence.`;
  const topRationale = result.rationale[0] ?? '';
  const warningsCount = result.governanceWarnings.length;
  return { headline, topRationale, warningsCount };
}
