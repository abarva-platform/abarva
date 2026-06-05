import type { GeneratedArtifactRecord } from "@/lib/artifacts/repository";
import { saveRenderedBoardGradeMoveArtifact } from "@/lib/artifacts/repository";

export async function persistBoardGradeMoveArtifact(input: {
  clientId: string | null | undefined;
  moveId: string;
  artifactId: string;
  title: string;
  html: string;
  renderedBy: string;
  routePath: string;
  generatedOn: string;
}): Promise<GeneratedArtifactRecord | null> {
  if (!input.clientId?.trim()) return null;
  try {
    return await saveRenderedBoardGradeMoveArtifact({
      ...input,
      clientId: input.clientId,
    });
  } catch (err) {
    console.error(
      "[board-grade-persistence] generated_artifacts insert failed",
      {
        err,
        moveId: input.moveId,
        artifactId: input.artifactId,
      },
    );
    return null;
  }
}

export function generatedArtifactResponseHeaders(
  record: GeneratedArtifactRecord | null,
): Record<string, string> {
  if (!record) return {};
  return {
    "x-generated-artifact-id": record.id,
    "x-generated-artifact-url": record.blobUrl,
    "x-generated-artifact-source-ref": record.sourceArtifactRef,
  };
}
