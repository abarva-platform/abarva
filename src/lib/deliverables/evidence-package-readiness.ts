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

function missingFromBlockers(blockers: readonly string[]): string[] {
  const missing: string[] = [];
  const normalized = blockers.map((blocker) => blocker.trim().toLowerCase());
  if (normalized.some((blocker) => blocker.startsWith("no source register"))) {
    missing.push("Source register for this Move");
  }
  if (
    normalized.some((blocker) =>
      blocker.startsWith("source register present but body cites nothing"),
    )
  ) {
    missing.push("Citations to the source register in the artifact");
  }
  if (
    normalized.some((blocker) =>
      blocker.startsWith("no source-backed evidence"),
    )
  ) {
    missing.push("Source-backed evidence required for this artifact");
  }
  if (
    normalized.some((blocker) =>
      /^(?:\d+\s+)?unsupported client-fact claim/.test(blocker),
    )
  ) {
    missing.push(
      "Cited metrics, finance-approved baselines, or explicit assumption labels",
    );
  }
  if (
    normalized.some((blocker) =>
      blocker.startsWith(
        "required evidence signal(s) missing from client artifact:",
      ),
    )
  ) {
    missing.push("Required source-backed content for this artifact");
  }

  return unique(missing);
}

function recommendedNextStep(
  missing: readonly string[],
  blockers: readonly string[],
  retrievedEvidence: number,
): string {
  if (
    missing.includes("Source register for this Move") &&
    retrievedEvidence > 0
  ) {
    return "Create or restore the source register and connect the retrieved evidence to the artifact, then rebuild.";
  }
  if (
    retrievedEvidence === 0 &&
    blockers.some((blocker) =>
      /^(no source register|source register present but body cites nothing|no source-backed evidence|required evidence signal\(s\) missing from client artifact:)/i.test(
        blocker.trim(),
      ),
    )
  ) {
    return "Upload and approve the phase workshop outputs, source files, and decision evidence, then re-run Approve & Build.";
  }
  if (
    blockers.some((blocker) =>
      /^document too long for this artifact:/i.test(blocker),
    )
  ) {
    return "Shorten the draft to the artifact's target word ceiling, then rebuild. This length blocker does not indicate that more evidence is needed.";
  }
  if (missing.some((m) => /metrics|baselines|assumption/i.test(m))) {
    return retrievedEvidence === 0
      ? "Add source-backed metrics or mark numeric targets as assumptions before re-running the package."
      : "Cite the unsupported metrics or label them as assumptions before rebuilding; unrelated evidence uploads are not needed.";
  }
  if (missing.length > 0) {
    return "Resolve the listed source-backed evidence gaps, then re-run Approve & Build.";
  }
  if (blockers.length > 0) {
    return "Resolve the listed build-quality blocker(s), then rebuild. Additional evidence is not implied by the current blocker.";
  }
  if (retrievedEvidence < MINIMUM_BOARD_GRADE_EVIDENCE_ITEMS) {
    return "Add source-backed evidence to improve the package's evidence coverage before external review.";
  }
  return "Review the package and its evidence before using it in a decision.";
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
  const executiveReadinessPct = clampPct(Math.max(statusFloor, evidenceCoveragePct) - blockerPenalty - warningPenalty);
  const confidenceTier = confidenceFor(executiveReadinessPct, input.status);
  const missing = hasBlockingStatus
    ? missingFromBlockers(blockers)
    : retrievedEvidence < MINIMUM_BOARD_GRADE_EVIDENCE_ITEMS
      ? ["Additional source-backed evidence would increase executive confidence"]
      : [];

  const canShareExternally = input.status === "succeeded" && confidenceTier === "board";
  const label =
    input.status === "blocked"
      ? "Build blocked"
      : input.status === "failed"
        ? "Package assembly failed"
        : input.status === "succeeded"
          ? "Executive package assembled"
          : "Package assembly in progress";
  const headline = canShareExternally
    ? "Evidence coverage is high enough for board-ready review."
    : input.status === "blocked"
      ? "The run is blocked. Evidence coverage and build-quality blockers are shown separately."
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
    recommendedNextStep: recommendedNextStep(
      missing,
      blockers,
      retrievedEvidence,
    ),
  };
}
