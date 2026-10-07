// The P4 Mobilization Workshop Guide and P5 Execution Kickoff Guide section
// flows.
//
// Authored in their own module rather than inline in
// `deliverable-structures.ts` so the shared catalog takes a three-line change
// (one import, two array entries) and these two can be edited without touching
// a file every deliverable type shares.
//
// WHY THESE STRUCTURES EXIST AT ALL
//
// `composeBrief` (artifact-brief-registry.ts) builds a brief from a declared
// STRUCTURE joined with the archetype PACK. With no structure for a deliverable
// type it returns null and the registry falls through to `defaultBrief`, the
// generic board brief. For the `moves` module that fallback is a twelve-section
// executive paper — Executive Summary, Decision Required, Problem / Opportunity,
// Current-State Evidence, Strategic Objectives, Scope, Value Hypothesis & KPIs,
// Operating Model & RACI, Risks, Phase Gates, Evidence Gaps, Recommendation —
// with no per-section length guidance, no `fixedStructure`, no
// `forbiddenSectionTopics` and no `prohibitedContent`.
//
// So a working session guide asked for by one of these keys was generated as a
// charter-shaped board paper with no phase boundary at all, and nothing told
// the model it was a facilitation document. Both of these guides' own quality
// profiles say the opposite (`phaseWorkshopGuideProfile`, profiles/registry.ts:
// "Working guide, not the formal gate artifact", and four acceptance checks
// about session instructions, settled facts, and not making new decisions).
// The generic brief cannot satisfy those checks, and its twelve uncapped
// sections are the plausible cause of the over-length blocks both of these
// guides hit on the last live phase build.
//
// Measured across the twenty canonical phase deliverables, resolved the way
// production resolves them (`orchestratorDeliverableType`, which is what
// `/api/v1/deliverables/generate-phase` and `PhaseDocumentsPanel` send), three
// had no structure and all three are working session guides. These are two of
// the three; `planning_workshop_guide` is left structureless under the stated
// product decision recorded with it, because what a P3 guide may assert about a
// design that is still being chosen is a narrower question than either of
// these faces.
//
// WHERE THE SECTIONS COME FROM
//
// Not invented here. Each spine is the five-section list `DELIVERABLE_REGISTRY`
// already declares for that deliverable (deliverable-registry.ts), kept in the
// same order, with the registry's own `generationPromptHint` as the source of
// each guide's prohibitions. `design_workshop_guide` is the precedent for the
// shape: a carry-forward section that states what is settled, a session plan, an
// evidence ask, a facilitation prompt set, and a next-gate readiness check.
//
// GROUNDING
//
// `archetypeEvidenceSectionKeys` names the sections whose stated job is to
// ENUMERATE accepted facts, so `composeBrief` lands the archetype's evidence
// families there. Those families are what the section's retrieval query is
// built from, so without a landing site these sections asked the corpus for
// their generic family names and got a plausible answer citing none of the
// Move's approved evidence. The facilitation and readiness sections are
// deliberately left out: one is a question set and the other states what is
// still MISSING — neither enumerates accepted evidence, and adding the families
// to them would widen two retrieval queries toward evidence they do not cite.
//
// The archetype pack's exhibits and tables are withheld from both, declared
// with its reason in `archetype-asset-withholding.ts` — the same treatment
// `design_workshop_guide` has always had.

import type { BriefSection, SectionGroundingMode } from "../types";
import type { DeliverableStructure } from "./deliverable-structures";

const s = (
  key: string,
  title: string,
  intent: string,
  groundingMode: SectionGroundingMode,
  expectedEvidenceFamilies: string[],
  expertLatitude: string,
): BriefSection => ({
  key,
  title,
  intent,
  groundingMode,
  expectedEvidenceFamilies,
  expertLatitude,
});

