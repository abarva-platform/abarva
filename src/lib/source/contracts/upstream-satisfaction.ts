// Real upstream-satisfaction resolver (PR 4C, ADR-0015 ask #6). Closes the
// gap PR 4B named and deliberately deferred: "does a required upstream
// artifact have a non-empty body" (findMissingUpstreamCodes) is now
// replaced, for the AI-generate route, by "is the required upstream
// artifact accepted, authoritative, current, and non-superseded" — a
// candidate, review-pending, rejected, or superseded upstream artifact does
// not satisfy the requirement, matching the contract rule this workstream
// was built to enforce.
//
// Bridges two tables the same way the accept route already does for a
// single artifact: source_event_artifact_states (the per-event working
// substrate collectUpstreamBodies reads) links via linked_artifact_id to
// source_artifacts (the versioned record with real governance columns).
// This module does that lookup for a whole batch of upstream codes at once.

import "server-only";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { getLatestArtifactAcceptancesByArtifactIds } from "@/lib/source/artifact-acceptances";
import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import type { SourceStageKey } from "@/lib/source/types";
import { upstreamCandidateSatisfiesRequirement } from "./artifact-authority";

interface SourceArtifactGovernanceRow {
  id: string;
  status: string | null;
  lifecycle_state: string | null;
  approval_state: string | null;
  approved_by: string | null;
}

/**
 * Given the generation context (already event/tenant-scoped — this function
 * never re-derives tenant/event ownership, it trusts ctx was built through
 * the normal, already-scoped buildSourceGenerationContext path) and a list
 * of required upstream codes, returns exactly the codes that are NOT
 * satisfied — the same return shape as prompt-registry.ts's
 * findMissingUpstreamCodes, so callers can drop this in as a like-for-like
 * replacement.
 */
export async function findUnsatisfiedRequiredUpstream(
  ctx: SourceGenerationContext,
  requiredCodes: string[],
): Promise<string[]> {
  if (requiredCodes.length === 0) return [];

  const linkedIdByCode = new Map<string, string>();
  for (const code of requiredCodes) {
    const row = ctx.artifactStates.find((a) => a.artifactCode === code);
    if (row?.linkedArtifactId) {
      linkedIdByCode.set(code, row.linkedArtifactId);
    }
  }

  const linkedIds = Array.from(new Set(linkedIdByCode.values()));
  if (linkedIds.length === 0) {
    // No code has ANY linked artifact yet — all are unsatisfied.
    return [...requiredCodes];
  }

  const supabase = getAzureReadFluentClient();
  const { data, error } = await supabase
    .from("source_artifacts")
    .select("id, status, lifecycle_state, approval_state, approved_by")
    .in("id", linkedIds);
  const governanceById = new Map<string, SourceArtifactGovernanceRow>(
    error || !Array.isArray(data)
      ? []
      : (data as SourceArtifactGovernanceRow[]).map((row) => [row.id, row]),
  );

  const acceptanceById =
    await getLatestArtifactAcceptancesByArtifactIds(linkedIds);

  const eventStageKey = ctx.event.currentStageKey as SourceStageKey;

  return requiredCodes.filter((code) => {
    const linkedId = linkedIdByCode.get(code);
    if (!linkedId) return true; // no linked artifact at all -> unsatisfied
    const governance = governanceById.get(linkedId);
    if (!governance) return true; // linked id doesn't resolve -> unsatisfied
    const satisfied = upstreamCandidateSatisfiesRequirement({
      code,
      status: governance.status,
      lifecycleState: governance.lifecycle_state,
      approvalState: governance.approval_state,
      approvedBy: governance.approved_by,
      hasActiveAcceptance: acceptanceById.has(linkedId),
      eventStageKey,
    });
    return !satisfied;
  });
}

/**
 * Stage-entry auto-drafts are not client-final artifacts; they are the working
 * drafts a reviewer needs in order to reach client-final authority later.
 * For that internal path, a non-empty upstream draft body is sufficient
 * context for drafting the next packet. Manual generation still uses
 * findUnsatisfiedRequiredUpstream above.
 */
export function findUnsatisfiedDraftableUpstream(
  ctx: SourceGenerationContext,
  requiredCodes: string[],
): string[] {
  if (requiredCodes.length === 0) return [];
  return requiredCodes.filter((code) => {
    const row = ctx.artifactStates.find(
      (artifact) => artifact.artifactCode === code,
    );
    return !row?.body?.trim();
  });
}
