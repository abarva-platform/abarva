// Deliverable structures — the section flow per artifact type.
//
// Each structure is a senior consultant's BASELINE (Claude may add to it). The brief
// registry composes a structure with an archetype pack so the same artifact type
// (e.g. a business case) is shaped differently for AMS vs cloud vs AI-PDLC.

import type {
  BriefSection,
  DeliverableModule,
  SectionGroundingMode,
} from "../types";

export interface DeliverableStructure {
  module: DeliverableModule;
  deliverableType: string;
  purpose: string;
  decisionToSupport: string;
  sections: BriefSection[];
  requiredSectionKeys: string[];
  /**
   * Topics that belong to a LATER phase and must not appear as sections here
   * (phase discipline). E.g. a P1 Charter frames the decision to fund discovery
   * — it does not pre-empt P2's current-state analysis or P3's target-state
   * design. Matched case-insensitively against a section's key/title; the
   * architect is told to omit them and the plan sanitizer drops any that slip in.
   */
  forbiddenSectionTopics?: string[];
}

const s = (
  key: string,
  title: string,
  intent: string,
  groundingMode: SectionGroundingMode,
  expectedEvidenceFamilies: string[] = [],
  expertLatitude = "Bring expert structure and synthesis; add sections if they improve the artifact.",
): BriefSection => ({
  key,
  title,
  intent,
  groundingMode,
  expectedEvidenceFamilies,
  expertLatitude,
});

// ── Moves deliverables (strategic transformation artifacts) ──

// A P1 Charter is a COMMITMENT instrument — it frames the decision to fund
// discovery & design, names the sponsor, sets the value hypothesis and the kill
// criterion. It must NOT pre-empt later phases: no current-state evidence
// analysis (that is P2 Discovery), no target/future-state or solution/architecture
// design (that is P3). The earlier structure carried a required "Current-State
// Evidence" section, which produced premature current/target-state perspectives
// and varied run-to-run; these are the canonical decision-sections instead.
const MOVES_CHARTER: DeliverableStructure = {
  module: "moves",
  deliverableType: "charter",
  purpose:
    "Authorize a strategic move with a clear mandate, sponsor commitment, scope, value hypothesis, governance, and kill criterion — and fund the move into discovery & design.",
  decisionToSupport:
    "Approve chartering of the move (a funded discovery & design gate, NOT a build authorization).",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "One tight section: the problem, the recommended approach at a headline level, the preliminary value hypothesis ($M–$M, labelled PRELIMINARY), program duration, and the decision sought. Framing only — NOT a current-state analysis.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "State the explicit charter ask and exactly what approval authorizes: a funded discovery & design gate, not a build.",
      "mixed",
    ),
    s(
      "sponsor_commitment",
      "Sponsor Commitment & Change Readiness",
      "Named sponsor, role, decision rights, review cadence, commitment evidence; key decision-makers, contributors, and blockers as named roles. State change readiness explicitly: the sponsor's commitment is not only to FUND the technology but to DRIVE the business-process change and OWN the measurement the outcome depends on. Where the client is not yet willing to change a process, record it as a readiness risk, not a gap to paper over.",
      "mixed",
    ),
    s(
      "problem_opportunity",
      "Problem, Opportunity & Why Now",
      "Why now and the value at stake — executive framing only. Do NOT pre-empt P2 with a detailed current-state evidence analysis.",
      "mixed",
    ),
    s(
      "objectives",
      "Strategic Objectives",
      "Target outcomes and the success measures that define done.",
      "mixed",
    ),
    s(
      "scope",
      "Scope & Out-of-Scope",
      "Explicit in-scope / out-of-scope boundary — specific capabilities and business processes, not generic.",
      "mixed",
    ),
    s(
      "success_criteria",
      "Success Criteria, Value Hypothesis & Measurement",
      "Define success as a four-part commitment (see SUCCESS-CRITERIA-STANDARD): (1) BUSINESS OUTCOMES — the business result the move must produce, stated as a business change, not a feature/technology; (2) KEY METRICS — the KPIs that prove each outcome, each with a current baseline and a target (label every figure PRELIMINARY_ESTIMATE with its assumption, or cite it); (3) MEASUREMENT AFTER DEPLOYMENT — how each metric will actually be measured post-go-live: data source/instrumentation, owner, cadence, and the enablement needed to capture it (if it cannot be measured with what exists today, that enablement is a scope item — surface it, mark [CLIENT TO COMPLETE], never assume it); (4) BUSINESS-PROCESS CHANGE — the specific process/operating-model changes the client commits to make to enable the outcome (technology alone rarely delivers it). Include the preliminary value range $M–$M.",
      "mixed",
    ),
    s(
      "governance_gates",
      "Governance, Operating Model & Phase Gates",
      "Steering committee, escalation path, decision velocity, high-level RACI, and the stage gates ahead (P2→P5) with entry criteria.",
      "mixed",
    ),
    s(
      "kill_criterion",
      "Key Risks, Dependencies & Kill Criterion",
      "Top risks, issues and dependencies with mitigations, plus a specific, observable condition that would terminate the program — not a vague risk statement.",
      "mixed",
    ),
    s(
      "evidence_gaps",
      "Evidence Gaps & Client-to-Complete",
      "What must still be confirmed in discovery; mark each [CLIENT TO COMPLETE], never invent.",
      "client_to_complete",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Clear recommendation and the immediate next steps into P2 discovery.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "decision_required",
    "sponsor_commitment",
    "problem_opportunity",
    "objectives",
    "scope",
    "success_criteria",
    "governance_gates",
    "kill_criterion",
    "recommendation",
  ],
  forbiddenSectionTopics: [
    "current state",
    "current-state",
    "as-is",
    "as is assessment",
    "baseline assessment",
    "target state",
    "target-state",
    "future state",
    "future-state",
    "to-be",
    "gap analysis",
    "solution design",
    "solution architecture",
    "reference architecture",
    "technical architecture",
    "detailed design",
    "implementation plan",
  ],
};

