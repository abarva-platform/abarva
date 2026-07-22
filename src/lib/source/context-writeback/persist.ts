import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";
import type { SourceEventFactRow } from "@/lib/source/facts/fact-types";
import { buildSourceContextWritebackPlan } from "./build-writeback";
import {
  SOURCE_CONTEXT_FACTS_TABLE,
  SOURCE_CONTEXT_READINESS_TABLE,
  SOURCE_CONTEXT_TABLE,
  type SourceContextWritebackEvent,
  type SourceContextWritebackResult,
  type SourceEnterpriseContextFactRow,
  type SourceEnterpriseContextRecordRow,
  type SourceGovernedReadinessDraft,
} from "./types";

type DbResult<T> = { data: T | null; error: { message: string } | null };

async function throwOnError<T>(
  label: string,
  result: DbResult<T>,
): Promise<T | null> {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

export interface SourceContextWritebackStore {
  upsertRecords(
    rows: readonly SourceEnterpriseContextRecordRow[],
  ): Promise<Map<string, string>>;
  upsertFacts(rows: readonly SourceEnterpriseContextFactRow[]): Promise<number>;
  upsertReadiness(
    rows: readonly SourceGovernedReadinessDraft[],
  ): Promise<number>;
}

function azureSourceContextWritebackStore(
  db: PostgresCompatClient = getAzureWriteFluentClient(),
): SourceContextWritebackStore {
  return {
    async upsertRecords(rows) {
      if (rows.length === 0) return new Map();
      for (let index = 0; index < rows.length; index += 100) {
        await throwOnError(
          "enterprise_context_records upsert",
          await db
            .from(SOURCE_CONTEXT_TABLE)
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
            .from(SOURCE_CONTEXT_TABLE)
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
            .from(SOURCE_CONTEXT_FACTS_TABLE)
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
            .from(SOURCE_CONTEXT_READINESS_TABLE)
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

export async function writeSourceFactsToEnterpriseContext(
  input: {
    readonly event: SourceContextWritebackEvent;
    readonly facts: readonly SourceEventFactRow[];
    readonly committedAt?: string;
  },
  store: SourceContextWritebackStore = azureSourceContextWritebackStore(),
): Promise<SourceContextWritebackResult> {
  const plan = buildSourceContextWritebackPlan({
    event: input.event,
    facts: input.facts,
    committedAt: input.committedAt ?? new Date().toISOString(),
  });

  if (plan.records.length === 0) {
    return {
      status: "skipped",
      reason: "no_eligible_facts",
      skippedFacts: plan.skippedFacts,
    };
  }

  try {
    const idMap = await store.upsertRecords(plan.records);
    const factRows: SourceEnterpriseContextFactRow[] = plan.factDrafts.flatMap(
      (fact) => {
        const recordId = idMap.get(fact.canonical_record_id);
        if (!recordId) return [];
        const { canonical_record_id: _canonicalRecordId, ...row } = fact;
        void _canonicalRecordId;
        return [{ ...row, record_id: recordId }];
      },
    );
    const readinessRows = plan.readinessDrafts.flatMap((row) => {
      const recordId = idMap.get(row.canonical_record_id);
      if (!recordId) return [];
      return [{ ...row, object_id: recordId }];
    });

    const factsWritten = await store.upsertFacts(factRows);
    const readinessRowsWritten = await store.upsertReadiness(readinessRows);

    return {
      status: "written",
      recordsWritten: plan.records.length,
      factsWritten,
      readinessRowsWritten,
      skippedFacts: plan.skippedFacts,
    };
  } catch (error) {
    return {
      status: "failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
