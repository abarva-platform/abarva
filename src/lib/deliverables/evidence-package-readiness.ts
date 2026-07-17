import type { DeliverableRunStatus } from "@/lib/deliverables/orchestrator/runs-repository";

export type PackageConfidenceTier = "bronze" | "silver" | "gold" | "board";

export interface EvidencePackageReadiness {
  label: string;
  headline: string;
  evidenceCoveragePct: number;
  executiveReadinessPct: number;
  minimumEvidenceItems: number;
  retrievedEvidence: number;
  confidenceTier: PackageConfidenceTier;
  confidenceLabel: string;
  canShareExternally: boolean;
  missing: string[];
  recommendedNextStep: string;
}

interface BuildEvidencePackageReadinessInput {
  status: DeliverableRunStatus;
  retrievedEvidence?: number | null;
  blockers?: readonly string[] | null;
  warnings?: readonly string[] | null;
}

const MINIMUM_BOARD_GRADE_EVIDENCE_ITEMS = 5;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function confidenceFor(readinessPct: number, status: DeliverableRunStatus): PackageConfidenceTier {
  if (status === "succeeded" && readinessPct >= 90) return "board";
  if (readinessPct >= 75) return "gold";
  if (readinessPct >= 50) return "silver";
  return "bronze";
}

function confidenceLabel(tier: PackageConfidenceTier): string {
  switch (tier) {
    case "board":
      return "Board-ready";
    case "gold":
      return "Executive ready";
    case "silver":
      return "Leadership review";
    case "bronze":
      return "Internal working draft";
  }
}

function missingFromBlockers(blockers: readonly string[], retrievedEvidence: number): string[] {
  const missing: string[] = [];
  const joined = blockers.join(" ").toLowerCase();

  if (retrievedEvidence === 0 || /no source register|retrieved evidence|source-backed|evidence/i.test(joined)) {
    missing.push("Source-backed evidence attached to this Move");
  }
  if (/unsupported client-fact|number|date|\$|%|claim/i.test(joined)) {
    missing.push("Cited metrics, finance-approved baselines, or explicit assumption labels");
  }
  if (/non_mechanical_writing|mechanical|internal tags|ids leaked|generic/i.test(joined)) {
    missing.push("Client-ready narrative cleanup before executive sharing");
  }
  if (/risk|issue|dependenc/i.test(joined)) {
    missing.push("Risk, issue, and dependency register");
  }
  if (/recommendation|decision/i.test(joined)) {
    missing.push("Clear sponsor decision and recommendation");
  }
  if (/section|too short|body/i.test(joined)) {
    missing.push("Complete workshop findings and phase outputs");
  }

  return unique(missing.length ? missing : ["Evidence needed to clear the quality gate"]);
}

function recommendedNextStep(missing: readonly string[], retrievedEvidence: number): string {
  if (retrievedEvidence === 0) {
    return "Upload and approve the phase workshop outputs, source files, and decision evidence, then re-run Approve & Build.";
  }
  if (missing.some((m) => /metrics|baselines|assumption/i.test(m))) {
    return "Add cited metrics or mark numeric targets as assumptions before re-running the package.";
  }
  if (missing.some((m) => /narrative/i.test(m))) {
    return "Regenerate after evidence is attached so the package can be rewritten as a client-ready executive narrative.";
  }
  return "Resolve the listed evidence gaps, then re-run Approve & Build.";
}

export function buildEvidencePackageReadiness(
  input: BuildEvidencePackageReadinessInput,
): EvidencePackageReadiness {
  const blockers = input.blockers ?? [];
  const warnings = input.warnings ?? [];
  const retrievedEvidence = Math.max(0, Number(input.retrievedEvidence ?? 0));
  const evidenceCoveragePct = clampPct(
    (retrievedEvidence / MINIMUM_BOARD_GRADE_EVIDENCE_ITEMS) * 100,
  );
  const hasBlockingStatus = input.status === "blocked" || input.status === "failed";
  const blockerPenalty = hasBlockingStatus ? 25 : 0;
  const warningPenalty = Math.min(10, warnings.length * 2);
  const statusFloor = input.status === "succeeded" ? 85 : 0;
  const executiveReadinessPct = clampPct(
    Math.max(statusFloor, evidenceCoveragePct) - blockerPenalty - warningPenalty,
  );
  const confidenceTier = confidenceFor(executiveReadinessPct, input.status);
  const missing = hasBlockingStatus
    ? missingFromBlockers(blockers, retrievedEvidence)
    : retrievedEvidence < MINIMUM_BOARD_GRADE_EVIDENCE_ITEMS
      ? ["Additional source-backed evidence would increase executive confidence"]
      : [];

  const canShareExternally = input.status === "succeeded" && confidenceTier === "board";
  const label =
    input.status === "blocked"
      ? "Cannot assemble executive package"
      : input.status === "failed"
        ? "Package assembly failed"
        : input.status === "succeeded"
          ? "Executive package assembled"
          : "Package assembly in progress";
  const headline = canShareExternally
    ? "Evidence coverage is high enough for board-ready review."
    : input.status === "blocked"
      ? `Evidence coverage is ${evidenceCoveragePct}%; the package remains below the executive-quality gate.`
      : input.status === "succeeded"
        ? `Generated package passed the quality gate with ${retrievedEvidence} governed evidence item${retrievedEvidence === 1 ? "" : "s"}.`
        : "AbarVa is assembling and checking the package.";

  return {
    label,
    headline,
    evidenceCoveragePct,
    executiveReadinessPct,
    minimumEvidenceItems: MINIMUM_BOARD_GRADE_EVIDENCE_ITEMS,
    retrievedEvidence,
    confidenceTier,
    confidenceLabel: confidenceLabel(confidenceTier),
    canShareExternally,
    missing,
    recommendedNextStep: recommendedNextStep(missing, retrievedEvidence),
  };
}
