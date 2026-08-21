import {
  getPhaseCaptureSections,
  type PhaseCaptureSection,
} from "@/lib/programs/phase-capture-contract";

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

function materialityFor(
  section: PhaseCaptureSection,
): "ordinary" | "governed_material" {
  const text = `${section.key} ${section.label}`.toLowerCase();
  return [
    "money",
    "percentage",
    "date",
    "deadline",
    "scope",
    "sponsor",
    "owner",
    "commitment",
    "risk",
    "decision",
    "option",
    "approval",
    "funding",
    "value",
  ].some((term) => text.includes(term))
    ? "governed_material"
    : "ordinary";
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
        "Drafted from the approved origination stakeholder and owner view. Confirm cadence or authority before saving if the source is incomplete.",
      evidenceRefs: [evidenceRef(0, "stakeholder_owner_view")],
      unresolvedGaps: [
        "Confirm meeting cadence and named approval authority if not explicit in P0.",
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
        "Uses the approved sponsor and owner view as the decision-rights baseline. The user must confirm any missing authority boundaries.",
      evidenceRefs: [evidenceRef(0, "stakeholder_owner_view")],
      unresolvedGaps: [
        "Confirm who can approve scope, investment, and phase advancement.",
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

function buildGenericProposals(
  phase: number,
  currentValues: Record<string, string | null | undefined>,
  upstreamValuesByPhase: Record<
    number,
    Record<string, string | null | undefined>
  >,
): AvaPhaseInputProposal[] {
  const previousPhase = Math.max(phase - 1, 0);
  const previous = upstreamValuesByPhase[previousPhase] ?? {};
  const previousSummary = getPhaseCaptureSections(previousPhase)
    .map((section) => {
      const value = clean(previous[section.key]);
      return value ? `${section.label}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
  if (!previousSummary) return [];

  return getPhaseCaptureSections(phase)
    .filter((section) => !clean(currentValues[section.key]))
    .map((section) =>
      proposal({
        currentValues,
        fieldKey: section.key,
        materiality: materialityFor(section),
        proposedValue: `Draft from prior approved context:\n\n${previousSummary}`,
        rationale:
          "Uses the immediately preceding phase capture as a starter draft. Review, shorten, and add phase-specific decisions before saving.",
        evidenceRefs: [`P${previousPhase} approved phase inputs`],
        confidence: "medium",
        unresolvedGaps: [
          `Confirm the ${section.label.toLowerCase()} details specific to P${phase}.`,
        ],
      }),
    )
    .filter((item): item is AvaPhaseInputProposal => Boolean(item));
}

export function buildAvaPhaseInputProposals(
  input: PhaseInputDraftProposalInput,
): AvaPhaseInputProposal[] {
  const currentValues = input.currentValues ?? {};
  const missingSections = getPhaseCaptureSections(input.phase).filter(
    (section) => !clean(currentValues[section.key]),
  );
  if (missingSections.length === 0) return [];

  if (input.phase === 1) {
    return buildP1Proposals(
      currentValues,
      input.upstreamValuesByPhase[0] ?? {},
    );
  }

  return buildGenericProposals(
    input.phase,
    currentValues,
    input.upstreamValuesByPhase,
  );
}
