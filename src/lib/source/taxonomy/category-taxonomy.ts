// Source — IT Sourcing Category Taxonomy (Slice 0.1)
//
// Encoded expert backbone for the Source surface. This module is the typed
// contract layer for the 8 IT sourcing categories Source reasons over. It is
// data + types only: no UI, no runtime behavior, no I/O. The category
// *classifier* (which maps a real sourcing event onto one of these
// categories) is Slice 1.1 and intentionally NOT in this module.
//
// Companion methodology: docs/strategy/SOURCE-SOURCING-METHODOLOGY.md
// Companion taxonomy doc: docs/strategy/SOURCE-CATEGORY-TAXONOMY.md
//
// Safe for both the Vercel/Supabase and Azure Postgres data paths: this is a
// static in-process constant with no database or service dependency.

/**
 * Stable identifiers for the 8 IT sourcing categories. The discriminated
 * union below keys on this field; `SOURCE_CATEGORY_IDS` and the exhaustive
 * tests guarantee the set stays closed.
 */
export type SourceCategoryId =
  | 'ams'
  | 'data_ai_platform'
  | 'ai_engineering_partner'
  | 'saas_renewal'
  | 'cloud_finops'
  | 'bpo_contact_centre'
  | 'bpo_shared_services'
  | 'cyber_grc'
  | 'staff_aug_vs_managed_service';

/** Frozen list of every category id — used for exhaustiveness checks. */
export const SOURCE_CATEGORY_IDS = [
  'ams',
  'data_ai_platform',
  'ai_engineering_partner',
  'saas_renewal',
  'cloud_finops',
  'bpo_contact_centre',
  'bpo_shared_services',
  'cyber_grc',
  'staff_aug_vs_managed_service',
] as const satisfies readonly SourceCategoryId[];

/**
 * Tenant context segments the Source surface grounds against. Mirrors the
 * segment names used across `src/lib/source` and the methodology spec; this
 * keeps evidence inputs referencing the real grounded substrate rather than
 * free text.
 */
export type TenantContextSegment =
  | 'vendor_contracts'
  | 'it_landscape'
  | 'it_financials'
  | 'program_inventory'
  | 'operating_telemetry'
  | 'industry_context'
  | 'compliance';

