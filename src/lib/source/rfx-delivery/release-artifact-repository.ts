import { azureRead } from "@/lib/data-plane/azureRead";

export type RfxSourceArtifact = {
  artifactId: string;
  tenantKey: string;
  eventId: string;
  sha256: string;
  lifecycleState: string;
  deletedAt: string | null;
};

type ArtifactRow = {
  id: string;
  tenant_key: string;
  source_event_id: string;
  sha256: string;
  lifecycle_state: string;
  deleted_at: string | Date | null;
};

const UNAVAILABLE = { registryAvailable: false, artifacts: [] } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;

export async function readArtifactsForEvent(input: {
  clientKey: string;
  eventId: string;
  artifactIds: readonly string[];
}): Promise<{ registryAvailable: boolean; artifacts: readonly RfxSourceArtifact[] }> {
  if (!input.clientKey.trim() || !input.eventId.trim() || input.artifactIds.length === 0 ||
      input.artifactIds.some((id) => !UUID.test(id)) ||
      new Set(input.artifactIds).size !== input.artifactIds.length) return UNAVAILABLE;

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [input.clientKey]);
      const rows = await run<ArtifactRow>(
        `SELECT id, tenant_key, source_event_id, sha256, lifecycle_state, deleted_at
         FROM source_artifacts
         WHERE tenant_key = $1 AND source_event_id = $2 AND id = ANY($3::uuid[])
         ORDER BY id`,
        [input.clientKey, input.eventId, input.artifactIds],
      );
      if (!rows.every((row) =>
        row.tenant_key === input.clientKey && row.source_event_id === input.eventId &&
        input.artifactIds.includes(row.id) && SHA256.test(row.sha256) &&
        typeof row.lifecycle_state === "string")) return UNAVAILABLE;
      return {
        registryAvailable: true,
        artifacts: rows.map((row) => ({
          artifactId: row.id,
          tenantKey: row.tenant_key,
          eventId: row.source_event_id,
          sha256: row.sha256.toLowerCase(),
          lifecycleState: row.lifecycle_state,
          deletedAt: row.deleted_at instanceof Date ? row.deleted_at.toISOString() : row.deleted_at,
        })),
      };
    });
  } catch {
    return UNAVAILABLE;
  }
}
