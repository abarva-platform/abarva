// ─────────────────────────────────────────────────────────────────────────────
// Source fact write adapter — persist SourceEventFactInsert[] to source_event_facts.
//
// The DB-write half of the structured-map ingest route. It owns ONLY the physical
// insert; the route keeps auth, tenancy, flag-gating, and mapping. It mirrors the
// `sourceWriteAdapter` seam exactly: Supabase is the DEFAULT (`ABARVA_DATA_PLANE`
// unset / `supabase`); `azure-postgres` is opt-in for the pre-flip rehearsal and
// post-flip canonical path — never an implicit default, never dual-written.
//
// RLS scope: every row carries `client_key`; the Azure path runs the whole batch
// in one transaction (all-or-nothing) so a partial upload never lands half-written.
// The Supabase client has no client-side transaction, so it inserts the batch as a
// single `.insert([...])` array call (atomic at the statement level).
//
// The `source_event_facts` migration
// (supabase/migrations/20260706120000_source_event_facts.sql) MUST be run before
// this adapter can persist at runtime — until then the insert fails with a
// missing-relation error, which the route surfaces rather than swallowing.

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from "@/lib/data-plane/postgresCompat";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import {
  createTxSession,
  type TxSessionRunner,
} from "../read-adapters/azureSession";
import { resolveDataPlane } from "../read-adapters/resolveDataPlane";
import type { SourceEventFactInsert } from "@/lib/source/facts/fact-types";
import type { DataPlane } from "./types";

/** A generic write outcome — `ok:false` carries a human-readable message. */
export interface FactWriteOutcome<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

function ok<T>(data?: T): FactWriteOutcome<T> {
  return { ok: true, data };
}
function fail<T>(error: string): FactWriteOutcome<T> {
  return { ok: false, error };
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? "unknown");
}

/** How many rows the write persisted. */
export interface FactInsertResult {
  readonly inserted: number;
}

/** A source-fact write adapter for one physical data plane. */
export interface SourceFactWriteAdapter {
  readonly name: DataPlane;
  /**
   * Insert a batch of typed facts. All rows must share the same `client_key`
   * (the tenant scope); the adapter rejects a mixed-tenant batch rather than
   * write across tenants. An empty batch is a no-op success.
   */
  insertFacts(
    facts: readonly SourceEventFactInsert[],
  ): Promise<FactWriteOutcome<FactInsertResult>>;
}

/** Reject a batch that mixes tenants — defense-in-depth against a cross-tenant write. */
function assertSingleTenant(
  facts: readonly SourceEventFactInsert[],
): string | null {
  const keys = new Set(facts.map((f) => f.client_key));
  if (keys.size > 1) {
    return `mixed-tenant fact batch not allowed (client_keys: ${[...keys].join(", ")})`;
  }
  return null;
}

/** Shape one insert into the snake_case row the table expects. */
function toRow(fact: SourceEventFactInsert): Record<string, unknown> {
  return {
    source_event_id: fact.source_event_id,
    client_key: fact.client_key,
    fact_key: fact.fact_key,
    entity_kind: fact.entity_kind,
    entity_ref: fact.entity_ref,
    value_numeric: fact.value_numeric,
    value_text: fact.value_text,
    unit: fact.unit,
    source_method: fact.source_method,
    source_citation: fact.source_citation,
    confidence: fact.confidence,
    ...(fact.captured_at ? { captured_at: fact.captured_at } : {}),
    ...(fact.is_stale !== undefined ? { is_stale: fact.is_stale } : {}),
  };
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase source-fact write adapter. The batch is a single
 * `.insert([...])` so the rows land in one statement. The client factory is
 * injectable so tests drive it without a live backend.
 */
export function createSupabaseSourceFactWriteAdapter(
  getClient: SupabaseFactory = getAzureWriteFluentClient,
): SourceFactWriteAdapter {
  return {
    name: "supabase",
    async insertFacts(facts) {
      if (facts.length === 0) return ok({ inserted: 0 });
      const mixed = assertSingleTenant(facts);
      if (mixed) return fail(mixed);

      const { error } = await getClient()
        .from("source_event_facts")
        .insert(facts.map(toRow));
      if (error) return fail(error.message);
      return ok({ inserted: facts.length });
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres source-fact write adapter. The batch is inserted in
 * one transaction (all-or-nothing) so a partial upload never lands. The session
 * is injectable so tests drive it without a live Azure Postgres.
 */
export function createAzureSourceFactWriteAdapter(
  session: TxSessionRunner = createTxSession("abarva-data-plane-source-fact-write"),
): SourceFactWriteAdapter {
  return {
    name: "azure-postgres",
    async insertFacts(facts) {
      if (facts.length === 0) return ok({ inserted: 0 });
      const mixed = assertSingleTenant(facts);
      if (mixed) return fail(mixed);

      try {
        await session(async (run) => {
          for (const fact of facts) {
            await run(
              `INSERT INTO source_event_facts
                 (source_event_id, client_key, fact_key, entity_kind, entity_ref,
                  value_numeric, value_text, unit, source_method, source_citation,
                  confidence)
               VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)`,
              [
                fact.source_event_id,
                fact.client_key,
                fact.fact_key,
                fact.entity_kind,
                fact.entity_ref,
                fact.value_numeric,
                fact.value_text,
                fact.unit,
                fact.source_method,
                JSON.stringify(fact.source_citation ?? null),
                fact.confidence,
              ],
            );
          }
        });
        return ok({ inserted: facts.length });
      } catch (err) {
        return fail(errMessage(err));
      }
    },
  };
}

// --- selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseSourceFactWriteAdapter: SourceFactWriteAdapter =
  createSupabaseSourceFactWriteAdapter();
export const azureSourceFactWriteAdapter: SourceFactWriteAdapter =
  createAzureSourceFactWriteAdapter();

/**
 * Select the source-fact write adapter for the configured data plane. Defaults
 * to Supabase — production write behavior is unchanged. The optional `tenantKey`
 * is canonicalized as defense-in-depth (same as the source write seam); it does
 * not currently change selection but keeps call sites honest.
 */
export function selectSourceFactWriteAdapter(
  plane?: DataPlane,
  tenantKey?: string,
): SourceFactWriteAdapter {
  if (tenantKey) void canonicalTenantKey(tenantKey);
  const target = plane ?? resolveDataPlane();
  return target === "azure-postgres"
    ? azureSourceFactWriteAdapter
    : supabaseSourceFactWriteAdapter;
}
