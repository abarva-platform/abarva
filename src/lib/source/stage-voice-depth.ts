/**
 * stage-voice-depth.ts
 *
 * Per-stage editorial depth registry for Source briefing agents.
 *
 * Each entry gives each agent a stage-specific angle/lens so that
 * briefings built at "strategy" vs "bafo" produce meaningfully
 * differentiated primaryFinding content rather than identical
 * label-swapped templates.
 *
 * F-M4-103: "Voice is stage-generic within agent. Nexus-at-Strategy and
 * Nexus-at-BAFO produce identical template content differing only by
 * label injection. Per-stage editorial depth missing."
 */

import type { SourceStageKey } from './types';

export interface StageVoiceDepthEntry {
  /** What Sentinel looks for / governs in this stage */
  sentinelFocus: string;
  /** What Nexus drives / orchestrates in this stage */
  nexusFocus: string;
  /** What Atlas synthesizes / advises in this stage */
  atlasFocus: string;
  /** What Steward governs / enforces in this stage */
  stewardFocus: string;
  /** 2–3 questions the stage must answer before it can advance */
  keyQuestions: string[];
  /** 2–3 signals that indicate the stage is at risk */
  riskSignals: string[];
}

/**
 * Canonical stage keys only (matches SOURCE_STAGE_ORDER). Legacy aliases
 * should be resolved with normalizeSourceStageKey before lookup.
 */
