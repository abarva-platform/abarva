import type { GeneratedArtifactRecord } from "@/lib/artifacts/repository";
import { saveRenderedBoardGradeMoveArtifact } from "@/lib/artifacts/repository";
import { getActiveClientKey } from "@/lib/active-client";

/**
 * Persist a rendered board-grade Move deck to `generated_artifacts`.
 *
 * Client-key resolution is robust by design: prefer the Move's tenant key, then
 * fall back to the active tenant (the same key the retrieval route filters by,
 * so writes and reads stay aligned). `||` — not `??` — is used so an empty
 * string also falls through. The loader returns the Move's `clients.key`, which
 * can be null/empty for some Moves; the previous `tenant_key ?? metadataClientKey`
 * form left `clientId` unresolved, so the deck rendered but was never persisted —
 * silently (no header, no log).
 *
 * When no client key can be resolved the function still returns null (it cannot
 * persist), but it is NOT silent: it warns so a rendered-but-unpersisted deck is
 * observable in logs, and {@link generatedArtifactResponseHeaders} emits an
 * explicit `x-generated-artifact-persisted: false` header on the response.
 */
export async function persistBoardGradeMoveArtifact(input: {
  clientId: string | null | undefined;
  moveId: string;
  artifactId: string;
  title: string;
  html: string;
  renderableDoc?: Record<string, unknown>;
  renderableMetadata?: Record<string, unknown>;
  renderedBy: string;
  routePath: string;
  generatedOn: string;
  citedInputIds?: string[];
  qualityScore?: number | null;
  generationEgressAudit?: string | null;
}): Promise<GeneratedArtifactRecord | null> {
  let clientId = input.clientId?.trim() || null;
  if (!clientId) {
    const active = await getActiveClientKey().catch(() => null);
    clientId = (active ? String(active) : "").trim() || null;
  }
  if (!clientId) {
    console.warn(
      "[board-grade-persistence] clientId unresolved; board-grade deck rendered but NOT persisted",
      {
        moveId: input.moveId,
        artifactId: input.artifactId,
        routePath: input.routePath,
      },
    );
    return null;
  }
  try {
    return await saveRenderedBoardGradeMoveArtifact({ ...input, clientId });
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
  if (!record) return { "x-generated-artifact-persisted": "false" };
  return {
    "x-generated-artifact-persisted": "true",
    "x-generated-artifact-id": record.id,
    "x-generated-artifact-url": record.blobUrl,
    "x-generated-artifact-source-ref": record.sourceArtifactRef,
  };
}
