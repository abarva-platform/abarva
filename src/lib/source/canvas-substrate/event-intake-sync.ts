import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { SourceEventEvidenceCurrentState } from "./types";

type DbClient = ReturnType<typeof getAzureWriteFluentClient>;

const TRIGGER_REQUIREMENT_ID = "EVID-SRC-STR-TRIGGER";
const CLIENT_STATED_STATE: SourceEventEvidenceCurrentState = "Available";

const STATE_RANK: Record<SourceEventEvidenceCurrentState, number> = {
  "Not Requested": 0,
  Stale: 0,
  "Low Confidence": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
};

export interface SyncEventIntakeEvidenceInput {
  sourceEventId: string;
  tenantKey: string;
  triggerDescription: string | null | undefined;
}

/**
 * Reconciles the required event trigger with its Strategy evidence row.
 * The trigger remains client-stated and therefore needs an explicit human
 * criterion review before a hard gate can clear.
 */
export async function syncEventIntakeEvidence(
  input: SyncEventIntakeEvidenceInput,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<boolean> {
  const trigger = input.triggerDescription?.trim();
  if (!trigger) return false;

  const { data: existing, error: readError } = await db
    .from("source_event_evidence_states")
    .select("*")
    .eq("source_event_id", input.sourceEventId)
    .eq("requirement_id", TRIGGER_REQUIREMENT_ID)
    .maybeSingle();
  if (readError) {
    throw new Error(`event intake evidence read failed: ${readError.message}`);
  }

  const nowIso = new Date().toISOString();
  const note =
    "Client-stated sourcing trigger captured in the governed event intake; explicit human review is required before a hard gate can clear.";
  const currentState = existing
    ? (String(
        (existing as Record<string, unknown>).current_state ?? "Not Requested",
      ) as SourceEventEvidenceCurrentState)
    : null;

  if (
    existing &&
    STATE_RANK[currentState ?? "Not Requested"] >=
      STATE_RANK[CLIENT_STATED_STATE]
  ) {
    return false;
  }

  if (existing) {
    const { error } = await db
      .from("source_event_evidence_states")
      .update({
        current_state: CLIENT_STATED_STATE,
        notes: note,
        last_synced_at: nowIso,
        updated_at: nowIso,
      })
      .eq("source_event_id", input.sourceEventId)
      .eq("requirement_id", TRIGGER_REQUIREMENT_ID);
    if (error) {
      throw new Error(`event intake evidence update failed: ${error.message}`);
    }
    return true;
  }

  const { error } = await db.from("source_event_evidence_states").insert({
    source_event_id: input.sourceEventId,
    tenant_key: input.tenantKey,
    requirement_id: TRIGGER_REQUIREMENT_ID,
    stage_key: "strategy",
    current_state: CLIENT_STATED_STATE,
    source_artifact_id: null,
    notes: note,
    last_synced_at: nowIso,
  });
  if (error) {
    throw new Error(`event intake evidence insert failed: ${error.message}`);
  }
  return true;
}