const MOVES_BUSINESS_CASE: DeliverableStructure = {
  module: "moves",
  deliverableType: "business_case",
  purpose:
    "Justify investment in a strategic move with a costed, evidence-grounded business case.",
  decisionToSupport:
    "Approve funding for the move at the proposed investment level.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "State the funding decision needed in the first sentence — what is being asked, at what investment level, with what expected return class — not the mechanics of how the number was built; that belongs later. A reader who only reads this section should know what problem is being solved, what it costs, what it returns, and what confidence backs both. If the underlying evidence is thin, say so plainly here rather than opening with confident numbers the rest of the document can't support — a mismatch between a bold opening and a hedged financial section is the fastest way to lose board credibility.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "Name the exact decision being asked for — fund at the proposed level, fund a smaller/phased version, or decline — not a vague 'consider this investment.' State what is unlocked if the board says yes, and what is lost by waiting if the board defers, distinguishing evidenced cost-of-delay from assumed urgency. If the ask carries conditions (contingent on a later gate, phased release of funds), state them here explicitly — a funding ask with hidden conditions reads as an attempt to secure commitment before disclosure.",
      "mixed",
    ),
    s(
      "problem_opportunity",
      "Problem / Opportunity",
      "Make the cost of inaction concrete and specific to this business, not generic industry pain. Anchor every urgency claim to the current-state evidence that follows — 'this is costing us X per month' needs to trace to the Current-State Baseline section, not stand alone here. Distinguish a genuine burning-platform problem (cost or risk compounding if unaddressed) from a growth opportunity (upside foregone) — they justify different urgency and different funding logic, and conflating them weakens the ask.",
      "mixed",
    ),
    s(
      "current_state",
      "Current-State Baseline",
      "This is the number every later section's 'why' depends on — get it right and cited, do not round for narrative convenience. State the baseline in the same units and cadence the Value Hypothesis will later claim to improve — if the baseline is monthly manual hours, don't later claim annual dollar savings without showing the conversion. Where the baseline itself is contested or only partially evidenced, say so plainly here — a business case built on a shaky baseline needs to disclose it, not have it discovered in review.",
      "governed_facts",
    ),
    s(
      "options",
      "Options Considered",
      "A credible options section shows real trade-offs were weighed, not a strawman built to make the recommended option win. Include 'do nothing' as an explicit option with its real cost (drawn from Problem/Opportunity), not an omission — a board reading a business case immediately asks what happens if we don't act. Score every option on the same criteria (cost, risk, time-to-value, reversibility) so the comparison is legible, and be honest when two options are genuinely close — a one-sided options section undermines the recommendation more than it supports it.",
      "mixed",
    ),
    s(
      "value_hypothesis",
      "Value Hypothesis & Benefits",
      "Every benefit claimed here must trace to a specific operational mechanism — what actually changes to produce it — not a top-down percentage applied to a large number. Separate benefits by confidence: cited and governed, inferred from evidence but not directly measured, and directional but unconfirmed — collapsing all three into one blended figure is the single most common way a business case loses credibility under scrutiny. State the measurement mechanism for each KPI now; the Financial Summary will need it, and inventing measurability retroactively reads as an afterthought.",
      "mixed",
    ),
    s(
      "cost_model",
      "Cost Model",
      "Separate one-time investment from ongoing run-cost change explicitly — a board approving a total figure needs to know how much of it recurs annually, since that is a different kind of commitment than a one-time build cost. Show cost pools (people, technology, vendor, change management) rather than one blended number — an undifferentiated total invites the follow-up question 'what's actually in this' that a well-built cost model should have already answered. Every cost line traces to governed evidence or is explicitly labeled an assumption; never smooth or round in a direction that flatters the case.",
      "governed_facts",
    ),
    s(
      "financials",
      "Financial Summary (NPV/Payback)",
      "Lay out NPV, IRR, and payback under the same methodology and discount rate the client's finance function already uses — do not introduce a house discount rate without confirming it against governed evidence or an approved assumption. State the headline return once, then show the base-case build: total investment, phased benefit ramp, and the payback crossover, with every dollar figure tracing to the Cost Model or Value Hypothesis sections above — do not introduce new numbers here that did not appear upstream. A common failure mode is presenting a single-point NPV with false precision; if the underlying benefit confidence is low, state the range and why, rather than manufacturing a number that reads more certain than the evidence supports. Close with the one line a CFO actually needs: at this investment level and this confidence, is the return good enough to fund.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "A funding-relevant risk section names what could invalidate the value hypothesis or blow the cost model, not a generic project-risk checklist. For each risk, state the specific mechanism by which it would hurt the numbers above (for example, adoption lagging by two quarters roughly halving Year 1 benefit realization) rather than a bare 'adoption risk — medium' rating disconnected from the financials. Where a risk is severe enough that it should change the funding ask itself, say so directly here rather than leaving the board to infer it from a risk table.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State the ask one more time precisely — fund, shape, or decline, at what level — so a reader skimming only the Executive Summary and this section gets the same answer both times. If shaping a smaller or different version is the honest recommendation given the evidence, say that plainly rather than defaulting to 'fund as proposed' because that was the version requested. Close with the specific next action and named owner — a board vote, a specific piece of evidence still needed, a pilot scope — a recommendation without a concrete next step reads as unfinished.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "decision_required",
    "current_state",
    "value_hypothesis",
    "cost_model",
    "recommendation",
  ],
};

