// The P3 Process Change Estimate Brief's section flow.
//
// Authored in its own module rather than inline in `deliverable-structures.ts`
// so the shared catalog takes a two-line change (one import, one array entry)
// and this structure can be edited without touching a file every deliverable
// type shares.
//
// WHY THIS STRUCTURE EXISTS AT ALL
//
// `composeBrief` (artifact-brief-registry.ts) builds a brief from a declared
// STRUCTURE joined with the archetype PACK. With no structure for a deliverable
// type it returns null and the registry falls through to the generic board
// brief, which resolves no pack: no archetype exhibits, no archetype tables,
// and no section carrying the archetype's evidence families.
//
// This deliverable was reached by neither guard that exists for that
// fall-through, for two different structural reasons:
//
//  - `archetypeEvidenceLandingReport` iterates `DELIVERABLE_STRUCTURES`, so a
//    type with no structure is invisible to it by construction.
//  - the phase reach suite iterates `PHASE_CANONICAL_KEYS`, and this key is not
//    in it. It is reachable only through `phaseCanonicalKeysForRoute`, which
//    returns it for the BOUNDED process-change route
//    (`route === "process_change"` with neither a material workflow change nor
//    a material role/accountability change).
//
// And it is not a minor document on that route. It is a `gateArtifact`, and the
// P3 `design_approved` hard-gate criterion requires it to meet the approval bar
// TOGETHER WITH the target state architecture (governance.ts): on the bounded
// route the gate cannot clear without it. Measured through the production
// resolution path (`orchestratorDeliverableType`, which is what
// `/api/v1/deliverables/generate-phase` and `PhaseDocumentsPanel` send), with a
// Move declaring an archetype whose pack contributes eleven evidence families:
//
//    sections served                     12 (all generic)
//    sections grounding the families      0
//    any one family on any section     none
//
// against the other half of the same gate criterion, the target state
// architecture, which has a structure and does ground them. So a Move could
// collect the governed evidence for a bounded change through Discover, get it
// approved, and then ask a sponsor to sign off a sizing basis that could cite
// none of it.
//
// The generic fall-through was also actively WRONG for this type, not merely
// thin. Two of the twelve sections it served contradict this deliverable's own
// scope discipline as the registry states it: an `operating_model` section,
// where the registry's generation hint explicitly forbids a "role-by-role
// operating model", and a `phase_gates` section, which puts internal phase
// labels into a client document. A bounded-change instrument whose whole value
// is what it leaves OUT is the worst case for an open-ended generic brief.
//
// The section spine is the one `DELIVERABLE_REGISTRY` already declares for this
// deliverable (deliverable-registry.ts), kept in the same order, plus an
// executive opener — this is an instrument a sponsor signs, and the registry's
// own six sections begin inside the change boundary with no summary to sign
// from.

import type { DeliverableStructure } from "./deliverable-structures";

