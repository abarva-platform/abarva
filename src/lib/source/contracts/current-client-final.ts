import "server-only";

import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";
import type { SourceArtifactRecord } from "@/lib/source/file-cabinet/types";

export async function findCurrentAcceptedClientFinal(
  eventId: string,
  tenantKey: string,
  artifactCode: string,
): Promise<SourceArtifactRecord | null> {
  const registryTenantKey = clientKeyToInventorySubstrateKey(tenantKey);
  const artifacts = await listSourceArtifacts(
    eventId,
    { tenantKey: registryTenantKey },
    {},
    getAzureReadFluentClient(),
  );
  const current = artifacts.filter((artifact) =>
    artifact.sourceEventId === eventId &&
    artifact.tenantKey === registryTenantKey &&
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
