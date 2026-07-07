// Proposal health assessment — deterministic scaffold.
//
// Computes the structural half of the Vendor Proposal Health Summary (completeness vs
// required sections, missing-section detection, red-flag triage from normalization
// deviations, score-readiness verdict). Narrative prose is generated separately via the
// governed orchestrator from a vendor-isolated bundle; this module never sees another
// vendor's data by construction (single-vendor inputs).

import type {
  HealthFinding,
  ProposalHealthAssessment,
  ProposalNormalizationRow,
  ScoreReadiness,
  VendorResponseFile,
} from "./types";

export interface HealthScaffoldInput {
  sourceEventId: string;
  vendorName: string;
  responseVersion: number;
  /** RFP-required section keys for this event/archetype. */
  requiredSections: string[];
  /** sections the vendor substantively answered (from parsing/normalization). */
  answeredSections: string[];
  files: VendorResponseFile[];
  rows: ProposalNormalizationRow[];
  /** extra findings contributed by the governed narrative pass (optional). */
  narrativeFindings?: HealthFinding[];
}

const REQUIRED_FILE_ROLES: {
  role: VendorResponseFile["role"];
  label: string;
}[] = [
  { role: "response_package", label: "main response package" },
  { role: "pricing_workbook", label: "pricing workbook" },
];

export function buildHealthScaffold(
  input: HealthScaffoldInput,
): ProposalHealthAssessment {
  const answered = new Set(input.answeredSections);
  const missingSections = input.requiredSections.filter(
    (s) => !answered.has(s),
  );
  const completeness =
    input.requiredSections.length === 0
      ? 1
      : Math.round(
          ((input.requiredSections.length - missingSections.length) /
            input.requiredSections.length) *
            100,
        ) / 100;

  const findings: HealthFinding[] = [...(input.narrativeFindings ?? [])];

  // missing required files are red findings with a ready-made clarification ask
  const roles = new Set(input.files.map((f) => f.role));
  for (const req of REQUIRED_FILE_ROLES) {
    if (!roles.has(req.role)) {
      findings.push({
        dimension: "completeness",
        severity: "red",
        finding: `Required ${req.label} not received.`,
        evidenceReference: null,
        clarificationQuestion: `Please submit the ${req.label} required by the RFP instructions.`,
      });
    }
  }

  // missing sections → red findings
  for (const s of missingSections) {
    findings.push({
      dimension: "completeness",
      severity: "red",
      finding: `RFP section "${s}" not substantively answered.`,
      evidenceReference: null,
      clarificationQuestion: `Provide a substantive response to RFP section "${s}".`,
    });
  }

  // non-comparable / deviating answers → amber findings with the drafted clarification
  for (const row of input.rows) {
    if (row.normalizedAnswer === null || row.deviations.length > 0) {
      findings.push({
        dimension:
          row.normalizedCategory === "pricing_structure" ||
          row.normalizedCategory === "commercial_model"
            ? "pricing"
            : "answer_quality",
        severity: row.normalizedAnswer === null ? "red" : "amber",
        finding:
          row.deviations[0] ??
          `Non-comparable answer in ${row.normalizedCategory}.`,
        evidenceReference: row.evidenceReference,
        clarificationQuestion: row.deviations[0]
          ? `Clarify: ${row.deviations[0]} (section ${row.rfpSection}).`
          : `Restate the ${row.normalizedCategory.replace(/_/g, " ")} response in the requested comparable format (section ${row.rfpSection}).`,
      });
    }
  }

  const reds = findings.filter((f) => f.severity === "red").length;
  const scoreReadiness: ScoreReadiness =
    reds === 0
      ? "ready_to_score"
      : reds <= 2 && completeness >= 0.7
        ? "score_with_caveats"
        : "not_ready";

  return {
    sourceEventId: input.sourceEventId,
    vendorName: input.vendorName,
    responseVersion: input.responseVersion,
    completeness,
    missingSections,
    findings,
    strengths: [],
    weaknesses: [],
    clarificationQuestions: [
      ...new Set(
        findings
          .map((f) => f.clarificationQuestion)
          .filter((q): q is string => Boolean(q)),
      ),
    ],
    evaluatorFocusAreas: [
      ...new Set(
        findings.filter((f) => f.severity !== "info").map((f) => f.dimension),
      ),
    ],
    scoreReadiness,
  };
}
