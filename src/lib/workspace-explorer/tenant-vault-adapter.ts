import "server-only";

import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { listGeneratedArtifactsForClient } from "@/lib/artifacts/repository";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { listMoveArtifactsForTenant } from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { listSourceArtifactsForTenant } from "@/lib/source/artifact-registry";
import { sourceRegistryArtifactToWorkspaceItem } from "./source-adapter-mapping";
import {
  generatedMoveArtifactToWorkspaceItem,
  moveArtifactToWorkspaceItem,
} from "./moves-adapter-mapping";
import type { WorkspaceItem } from "./types";
import { filterTenantVaultItemsForPolicies } from "./tenant-vault-policy";

function sourceVaultHref(artifactId: string): string {
  return `/api/setup/files/source/${encodeURIComponent(artifactId)}/download`;
}

function moveVaultHref(artifactId: string): string {
  return `/api/setup/files/move/${encodeURIComponent(artifactId)}/download`;
}

function generatedVaultHref(artifactId: string): string {
  return `/api/setup/files/generated/${encodeURIComponent(artifactId)}/download`;
}

function moveIdFromGeneratedSourceRef(
  sourceArtifactRef: string,
): string | null {
  const match = /^move:([^:]+):/.exec(sourceArtifactRef);
  return match?.[1] ?? null;
}

function sourceItemForTenantVault(
  record: Parameters<typeof sourceRegistryArtifactToWorkspaceItem>[0],
): WorkspaceItem {
  const item = sourceRegistryArtifactToWorkspaceItem(record);
  return {
    ...item,
    href: sourceVaultHref(record.id),
    sourceLabel: "Tenant vault · Source",
    blobPath: `source:${record.sourceEventId}`,
  };
}

export async function listTenantVaultWorkspaceItems(
  ctx: TenancyCtx,
): Promise<WorkspaceItem[]> {
  const tenantKey = ctx.clientKey
    ? clientKeyToInventorySubstrateKey(ctx.clientKey)
    : "";
  const [sourcePolicy, movesPolicy] = await Promise.all([
    loadUserSourceAccessPolicy(ctx, { activeClientKey: ctx.clientKey ?? "" }),
    loadUserProgramAccessPolicy(ctx),
  ]);

  const [sourceArtifacts, moveArtifacts, generatedArtifacts] =
    await Promise.all([
      tenantKey
        ? listSourceArtifactsForTenant(tenantKey).catch(() => [])
        : Promise.resolve([]),
      listMoveArtifactsForTenant(ctx, { currentOnly: true }).catch(() => []),
      listGeneratedArtifactsForClient({ clientId: ctx.clientId }).catch(
        () => [],
      ),
    ]);

  const sourceItems = sourceArtifacts.map(sourceItemForTenantVault);
  const moveItems = moveArtifacts.map((row) => ({
    ...moveArtifactToWorkspaceItem(row),
    href: moveVaultHref(row.artifact_id),
    sourceLabel: "Tenant vault · Moves File Cabinet",
    classification:
      typeof row.metadata?.classification === "string"
        ? row.metadata.classification
        : typeof row.metadata?.dataClassification === "string"
          ? row.metadata.dataClassification
          : null,
    blobPath: `move:${row.move_id}`,
  }));
  const generatedItems = generatedArtifacts.map((record) => {
    const item = generatedMoveArtifactToWorkspaceItem(record);
    const moveId = moveIdFromGeneratedSourceRef(record.sourceArtifactRef);
    return {
      ...item,
      href: generatedVaultHref(record.id),
      sourceLabel: "Tenant vault · Generated artifacts",
      classification:
        typeof record.metadata.classification === "string"
          ? record.metadata.classification
          : null,
      blobPath: moveId ? `move:${moveId}` : item.blobPath,
    };
  });

  return filterTenantVaultItemsForPolicies(
    [...sourceItems, ...moveItems, ...generatedItems],
    { source: sourcePolicy, moves: movesPolicy },
  ).sort((a, b) => {
    const aUpdated = a.audit.updatedAt ?? a.audit.createdAt ?? "";
    const bUpdated = b.audit.updatedAt ?? b.audit.createdAt ?? "";
    return bUpdated.localeCompare(aUpdated);
  });
}
