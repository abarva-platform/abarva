// SOL13 · Workshop-to-Architecture Refinement.
//
// Pure deterministic library that turns structured MW4 meeting note
// captures from `architecture_solution_design`-style workshops (and the
// architecture-adjacent topics surfaced in any other canonical workshop
// type) into proposed architecture refinements. Operationalizes the
// SOL8 Solution Intelligence Canvas section on dynamic refinement and
// the MW1 contract section on after-workshop synthesis, focused on
// architecture-level proposals rather than program-level proposals.
//
// What this module does:
//   - Defines the seven canonical architecture refinement types.
//   - Translates a list of MeetingNoteCapture records into a flat list
//     of ArchitectureRefinementProposal rows with full provenance.
//   - Marks every proposal `proposed: true` (never applied) and ties it
//     to the source note id, source workshop type, target architecture
//     section, and a concrete rationale.
//   - Synthesizes the proposals into a deterministic counts summary.
//
// What this module deliberately does NOT do:
//   - No model invocation. No live clocks, randomness, or network IO.
//   - No persistence. No database, no remote storage backend, or auth
//     dependencies.
//   - No DB writes. No state mutation. No phase advance / gate signoff.
//   - No imports from the Source UI, Sentinel, Atlas, Nexus, Agent, or
//     auth runtime modules.
//   - Does not apply, write, or persist any architecture change. The
//     module is a *proposal* surface. The Maestro confirms before any
//     downstream architecture-draft module would apply a change.
//
// Read-only references to the MW4 meeting-notes-capture module are
// allowed; this module imports the canonical capture types so the
// proposal shape stays reconciled with MW4.

import type {
  MeetingDecision,
  MeetingEvidenceCandidate,
  MeetingNoteCapture,
  MeetingOpenQuestion,
  MeetingRisk,
  MeetingStakeholderAlignment,
} from '@/lib/programs/meeting-notes-capture';

// ---------------------------------------------------------------------
// Public refinement-type union
// ---------------------------------------------------------------------

export const ARCHITECTURE_REFINEMENT_TYPES = [
  'add_component',
  'remove_component',
  'modify_component',
  'add_assumption',
  'add_risk',
  'add_evidence_gap',
  'change_section',
] as const;

export type ArchitectureRefinementType =
  (typeof ARCHITECTURE_REFINEMENT_TYPES)[number];

// ---------------------------------------------------------------------
// Target sections within the candidate solution architecture
// ---------------------------------------------------------------------

export const ARCHITECTURE_TARGET_SECTIONS = [
  'components',
  'integration_boundaries',
  'data_foundation',
  'governance_controls',
  'assumptions',
  'risks',
  'evidence_gaps',
  'operating_model',
  'value_framing',
] as const;

export type ArchitectureTargetSection =
  (typeof ARCHITECTURE_TARGET_SECTIONS)[number];

// ---------------------------------------------------------------------
// Source attribution
// ---------------------------------------------------------------------

/**
 * Provenance for every architecture-refinement proposal. Ties the
 * proposal back to the source note + workshop so the Maestro can show
 * the reviewer "this came from note X in workshop Y".
 */
export interface ArchitectureRefinementSource {
  programKey: string;
  sourceNoteId: string;
  sourceWorkshopType: string;
  sourceWorkshopOrdinal: number;
}

// ---------------------------------------------------------------------
// Proposal record
// ---------------------------------------------------------------------

export interface ArchitectureRefinementProposal {
  id: string;
  refinementType: ArchitectureRefinementType;
  // Architecture refinements are always read-only suggestions surfaced
  // for the Maestro to confirm. They are never applied automatically.
  proposed: true;
  // Convenience mirror so callers can grep for the literal string.
  status: 'proposed';
  source: ArchitectureRefinementSource;
  // Convenience mirrors of source.* so callers can read provenance
  // without destructuring; the SOL13 contract names these fields
  // explicitly as part of the proposal record.
  sourceNoteId: string;
  sourceWorkshopType: string;
  targetSection: ArchitectureTargetSection;
  // Optional component / assumption / risk / evidence-gap label the
  // refinement names. For `change_section` proposals, this is the
  // section change topic.
  componentLabel?: string;
  // Human-readable description of the refinement. Drawn from the source
  // note content in a deterministic way (no model synthesis).
  description: string;
  // Always populated. Names the source note, the workshop, and the
  // signal that triggered the proposal so the reviewer can audit it.
  rationale: string;
  createdFrom: 'deterministic_workshop_architecture_refinement_seed';
}

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