const MOVES_ROADMAP: DeliverableStructure = {
  module: "moves",
  deliverableType: "roadmap",
  purpose:
    "Sequence the move into phases and work packages with gates and dependencies.",
  decisionToSupport:
    "Approve the phasing, sequencing, and resourcing of the move.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "State the overall shape of the journey in the first sentence — how many phases, roughly what timeframe class (quarters vs. years), and what the roadmap is optimizing for (speed to first value, risk reduction, resourcing reality). A reader should know from this section alone whether this is an aggressive or conservative sequencing choice and why. Do not restate the case for the move itself — that's the Charter or Business Case's job — this section explains how the work is organized, not why it's being done.",
      "mixed",
    ),
    s(
      "objectives",
      "Objectives & Guiding Principles",
      "State explicitly what this roadmap is optimizing for — time-to-first-value, risk reduction, minimizing organizational disruption, resourcing reality — since different optimization targets produce genuinely different, equally valid sequencing choices, and a reader needs to know which one governs before judging the phase plan. Where objectives are in tension, such as fastest value versus lowest risk, name the tension and state which one wins and why, rather than presenting a plan that silently picked one without acknowledging the trade-off.",
      "mixed",
    ),
    s(
      "current_state",
      "Starting Point",
      "Describe the actual starting point — capacity already committed, work already underway, organizational readiness — not an idealized day zero. Where the starting point constrains what's realistically sequenceable first, such as a team not yet hired or a dependency not yet resolved, say so here rather than let it surface as a surprise in Sequencing & Dependencies. This section is the anchor every phase boundary in Phases & Work Packages should be measured against.",
      "governed_facts",
    ),
    s(
      "phases",
      "Phases & Work Packages",
      "Size each phase around a genuine outcome or capability delivered, not a calendar chunk — 'Phase 2: Months 4-6' tells a reader nothing about what changes; 'Phase 2: pilot live with 50 users' does. State what decision or capability each phase unlocks for the next one, so the phase boundaries read as a designed sequence, not an arbitrary split of a large backlog into equal-sized pieces. Three to five phases is typically credible for a move of this scale; more reads as under-scoped work, fewer reads as too coarse to actually gate.",
      "mixed",
    ),
    s(
      "sequencing",
      "Sequencing & Dependencies",
      "Name the actual critical path — the specific deliverable, decision, or external dependency that, if delayed, delays everything behind it — not a generic 'dependencies exist' statement. Distinguish hard technical or organizational dependencies (must finish before the next can start) from soft sequencing preferences (easier in this order but not strictly required) — conflating the two makes the roadmap look more rigid, and therefore more fragile to any single slip, than it actually needs to be.",
      "mixed",
    ),
    s(
      "resourcing",
      "Resourcing & Operating Model",
      "State team shape and capacity by phase, not a single steady-state resourcing assumption applied across the whole timeline — capacity needs typically peak differently by phase (heavy build versus heavy change management), and a flat resourcing view hides where the real crunch will be. Where resourcing depends on hiring, vendor augmentation, or capacity not yet confirmed, mark it explicitly rather than assuming it will simply appear when the phase starts — this is one of the most common reasons roadmaps slip in execution, not planning.",
      "mixed",
    ),
    s(
      "gates",
      "Phase Gates & Milestones",
      "For each gate, name the specific entry criteria, exit criteria, decision owner, and what happens if the gate isn't met — a rollback, a pause, a scope cut — not just a gate name and a date. A gate without a named owner or a stated consequence for failing it isn't a real control, it's a calendar marker. Space gates around genuine decision points — should we continue, should we change course — rather than mechanically at fixed intervals.",
      "expert_template",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Name delivery risks specific to this sequencing choice — a phase whose success depends on a dependency outside the team's control, a resourcing assumption that hasn't been confirmed, a gate with no real fallback if it fails — not a generic project-risk list. For each, state what would have to happen for the risk to materialize and what the roadmap does about it (resequence, add buffer, escalate) — a risk without a stated response reads as acknowledged but unmanaged.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State plainly whether to approve the phasing and sequencing as proposed, or where it should be adjusted before mobilization — a recommendation that lists concerns but still says 'approve as-is' without resolving them reads as an approval that doesn't actually stand behind the plan. Name the specific next action to mobilize — team standup, first gate date, resourcing confirmation — and its owner, so approval translates into a concrete start, not just a sign-off.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "objectives",
    "phases",
    "sequencing",
    "recommendation",
  ],
};

