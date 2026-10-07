import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

export type AvaPhaseInputSourceClass =
  | "approved_phase_input"
  | "approved_evidence"
  | "enterprise_context"
  | "external_benchmark"
  | "abarva_reference_pattern"
  | "evidence_gap";

export interface AvaPhaseInputProposal {
  fieldKey: string;
  currentValue: string | null;
  proposedValue: string;
  rationale: string;
  evidenceRefs: string[];
  sourceClasses: AvaPhaseInputSourceClass[];
  confidence: "high" | "medium" | "low";
  materiality: "ordinary" | "governed_material";
  unresolvedGaps: string[];
}

export interface PhaseInputDraftProposalInput {
  phase: number;
  currentValues: Record<string, string | null | undefined>;
  upstreamValuesByPhase: Record<
    number,
    Record<string, string | null | undefined>
  >;
  approvedEvidenceCount?: number;
  approvedEvidenceUnavailable?: boolean;
  /**
   * The Move's confirmed solution route, when P2 has resolved one. P3 Design
   * declares a DIFFERENT, smaller capture set per route, so "what is still
   * empty" has to be asked of the set this Move was actually asked for — the
   * route's own question counts, and the questions the route dropped do not.
   * `null`/omitted means not yet routed: the full default set, as before.
   */
  confirmedSolutionRoute?: ConfirmedSolutionRoute | null;
}

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function labelFor(phase: number, key: string): string {
  return (
    getPhaseCaptureSections(phase).find((section) => section.key === key)
      ?.label ?? key
  );
}

function evidenceRef(phase: number, key: string): string {
  return `P${phase} · ${labelFor(phase, key)}`;
}

function joinLines(lines: Array<string | null | undefined>): string {
  return lines.map(clean).filter(Boolean).join("\n\n");
}

function proposal(args: {
  currentValues: Record<string, string | null | undefined>;
  fieldKey: string;
  materiality: "ordinary" | "governed_material";
  proposedValue: string;
  rationale: string;
  evidenceRefs: string[];
  sourceClasses?: AvaPhaseInputSourceClass[];
  confidence?: "high" | "medium" | "low";
  unresolvedGaps?: string[];
}): AvaPhaseInputProposal | null {
  const proposedValue = clean(args.proposedValue);
  if (!proposedValue || args.evidenceRefs.length === 0) return null;
  return {
    fieldKey: args.fieldKey,
    currentValue: clean(args.currentValues[args.fieldKey]) || null,
    proposedValue,
    rationale: args.rationale,
    evidenceRefs: args.evidenceRefs,
    sourceClasses: args.sourceClasses ?? ["approved_phase_input"],
    confidence: args.confidence ?? "high",
    materiality: args.materiality,
    unresolvedGaps: args.unresolvedGaps ?? [],
  };
}

