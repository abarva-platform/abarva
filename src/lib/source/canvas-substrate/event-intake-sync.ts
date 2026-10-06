import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";

type DbClient = ReturnType<typeof getAzureWriteFluentClient>;

const TRIGGER_REQUIREMENT_ID = "EVID-SRC-STR-TRIGGER";
const LEGACY_CLIENT_STATED_NOTE =
  "Client-stated sourcing trigger captured in the governed event intake; explicit human review is required before a hard gate can clear.";
const REPAIRED_CLIENT_STATED_NOTE =
  "Intake narrative is context, not record-backed evidence. Upload and parse a source record before this requirement can clear.";

export interface RepairLegacyClientStatedTriggerInput {
  sourceEventId: string;
  tenantKey: string;
}

/**
 * Repairs rows created by the former intake sync, which promoted typed event
 * narrative to Available without linking a source artifact. New intake text is
 * already stored on source_events and must never satisfy this file-backed ask.
 */
export async function repairLegacyClientStatedTriggerEvidence(
  input: RepairLegacyClientStatedTriggerInput,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<boolean> {
  const { data: existing, error: readError } = await db
    .from("source_event_evidence_states")
    .select("*")
    .eq("source_event_id", input.sourceEventId)
    .eq("tenant_key", input.tenantKey)
    .eq("requirement_id", TRIGGER_REQUIREMENT_ID)
    .maybeSingle();
  if (readError) {
    throw new Error(`event intake evidence read failed: ${readError.message}`);
  }
  if (!existing) return false;

  const row = existing as Record<string, unknown>;
  const hasSourceArtifact =
    typeof row.source_artifact_id === "string" &&
    row.source_artifact_id.trim().length > 0;
  const isLegacyNarrativeOnlyRow =
    row.current_state === "Available" &&
    !hasSourceArtifact &&
    row.notes === LEGACY_CLIENT_STATED_NOTE;
  if (!isLegacyNarrativeOnlyRow) return false;

  const nowIso = new Date().toISOString();
  const { error } = await db
    .from("source_event_evidence_states")
    .update({
      current_state: "Not Requested",
      notes: REPAIRED_CLIENT_STATED_NOTE,
      last_synced_at: nowIso,
      updated_at: nowIso,
    })
    .eq("source_event_id", input.sourceEventId)
    .eq("tenant_key", input.tenantKey)
    .eq("requirement_id", TRIGGER_REQUIREMENT_ID);
  if (error) {
    throw new Error(`event intake evidence repair failed: ${error.message}`);
  }
  return true;
}