const MOVES_DISCOVERY: DeliverableStructure = {
  module: "moves",
  deliverableType: "discovery_report",
  purpose:
    "Report discovery findings — maturity, gaps, readiness — to frame the move.",
  decisionToSupport: "Agree the diagnosis and the priority gaps to address.",
  sections: [
    s("exec_summary", "Executive Summary", "Headline findings.", "mixed"),
    s(
      "approach",
      "Approach",
      "How discovery was conducted.",
      "expert_template",
    ),
    s(
      "current_state",
      "Current-State Findings",
      "Evidence-grounded findings.",
      "governed_facts",
    ),
    s(
      "maturity",
      "Maturity & Benchmark",
      "Maturity scoring vs benchmark.",
      "mixed",
    ),
    s("gaps", "Gap Analysis", "Foundation vs use-case gaps.", "mixed"),
    s(
      "readiness",
      "Change & Adoption Readiness",
      "Assess the client's ability AND willingness to make the business-process changes the outcome needs, and to stand up the measurement (per the charter's success criteria). Validate the metric baselines and whether each is measurable today. A high-value outcome with no process-change commitment is not ready — say so.",
      "mixed",
    ),
    s("implications", "Implications", "What it means for the move.", "mixed"),
    s(
      "recommendation",
      "Recommended Move & Next Steps",
      "Where to focus.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "gaps",
    "recommendation",
  ],
};

const MOVES_TARGET_ARCHITECTURE: DeliverableStructure = {
  module: "moves",
  deliverableType: "target_architecture",
  purpose:
    "Describe the target architecture and the major technology decisions required to execute the move.",
  decisionToSupport:
    "Approve the target-state architecture, integration posture, controls, and implementation implications.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "State the architecture decision in the first sentence — what target state is being proposed, what major technology choice it commits to, and what it would cost to reverse later. A reader skimming only this section should know the shape of the target, the one or two decisions that matter most, and whether this is a low-regret direction or a genuine fork the business is committing to. Do not lead with current-state pain (Current-State Technology Baseline's job) or sequencing detail (Implementation Path's job) — this section states the destination and the decision, not the journey.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "Name precisely what is being approved — the target architecture itself, a specific integration pattern, a build-vs-buy-vs-configure choice, or all three — since 'approve the architecture' without specificity invites rubber-stamping. State what proceeding unlocks (funded build-out, vendor engagement, a defined next-phase roadmap) and what stays blocked without approval. If approval is being sought for a direction with material open decisions still pending, such as vendor selection, say so explicitly rather than implying full architectural certainty.",
      "mixed",
    ),
    s(
      "current_state",
      "Current-State Technology Baseline",
      "Describe the recorded technology estate as it actually is today, not an idealized or simplified version that makes the target state look like a bigger leap than it is. Where the current-state record is incomplete — unknown system ownership, undocumented integrations, unclear data lineage — mark those gaps explicitly; an architecture decision built on an incomplete picture inherits that uncertainty invisibly if it isn't named. This section is the baseline every claim in Target-State Architecture about what changes must trace back to.",
      "governed_facts",
    ),
    s(
      "target_state",
      "Target-State Architecture",
      "State the core components and, for each, who owns it and what it's responsible for — a component with no named owner or unclear responsibility boundary is where integration failures actually happen in practice. Explain the reasoning behind the major shape of the target, not just the diagram — a target state without rationale reads as a preference, not a decision. Where a component represents a genuinely new capability the organization doesn't operate today, flag the operational implication — a new skill, a new vendor relationship, a new on-call surface — not just the technical shape.",
      "mixed",
    ),
    s(
      "data_integration",
      "Data, Integration & Platform Implications",
      "Specify actual data products and interface contracts — source, consumer, protocol, update cadence — not a generic 'systems will integrate' statement. Call out where the target state changes data ownership or introduces a new system of record, since that is the kind of change that quietly breaks downstream reports and processes if not flagged early. State the dependency posture honestly: which integrations are prerequisites that must exist before other work can start, versus which are parallelizable — sequencing errors here are one of the most common causes of architecture programs running late.",
      "mixed",
    ),
    s(
      "security_controls",
      "Security, Privacy & Control Model",
      "Organize by control family — identity & access, data protection/encryption, network segmentation, logging & monitoring, third-party/vendor access — and for each state what changes versus the current-state baseline, not a generic control catalog. Name which approvals this target state requires before build can start (security architecture review, data-classification sign-off, a specific compliance gate) and who owns each — an architecture that names a control family but no approver reads as unowned. Where the target introduces a genuinely new exposure — a new external integration, a new data flow crossing a trust boundary, an expanded blast radius — call it out explicitly as a residual risk here rather than folding it into the general Risks section; security reviewers read this section first and will stop trusting the rest of the document if a known exposure is buried. Do not assert a specific compliance certification or control maturity level unless it is cited evidence; where the client's current posture is unknown, mark it [EVIDENCE MISSING] rather than assuming a mature baseline.",
      "mixed",
    ),
    s(
      "implementation_path",
      "Implementation Path",
      "Describe migration posture — big-bang, phased cutover, parallel run, strangler pattern — and why it fits this specific estate, not a generic 'phased approach' default. Name the highest-risk transition moment explicitly, such as the point where old and new systems must coexist or a cutover has no easy rollback, since implementation risk concentrates there, not evenly across the timeline. Keep this section to sequencing and transition risk; do not restate the detailed workstream or resourcing plan that belongs to a later Roadmap deliverable — reference it as a forward pointer only.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Name the architecture-specific risks a generic project-risk list would miss — a single point of failure the target state introduces, a vendor lock-in the pattern creates, a skills gap the organization doesn't yet have for the chosen technology. For each, state the concrete mitigation being proposed, not just the risk description — a risk without a mitigation reads as an unaddressed concern, not a managed one. Where a risk is severe enough that it should change the recommended target state itself, say so directly rather than only logging it.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State clearly whether to approve the target state as designed, approve with named conditions, or reshape before approval — a recommendation that reads as 'approve, but here are twelve caveats' is really a reshape recommendation dressed as an approval. Name the specific next decisions still required — vendor selection, a named proof-of-concept, a security review — and their owners, distinguishing what this approval unlocks from what still has to happen before build can start.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "decision_required",
    "current_state",
    "target_state",
    "recommendation",
  ],
};

