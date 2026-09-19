import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

/**
 * One line of the governed decision trail.
 *
 * Defined here rather than imported from a display component: the reader is
 * what produces these, and its previous import pointed at
 * `workspace-tabs/LogTab`, which no route mounts.
 */
export interface ActivityEntry {
  id: string;
  /** ISO timestamp. */
  at: string;
  /** Short description. */
  body: string;
  /** Optional actor (agent name or person). */
  actor?: string;
}

/**
 * A trail read either succeeded or it did not, and the caller has to be able
 * to tell. Returning `[]` on a failed read made "no decisions have been
 * recorded" and "we could not reach the decision log" render identically — as
 * the more reassuring of the two, on an approval surface.
 */
export type SourceEventActivityResult =
  | { ok: true; entries: ActivityEntry[] }
  | { ok: false; reason: string };

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
): Promise<SourceEventActivityResult> {
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
    return { ok: false, reason: error.message };
  }

  return {
    ok: true,
    entries: ((data as SourceEventActivityRow[] | null) ?? []).map(
      activityRowToEntry,
    ),
  };
}


/**
 * Coerce a timestamp column to an ISO string.
 *
 * `occurred_at` is typed `string` here, but it is a timestamptz and a driver
 * may return a Date. That value was handed straight to the view, which
 * rendered it as a React child — and a Date as a child throws, taking the
 * whole event workspace to the error boundary rather than just the panel.
 * The type was a claim, not a guarantee.
 */
function isoTimestamp(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  return "";
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
    at: isoTimestamp(row.occurred_at),
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
