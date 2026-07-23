import {
  SOURCE_CONTEXT_RECORD_TYPE,
  SOURCE_CONTEXT_SOURCE_SYSTEM,
  SOURCE_CONTEXT_TABLE,
  type SourceContextFactPayload,
} from "./types";

export interface SourceContextReadbackRecord {
  readonly id: string;
  readonly tenant_key: string;
  readonly canonical_record_id: string;
  readonly record_type: string;
  readonly record_subtype: string | null;
  readonly source_system: string;
  readonly source_record_id: string;
  readonly lifecycle_state: string | null;
  readonly payload: SourceContextFactPayload | Record<string, unknown> | null;
}

export interface SourceContextReadbackFact {
  readonly id?: string;
  readonly record_id: string;
  readonly tenant_key: string;
  readonly source_system: string;
  readonly source_record_id: string;
  readonly lifecycle_state: string | null;
}

export interface SourceContextReadbackReadiness {
  readonly object_table: string;
  readonly object_id: string;
  readonly client_key: string;
  readonly source_layer: string | null;
  readonly source_basis: string | null;
  readonly agent_readiness_status: string | null;
  readonly retrievability: string | null;
  readonly policy_validation_status: string | null;
  readonly provenance: Record<string, unknown> | null;
}

export interface SourceContextReadbackReport {
  readonly status: "pass" | "fail";
  readonly clientKey: string;
  readonly sourceEventId: string;
  readonly counts: {
    readonly records: number;
    readonly facts: number;
    readonly readinessRows: number;
  };
  readonly byFactKey: Record<string, number>;
  readonly readinessStatuses: Record<string, number>;
  readonly missingFactsForRecords: readonly string[];
  readonly missingReadinessForRecords: readonly string[];
  readonly activePromotionViolations: ReadonlyArray<{
    readonly objectId: string;
    readonly agentReadinessStatus: string | null;
    readonly retrievability: string | null;
    readonly policyValidationStatus: string | null;
  }>;
}

function payloadSourceEventId(
  payload: SourceContextReadbackRecord["payload"],
): string | null {
  return typeof payload?.sourceEventId === "string"
    ? payload.sourceEventId
    : null;
}

function provenanceSourceEventId(
  provenance: SourceContextReadbackReadiness["provenance"],
): string | null {
  return typeof provenance?.sourceEventId === "string"
    ? provenance.sourceEventId
    : null;
}

function increment(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

export function summarizeSourceContextReadback(input: {
  readonly clientKey: string;
  readonly sourceEventId: string;
  readonly records: readonly SourceContextReadbackRecord[];
  readonly facts: readonly SourceContextReadbackFact[];
  readonly readinessRows: readonly SourceContextReadbackReadiness[];
}): SourceContextReadbackReport {
  const records = input.records.filter(
    (row) =>
      row.tenant_key === input.clientKey &&
      row.record_type === SOURCE_CONTEXT_RECORD_TYPE &&
      row.source_system === SOURCE_CONTEXT_SOURCE_SYSTEM &&
      payloadSourceEventId(row.payload) === input.sourceEventId,
  );
  const recordIds = new Set(records.map((row) => row.id));
  const facts = input.facts.filter(
    (row) =>
      row.tenant_key === input.clientKey &&
      row.source_system === SOURCE_CONTEXT_SOURCE_SYSTEM &&
      recordIds.has(row.record_id),
  );
  const readinessRows = input.readinessRows.filter(
    (row) =>
      row.client_key === input.clientKey &&
      row.object_table === SOURCE_CONTEXT_TABLE &&
      recordIds.has(row.object_id) &&
      provenanceSourceEventId(row.provenance) === input.sourceEventId,
  );
  const factRecordIds = new Set(facts.map((row) => row.record_id));
  const readinessRecordIds = new Set(readinessRows.map((row) => row.object_id));
  const byFactKey: Record<string, number> = {};
  const readinessStatuses: Record<string, number> = {};
  const activePromotionViolations = readinessRows
    .filter(
      (row) =>
        row.agent_readiness_status !== "not_reviewed" ||
        row.retrievability !== "committed_not_indexed" ||
        row.policy_validation_status !== "pending",
    )
    .map((row) => ({
      objectId: row.object_id,
      agentReadinessStatus: row.agent_readiness_status,
      retrievability: row.retrievability,
      policyValidationStatus: row.policy_validation_status,
    }));

  for (const row of records) {
    increment(byFactKey, row.record_subtype ?? "unknown");
  }
  for (const row of readinessRows) {
    increment(
      readinessStatuses,
      [
        row.agent_readiness_status ?? "unknown",
        row.retrievability ?? "unknown",
        row.policy_validation_status ?? "unknown",
      ].join(" / "),
    );
  }

  const missingFactsForRecords = records
    .filter((row) => !factRecordIds.has(row.id))
    .map((row) => row.canonical_record_id);
  const missingReadinessForRecords = records
    .filter((row) => !readinessRecordIds.has(row.id))
    .map((row) => row.canonical_record_id);
  const status =
    records.length > 0 &&
    missingFactsForRecords.length === 0 &&
    missingReadinessForRecords.length === 0 &&
    activePromotionViolations.length === 0
      ? "pass"
      : "fail";

  return {
    status,
    clientKey: input.clientKey,
    sourceEventId: input.sourceEventId,
    counts: {
      records: records.length,
      facts: facts.length,
      readinessRows: readinessRows.length,
    },
    byFactKey,
    readinessStatuses,
    missingFactsForRecords,
    missingReadinessForRecords,
    activePromotionViolations,
  };
}
