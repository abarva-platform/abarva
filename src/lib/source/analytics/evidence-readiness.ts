import type {
  SourceConfidence,
  SourceEvidenceReadiness,
  SourceEvidenceReference,
  SourceEvidenceType,
} from "./types";

export const CONTRACT_OPTIMIZATION_REQUIRED_EVIDENCE: SourceEvidenceType[] = [
  "contract_msa",
  "statement_of_work",
  "pricing_schedule",
  "invoice_history",
  "sla_report",
  "ticket_history",
  "staffing_model",
  "change_order_ledger",
  "renewal_notice",
];

export const VENDOR_RESPONSE_REQUIRED_EVIDENCE: SourceEvidenceType[] = [
  "vendor_response_narrative",
  "vendor_claim_register",
  "pricing_workbook",
  "staffing_location_model",
  "sla_commitment_table",
  "assumptions_exclusions_log",
  "commercial_exceptions_table",
  "transition_plan",
];

export function calculateEvidenceCompleteness(
  evidenceRefs: SourceEvidenceReference[],
  requiredEvidence: SourceEvidenceType[],
): number {
  if (!requiredEvidence.length) return 100;
  const present = new Set(evidenceRefs.map((ref) => ref.evidenceType));
  const covered = requiredEvidence.filter((type) => present.has(type)).length;
  return Math.round((covered / requiredEvidence.length) * 100);
}

export function detectMissingEvidence(
  evidenceRefs: SourceEvidenceReference[],
  requiredEvidence: SourceEvidenceType[],
): SourceEvidenceType[] {
  const present = new Set(evidenceRefs.map((ref) => ref.evidenceType));
  return requiredEvidence.filter((type) => !present.has(type));
}

export function assignEvidenceMode(completenessScore: number) {
  if (completenessScore >= 85) return "evidence_rich" as const;
  if (completenessScore >= 35) return "evidence_partial" as const;
  return "evidence_light" as const;
}

export function calculateProofBoundaryScore(
  completenessScore: number,
  missingEvidenceCount: number,
  assumptionCount: number,
): number {
  const penalty = missingEvidenceCount * 4 + assumptionCount * 3;
  return Math.max(0, Math.min(100, Math.round(completenessScore - penalty)));
}

export function separateFactsAssumptionsAndGaps(args: {
  facts: string[];
  assumptions?: string[];
  missingEvidence: SourceEvidenceType[];
}): {
  factsAvailable: string[];
  assumptions: string[];
  gaps: SourceEvidenceType[];
  cannotQuantify: string[];
} {
  const assumptions = args.assumptions ?? [];
  return {
    factsAvailable: args.facts,
    assumptions,
    gaps: args.missingEvidence,
    cannotQuantify: cannotQuantifyForMissingEvidence(args.missingEvidence),
  };
}

export function buildDataRequestPack(
  missingEvidence: SourceEvidenceType[],
): string[] {
  return missingEvidence.map((type) => dataRequestFor(type));
}

export function buildEvidenceReadinessSummary(args: {
  evidenceRefs: SourceEvidenceReference[];
  requiredEvidence: SourceEvidenceType[];
  optionalEvidence?: SourceEvidenceType[];
  assumptions?: string[];
}): SourceEvidenceReadiness {
  const optionalEvidence = args.optionalEvidence ?? [];
  const presentTypes = new Set(args.evidenceRefs.map((ref) => ref.evidenceType));
  const requiredEvidenceMissing = detectMissingEvidence(
    args.evidenceRefs,
    args.requiredEvidence,
  );
  const requiredEvidencePresent = args.requiredEvidence.filter((type) =>
    presentTypes.has(type),
  );
  const optionalEvidencePresent = optionalEvidence.filter((type) =>
    presentTypes.has(type),
  );
  const completenessScore = calculateEvidenceCompleteness(
    args.evidenceRefs,
    args.requiredEvidence,
  );
  const assumptions = args.assumptions ?? [];
  const cannotQuantify = cannotQuantifyForMissingEvidence(requiredEvidenceMissing);
  const proofBoundaryScore = calculateProofBoundaryScore(
    completenessScore,
    requiredEvidenceMissing.length,
    assumptions.length,
  );
  const mode = assignEvidenceMode(completenessScore);
  const confidence = confidenceFor(mode, requiredEvidenceMissing.length);

  return {
    mode,
    completenessScore,
    requiredEvidencePresent,
    requiredEvidenceMissing,
    optionalEvidencePresent,
    assumptions,
    cannotQuantify,
    recommendedDataRequests: buildDataRequestPack(requiredEvidenceMissing),
    confidence,
    proofBoundaryScore,
    stageReadiness:
      mode === "evidence_rich"
        ? "ready"
        : mode === "evidence_partial"
          ? "conditional"
          : "not_ready",
  };
}

function confidenceFor(
  mode: SourceEvidenceReadiness["mode"],
  missingEvidenceCount: number,
): SourceConfidence {
  if (mode === "evidence_rich" && missingEvidenceCount <= 1) return "high";
  if (mode === "evidence_light") return "low";
  return "medium";
}

function cannotQuantifyForMissingEvidence(
  missingEvidence: SourceEvidenceType[],
): string[] {
  const items: string[] = [];
  if (missingEvidence.includes("invoice_history")) {
    items.push("invoice leakage");
  }
  if (missingEvidence.includes("staffing_model")) {
    items.push("staffing variance");
  }
  if (missingEvidence.includes("change_order_ledger")) {
    items.push("change-order leakage");
  }
  if (missingEvidence.includes("sla_report")) {
    items.push("SLA credit weakness");
  }
  if (missingEvidence.includes("pricing_workbook")) {
    items.push("pricing comparability");
  }
  return items;
}

function dataRequestFor(type: SourceEvidenceType): string {
  const labels: Record<SourceEvidenceType, string> = {
    contract_msa: "Upload the executed master services agreement.",
    statement_of_work: "Upload the active statement of work and service schedules.",
    pricing_schedule: "Upload the pricing schedule or rate card.",
    rate_card: "Upload the applicable role/rate card.",
    invoice_history: "Load invoice history with month, category, contracted amount, invoiced amount, and variance reason.",
    sla_report: "Load SLA reports with target, actual, credit cap, and chronic-miss handling.",
    ticket_history: "Load ticket, incident, change, and reopen history for the relevant service towers.",
    staffing_model: "Load committed staffing, observed staffing, location mix, and shift coverage.",
    change_order_ledger: "Load change orders, amendments, approval evidence, and recurring/non-recurring classification.",
    renewal_notice: "Provide renewal notice and termination window dates.",
    vendor_response_narrative: "Load the sectioned vendor response narrative.",
    vendor_claim_register: "Load the vendor claim register with claim, evidence, and commercial commitment fields.",
    pricing_workbook: "Load the pricing workbook with run, transition, one-time, optional, and TCO fields.",
    staffing_location_model: "Load vendor staffing and location model.",
    sla_commitment_table: "Load SLA targets, credits, caps, exclusions, and reporting commitments.",
    assumptions_exclusions_log: "Load assumptions and exclusions log.",
    commercial_exceptions_table: "Load commercial and legal exceptions table.",
    transition_plan: "Load transition plan with milestones, dependencies, exit criteria, and owners.",
    governance_minutes: "Load governance, QBR, or cure-item meeting minutes.",
    other: "Load the missing supporting evidence identified by Source.",
  };
  return labels[type];
}
