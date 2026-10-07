// The P5 Value Measurement Contract's section flow.
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
// Measured across the twenty canonical phase deliverables, resolved the way
// production resolves them (`orchestratorDeliverableType`, which is what
// `/api/v1/deliverables/generate-phase` and `PhaseDocumentsPanel` send), four
// had no structure. Three of those four are working session guides. This one is
// not: it is a `gateArtifact` with its own quality profile
// (`moves::value_measurement_contract`, six sections minimum, table-led,
// evidence gaps required) and a P5 hard-gate criterion that reads its sign-off
// (`value_measurement_contract_signed_off`, governance.ts). It was the only
// non-guide client-facing phase deliverable generating with none of the
// archetype's evidence reaching it — so a Move could collect a measurement
// owner's cadence and a finance baseline through Discover, get them approved,
// and then commit to outcomes in a document that could not cite either.
//
// It deliberately does NOT reuse the `value_model` structure that
// `tower_metrics_plan` maps to. The two are different instruments: a metrics
// plan proposes how value will be measured, this contract commits named people
// to it. Pointing both at one structure is the mistake the mapping's own notes
// already record for `root_cause_worksheet` — it produced a second copy of its
// neighbour rather than its own artifact.
//
// The section spine is the one `DELIVERABLE_REGISTRY` already declares for this
// deliverable (deliverable-registry.ts), kept in the same order, plus an
// executive commitment opener and a closing measurement-gap section. The gap
// section is what `requiresEvidenceGapsNoted` asks for and it is where an
// archetype family the Move has NOT closed gets named rather than papered over.

import type { DeliverableStructure } from "./deliverable-structures";

export const MOVES_VALUE_MEASUREMENT_CONTRACT: DeliverableStructure = {
  module: "moves",
  deliverableType: "value_measurement_contract",
  purpose:
    "Commit named owners to the outcomes the move promises, and to how each one will be measured and reviewed.",
  decisionToSupport:
    "Sign off the committed outcomes, their measurement method, and the individual accountable for each.",
  sections: [
    {
      key: "commitment_summary",
      title: "Commitment Summary & Sign-Off Required",
      intent:
        "The outcomes being committed, the total value at stake, and the sign-off asked for — in brief.",
      groundingMode: "mixed",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 450 words. Lead with what is being committed and who is signing; do not re-tell the move's history and do not use internal phase labels.",
    },
    {
      key: "committed_outcomes",
      title: "Committed Outcomes",
      intent:
        "Each value lever with its baseline, target, timeline, and confidence level — specific figures, never a qualitative range.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 900 words and lead with the commitment register table. Every baseline must cite the governed evidence it came from; an uncited baseline belongs in the measurement-gaps section instead of here.",
    },
    {
      key: "measurement_methodology",
      title: "Measurement Methodology",
      intent:
        "For each committed outcome: the data source, the calculation, the frequency, and the system of record that will carry it.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 950 words using the measurement method table. Name the real system of record; do not describe a measurement pipeline the move has not established.",
    },
    {
      key: "accountability",
      title: "Accountability",
      intent:
        "The single named individual accountable for each committed outcome, their role, and their recorded acknowledgment.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 700 words using the accountability table. One named individual per outcome — never a team, a function, or a committee. Where no individual is on record, say so in this section rather than naming a group.",
    },
    {
      key: "review_cadence",
      title: "Review Cadence & Escalation",
      intent:
        "When each outcome is reviewed, who reviews it, and what variance triggers escalation to the sponsor.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 650 words. State the cadence the owners actually hold, and the escalation threshold as a figure rather than a sentiment.",
    },
    {
      key: "measurement_gaps",
      title: "Measurement Gaps & Conditions to Close",
      intent:
        "Every committed outcome whose baseline, data source, owner, or cadence is not yet evidenced — and the condition that closes each gap.",
      groundingMode: "governed_facts",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 700 words. This section exists so a gap is recorded rather than filled with an estimate; state the gap, its effect on the commitment, and what would close it.",
    },
    {
      key: "revision_conditions",
      title: "Revision Conditions",
      intent:
        "The conditions under which a committed target may be revised, and the approval route a revision takes.",
      groundingMode: "client_to_complete",
      expectedEvidenceFamilies: [],
      expertLatitude:
        "Keep under 450 words. The revision route is the client's own governance and must be supplied, not inferred — offer the structure and leave the approvals to be filled in.",
    },
  ],
  requiredSectionKeys: [
    "commitment_summary",
    "committed_outcomes",
    "measurement_methodology",
    "accountability",
    "review_cadence",
    "measurement_gaps",
  ],
  fixedStructure: true,
  // The sections that assert CLIENT facts, named rather than left to
  // `composeBrief`'s spelling rule — which matches only
  // current_state / baseline / signal / findings / environment, and none of
  // this contract's keys is spelled that way. Without this field a declared
  // archetype would reach the document with zero evidence grounding even after
  // the structure existed. The commitment summary and the revision route are
  // excluded on purpose: one is judgment, the other is the client's own
  // governance.
  archetypeEvidenceSectionKeys: [
    "committed_outcomes",
    "measurement_methodology",
    "accountability",
    "review_cadence",
    "measurement_gaps",
  ],
  // Tables this artifact TYPE is built around, whatever the archetype — the
  // quality profile for this key is explicitly table-led. Joined additively
  // with the archetype pack's tables by `composeArtifactAssets` (structure
  // first, first entry per key wins); none of these keys collides with a
  // shipped pack's.
  expectedTables: [
    {
      key: "committed_outcome_register",
      title: "Committed Outcome Register",
      columns: [
        "Outcome",
        "Value lever",
        "Baseline",
        "Target",
        "Timeline",
        "Confidence",
        "Baseline source",
      ],
      groundingMode: "governed_facts",
      moveToExcelIfWide: true,
    },
    {
      key: "measurement_method_register",
      title: "Measurement Method",
      columns: [
        "Outcome",
        "Data source",
        "Calculation",
        "Frequency",
        "System of record",
      ],
      groundingMode: "governed_facts",
      moveToExcelIfWide: false,
    },
    {
      key: "outcome_accountability",
      title: "Outcome Accountability",
      columns: [
        "Outcome",
        "Accountable individual",
        "Role",
        "Acknowledged",
        "Escalation to",
      ],
      groundingMode: "governed_facts",
      moveToExcelIfWide: false,
    },
  ],
  // Phase discipline: this is the instrument that commits to measurement. It
  // is not where the move is re-diagnosed, re-designed, or re-sequenced.
  // Matched case-insensitively against section keys and titles, so none of
  // these may appear in a section title above.
  forbiddenSectionTopics: [
    "current-state diagnosis",
    "root cause",
    "target-state architecture",
    "solution design",
    "vendor selection",
    "delivery roadmap",
  ],
  prohibitedContent: [
    "Do not use internal phase labels P0, P1, P2, P3, P4, or P5 in the client narrative.",
    "Do not become a second business case, value model, or handoff pack; this document commits to measurement, it does not re-argue the investment.",
    "Do not state a baseline, target, owner, or cadence that no governed evidence supports — record it as a gap instead.",
    "Do not attribute an outcome to a team, function, or committee; accountability here is one named individual per outcome.",
  ],
};
