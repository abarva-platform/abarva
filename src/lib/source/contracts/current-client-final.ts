import "server-only";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";
import type { SourceArtifactRecord } from "@/lib/source/file-cabinet/types";

export async function findCurrentAcceptedClientFinal(
  eventId: string,
  tenantKey: string,
  artifactCode: string,
): Promise<SourceArtifactRecord | null> {
  const artifacts = await listSourceArtifacts(
    eventId,
    { tenantKey },
    {},
    getAzureReadFluentClient(),
  );
  const current = artifacts.filter((artifact) =>
    artifact.sourceEventId === eventId &&
    artifact.tenantKey === tenantKey &&
    artifact.artifactType === artifactCode &&
    artifact.artifactGroup === "approval" &&
    artifact.status === "client_final" &&
    artifact.lifecycleState === "current" &&
    artifact.isClientFinal === true &&
    artifact.isCurrentAuthoritative === true &&
    Boolean(artifact.clientFinalAcceptedBy?.trim()) &&
    Boolean(artifact.clientFinalAcceptedAt?.trim()),
  );
  if (current.length > 1) {
    throw new Error(`Multiple current Client Finals for ${artifactCode}`);
  }
  return current[0] ?? null;
}
