// review-change-regenerate loop — the muscle that keeps the process moving when a
// client says "good, but change these three assumptions."
//
//   Draft → Human/client review → Upload feedback → Digest → Update SolutionContext
//   → Regenerate impacted artifacts → Review again → Approve / sign off
//
// Every client input becomes a structured change set; every change set updates
// SolutionContext; every regeneration is versioned, scoped, and traceable.

import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import {
  applyPhaseDigest,
  type SolutionContext,
  type PhaseDigest,
} from "@/lib/programs/solution-context";

export interface UploadedContextFile {
  id: string;
  name: string;
  kind:
    | "word_comments"
    | "pdf_markup"
    | "meeting_notes"
    | "workshop_output"
    | "email_summary"
    | "architecture_review"
    | "client_decision"
    | "kpi_spreadsheet"
    | "other";
}

export type FeedbackChangeType =
  | "clarification"
  | "correction"
  | "new_context"
  | "scope_change"
  | "decision_change";

export interface FeedbackItem {
  id: string;
  sourceFileId: string;
  sourceLocator: string;
  comment: string;
  requestedChange: string;
  affectedSection: string;
  changeType: FeedbackChangeType;
  confidence: "high" | "medium" | "low";
  requiresApproval: boolean;
}

export interface ConflictItem {
  feedbackId: string;
  conflictsWith: string; // approved-context field/decision
  detail: string;
}

export interface ImpactedArtifact {
  artifact: DeliverableKey;
  reason: string;
  /** which section(s) to regenerate, not the whole artifact. */
  sections?: string[];
}

export type ReviewStatus =
  | "draft"
  | "needs_triage"
  | "approved_for_regeneration"
  | "regenerated"
  | "signed_off";

export interface ArtifactReviewPacket {
  artifactId: string;
  artifactType: DeliverableKey;
  phase: string;
  currentVersionId: string;
  uploadedFiles: UploadedContextFile[];
  extractedFeedback: FeedbackItem[];
  conflicts: ConflictItem[];
  downstreamImpacts: ImpactedArtifact[];
  reviewStatus: ReviewStatus;
}

export interface SolutionContextChangeSet {
  id: string;
  sourceReviewPacketId: string;
  proposedUpdates: PhaseDigest;
  conflictsWithApprovedContext: string[];
  approvedBy?: string;
  approvedAt?: string;
}

/** Each gate state in the review loop. */
export type GateReviewState = "draft_ready" | "changes_requested" | "approved";

/** Apply an APPROVED change set into the SolutionContext (reuses the digest merge). */
export function applyChangeSet(
  ctx: SolutionContext,
  changeSet: SolutionContextChangeSet,
): SolutionContext {
  if (!changeSet.approvedBy) {
    throw new Error("Change set is not approved — cannot apply to SolutionContext.");
  }
  return applyPhaseDigest(ctx, {
    ...changeSet.proposedUpdates,
    humanApprovalNotes: [`change set ${changeSet.id} approved by ${changeSet.approvedBy}`],
  });
}

/**
 * Downstream staleness: which artifacts a change to a SolutionContext field
 * makes potentially stale. (Client changes the charter KPI → P2/P3/P4 marked.)
 */
const DOWNSTREAM: Readonly<Record<string, ReadonlyArray<ImpactedArtifact>>> = {
  kpis: [
    { artifact: "discovery_report", reason: "regenerate KPI baseline section", sections: ["KPI baseline"] },
    { artifact: "solution_approach_options", reason: "rescore options against new KPI" },
    { artifact: "target_state_architecture", reason: "update KPI-to-capability trace", sections: ["traceability"] },
    { artifact: "execution_roadmap", reason: "update KPI milestones", sections: ["roadmap KPIs"] },
    { artifact: "business_case", reason: "update value plan" },
  ],
  useCase: [
    { artifact: "discovery_report", reason: "re-frame current state to the use case" },
    { artifact: "solution_approach_options", reason: "re-evaluate options for the use case" },
  ],
  currentState: [
    { artifact: "solution_approach_options", reason: "options depend on current state" },
    { artifact: "target_state_architecture", reason: "current→target journey changed" },
  ],
  gaps: [
    { artifact: "solution_approach_options", reason: "options address the gaps" },
    { artifact: "target_state_architecture", reason: "capabilities trace to gaps" },
  ],
  chosenOption: [
    { artifact: "target_state_architecture", reason: "architecture is built to the chosen option" },
    { artifact: "solution_design", reason: "solution design follows the chosen option" },
    { artifact: "execution_roadmap", reason: "roadmap sequences the chosen option" },
  ],
  architecture: [
    { artifact: "execution_roadmap", reason: "roadmap delivers the architecture" },
    { artifact: "business_case", reason: "cost/value follows the architecture" },
    { artifact: "handoff_package", reason: "handoff reflects the architecture" },
  ],
  roadmap: [{ artifact: "handoff_package", reason: "handoff carries the roadmap" }],
};

/** Compute the downstream impacts of an approved change set. */
export function downstreamImpacts(
  changeSet: SolutionContextChangeSet,
): ImpactedArtifact[] {
  const out: ImpactedArtifact[] = [];
  const seen = new Set<string>();
  for (const field of Object.keys(changeSet.proposedUpdates)) {
    for (const impact of DOWNSTREAM[field] ?? []) {
      const key = `${impact.artifact}:${impact.reason}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(impact);
      }
    }
  }
  return out;
}

/** A gate cannot advance while any required artifact has unresolved change requests. */
export function gateCanAdvance(
  packets: ReadonlyArray<ArtifactReviewPacket>,
): { canAdvance: boolean; blocking: string[] } {
  const blocking = packets
    .filter(
      (p) =>
        p.reviewStatus !== "signed_off" &&
        (p.extractedFeedback.length > 0 || p.reviewStatus === "needs_triage"),
    )
    .map((p) => `${p.artifactType} (${p.reviewStatus})`);
  return { canAdvance: blocking.length === 0, blocking };
}

/** Map a packet to its gate review state. */
export function gateStateFor(packet: ArtifactReviewPacket): GateReviewState {
  if (packet.reviewStatus === "signed_off") return "approved";
  if (packet.extractedFeedback.length > 0 && packet.reviewStatus !== "regenerated")
    return "changes_requested";
  return "draft_ready";
}

/** Build the scoped, versioned regeneration prompt (preserve / change / don't). */
export function buildRegenerationPrompt(args: {
  artifactType: DeliverableKey;
  nextVersion: number;
  solutionContext: SolutionContext;
  currentArtifactContent: string;
  approvedChangeSet: SolutionContextChangeSet;
}): string {
  const changes = Object.entries(args.approvedChangeSet.proposedUpdates)
    .map(([k, v]) => `- ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("\n");
  return `You are regenerating ${args.artifactType}, version ${args.nextVersion}.

CURRENT APPROVED SOLUTION CONTEXT:
${JSON.stringify(args.solutionContext, null, 2)}

CURRENT ARTIFACT VERSION:
${args.currentArtifactContent}

APPROVED CLIENT FEEDBACK / CHANGE REQUESTS:
${changes || "[none]"}

PRESERVE:
- Keep sections not affected by approved changes.
- Keep approved decisions unless the change set explicitly supersedes them.
- Keep citations and source traceability.

CHANGE:
- Apply every approved change request.
- Update diagrams, tables, KPIs, assumptions, and roadmap impacts where affected.
- Add a revision log explaining what changed and why.

DO NOT:
- Reopen the entire strategy.
- Invent new facts.
- Silently remove prior approved decisions.`;
}
