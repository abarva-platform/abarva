import type {
  SourceArtifactApprovalState,
  SourceArtifactEvidenceState,
  SourceEmbeddingStatus,
  SourceParseStatus,
} from "./artifact-registry/types";
import type { SourceEventEvidence } from "./canvas-substrate";
import type { SourceEvidenceRequirement } from "./canonical-specs";

export type SourceEvidenceLifecycleStatus =
  | "not_loaded"
  | "uploaded"
  | "parsed"
  | "indexed"
  | "cited"
  | "accepted"
  | "stage_ready"
  | "stale"
  | "low_confidence"
  | "rejected";

export interface SourceEvidenceLifecycleArtifactSignal {
  parseStatus?: SourceParseStatus | null;
  embeddingStatus?: SourceEmbeddingStatus | null;
  evidenceState?: SourceArtifactEvidenceState | null;
  approvalState?: SourceArtifactApprovalState | null;
}

export interface SourceEvidenceLifecycleResult {
  status: SourceEvidenceLifecycleStatus;
  uploaded: boolean;
  parsed: boolean;
  indexed: boolean;
  cited: boolean;
  accepted: boolean;
  meetsMinimumState: boolean;
  stageReady: boolean;
  blocksGate: boolean;
  nextAction: string;
}

const READINESS_RANK: Record<SourceEventEvidence["currentState"], number> = {
  "Not Requested": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
  Stale: -1,
  "Low Confidence": -1,
};

const MINIMUM_RANK: Record<SourceEvidenceRequirement["minimumState"], number> =
  {
    Loaded: 1,
    Parsed: 2,
    Available: 3,
    "Usable Evidence": 4,
  };

export function deriveSourceEvidenceLifecycle(input: {
  requirement: Pick<
    SourceEvidenceRequirement,
    "level" | "minimumState" | "label"
  >;
  evidence?: Pick<
    SourceEventEvidence,
    "currentState" | "sourceArtifactId" | "sourceEventFactIds"
  > | null;
  artifact?: SourceEvidenceLifecycleArtifactSignal | null;
}): SourceEvidenceLifecycleResult {
  const { requirement, evidence, artifact } = input;
  const currentState = evidence?.currentState ?? "Not Requested";

  if (artifact?.approvalState === "rejected") {
    return lifecycleResult({
      status: "rejected",
      blocksGate: requirement.level === "required",
      nextAction: `Replace rejected evidence for ${requirement.label}.`,
    });
  }

  if (currentState === "Stale") {
    return lifecycleResult({
      status: "stale",
      uploaded: true,
      blocksGate: requirement.level === "required",
      nextAction: `Refresh stale evidence for ${requirement.label}.`,
    });
  }

  if (currentState === "Low Confidence") {
    return lifecycleResult({
      status: "low_confidence",
      uploaded: true,
      blocksGate: requirement.level === "required",
      nextAction: `Review low-confidence evidence for ${requirement.label}.`,
    });
  }

  const currentRank = READINESS_RANK[currentState] ?? -1;
  const minimumRank = MINIMUM_RANK[requirement.minimumState];
  const uploaded =
    Boolean(evidence?.sourceArtifactId) ||
    Boolean(artifact) ||
    currentRank >= READINESS_RANK.Loaded;
  const parsed = artifact?.parseStatus === "parsed" || currentRank >= 2;
  const indexed = artifact?.embeddingStatus === "embedded";
  const cited =
    artifact?.evidenceState === "cited" ||
    Boolean(evidence?.sourceEventFactIds?.length);
  const accepted =
    artifact?.approvalState === "approved" ||
    artifact?.approvalState === "locked" ||
    currentState === "Usable Evidence";
  const meetsMinimumState = currentRank >= minimumRank;
  const stageReady = parsed && cited && accepted && meetsMinimumState;

  if (stageReady) {
    return lifecycleResult({
      status: "stage_ready",
      uploaded,
      parsed,
      indexed,
      cited,
      accepted,
      meetsMinimumState,
      stageReady,
      blocksGate: false,
      nextAction: `${requirement.label} is ready for the stage gate.`,
    });
  }

  const status: SourceEvidenceLifecycleStatus = !uploaded
    ? "not_loaded"
    : !parsed
      ? "uploaded"
      : indexed
        ? cited
          ? accepted
            ? "accepted"
            : "cited"
          : "indexed"
        : cited
          ? accepted
            ? "accepted"
            : "cited"
          : "parsed";

  return lifecycleResult({
    status,
    uploaded,
    parsed,
    indexed,
    cited,
    accepted,
    meetsMinimumState,
    stageReady,
    blocksGate: requirement.level === "required",
    nextAction: nextActionFor(status, requirement.label),
  });
}

function lifecycleResult(
  partial: Partial<SourceEvidenceLifecycleResult> &
    Pick<SourceEvidenceLifecycleResult, "status" | "nextAction">,
): SourceEvidenceLifecycleResult {
  return {
    uploaded: false,
    parsed: false,
    indexed: false,
    cited: false,
    accepted: false,
    meetsMinimumState: false,
    stageReady: false,
    blocksGate: false,
    ...partial,
  };
}

function nextActionFor(
  status: SourceEvidenceLifecycleStatus,
  label: string,
): string {
  if (status === "not_loaded") return `Upload ${label}.`;
  if (status === "uploaded") return `Parse uploaded ${label}.`;
  if (status === "parsed") return `Cite parsed ${label} to facts or rows.`;
  if (status === "indexed") return `Attach citations for ${label}.`;
  if (status === "cited") return `Accept cited ${label}.`;
  if (status === "accepted") return `Confirm ${label} meets the stage minimum.`;
  if (status === "stale") return `Refresh stale ${label}.`;
  if (status === "low_confidence") return `Review low-confidence ${label}.`;
  if (status === "rejected") return `Replace rejected ${label}.`;
  return `${label} is ready for the stage gate.`;
}
