// J1 oriented-browse topic registry · INT-2.1 + INT-2.2
//
// 10 thesis-led AI-transformation topics rendered on
// /intelligence/topics and /intelligence/topics/[topicId]. Each topic
// references real patterns from the manifest (validated) and
// failure modes from the canonical FAILURE_MODES table (validated).
//
// Voice rules (same as J0 cards per FAILURE_MODE_CARDS_DRAFT.md):
//   - No hedging.
//   - Specific mechanism, not abstraction.
//   - No marketing language (unlock, accelerate, leverage, empower,
//     revolutionary, cutting-edge, game-changer, best-in-class,
//     next-generation).
//   - "What good looks like" references a phase / pattern / corpus
//     concept concretely.
//   - Thesis is contradiction-aware: names what industry typically
//     gets wrong AND what good looks like in compressed form.
//
// Sign-off: cards land as "Claude Opus 4.7 (draft pending founder
// ratification)". Founder edits ratify by replacing the string. The
// validation suite enforces structural integrity; voice review is a
// separate cycle.

import { FAILURE_MODES } from '@/lib/programs/failure-modes';

export interface TopicEntry {
  /** Stable kebab-case id, derived from title; unique. */
  topicId: string;
  /** Display title — under 60 chars. */
  title: string;
  /** AbarVa's point of view, 2-4 sentences (200-400 chars). */
  thesis: string;
  /** Contradiction-aware framing of where industry typically goes wrong. */
  whatIndustryGetsWrong: string;
  /** Concrete prevention/discipline, references phase / pattern / corpus. */
  whatGoodLooksLike: string;
  /** Pattern manifest entry IDs (1-6); validated to resolve. */
  associatedPatternIds: string[];
  /** FAILURE_MODES ids the topic intersects (0-3). */
  associatedFailureModeIds: number[];
  /** Real program archetype labels (≥2). */
  exampleProgramArchetypes: string[];
  /** Editorial sign-off metadata. */
  lastReviewedBy: string;
  lastReviewedAt: string;
}

const DRAFT_REVIEWER = 'Claude Opus 4.7 (draft pending founder ratification)';
const DRAFT_DATE = '2026-04-30';

/**
 * Slugify a topic title for routing.
 *
 *   'AI use case portfolio management' → 'ai-use-case-portfolio-management'
 *   'Pilot-to-production scaling'       → 'pilot-to-production-scaling'
 */
