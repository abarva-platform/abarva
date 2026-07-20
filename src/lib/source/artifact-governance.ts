// Source artifact draft/final governance labels, plus the 5-stage
// governance classification that decides which banner an artifact export
// shows.
//
// This module is the single source of governance-STAGE truth for Source
// artifacts. Two other status vocabularies exist elsewhere in Source and are
// NOT governance stages — do not add a fourth parallel system here:
//   - `SourceArtifactApprovalState` / parse / embed / graph / classification
//     status (src/lib/source/artifact-registry/types.ts) — the UPLOAD
//     PIPELINE lifecycle (has this file been parsed/embedded/graphed?),
//     unrelated to whether a generated deliverable is safe to rely on or
//     release externally.
//   - `qualityBar` on archetype registry entries
//     (src/lib/source/archetypes/registry.ts) — a structural completeness
//     rubric checked at generation time, not a lifecycle/approval state.
// The stage below is derived purely from fields already persisted on
// `SourceArtifactRecord` (src/lib/source/file-cabinet/types.ts) — no new DB
// columns or migration.

import { getSourceArtifactProfile } from "./documentation-standards/source-artifact-profiles";

export const SOURCE_AI_DRAFT_GOVERNANCE_LABEL = "AI-prepared draft";

export const SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE =
  "AI-prepared draft. Human review is required before external use.";

export const SOURCE_AI_DRAFT_GOVERNANCE_DETAIL =
  "AbarVa prepared this working draft from current Source evidence and approved inputs. A human must review, edit, and accept the client-final version before it becomes the authoritative deliverable of record.";

export const SOURCE_HUMAN_REVIEW_GOVERNANCE_MESSAGE =
  "Working draft. Human review is required before external use.";

export const SOURCE_APPROVED_EXTERNAL_GOVERNANCE_LABEL =
  "Approved for external use";

export const SOURCE_APPROVED_EXTERNAL_GOVERNANCE_MESSAGE =
  "Approved for external use. A named approver cleared this version for vendor or client circulation.";

export const SOURCE_VENDOR_NOT_APPROVED_GOVERNANCE_LABEL =
  "Not approved for vendor release";

export const SOURCE_VENDOR_NOT_APPROVED_GOVERNANCE_MESSAGE =
  "Not approved for vendor release. This AI-prepared draft must be reviewed and approved by Procurement and the designated business owner before issuance.";

export const SOURCE_CLIENT_FINAL_GOVERNANCE_LABEL = "Client final";

export const SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE =
  "AbarVa generated the working draft. The client reviewed, edited, and uploaded the approved final. The uploaded client-final artifact is now the authoritative deliverable of record.";

export const SOURCE_SUPERSEDED_GOVERNANCE_LABEL = "Superseded";

export const SOURCE_SUPERSEDED_GOVERNANCE_MESSAGE =
  "Superseded. A newer authoritative version of this artifact exists — this version is kept for audit only.";

export function sourceDraftGovernanceMessage(args: {
  isAiGenerated: boolean;
}): string {
  return args.isAiGenerated
    ? SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE
    : SOURCE_HUMAN_REVIEW_GOVERNANCE_MESSAGE;
}

/** The five governance stages a Source artifact export can be in. */
export type SourceArtifactGovernanceStage =
  | "ai_draft"
  | "human_review"
  | "approved_for_external_use"
  | "client_final"
  | "superseded";

const HUMAN_REVIEW_STATUSES: ReadonlySet<string> = new Set([
  "preliminary",
  "issue_ready",
  "client_to_complete",
  "legal_review_required",
  "procurement_review_required",
]);

export interface SourceArtifactGovernanceInput {
  status?: string | null;
  isClientFinal?: boolean | null;
  lifecycleState?: string | null;
  approvalState?: string | null;
  approvedBy?: string | null;
}

/**
 * Derive the governance stage from fields already persisted on
 * `SourceArtifactRecord`. Pure, no I/O. Precedence: supersession and
 * client-final are terminal states that win over everything else;
 * "approved for external use" requires both an approved status AND a named
 * approver, not the status value alone.
 */
export function deriveSourceArtifactGovernanceStage(
  artifact: SourceArtifactGovernanceInput,
): SourceArtifactGovernanceStage {
  if (artifact.lifecycleState === "superseded") return "superseded";
  if (artifact.isClientFinal === true || artifact.status === "client_final") {
    return "client_final";
  }
  if (artifact.status === "approved" && artifact.approvedBy) {
    return "approved_for_external_use";
  }
  if (
    (artifact.status != null && HUMAN_REVIEW_STATUSES.has(artifact.status)) ||
    Boolean(artifact.approvalState)
  ) {
    return "human_review";
  }
  return "ai_draft";
}

export interface SourceArtifactGovernanceBanner {
  label: string;
  message: string;
  detail: string | null;
}

/**
 * Banner text for a governance stage. Artifacts whose profile targets a
 * vendor audience (per source-artifact-profiles.ts) get the stricter
 * "not approved for vendor release" wording instead of the generic draft
 * message until they clear external approval or become client-final.
 */
export function sourceArtifactGovernanceBanner(
  stage: SourceArtifactGovernanceStage,
  opts: { artifactCode?: string | null } = {},
): SourceArtifactGovernanceBanner {
  const profile = opts.artifactCode
    ? getSourceArtifactProfile(opts.artifactCode)
    : null;
  const isVendorFacing =
    profile != null &&
    (Array.isArray(profile.audience)
      ? profile.audience.includes("vendor")
      : profile.audience === "vendor");

  if (
    isVendorFacing &&
    stage !== "approved_for_external_use" &&
    stage !== "client_final"
  ) {
    return {
      label: SOURCE_VENDOR_NOT_APPROVED_GOVERNANCE_LABEL,
      message: SOURCE_VENDOR_NOT_APPROVED_GOVERNANCE_MESSAGE,
      detail: null,
    };
  }

  switch (stage) {
    case "ai_draft":
      return {
        label: SOURCE_AI_DRAFT_GOVERNANCE_LABEL,
        message: SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE,
        detail: SOURCE_AI_DRAFT_GOVERNANCE_DETAIL,
      };
    case "human_review":
      return {
        label: "Working draft",
        message: SOURCE_HUMAN_REVIEW_GOVERNANCE_MESSAGE,
        detail: null,
      };
    case "approved_for_external_use":
      return {
        label: SOURCE_APPROVED_EXTERNAL_GOVERNANCE_LABEL,
        message: SOURCE_APPROVED_EXTERNAL_GOVERNANCE_MESSAGE,
        detail: null,
      };
    case "client_final":
      return {
        label: SOURCE_CLIENT_FINAL_GOVERNANCE_LABEL,
        message: SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE,
        detail: null,
      };
    case "superseded":
      return {
        label: SOURCE_SUPERSEDED_GOVERNANCE_LABEL,
        message: SOURCE_SUPERSEDED_GOVERNANCE_MESSAGE,
        detail: null,
      };
    default: {
      const exhaustive: never = stage;
      throw new Error(`Unhandled governance stage: ${String(exhaustive)}`);
    }
  }
}
