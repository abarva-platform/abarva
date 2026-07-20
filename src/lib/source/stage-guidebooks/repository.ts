// Source · Stage Guidebooks · repository
//
// Reads source_stage_guidebooks through the same data-plane seam the rest of
// Source uses (getAzureReadFluentClient — the Supabase-compatible fluent API
// over Azure Postgres), not the AgentContextBroker (that is for enterprise
// context, not Source-owned tables) and not a raw pg.Pool (that is the Moves
// workshops module's pattern; this table is Source-native and does not share
// it). Tenant-scoped via client_key; a NULL client_key row is the shared
// global default guidebook for that stage.

import "server-only";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { SourceStageKey } from "@/lib/source/types";
import type {
  SourceStageGuidebookRecord,
  SourceStageGuidebookSection,
} from "./types";

interface SourceStageGuidebookRow {
  id: string;
  stage_key: string;
  client_key: string | null;
  title: string;
  purpose: string;
  duration_minutes: number;
  status: string;
  sections: unknown;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: SourceStageGuidebookRow): SourceStageGuidebookRecord {
  return {
    id: row.id,
    stageKey: row.stage_key as SourceStageKey,
    clientKey: row.client_key,
    title: row.title,
    purpose: row.purpose,
    durationMinutes: row.duration_minutes,
    status: row.status as SourceStageGuidebookRecord["status"],
    sections: normalizeSections(row.sections),
    version: row.version,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeSections(raw: unknown): SourceStageGuidebookSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      type: String(item.type ?? "facilitator_brief") as SourceStageGuidebookSection["type"],
      title: String(item.title ?? ""),
      body: String(item.body ?? ""),
      timeBoxMinutes:
        typeof item.timeBoxMinutes === "number" ? item.timeBoxMinutes : null,
    }));
}

/**
 * Get the guidebook to render for a stage: the tenant's own published
 * override if one exists, else the global published default, else null (no
 * guidebook authored for this stage yet — the caller should degrade
 * gracefully, not treat this as an error).
 */
export async function getSourceStageGuidebook(
  stageKey: SourceStageKey,
  clientKey: string,
): Promise<SourceStageGuidebookRecord | null> {
  const supabase = getAzureReadFluentClient();
  const { data, error } = await supabase
    .from("source_stage_guidebooks")
    .select(
      "id, stage_key, client_key, title, purpose, duration_minutes, status, sections, version, created_by, updated_by, published_at, created_at, updated_at",
    )
    .eq("stage_key", stageKey)
    .eq("status", "published")
    .or(`client_key.eq.${clientKey},client_key.is.null`)
    .order("client_key", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToRecord(data as unknown as SourceStageGuidebookRow);
}
