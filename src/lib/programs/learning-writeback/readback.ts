import {
  MOVES_LEARNING_CONTEXT_TABLE,
  MOVES_LEARNING_RECORD_TYPE,
  MOVES_LEARNING_SOURCE_SYSTEM,
  type MovesLearningPayload,
} from "./types";

export interface MovesLearningReadbackRecord {
  readonly id: string;
  readonly tenant_key: string;
  readonly canonical_record_id: string;
  readonly record_type: string;
  readonly record_subtype: string | null;
  readonly source_system: string;
  readonly source_record_id: string;
  readonly lifecycle_state: string | null;
  readonly payload: MovesLearningPayload | Record<string, unknown> | null;
}

export interface MovesLearningReadbackFact {
  readonly id?: string;
  readonly record_id: string;
  readonly tenant_key: string;
  readonly source_system: string;
  readonly source_record_id: string;
  readonly lifecycle_state: string | null;
}

export interface MovesLearningReadbackReadiness {
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

export interface MovesLearningReadbackReport {
  readonly status: "pass" | "fail";
  readonly clientKey: string;
  readonly moveId: string;
  readonly counts: {
    readonly records: number;
    readonly facts: number;
    readonly readinessRows: number;
  };
  readonly bySourceBasis: Record<string, number>;
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

function payloadMoveId(payload: MovesLearningReadbackRecord["payload"]): string | null {
  return typeof payload?.moveId === "string" ? payload.moveId : null;
}

function provenanceMoveId(
  provenance: MovesLearningReadbackReadiness["provenance"],
): string | null {
  return typeof provenance?.moveId === "string" ? provenance.moveId : null;
}

function increment(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

export function summarizeMovesLearningReadback(input: {
  readonly clientKey: string;
  readonly moveId: string;
  readonly records: readonly MovesLearningReadbackRecord[];
  readonly facts: readonly MovesLearningReadbackFact[];
  readonly readinessRows: readonly MovesLearningReadbackReadiness[];
}): MovesLearningReadbackReport {
  const records = input.records.filter(
    (row) =>
      row.tenant_key === input.clientKey &&
      row.record_type === MOVES_LEARNING_RECORD_TYPE &&
      row.source_system === MOVES_LEARNING_SOURCE_SYSTEM &&
      payloadMoveId(row.payload) === input.moveId,
  );
  const recordIds = new Set(records.map((row) => row.id));
  const facts = input.facts.filter(
    (row) =>
      row.tenant_key === input.clientKey &&
      row.source_system === MOVES_LEARNING_SOURCE_SYSTEM &&
      recordIds.has(row.record_id),
  );
  const readinessRows = input.readinessRows.filter(
    (row) =>
      row.client_key === input.clientKey &&
      row.object_table === MOVES_LEARNING_CONTEXT_TABLE &&
      recordIds.has(row.object_id) &&
      provenanceMoveId(row.provenance) === input.moveId,
  );
  const factRecordIds = new Set(facts.map((row) => row.record_id));
  const readinessRecordIds = new Set(readinessRows.map((row) => row.object_id));
  const bySourceBasis: Record<string, number> = {};
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
    increment(bySourceBasis, row.record_subtype ?? "unknown");
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
    moveId: input.moveId,
    counts: {
      records: records.length,
      facts: facts.length,
      readinessRows: readinessRows.length,
    },
    bySourceBasis,
    readinessStatuses,
    missingFactsForRecords,
    missingReadinessForRecords,
    activePromotionViolations,
  };
}
