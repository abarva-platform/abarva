import "server-only";

import { listProgramEvidenceForPrompt } from "@/lib/programs/evidence-context";
import type { SolutionEvidencePacket } from "@/lib/programs/solution-context";
import type { TenancyCtx } from "@/lib/programs/types.db";

/**
 * Load a Move's human-approved evidence as first-class SolutionContext
 * packets — the same query `listProgramEvidenceForPrompt` uses (approved
 * only), reshaped for `SolutionContext.evidencePackets` instead of a
 * flattened prompt string. Used by `createMovesGenerateArtifactDeps` to wire
 * `loadEvidencePackets` into `assembleMoveSolutionContext`.
 *
 * Scoped to `phase`: once a phase gates, its raw evidence is done — later
 * phases inherit it through the phase's own finished, approved artifact (its
 * `evidenceMap`/`PhaseDigest` citations), not by re-reading the raw files.
 */
export async function loadEvidencePacketsForMove(
  ctx: TenancyCtx,
  moveId: string,
  phase: number,
): Promise<SolutionEvidencePacket[]> {
  const items = await listProgramEvidenceForPrompt(ctx, moveId, phase);
  return items.map((item) => ({
    evidenceId: item.id,
    title: item.title,
    evidenceType: item.evidenceType,
    phase: item.phase,
    summary: item.summary,
    observations: item.observations,
    assumptions: item.assumptions,
    openQuestions: item.openQuestions,
    citations: item.citations,
    approvedAt: item.approvedAt,
  }));
}
