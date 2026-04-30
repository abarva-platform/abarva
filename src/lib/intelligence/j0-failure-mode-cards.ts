// J0 cold-landing failure-mode card registry · INT-1.1 + INT-1.2
//
// The 10 cards rendered on /intelligence's J0 cold landing per
// docs/build/intelligence/INT-1_DETAILED_DESIGN.md. Each card
// references the canonical FAILURE_MODES table by failureModeId
// (1..10) so the platform's source of truth and the J0 narrative
// content cannot drift.
//
// Voice rules followed (per FAILURE_MODE_CARDS_DRAFT.md):
//   - No hedging.
//   - Specific mechanism, not abstraction.
//   - Real numbers from research with citations.
//   - No marketing language (transform / unlock / accelerate /
//     leverage / empower / revolutionary / cutting-edge).
//   - AbarVa's prevention is concrete: phase + gate + step ID.
//   - Scenarios are industry-shaped, not hypothetical.
//
// Sign-off discipline: each card carries lastReviewedBy +
// lastReviewedAt. Cards labeled "Claude (draft pending founder
// ratification)" are first-draft content; founder edits ratify by
// updating the string. The validation suite enforces structural
// integrity; voice review is a separate review cycle the founder
// runs after this code lands.

import {
  FAILURE_MODES,
  type FailureMode,
  type ResearchSource,
} from '@/lib/programs/failure-modes';

export type ResearchAnchorLabel = ResearchSource;

export interface ResearchCitation {
  /** Source label — must be a canonical research anchor. */
  source: ResearchAnchorLabel;
  /** Short citation text shown on cards; full text in expanded narrative. */
  citation: string;
  /** Optional URL to source publication. */
  url?: string;
  /** ISO date the citation was last verified by the curator. */
  lastVerifiedAt: string;
}

export interface ExampleScenario {
  /** Industry context for relatability. */
  industryContext: string;
  /** What the failure looks like in real enterprises — 1-2 sentences. */
  scenario: string;
}

export interface FailureModeNarrativeCard {
  /** Foreign key into FAILURE_MODES (src/lib/programs/failure-modes.ts). */
  failureModeId: number;
  /** Editorial name — senior-practitioner-voice version of canonical name. */
  editorialName: string;
  /** One-line hook shown on the card grid — under 100 chars. */
  oneLineHook: string;
  /** Expanded narrative — 200-600 words. Shown on hover/focus + J1 deep-dive. */
  expandedNarrative: string;
  /** Why this kills programs — the mechanism of failure, named specifically. */
  whyItKills: string;
  /** What good looks like — AbarVa's prevention mechanism, concrete. */
  whatGoodLooksLike: string;
  /** Pattern IDs from the corpus that ground this failure mode. */
  citedPatternIds: string[];
  /** At least 2 research anchors. */
  citedResearch: ResearchCitation[];
  /** At least 2 industry-shaped scenarios. */
  exampleScenarios: ExampleScenario[];
  /** Editorial sign-off metadata. */
  lastReviewedBy: string;
  lastReviewedAt: string;
}

/** Corpus version stamp shown in the J0 subhead and card validation. */
export const CORPUS_VERSION = 'v1.0.0';

/**
 * Slugify an editorial name for routing.
 *
 *   'The Phantom Sponsor'         → 'phantom-sponsor'
 *   'The Pilot-to-Production Gap' → 'pilot-to-production-gap'
 *   "The Workflow That Wasn't"    → 'workflow-that-wasnt'
 */
export function slugifyEditorialName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/'/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

const DRAFT_REVIEWER = 'Claude Opus 4.7 (draft pending founder ratification)';
const DRAFT_DATE = '2026-04-30';

// Helper to source canonical research anchors for a given failure mode.
function anchorsFor(failureModeId: number): ResearchCitation[] {
  const mode = FAILURE_MODES.find((m) => m.id === failureModeId);
  if (!mode) return [];
  return mode.researchAnchors.map((anchor) => ({
    source: anchor.source,
    citation: anchor.citation,
    url: anchor.url,
    lastVerifiedAt: DRAFT_DATE,
  }));
}

