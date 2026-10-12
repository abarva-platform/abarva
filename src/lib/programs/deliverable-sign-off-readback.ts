import "server-only";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

export interface DeliverableSignOffState {
  deliverableId: string;
  signedOffVersion: number | null;
  currentVersion: number | null;
}

/** The current deliverables_v2 sign-off projection, with explicit read health. */
export async function loadDeliverableSignOffByKey(programId: string): Promise<{
  byKey: Map<string, DeliverableSignOffState>;
  available: boolean;
}> {
  const byKey = new Map<string, DeliverableSignOffState>();
  try {
    const db = getAzureReadFluentClient();
    const { data, error } = await db
      .from("deliverables_v2")
      .select(
        "id, deliverable_type_key, current_version, signed_off_version, updated_at",
      )
      .eq("engagement_id", programId)
      .order("updated_at", { ascending: false });
    if (error || !Array.isArray(data)) return { byKey, available: false };
    for (const row of data as Array<Record<string, unknown>>) {
      const key =
        typeof row.deliverable_type_key === "string"
          ? row.deliverable_type_key
          : "";
      if (!key || byKey.has(key)) continue;
      byKey.set(key, {
        deliverableId: String(row.id ?? ""),
        signedOffVersion:
          typeof row.signed_off_version === "number"
            ? row.signed_off_version
            : null,
        currentVersion:
          typeof row.current_version === "number" ? row.current_version : null,
      });
    }
    return { byKey, available: true };
  } catch {
    return { byKey, available: false };
  }
}