const MOVES_OPERATING_MODEL: DeliverableStructure = {
  module: "moves",
  deliverableType: "operating_model",
  purpose:
    "Define the human and agent operating model required to run the move safely.",
  decisionToSupport:
    "Approve ownership, governance, RACI, controls, and run-state roles.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "Operating model decision in brief.",
      "mixed",
    ),
    s(
      "current_state",
      "Current Operating Baseline",
      "Recorded ownership and process baseline.",
      "governed_facts",
    ),
    s(
      "future_roles",
      "Future Roles & RACI",
      "Humans, agents, SI, and retained owners.",
      "mixed",
    ),
    s(
      "governance",
      "Governance & Decision Rights",
      "Forums, approvals, escalation, and audit.",
      "mixed",
    ),
    s(
      "controls",
      "Responsible AI & Control Points",
      "Human approval and monitoring controls.",
      "mixed",
    ),
    s(
      "change",
      "Business-Process Change, Adoption & Training",
      "The concrete to-be business-process / operating-model changes that ENABLE each success-criteria outcome (which process change drives which outcome/metric), how people adopt them, and the enablement to capture the metrics post-deployment. This is the people-and-process lever the outcome depends on — make it specific, not a generic change-management paragraph.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Operating risks and mitigations.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve the operating model.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "future_roles",
    "governance",
    "recommendation",
  ],
};

