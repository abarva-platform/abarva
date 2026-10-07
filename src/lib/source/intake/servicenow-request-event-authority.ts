import { createHash } from "node:crypto";
import { azureRead } from "@/lib/data-plane/azureRead";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { ServiceNowRequestEventHandoff } from "./servicenow-request-event-handoff";

export type SourceRequestDispositionState =
  | "accepted"
  | "returned"
  | "merged"
  | "declined";

export type SourceRequestDispositionRow = {
  disposition_state: SourceRequestDispositionState;
  source_version: string;
  decided_by_user_id: string;
  decided_by_name: string;
  decided_at: string;
  rationale: string | null;
  surviving_request_id: string | null;
  surviving_source_version: string | null;
};

function stableId(prefix: string, parts: readonly string[]): string {
  const digest = createHash("sha256")
    .update(parts.join("\u001f"), "utf8")
    .digest("hex")
    .slice(0, 32);
  return `${prefix}-${digest}`;
}

export async function recordServiceNowRequestMappingDecision(input: {
  tenantKey: string;
  requestId: string;
  decision: ServiceNowRequestEventHandoff["mappingDecision"];
}): Promise<void> {
  const { error } = await getAzureWriteFluentClient()
    .from("source.intake_request_mapping_decision")
    .upsert(
      {
        tenant_key: input.tenantKey,
        request_id: input.requestId,
        source_version: input.decision.sourceVersion,
        decision_id: input.decision.decisionId,
        decision_state: input.decision.state,
        category_id: input.decision.categoryId,
        archetype_id: input.decision.archetypeId,
        decided_by_user_id: input.decision.decidedByUserId,
        decided_by_name: input.decision.decidedByName,
        decided_at: input.decision.decidedAt,
        rationale: input.decision.rationale,
      },
      { onConflict: "tenant_key,decision_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

export async function readServiceNowRequestDisposition(input: {
  tenantKey: string;
  requestId: string;
  sourceVersion: string;
}): Promise<SourceRequestDispositionRow | null> {
  const rows = await azureRead.query<SourceRequestDispositionRow>(
    `SELECT disposition_state, source_version, decided_by_user_id,
            decided_by_name, decided_at, rationale,
            surviving_request_id, surviving_source_version
       FROM source.intake_request_disposition
      WHERE tenant_key = $1 AND request_id = $2 AND source_version = $3`,
    [input.tenantKey, input.requestId, input.sourceVersion],
  );
  return rows[0] ?? null;
}

export async function readServiceNowRequestDispositions(
  tenantKey: string,
): Promise<Array<SourceRequestDispositionRow & { request_id: string }>> {
  return azureRead.query<SourceRequestDispositionRow & { request_id: string }>(
    `SELECT request_id, disposition_state, source_version, decided_by_user_id,
            decided_by_name, decided_at, rationale,
            surviving_request_id, surviving_source_version
       FROM source.intake_request_disposition
      WHERE tenant_key = $1`,
    [tenantKey],
  );
}

export async function recordServiceNowRequestDisposition(input: {
  tenantKey: string;
  requestId: string;
  sourceVersion: string;
  state: SourceRequestDispositionState;
  survivingRequestId?: string;
  survivingSourceVersion?: string;
  rationale: string;
  decidedByUserId: string;
  decidedByName: string;
}): Promise<void> {
  const { error } = await getAzureWriteFluentClient()
    .from("source.intake_request_disposition")
    .insert({
      tenant_key: input.tenantKey,
      request_id: input.requestId,
      source_version: input.sourceVersion,
      disposition_state: input.state,
      surviving_request_id: input.survivingRequestId ?? null,
      surviving_source_version: input.survivingSourceVersion ?? null,
      rationale: input.rationale,
      decided_by_user_id: input.decidedByUserId,
      decided_by_name: input.decidedByName,
    });
  if (error) throw new Error(error.message);
}

export async function linkServiceNowRequestToEvent(input: {
  tenantKey: string;
  requestId: string;
  sourceVersion: string;
  sourceEventId: string;
  linkedByUserId: string;
  linkedByName: string;
  linkedAt: string;
  rationale: string;
}): Promise<void> {
  const linkId = stableId("event-link", [
    input.tenantKey,
    input.requestId,
    input.sourceVersion,
    input.sourceEventId,
  ]);
  const { error } = await getAzureWriteFluentClient()
    .from("source.intake_request_event_link")
    .upsert(
      {
        tenant_key: input.tenantKey,
        request_id: input.requestId,
        source_version: input.sourceVersion,
        link_id: linkId,
        source_event_id: input.sourceEventId,
        linked_by_user_id: input.linkedByUserId,
        linked_by_name: input.linkedByName,
        linked_at: input.linkedAt,
        rationale: input.rationale,
      },
      { onConflict: "tenant_key,request_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}