/** A judgment question an expert sourcing advisor asks for this category. */
export interface CategoryDecisionQuestion {
  /** Stable id, unique within the category, e.g. 'ams-q1'. */
  id: string;
  /** The question, phrased as the expert would ask it in the room. */
  question: string;
  /**
   * Which lifecycle stage (per SOURCE-SOURCING-METHODOLOGY.md §3) the question
   * belongs to. Stage 0 is demand challenge / triage.
   */
  stage: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/** A grounded evidence input the category needs before it can reason. */
export interface CategoryEvidenceInput {
  /** Tenant context segment the evidence is drawn from. */
  segment: TenantContextSegment;
  /** What the expert reads from this segment for this category. */
  whatItProves: string;
  /** True when the category cannot produce expert-grade output without it. */
  required: boolean;
}

/** An artifact / decision output the category produces. */
export interface CategoryOutputArtifact {
  /** Stable id, unique within the category, e.g. 'ams-a1'. */
  id: string;
  /** Short artifact name, e.g. 'AMS demand-challenge memo'. */
  name: string;
  /** What the artifact decides or recommends. */
  purpose: string;
}

/** A trap the expert flags — the wrong sourcing motion for this category. */
export interface CategoryAntiPattern {
  /** Stable id, unique within the category, e.g. 'ams-x1'. */
  id: string;
  /** The trap, stated plainly. */
  trap: string;
  /** What the expert does instead. */
  correction: string;
}

/**
 * One IT sourcing category. The discriminated union `SourceCategory` narrows
 * on `id`; every member shares this shape, so the union is a tagged record
 * rather than per-category divergent fields. Keeping the shape uniform is
 * deliberate — it lets the Slice 1.1 classifier treat all categories
 * polymorphically.
 */
export interface SourceCategoryDefinition<Id extends SourceCategoryId = SourceCategoryId> {
  /** Discriminant. */
  id: Id;
  /** Human label, e.g. 'Application Managed Services (AMS)'. */
  label: string;
  /** One-line scope statement. */
  summary: string;
  /** The judgment questions the expert asks. */
  decisionQuestions: readonly CategoryDecisionQuestion[];
  /** The grounded evidence the category needs. */
  evidenceInputs: readonly CategoryEvidenceInput[];
  /** What the category produces. */
  outputArtifacts: readonly CategoryOutputArtifact[];
  /** The traps the expert guards against. */
  antiPatterns: readonly CategoryAntiPattern[];
}

/** Discriminated union over every category id. */
export type SourceCategory = SourceCategoryDefinition;

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

const AMS: SourceCategoryDefinition<'ams'> = {
  id: 'ams',
  label: 'Application Managed Services (AMS)',
  summary:
    'Outsourced run/maintain/enhance of an application estate to a managed-service provider.',
  decisionQuestions: [
    {
      id: 'ams-q1',
      stage: 0,
      question:
        'Is the real need to keep the lights on, or to modernize the application? AMS sources the former and entrenches the latter.',
    },
    {
      id: 'ams-q2',
      stage: 0,
      question:
        'Which applications in scope are slated for retirement or replacement inside the AMS term?',
    },
    {
      id: 'ams-q3',
      stage: 1,
      question:
        'Single-tower or multi-tower? Does one provider get scale leverage we lose by splitting?',
    },
    {
      id: 'ams-q4',
      stage: 4,
      question:
        'What is the run-rate today (internal FTE + tooling) so the AMS quote is benchmarked, not accepted?',
    },
    {
      id: 'ams-q5',
      stage: 5,
      question:
        'Are XLAs (experience-level) defined, or only uptime SLAs that reward ticket volume?',
    },
  ],
  evidenceInputs: [
    {
      segment: 'it_landscape',
      whatItProves: 'Application estate, criticality, and modernization roadmap in scope.',
      required: true,
    },
    {
      segment: 'it_financials',
      whatItProves: 'Current internal run-cost baseline to benchmark the AMS quote.',
      required: true,
    },
    {
      segment: 'vendor_contracts',
      whatItProves: 'Incumbent support contracts and overlap with the proposed AMS scope.',
      required: true,
    },
    {
      segment: 'program_inventory',
      whatItProves: 'In-flight modernization programs that would hollow out the AMS scope.',
      required: false,
    },
  ],
  outputArtifacts: [
    {
      id: 'ams-a1',
      name: 'AMS demand-challenge memo',
      purpose: 'States whether AMS is the right motion vs. modernization or insourcing.',
    },
    {
      id: 'ams-a2',
      name: 'Run-cost baseline & should-cost range',
      purpose: 'Benchmarks the AMS quote against the current internal run-rate.',
    },
    {
      id: 'ams-a3',
      name: 'Tower scope & SLA/XLA matrix',
      purpose: 'Defines towers, exclusions, and experience-level targets before RFP.',
    },
  ],
  antiPatterns: [
    {
      id: 'ams-x1',
      trap: 'Sourcing AMS when the real need is product/application modernization.',
      correction:
        'Run the Stage 0 demand challenge; route modernization to a Move, AMS only for the stable residual estate.',
    },
    {
      id: 'ams-x2',
      trap: 'Locking a multi-year AMS term over applications scheduled for retirement.',
      correction: 'Cross-check program_inventory; carve retiring apps into a shorter ramp-down tower.',
    },
    {
      id: 'ams-x3',
      trap: 'Accepting uptime SLAs that pay the provider per ticket resolved.',
      correction: 'Require XLAs and ticket-reduction incentives so the provider is paid to remove demand.',
    },
  ],
};

const DATA_AI_PLATFORM: SourceCategoryDefinition<'data_ai_platform'> = {
  id: 'data_ai_platform',
  label: 'Data / AI Platform',
  summary:
    'Selection of a data, ML, or AI platform (warehouse, lakehouse, feature/model platform, vector store).',
  decisionQuestions: [
    {
      id: 'dap-q1',
      stage: 0,
      question:
        'Do we already own platform capability that covers this? Most enterprises run 2–3 overlapping data platforms.',
    },
    {
      id: 'dap-q2',
      stage: 1,
      question:
        'Is this a platform decision or a use-case decision dressed up as one? Platforms outlive use cases.',
    },
    {
      id: 'dap-q3',
      stage: 2,
      question:
        'What is the exit cost — data egress, re-platforming, retraining — if we leave in three years?',
    },
    {
      id: 'dap-q4',
      stage: 4,
      question:
        'How does consumption pricing behave at 3x and 10x current data volume?',
    },
  ],
  evidenceInputs: [
    {
      segment: 'it_landscape',
      whatItProves: 'Existing data platforms and integration surface the new platform must fit.',
      required: true,
    },
    {
      segment: 'vendor_contracts',
      whatItProves: 'Incumbent platform contracts, committed spend, and overlap.',
      required: true,
    },
    {
      segment: 'it_financials',
      whatItProves: 'Current platform spend and consumption-cost trajectory.',
      required: true,
    },
    {
      segment: 'program_inventory',
      whatItProves: 'AI/data programs that define the actual workload demand.',
      required: false,
    },
  ],
  outputArtifacts: [
    {
      id: 'dap-a1',
      name: 'Platform overlap & coverage assessment',
      purpose: 'Shows what existing platforms already cover the proposed scope.',
    },
    {
      id: 'dap-a2',
      name: 'Consumption-cost & scaling model',
      purpose: 'Projects platform cost at multiple data-volume scenarios.',
    },
    {
      id: 'dap-a3',
      name: 'Lock-in & exit-portability analysis',
      purpose: 'Itemizes egress, re-platforming, and retraining cost on exit.',
    },
  ],
  antiPatterns: [
    {
      id: 'dap-x1',
      trap: 'Buying a strategic platform to serve a single near-term use case.',
      correction: 'Separate the use-case decision from the platform decision; size the platform to the portfolio.',
    },
    {
      id: 'dap-x2',
      trap: 'Accepting consumption pricing with no cap or scaling model.',
      correction: 'Require a predictability ceiling and model cost at 3x/10x volume before signing.',
    },
    {
      id: 'dap-x3',
      trap: 'Ignoring 20–40% redundant spend across overlapping incumbent platforms.',
      correction: 'Run the overlap assessment first; a rationalization may remove the need to source.',
    },
  ],
};

const AI_ENGINEERING_PARTNER: SourceCategoryDefinition<'ai_engineering_partner'> = {
  id: 'ai_engineering_partner',
  label: 'AI Engineering Partner',
  summary:
    'Selection of a delivery partner to build/operate AI solutions (agents, copilots, model ops).',
  decisionQuestions: [
    {
      id: 'aep-q1',
      stage: 0,
      question:
        'Is this a real engineering partner with platform IP, or a GPT-wrapper / staff-aug shop in partner clothing?',
    },
    {
      id: 'aep-q2',
      stage: 1,
      question:
        'Should this be one SI engagement, or split into platform build, model operations, and workflow redesign?',
    },
    {
      id: 'aep-q3',
      stage: 3,
      question:
        'What discriminating proof — not slides — separates real AI capability from vendor marketing?',
    },
    {
      id: 'aep-q4',
      stage: 5,
      question:
        'Who owns the model weights, prompts, evals, and fine-tunes when the engagement ends?',
    },
  ],
  evidenceInputs: [
    {
      segment: 'program_inventory',
      whatItProves: 'The AI initiatives the partner would deliver and their readiness gaps.',
      required: true,
    },
    {
      segment: 'industry_context',
      whatItProves: 'Vendor reality, viability, and reference comparators in the market.',
      required: true,
    },
    {
      segment: 'it_landscape',
      whatItProves: 'Internal engineering capacity and the platform the partner builds on.',
      required: true,
    },
    {
      segment: 'vendor_contracts',
      whatItProves: 'Existing SI / partner agreements that may already cover the scope.',
      required: false,
    },
  ],
  outputArtifacts: [
    {
      id: 'aep-a1',
      name: 'Vendor reality assessment',
      purpose: 'Distinguishes genuine AI engineering capability from thin wrappers.',
    },
    {
      id: 'aep-a2',
      name: 'Engagement decomposition',
      purpose: 'Splits a monolithic SI ask into platform / model-ops / workflow lanes.',
    },
    {
      id: 'aep-a3',
      name: 'AI IP & exit clause checklist',
      purpose: 'Confirms ownership of weights, prompts, evals, and fine-tuned-model portability.',
    },
  ],
  antiPatterns: [
    {
      id: 'aep-x1',
      trap: 'Treating a staff-aug shop or GPT wrapper as a strategic AI partner.',
      correction: 'Demand discriminating proof and platform IP evidence in Stage 3 before shortlisting.',
    },
    {
      id: 'aep-x2',
      trap: 'Sourcing one over-scoped SI RFP for platform, model ops, and workflow at once.',
      correction: 'Decompose the engagement and source the external lane with targeted commercial controls.',
    },
    {
      id: 'aep-x3',
      trap: 'Letting the partner retain the fine-tuned models and evals built on tenant data.',
      correction: 'Require output ownership, model-training restriction, and fine-tune portability clauses.',
    },
  ],
};

const SAAS_RENEWAL: SourceCategoryDefinition<'saas_renewal'> = {
  id: 'saas_renewal',
  label: 'SaaS Renewal',
  summary:
    'Renewal, renegotiation, or rationalization of an existing SaaS subscription.',
  decisionQuestions: [
    {
      id: 'sr-q1',
      stage: 0,
      question:
        'Is the product still used at the licensed level, or are we renewing shelfware?',
    },
    {
      id: 'sr-q2',
      stage: 0,
      question:
        'Does another tool in the estate now cover this — making renewal a rationalization decision?',
    },
    {
      id: 'sr-q3',
      stage: 5,
      question:
        'When is auto-renewal notice due, and do we still have competitive tension before it locks?',
    },
    {
      id: 'sr-q4',
      stage: 5,
      question:
        'What is the true price walk including uplift, new modules, and price-protection erosion?',
    },
  ],
  evidenceInputs: [
    {
      segment: 'vendor_contracts',
      whatItProves: 'Renewal date, auto-renewal terms, notice window, and price-protection clauses.',
      required: true,
    },
    {
      segment: 'operating_telemetry',
      whatItProves: 'Actual product usage vs. licensed seats — the shelfware signal.',
      required: true,
    },
    {
      segment: 'it_landscape',
      whatItProves: 'Overlapping tools that could absorb the function.',
      required: true,
    },
    {
      segment: 'it_financials',
      whatItProves: 'Spend history and uplift trajectory across prior renewals.',
      required: false,
    },
  ],
  outputArtifacts: [
    {
      id: 'sr-a1',
      name: 'Usage vs. license utilization report',
      purpose: 'Quantifies shelfware and the right-sized seat count.',
    },
    {
      id: 'sr-a2',
      name: 'Renewal-calendar & notice-window alert',
      purpose: 'Flags auto-renewal lock-in before competitive leverage is lost.',
    },
    {
      id: 'sr-a3',
      name: 'Renegotiation posture',
      purpose: 'Top levers, true price walk, and rationalize-vs-renew recommendation.',
    },
  ],
  antiPatterns: [
    {
      id: 'sr-x1',
      trap: 'Renewing at the same seat count without checking utilization.',
      correction: 'Pull operating_telemetry; right-size or drop shelfware before renewing.',
    },
    {
      id: 'sr-x2',
      trap: 'Missing the auto-renewal notice window and losing all negotiation leverage.',
      correction: 'Track the renewal calendar; open renegotiation well before the notice deadline.',
    },
    {
      id: 'sr-x3',
      trap: 'Renewing a tool whose function another product in the estate now covers.',
      correction: 'Run the overlap check; treat renewal as a rationalization decision.',
    },
  ],
};

const CLOUD_FINOPS: SourceCategoryDefinition<'cloud_finops'> = {
  id: 'cloud_finops',
  label: 'Cloud / FinOps',
  summary:
    'Sourcing or renegotiation of cloud commitments and the FinOps discipline that governs cloud spend.',
  decisionQuestions: [
    {
      id: 'cf-q1',
      stage: 0,
      question:
        'Is the problem a commercial-terms problem, or an architecture/waste problem a contract cannot fix?',
    },
    {
      id: 'cf-q2',
      stage: 1,
      question:
        'What commit level is justified by genuine forecast demand vs. optimistic growth assumptions?',
    },
    {
      id: 'cf-q3',
      stage: 4,
      question:
        'How much current spend is idle, oversized, or untagged — and would removing it change the commit?',
    },
    {
      id: 'cf-q4',
      stage: 5,
      question:
        'Do the discount terms survive a workload migration, or do they trap us on this provider?',
    },
  ],
  evidenceInputs: [
    {
      segment: 'it_financials',
      whatItProves: 'Cloud spend, growth trend, and the waste/idle baseline.',
      required: true,
    },
    {
      segment: 'vendor_contracts',
      whatItProves: 'Existing cloud commitment terms, discount tiers, and expiry.',
      required: true,
    },
    {
      segment: 'it_landscape',
      whatItProves: 'Workload footprint and architecture driving the spend.',
      required: true,
    },
    {
      segment: 'operating_telemetry',
      whatItProves: 'Utilization signals for rightsizing before committing.',
      required: false,
    },
  ],
  outputArtifacts: [
    {
      id: 'cf-a1',
      name: 'Cloud waste & rightsizing baseline',
      purpose: 'Quantifies idle/oversized spend to remove before any new commit.',
    },
    {
      id: 'cf-a2',
      name: 'Commitment model & should-commit range',
      purpose: 'Sizes the commit to defensible forecast demand, not optimistic growth.',
    },
    {
      id: 'cf-a3',
      name: 'Discount-portability analysis',
      purpose: 'Tests whether terms survive workload migration or create lock-in.',
    },
  ],
  antiPatterns: [
    {
      id: 'cf-x1',
      trap: 'Negotiating a bigger commit to fix what is really architectural waste.',
      correction: 'Run FinOps rightsizing first; renegotiate on the cleaned-up, lower baseline.',
    },
    {
      id: 'cf-x2',
      trap: 'Committing to an aggressive spend tier on optimistic growth assumptions.',
      correction: 'Size the commit to forecast demand with a confidence range, not best case.',
    },
    {
      id: 'cf-x3',
      trap: 'Taking deep discounts that silently lock workloads to one provider.',
      correction: 'Model exit/migration cost and require portability-safe discount structuring.',
    },
  ],
};

const BPO_CONTACT_CENTRE: SourceCategoryDefinition<'bpo_contact_centre'> = {
  id: 'bpo_contact_centre',
  label: 'BPO / Contact Centre',
  summary:
    'Outsourcing of a business process or contact-centre operation to a BPO provider.',
  decisionQuestions: [
    {
      id: 'bpo-q1',
      stage: 0,
      question:
        'Should this process be outsourced, automated, or redesigned? Outsourcing a broken process exports the dysfunction.',
    },
    {
      id: 'bpo-q2',
      stage: 1,
      question:
        'How much of this volume will AI/automation remove inside the contract term?',
    },
    {
      id: 'bpo-q3',
      stage: 4,
      question:
        'Is pricing per-seat/per-FTE (rewards headcount) or per-outcome (rewards deflection)?',
    },
    {
      id: 'bpo-q4',
      stage: 5,
      question:
        'What are the CX, attrition, and brand-risk consequences if service quality drops?',
    },
  ],
  evidenceInputs: [
    {
      segment: 'operating_telemetry',
      whatItProves: 'Process volume, contact mix, and the automatable share.',
      required: true,
    },
    {
      segment: 'it_financials',
      whatItProves: 'Current cost-to-serve baseline for benchmarking the BPO quote.',
      required: true,
    },
    {
      segment: 'program_inventory',
      whatItProves: 'Automation/AI programs that will reshape the volume mid-term.',
      required: true,
    },
    {
      segment: 'vendor_contracts',
      whatItProves: 'Incumbent BPO terms, volume commitments, and exit provisions.',
      required: false,
    },
  ],
  outputArtifacts: [
    {
      id: 'bpo-a1',
      name: 'Outsource / automate / redesign decision memo',
      purpose: 'States whether BPO is the right motion vs. automation or process redesign.',
    },
    {
      id: 'bpo-a2',
      name: 'Volume-decay & deflection model',
      purpose: 'Projects how AI/automation erodes outsourced volume over the term.',
    },
    {
      id: 'bpo-a3',
      name: 'Outcome-based pricing & CX-risk matrix',
      purpose: 'Frames per-outcome commercials and the customer-experience guardrails.',
    },
  ],
  antiPatterns: [
    {
      id: 'bpo-x1',
      trap: 'Outsourcing a broken process instead of fixing or automating it first.',
      correction: 'Run the Stage 0 triage; redesign or automate before exporting the process.',
    },
    {
      id: 'bpo-x2',
      trap: 'Signing per-FTE pricing while planning AI deflection — paying for headcount you intend to remove.',
      correction: 'Use outcome/deflection-based commercials and a volume-decay schedule.',
    },
    {
      id: 'bpo-x3',
      trap: 'Optimizing only for cost and ignoring CX, attrition, and brand risk.',
      correction: 'Set experience-level targets and brand-risk guardrails alongside the cost case.',
    },
  ],
};

const CYBER_GRC: SourceCategoryDefinition<'cyber_grc'> = {
  id: 'cyber_grc',
  label: 'Cyber / GRC',
  summary:
    'Sourcing of security, governance, risk, or compliance tooling and managed security services.',
  decisionQuestions: [
    {
      id: 'cg-q1',
      stage: 0,
      question:
        'Which specific control gap or compliance obligation does this close — or is it tool sprawl?',
    },
    {
      id: 'cg-q2',
      stage: 0,
      question:
        'Do existing security tools already cover this capability under a different label?',
    },
    {
      id: 'cg-q3',
      stage: 2,
      question:
        'Does the vendor itself meet the security/compliance bar we are buying the tool to enforce?',
    },
    {
      id: 'cg-q4',
      stage: 6,
      question:
        'What fourth-party / sub-processor exposure does this vendor introduce?',
    },
  ],
  evidenceInputs: [
    {
      segment: 'compliance',
      whatItProves: 'Control gaps, audit findings, and regulatory obligations driving the need.',
      required: true,
    },
    {
      segment: 'it_landscape',
      whatItProves: 'Existing security tooling and the capability map for overlap checks.',
      required: true,
    },
    {
      segment: 'vendor_contracts',
      whatItProves: 'Incumbent security/GRC contracts and renewal exposure.',
      required: false,
    },
    {
      segment: 'industry_context',
      whatItProves: 'Vendor viability and threat-landscape comparators.',
      required: false,
    },
  ],
  outputArtifacts: [
    {
      id: 'cg-a1',
      name: 'Control-gap mapping',
      purpose: 'Ties the proposed tool to a specific gap or obligation, or flags sprawl.',
    },
    {
      id: 'cg-a2',
      name: 'Tooling-overlap assessment',
      purpose: 'Shows which existing security tools already cover the capability.',
    },
    {
      id: 'cg-a3',
      name: 'Vendor-security & fourth-party risk review',
      purpose: 'Assesses the vendor and its sub-processors against the bar being enforced.',
    },
  ],
  antiPatterns: [
    {
      id: 'cg-x1',
      trap: 'Buying another security tool without mapping it to a specific control gap.',
      correction: 'Anchor every cyber/GRC purchase to a compliance obligation or audit finding.',
    },
    {
      id: 'cg-x2',
      trap: 'Adding to security-tool sprawl when an owned tool already covers the capability.',
      correction: 'Run the overlap assessment; consolidate before sourcing.',
    },
    {
      id: 'cg-x3',
      trap: "Ignoring the vendor's own security posture and sub-processor chain.",
      correction: 'Require vendor-security evidence and fourth-party disclosure before award.',
    },
  ],
};

const STAFF_AUG_VS_MANAGED_SERVICE: SourceCategoryDefinition<'staff_aug_vs_managed_service'> = {
  id: 'staff_aug_vs_managed_service',
  label: 'Staff Augmentation vs. Managed Service',
  summary:
    'The delivery-model decision between buying labour (staff aug) and buying an outcome (managed service).',
  decisionQuestions: [
    {
      id: 'sams-q1',
      stage: 0,
      question:
        'Are we buying capacity (staff aug) or an outcome (managed service)? They are priced and governed differently.',
    },
    {
      id: 'sams-q2',
      stage: 1,
      question:
        'Who carries delivery risk and accountability — us, or the provider?',
    },
    {
      id: 'sams-q3',
      stage: 1,
      question:
        'Is the demand a temporary spike (favours staff aug) or steady-state run (favours managed service)?',
    },
    {
      id: 'sams-q4',
      stage: 5,
      question:
        'Does a "managed service" priced per head and directed by us simply re-label staff aug at a markup?',
    },
  ],
  evidenceInputs: [
    {
      segment: 'program_inventory',
      whatItProves: 'The work to be delivered and whether demand is spike or steady-state.',
      required: true,
    },
    {
      segment: 'it_landscape',
      whatItProves: 'Internal capability and capacity gap the engagement fills.',
      required: true,
    },
    {
      segment: 'it_financials',
      whatItProves: 'Cost baseline for comparing labour-rate vs. outcome pricing.',
      required: true,
    },
    {
      segment: 'vendor_contracts',
      whatItProves: 'Existing labour / managed-service agreements and their structure.',
      required: false,
    },
  ],
  outputArtifacts: [
    {
      id: 'sams-a1',
      name: 'Delivery-model decision memo',
      purpose: 'Recommends staff aug vs. managed service with risk-ownership rationale.',
    },
    {
      id: 'sams-a2',
      name: 'Risk & accountability allocation',
      purpose: 'Maps who owns delivery risk, outcomes, and management overhead.',
    },
    {
      id: 'sams-a3',
      name: 'Pricing-model comparison',
      purpose: 'Contrasts labour-rate and outcome-based commercials for the demand profile.',
    },
  ],
  antiPatterns: [
    {
      id: 'sams-x1',
      trap: 'Buying staff aug for steady-state run work the provider should own as an outcome.',
      correction: 'Match steady-state demand to a managed service with outcome accountability.',
    },
    {
      id: 'sams-x2',
      trap: 'Buying a managed service for a short-lived spike, paying an outcome premium for capacity.',
      correction: 'Use staff aug for temporary demand; reserve managed services for durable scope.',
    },
    {
      id: 'sams-x3',
      trap: 'Accepting a "managed service" that is per-head, client-directed staff aug at a markup.',
      correction: 'Require genuine outcome SLAs and provider-owned delivery risk, or price it as staff aug.',
    },
  ],
};

const BPO_SHARED_SERVICES: SourceCategoryDefinition<'bpo_shared_services'> = {
  id: 'bpo_shared_services',
  label: 'BPO / Shared Services (Transaction Processing)',
  summary:
    'Outsourcing of transaction-processing shared services across HR, Finance & Accounting (F&A), and Supply Chain (SCM) — priced on process volumes and held to error/rework and cycle-time SLAs.',
  decisionQuestions: [
    {
      id: 'bss-q1',
      stage: 0,
      question:
        'Is the win labour arbitrage, or automation and process redesign? Outsourcing a manual, error-prone process at a lower rate banks the dysfunction.',
    },
    {
      id: 'bss-q2',
      stage: 1,
      question:
        'Is pricing on true transaction volume bands, or per-FTE — and does it flex down as automation deflects work?',
    },
    {
      id: 'bss-q3',
      stage: 2,
      question:
        'Who owns the rework and error cost — payroll corrections, invoice-accuracy misses, PO/invoice mismatches — the provider commercially, or us?',
    },
    {
      id: 'bss-q4',
      stage: 5,
      question:
        'How do SOX controls, segregation-of-duties, and the retained approver/controller org survive the transition, and are they costed into TCO?',
    },
  ],
  evidenceInputs: [
    {
      segment: 'operating_telemetry',
      whatItProves:
        'Transaction volume by process (payroll events, AP invoices, PO matches, HR cases), plus error/rework and cycle-time baselines.',
      required: true,
    },
    {
      segment: 'it_financials',
      whatItProves: 'Current fully-loaded unit cost per process for should-cost and any savings claim.',
      required: true,
    },
    {
      segment: 'program_inventory',
      whatItProves: 'Automation / RPA / self-service programs that will deflect volume mid-term.',
      required: true,
    },
    {
      segment: 'compliance',
      whatItProves: 'SOX controls, segregation-of-duties, and data-privacy obligations that bound delivery model and geography.',
      required: true,
    },
    {
      segment: 'vendor_contracts',
      whatItProves: 'Incumbent BPO / shared-services terms, volume commitments, and exit provisions.',
      required: false,
    },
  ],
  outputArtifacts: [
    {
      id: 'bss-a1',
      name: 'Arbitrage vs automate vs redesign decision memo',
      purpose: 'States whether volume-band BPO is the right motion, or automation/redesign should come first.',
    },
    {
      id: 'bss-a2',
      name: 'Volume-band pricing & deflection model',
      purpose: 'Ties price to transaction volume bands and projects automation deflection across the term.',
    },
    {
      id: 'bss-a3',
      name: 'Error/rework economics & retained-cost model',
      purpose: 'Quantifies rework cost the provider must own and the retained approver/controller effort in TCO.',
    },
    {
      id: 'bss-a4',
      name: 'Controls / SoD continuity matrix',
      purpose: 'Maps SOX controls and segregation-of-duties through transition and steady-state.',
    },
  ],
  antiPatterns: [
    {
      id: 'bss-x1',
      trap: 'Outsourcing a manual, error-prone process for arbitrage instead of automating or redesigning it first.',
      correction: 'Run Stage 0 triage; size the automation deflection pool before exporting the process.',
    },
    {
      id: 'bss-x2',
      trap: 'Signing per-FTE pricing while planning automation — paying for headcount you intend to remove.',
      correction: 'Use volume-band pricing that flexes down as deflection removes transactions.',
    },
    {
      id: 'bss-x3',
      trap: 'Letting exceptions (off-cycle payroll, invoice disputes, master-data fixes) leak into uncapped T&M.',
      correction: 'Price exception handling explicitly and cap non-standard-work leakage.',
    },
    {
      id: 'bss-x4',
      trap: 'Omitting the retained approver/controller org and SoD continuity, making the bidder look cheaper than the real total.',
      correction: 'Load retained-org and client-SME effort into TCO and require a controls-continuity plan.',
    },
  ],
};

/**
 * The complete, exhaustive taxonomy keyed by category id. The Slice 1.1
 * classifier will read from this registry; it does not mutate it.
 */
export const SOURCE_CATEGORY_TAXONOMY: Readonly<Record<SourceCategoryId, SourceCategory>> = {
  ams: AMS,
  data_ai_platform: DATA_AI_PLATFORM,
  ai_engineering_partner: AI_ENGINEERING_PARTNER,
  saas_renewal: SAAS_RENEWAL,
  cloud_finops: CLOUD_FINOPS,
  bpo_contact_centre: BPO_CONTACT_CENTRE,
  bpo_shared_services: BPO_SHARED_SERVICES,
  cyber_grc: CYBER_GRC,
  staff_aug_vs_managed_service: STAFF_AUG_VS_MANAGED_SERVICE,
};

/** Flat list of all 9 categories, in canonical order. */
export const SOURCE_CATEGORIES: readonly SourceCategory[] =
  SOURCE_CATEGORY_IDS.map((id) => SOURCE_CATEGORY_TAXONOMY[id]);

/** Look up a category by id. Returns `undefined` for unknown ids. */
export function getSourceCategory(id: string): SourceCategory | undefined {
  return (SOURCE_CATEGORY_TAXONOMY as Record<string, SourceCategory>)[id];
}