const MOVES_ESTIMATE: DeliverableStructure = {
  module: "moves",
  deliverableType: "estimate_model",
  purpose:
    "Estimate investment, run-cost change, resourcing, and confidence for the move.",
  decisionToSupport:
    "Approve the estimate range and the assumptions requiring validation.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "State the estimate and its confidence class together in the first sentence — a number without a confidence class (Rough Order of Magnitude, Budgetary, Definitive) is not actually useful to a reader deciding how much to rely on it. Name the single biggest driver of the range, not just the range itself, so a reader knows what would need to be true for the estimate to land at the low versus high end. Do not restate the case for the move here — this section states what it's estimated to cost and how sure we are, nothing else.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "State precisely what is being asked — approve the estimate range as the funding basis, approve it as a directional planning number pending refinement, or approve gathering the missing inputs needed to tighten it — since these are different asks with different consequences. If the estimate cannot yet support a funding decision because finance-grade inputs are missing, say that plainly here rather than presenting a number that implies more certainty than the method behind it supports.",
      "mixed",
    ),
    s(
      "current_state",
      "Cost / Capacity Baseline",
      "State the recorded cost and capacity baseline the estimate was actually built from, not an assumed or idealized starting point. Where the estimate had to extrapolate from an incomplete or dated baseline, say so explicitly, since that directly affects how much confidence the Confidence section can credibly claim. This baseline should match, not silently differ from, whatever baseline a Business Case for this move uses — a mismatch between the two documents' numbers is one of the fastest ways to lose credibility with finance.",
      "governed_facts",
    ),
    s(
      "estimate_method",
      "Estimate Method",
      "Name the actual estimating method used — top-down/parametric, bottom-up work-breakdown, analogous/benchmark-based — and why it fits this stage of the move; the method is what makes the number defensible, not the number alone. State what inputs the method requires and which of those are governed evidence versus assumption — an estimate whose method isn't disclosed reads as a number someone picked, not an estimate someone built.",
      "mixed",
    ),
    s(
      "cost_model",
      "Investment & Run-Cost Model",
      "Break the estimate into named cost pools — people, technology, vendor, contingency — with a stated range for each, not a single blended total; a reader needs to see where the money actually goes to judge whether the total is plausible. State the assumptions each pool's number depends on explicitly, and where a pool is a placeholder pending a real quote or rate confirmation, mark it rather than presenting a provisional number as final.",
      "mixed",
    ),
    s(
      "resource_model",
      "Resource Model",
      "State capacity needs by role — client team, delivery partner/SI, platform or vendor — and by phase, not a single blended headcount figure; resourcing needs typically shift materially across a move's lifecycle, and a flat number obscures where the real capacity crunch will be. Where resourcing depends on rates, roles, or headcount not yet confirmed, such as a blended day rate or an unconfirmed delivery-partner allocation, mark it explicitly — resourcing assumptions are one of the most common sources of estimate drift once work starts.",
      "mixed",
    ),
    s(
      "confidence",
      "Confidence, Sensitivities & Open Items",
      "State the estimate's confidence level explicitly (Rough Order of Magnitude / Budgetary / Definitive) and tie it to how the estimate was actually built in Estimate Method above — do not claim more precision than the method supports. List the specific sensitivities that could move the range materially, each with direction and rough magnitude, not a generic 'scope creep and timeline risk' list. Separate what would move the estimate favorably, such as reuse of existing platform components or a smaller pilot scope, from what would move it unfavorably — a one-sided sensitivity list reads as hedging rather than analysis. Every open item that must be resolved before the estimate can tighten — a missing vendor quote, an unconfirmed rate, an unscoped integration — belongs in one place here as [CLIENT TO COMPLETE] or [ASSUMPTION TO VALIDATE], not scattered through the cost model; this is where a CFO looks to know how much to trust the number above it.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State plainly whether to approve the estimate as the basis for funding, approve it as directional pending the inputs named in Confidence, or hold until specific missing inputs are gathered — these are three different, equally legitimate outcomes, and defaulting to 'approve' when the honest read is 'gather inputs first' undermines the estimate's credibility later. Name the specific next step and owner for closing the biggest open item identified in Confidence, so approval, of whatever kind, translates into a concrete next action.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "estimate_method",
    "cost_model",
    "recommendation",
  ],
};

