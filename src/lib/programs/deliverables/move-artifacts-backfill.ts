import "server-only";

// ── Move Artifact Vault — backfill ────────────────────────────────────────────
// Registers a Move's pre-existing deliverables (deliverables_v2 + latest
// version content) into the durable Artifact Vault so the File Cabinet shows
// everything, not only artifacts generated after the vault shipped. Each
// deliverable's latest content is rendered (HTML/Markdown), uploaded to Azure
// Blob, and registered in move_artifacts. Idempotent: a deliverable type that
// already has a current vault artifact is skipped (so re-running is safe and a
// freshly generated artifact is never clobbered by an older one).

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { saveMoveArtifact } from "./move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";

// deliverables_v2.status → governed move_artifacts.status
function mapStatus(s: string | null): string {
  switch ((s ?? "").toLowerCase()) {
    case "signed_off":
    case "approved":
      return "approved";
    case "published":
    case "in_review":
    case "review":
      return "review_required";
    case "preliminary":
      return "preliminary";
    case "blocked":
      return "blocked";
    default:
      return "draft";
  }
}

function detectFormat(content: string): "html" | "md" {
  return content.trimStart().startsWith("<") ? "html" : "md";
}

function safeName(s: string): string {
  return (s || "deliverable").replace(/[^A-Za-z0-9]+/g, "_").slice(0, 80);
}

export interface BackfillResult {
  registered: number;
  skipped: number;
  items: Array<{
    type: string;
    title: string;
    action: "registered" | "skipped";
    artifactId?: string;
    blobStored?: boolean;
    reason?: string;
  }>;
}

/**
 * Backfill the vault from deliverables_v2 for one Move. Best-effort per item;
 * a single failure does not abort the run.
 */
export async function backfillMoveArtifactsFromDeliverables(
  ctx: TenancyCtx,
  moveId: string,
): Promise<BackfillResult> {
  const sb = getAzureWriteFluentClient();
  const result: BackfillResult = { registered: 0, skipped: 0, items: [] };

  // Existing vault artifact types already present for this move (current).
  const existingTypes = new Set<string>();
  try {
    const { data } = await sb
      .from("move_artifacts")
      .select("artifact_type")
      .eq("move_id", moveId)
      .eq("lifecycle_state", "current");
    for (const r of (data as Array<{ artifact_type: string }>) ?? [])
      existingTypes.add(r.artifact_type);
  } catch {
    /* treat as empty */
  }

  const { data, error } = await sb
    .from("deliverables_v2")
    .select(
      `id, deliverable_type_key, title, status, current_version, updated_at,
       deliverable_versions!inner(content, version)`,
    )
    .eq("engagement_id", moveId)
    .order("updated_at", { ascending: false });
  if (error || !Array.isArray(data)) return result;

  // Latest version per deliverable_type_key.
  const byType = new Map<
    string,
    {
      id: string;
      type: string;
      title: string;
      status: string | null;
      content: string;
      version: number;
    }
  >();
  for (const row of data as Array<{
    id: string;
    deliverable_type_key: string;
    title: string | null;
    status: string | null;
    current_version: number | null;
    deliverable_versions: Array<{ content: string | null; version: number }>;
  }>) {
    const versions = row.deliverable_versions ?? [];
    const latest = versions.reduce(
      (best, v) => (v.version > (best?.version ?? -1) ? v : best),
      null as { content: string | null; version: number } | null,
    );
    const content = latest?.content ?? "";
    if (!content.trim()) continue;
    const prior = byType.get(row.deliverable_type_key);
    if (!prior || (latest?.version ?? 0) > prior.version) {
      byType.set(row.deliverable_type_key, {
        id: row.id,
        type: row.deliverable_type_key,
        title: row.title ?? row.deliverable_type_key,
        status: row.status,
        content,
        version: latest?.version ?? 1,
      });
    }
  }

  for (const d of byType.values()) {
    if (existingTypes.has(d.type)) {
      result.skipped += 1;
      result.items.push({
        type: d.type,
        title: d.title,
        action: "skipped",
        reason: "already in vault",
      });
      continue;
    }
    try {
      const fmt = detectFormat(d.content);
      const saved = await saveMoveArtifact(ctx, {
        moveId,
        phase: 0,
        artifactType: d.type,
        artifactFamily: "generated_deliverable",
        title: d.title,
        description: "Backfilled from existing Move deliverable.",
        fileName: `${safeName(d.title)}.${fmt}`,
        fileFormat: fmt,
        body: d.content,
        status: mapStatus(d.status),
        sourceBasis: "backfill_deliverables_v2",
        confidence: "medium",
        citationReady: false,
        generatedBy: "vault-backfill",
        metadata: {
          backfilledFromDeliverableId: d.id,
          sourceVersion: d.version,
          sourceStatus: d.status,
        },
      });
      result.registered += 1;
      result.items.push({
        type: d.type,
        title: d.title,
        action: "registered",
        artifactId: saved.artifactId,
        blobStored: saved.blobStored,
      });
    } catch (e) {
      result.skipped += 1;
      result.items.push({
        type: d.type,
        title: d.title,
        action: "skipped",
        reason: e instanceof Error ? e.message : "save failed",
      });
    }
  }

  return result;
}
