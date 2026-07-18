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
      "The investment thesis in brief.",
      "mixed",
    ),
    s("decision_required", "Decision Required", "The funding ask.", "mixed"),
    s(
      "problem_opportunity",
      "Problem / Opportunity",
      "The case for change.",
      "mixed",
    ),
    s(
      "current_state",
      "Current-State Baseline",
      "Cost/performance baseline.",
      "governed_facts",
    ),
    s("options", "Options Considered", "Alternatives and trade-offs.", "mixed"),
    s(
      "value_hypothesis",
      "Value Hypothesis & Benefits",
      "Quantified benefits and KPIs.",
      "mixed",
    ),
    s(
      "cost_model",
      "Cost Model",
      "Investment and run-cost view.",
      "governed_facts",
    ),
    s(
      "financials",
      "Financial Summary (NPV/Payback)",
      "The financial case.",
      "mixed",
    ),
    s("risks", "Risks, Issues & Dependencies", "Risk-adjusted view.", "mixed"),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Fund / shape / decline.",
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
      "The shape of the journey.",
      "mixed",
    ),
    s(
      "objectives",
      "Objectives & Guiding Principles",
      "What the roadmap optimizes for.",
      "mixed",
    ),
    s(
      "current_state",
      "Starting Point",
      "Where we are today.",
      "governed_facts",
    ),
    s("phases", "Phases & Work Packages", "Phase plan with outcomes.", "mixed"),
    s(
      "sequencing",
      "Sequencing & Dependencies",
      "Critical path and dependencies.",
      "mixed",
    ),
    s(
      "resourcing",
      "Resourcing & Operating Model",
      "Teams and capacity.",
      "mixed",
    ),
    s(
      "gates",
      "Phase Gates & Milestones",
      "Decision gates.",
      "expert_template",
    ),
    s("risks", "Risks, Issues & Dependencies", "Delivery risks.", "mixed"),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve and mobilize.",
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
    s(
      "exec_summary",
      "Executive Summary",
      "State the headline diagnosis in the first sentence — what's broken or ready, and what the priority move should be — not a table of contents for the rest of the document. A reader who reads only this section should know the single most consequential finding and what it implies for the charter's success criteria. Do not restate the charter's problem statement; synthesize what was actually learned from evidence the charter could not have known in advance.",
      "mixed",
    ),
    s(
      "approach",
      "Approach",
      "Name the actual discovery methods used — interviews, workshops, system inventories, data pulls, document review — and their real coverage (how many stakeholders, which systems, what time period), not a generic 'we conducted discovery' statement. State explicitly what was NOT covered and why, since an unstated coverage gap reads as a blind spot discovered later, not disclosed now. This section exists so a reader can judge how much to trust the findings that follow — treat it as evidence-of-evidence, not procedural boilerplate.",
      "expert_template",
    ),
    s(
      "current_state",
      "Current-State Findings",
      "Present findings organized by the same lanes the charter named as in-scope (process, data, systems, controls, workforce), not as an undifferentiated list — a reader tracing back to the charter's scope should be able to find the finding that answers each stated question. Every finding must cite its evidence directly; where evidence conflicts (two stakeholders disagree, a system record contradicts a workshop claim), surface the conflict explicitly rather than silently picking one version — a root-cause analysis built on a silently-resolved conflict will be wrong in a way nobody can trace later.",
      "governed_facts",
    ),
    s(
      "maturity",
      "Maturity & Benchmark",
      "State the maturity score against a named, consistent framework, not an invented one-off scale, and anchor every score to the specific evidence that produced it — a maturity rating with no cited basis reads as an opinion, not an assessment. Where a benchmark comparison is used, name the benchmark's source and vintage; do not present a benchmark figure as current fact if the underlying data is older than the client's own evidence window. The gap between current and benchmark maturity is the number a sponsor actually needs — state it explicitly, don't leave the reader to calculate it.",
      "mixed",
    ),
    s(
      "gaps",
      "Gap Analysis",
      "Distinguish foundation gaps — must be closed for ANY future-state option to work, such as data quality, system access, or governance — from use-case gaps specific to the value hypothesis this move is chasing; conflating them makes every gap look equally blocking when foundation gaps are usually the ones that actually gate P3. For each gap, state what breaks downstream if it's not closed before P3 design starts — a gap list without consequence is a checklist, not a diagnosis.",
      "mixed",
    ),
    s(
      "readiness",
      "Change & Adoption Readiness",
      "Assess the client's ability AND willingness to make the business-process changes the outcome needs, and to stand up the measurement (per the charter's success criteria). Validate the metric baselines and whether each is measurable today. A high-value outcome with no process-change commitment is not ready — say so.",
      "mixed",
    ),
    s(
      "implications",
      "Implications",
      "This is the 'so what' section — for each major finding, state specifically what it means for the charter's success criteria, the value hypothesis, or the P3 design principles that follow, not a restatement of the finding itself. Where a finding contradicts an assumption the charter made, say so explicitly and state what should change — burying a charter-invalidating finding inside a generic implications paragraph is how sponsors get surprised later.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommended Move & Next Steps",
      "State plainly which gaps must close before P3 can start (hard blockers) versus which can be carried forward as an assumption for review — a recommendation that treats every open item as equally urgent gives the sponsor no way to sequence the work. Name the specific next sessions or evidence needed to close the highest-priority gap, not a generic 'further discovery may be needed.'",
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
      "Architecture decision in brief.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "The architecture approval ask.",
      "mixed",
    ),
    s(
      "current_state",
      "Current-State Technology Baseline",
      "What the recorded estate shows today.",
      "governed_facts",
    ),
    s(
      "target_state",
      "Target-State Architecture",
      "Core architecture components and responsibilities.",
      "mixed",
    ),
    s(
      "data_integration",
      "Data, Integration & Platform Implications",
      "Data products, interfaces, and dependency posture.",
      "mixed",
    ),
    s(
      "security_controls",
      "Security, Privacy & Control Model",
      "Control families and required approvals.",
      "mixed",
    ),
    s(
      "implementation_path",
      "Implementation Path",
      "Sequencing, migration posture, and transition risk.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Architecture risks and mitigations.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve or reshape.",
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
      "State the operating-model decision in the first sentence — what changes about who does the work and how it's governed, not a restatement of the move's purpose. Name the single biggest ownership or accountability shift this model introduces, since that's usually the detail a sponsor pushes back on hardest, not the roles that stay the same.",
      "mixed",
    ),
    s(
      "current_state",
      "Current Operating Baseline",
      "Describe today's actual ownership and process baseline — who does what, with what authority, today — not an idealized org chart. Where ownership is genuinely unclear or contested today (two teams both claim a responsibility, or nobody owns a handoff), name that explicitly; a target operating model built without naming today's ownership gaps will inherit them silently.",
      "governed_facts",
    ),
    s(
      "future_roles",
      "Future Roles & RACI",
      "For each new or changed role, state who is accountable for what decision, not just a title and a one-line description — a RACI that's just a list of names against generic categories doesn't tell a reader who actually decides when something goes wrong. Where a role introduces new AI/agent responsibility, state explicitly what the agent is trusted to decide autonomously versus what always requires human sign-off — this is the detail that determines whether the model is safe to run, not an implementation footnote.",
      "mixed",
    ),
    s(
      "governance",
      "Governance & Decision Rights",
      "Name the actual forums (which meeting, what cadence) and their real decision authority, not a generic 'governance council' placeholder. State the escalation path explicitly: what happens when the working level can't agree, who breaks the tie, how fast. A governance section that only lists forum names without decision rights reads as ceremony, not control.",
      "mixed",
    ),
    s(
      "controls",
      "Responsible AI & Control Points",
      "For each control point, state what specifically triggers human review versus what proceeds autonomously, and who is accountable if a control is bypassed or fails — a generic 'human-in-the-loop' statement doesn't tell a reader where the loop actually is. Where the control model has a known gap (a scenario not yet covered), name it as an open item, not silently.",
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
      "Name the risks specific to THIS operating model — a role with no backup, a decision right that's ambiguous between two owners, an escalation path that's never been tested — not a generic organizational-change risk list. For each, state what early-warning signal would show the risk materializing, so a sponsor knows what to watch for, not just what could go wrong in the abstract.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State plainly what's being approved — the roles, the governance forums, the control points — and what happens on day one if approved: who's accountable starting when. Where any element of the model is still provisional (a role not yet staffed, a forum not yet scheduled), say so rather than presenting the whole model as immediately operational.",
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
      "Estimate and confidence in brief.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "The estimate approval ask.",
      "mixed",
    ),
    s(
      "current_state",
      "Cost / Capacity Baseline",
      "Recorded baseline used for estimating.",
      "governed_facts",
    ),
    s(
      "estimate_method",
      "Estimate Method",
      "How the estimate was built.",
      "mixed",
    ),
    s(
      "cost_model",
      "Investment & Run-Cost Model",
      "Cost pools, assumptions, ranges.",
      "mixed",
    ),
    s(
      "resource_model",
      "Resource Model",
      "Human, agent, SI, and platform capacity.",
      "mixed",
    ),
    s(
      "confidence",
      "Confidence, Sensitivities & Open Items",
      "What could move the estimate.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve, reshape, or gather missing inputs.",
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
    s(
      "exec_summary",
      "Executive Summary",
      "State the value thesis and its confidence in one sentence — what value is being committed to, at what confidence — not a restatement of the business case's numbers. Name the one lever that carries the most weight in the total, since that's the assumption a CFO will press hardest.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "State precisely what's being asked — approve the value case as the baseline for tracking, approve it provisionally pending measurement enablement, or hold until baselines are confirmed. This is a different, narrower ask than the Business Case's funding approval — this document asks the sponsor to commit to being measured against these numbers, not just to fund the work; make that distinction explicit.",
      "mixed",
    ),
    s(
      "current_state",
      "Baseline & Evidence",
      "State the baseline each value pool will be measured against, and its evidence maturity — a baseline pulled from a single stale data point is a different kind of commitment than one confirmed across multiple sources. Where a baseline doesn't exist yet, say so as an open item rather than substituting an assumption silently.",
      "governed_facts",
    ),
    s(
      "value_pools",
      "Value Pools",
      "For each value pool, name the owner accountable for it, not just the pool and its size — a value pool with no named owner is a number nobody will defend later. State the confidence tier (cited, inferred, directional) for each pool separately; do not present a blended total that hides which pools are solid and which are speculative.",
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
      "State what specifically triggers a variance review (a threshold, a cadence, a named event) and what happens when a value pool underperforms — a generic 'finance will monitor' statement isn't a control. Name who has authority to revise a committed number and under what conditions, tying directly to the revision-conditions logic used elsewhere in this family of documents.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Leakage & Dependencies",
      "Name what could cause value leakage specific to these pools — measurement definition drift, an owner leaving, an adoption shortfall — not a generic project-risk list. For each, state the early-warning signal that would show leakage starting, so the sponsor has something concrete to watch rather than discovering the shortfall at the annual review.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State plainly whether to approve the value case as the baseline of record, and what locking the baseline actually commits the organization to — measurement going forward, accountability against these specific numbers. If any value pool's evidence is too thin to commit to, say that explicitly rather than let a weak pool ride along inside an otherwise strong case.",
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
      "State the mobilization recommendation in the first sentence — go, go-with-conditions, or hold — not a restatement of what the move is about. Name the single biggest readiness gap if one exists, since that's what will actually determine whether execution starts cleanly or stumbles in week one.",
      "mixed",
    ),
    s(
      "go_decision",
      "Go / No-Go Decision",
      "State the exact decision being asked — full mobilization, a limited first tranche, or a hold pending specific conditions — and what 'go' actually unlocks: funding release, team activation, vendor engagement. Where the recommendation is 'go' despite an open risk, say so explicitly and state why the risk doesn't block starting rather than silently omitting it.",
      "mixed",
    ),
    s(
      "current_state",
      "Starting Point",
      "State readiness against the specific conditions that matter for mobilization — funding confirmed, roles staffed, environments provisioned, evidence closed — not a generic status update. Where a condition is only partially met, state the specific gap and who owns closing it; 'mostly ready' is not a status a delivery team can act on.",
      "governed_facts",
    ),
    s(
      "workstreams",
      "Workstreams & Milestones",
      "Name the actual workstreams, their sequencing logic, and their first milestone — not a generic project-plan skeleton. State which workstream is the critical path for the first tranche of value, so a sponsor knows where schedule risk actually concentrates rather than treating every workstream as equally time-critical.",
      "mixed",
    ),
    s(
      "raci",
      "RACI & Governance",
      "For each named owner, state what they're specifically accountable for deciding, not just a name against a workstream. Where a role is not yet staffed, name it as an open item with a target date, not a placeholder that reads as already resolved.",
      "mixed",
    ),
    s(
      "controls",
      "Controls, Gates & Reporting",
      "State what specific event triggers a governance review during execution — a milestone miss, a budget variance threshold, a risk materializing — and who has authority to pause or redirect the work; a generic 'steering committee will meet monthly' statement doesn't tell a reader what actually triggers intervention.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Name the risks specific to mobilizing THIS move — a dependency on a vendor contract not yet signed, a team not yet fully staffed, an environment not yet provisioned — not a generic launch-risk checklist. State the specific consequence if each risk materializes in week one, since mobilization risk is about what breaks the early rhythm, not long-term delivery risk.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State plainly what's being approved — full mobilization or a scoped first tranche — and the specific next action that starts the clock: a kickoff date, a funding release, a named first milestone. Where the recommendation carries conditions, list them as a short, named set, not folded into prose a reader has to hunt for.",
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
    s(
      "exec_summary",
      "Executive Summary",
      "State the handoff decision in the first sentence — is this move ready to move from design into execution and value tracking, or not — not a restatement of the move's history. Name the single most important thing the receiving execution team needs to know before they start, since that's what a handoff exists to communicate.",
      "mixed",
    ),
    s(
      "approved_decisions",
      "Approved Decisions",
      "List only decisions that were actually formally approved, with who approved them and when, not decisions that were discussed or assumed — a handoff that presents a discussed-but-unapproved decision as settled sets the execution team up to build on sand. Where a decision was approved with conditions, state the conditions here, not just the approval.",
      "mixed",
    ),
    s(
      "current_state",
      "Evidence & Open Gaps",
      "State exactly what evidence and open gaps are being handed off, distinguishing what's fully resolved from what's carried forward as a known, accepted gap — a handoff document that implies everything is closed when gaps remain will surface as a trust problem mid-execution, not now when it's cheap to disclose.",
      "governed_facts",
    ),
    s(
      "execution_contract",
      "Execution Contract",
      "Name the specific scope boundary, owners, and milestones the execution team is accountable for, not a restatement of the mobilization plan's workstreams. State explicitly what is NOT in scope for execution — what stays with strategy/design, what's deferred to a later move — since scope creep during execution usually starts from an unstated boundary here.",
      "mixed",
    ),
    s(
      "tower_handoff",
      "Tower / Value Ledger Handoff",
      "Name the specific metrics, their measurement cadence, and who owns reporting them into Tower, not a generic 'value will be tracked' statement. State the baseline each metric starts from and when the first real reading is expected, so Tower isn't left guessing when to expect the first signal.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Name the risks specific to THIS handoff — a decision that was approved provisionally and could be revisited, an owner transition happening at the same time as the handoff, a metric baseline that isn't fully confirmed — not a generic execution-risk list. State what the execution team should watch for as an early sign each risk is materializing.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State plainly whether to accept the handoff as-is, accept with named conditions, or hold — and what accepting actually commits the execution team and Tower to. Where any element is still provisional, name it explicitly rather than letting the handoff read as fully resolved when it isn't.",
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
      "State the single decision this executive readout drives, in the first sentence — this document synthesizes everything that came before specifically to support ONE next decision, not to summarize the whole move's history for its own sake. A reader who reads only this section should know what's being asked of them right now.",
      "mixed",
    ),
    s(
      "move_story",
      "Move Story",
      "Tell the story as a chain of decisions, not a chronology of documents — why this move started, what was learned that changed the plan (if anything did), and where it stands now, each step earning the next. Where the story has a genuine pivot (the original approach changed based on evidence), say so explicitly — a story that pretends a straight line existed when it didn't undermines trust in everything that follows.",
      "mixed",
    ),
    s(
      "current_state",
      "Evidence Basis",
      "State only the evidence that's load-bearing for the decision this document drives, not a full re-listing of every fact gathered across the move's lifetime. Cite back to the specific phase document each piece of evidence came from, so an executive who wants the full detail knows exactly where to look rather than re-deriving it here.",
      "governed_facts",
    ),
    s(
      "solution",
      "Solution / Architecture / Operating Model",
      "Synthesize the approved solution/architecture/operating model at the altitude an executive actually needs — what it does, what it costs to run, what changed about how people work — not a compressed technical spec. Where the solution required trading off between options, name what was chosen and why in one sentence, not a re-run of the full options analysis.",
      "mixed",
    ),
    s(
      "value",
      "Value, Cost & Confidence",
      "State the committed value figures with their confidence tier, tying directly to the Value Measurement Contract's baseline and owner — do not present a fresher, more optimistic number here than what was formally committed elsewhere; a playback that inflates value beyond what was contracted undermines the contract's authority.",
      "mixed",
    ),
    s(
      "mobilization",
      "Mobilization & Controls",
      "State execution readiness and the specific next milestone an executive should expect to hear about, not a restatement of the full mobilization plan. Name the one thing that would most likely delay the first value signal, so the executive knows what to ask about at the next check-in.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Name only the risks material enough that an executive needs to hold them in mind, not every risk logged across the move's lifetime. For each, state what decision or action it would trigger if it materializes, so the risk reads as something being actively managed, not a disclaimer.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State the specific decision being asked of the executive and the consequence of each path — approve, hold, redirect; an executive playback without a clear ask is a status update, not a decision document. Close with the named next step and owner once the decision is made.",
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

const MOVES_SOURCING_STRATEGY: DeliverableStructure = {
  module: "moves",
  deliverableType: "sourcing_strategy",
  purpose:
    "Set the build/buy/configure/partner sourcing approach for the move's major components, with vendor shortlist and evaluation rationale.",
  decisionToSupport:
    "Approve the sourcing approach, vendor selection, and procurement pathway for each major component.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "State the sourcing recommendation in the first sentence — build, buy, configure, or partner, and for which components — not a restatement of the target architecture. A reader should know from this section alone which path is recommended and the single biggest reason, before reading the full evaluation.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "Name precisely what's being approved — the sourcing approach for each major component, or a subset requiring immediate action versus ones that can be decided later. Where the recommendation differs by component (build this, buy that), state that explicitly rather than implying one uniform sourcing strategy across the whole solution.",
      "mixed",
    ),
    s(
      "sourcing_decision_summary",
      "Sourcing Decision Summary",
      "For each major component, state the build/buy/configure/partner call in one line with its core rationale — a reader should be able to scan this section alone and understand every sourcing decision at a glance, with the detailed justification for each living in the sections that follow. Do not bury a component's decision inside a paragraph; make the recommendation itself the first thing stated for each.",
      "mixed",
    ),
    s(
      "vendor_evaluation",
      "Vendor Evaluation",
      "State the evaluation criteria before the vendor list, so a reader can judge whether the criteria are the right ones before seeing who won. For the shortlisted vendors, show the actual scoring, not just a ranked list — a recommendation without a visible scoring basis reads as pre-decided. Name specifically what separated the recommended vendor from the runner-up, since that's what a procurement reviewer will ask first.",
      "mixed",
    ),
    s(
      "make_vs_buy",
      "Make vs. Buy Analysis",
      "For each build candidate, show the real cost comparison — build cost and multi-year run cost against buy/license cost — not just a qualitative 'buy is faster' statement. State the differentiation argument precisely: what does building in-house protect or enable that buying would not, and is that differentiation actually load-bearing for this move's value case or a nice-to-have.",
      "mixed",
    ),
    s(
      "partnership_model",
      "Partnership Model",
      "For SI/partner-delivered components, state the scope boundary precisely — what the partner owns end to end versus what stays with the client team — since an ambiguous boundary here is where delivery accountability gaps actually originate. Name IP ownership and exit provisions explicitly; a partnership model that's silent on what happens if the relationship ends is not yet a real model.",
      "mixed",
    ),
    s(
      "commercial_risk_register",
      "Commercial Risk Register",
      "Name the specific commercial risks this sourcing approach creates — vendor concentration, licensing exposure, data sovereignty, lock-in — not a generic vendor-risk checklist. For each, state the concrete mitigation being proposed and whether it's already in place or still to be negotiated; a risk with no mitigation status reads as unaddressed.",
      "mixed",
    ),
    s(
      "procurement_pathway",
      "Procurement Pathway",
      "State the recommended procurement route (RFP, RFI, direct award) and the specific reason it fits this situation — a direct award needs a stated justification (single viable vendor, strategic relationship, time pressure), not just a preference. Name the realistic timeline and the approvals still required before procurement can start, so the pathway reads as executable, not aspirational.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State plainly which sourcing decisions are ready to approve now versus which need more evaluation before a call can be made. Where the recommendation carries real commercial risk (a single-vendor dependency, a build decision with a long payback), name it directly here rather than letting it surface only in the risk register.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "sourcing_decision_summary",
    "vendor_evaluation",
    "commercial_risk_register",
    "recommendation",
  ],
};

const MOVES_VALUE_MEASUREMENT_CONTRACT: DeliverableStructure = {
  module: "moves",
  deliverableType: "value_measurement_contract",
  purpose:
    "Formally commit the move's promised outcomes to named, measurable, accountable terms.",
  decisionToSupport:
    "Sign the value commitment as the accountability record for this move's outcomes.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "State what this contract commits the organization to in the first sentence — which outcomes, at what confidence, measured how — not a restatement of the business case. This document exists to be referred back to when someone asks 'what did we promise,' so the summary should read as a commitment statement, not a narrative recap.",
      "mixed",
    ),
    s(
      "committed_outcomes",
      "Committed Outcomes",
      "For each value lever, state baseline, target, timeline, and confidence level as a specific figure ($ or %), never a vague range dressed up as precision — per this document's own accountability standard, an outcome without a specific target is not yet committed, it's still a hypothesis. Where confidence is genuinely low, say so as a stated confidence tier rather than quietly picking an optimistic point estimate to make the commitment look cleaner.",
      "governed_facts",
    ),
    s(
      "measurement_methodology",
      "Measurement Methodology",
      "For each committed outcome, state exactly how it will be measured — the data source, the calculation, the frequency — precisely enough that two different people computing it later would get the same number. Where the measurement method depends on instrumentation or a data source that doesn't exist yet, name that as an enablement action with an owner and date, not an assumption that it will simply be available.",
      "mixed",
    ),
    s(
      "accountability_table",
      "Accountability Table",
      "Name a single accountable individual for each outcome — never a team or a function — with their explicit acknowledgment that they are accepting this accountability. An outcome with no named individual, or with 'the team' as the owner, does not meet this document's own standard and should be flagged as an open item rather than silently accepted.",
      "mixed",
    ),
    s(
      "review_cadence",
      "Review Cadence",
      "State exactly when each outcome is reviewed, who reviews it, and what specifically triggers an escalation outside the normal cadence — a generic 'quarterly business review' statement doesn't tell a reader what happens when a number is trending badly between reviews. Name the reviewing body precisely, not just 'leadership.'",
      "mixed",
    ),
    s(
      "revision_conditions",
      "Revision Conditions",
      "State exactly what conditions justify revising a committed target — a scope change, a confirmed external shock, new baseline evidence — and the approval process required to revise it. Revision must never be silent or retroactive; if a target was revised, this section is where that history should be traceable, including who approved the change and why.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "State plainly whether this contract is ready to be signed as the accountability record of the move's value commitment, or whether specific outcomes still need a named owner or a confirmed baseline before it can be finalized. Closing this document without every outcome meeting its own accountability standard defeats its purpose — say so explicitly if that's the case rather than signing an incomplete contract.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "committed_outcomes",
    "measurement_methodology",
    "accountability_table",
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
  MOVES_SOURCING_STRATEGY,
  MOVES_VALUE_MEASUREMENT_CONTRACT,
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