export const MOVES_MOBILIZATION_WORKSHOP_GUIDE: DeliverableStructure = {
  module: "moves",
  deliverableType: "mobilization_workshop_guide",
  archetypeEvidenceSectionKeys: ["plan_carry_forward", "mobilization_evidence"],
  purpose:
    "Prepare the mobilization, Tower handoff, value-measurement, and delivery-readiness sessions that take an approved roadmap into execution handoff — without becoming a second roadmap, business case, or handoff package.",
  decisionToSupport:
    "Run the mobilization work needed to reach an accepted execution handoff: confirm accountabilities, lock the measurement baselines, and close the readiness conditions the roadmap approval left open.",
  sections: [
    s(
      "plan_carry_forward",
      "Plan Recap & Session Boundary",
      "Summarize only what the roadmap and business-case approval settled: approved sequence, committed measures, named readiness conditions, and the caveats recorded with them. Preserve each item's evidence status; do not restate the roadmap or reopen approved decisions without new evidence.",
      "mixed",
      ["source_register", "evidence_gaps", "decision_log"],
      "Keep under 350 words. Use a compact decision / status / mobilization implication table. State explicitly that this guide prepares mobilization sessions and is not itself the handoff package or an execution approval.",
    ),
    s(
      "mobilization_session_plan",
      "Mobilization Sessions & Decisions",
      "Define the smallest set of sessions needed to reach an accepted execution handoff: handoff, execution-readiness, value-measurement, governance, and Tower transition. For each, state the objective, the decision question, participants by role, the evidence to review, the output, and the accountable decision owner.",
      "mixed",
      ["stakeholder_input", "decision_log"],
      "Keep under 700 words. Use one compact session table. Separate what must be decided to hand off from the delivery work the approved roadmap already schedules.",
    ),
    s(
      "mobilization_evidence",
      "Mobilization Evidence Requests",
      "Identify the specific artifacts each mobilization decision depends on — RACI, workstream plans, approval evidence, baseline locks, Tower measurement inputs, and open risks — with evidence status and a named owner role for each. Never elevate an unvalidated item to fact.",
      "mixed",
      ["source_register", "evidence_gaps", "baseline_metrics"],
      "Keep under 500 words. Use one concise artifact / decision / status / owner table; point back to citations rather than repeating source narratives.",
    ),
    s(
      "facilitation_guide",
      "Workshop Facilitation & Decision Prompts",
      "Provide neutral prompts to test only the decisions that change accountability, measurement, risk, or the handoff conditions. Capture the selected option, alternatives, rationale, owner, evidence, and follow-up, and record the method for reviewing session notes.",
      "expert_template",
      [],
      "Keep under 850 words. Organize the question set by accountability, measurement and baseline, and execution risk. Do not prescribe the delivery plan, a role catalogue, or a training curriculum.",
    ),
    s(
      "handoff_gate_readiness",
      "Execution-Handoff Gate Readiness",
      "Set the minimum evidence and human decisions required before the execution-handoff gate: what must be uploaded, reviewed, and accepted, with an acceptance test, an owner role, and a status for each. Distinguish mobilization outputs from the execution work that follows the handoff.",
      "mixed",
      ["evidence_gaps", "decision_log"],
      "Keep under 400 words. Use a compact readiness checklist. Do not imply execution approval, and do not report an open item as complete.",
    ),
  ],
  requiredSectionKeys: [
    "plan_carry_forward",
    "mobilization_session_plan",
    "mobilization_evidence",
    "facilitation_guide",
    "handoff_gate_readiness",
  ],
  fixedStructure: true,
  forbiddenSectionTopics: [
    "execution roadmap",
    "business case",
    "financial model",
    "completed handoff package",
    "execution backlog",
    "detailed training curriculum",
    "final ROI",
  ],
  prohibitedContent: [
    "This is the mobilization working guide, not a roadmap, business case, or handoff package. Carry the approved plan forward with its actual evidence status; do not re-derive the sequence or the investment case.",
    "Plan only to the level needed to run the sessions, confirm accountabilities, lock baselines, and close the readiness conditions. Defer delivery execution to the approved roadmap.",
    "Do not assert execution approval, and do not invent client facts, quantified benefits, cost, effort, rates, timing, or sourcing decisions. Preserve explicit assumptions and open inputs for human review.",
  ],
};

