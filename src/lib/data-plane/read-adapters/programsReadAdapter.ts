// Programs portfolio read adapter (Slice 2).
//
// Backs the read path of `GET /api/v1/programs`. The adapter owns ONLY the
// physical engagements-table read; RBAC scoping (`allowedProgramIdsForUser`)
// and the `rowToProgram` view-model transform stay route/lib-side so the
// access-policy logic is not duplicated across data planes.
//
// The contract is intentionally narrow: given a `clientId`, an optional
// allowlist of program ids, and a row limit, return the raw engagement rows
// in the exact column order `getProgramPortfolio` selected before the seam.
//
// Selected by the same `ABARVA_DATA_PLANE` switch as Slice 1
// (`supabase` default, `azure-postgres` opt-in).

import {
  getAzureReadFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from "@/lib/data-plane/postgresCompat";
import { createDefaultSession, type SessionRunner } from "./azureSession";
import { resolveDataPlane } from "./resolveDataPlane";
import type { DataPlane } from "./types";

/**
 * Raw engagement row as stored — snake_case, untransformed. Mirrors the
 * `EngagementRow` shape in `src/lib/programs/queries.ts` field-for-field so
 * the route's existing `rowToProgram` transformer consumes it unchanged.
 */
export interface EngagementPortfolioRow {
  id: string;
  client_id: string;
  name: string;
  sponsor_person_id: string | null;
  problem_statement: string | null;
  target_outcome: string | null;
  timeline_horizon: string | null;
  value_projected_low_usd: number | null;
  value_projected_high_usd: number | null;
  value_verified_usd: number | null;
  value_verified_status: "pending" | "tracked" | "final" | null;
  value_currency: string | null;
  value_assumptions_jsonb: Record<string, unknown> | null;
  baseline_metrics: Record<string, unknown> | null;
  program_archetype: string | null;
  origin_source: string | null;
  origin_source_ref: string | null;
  status: string | null;
  lifecycle_state: string | null;
  current_phase: number | null;
  current_module_key: string | null;
  maestro_oversight_level: string | null;
  founder_approval_required: boolean | null;
  phase_locked_at: string | null;
  phase_locked_by_user_id: string | null;
  data_residency_region: string | null;
  retention_policy_years: number | null;
  archived_at: string | null;
  archived_by: string | null;
  archive_reason: string | null;
  archive_explanation: string | null;
  archived_from_state: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
  charter: Record<string, unknown> | null;
  function_pack_key: string | null;
  function_pack_confidence: number | null;
  gates_passed: unknown[] | null;
}

/** Query inputs for a single portfolio read. */
export interface PortfolioQuery {
  /** Tenant client id — every row is scoped to this. */
  clientId: string;
  /**
   * RBAC allowlist resolved route-side. `null` = no per-program restriction
   * (caller may read all of the client's programs). A non-null empty array
   * means the caller may read none — adapters MUST return `[]` without a
   * query in that case.
   */
  allowedProgramIds: string[] | null;
  /** Max rows to return. */
  limit: number;
  /**
   * Archive-state filter for the read (Manage Moves):
   *   - 'active' (default) — exclude archived rows (`lifecycle_state <>
   *     'archived'` AND `archived_at IS NULL`). This is the pre-seam behavior.
   *   - 'all' — include archived rows alongside active ones.
   *   - 'archived' — return ONLY archived rows (`lifecycle_state = 'archived'`).
   * Soft-deleted rows (`deleted_at IS NOT NULL`) are always excluded.
   */
  archiveFilter?: "active" | "all" | "archived";
}

/** A programs portfolio read adapter for one physical data plane. */
export interface ProgramsReadAdapter {
  readonly name: DataPlane;
  /**
   * Return engagement rows for the client, newest first, excluding archived
   * and soft-deleted records. Throws on a genuine query error (the route
   * already wraps this in a 500 handler) — same failure semantics as the
   * pre-seam `getProgramPortfolio`.
   */
  getProgramPortfolioRows(
    query: PortfolioQuery,
  ): Promise<EngagementPortfolioRow[]>;
  /**
   * Return the single engagement row for `programId` scoped to `clientId`,
   * or `null` when no such row exists. The pre-seam `getProgramById` used
   * `.maybeSingle()` (no archived/deleted exclusion — a caller may inspect a
   * soft-deleted program by id), so this read mirrors that: tenancy filter
   * only. RBAC (`canReadProgram`) stays caller-side. Throws on a genuine
   * query error — same failure semantics as the pre-seam helper.
   */
  getProgramByIdRow(
    programId: string,
    clientId: string,
  ): Promise<EngagementPortfolioRow | null>;
}

/** The engagements column projection — identical to the pre-seam select. */
const ENGAGEMENT_COLUMNS =
  "id, client_id, name, sponsor_person_id, problem_statement, target_outcome, " +
  "timeline_horizon, value_projected_low_usd, value_projected_high_usd, " +
  "value_verified_usd, value_verified_status, value_currency, " +
  "value_assumptions_jsonb, baseline_metrics, program_archetype, origin_source, " +
  "origin_source_ref, status, lifecycle_state, current_phase, " +
  "current_module_key, maestro_oversight_level, founder_approval_required, " +
  "phase_locked_at, phase_locked_by_user_id, data_residency_region, " +
  "retention_policy_years, archived_at, archived_by, archive_reason, " +
  "archive_explanation, archived_from_state, deleted_at, created_at, updated_at, " +
  "charter, function_pack_key, function_pack_confidence, gates_passed";

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase programs adapter. Query logic lifted verbatim from
 * `getProgramPortfolio` so the response is byte-identical to the pre-seam
 * path.
 */
export function createSupabaseProgramsReadAdapter(
  getClient: SupabaseFactory = getAzureReadFluentClient,
): ProgramsReadAdapter {
  return {
    name: "supabase",
    async getProgramPortfolioRows({
      clientId,
      allowedProgramIds,
      limit,
      archiveFilter = "active",
    }) {
      if (allowedProgramIds && allowedProgramIds.length === 0) return [];
      const sb = getClient();
      let query = sb
        .from("engagements")
        .select(ENGAGEMENT_COLUMNS)
        .eq("client_id", clientId)
        .is("deleted_at", null);
      if (archiveFilter === "active") {
        // Pre-seam behavior: exclude archived rows via `archived_at IS NULL`.
        // The archive route always stamps `archived_at` when it sets
        // lifecycle_state='archived', so this single predicate is sufficient
        // and (unlike a `lifecycle_state <> 'archived'` guard) does not drop
        // legacy rows whose lifecycle_state is NULL.
        query = query.is("archived_at", null);
      } else if (archiveFilter === "archived") {
        query = query.eq("lifecycle_state", "archived");
      }
      // 'all' applies no archive predicate.
      query = query.order("created_at", { ascending: false });
      if (allowedProgramIds) {
        query = query.in("id", allowedProgramIds);
      }
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return (data as unknown as EngagementPortfolioRow[] | null) ?? [];
    },
    async getProgramByIdRow(programId, clientId) {
      const sb = getClient();
      const { data, error } = await sb
        .from("engagements")
        .select(ENGAGEMENT_COLUMNS)
        .eq("id", programId)
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as EngagementPortfolioRow | null) ?? null;
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres programs adapter. Mirrors the Supabase query
 * semantics row-for-row. The session runner is injectable so tests drive it
 * with an in-memory fake.
 */
export function createAzureProgramsReadAdapter(
  session: SessionRunner = createDefaultSession("abarva-data-plane-programs"),
): ProgramsReadAdapter {
  return {
    name: "azure-postgres",
    async getProgramPortfolioRows({
      clientId,
      allowedProgramIds,
      limit,
      archiveFilter = "active",
    }) {
      if (allowedProgramIds && allowedProgramIds.length === 0) return [];
      return session(async (run) => {
        const params: unknown[] = [clientId];
        let sql =
          `SELECT ${ENGAGEMENT_COLUMNS} FROM engagements ` +
          "WHERE client_id = $1 AND deleted_at IS NULL";
        if (archiveFilter === "active") {
          sql += " AND archived_at IS NULL";
        } else if (archiveFilter === "archived") {
          sql += " AND lifecycle_state = 'archived'";
        }
        if (allowedProgramIds) {
          params.push(allowedProgramIds);
          sql += ` AND id = ANY($${params.length}::text[])`;
        }
        params.push(limit);
        sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
        return run<EngagementPortfolioRow>(sql, params);
      });
    },
    async getProgramByIdRow(programId, clientId) {
      return session(async (run) => {
        const rows = await run<EngagementPortfolioRow>(
          `SELECT ${ENGAGEMENT_COLUMNS} FROM engagements ` +
            "WHERE id = $1 AND client_id = $2 LIMIT 1",
          [programId, clientId],
        );
        return rows[0] ?? null;
      });
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseProgramsReadAdapter: ProgramsReadAdapter =
  createSupabaseProgramsReadAdapter();
export const azureProgramsReadAdapter: ProgramsReadAdapter =
  createAzureProgramsReadAdapter();

/** Select the programs read adapter for the configured data plane. */
export function selectProgramsReadAdapter(
  plane?: DataPlane,
): ProgramsReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === "azure-postgres"
    ? azureProgramsReadAdapter
    : supabaseProgramsReadAdapter;
}
