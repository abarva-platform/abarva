// PR1 — authoritative context synchronization.
//
// The P4 roadmap generator marks "architecture is not captured or approved" as a
// governance caveat when `SolutionContext.architecture` is empty. Before this,
// an accepted P3 Target-State Architecture deliverable did not reliably populate
// `ctx.architecture`, so the caveat printed even when the architecture WAS signed
// off — a false governance statement on a governed artifact.
//
// The fix is NOT to suppress the warning. It is to DERIVE architecture readiness
// from the accepted, authoritative prior-phase architecture deliverable, WITH
// lineage, and to EXCLUDE material that is not authoritative:
//   - candidate / draft / unreviewed  → not authoritative
//   - rejected / superseded           → not authoritative
//   - a different Move (engagement)    → never cross-Move
//   - a different tenant               → never cross-tenant
//
// This module is a PURE function so every exclusion is unit-tested without the
// data plane; the data source (`moves-generate-deps.ts`) supplies the raw prior
// deliverables with their real acceptance status + Move/tenant scope + lineage.

import type { PhaseDigest } from "./solution-context";

/**
 * Authoritative-context precedence, highest first. The assembler resolves a
 * required field (e.g. architecture for P4) from the highest-precedence source
 * that actually provides it; lower tiers never override a higher one.
 */
export const CONTEXT_PRECEDENCE = [
  "accepted_structured_evidence",
  "accepted_prior_deliverable",
  "current_phase_capture",
  "candidate_unreviewed", // non-authoritative — only used explicitly, marked as such
] as const;
export type ContextPrecedenceTier = (typeof CONTEXT_PRECEDENCE)[number];

/** Real acceptance state of a prior deliverable version. Only `accepted` is authoritative. */
export type DeliverableAcceptance =
  | "accepted"
  | "draft"
  | "candidate"
  | "rejected"
  | "superseded";

export interface PriorDeliverable {
  deliverableTypeKey: string;
  acceptance: DeliverableAcceptance;
  /** The Move (engagement) this deliverable belongs to — cross-Move is excluded. */
  engagementId: string;
  /** The tenant this deliverable belongs to — cross-tenant is excluded. */
  tenantKey: string;
  /** The structured digest folded into context (may carry architecture content). */
  digest: PhaseDigest;
  /** Auditable back-reference (deliverable/version id) for the lineage note. */
  lineageRef?: string;
}

/** Deliverable type keys that carry an authoritative P3 target-state architecture. */
export const P3_ARCHITECTURE_TYPE_KEYS: ReadonlySet<string> = new Set([
  "target_state_architecture",
  "solution_design",
]);

/** The architecture content a prior deliverable's digest actually carries, if any. */
function architectureContentOf(digest: PhaseDigest): string | undefined {
  const candidate =
    digest.architecture ?? digest.solutionDesign ?? digest.approach;
  const trimmed = candidate?.trim();
  return trimmed ? trimmed : undefined;
}

export interface ResolvedArchitecture {
  architecture: string;
  lineageRef?: string;
}

/**
 * Resolve the authoritative P3 architecture for a Move, or null if none is
 * authoritative. Only an ACCEPTED, same-Move, same-tenant architecture
 * deliverable that actually carries architecture content qualifies — candidate,
 * draft, rejected, superseded, cross-Move and cross-tenant material is excluded.
 */
export function resolveAuthoritativeArchitecture(
  priors: readonly PriorDeliverable[],
  scope: { moveId: string; tenantKey: string },
): ResolvedArchitecture | null {
  for (const prior of priors) {
    if (!P3_ARCHITECTURE_TYPE_KEYS.has(prior.deliverableTypeKey)) continue;
    if (prior.acceptance !== "accepted") continue; // excludes draft/candidate/rejected/superseded
    if (prior.engagementId !== scope.moveId) continue; // excludes cross-Move
    if (prior.tenantKey !== scope.tenantKey) continue; // excludes cross-tenant
    const architecture = architectureContentOf(prior.digest);
    if (!architecture) continue;
    return { architecture, lineageRef: prior.lineageRef };
  }
  return null;
}

/**
 * A human-readable lineage note recording that architecture readiness was
 * satisfied by an accepted prior deliverable (not fabricated, not suppressed).
 */
export function architectureLineageNote(
  resolved: ResolvedArchitecture,
): string {
  return resolved.lineageRef
    ? `Target-state architecture carried forward from the accepted P3 architecture deliverable (audit ref ${resolved.lineageRef}).`
    : "Target-state architecture carried forward from the accepted P3 architecture deliverable.";
}