export function slugifyTopicTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export const J1_TOPICS: ReadonlyArray<TopicEntry> = [
  {
    topicId: 'ai-use-case-portfolio-management',
    title: 'AI use case portfolio management',
    thesis:
      'Most enterprises run AI as a collection of disconnected experiments. The portfolio discipline that converts those experiments into compounding value — sequencing decisions, harvesting outcomes, retiring weak bets — is rare and is the upstream input to every other AI capability decision.',
    whatIndustryGetsWrong:
      "Portfolio is treated as a slide. The CIO has 17 pilots underway because saying no to the seventeenth was harder than launching it. Each pilot consumes coordination time and SME capacity; none gets the oxygen to reach production. Two years later, leadership is fatigued and the AI investment cycle is suspect — the portfolio's reputation is defined by the bottom-quartile pilots, not the top.",
    whatGoodLooksLike:
      'A real AI portfolio names a small set of flagship outcomes, sequences programs against them, and runs an explicit prioritization framework that tests every new program for overlap, capacity, and concentration before it gets budget. The corpus pattern is `pattern_ai_use_case_portfolio` — programs that fail this discipline are pre-flagged in P0 by the AbarVa platform via the Tenant Admin approval gate.',
    associatedPatternIds: [
      'pattern_ai_use_case_portfolio',
      'pattern_vendor_sprawl_ai_tool_rationalization',
    ],
    associatedFailureModeIds: [1, 10],
    exampleProgramArchetypes: [
      'AI portfolio launch',
      'Use-case prioritization review',
      'Annual AI investment cycle',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    topicId: 'analytics-modernization',
    title: 'Analytics modernization',
    thesis:
      'Analytics modernization is the substrate AI sits on top of, not a parallel program. Most enterprises run the two as separate streams — one for the data team, one for the AI team — and the AI program never gets the data foundation it needs. The two streams have to be sequenced, not parallelized.',
    whatIndustryGetsWrong:
      'The AI program is launched alongside an analytics modernization, with the assumption that the modernization will catch up. By P3, the AI capability needs cleaner customer identity, better lineage, and faster cadence than the analytics program plans to deliver — and the AI program either bends to the limitation (shipping less than promised) or builds a parallel foundation (creating tech debt the platform team will inherit).',
    whatGoodLooksLike:
      "Analytics modernization gets a P0 dependency check against the AI portfolio. Programs whose data foundation isn't ready don't advance to P1 Discovery; programs whose modernization roadmap won't reach the data foundation in their P3 window get re-sequenced or scoped down. The corpus pattern is `pattern_analytics_modernization` — its co-applies relationship with `pattern_ai_use_case_portfolio` is what makes the sequencing visible.",
    associatedPatternIds: [
      'pattern_analytics_modernization',
      'pattern_customer_onboarding_kyc_ai',
    ],
    associatedFailureModeIds: [3, 9],
    exampleProgramArchetypes: [
      'Data lakehouse migration',
      'Customer 360 build',
      'Real-time analytics platform',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    topicId: 'data-foundation-readiness',
    title: 'Data foundation readiness',
    thesis:
      "The single biggest reason AI programs fail is that the data isn't ready, but most data-readiness conversations are abstract. Readiness is specific — who owns the data, how clean is it, can it move at the cadence the use case requires, will the access pattern survive 10× scale. Programs that skip this assessment in P1 pay for it in P5.",
    whatIndustryGetsWrong:
      'Data readiness is checked by asking the data team if the data is ready. The data team says "mostly yes" because they don\'t know what the AI use case requires; the AI team treats that answer as confirmation. By P3 Design, the architecture review surfaces gaps the assessment was supposed to catch — owner unclear, lineage broken, scale untested.',
    whatGoodLooksLike:
      'P1 Discovery requires a baseline data-asset inventory keyed to the program\'s pattern: domain owner, documented quality, lineage that survives a real audit, access path tested against the cadence the use case requires. P2 Synthesis blocks advance if any are missing. The corpus pattern is `pattern_analytics_modernization`; the gate behavior is enforced by AbarVa\'s P2 evaluator.',
    associatedPatternIds: [
      'pattern_analytics_modernization',
      'pattern_customer_onboarding_kyc_ai',
      'pattern_demand_forecasting_inventory_ai',
    ],
    associatedFailureModeIds: [3],
    exampleProgramArchetypes: [
      'Data quality program',
      'Master data hub',
      'Identity-resolution buildout',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    topicId: 'ai-governance-and-risk',
    title: 'AI governance and risk',
    thesis:
      "The framework adoption rate for AI governance is high; the operational adherence rate is low. Adopting a framework is not governance — operating against it is. The discipline that makes governance real is embedding controls into the program lifecycle, not stapling them on at launch.",
    whatIndustryGetsWrong:
      'A governance committee is named in P0; a framework (NIST AI RMF or EU AI Act) is referenced in the charter; a steering review is added at P5. Compliance reviews the architecture two weeks before go-live and identifies design decisions that need to change — privacy posture, audit trail, fairness analysis. Two of three slip the launch by a quarter.',
    whatGoodLooksLike:
      'Governance is a P2 deliverable, not a P5 review. The corpus pattern `pattern_ai_governance_operating_model` requires named risk owners and approved control plans before P3 Design closes; AbarVa surfaces missing controls as anti-pattern flags during the active P2 conversation rather than at launch.',
    associatedPatternIds: [
      'pattern_ai_governance_operating_model',
      'pattern_fraud_detection_modernization',
    ],
    associatedFailureModeIds: [6, 1],
    exampleProgramArchetypes: [
      'Responsible AI program',
      'Model risk management',
      'AI policy and standards',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    topicId: 'vendor-and-platform-decisions',
    title: 'Vendor and platform decisions',
    thesis:
      "Vendor demos run on cherry-picked data; buyer validation runs on the buyer's own data; the contracts that lock buyers in are written before that gap is exposed. The discipline is to expose the gap before signing — not after — and to score vendors against pattern-specific must-haves, not generic feature lists.",
    whatIndustryGetsWrong:
      "Vendor selection runs on rapport, urgency, or political alignment. The vendor was chosen before the build-vs-buy criteria were named. By P3 Design, the program is bending around what the vendor can do; by P5, the gaps surface in production; by P6, the program is asking whether the contract has an exit clause.",
    whatGoodLooksLike:
      "P3 Design includes a sourcing module: structured build-vs-buy criteria, vendor scorecard tied to the pattern's must-haves, validation against the buyer's own data before contract close, and a sponsor-approved decision before Build commences. The corpus pattern is `pattern_vendor_sprawl_ai_tool_rationalization`; AbarVa enforces the discipline at the P3 → P4 gate.",
    associatedPatternIds: [
      'pattern_vendor_sprawl_ai_tool_rationalization',
      'pattern_ai_use_case_portfolio',
    ],
    associatedFailureModeIds: [7],
    exampleProgramArchetypes: [
      'Vendor rationalization',
      'Build-vs-buy review',
      'AI platform consolidation',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    topicId: 'pilot-to-production-scaling',
    title: 'Pilot-to-production scaling',
    thesis:
      "73% of enterprise AI pilots never reach production. The model is fine; the surrounding work — workflow, scale, operations — is what fails. The discipline that closes the gap treats P4 Build and P5 Activate as a single proving ground for production conditions, not as 'build then deploy.'",
    whatIndustryGetsWrong:
      "Pilots are optimized for vendor selection and stakeholder confidence; the production environment is never the test. Curated data, dedicated champion support, and parallel-pilot deployment make the pilot look successful. Production rollout surfaces drift the pilot never showed and workflow friction the pilot environment didn't simulate.",
    whatGoodLooksLike:
      'P4 Build requires production-readiness evidence — operations runbooks, monitoring instrumentation, scaled-data validation — before P5 starts. P5 Activate requires the capability live in the production workflow with measured usage, not a parallel pilot. Patterns `pattern_demand_forecasting_inventory_ai` and `pattern_velocity_without_validation` carry the discipline; the AbarVa P5 gate enforces it.',
    associatedPatternIds: [
      'pattern_demand_forecasting_inventory_ai',
      'pattern_velocity_without_validation',
      'pattern_ai_use_case_portfolio',
    ],
    associatedFailureModeIds: [8, 9],
    exampleProgramArchetypes: [
      'Pilot graduation',
      'Production rollout',
      'Capability scale-up',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    topicId: 'workflow-and-operating-model-change',
    title: 'Workflow and operating-model change',
    thesis:
      'Workflow redesign is the single biggest EBIT-driving practice associated with realized value from AI. Programs that ship a model alongside an unchanged workflow ship technical wins and flat business outcomes. The model lands; the value does not.',
    whatIndustryGetsWrong:
      "The model is deployed and adoption is tracked as success. Six months later the business outcome the program promised hasn't moved — the operators are using the AI as a 'second opinion' rather than letting it drive the work, because nobody redesigned the workflow to absorb it. The technology arrived; the operating model did not.",
    whatGoodLooksLike:
      'P3 Design requires an explicit operating-model delta — what the operator does differently, what they stop doing, who owns the change story. P5 Activate requires evidence of workflow change in production, not just deployed models. The corpus patterns `pattern_demand_forecasting_inventory_ai` and `pattern_prior_authorization_automation` show the shape; the AbarVa P3 gate requires named change-owners.',
    associatedPatternIds: [
      'pattern_prior_authorization_automation',
      'pattern_demand_forecasting_inventory_ai',
    ],
    associatedFailureModeIds: [5, 4],
    exampleProgramArchetypes: [
      'Operating model redesign',
      'Workflow integration',
      'Adoption-led rollout',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    topicId: 'outcome-measurement-and-attribution',
    title: 'Outcome measurement and attribution',
    thesis:
      'Only ~15% of AI initiatives demonstrate EBITDA-level financial gain. The reason is rarely the model. The reason is that outcome measurement was not designed in at P1 — there is no baseline, no leading KPI, no causal link between the AI capability and the business outcome being claimed.',
    whatIndustryGetsWrong:
      'The program ships and the steering committee asks for impact six months later. The team produces usage statistics — sessions, model invocations, deployments — none of which connect to a business outcome. Baseline data is stale or never captured; the question of attribution gets uncomfortable; the next-cycle budget gets harder.',
    whatGoodLooksLike:
      "P1 Discovery captures a baseline keyed to the pattern's canonical KPI — AHT and CSAT for contact center, MAPE and WAPE for demand forecasting, false-positive rate for fraud. P5 and P6 require post-deployment measurement against that baseline before outcomes can be settled. The corpus patterns `pattern_ambient_clinical_value_chain` and `pattern_owned_brand_margin_recovery` carry pattern-specific KPI requirements; AbarVa enforces at P1.",
    associatedPatternIds: [
      'pattern_ambient_clinical_value_chain',
      'pattern_owned_brand_margin_recovery',
    ],
    associatedFailureModeIds: [9, 2],
    exampleProgramArchetypes: [
      'Outcome attribution program',
      'Baseline measurement',
      'KPI calibration',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    topicId: 'specialized-industry-applications',
    title: 'Specialized industry applications',
    thesis:
      'Cross-industry AI patterns ship faster than industry-specific ones, but the value is the inverse — vertical specificity is what makes a pattern stick. Clinical AI, commodity trading AI, predictive maintenance, and retail merchandising each have failure modes the cross-industry pattern catalog misses.',
    whatIndustryGetsWrong:
      "Generic AI capabilities are deployed into specialized contexts without industry-specific validation. The clinical decision-support tool that worked in two specialty clinics fails at network rollout because the workflow friction the pilot environment didn't see compounds with case mix the pilot cohort didn't carry. The fraud-detection model that calibrated on top-quartile risk classes drifts on long-tail.",
    whatGoodLooksLike:
      'Industry-specialized patterns become first-class entries in the corpus, with vertical-specific evidence requirements at P1 and sector-specific KPIs at P5. The corpus patterns `pattern_ambient_clinical_value_chain`, `pattern_commodity_trading_ai`, `pattern_predictive_maintenance_modernization`, and `pattern_owned_brand_margin_recovery` each declare their `industryVariants`; AbarVa surfaces vertical-specific anti-patterns during conversation.',
    associatedPatternIds: [
      'pattern_ambient_clinical_value_chain',
      'pattern_commodity_trading_ai',
      'pattern_predictive_maintenance_modernization',
      'pattern_owned_brand_margin_recovery',
    ],
    associatedFailureModeIds: [],
    exampleProgramArchetypes: [
      'Clinical AI deployment',
      'Industrial AI rollout',
      'Retail merchandising AI',
      'Trading AI commercialization',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    topicId: 'talent-and-skills',
    title: 'Talent and skills',
    thesis:
      'AI staffing fails most often as a roles problem disguised as a recruiting problem. Most enterprises understaff against the pattern not because they cannot find the people but because they did not know what the pattern required. The corpus carries that knowledge per archetype; the platform surfaces the team the program needs at P0, not at P5.',
    whatIndustryGetsWrong:
      "The team is named on availability, not pattern fit. The technical lead is solid but has never run an AI program at production scale; the SME is a 25%-time loaner; the data engineer reports to a director with a different priority list. By P3 Design the program is asking questions nobody on the named team can answer.",
    whatGoodLooksLike:
      'Each pattern in the corpus declares `smesNeeded[]` per phase per archetype. The Phase 0 primer renders the team the program actually needs and gates advance until those roles are named with real allocations. Patterns `pattern_senior_bench_decay`, `pattern_ai_led_pdlc`, `pattern_specification_debt_multiplication`, and `pattern_context_as_code_underinvestment` carry engineering-operating-model staffing discipline.',
    associatedPatternIds: [
      'pattern_senior_bench_decay',
      'pattern_ai_led_pdlc',
      'pattern_specification_debt_multiplication',
      'pattern_context_as_code_underinvestment',
    ],
    associatedFailureModeIds: [4],
    exampleProgramArchetypes: [
      'AI talent strategy',
      'Engineering operating model',
      'AI literacy program',
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },
] as const;

// ── Helper accessors ──────────────────────────────────────────────────────────

/** Look up a topic by its topicId. */
export function getTopicById(id: string): TopicEntry | null {
  return J1_TOPICS.find((t) => t.topicId === id) ?? null;
}

/**
 * All topics whose `associatedFailureModeIds[]` includes the given
 * failure mode id. Used by the enhanced J1 failure-mode page to
 * render a "Related topics" section.
 */
export function getTopicsByFailureModeId(
  failureModeId: number,
): TopicEntry[] {
  return J1_TOPICS.filter((t) =>
    t.associatedFailureModeIds.includes(failureModeId),
  );
}

/**
 * Total associated-pattern count across all topics. Used by
 * /intelligence/topics page-level depth signal.
 */
export function getTotalAssociatedPatternCount(): number {
  return J1_TOPICS.reduce(
    (acc, topic) => acc + topic.associatedPatternIds.length,
    0,
  );
}

/**
 * Failure-mode names for a topic's associatedFailureModeIds[].
 * Returns the canonical names from FAILURE_MODES, in the order the
 * IDs appear on the topic. Used by the topic deep-dive renderer.
 */
export function getFailureModeNamesForTopic(topic: TopicEntry): string[] {
  return topic.associatedFailureModeIds
    .map((id) => FAILURE_MODES.find((m) => m.id === id)?.name ?? null)
    .filter((name): name is string => name !== null);
}