export const STAGE_VOICE_DEPTH: Partial<Record<SourceStageKey, StageVoiceDepthEntry>> = {
  strategy: {
    sentinelFocus:
      'Validate that the supplier landscape mapping is evidence-based and that make-vs-buy framing is grounded in IT context — not assumed. Flag thin scope anchors that could cause downstream scope creep.',
    nexusFocus:
      'Drive supplier landscape completeness, force a documented make-vs-buy position, and anchor the sourcing scope before any RFP work begins.',
    atlasFocus:
      'Synthesize the strategic rationale into an executive framing: what business outcome is being pursued, why external sourcing is the right lever, and what the value ceiling looks like.',
    stewardFocus:
      'Enforce that the strategy stage gate is not bypassed: make-vs-buy decision must be logged, scope anchor must be approved, and any assumed dependencies must be surfaced as risks.',
    keyQuestions: [
      'Is the make-vs-buy decision documented with supporting rationale?',
      'Is the supplier landscape mapped to a minimum viable shortlist?',
      'Is the sourcing scope anchored well enough to prevent RFP scope drift?',
    ],
    riskSignals: [
      'Scope defined by a single stakeholder with no cross-functional sign-off',
      'No identified supplier candidates — landscape mapping has not started',
      'Make-vs-buy assumed rather than evaluated with IT context data',
    ],
  },

  scope: {
    sentinelFocus:
      'Verify that scope boundaries are documented, that ambiguous requirements have been flagged, and that the minimum viable data request to suppliers is defensible.',
    nexusFocus:
      'Drive resolution of ambiguous scope items and ensure that any requirements carve-outs or inclusions are approved before the RFP package is assembled.',
    atlasFocus:
      'Synthesize the scope definition into a crisp executive statement of what is being sourced, what is explicitly out, and what the financial envelope looks like.',
    stewardFocus:
      'Enforce scope gate: no RFP can be released without an approved scope document and a confirmed evaluation framework outline.',
    keyQuestions: [
      'Is the scope boundary documented and signed off?',
      'Are there any unresolved scope items that could cause RFP misalignment?',
      'Is the evaluation framework outline defined enough to assess responses?',
    ],
    riskSignals: [
      'Scope document is draft with unresolved open items at gate review',
      'Key stakeholders have not reviewed or approved the scope boundary',
      'No evaluation framework outline exists before RFP is drafted',
    ],
  },

  rfp: {
    sentinelFocus:
      'Audit requirements quality — look for vague, untestable, or contradictory specifications that will produce incomparable responses. Validate that the evaluation rubric is designed before the RFP is issued.',
    nexusFocus:
      'Drive requirements gap resolution: missing SLA anchors, undefined evaluation criteria, and ambiguous pricing structures must be closed before the RFP is issued to suppliers.',
    atlasFocus:
      'Frame the RFP release as an investment decision: what are we asking suppliers to prove, and what evaluation outcome will justify the procurement spend?',
    stewardFocus:
      'Enforce that the RFP package passes specification-quality and completeness gates. Scorecard defaults must be set before supplier responses are invited.',
    keyQuestions: [
      'Are all requirements testable and unambiguous enough to produce comparable responses?',
      'Is the evaluation rubric defined and weighted before the RFP is issued?',
      'Are SLA anchors and pricing structure requirements clearly specified?',
    ],
    riskSignals: [
      'Evaluation criteria not defined before RFP is issued — scoring will be post-hoc and contested',
      'Requirements contain undefined terms or acceptance conditions',
      'Pricing structure requirements are absent or inconsistent across sections',
    ],
  },

  responses: {
    sentinelFocus:
      'Validate that all supplier responses have been received and that completeness checks have been run. Flag missing mandatory sections and identify responses that require clarification before scoring.',
    nexusFocus:
      'Orchestrate the response intake and completeness review. Drive missing-section follow-ups with vendors and ensure the response corpus is closed before evaluation begins.',
    atlasFocus:
      'Synthesize the response landscape for executive readout: how many viable candidates are in the pool, what the early differentiation looks like, and whether the field warrants a full evaluation cycle.',
    stewardFocus:
      'Enforce that evaluation does not start until response completeness is verified. Supplier-specific gaps must be logged as evidence items, not resolved informally.',
    keyQuestions: [
      'Have all invited suppliers submitted complete responses?',
      'Are mandatory sections present and sufficiently detailed for scoring?',
      'Have clarification requests been issued and tracked for incomplete responses?',
    ],
    riskSignals: [
      'Evaluation begins before response completeness check is closed',
      'Clarification requests issued but not tracked with supplier acknowledgment',
      'Only one complete response received — single-vendor evaluation risk',
    ],
  },

  evaluation: {
    sentinelFocus:
      'Assess comparative scoring integrity: check that scoring is criterion-level, that differentiator analysis is supported by response evidence, and that red flags in proposals are surfaced as evidence items rather than narrative assertions.',
    nexusFocus:
      'Drive the evaluation to a shortlist decision: surface differentiator gaps, escalate scoring disputes, and ensure that all red flags are assigned to an evidence-backed risk record.',
    atlasFocus:
      'Frame the comparative landscape for the executive: what separates the top-tier candidates, what the risk-adjusted value gap looks like, and what the preferred shortlist recommendation is.',
    stewardFocus:
      'Enforce that the scorecard is used consistently across all vendors and that scoring rationale is documented at the criterion level. No shortlist decision without scorecard evidence.',
    keyQuestions: [
      'Is each vendor scored at the criterion level with documented rationale?',
      'Are differentiator claims backed by specific response evidence?',
      'Have red flags been captured as evidence-backed risk records?',
    ],
    riskSignals: [
      'Scoring done holistically rather than criterion-by-criterion — contestable',
      'Red flags noted in narrative only, not linked to response evidence',
      'Evaluator bias signal: scores cluster tightly despite wide response variance',
    ],
  },

  pricing: {
    sentinelFocus:
      'Validate that pricing models are normalized for comparability — unit cost, total cost of ownership, and fee structure must be on a common basis. Flag pricing completeness gaps that prevent apples-to-apples comparison.',
    nexusFocus:
      'Drive pricing normalization: surface incomplete pricing submissions, coordinate with vendors on missing fee structures, and produce a normalized comparison view before BAFO negotiation begins.',
    atlasFocus:
      'Synthesize the pricing landscape into a TCO-anchored executive view: what the true cost range looks like, where the outliers are, and what the cost-versus-capability tradeoff is for the shortlist.',
    stewardFocus:
      'Enforce that pricing completeness is verified before BAFO is initiated. Incomplete pricing submissions must be flagged and tracked — not assumed to be equivalent.',
    keyQuestions: [
      'Are all pricing submissions complete enough for TCO comparison?',
      'Is pricing normalized to a common unit and contract structure?',
      'Are fee structures (implementation, license, support) consistently decomposed?',
    ],
    riskSignals: [
      'Pricing submitted in incompatible structures — normalization incomplete',
      'Material fee categories missing from one or more supplier submissions',
      'No TCO model — evaluation based on headline price only',
    ],
  },

  bafo: {
    sentinelFocus:
      'Validate that BAFO guidance is specific enough to drive commercial differentiation: concession targets, price improvement thresholds, and risk-adjusted value parameters must be defined, not left to vendor interpretation.',
    nexusFocus:
      'Drive commercial optimization in the BAFO cycle: surface below-threshold offers, track concession history, and ensure risk-adjusted value is recalculated after each round before decisions are made.',
    atlasFocus:
      'Frame the BAFO outcomes for executive decision: what commercial improvement was achieved, what the risk-adjusted value delta looks like versus the baseline, and what the recommended award position is.',
    stewardFocus:
      'Enforce that BAFO guidance is documented and that no award decision is made without a post-BAFO risk-adjusted value update. Concession strategy must be recorded as an evidence item.',
    keyQuestions: [
      'Is the BAFO guidance specific enough to drive meaningful commercial improvement?',
      'Is risk-adjusted value being recalculated after each BAFO round?',
      'Is the concession strategy documented with targets and limits?',
    ],
    riskSignals: [
      'BAFO guidance is vague — vendors will submit marginal improvements only',
      'Risk-adjusted value not recalculated after price changes — headline improvement only',
      'Concession strategy not documented — no record of what was traded and why',
    ],
  },

  executive_decision: {
    sentinelFocus:
      'Validate that the executive decision brief is evidence-complete: value at stake, scoring outcome, risk summary, and recommended award must be documented and cited before the brief is presented.',
    nexusFocus:
      'Orchestrate the executive decision package: ensure that all decision owners have reviewed the brief, that outstanding risks have disposition owners, and that the escalation path is clear if the decision is deferred.',
    atlasFocus:
      'Frame the award recommendation in executive language: what is the recommended vendor, what is the risk-adjusted value case, and what happens if the decision is delayed or reversed.',
    stewardFocus:
      'Enforce that the executive decision gate is not bypassed. A documented brief, a quorum of decision owners, and a captured decision record are required before award can proceed.',
    keyQuestions: [
      'Is the executive decision brief complete with evidence citations?',
      'Have all decision owners reviewed and acknowledged the brief?',
      'Is the risk summary current and dispositioned before award?',
    ],
    riskSignals: [
      'Decision brief circulated informally without a tracked review record',
      'Outstanding high-severity risks without disposition before award decision',
      'Decision deferred without a documented timeline and owner',
    ],
  },

  selection: {
    sentinelFocus:
      'Confirm that the award decision is documented, that the selected vendor has been notified, and that the transition to contracting is gated on a complete decision record.',
    nexusFocus:
      'Drive the post-award handoff: ensure notification timelines are met, that unsuccessful vendors are notified according to process, and that the contracting stage is opened with a full decision context.',
    atlasFocus:
      'Synthesize the selection outcome for executive record: who was selected, on what basis, and what the value and risk profile of the selection looks like going into contracting.',
    stewardFocus:
      'Enforce the selection gate: no contracting stage can open without a complete award decision record and confirmed vendor notification.',
    keyQuestions: [
      'Is the award decision formally recorded with rationale?',
      'Have all vendors been notified in accordance with procurement policy?',
      'Is the contracting stage being opened with a full decision context?',
    ],
    riskSignals: [
      'Verbal award communication without a formal written record',
      'Unsuccessful vendor notification delayed — challenge window risk',
      'Contracting begins before decision record is closed',
    ],
  },

  transition: {
    sentinelFocus:
      'Validate that SLA anchors, implementation risk items, and exit clause adequacy are reviewed before contract execution. Flag contract terms that are weaker than the sourcing-stage risk register predicted.',
    nexusFocus:
      'Drive contract execution readiness: ensure all SLA anchors are finalized, implementation risk mitigations are documented, and exit clauses are reviewed against the risk register before signature.',
    atlasFocus:
      'Frame the contract terms for executive review: what implementation risk exposure looks like, whether SLA targets are defensible, and what the exit cost and trigger conditions are.',
    stewardFocus:
      'Enforce that contract review covers SLA adequacy, implementation risk disposition, and exit clause sufficiency. No contract execution without a completed legal and risk review record.',
    keyQuestions: [
      'Are SLA anchors in the contract defensible against the original requirements?',
      'Is implementation risk documented and mitigated in contract terms?',
      'Are exit clause triggers and costs understood and acceptable?',
    ],
    riskSignals: [
      'SLA targets in the contract are weaker than sourcing-stage requirements specified',
      'Implementation risk items from the sourcing phase not carried into contract schedules',
      'Exit clause is silent on cost or trigger conditions — lock-in risk',
    ],
  },

  value: {
    sentinelFocus:
      'Validate that the ROI measurement plan is activated and that benefit realization tracking has concrete milestones, measurement owners, and baseline data established at contract start.',
    nexusFocus:
      'Drive benefit realization: ensure that value tracking milestones are in the delivery schedule, that measurement ownership is assigned, and that the value ledger is being updated from live data rather than projections.',
    atlasFocus:
      'Frame realized-versus-projected value for executive reporting: what has been measured, what is still projected, and what the gap between original value case and current trajectory looks like.',
    stewardFocus:
      'Enforce that value realization tracking has a documented measurement plan with named owners. Value ledger entries must transition from projected to realized only when measurement evidence exists.',
    keyQuestions: [
      'Is a ROI measurement plan active with named owners and baselines?',
      'Are value ledger entries being updated from live delivery data?',
      'Is the gap between projected and realized value tracked and explained?',
    ],
    riskSignals: [
      'No measurement plan activated at contract start — value realization will be unmeasurable',
      'Value ledger entries still showing projected figures with no measurement evidence',
      'Realized value not tracked at contract milestones — benefit realization invisible to executives',
    ],
  },
};

/**
 * Returns the voice depth entry for a given stage key, or undefined if the
 * stage key is a legacy alias or has no registered entry. Callers should
 * resolve legacy aliases first using normalizeSourceStageKey from constants.ts.
 */
export function getStageVoiceDepth(stageKey: SourceStageKey | null | undefined): StageVoiceDepthEntry | undefined {
  if (!stageKey) return undefined;
  return STAGE_VOICE_DEPTH[stageKey];
}
