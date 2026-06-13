import "server-only";

import { listGeneratedArtifactsForMove } from "@/lib/artifacts/repository";
import { listMoveArtifacts } from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { WorkspaceItem } from "./types";
import { buildMovesWorkspaceItems } from "./moves-adapter-mapping";

export async function listMovesWorkspaceItems(
  ctx: TenancyCtx,
  moveId: string,
): Promise<WorkspaceItem[]> {
  const [moveArtifacts, generatedArtifacts] = await Promise.all([
    listMoveArtifacts(ctx, moveId).catch((error) => {
      console.error(
        "[MovesWorkspaceAdapter] move_artifacts read failed",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }),
    listGeneratedArtifactsForMove({
      clientId: ctx.clientId,
      moveId,
    }).catch((error) => {
      console.error(
        "[MovesWorkspaceAdapter] generated_artifacts read failed",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }),
  ]);

  return buildMovesWorkspaceItems({
    moveArtifacts,
    generatedArtifacts,
  });
}