export const MOVES_PROCESS_CHANGE_ESTIMATE_BRIEF: DeliverableStructure = {
  module: "moves",
  deliverableType: "process_change_estimate_brief",
  purpose:
    "Bound a limited process change to the workflow delta, controls, and adoption ownership needed to size it — and state plainly what remains unchanged.",
  decisionToSupport:
    "Sign off the bounded change and its sizing basis so the roadmap can be approved without committing to a full process redesign.",
  sections: [
    {
      key: "estimate_summary",
      title: "Estimate Summary & Decision Required",
      intent:
        "The bounded change being proposed, what it leaves untouched, the sizing range, and the sign-off asked for — in brief.",
      groundingMode: "mixed",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 450 words. Lead with the boundary and the decision; do not re-tell the move's history and do not use internal phase labels.",
    },
    {
      key: "change_boundary",
      title: "Change Boundary",
      intent:
        "The workflow steps in scope, and — stated explicitly — the steps, roles, and systems that remain unchanged.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 650 words. The out-of-scope statement is load-bearing, not a disclaimer: name what stays as it is. Where the boundary rests on an assumption rather than approved evidence, label it as one here.",
    },
    {
      key: "current_to_proposed_delta",
      title: "Current-to-Proposed Delta",
      intent:
        "Step by step, how the affected handoffs, decisions, exceptions, and volumes change — each traced to approved evidence or labelled an assumption.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 900 words and lead with the workflow delta table. Describe only the affected steps; a complete future-state process map belongs to a different deliverable and must not appear here.",
    },
    {
      key: "people_adoption_impact",
      title: "People & Adoption Impact",
      intent:
        "The roles affected, the nature and limit of each impact, the named accountable business owner, and the adoption responsibilities that stay with the business.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 700 words using the adoption accountability table. Name a real accountable individual from governed evidence; where none is on record, say so rather than naming a team or a function.",
    },
    {
      key: "controls_dependencies",
      title: "Controls & Dependencies",
      intent:
        "The human approvals, policy boundaries, data and security constraints, and integrations the change depends on — including the dependencies still unresolved.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 750 words. An unresolved dependency stated plainly is worth more here than a complete-looking list; do not design the control, record the constraint it imposes on the estimate.",
    },
    {
      key: "sizing_basis",
      title: "Sizing Basis & Open Inputs",
      intent:
        "The work packages, the evidence-backed drivers behind each figure, the assumptions, the confidence, and the inputs the next phase must resolve before a final estimate.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 900 words using the sizing basis table. This is an estimate-ready basis, not a final estimate: every driver cites its evidence or is marked an assumption, and an unresolved input is listed rather than estimated past.",
    },
    {
      key: "decision_conditions",
      title: "Decision & Conditions",
      intent:
        "The recommended bounded change, the alternatives rejected and why, the remaining evidence gaps, and the conditions under which the roadmap may be approved.",
      groundingMode: "mixed",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 650 words. State the conditions as testable statements a sponsor can check, and name an evidence gap as a condition rather than resolving it with judgment.",
    },
  ],
  requiredSectionKeys: [
    "estimate_summary",
    "change_boundary",
    "current_to_proposed_delta",
    "people_adoption_impact",
    "controls_dependencies",
    "sizing_basis",
    "decision_conditions",
  ],
  // A bounded-change instrument whose value is its boundary cannot be an
  // open-ended consulting report: the planner must treat these sections as the
  // whole document shape.
  fixedStructure: true,
  // The sections that assert CLIENT facts, named rather than left to
  // `composeBrief`'s spelling rule — which matches only
  // current_state / baseline / signal / findings / environment. None of these
  // keys is spelled that way: `current_to_proposed_delta` contains "current"
  // but not "current_state", and `sizing_basis` contains "basis", not
  // "baseline". So this field is the ONLY route the archetype's evidence has
  // in, and removing it takes grounding to zero rather than to a smaller
  // number. The summary and the decision are excluded on purpose: both are
  // judgment, and neither should pull a use case's baseline evidence.
  archetypeEvidenceSectionKeys: [
    "change_boundary",
    "current_to_proposed_delta",
    "people_adoption_impact",
    "controls_dependencies",
    "sizing_basis",
  ],
  // Tables this artifact TYPE is built around, whatever the archetype: a
  // bounded process change is sized from a step-level delta, a driver-level
  // basis, and a named owner per impacted role. Joined additively with the
  // archetype pack's tables by `composeArtifactAssets` (structure first, first
  // entry per key wins); none of these keys collides with a shipped pack's or
  // with another structure's.
  expectedTables: [
    {
      key: "workflow_delta_register",
      title: "Workflow Delta",
      columns: [
        "Workflow step",
        "Handled today",
        "Handled after change",
        "Volume",
        "Exceptions",
        "Evidence or assumption",
      ],
      groundingMode: "governed_facts",
      moveToExcelIfWide: true,
    },
    {
      key: "change_sizing_basis",
      title: "Sizing Basis",
      columns: [
        "Work package",
        "Driver",
        "Basis figure",
        "Evidence source",
        "Confidence",
        "Open input for the next phase",
      ],
      groundingMode: "governed_facts",
      moveToExcelIfWide: true,
    },
    {
      key: "adoption_accountability",
      title: "Adoption Accountability",
      columns: [
        "Impacted role",
        "Nature of impact",
        "Accountable business owner",
        "Adoption responsibility retained",
      ],
      groundingMode: "governed_facts",
      moveToExcelIfWide: false,
    },
  ],
  // Phase discipline, taken from this deliverable's own registry generation
  // hint. These are the five things a bounded estimate brief must not turn
  // into, plus the two neighbouring artifacts it must not duplicate. Matched
  // case-insensitively against section keys and titles, so none of these may
  // appear in a section title above — which is why the delta section is named
  // for the delta rather than for the process.
  forbiddenSectionTopics: [
    "future-state process map",
    "work instructions",
    "role-by-role operating model",
    "implementation specification",
    "execution plan",
    "target-state architecture",
    "vendor selection",
  ],
  prohibitedContent: [
    "Do not use internal phase labels P0, P1, P2, P3, P4, or P5 in the client narrative.",
    "Do not describe the complete future-state process. Describe only the affected workflow delta; what remains unchanged is stated as unchanged, not redesigned.",
    "Do not produce detailed work instructions, a role-by-role operating model, an implementation specification, or an execution plan — each belongs to a different deliverable.",
    "Do not present a final estimate or a committed cost. This document establishes the basis a later estimate is built from, and names the inputs still open.",
    "Do not blend approved evidence with assumptions. Every figure and every delta either cites the governed evidence behind it or is labelled an assumption.",
  ],
};