export interface ArchitectureRefinementSummary {
  totalProposals: number;
  byRefinementType: Record<ArchitectureRefinementType, number>;
  byTargetSection: Record<ArchitectureTargetSection, number>;
  // Architecture refinements are never auto-applied; this surface lets
  // callers assert the invariant explicitly.
  appliedProposals: 0;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const SOURCE_TAG = 'deterministic_workshop_architecture_refinement_seed';

// Lower-case keyword sets used to deterministically classify free-text
// note signals into architecture refinement types. Order matters: the
// first match wins. These are intentionally conservative; the reviewer
// confirms before any change lands.
const ADD_COMPONENT_KEYWORDS: readonly string[] = [
  'add component',
  'introduce component',
  'add a service',
  'introduce service',
  'add a vendor',
  'introduce vendor',
  'add layer',
  'add gateway',
  'introduce gateway',
];

const REMOVE_COMPONENT_KEYWORDS: readonly string[] = [
  'remove component',
  'retire component',
  'deprecate component',
  'drop component',
  'remove vendor',
  'retire vendor',
  'eliminate component',
];

const MODIFY_COMPONENT_KEYWORDS: readonly string[] = [
  'modify component',
  'change component',
  'reconfigure component',
  'replace component',
  'swap component',
  'tune component',
  'redirect component',
];

// ---------------------------------------------------------------------
// Public derivation entry point
// ---------------------------------------------------------------------

/**
 * Top-level entry point. Walks the captured notes and returns the
 * full list of proposed architecture refinements in a deterministic
 * order: component changes (add → remove → modify), then assumptions,
 * risks, evidence gaps, and section changes.
 *
 * Pure: same input list → identical output across calls.
 */
export function deriveArchitectureRefinementsFromMeetingNotes(
  notes: readonly MeetingNoteCapture[],
): readonly ArchitectureRefinementProposal[] {
  const out: ArchitectureRefinementProposal[] = [];
  for (const proposal of deriveAddComponentProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveRemoveComponentProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveModifyComponentProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveAssumptionProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveRiskProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveEvidenceGapProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveChangeSectionProposals(notes)) {
    out.push(proposal);
  }
  return out;
}

// ---------------------------------------------------------------------
// Per-refinement-type derivation helpers
// ---------------------------------------------------------------------

/**
 * `add_component` — emitted when a decision narrative contains an
 * add-component keyword phrase. Components target the `components`
 * architecture section.
 */
export function deriveAddComponentProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ArchitectureRefinementProposal[] {
  const out: ArchitectureRefinementProposal[] = [];
  for (const note of notes) {
    for (const decision of note.decisions) {
      if (matchesAny(decision.decision, ADD_COMPONENT_KEYWORDS)) {
        out.push({
          id: `${SOURCE_TAG}-${note.id}-${decision.id}-add-component`,
          refinementType: 'add_component',
          proposed: true,
          status: 'proposed',
          source: buildSource(note),
          sourceNoteId: note.id,
          sourceWorkshopType: note.workshopType,
          targetSection: 'components',
          componentLabel: decision.decision,
          description: decision.decision,
          rationale: composeDecisionRationale(note, decision, 'add_component'),
          createdFrom: SOURCE_TAG,
        });
      }
    }
  }
  return out;
}

/**
 * `remove_component` — emitted when a decision narrative contains a
 * remove-component keyword phrase.
 */
export function deriveRemoveComponentProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ArchitectureRefinementProposal[] {
  const out: ArchitectureRefinementProposal[] = [];
  for (const note of notes) {
    for (const decision of note.decisions) {
      if (matchesAny(decision.decision, REMOVE_COMPONENT_KEYWORDS)) {
        out.push({
          id: `${SOURCE_TAG}-${note.id}-${decision.id}-remove-component`,
          refinementType: 'remove_component',
          proposed: true,
          status: 'proposed',
          source: buildSource(note),
          sourceNoteId: note.id,
          sourceWorkshopType: note.workshopType,
          targetSection: 'components',
          componentLabel: decision.decision,
          description: decision.decision,
          rationale: composeDecisionRationale(
            note,
            decision,
            'remove_component',
          ),
          createdFrom: SOURCE_TAG,
        });
      }
    }
  }
  return out;
}

/**
 * `modify_component` — emitted when a decision narrative contains a
 * modify-component keyword phrase. Decisions that affect a deliverable
 * key (per MW4 schema) are also surfaced as `modify_component` because
 * a deliverable change implies a corresponding architecture change.
 */
export function deriveModifyComponentProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ArchitectureRefinementProposal[] {
  const out: ArchitectureRefinementProposal[] = [];
  for (const note of notes) {
    for (const decision of note.decisions) {
      const matchesKeyword = matchesAny(
        decision.decision,
        MODIFY_COMPONENT_KEYWORDS,
      );
      const affectsDeliverable = Boolean(decision.affectsDeliverableKey);
      if (matchesKeyword || affectsDeliverable) {
        // Skip if the decision was already classified as add or remove.
        if (
          matchesAny(decision.decision, ADD_COMPONENT_KEYWORDS) ||
          matchesAny(decision.decision, REMOVE_COMPONENT_KEYWORDS)
        ) {
          continue;
        }
        out.push({
          id: `${SOURCE_TAG}-${note.id}-${decision.id}-modify-component`,
          refinementType: 'modify_component',
          proposed: true,
          status: 'proposed',
          source: buildSource(note),
          sourceNoteId: note.id,
          sourceWorkshopType: note.workshopType,
          targetSection: 'components',
          componentLabel: decision.decision,
          description: decision.decision,
          rationale: composeDecisionRationale(
            note,
            decision,
            'modify_component',
          ),
          createdFrom: SOURCE_TAG,
        });
      }
    }
  }
  return out;
}

/**
 * `add_assumption` — emitted from stakeholder-alignment topics that the
 * room either aligned on or marked pending. The architecture draft
 * carries an explicit assumption; the Maestro confirms wording before
 * it lands.
 */
export function deriveAssumptionProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ArchitectureRefinementProposal[] {
  const out: ArchitectureRefinementProposal[] = [];
  for (const note of notes) {
    for (const alignment of note.stakeholderAlignment) {
      if (alignment.state !== 'aligned' && alignment.state !== 'pending') {
        continue;
      }
      out.push({
        id: `${SOURCE_TAG}-${note.id}-${alignment.id}-add-assumption`,
        refinementType: 'add_assumption',
        proposed: true,
        status: 'proposed',
        source: buildSource(note),
        sourceNoteId: note.id,
        sourceWorkshopType: note.workshopType,
        targetSection: 'assumptions',
        componentLabel: alignment.topic,
        description: alignment.topic,
        rationale: composeAlignmentRationale(note, alignment),
        createdFrom: SOURCE_TAG,
      });
    }
  }
  return out;
}

/**
 * `add_risk` — emitted for every captured risk so the architecture
 * draft inherits the same risk register the workshop surfaced.
 */
export function deriveRiskProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ArchitectureRefinementProposal[] {
  const out: ArchitectureRefinementProposal[] = [];
  for (const note of notes) {
    for (const risk of note.risks) {
      out.push({
        id: `${SOURCE_TAG}-${note.id}-${risk.id}-add-risk`,
        refinementType: 'add_risk',
        proposed: true,
        status: 'proposed',
        source: buildSource(note),
        sourceNoteId: note.id,
        sourceWorkshopType: note.workshopType,
        targetSection: 'risks',
        componentLabel: risk.description,
        description: risk.description,
        rationale: composeRiskRationale(note, risk),
        createdFrom: SOURCE_TAG,
      });
    }
  }
  return out;
}

/**
 * `add_evidence_gap` — emitted from open questions blocking gate
 * signoff or deliverable approval, and from evidence candidates that
 * still need capture.
 */
export function deriveEvidenceGapProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ArchitectureRefinementProposal[] {
  const out: ArchitectureRefinementProposal[] = [];
  for (const note of notes) {
    for (const question of note.openQuestions) {
      if (
        question.blocks === 'gate_signoff' ||
        question.blocks === 'deliverable_approval'
      ) {
        out.push({
          id: `${SOURCE_TAG}-${note.id}-${question.id}-add-evidence-gap`,
          refinementType: 'add_evidence_gap',
          proposed: true,
          status: 'proposed',
          source: buildSource(note),
          sourceNoteId: note.id,
          sourceWorkshopType: note.workshopType,
          targetSection: 'evidence_gaps',
          componentLabel: question.question,
          description: question.question,
          rationale: composeOpenQuestionRationale(note, question),
          createdFrom: SOURCE_TAG,
        });
      }
    }
    for (const evidence of note.evidenceCandidates) {
      if (!evidence.needsCapture) continue;
      out.push({
        id: `${SOURCE_TAG}-${note.id}-${evidence.id}-add-evidence-gap`,
        refinementType: 'add_evidence_gap',
        proposed: true,
        status: 'proposed',
        source: buildSource(note),
        sourceNoteId: note.id,
        sourceWorkshopType: note.workshopType,
        targetSection: 'evidence_gaps',
        componentLabel: evidence.description,
        description: evidence.description,
        rationale: composeEvidenceRationale(note, evidence),
        createdFrom: SOURCE_TAG,
      });
    }
  }
  return out;
}

/**
 * `change_section` — emitted when the workshop type signals an
 * architecture-section change beyond components: data-foundation
 * sessions update the data foundation section, governance/risk
 * sessions update the governance controls section, value framing
 * sessions update the value framing section, and operating-model
 * sessions update the operating model section.
 */
export function deriveChangeSectionProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ArchitectureRefinementProposal[] {
  const out: ArchitectureRefinementProposal[] = [];
  for (const note of notes) {
    const targetSection = mapWorkshopTypeToSectionChange(note.workshopType);
    if (!targetSection) continue;
    for (const decision of note.decisions) {
      // Skip if the decision already produced a component proposal.
      if (
        matchesAny(decision.decision, ADD_COMPONENT_KEYWORDS) ||
        matchesAny(decision.decision, REMOVE_COMPONENT_KEYWORDS) ||
        matchesAny(decision.decision, MODIFY_COMPONENT_KEYWORDS) ||
        decision.affectsDeliverableKey
      ) {
        continue;
      }
      out.push({
        id: `${SOURCE_TAG}-${note.id}-${decision.id}-change-section`,
        refinementType: 'change_section',
        proposed: true,
        status: 'proposed',
        source: buildSource(note),
        sourceNoteId: note.id,
        sourceWorkshopType: note.workshopType,
        targetSection,
        componentLabel: decision.decision,
        description: decision.decision,
        rationale: composeSectionChangeRationale(
          note,
          decision,
          targetSection,
        ),
        createdFrom: SOURCE_TAG,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------
// Public summary helper
// ---------------------------------------------------------------------

/**
 * Reduce a refinement-proposal list into an at-a-glance summary. Pure.
 */
export function summarizeArchitectureRefinements(
  proposals: readonly ArchitectureRefinementProposal[],
): ArchitectureRefinementSummary {
  const byRefinementType = emptyByRefinementType();
  const byTargetSection = emptyByTargetSection();
  for (const proposal of proposals) {
    byRefinementType[proposal.refinementType] += 1;
    byTargetSection[proposal.targetSection] += 1;
  }
  return {
    totalProposals: proposals.length,
    byRefinementType,
    byTargetSection,
    appliedProposals: 0,
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildSource(note: MeetingNoteCapture): ArchitectureRefinementSource {
  return {
    programKey: note.programKey,
    sourceNoteId: note.id,
    sourceWorkshopType: note.workshopType,
    sourceWorkshopOrdinal: note.workshopOrdinal,
  };
}

function matchesAny(text: string, needles: readonly string[]): boolean {
  if (text.length === 0) return false;
  const lower = text.toLowerCase();
  for (const needle of needles) {
    if (needle.length === 0) continue;
    if (lower.includes(needle)) return true;
  }
  return false;
}

function emptyByRefinementType(): Record<ArchitectureRefinementType, number> {
  return {
    add_component: 0,
    remove_component: 0,
    modify_component: 0,
    add_assumption: 0,
    add_risk: 0,
    add_evidence_gap: 0,
    change_section: 0,
  };
}

function emptyByTargetSection(): Record<ArchitectureTargetSection, number> {
  return {
    components: 0,
    integration_boundaries: 0,
    data_foundation: 0,
    governance_controls: 0,
    assumptions: 0,
    risks: 0,
    evidence_gaps: 0,
    operating_model: 0,
    value_framing: 0,
  };
}

function mapWorkshopTypeToSectionChange(
  workshopType: string,
): ArchitectureTargetSection | null {
  switch (workshopType) {
    case 'data_foundation_assessment':
      return 'data_foundation';
    case 'governance_risk_review':
      return 'governance_controls';
    case 'operating_model_alignment':
      return 'operating_model';
    case 'value_framing':
      return 'value_framing';
    case 'architecture_solution_design':
      return 'integration_boundaries';
    default:
      return null;
  }
}

function composeDecisionRationale(
  note: MeetingNoteCapture,
  decision: MeetingDecision,
  refinementType: ArchitectureRefinementType,
): string {
  return `Decision ${decision.id} captured by ${decision.decidedBy} during ${note.workshopType} session ${note.workshopOrdinal} of program ${note.programKey} implies a ${refinementType} architecture refinement; reviewer must confirm before any architecture draft is updated.`;
}

function composeAlignmentRationale(
  note: MeetingNoteCapture,
  alignment: MeetingStakeholderAlignment,
): string {
  return `Stakeholder alignment ${alignment.id} on "${alignment.topic}" reached state "${alignment.state}" during ${note.workshopType} session ${note.workshopOrdinal} of program ${note.programKey}; the architecture draft should carry this as an explicit assumption.`;
}

function composeRiskRationale(
  note: MeetingNoteCapture,
  risk: MeetingRisk,
): string {
  return `Risk ${risk.id} (likelihood ${risk.likelihood}, impact ${risk.impact}) surfaced during ${note.workshopType} session ${note.workshopOrdinal} of program ${note.programKey}; the architecture draft should record this in its risks section.`;
}

function composeOpenQuestionRationale(
  note: MeetingNoteCapture,
  question: MeetingOpenQuestion,
): string {
  return `Open question ${question.id} blocks ${question.blocks ?? 'none'} per ${note.workshopType} session ${note.workshopOrdinal} of program ${note.programKey}; the architecture draft should record this as an evidence gap until the question is answered.`;
}

function composeEvidenceRationale(
  note: MeetingNoteCapture,
  evidence: MeetingEvidenceCandidate,
): string {
  return `Evidence candidate ${evidence.id} from ${evidence.sourceLabel} source still needs capture per ${note.workshopType} session ${note.workshopOrdinal} of program ${note.programKey}; the architecture draft should record this as an explicit evidence gap.`;
}

function composeSectionChangeRationale(
  note: MeetingNoteCapture,
  decision: MeetingDecision,
  targetSection: ArchitectureTargetSection,
): string {
  return `Decision ${decision.id} during ${note.workshopType} session ${note.workshopOrdinal} of program ${note.programKey} implies a section change to "${targetSection}"; reviewer must confirm before any architecture draft is updated.`;
}
