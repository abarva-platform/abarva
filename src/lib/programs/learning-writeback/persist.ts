import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";
import { buildMovesLearningWritebackPlan } from "./build-writeback";
import {
  MOVES_LEARNING_CONTEXT_TABLE,
  MOVES_LEARNING_FACTS_TABLE,
  MOVES_LEARNING_READINESS_TABLE,
  type MovesLearningDeliverableInput,
  type MovesLearningEnterpriseContextFactRow,
  type MovesLearningEnterpriseContextRecordRow,
  type MovesLearningEvidenceInput,
  type MovesLearningGateDecisionInput,
  type MovesLearningMove,
  type MovesLearningReadinessRow,
  type MovesLearningWritebackResult,
} from "./types";

type DbResult<T> = { data: T | null; error: { message: string } | null };

async function throwOnError<T>(
  label: string,
  result: DbResult<T>,
): Promise<T | null> {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

export interface MovesLearningWritebackStore {
  upsertRecords(
    rows: readonly MovesLearningEnterpriseContextRecordRow[],
  ): Promise<Map<string, string>>;
  upsertFacts(rows: readonly MovesLearningEnterpriseContextFactRow[]): Promise<number>;
  upsertReadiness(rows: readonly MovesLearningReadinessRow[]): Promise<number>;
}

function azureMovesLearningWritebackStore(
  db: PostgresCompatClient = getAzureWriteFluentClient(),
): MovesLearningWritebackStore {
  return {
    async upsertRecords(rows) {
      if (rows.length === 0) return new Map();
      for (let index = 0; index < rows.length; index += 100) {
        await throwOnError(
          "enterprise_context_records upsert",
          await db
            .from(MOVES_LEARNING_CONTEXT_TABLE)
            .upsert(rows.slice(index, index + 100), {
              onConflict: "tenant_key,canonical_record_id",
            })
            .select("id"),
        );
      }
      const tenantKey = rows[0]?.tenant_key;
      const canonicalIds = rows.map((row) => row.canonical_record_id);
      const idRows =
        (await throwOnError<Array<{ id: string; canonical_record_id: string }>>(
          "enterprise_context_records id map",
          await db
            .from(MOVES_LEARNING_CONTEXT_TABLE)
            .select("id,canonical_record_id")
            .eq("tenant_key", tenantKey)
            .in("canonical_record_id", canonicalIds),
        )) ?? [];
      return new Map(idRows.map((row) => [row.canonical_record_id, row.id]));
    },

    async upsertFacts(rows) {
      if (rows.length === 0) return 0;
      for (let index = 0; index < rows.length; index += 250) {
        await throwOnError(
          "enterprise_context_facts upsert",
          await db
            .from(MOVES_LEARNING_FACTS_TABLE)
            .upsert(rows.slice(index, index + 250), {
              onConflict: "tenant_key,record_id,fact_key,value_hash",
            })
            .select("id"),
        );
      }
      return rows.length;
    },

    async upsertReadiness(rows) {
      if (rows.length === 0) return 0;
      for (let index = 0; index < rows.length; index += 250) {
        await throwOnError(
          "governed_object_readiness upsert",
          await db
            .from(MOVES_LEARNING_READINESS_TABLE)
            .upsert(rows.slice(index, index + 250), {
              onConflict: "object_table,object_id,client_key",
            })
            .select("id"),
        );
      }
      return rows.length;
    },
  };
}

export async function writeMovesLearningToEnterpriseContext(
  input: {
    readonly move: MovesLearningMove;
    readonly evidence: readonly MovesLearningEvidenceInput[];
    readonly deliverables: readonly MovesLearningDeliverableInput[];
    readonly gateDecisions: readonly MovesLearningGateDecisionInput[];
    readonly committedAt?: string;
  },
  store: MovesLearningWritebackStore = azureMovesLearningWritebackStore(),
): Promise<MovesLearningWritebackResult> {
  const plan = buildMovesLearningWritebackPlan({
    move: input.move,
    evidence: input.evidence,
    deliverables: input.deliverables,
    gateDecisions: input.gateDecisions,
    committedAt: input.committedAt ?? new Date().toISOString(),
  });

  if (plan.records.length === 0) {
    return {
      status: "skipped",
      reason: "no_eligible_learning",
      skipped: plan.skipped,
    };
  }

  try {
    const idMap = await store.upsertRecords(plan.records);
    const factRows: MovesLearningEnterpriseContextFactRow[] =
      plan.factDrafts.flatMap((fact) => {
        const recordId = idMap.get(fact.canonical_record_id);
        if (!recordId) return [];
        const { canonical_record_id: _canonicalRecordId, ...row } = fact;
        void _canonicalRecordId;
        return [{ ...row, record_id: recordId }];
      });
    const readinessRows: MovesLearningReadinessRow[] = plan.readinessDrafts.flatMap((row) => {
      const recordId = idMap.get(row.canonical_record_id);
      if (!recordId) return [];
      const { canonical_record_id: _canonicalRecordId, ...readinessRow } = row;
      void _canonicalRecordId;
      return [{ ...readinessRow, object_id: recordId }];
    });

    const factsWritten = await store.upsertFacts(factRows);
    const readinessRowsWritten = await store.upsertReadiness(readinessRows);

    return {
      status: "written",
      recordsWritten: plan.records.length,
      factsWritten,
      readinessRowsWritten,
      skipped: plan.skipped,
    };
  } catch (error) {
    return {
      status: "failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
