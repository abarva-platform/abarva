import "server-only";

import { listGeneratedArtifactsForMove } from "@/lib/artifacts/repository";
import { boardArtifactsForMove } from "@/lib/programs/board-artifacts/board-artifacts-registry";
import { listMoveArtifacts } from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { StrategicMove } from "@/lib/programs/types.ui";
import type { WorkspaceGenerateCandidate, WorkspaceItem } from "./types";
import { buildMovesWorkspaceItems } from "./moves-adapter-mapping";

export async function listMovesWorkspaceItems(
  ctx: TenancyCtx,
  moveId: string,
): Promise<WorkspaceItem[]> {
  const generatedArtifactClientIds = Array.from(
    new Set([ctx.clientKey, ctx.clientId].filter(Boolean)),
  ) as string[];
  const [moveArtifacts, generatedArtifacts] = await Promise.all([
    listMoveArtifacts(ctx, moveId).catch((error) => {
      console.error(
        "[MovesWorkspaceAdapter] move_artifacts read failed",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }),
    Promise.all(
      generatedArtifactClientIds.map((clientId) =>
        listGeneratedArtifactsForMove({
          clientId,
          moveId,
        }).catch((error) => {
          console.error(
            "[MovesWorkspaceAdapter] generated_artifacts read failed",
            {
              clientId,
              message: error instanceof Error ? error.message : String(error),
            },
          );
          return [];
        }),
      ),
    ).then((lists) => {
      const byId = new Map(lists.flat().map((record) => [record.id, record]));
      return Array.from(byId.values());
    }),
  ]);

  return buildMovesWorkspaceItems({
    moveArtifacts,
    generatedArtifacts,
  });
}

export function listMovesWorkspaceGenerateCandidates(
  move: StrategicMove,
): WorkspaceGenerateCandidate[] {
  return boardArtifactsForMove(move).map((artifact) => ({
    id: `moves-generate:${artifact.id}`,
    module: "moves" as const,
    artifactCode: artifact.id,
    label: artifact.label,
    description: artifact.blurb,
    stageKey: artifact.phase,
    state: "available" as const,
    generateHref: artifact.htmlHref,
    reviewHref: `/strategic-moves/${encodeURIComponent(move.id)}/workspace`,
    method: "GET" as const,
    responseKind: "html" as const,
  }));
}