function buildP1Proposals(
  currentValues: Record<string, string | null | undefined>,
  p0: Record<string, string | null | undefined>,
): AvaPhaseInputProposal[] {
  const scope = clean(p0.affected_function_process);
  const outOfScope = clean(p0.scope_out);
  const knownEvidence = clean(p0.known_evidence);
  const discoveryQuestions = clean(p0.discovery_questions);
  const evidenceGaps = clean(p0.missing_evidence_open_questions);

  return [
    proposal({
      currentValues,
      fieldKey: "sponsor_commitment",
      materiality: "governed_material",
      proposedValue: clean(p0.stakeholder_owner_view),
      rationale:
        "Drafted from the approved origination stakeholder and owner view. Confirm the sponsor contact and explicit progress-email preference before saving; do not infer approval authority from sponsor status.",
      evidenceRefs: [evidenceRef(0, "stakeholder_owner_view")],
      unresolvedGaps: [
        "Confirm sponsor contact details and whether phase-progress emails should be sent.",
      ],
    }),
    proposal({
      currentValues,
      fieldKey: "scope_boundary",
      materiality: "governed_material",
      proposedValue: joinLines([
        scope ? `In scope: ${scope}` : "",
        outOfScope ? `Out of scope: ${outOfScope}` : "",
      ]),
      rationale:
        "Carries forward the approved P0 in-scope and out-of-scope boundaries without broadening them.",
      evidenceRefs: [
        ...(scope ? [evidenceRef(0, "affected_function_process")] : []),
        ...(outOfScope ? [evidenceRef(0, "scope_out")] : []),
      ],
    }),
    proposal({
      currentValues,
      fieldKey: "success_criteria",
      materiality: "ordinary",
      proposedValue: clean(p0.outcomes_success),
      rationale:
        "Uses the approved P0 intended outcomes as the starting success criteria for Discovery.",
      evidenceRefs: [evidenceRef(0, "outcomes_success")],
    }),
    proposal({
      currentValues,
      fieldKey: "stakeholder_map",
      materiality: "ordinary",
      proposedValue: clean(p0.stakeholder_owner_view),
      rationale:
        "Starts the stakeholder map from the approved origination owner view; additional participants can be added by the user.",
      evidenceRefs: [evidenceRef(0, "stakeholder_owner_view")],
      unresolvedGaps: [
        "Add missing business, technology, finance, risk, or operations participants.",
      ],
    }),
    proposal({
      currentValues,
      fieldKey: "decision_rights",
      materiality: "governed_material",
      proposedValue: clean(p0.stakeholder_owner_view),
      rationale:
        "Uses the approved owner view to record business accountability. Product gate authority remains with the authorized workspace user; capture any separate external funding authority as context, not as a Moves approval request.",
      evidenceRefs: [evidenceRef(0, "stakeholder_owner_view")],
      unresolvedGaps: [
        "Confirm any external funding decision required; the authorized workspace user records Moves phase approval.",
      ],
    }),
    proposal({
      currentValues,
      fieldKey: "evidence_plan",
      materiality: "ordinary",
      proposedValue: joinLines([
        knownEvidence ? `Known evidence: ${knownEvidence}` : "",
        discoveryQuestions ? `Discovery questions: ${discoveryQuestions}` : "",
        evidenceGaps ? `Open gaps: ${evidenceGaps}` : "",
      ]),
      rationale:
        "Combines the approved known evidence, discovery hypotheses, and open evidence gaps into a starter evidence plan.",
      evidenceRefs: [
        ...(knownEvidence ? [evidenceRef(0, "known_evidence")] : []),
        ...(discoveryQuestions ? [evidenceRef(0, "discovery_questions")] : []),
        ...(evidenceGaps
          ? [evidenceRef(0, "missing_evidence_open_questions")]
          : []),
      ],
      sourceClasses: ["approved_phase_input", "evidence_gap"],
      unresolvedGaps: evidenceGaps ? [evidenceGaps] : [],
    }),
  ].filter((item): item is AvaPhaseInputProposal => Boolean(item));
}

export function buildAvaPhaseInputProposals(
  input: PhaseInputDraftProposalInput,
): AvaPhaseInputProposal[] {
  const currentValues = input.currentValues ?? {};
  const missingSections = getPhaseCaptureSections(
    input.phase,
    input.confirmedSolutionRoute ?? null,
  ).filter((section) => !clean(currentValues[section.key]));
  if (missingSections.length === 0) return [];

  if (input.phase === 1) {
    return buildP1Proposals(
      currentValues,
      input.upstreamValuesByPhase[0] ?? {},
    );
  }

  // Later phases need phase-specific, field-linked evidence. A prior phase is
  // useful context, but copying it into every empty field creates false drafts.
  return [];
}

export function describeAvaPhaseInputDraftRefusal(
  input: PhaseInputDraftProposalInput,
): string | null {
  const currentValues = input.currentValues ?? {};
  const missingSections = getPhaseCaptureSections(
    input.phase,
    input.confirmedSolutionRoute ?? null,
  ).filter((section) => !clean(currentValues[section.key]));

  if (missingSections.length === 0) {
    return `P${input.phase} inputs already have current values. There is nothing empty for aVa to draft; edit a field manually if you want an override.`;
  }

  if (input.phase > 1) {
    const evidenceStatus = input.approvedEvidenceUnavailable
      ? `The approved P${input.phase} evidence set could not be verified.`
      : input.approvedEvidenceCount
        ? `${input.approvedEvidenceCount} approved P${input.phase} evidence item${input.approvedEvidenceCount === 1 ? " is" : "s are"} available, but no field-level evidence mapping connects them to these capture inputs.`
        : `No approved P${input.phase} evidence is available, and no field-level evidence mapping is available for these capture inputs.`;
    return `${evidenceStatus} Prior-phase captures are context, not evidence for P${input.phase}, so aVa did not copy them into the fields. Review the phase evidence and complete each field with human judgment; nothing was saved.`;
  }

  return "No cited draft is available from the approved P0 capture. Add source context first or write the field manually.";
}
