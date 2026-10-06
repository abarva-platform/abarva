import { createHash } from "node:crypto";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { ServiceNowRequestEventHandoff } from "./servicenow-request-event-handoff";

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
