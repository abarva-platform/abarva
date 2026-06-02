import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { ActivityEntry } from "@/components/source/canvas/workspace-tabs/LogTab";

export interface SourceEventActivityRow {
  id: string;
  event_id: string;
  client_key: string;
  actor_user_id: string | null;
  actor_display_name: string | null;
  actor_role: string | null;
  action_type: string;
  action_label: string;
  stage_key: string | null;
  artifact_code: string | null;
  criterion_id: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export async function listSourceEventActivityEntries(
  eventId: string,
): Promise<ActivityEntry[]> {
  const sb = getAzureReadFluentClient();
  const { data, error } = await sb
    .from("source_event_activity")
    .select("*")
    .eq("event_id", eventId)
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(
      "[listSourceEventActivityEntries] read failed",
      error.message,
    );
    return [];
  }

  return ((data as SourceEventActivityRow[] | null) ?? []).map(
    activityRowToEntry,
  );
}

function activityRowToEntry(row: SourceEventActivityRow): ActivityEntry {
  const subject = [
    row.stage_key ? `Stage: ${row.stage_key}` : null,
    row.artifact_code ? `Artifact: ${row.artifact_code}` : null,
    row.criterion_id ? `Criterion: ${row.criterion_id}` : null,
  ].filter(Boolean);
  const reason = row.reason?.trim() ? ` Reason: ${row.reason.trim()}` : "";
  const body = [
    row.action_label,
    subject.length > 0 ? `(${subject.join(" · ")})` : "",
    reason,
  ]
    .filter((part) => part.length > 0)
    .join(" ");

  return {
    id: row.id,
    at: row.occurred_at,
    actor: actorLabel(row),
    body,
  };
}

function actorLabel(row: SourceEventActivityRow): string | undefined {
  const name = row.actor_display_name?.trim();
  const role = row.actor_role?.trim();
  if (name && role) return `${name} · ${role}`;
  return name || role || row.actor_user_id || undefined;
}