const MOVES_VALUE: DeliverableStructure = {
  module: "moves",
  deliverableType: "value_model",
  purpose:
    "Define the CFO-facing value model, measurement logic, and realization controls.",
  decisionToSupport:
    "Approve the value case, measurement baseline, and realization governance.",
  sections: [
    s("exec_summary", "Executive Summary", "Value thesis in brief.", "mixed"),
    s(
      "decision_required",
      "Decision Required",
      "The value approval ask.",
      "mixed",
    ),
    s(
      "current_state",
      "Baseline & Evidence",
      "Recorded baseline and evidence maturity.",
      "governed_facts",
    ),
    s(
      "value_pools",
      "Value Pools",
      "Benefit pools, owners, and confidence.",
      "mixed",
    ),
    s(
      "measurement_model",
      "Measurement Model & Enablement",
      "The operational post-deployment measurement plan for each success metric: data source/instrumentation, accountable owner, cadence, attribution method, and the enablement required to capture it. Tie each metric back to its charter outcome and the business-process-change adoption signal that drives it. Where a metric is not yet measurable, the enablement to measure it is a named action, not an assumption.",
      "mixed",
    ),
    s(
      "controls",
      "Finance Controls & Attestation",
      "Approval and variance controls.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Leakage & Dependencies",
      "What could erode value.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve and lock the baseline.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "value_pools",
    "measurement_model",
    "recommendation",
  ],
};

const MOVES_MOBILIZATION: DeliverableStructure = {
  module: "moves",
  deliverableType: "mobilization_plan",
  purpose:
    "Translate the approved move into mobilization workstreams, owners, gates, and go/no-go controls.",
  decisionToSupport: "Approve mobilization and the first execution tranche.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "Mobilization recommendation in brief.",
      "mixed",
    ),
    s(
      "go_decision",
      "Go / No-Go Decision",
      "The immediate mobilization ask.",
      "mixed",
    ),
    s(
      "current_state",
      "Starting Point",
      "Readiness and open evidence.",
      "governed_facts",
    ),
    s(
      "workstreams",
      "Workstreams & Milestones",
      "The mobilization plan.",
      "mixed",
    ),
    s(
      "raci",
      "RACI & Governance",
      "Named owners and decision rights.",
      "mixed",
    ),
    s(
      "controls",
      "Controls, Gates & Reporting",
      "How execution is governed.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Launch risks and mitigations.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve launch or hold.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "go_decision",
    "workstreams",
    "raci",
    "recommendation",
  ],
};

const MOVES_HANDOFF: DeliverableStructure = {
  module: "moves",
  deliverableType: "handoff_pack",
  purpose:
    "Hand the move from strategy/design into execution and value tracking with clear accountability.",
  decisionToSupport:
    "Accept execution handoff and confirm Tower/value tracking responsibilities.",
  sections: [
    s("exec_summary", "Executive Summary", "Handoff state in brief.", "mixed"),
    s(
      "approved_decisions",
      "Approved Decisions",
      "What has been approved and by whom.",
      "mixed",
    ),
    s(
      "current_state",
      "Evidence & Open Gaps",
      "Evidence used and remaining gaps.",
      "governed_facts",
    ),
    s(
      "execution_contract",
      "Execution Contract",
      "Scope, owners, milestones, and controls.",
      "mixed",
    ),
    s(
      "tower_handoff",
      "Tower / Value Ledger Handoff",
      "Metrics, cadence, and ownership.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Handoff risks and mitigations.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Accept handoff and start execution.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "approved_decisions",
    "execution_contract",
    "tower_handoff",
    "recommendation",
  ],
};

const MOVES_EXECUTIVE_PLAYBACK: DeliverableStructure = {
  module: "moves",
  deliverableType: "executive_playback",
  purpose:
    "Assemble the executive story across charter, evidence, architecture, value, mobilization, and controls.",
  decisionToSupport:
    "Give executives a complete, traceable readout and the next decision.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "The answer and decision ask.",
      "mixed",
    ),
    s(
      "move_story",
      "Move Story",
      "Why this move exists and where it is going.",
      "mixed",
    ),
    s(
      "current_state",
      "Evidence Basis",
      "The evidence the story rests on.",
      "governed_facts",
    ),
    s(
      "solution",
      "Solution / Architecture / Operating Model",
      "How the move works.",
      "mixed",
    ),
    s(
      "value",
      "Value, Cost & Confidence",
      "The value and cost posture.",
      "mixed",
    ),
    s(
      "mobilization",
      "Mobilization & Controls",
      "How execution starts and stays governed.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "The honest risk view.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "The clear next executive move.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "solution",
    "value",
    "recommendation",
  ],
};

