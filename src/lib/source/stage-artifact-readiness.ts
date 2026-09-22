import type { SourceArtifactLifecycleSummary } from "@/lib/source/artifact-lifecycle-matrix";
import type { SourceStageKey } from "@/lib/source/types";

export interface SourceStageArtifactReadiness {
  ready: boolean;
  blockerCount: number;
  warningCount: number;
  line: string;
  blockers: string[];
  nextAction: string | null;
}

export function stageArtifactReadinessFor(
  lifecycle: SourceArtifactLifecycleSummary,
  stageKey: SourceStageKey,
): SourceStageArtifactReadiness {
  const gateRows = lifecycle.rows.filter(
    (row) =>
      row.stageKey === stageKey &&
      (row.requirementLabel === "Required" ||
        row.gateLabel === "Gate-defining"),
  );
  if (gateRows.length === 0) {
    return {
      ready: true,
      blockerCount: 0,
      warningCount: 0,
      line: "No required/gate artifact standard is registered for this stage yet; use required inputs and approval rationale as the control.",
      blockers: [],
      nextAction: null,
    };
  }

  const blockers = gateRows
    .map((row) => {
      const reason = artifactBlockerReason(row);
      return reason ? `${row.name}: ${reason}` : null;
    })
    .filter((item): item is string => Boolean(item));
  const warningCount = gateRows.reduce(
    (totalWarnings, row) =>
      totalWarnings +
      row.quality.warnings.length +
      row.contentQuality.warnings.length,
    0,
  );

  if (blockers.length === 0) {
    return {
      ready: true,
      blockerCount: 0,
      warningCount,
      line:
        warningCount > 0
          ? `Gate artifacts are client-final, with ${warningCount} warning${warningCount === 1 ? "" : "s"} to review in Files.`
          : "Gate artifacts are client-final and ready for approval.",
      blockers: [],
      nextAction: null,
    };
  }

  return {
    ready: false,
    blockerCount: blockers.length,
    warningCount,
    line: `${blockers.length} required/gate artifact${blockers.length === 1 ? "" : "s"} still need client-final or quality review before approval.`,
    blockers,
    nextAction: "Review and accept the blocked artifacts in Files",
  };
}

function artifactBlockerReason(
  row: SourceArtifactLifecycleSummary["rows"][number],
): string | null {
  if (row.lifecycleState === "not_registered") return "not registered";
  if (row.lifecycleState === "ai_draft") {
    return "AI draft not accepted as client final";
  }
  if (row.lifecycleState === "evidence_only") {
    return "evidence is present, but no governed deliverable is accepted";
  }
  if (row.consultingGate.state === "required_not_run") {
    return "consulting-grade Gate B not run";
  }
  if (row.consultingGate.state === "failed") {
    return "consulting-grade Gate B failed";
  }
  if (row.contentQuality.state === "blocked") {
    return row.contentQuality.blockers[0] ?? "content QA blocked";
  }
  return row.quality.hardFails[0] ?? null;
}
