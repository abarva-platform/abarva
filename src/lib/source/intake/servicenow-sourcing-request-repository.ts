import { azureRead } from "@/lib/data-plane/azureRead";

export type SourceIntakeRequestSummary = {
  requestId: string;
  requestNumber: string;
  sourceSystem: "ServiceNow";
  sourceStatus: string;
  sourceVersion: string;
  extractedAt: string;
  updatedAt: string | null;
  title: string;
  description: string;
  trigger?: string | null;
  requestedOutcome?: string | null;
  requestedFor: string | null;
  businessDomain: string | null;
  businessFunction: string | null;
  decisionOwner?: string | null;
  baselineOwner?: string | null;
  scopeIncluded?: string | null;
  scopeExcluded?: string | null;
  securityReviewNeeded?: boolean | null;
  legalReviewNeeded?: boolean | null;
  value: {
    amount: number;
    currency: string;
    validated: false;
  } | null;
  requiredFactGaps: string[];
  mappingProposal: {
    categoryId: string | null;
    archetypeId: string | null;
    confidence: string | null;
    reasons: string[];
  };
  mappingDecision: {
    state: "accepted" | "overridden" | "unmapped";
    categoryId: string | null;
    archetypeId: string | null;
    decidedByName: string;
    decidedAt: string;
    rationale: string;
  } | null;
  eventLink: {
    eventId: string;
    linkedAt: string;
  } | null;
};

export type SourceIntakeRequestQueueRead = {
  registryAvailable: boolean;
  requests: SourceIntakeRequestSummary[];
};

type QueueRow = {
  request_id: string;
  source_request_number: string;
  source_status: string;
  source_version: string;
  extracted_at: string | Date;
  updated_at: string | Date | null;
  normalized_request: unknown;
  mapping_proposal: unknown;
  required_fact_gaps: string[] | null;
  decision_state: string | null;
  decision_category_id?: string | null;
  decision_archetype_id?: string | null;
  decided_by_name?: string | null;
  decided_at?: string | Date | null;
  decision_rationale?: string | null;
  source_event_id: string | null;
  linked_at?: string | Date | null;
};

const UNAVAILABLE: SourceIntakeRequestQueueRead = {
  registryAvailable: false,
  requests: [],
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const iso = (value: string | Date): string =>
  value instanceof Date ? value.toISOString() : value;
const textList = (value: unknown): string[] =>
  Array.isArray(value) ? value.flatMap((item) => (text(item) ? [text(item)!] : [])) : [];

function mapRow(row: QueueRow): SourceIntakeRequestSummary {
  const normalized = asRecord(row.normalized_request);
  const organization = asRecord(normalized.organization);
  const rawValue = asRecord(normalized.value);
  const scope = asRecord(normalized.scope);
  const governance = asRecord(normalized.governance);
  const proposal = asRecord(row.mapping_proposal);
  const amount = typeof rawValue.amount === "number" ? rawValue.amount : null;
  const currency = text(rawValue.currency);
  const decisionState = text(row.decision_state);
  const validDecisionState =
    decisionState === "accepted" ||
    decisionState === "overridden" ||
    decisionState === "unmapped"
      ? decisionState
      : null;

  return {
    requestId: row.request_id,
    requestNumber: row.source_request_number,
    sourceSystem: "ServiceNow",
    sourceStatus: row.source_status,
    sourceVersion: row.source_version,
    extractedAt: iso(row.extracted_at),
    updatedAt: row.updated_at ? iso(row.updated_at) : null,
    title: text(normalized.title) ?? row.source_request_number,
    description: text(normalized.description) ?? "No description recorded.",
    trigger: text(normalized.trigger),
    requestedOutcome: text(normalized.requestedOutcome),
    requestedFor: text(organization.requestedFor),
    businessDomain: text(organization.businessDomain),
    businessFunction: text(organization.businessFunction),
    decisionOwner: text(governance.decisionOwner),
    baselineOwner: text(governance.baselineOwner),
    scopeIncluded: text(scope.included),
    scopeExcluded: text(scope.excluded),
    securityReviewNeeded:
      typeof governance.securityReviewNeeded === "boolean"
        ? governance.securityReviewNeeded
        : null,
    legalReviewNeeded:
      typeof governance.legalReviewNeeded === "boolean"
        ? governance.legalReviewNeeded
        : null,
    value:
      amount !== null && currency
        ? { amount, currency, validated: false }
        : null,
    requiredFactGaps: textList(row.required_fact_gaps),
    mappingProposal: {
      categoryId: text(proposal.categoryId),
      archetypeId: text(proposal.archetypeId),
      confidence: text(proposal.confidence),
      reasons: textList(proposal.reasons),
    },
    mappingDecision:
      validDecisionState &&
      text(row.decided_by_name) &&
      row.decided_at &&
      text(row.decision_rationale)
        ? {
            state: validDecisionState,
            categoryId: text(row.decision_category_id),
            archetypeId: text(row.decision_archetype_id),
            decidedByName: text(row.decided_by_name)!,
            decidedAt: iso(row.decided_at),
            rationale: text(row.decision_rationale)!,
          }
        : null,
    eventLink:
      text(row.source_event_id) && row.linked_at
        ? { eventId: text(row.source_event_id)!, linkedAt: iso(row.linked_at) }
        : null,
  };
}

/**
 * Read the latest imported version of each pre-event request. Relation absence,
 * tenant ambiguity, or malformed authority all fail closed rather than falling
 * back to active sourcing events.
 */
export async function readSourceIntakeRequestQueue(
  tenantKey: string,
): Promise<SourceIntakeRequestQueueRead> {
  if (!tenantKey.trim()) return UNAVAILABLE;

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);
      const rows = await run<QueueRow>(
        `WITH latest AS (
           SELECT DISTINCT ON (request_id) *
           FROM source.intake_request_version
           WHERE tenant_key = $1
           ORDER BY request_id, extracted_at DESC, created_at DESC
         )
         SELECT latest.request_id,
                latest.source_request_number,
                latest.source_status,
                latest.source_version,
                latest.extracted_at,
                latest.updated_at,
                latest.normalized_request,
                latest.mapping_proposal,
                latest.required_fact_gaps,
                decision.decision_state,
                decision.category_id AS decision_category_id,
                decision.archetype_id AS decision_archetype_id,
                decision.decided_by_name,
                decision.decided_at,
                decision.rationale AS decision_rationale,
                event_link.source_event_id,
                event_link.linked_at
         FROM latest
         LEFT JOIN LATERAL (
           SELECT mapping.*
           FROM source.intake_request_mapping_decision mapping
           WHERE mapping.tenant_key = latest.tenant_key
             AND mapping.request_id = latest.request_id
             AND mapping.source_version = latest.source_version
           ORDER BY mapping.decided_at DESC, mapping.created_at DESC
           LIMIT 1
         ) decision ON true
         LEFT JOIN source.intake_request_event_link event_link
           ON event_link.tenant_key = latest.tenant_key
          AND event_link.request_id = latest.request_id
         ORDER BY COALESCE(latest.updated_at, latest.extracted_at) DESC,
                  latest.source_request_number ASC`,
        [tenantKey],
      );
      return { registryAvailable: true, requests: rows.map(mapRow) };
    });
  } catch {
    return UNAVAILABLE;
  }
}