// ── Source deliverables (sourcing & procurement artifacts) ──

const SOURCE_STRATEGY_MEMO: DeliverableStructure = {
  module: "source",
  deliverableType: "sourcing_strategy_memo",
  purpose:
    "Set the sourcing strategy for the event — objective, approach, commercial model, evaluation.",
  decisionToSupport: "Approve the sourcing strategy and go-to-market approach.",
  sections: [
    s(
      "sourcing_objective",
      "Sourcing Objective",
      "What this event must achieve.",
      "mixed",
    ),
    s(
      "event_archetype",
      "Event Archetype & Scope",
      "The type of event and scope.",
      "mixed",
    ),
    s(
      "current_state",
      "Current-State Baseline",
      "Today's baseline.",
      "governed_facts",
    ),
    s(
      "market",
      "Vendor Landscape",
      "Market structure and candidates.",
      "expert_template",
    ),
    s(
      "commercial_model",
      "Commercial Model",
      "Pricing/commercial approach.",
      "mixed",
    ),
    s("evaluation", "Evaluation Approach", "How we will decide.", "mixed"),
    s(
      "negotiation",
      "Negotiation Levers & Protections",
      "Leverage and risk protections.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve and proceed.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "sourcing_objective",
    "event_archetype",
    "current_state",
    "commercial_model",
    "evaluation",
    "recommendation",
  ],
};

const SOURCE_EVAL_WORKBOOK: DeliverableStructure = {
  module: "source",
  deliverableType: "evaluation_workbook",
  purpose: "Provide the proposal evaluation framework and scoring workbook.",
  decisionToSupport:
    "Adopt the evaluation framework and select the preferred vendor.",
  sections: [
    s(
      "purpose",
      "Purpose & Method",
      "How evaluation works.",
      "expert_template",
    ),
    s(
      "criteria",
      "Criteria & Weights",
      "Weighted criteria.",
      "client_to_complete",
    ),
    s(
      "scoring",
      "Scoring Model",
      "Scoring scale and rules.",
      "expert_template",
    ),
    s(
      "current_state",
      "Requirements Baseline",
      "What is being evaluated against.",
      "governed_facts",
    ),
    s(
      "results",
      "Results Summary",
      "Scores and ranking (placeholder until responses).",
      "client_to_complete",
    ),
    s(
      "recommendation",
      "Recommendation",
      "Preferred vendor and rationale.",
      "mixed",
    ),
  ],
  requiredSectionKeys: ["purpose", "criteria", "scoring", "recommendation"],
};

const SOURCE_EXEC_REC: DeliverableStructure = {
  module: "source",
  deliverableType: "executive_recommendation",
  purpose: "Recommend the award/negotiation decision to executives.",
  decisionToSupport:
    "Approve the recommended vendor selection and negotiation mandate.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "The recommendation in brief.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "The award/negotiation ask.",
      "mixed",
    ),
    s("process", "Process Run", "How the event was run.", "expert_template"),
    s(
      "current_state",
      "Baseline & Outcomes",
      "Baseline vs outcome.",
      "governed_facts",
    ),
    s("evaluation", "Evaluation Outcome", "Scores and rationale.", "mixed"),
    s("commercial", "Commercial Outcome", "Pricing and terms.", "mixed"),
    s("risks", "Risks & Protections", "Residual risks.", "mixed"),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Award and mandate.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "decision_required",
    "evaluation",
    "recommendation",
  ],
};

export const DELIVERABLE_STRUCTURES: DeliverableStructure[] = [
  MOVES_CHARTER,
  MOVES_BUSINESS_CASE,
  MOVES_ROADMAP,
  MOVES_DISCOVERY,
  MOVES_TARGET_ARCHITECTURE,
  MOVES_OPERATING_MODEL,
  MOVES_ESTIMATE,
  MOVES_VALUE,
  MOVES_MOBILIZATION,
  MOVES_HANDOFF,
  MOVES_EXECUTIVE_PLAYBACK,
  SOURCE_STRATEGY_MEMO,
  SOURCE_EVAL_WORKBOOK,
  SOURCE_EXEC_REC,
];

export function getDeliverableStructure(
  module: string,
  deliverableType: string,
): DeliverableStructure | undefined {
  return DELIVERABLE_STRUCTURES.find(
    (d) => d.module === module && d.deliverableType === deliverableType,
  );
}
