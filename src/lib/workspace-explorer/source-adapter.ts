import "server-only";

import { listSourceArtifactsForSourceEventId } from "@/lib/source/artifact-registry";
import {
  listArtifactStatesForEvent,
  listEvidenceStatesForEvent,
  listGateCriterionStatesForEvent,
} from "@/lib/source/canvas-substrate";
import type { WorkspaceGenerateCandidate, WorkspaceItem } from "./types";
import {
  buildSourceGenerateCandidates,
  buildSourceWorkspaceItems,
} from "./source-adapter-mapping";

export async function listSourceWorkspaceItems(
  sourceEventId: string,
): Promise<WorkspaceItem[]> {
  const [
    registryArtifacts,
    artifactStates,
    evidenceStates,
    gateCriterionStates,
  ] = await Promise.all([
    listSourceArtifactsForSourceEventId(sourceEventId).catch((error) => {
      console.error(
        "[SourceWorkspaceAdapter] source_artifacts registry read failed",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }),
    listArtifactStatesForEvent(sourceEventId),
    listEvidenceStatesForEvent(sourceEventId),
    listGateCriterionStatesForEvent(sourceEventId),
  ]);

  return buildSourceWorkspaceItems({
    registryArtifacts,
    artifactStates,
    evidenceStates,
    gateCriterionStates,
  });
}

export async function listSourceWorkspaceGenerateCandidates(args: {
  sourceEventId: string;
  stageKey: string | null;
}): Promise<WorkspaceGenerateCandidate[]> {
  const artifactStates = await listArtifactStatesForEvent(args.sourceEventId);
  return buildSourceGenerateCandidates({
    sourceEventId: args.sourceEventId,
    stageKey: args.stageKey,
    artifactStates,
  });
}
