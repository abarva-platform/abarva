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
 */
export async function loadEvidencePacketsForMove(
  ctx: TenancyCtx,
  moveId: string,
  limit = 20,
): Promise<SolutionEvidencePacket[]> {
  const items = await listProgramEvidenceForPrompt(ctx, moveId, limit);
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