export const MOVES_EXECUTION_KICKOFF_GUIDE: DeliverableStructure = {
  module: "moves",
  deliverableType: "execution_kickoff_guide",
  archetypeEvidenceSectionKeys: [
    "execution_ready_recap",
    "execution_evidence_checklist",
  ],
  purpose:
    "Prepare the first execution cadence after a Move leaves planning — kickoff sessions, handoff validation, value-measurement startup, governance rhythm, and the first review — without opening a new phase-gate approval.",
  decisionToSupport:
    "Start execution and Tower measurement on the accepted handoff: confirm each owner's accountability, begin the committed measures, and set the cadence and escalation rules for the first review.",
  sections: [
    s(
      "execution_ready_recap",
      "Execution-Ready Recap & Cadence Boundary",
      "Summarize only what the accepted handoff settled: committed measures, named accountable owners, the conditions attached to acceptance, and the open execution caveats recorded with them. Preserve every condition and caveat verbatim in substance; do not restate the handoff package or reopen accepted commitments.",
      "mixed",
      ["source_register", "evidence_gaps", "decision_log"],
      "Keep under 350 words. Use a compact commitment / owner / condition / status table. State explicitly that this guide starts the execution cadence and is not a new gate approval.",
    ),
    s(
      "kickoff_session_plan",
      "Kickoff Sessions & Owner Handoffs",
      "Define the smallest set of sessions needed to start execution cleanly: delivery kickoff, Tower measurement startup, risk review, governance cadence, and owner handoff. For each, state the objective, participants by role, the evidence to review, the output, and the accountable owner who leaves the session holding the work.",
      "mixed",
      ["stakeholder_input", "decision_log"],
      "Keep under 700 words. Use one compact session table and state the cadence (who meets, how often, on what). Do not re-plan the delivery workstreams.",
    ),
    s(
      "execution_evidence_checklist",
      "Execution Evidence Checklist",
      "Identify what must be in place for the cadence to report truthfully: baseline locks, workstream artifacts, measurement feeds, approval evidence, risk triggers, and first-report inputs — each with its evidence status and a named owner role. An item that is not yet in place is listed as open, never as present.",
      "mixed",
      ["source_register", "evidence_gaps", "baseline_metrics"],
      "Keep under 500 words. Use one concise item / purpose / status / owner table; point back to citations rather than repeating source narratives.",
    ),
    s(
      "governance_facilitation",
      "First Governance Cadence Facilitation",
      "Provide the questions the first governance reviews must ask, the decisions they are entitled to take, the escalation rule for each kind of exception, and the method for reviewing evidence before a figure is reported.",
      "expert_template",
      [],
      "Keep under 850 words. Organize by delivery progress, measurement and baseline integrity, and risk and escalation. Do not create a new approval gate or a decision right the handoff did not grant.",
    ),
    s(
      "first_review_readiness",
      "First-Review Readiness",
      "Set the minimum that must be captured before the first execution and Tower review, with an acceptance test, an owner role, and a status for each item. Name what is still open rather than describing the review as ready.",
      "mixed",
      ["evidence_gaps", "decision_log"],
      "Keep under 400 words. Use a compact readiness checklist. Do not imply the first review has happened or that an open item is closed.",
    ),
  ],
  requiredSectionKeys: [
    "execution_ready_recap",
    "kickoff_session_plan",
    "execution_evidence_checklist",
    "governance_facilitation",
    "first_review_readiness",
  ],
  fixedStructure: true,
  forbiddenSectionTopics: [
    "new phase gate approval",
    "completed handoff package",
    "value measurement contract",
    "execution roadmap",
    "business case",
    "detailed training curriculum",
    "final ROI",
  ],
  prohibitedContent: [
    "This is the execution kickoff working guide, not a new phase-gate approval and not a second handoff package. Carry the accepted handoff forward with its conditions intact; do not re-negotiate the committed measures.",
    "Set up only the first cadence: sessions, owners, evidence checks, escalation rules, and first-review inputs. Delivery planning belongs to the approved roadmap and ongoing measurement to Tower.",
    "Do not invent client facts, quantified benefits, cost, effort, rates, timing, or sourcing decisions, and do not report a measurement as started when its feed is still open. Preserve all caveats and conditions from the approved handoff.",
  ],
};