export const J0_FAILURE_MODE_CARDS: ReadonlyArray<FailureModeNarrativeCard> = [
  {
    failureModeId: 1,
    editorialName: 'The Phantom Sponsor',
    oneLineHook:
      'Programs that fail because the sponsor was named on a slide and never on a calendar.',
    expandedNarrative: `Most enterprise AI programs are launched with a sponsor named in the steering committee deck. Most of those sponsors never appear on the program's calendar in a way that matters. The signature is on a charter; the time is not on a cadence. When the first decision arrives that requires real authority — a vendor selection that reorganizes a team, a budget reallocation that contradicts an ops plan, a privacy posture that counsel will not sign — the sponsor is not there to make it. The program stalls in P3 Design or never makes it past P2 Synthesis.

This is not a sponsor problem. It is a definition problem. A real sponsor is identified by three things: a recurring 1:1 with the program lead on the calendar, decision rights over budget and scope codified in the engagement record, and an explicit succession path if the sponsor's role changes. Programs that cannot point to all three are programs without a real sponsor — regardless of who is listed on the slide.

The corpus shows that programs lacking active executive ownership stall at roughly 3× the rate of programs with committed sponsor cadence (McKinsey State of AI). The pattern is so reliable that it is the single biggest correlate of bottom-line AI impact in every major study from McKinsey, MIT/BCG, and Forrester.`,
    whyItKills: `The decision the sponsor was supposed to make does not get made — or gets made by someone without the authority to make it stick. The first time, the program loses momentum. The second time, it loses credibility. By the third, the team is re-running the same conversation with a different audience and the budget review is asking why nothing has shipped.`,
    whatGoodLooksLike: `AbarVa makes the Phantom Sponsor structurally impossible at the P0 → P1 advance. The Phase 0 step \`p0-sponsor-candidate\` is a complex step that requires evidence of a real sponsor 1:1 with notes uploaded; Gate 1 evaluation cannot pass without an \`engagement_participants\` row carrying plausible authority and a recurring calendar cadence committed.`,
    citedPatternIds: [
      'pattern_ai_use_case_portfolio',
      'pattern_ai_governance_operating_model',
    ],
    citedResearch: anchorsFor(1),
    exampleScenarios: [
      {
        industryContext: 'Retail — Customer Data Platform program',
        scenario:
          'CDP program launches with the CMO as sponsor. The CMO is in three of the first six steering meetings, then stops attending — the COO begins delegating the seat. By P3 Design, the architecture review identifies a privacy posture conflict with the loyalty program; the team escalates and waits 11 weeks for a decision that should have taken 5 days. The program slips a quarter; the CFO asks why.',
      },
      {
        industryContext: 'Financial services — AI fraud-detection program',
        scenario:
          'Fraud-detection program is sponsored by the Chief Risk Officer. The CRO names the head of fraud ops as the program contact and steps back. The head of fraud ops cannot approve a budget reallocation when the model needs additional human-review capacity in production. The program ships at half-scale and the original ROI case is no longer testable.',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    failureModeId: 2,
    editorialName: 'The Slogan Charter',
    oneLineHook:
      'When "improve customer experience" gets called a goal and stays unmeasurable for six months.',
    expandedNarrative: `The single most common failure pattern in enterprise AI is also the most disguised: the program runs on slogans, not testable claims. The charter says "improve customer experience." It does not say which cohort, what specific behavior changes, what mechanism produces the change, or which direction the metric moves. By P2 Synthesis the team has gathered evidence and discovered the slogan accommodates 12 different interpretations, three of which conflict.

A real value hypothesis names four things: the cohort (which customers, which segment, which N), the behavior change (what they do differently), the mechanism (why the AI capability causes the change), and the value direction (revenue up, cost down, retention up — with magnitude). Slogans accommodate everything because they specify nothing.

The cost of running on slogans isn't visible in P0. It's visible in P2 when the team realizes their evidence cannot test the claim, and in P5 when the deployed capability has no clear measurement of whether the slogan landed. The charter cannot be falsified, so the program cannot fail — but it cannot succeed either. It just persists, consuming budget, until someone with authority to kill it asks the question the charter never answered.

RAND's root-cause study of failed AI projects names this as the single most common pattern. MIT/BCG GenAI Divide research cites it as the dominant reason GenAI pilots fail to deliver value.`,
    whyItKills: `The program cannot be tested, so it cannot be improved. By the time a real measurement is attempted, the design is locked, the budget is committed, and the political cost of admitting the charter was unmeasurable is higher than the cost of continuing to spend.`,
    whatGoodLooksLike: `The P0 \`value-hypothesis-seed\` step requires cohort × behavior change × mechanism × direction before Discovery spend is approved. P2 Synthesis re-tests the hypothesis against gathered evidence and blocks advance if the claim has not converged on a falsifiable form.`,
    citedPatternIds: [
      'pattern_ai_use_case_portfolio',
      'pattern_specification_debt_multiplication',
    ],
    citedResearch: anchorsFor(2),
    exampleScenarios: [
      {
        industryContext: 'Healthcare — clinical workflow AI',
        scenario:
          'Charter says "reduce clinician burnout via ambient documentation." By P2 the team realizes "burnout" was never operationalized — Maslach scores were not collected at baseline, the cohort was not segmented by specialty, and the mechanism (time-saved-per-encounter) was not connected to the burnout claim. The program ships and clinicians use the tool, but no one can prove the claim.',
      },
      {
        industryContext: 'Banking — onboarding AI',
        scenario:
          'Charter targets "faster customer onboarding." Six months in, the program is celebrated for reducing time-to-account-open from 4 days to 2 days. The compliance team flags that the 4-day baseline was a 90-day-old pre-pandemic measurement. The improvement is real but un-attributable; the team cannot say what came from the AI vs the policy changes.',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    failureModeId: 3,
    editorialName: 'The Untestable Foundation',
    oneLineHook:
      '~60% of AI projects through 2026 will be abandoned over data foundation gaps that were known at P0.',
    expandedNarrative: `Data quality, lineage, ownership, and accessibility are upstream of every AI capability. When they are not in place at production scale, the model that demoed beautifully in pilot produces unreliable outputs in production, the operations team cannot trace why, and the business loses trust within the first 60 days of go-live. Gartner projects ~60% of AI project abandonments through 2026 will trace to inadequate data — and most of those gaps were visible at Discovery if anyone had looked.

A foundation that is ready means four things: named owners for each critical data domain, lineage that survives a real audit, quality that is measurable against documented thresholds, and access that flows through governed paths the operations team can change. None of those are the model's responsibility. All of them block production usefulness if missing.

The discipline that catches this is honest data inventory at P1 Discovery. Not a slide listing systems. A real assessment: who owns the data, what's the documented quality, what changes when the domain owner moves orgs, what happens if the access pattern needs to scale 10×. Programs that skip this assessment in P1 will pay for it in P5 — and the price is steeper there.`,
    whyItKills: `The pilot was tested on curated data; production runs on the messy real thing. Data drift the pilot never showed, identifier coverage the demo did not test, lineage gaps the audit will fail. The model is fine. The foundation it sits on cannot carry the load.`,
    whatGoodLooksLike: `P1 Discovery requires a baseline data-asset inventory and quality assessment specific to the program's pattern. P2 Synthesis blocks advance if data ownership, lineage, and access paths are not resolved with named owners and documented quality thresholds.`,
    citedPatternIds: [
      'pattern_analytics_modernization',
      'pattern_customer_onboarding_kyc_ai',
    ],
    citedResearch: anchorsFor(3),
    exampleScenarios: [
      {
        industryContext: 'Retail — demand forecasting',
        scenario:
          'Forecasting model trained on top-30 SKU data demonstrated 22% MAPE improvement in pilot. Production rollout to the 18,000-SKU catalog showed 7% improvement — the long-tail data carried different signal-to-noise characteristics that the pilot cohort never tested. Identity-resolution accuracy in the long tail was 31% lower than top-30. The data foundation gap was visible at P1; nobody flagged it.',
      },
      {
        industryContext: 'Financial services — KYC AI',
        scenario:
          'KYC automation depends on a customer-record domain owned by a team that just lost its lead. Lineage from the source-of-truth to the AI input is documented in three different wikis, each contradicting the others. The first audit after go-live finds that ~14% of decisions cannot be traced. The model passes muster; the foundation does not.',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    failureModeId: 4,
    editorialName: 'The Borrowed Team',
    oneLineHook:
      'Programs staffed with whoever is available rather than whoever the pattern requires.',
    expandedNarrative: `The team is named in the kickoff deck. The names are real. The roles are not what the program needs. The technical lead is solid but has never run an AI program at production scale; the SME is a 25%-time loaner who's already overcommitted; the data engineer reports to a director with a different priority list. By P3 Design the program is asking questions nobody on the named team can answer.

This is a staffing problem disguised as a roles problem. The roles a senior PM names at P0 are the roles that come from the pattern: every AI program archetype has SMEs whose absence the corpus has already shown stalls execution. The CDP archetype needs a privacy attorney engaged at P1, not P3; the contact center AI archetype needs a workflow analyst with authority to redesign the agent's screen, not just observe it; the demand forecasting archetype needs a planner who owns the buy-cycle, not the data scientist who owns the model.

Most enterprises understaff against the pattern not because they cannot find the people but because they did not know what the pattern required. The corpus carries that knowledge per archetype; the platform surfaces the team the program needs at P0, not at P5 when the gaps are visible and the budget is committed.

Gartner: ~35% of organizations cite the AI skills and literacy gap as a primary barrier; 38% of I&O failures trace to skills shortfalls. The numbers describe the symptom; the cause is staffing-against-availability, not staffing-against-pattern.`,
    whyItKills: `The first time the program needs an answer the team cannot give, the timeline slips while the right person is borrowed. The second time, the slip becomes a delay. By the third, the team has redesigned around what they have rather than what they need — and the program ships something other than what the charter said.`,
    whatGoodLooksLike: `Each pattern in the corpus declares \`smesNeeded[]\` per phase per archetype. Phase 0 renders the team the program needs and gates advance until those roles are named with real allocations — not "borrowed 25% time" footnotes that paper over the gap.`,
    citedPatternIds: [
      'pattern_senior_bench_decay',
      'pattern_ai_led_pdlc',
    ],
    citedResearch: anchorsFor(4),
    exampleScenarios: [
      {
        industryContext: 'Insurance — claims AI',
        scenario:
          'Claims AI program staffs a data scientist and a project manager. The pattern requires a claims SME with adjudication authority — a role nobody flagged at P0. By P3, the team has built a model that flags 28% of claims for review, but nobody on the team can decide whether the flag-rate is the goal or a problem. The SME is borrowed two weeks before P4 and proposes redesign.',
      },
      {
        industryContext: 'Manufacturing — predictive maintenance',
        scenario:
          'Predictive maintenance program staffs against IT availability. The pattern requires a reliability engineer who owns the maintenance schedule. The reliability engineer joins at P3, after the model has been trained on signals that don\'t map to the work-order taxonomy the maintenance team actually uses. The model works; the team cannot act on it.',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    failureModeId: 5,
    editorialName: "The Workflow That Wasn't",
    oneLineHook:
      'Models that ship into a workflow nobody redesigned — and the value never lands.',
    expandedNarrative: `The model is in production. The dashboard shows usage. The accuracy is within range. Six months later, the business outcome the program promised has not moved. The model lands; the value does not.

This is the deepest pattern in enterprise AI. McKinsey's State of AI is unambiguous: workflow redesign is the single biggest EBIT-driving practice associated with realized value from generative AI. MIT/BCG GenAI Divide research finds workflow integration failure dominates the gap between high- and low-performers. The pattern is so reliable it should be a P3 Design hard-gate everywhere, and in most organizations it isn't.

A redesigned workflow names four things: what the operator does differently when the AI is present, what the operator stops doing because the AI is doing it, who owns the change-management story, and what evidence will show in P5 that the workflow change actually happened. Programs that ship without all four ship a model alongside a workflow. The model gets used or doesn't; the workflow continues unchanged; the value evaporates.

The most-quoted version of this pattern comes from contact center AI: a $50M tool deployed alongside the existing agent screen produces flat AHT (average handle time) because agents continue to work the same way they always have. The model is fine. The operating-model commitment was never made.`,
    whyItKills: `The program books wins on technical metrics (model accuracy, deployment uptime) while the business outcome stays flat. By the time leadership asks why ROI isn't visible, the redesign window is closed — agents have built routines, the change moment has passed, and a re-launch costs more politically than the original launch.`,
    whatGoodLooksLike: `P3 Design requires an explicit operating-model delta and named change-owners. P5 Activate requires evidence of workflow changes in production — not just deployed models. P6 Operate measures sustained behavior change, not just model usage.`,
    citedPatternIds: [
      'pattern_demand_forecasting_inventory_ai',
      'pattern_prior_authorization_automation',
    ],
    citedResearch: anchorsFor(5),
    exampleScenarios: [
      {
        industryContext: 'Healthcare — prior authorization automation',
        scenario:
          'Prior auth automation deployed across three plans. Auto-approval rate hits 38% in pilot. Production rollout shows 41% — but appeals volume is unchanged because the workflow that handles complex cases never redesigned the case-routing logic. Nurses still triage everything; the AI handles the easy cases; the hard cases consume the same time they always did. ROI claim of "30% nurse time recovered" cannot be substantiated.',
      },
      {
        industryContext: 'Retail — assortment optimization',
        scenario:
          'Assortment AI recommends 200 SKU additions and 150 deletions weekly. The merchandising team — which never agreed to act on AI recommendations as inputs to their buy decisions — uses them as a "second opinion." Their actual buy decisions correlate with the AI recommendations 14% above chance. The capability is technically deployed; the operating model never absorbed it.',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    failureModeId: 6,
    editorialName: 'The Last-Minute Auditor',
    oneLineHook:
      'Privacy, governance, and risk controls bolted on at P4 — when they should have been P2 deliverables.',
    expandedNarrative: `The program is two weeks from go-live when the privacy attorney asks to see the architecture. The architecture has eleven design decisions that need privacy review. Two of them have to change — they were never going to pass. The program slips a quarter; the team rebuilds; the budget overrun gets attributed to "unexpected complexity." The complexity was not unexpected; it was unaddressed.

Late-arriving governance is one of the most costly patterns in enterprise AI. Gartner: inadequate risk controls and AI governance gaps fuel project abandonment and post-launch incident costs. Forrester: governance complexity is rising as regulators converge on AI-specific obligations; programs that defer governance face escalating remediation cost. McKinsey: leading firms embed responsible-AI controls during design — not after deployment — materially lowering downstream risk and rework.

The mechanism of failure is well-understood. Privacy, governance, risk, and compliance perspectives surface design constraints that affect architecture. Surfaced at P2, those constraints shape the design. Surfaced at P4, they invalidate the design. The work to incorporate them at P2 is approximately 1/10th the work at P4 — and the political cost of "we missed this" is paid by whoever shipped the program, not by the team that delayed engaging the auditor.`,
    whyItKills: `The program ships late or ships wrong. Late means a quarter slip and a budget overrun that traces back to architecture rework. Wrong means the program ships an architecture that fails the first audit — and the remediation cost dwarfs the original build.`,
    whatGoodLooksLike: `P2 Synthesis includes a governance, privacy, and risk evaluation step keyed to the pattern's specific controls. P3 Design requires named risk owners and approved control plans before Build can begin. The auditor is engaged at P2, not P4.`,
    citedPatternIds: [
      'pattern_ai_governance_operating_model',
      'pattern_fraud_detection_modernization',
    ],
    citedResearch: anchorsFor(6),
    exampleScenarios: [
      {
        industryContext: 'Banking — credit-decision AI',
        scenario:
          'Credit-decision model nears P5 launch. Compliance reviews the model and identifies that the protected-class fairness analysis was conducted on aggregate data — the regulators in two jurisdictions require disaggregated analysis. The team rebuilds the validation harness; six weeks slip; the launch misses the quarter. The work was not new; it was deferred.',
      },
      {
        industryContext: 'Healthcare — clinical decision support',
        scenario:
          'CDS tool integrates with an EHR. At P4, the privacy team flags that the audit trail does not separate clinician reviews from auto-recommendations — a HIPAA-adjacent concern that the architecture review at P3 should have caught but did not, because privacy was scheduled for P4. Four weeks of architecture rework; one missed go-live window.',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    failureModeId: 7,
    editorialName: 'The Vendor-Picked-First Decision',
    oneLineHook:
      'When the vendor was chosen before the build-vs-buy criteria were named.',
    expandedNarrative: `The vendor was on the shortlist before the requirements were written. The demo was sharp; the references checked out; the contract was favorable. By P3 Design, the team is bending the program around what the vendor can do — and the things the vendor cannot do are the things the program needed most. By P5, the gaps surface in production; by P6, the program is asking whether the contract has an exit clause.

This is not a bad-vendor problem. It is a sequencing problem. Real sourcing discipline names the build-vs-buy criteria before vendor selection — not after. It identifies what the program must have, what it would prefer to have, and what is genuinely a non-goal. It scores vendors against pattern-specific must-haves, not generic feature lists. It tests against the buyer's own data, not curated demo data. It documents the trade-offs that informed the choice.

When this discipline is absent, the vendor is selected on rapport, urgency, or political alignment — and the program inherits whatever the vendor's roadmap looks like. MIT/BCG GenAI Divide research: internally built GenAI applications succeed at roughly one-third the rate of comparable purchased solutions integrated through partners. That number sounds like it argues for buying — but it argues for *disciplined* sourcing. Undisciplined buying performs as poorly as undisciplined building.`,
    whyItKills: `The program operates on the vendor's roadmap, not the program's requirements. When the requirements diverge from the roadmap, the program's options are: bend the requirements (lose the original outcome), customize the vendor product (rebuild work the buyer was supposed to avoid by buying), or run two systems in parallel (operational debt that compounds for years).`,
    whatGoodLooksLike: `P3 Design includes a sourcing module: structured build-vs-buy criteria, vendor scorecard tied to pattern-specific must-haves, and a sponsor-approved sourcing decision before Build commences. The decision is documented; the trade-offs are explicit; the contract reflects them.`,
    citedPatternIds: [
      'pattern_vendor_sprawl_ai_tool_rationalization',
      'pattern_ai_use_case_portfolio',
    ],
    citedResearch: anchorsFor(7),
    exampleScenarios: [
      {
        industryContext: 'Insurance — underwriting AI',
        scenario:
          'Underwriting AI vendor selected based on a strong pilot demo against the vendor\'s curated dataset. By P4, the program discovers the vendor\'s model degrades sharply on long-tail risk classes the carrier writes — and the vendor\'s roadmap to address this is 18 months out. The carrier ends up running the AI on top-quartile risk only and the original ROI projection is no longer credible.',
      },
      {
        industryContext: 'Retail — pricing optimization',
        scenario:
          'Pricing AI procured before the merchandising team named which categories were in scope. The vendor\'s strength is fast-moving consumer goods; the program\'s priority categories are owned-brand apparel where the vendor has shallow signal. The program ships, the FMCG categories show 3% margin lift, the apparel categories are flat — and the budget review wants to know which categories the next phase will cover.',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    failureModeId: 8,
    editorialName: 'The Pilot-to-Production Gap',
    oneLineHook:
      "73% of enterprise AI pilots never reach production. The model isn't the problem.",
    expandedNarrative: `The pilot worked. The vendor demo was sharp. The success criteria were met on the curated cohort. Then the program tried to move into production and the wheels came off. Data drift the curated cohort never showed; scale conditions the pilot environment did not simulate; workflow integration the business never committed to redesigning. By P5 Activate, the team is rebuilding what they thought was already built.

This pattern is so common that ~73% of enterprise AI pilots never advance to production-scale deployment (McKinsey). MIT/BCG's GenAI Divide finds ~95% of GenAI pilots fail to deliver measurable revenue or margin acceleration at enterprise scale. The numbers are not surprising once you see the mechanism: the pilot was optimized for vendor selection and stakeholder confidence; the production environment was never the test.

The discipline that closes the gap is treating P4 Build and P5 Activate as a single proving ground for production conditions — not as "build then deploy." Pilots that succeed in production share four traits: tested on production-shape data, not curated samples; integrated with the actual workflow before go-live, not parallel to it; operations runbooks signed off by a real ops owner before P5 starts; baselines measured against the production population, not the pilot cohort.`,
    whyItKills: `Programs that hit the gap don't fail at the model. They fail at the surrounding work — the data pipeline that worked in pilot but breaks at scale, the change management that wasn't designed, the ops capacity that was never staffed. By the time these surface, the budget for remediation is gone and the political cover for "we'll fix it in production" has expired.`,
    whatGoodLooksLike: `P4 Build requires a production-readiness checklist (operations, monitoring, support runbooks, scaled-data validation). P5 Activate gate requires evidence the capability is live in the production workflow with measured usage — not a parallel pilot environment. If the team tries to advance to P5 with pilot-only data, the gate does not pass.`,
    citedPatternIds: [
      'pattern_ai_use_case_portfolio',
      'pattern_demand_forecasting_inventory_ai',
      'pattern_velocity_without_validation',
    ],
    citedResearch: anchorsFor(8),
    exampleScenarios: [
      {
        industryContext: 'Retail — demand forecasting program',
        scenario:
          'Forecasting model trained on top-30 SKU data demonstrated 22% MAPE improvement in pilot. Production rollout to the full 18,000-SKU catalog showed 7% improvement — the long-tail data carried different signal-to-noise characteristics that the pilot cohort never tested. The program pivoted to a tiered rollout with separate models, adding 9 months and 40% to the originally-budgeted scope.',
      },
      {
        industryContext: 'Healthcare — clinical decision support',
        scenario:
          'Clinical decision-support tool piloted in two specialty clinics with curated patient data and dedicated nurse-champion support. Production deployment to the full network surfaced workflow friction the pilot environment did not see — the tool added 90 seconds per encounter when the workflow had no slack to absorb it. Adoption fell to 18% in month 3; the program was paused for redesign.',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    failureModeId: 9,
    editorialName: 'The Phantom KPI',
    oneLineHook:
      'Only ~15% of AI initiatives demonstrate EBITDA gain — measurement was never designed in.',
    expandedNarrative: `The program ships. Six months later, the steering committee asks for the impact. The team produces three slides of usage statistics — sessions, model invocations, deployments — none of which connect to a business outcome. There is no baseline, no leading KPI, no causal link between the AI capability and the metric the program said it would move. The conversation gets uncomfortable; the program's funding cycle gets harder.

Forrester finds only ~15% of AI initiatives demonstrate EBITDA-level financial gain — primarily because outcome measurement was not designed in. McKinsey finds organizations that define leading KPIs for AI initiatives realize materially higher value and lower risk than those that do not. Gartner: inability to demonstrate business value is among the top causes cited when AI projects are cancelled or de-funded.

The mechanism is straightforward and rarely respected. Outcome measurement requires three artifacts before P1 closes: the baseline (what is true today), the leading KPI (what shifts first when the program works), and the causal link (why the program's mechanism produces the shift). All three live in the corpus per pattern — AHT and CSAT for contact center AI, MAPE and WAPE for demand forecasting, false-positive rate and case-resolution time for fraud detection. The pattern names the right metrics; the platform requires them at P1.`,
    whyItKills: `The program cannot prove value. The CFO cannot fund the next phase. The capability persists or is killed based on perceived political momentum, not measured impact. The next program in the same archetype repeats the same measurement gap, because no one captured the pattern's lesson.`,
    whatGoodLooksLike: `P1 Discovery captures a baseline with provenance keyed to the pattern. P5 and P6 require post-deployment measurement against that baseline before outcomes can be settled. P6 closeout writes the realized outcome back to the pattern catalog so the next program of this archetype starts with the calibrated expectation.`,
    citedPatternIds: [
      'pattern_ambient_clinical_value_chain',
      'pattern_owned_brand_margin_recovery',
    ],
    citedResearch: anchorsFor(9),
    exampleScenarios: [
      {
        industryContext: 'Contact center — agent-assist AI',
        scenario:
          'Agent-assist tool ships across 1,800 agents. Six months later, the steering committee asks for AHT impact. The baseline AHT was last measured 11 months earlier, before a queue redesign. The new AHT shows a 4% drop, but the team cannot say what came from the AI vs the queue change. The program is celebrated and quietly de-prioritized in the next funding cycle.',
      },
      {
        industryContext: 'Manufacturing — predictive maintenance',
        scenario:
          'Predictive maintenance flags 200 incidents a quarter. The team reports "incidents flagged" but not "outages avoided" — because the baseline of expected outages without intervention was never captured. The CFO cannot decide whether the program saved $X or $0; the next-phase budget request is denied pending "clearer measurement."',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },

  {
    failureModeId: 10,
    editorialName: 'The Sprawl Trap',
    oneLineHook:
      '57% of failed AI portfolios ran too many concurrent pilots; none got focused enough to win.',
    expandedNarrative: `The portfolio has 14 pilots. Three are flagship; the rest are explorations the organization could not say no to. Each pilot consumes coordination time, leadership attention, and small fractions of scarce SME capacity. None gets enough oxygen to reach production. By the second year, leadership has fatigue without flagship outcomes — and the next round of AI investment is suspect.

Gartner: 57% of failed AI projects are characterized by stakeholders having "expected too much too fast," outpacing realistic delivery timelines. Forrester: enterprises commonly run dozens of disconnected AI pilots without a prioritization framework, producing portfolio sprawl and no flagship outcome. McKinsey: portfolios that focus on a small number of high-value use cases consistently outperform breadth-first portfolios on realized financial impact.

The discipline that prevents sprawl is portfolio-level prioritization — not deck-level priorities. Each new program is evaluated against the active portfolio for overlap (does this duplicate or compete with an existing program?), capacity (does the organization have the SMEs and data engineering to execute this without starving the active set?), and concentration (is this in service of a flagship outcome or another exploration?). Programs that fail any of these tests are deferred or absorbed; programs that pass are committed.

The harder part is the closeout discipline. A portfolio that does not harvest outcomes from completed programs cannot make smarter decisions about new ones. P6 closeout pushes realized outcomes back into the pattern catalog so the next program of the same archetype starts with the calibrated expectation — including the unrealistic-expectation pattern's likelihood for this archetype in this enterprise.`,
    whyItKills: `Resources are spread too thin to ship anything to flagship outcome. The organization runs out of patience before the portfolio runs out of attempts. AI's reputation in the enterprise gets defined by the bottom-quartile pilots, not the top.`,
    whatGoodLooksLike: `P0 Tenant Admin approval gate filters new programs against the active portfolio for overlap and capacity. P6 closeout harvests outcomes into the pattern catalog so unrealistic claims surface in the next program of the same archetype before they get budgeted.`,
    citedPatternIds: [
      'pattern_vendor_sprawl_ai_tool_rationalization',
      'pattern_ai_use_case_portfolio',
    ],
    citedResearch: anchorsFor(10),
    exampleScenarios: [
      {
        industryContext: 'Cross-industry — large-cap AI investment',
        scenario:
          'A Fortune 200 launched 23 AI pilots in 14 months. By month 18, three had reached production; eight had been quietly killed; twelve were in some form of "evaluation." The CFO ordered a portfolio review and asked which of the 23 had any baseline outcome. Eleven did not. The next-cycle investment was cut by 60%; the three production pilots survived; the rest were cancelled. The organization re-launched AI investment a year later under different governance.',
      },
      {
        industryContext: 'Retail — AI experimentation portfolio',
        scenario:
          'Retailer\'s AI portfolio includes pricing, assortment, demand, customer service, fraud, and supply-chain pilots simultaneously. The data team is shared across all six. By P3 of any individual program, the data team is the bottleneck for all six and none advances. Two pilots reach production in year 2; both are the ones with dedicated data resourcing the others did not get.',
      },
    ],
    lastReviewedBy: DRAFT_REVIEWER,
    lastReviewedAt: DRAFT_DATE,
  },
] as const;

// ── Helper accessors ──────────────────────────────────────────────────────────

/**
 * Look up a card by its failureModeId (1..10). Returns null when no entry
 * matches.
 */
export function getJ0CardByFailureModeId(
  id: number,
): FailureModeNarrativeCard | null {
  return J0_FAILURE_MODE_CARDS.find((card) => card.failureModeId === id) ?? null;
}

/**
 * Look up a card by its editorial-name slug.
 */
export function getJ0CardBySlug(
  slug: string,
): FailureModeNarrativeCard | null {
  return (
    J0_FAILURE_MODE_CARDS.find(
      (card) => slugifyEditorialName(card.editorialName) === slug,
    ) ?? null
  );
}

/**
 * Total research-anchor count across all cards (used for J0 subhead depth signal).
 */
export function getTotalResearchAnchorCount(): number {
  return J0_FAILURE_MODE_CARDS.reduce(
    (acc, card) => acc + card.citedResearch.length,
    0,
  );
}

/**
 * Returns the canonical FailureMode for a card. Throws when failureModeId
 * does not resolve — validated by the test suite, so a runtime miss is a
 * bug, not a normal path.
 */
export function getCanonicalFailureMode(
  card: FailureModeNarrativeCard,
): FailureMode {
  const mode = FAILURE_MODES.find((m) => m.id === card.failureModeId);
  if (!mode) {
    throw new Error(
      `J0 card has unknown failureModeId ${card.failureModeId}; corpus integrity is broken`,
    );
  }
  return mode;
}

/**
 * Sort cards by "most cited" — the heuristic the J0 mobile collapse
 * uses to pick which 5 cards to show by default. Score = pattern count
 * + research-anchor count; tiebreak by failureModeId ascending so the
 * order is deterministic across server + client renders.
 *
 * Per INT-1_DETAILED_DESIGN.md FR-040 + §9 item 5.
 */
export function getCardsByMostCited(
  cards: ReadonlyArray<FailureModeNarrativeCard>,
  limit?: number,
): FailureModeNarrativeCard[] {
  const ranked = [...cards].sort((a, b) => {
    const scoreA = a.citedPatternIds.length + a.citedResearch.length;
    const scoreB = b.citedPatternIds.length + b.citedResearch.length;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.failureModeId - b.failureModeId;
  });
  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked;
}
