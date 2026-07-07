// Programs read layer · Packet 13 §13.5.
// Every query scoped by client_id (tenancy) and applies archived/deleted
// exclusion. DB stays `engagements`.

import { azureRead } from "@/lib/data-plane/azureRead";
import {
  allowedProgramIdsForUser,
  canReadProgram,
} from "@/lib/auth/program-access-policy";
import {
  createSupabaseProgramsReadAdapter,
  selectProgramsReadAdapter,
} from "@/lib/data-plane/read-adapters/programsReadAdapter";
import type { PostgresCompatClient as SupabaseClient } from "@/lib/data-plane/postgresCompat";
import type {
  FounderApprovalRequestRow,
  MaestroFlag,
  ModuleStatus,
  OriginSource,
  OversightLevel,
  PhaseSnapshot,
  ProgramCore,
  ProgramLifecycleState,
  ProgramMilestoneRow,
  ProgramModuleRow,
  ProgramRiskRow,
  ProgramWorkItemRow,
  TenancyCtx,
} from "./types.db";
import type { ArchetypeKey } from "./types.ui";
import type { StrategicMove, StrategicMovePortfolio } from "./types.ui";
import { extractProjectedValueFromLegacyBaseline } from "./value-utils";
import { attachTemplateInstancesToPrograms } from "@/lib/templates/program-adapter";

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error("[programs/queries] TenancyCtx missing clientId or userId");
  }
}

interface EngagementRow {
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
  program_archetype: ArchetypeKey | null;
  origin_source: OriginSource | null;
  origin_source_ref: string | null;
  status: string | null;
  lifecycle_state: ProgramLifecycleState | null;
  current_phase: number | null;
  current_module_key: string | null;
  maestro_oversight_level: OversightLevel | null;
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
  // Origination charter: all 7 scaffold fields + classification + initiative context.
  // Written by submitOriginationBrief at P0 promote; null for legacy engagements.
  charter: Record<string, unknown> | null;
  // First-class function-identity columns — the Domain Function Pack key the
  // Move resolves to and its classification confidence. Promoted out of
  // `charter.functionPackKey`; `null` when no pack matched.
  function_pack_key: string | null;
  function_pack_confidence: number | null;
  // Formal gate-pass ledger updated by advance_phase. Used for gate completion
  // display and hard-gate enforcement.
  gates_passed: unknown[] | null;
}

function normalizeProgramName(value: unknown, fallbackId: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return `Untitled Strategic Move ${fallbackId.slice(0, 8)}`;
}

function rowToProgram(r: EngagementRow): ProgramCore {
  const legacyProjected = extractProjectedValueFromLegacyBaseline(
    r.baseline_metrics,
  );
  const projectedLow =
    r.value_projected_low_usd ?? legacyProjected?.low ?? null;
  const projectedHigh =
    r.value_projected_high_usd ?? legacyProjected?.high ?? null;
  return {
    id: r.id,
    clientId: r.client_id,
    name: normalizeProgramName(r.name, r.id),
    sponsorPersonId: r.sponsor_person_id,
    problemStatement: r.problem_statement,
    targetOutcome: r.target_outcome,
    timelineHorizon: r.timeline_horizon,
    valueProjectedLowUsd: projectedLow,
    valueProjectedHighUsd: projectedHigh,
    valueVerifiedUsd: r.value_verified_usd,
    valueVerifiedStatus: r.value_verified_status,
    valueCurrency: r.value_currency,
    valueAssumptions:
      r.value_assumptions_jsonb ??
      (legacyProjected
        ? {
            source: "legacy_baseline_metrics",
            backfilled_projected_range: legacyProjected,
          }
        : null),
    archetype: r.program_archetype,
    originSource: r.origin_source,
    originSourceRef: r.origin_source_ref,
    status: r.status,
    lifecycleState: r.lifecycle_state,
    currentPhase: r.current_phase,
    currentModuleKey: r.current_module_key,
    maestroOversightLevel: r.maestro_oversight_level,
    founderApprovalRequired: r.founder_approval_required ?? false,
    phaseLockedAt: r.phase_locked_at,
    phaseLockedByUserId: r.phase_locked_by_user_id,
    dataResidencyRegion: r.data_residency_region,
    retentionPolicyYears: r.retention_policy_years,
    archivedAt: r.archived_at,
    archivedBy: r.archived_by ?? null,
    archiveReason: r.archive_reason ?? null,
    archiveExplanation: r.archive_explanation ?? null,
    archivedFromState: r.archived_from_state ?? null,
    deletedAt: r.deleted_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    charter: r.charter ?? null,
    functionPackKey: r.function_pack_key ?? null,
    functionPackConfidence: r.function_pack_confidence ?? null,
    gatesPassed: Array.isArray(r.gates_passed) ? r.gates_passed : [],
  };
}

/**
 * Program portfolio for a client — excludes archived + soft-deleted.
 *
 * The engagements table read runs behind the data-plane seam
 * (`src/lib/data-plane/read-adapters/programsReadAdapter.ts`): `supabase` by
 * default, `azure-postgres` when `ABARVA_DATA_PLANE` opts in. RBAC scoping
 * (`allowedProgramIdsForUser`) and the `rowToProgram` view-model transform
 * stay here so access-policy logic is not duplicated across data planes.
 *
 * When `opts.supabase` is supplied (server components passing their own
 * client) the Supabase adapter is used directly, preserving that contract.
 */
export async function getProgramPortfolio(
  ctx: TenancyCtx,
  opts: {
    limit?: number;
    supabase?: SupabaseClient;
    /** Include archived rows alongside active ones. Default excludes them. */
    includeArchived?: boolean;
    /** Return ONLY archived rows. Overrides `includeArchived`. */
    archivedOnly?: boolean;
  } = {},
): Promise<ProgramCore[]> {
  assertTenancy(ctx);
  const limit = opts.limit ?? 100;
  const allowedProgramIds = await allowedProgramIdsForUser(ctx);
  if (allowedProgramIds && allowedProgramIds.length === 0) return [];
  const adapter = opts.supabase
    ? createSupabaseProgramsReadAdapter(() => opts.supabase as SupabaseClient)
    : selectProgramsReadAdapter();
  const archiveFilter: "active" | "all" | "archived" = opts.archivedOnly
    ? "archived"
    : opts.includeArchived
      ? "all"
      : "active";
  const rows = await adapter.getProgramPortfolioRows({
    clientId: ctx.clientId,
    allowedProgramIds,
    limit,
    archiveFilter,
  });
  const programs = (rows as unknown as EngagementRow[]).map(rowToProgram);
  return attachTemplateInstancesToPrograms(ctx, programs);
}

/**
 * Single program by id — tenancy-scoped, RBAC-gated.
 *
 * The engagements-table read runs behind the data-plane seam
 * (`src/lib/data-plane/read-adapters/programsReadAdapter.ts`): `supabase` by
 * default, `azure-postgres` when `ABARVA_DATA_PLANE` opts in. RBAC
 * (`canReadProgram`) and the `rowToProgram` view-model transform stay here so
 * access-policy logic is not duplicated across data planes.
 *
 * When `opts.supabase` is supplied (server components passing their own
 * client) the Supabase adapter is used directly, preserving that contract.
 */
export async function getProgramById(
  ctx: TenancyCtx,
  programId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<ProgramCore | null> {
  assertTenancy(ctx);
  if (!(await canReadProgram(ctx, programId))) return null;
  const adapter = opts.supabase
    ? createSupabaseProgramsReadAdapter(() => opts.supabase as SupabaseClient)
    : selectProgramsReadAdapter();
  const row = await adapter.getProgramByIdRow(programId, ctx.clientId);
  if (!row) return null;
  const [program] = await attachTemplateInstancesToPrograms(ctx, [
    rowToProgram(row as unknown as EngagementRow),
  ]);
  return program ?? null;
}

async function assertProgramReadable(
  ctx: TenancyCtx,
  programId: string,
): Promise<void> {
  if (!(await canReadProgram(ctx, programId))) {
    throw new Error(`[programs/queries] program ${programId} not accessible`);
  }
}

async function readRowsWithOptionalSupabase<R extends Record<string, unknown>>(
  opts: { supabase?: SupabaseClient },
  buildSupabase: (
    sb: SupabaseClient,
  ) => PromiseLike<{ data: unknown; error: unknown }>,
  azureSql: string,
  azureParams: readonly unknown[],
): Promise<R[]> {
  if (opts.supabase) {
    const { data, error } = await buildSupabase(opts.supabase);
    if (error) throw error;
    return (data as R[] | null) ?? [];
  }
  return azureRead.query<R>(azureSql, azureParams, { missingTable: "throw" });
}

export async function getModuleState(
  ctx: TenancyCtx,
  programId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<ProgramModuleRow[]> {
  assertTenancy(ctx);
  await assertProgramReadable(ctx, programId);
  const rows = await readRowsWithOptionalSupabase<Record<string, unknown>>(
    opts,
    (sb) =>
      sb
        .from("program_modules")
        .select("*")
        .eq("engagement_id", programId)
        .order("phase_number", { ascending: true })
        .order("module_order", { ascending: true, nullsFirst: false }),
    "SELECT * FROM program_modules WHERE engagement_id = $1 ORDER BY phase_number ASC, module_order ASC NULLS LAST",
    [programId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    moduleKey: r.module_key as string,
    moduleName: r.module_name as string,
    phaseNumber: r.phase_number as number,
    moduleOrder: (r.module_order as number | null) ?? null,
    status: r.status as ModuleStatus,
    state: (r.state_jsonb as Record<string, unknown>) ?? {},
    assignedUserId: (r.assigned_user_id as string | null) ?? null,
    startedAt: (r.started_at as string | null) ?? null,
    completedAt: (r.completed_at as string | null) ?? null,
  }));
}

export async function getWorkItems(
  ctx: TenancyCtx,
  programId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<ProgramWorkItemRow[]> {
  assertTenancy(ctx);
  await assertProgramReadable(ctx, programId);
  const rows = await readRowsWithOptionalSupabase<Record<string, unknown>>(
    opts,
    (sb) =>
      sb
        .from("program_work_items")
        .select("*")
        .eq("engagement_id", programId)
        .order("created_at", { ascending: false }),
    "SELECT * FROM program_work_items WHERE engagement_id = $1 ORDER BY created_at DESC",
    [programId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    parentId: (r.parent_id as string | null) ?? null,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    itemType: r.item_type as ProgramWorkItemRow["itemType"],
    status: r.status as ProgramWorkItemRow["status"],
    priority: (r.priority as ProgramWorkItemRow["priority"]) ?? null,
    assignedUserId: (r.assigned_user_id as string | null) ?? null,
    moduleKey: (r.module_key as string | null) ?? null,
    phaseNumber: (r.phase_number as number | null) ?? null,
    dueDate: (r.due_date as string | null) ?? null,
    completedAt: (r.completed_at as string | null) ?? null,
    metadata: (r.metadata_jsonb as Record<string, unknown>) ?? {},
  }));
}

export async function getMilestones(
  ctx: TenancyCtx,
  programId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<ProgramMilestoneRow[]> {
  assertTenancy(ctx);
  await assertProgramReadable(ctx, programId);
  const rows = await readRowsWithOptionalSupabase<Record<string, unknown>>(
    opts,
    (sb) =>
      sb
        .from("program_milestones")
        .select("*")
        .eq("engagement_id", programId)
        .order("target_date", { ascending: true, nullsFirst: false }),
    "SELECT * FROM program_milestones WHERE engagement_id = $1 ORDER BY target_date ASC NULLS LAST",
    [programId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    targetDate: (r.target_date as string | null) ?? null,
    actualDate: (r.actual_date as string | null) ?? null,
    status: r.status as ProgramMilestoneRow["status"],
    phaseNumber: (r.phase_number as number | null) ?? null,
    moduleKey: (r.module_key as string | null) ?? null,
    ownerUserId: (r.owner_user_id as string | null) ?? null,
  }));
}

export async function getRisks(
  ctx: TenancyCtx,
  programId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<ProgramRiskRow[]> {
  assertTenancy(ctx);
  await assertProgramReadable(ctx, programId);
  const rows = await readRowsWithOptionalSupabase<Record<string, unknown>>(
    opts,
    (sb) =>
      sb
        .from("program_risks")
        .select("*")
        .eq("engagement_id", programId)
        .order("identified_at", { ascending: false }),
    "SELECT * FROM program_risks WHERE engagement_id = $1 ORDER BY identified_at DESC",
    [programId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    likelihood: r.likelihood as ProgramRiskRow["likelihood"],
    impact: r.impact as ProgramRiskRow["impact"],
    status: r.status as ProgramRiskRow["status"],
    mitigationPlan: (r.mitigation_plan as string | null) ?? null,
    ownerUserId: (r.owner_user_id as string | null) ?? null,
    phaseNumber: (r.phase_number as number | null) ?? null,
    moduleKey: (r.module_key as string | null) ?? null,
    identifiedAt: r.identified_at as string,
    closedAt: (r.closed_at as string | null) ?? null,
  }));
}

export async function getOpenMaestroFlags(
  ctx: TenancyCtx,
  programId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<MaestroFlag[]> {
  assertTenancy(ctx);
  await assertProgramReadable(ctx, programId);
  const rows = await readRowsWithOptionalSupabase<Record<string, unknown>>(
    opts,
    (sb) =>
      sb
        .from("maestro_oversight_flags")
        .select("*")
        .eq("engagement_id", programId)
        .is("resolved_at", null)
        .order("created_at", { ascending: false }),
    "SELECT * FROM maestro_oversight_flags WHERE engagement_id = $1 AND resolved_at IS NULL ORDER BY created_at DESC",
    [programId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    flagType: r.flag_type as MaestroFlag["flagType"],
    severity: r.severity as MaestroFlag["severity"],
    raisedBy: r.raised_by as MaestroFlag["raisedBy"],
    raisedByUserId: (r.raised_by_user_id as string | null) ?? null,
    headline: r.headline as string,
    context: (r.context_jsonb as Record<string, unknown>) ?? {},
    resolvedAt: (r.resolved_at as string | null) ?? null,
    resolvedByUserId: (r.resolved_by_user_id as string | null) ?? null,
    resolutionNotes: (r.resolution_notes as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function getPendingApprovals(
  ctx: TenancyCtx,
  programId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<FounderApprovalRequestRow[]> {
  assertTenancy(ctx);
  await assertProgramReadable(ctx, programId);
  const rows = await readRowsWithOptionalSupabase<Record<string, unknown>>(
    opts,
    (sb) =>
      sb
        .from("founder_approval_requests")
        .select("*")
        .eq("engagement_id", programId)
        .eq("status", "pending")
        .order("deadline_at", { ascending: true, nullsFirst: false }),
    "SELECT * FROM founder_approval_requests WHERE engagement_id = $1 AND status = 'pending' ORDER BY deadline_at ASC NULLS LAST",
    [programId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    requestType: r.request_type as FounderApprovalRequestRow["requestType"],
    status: r.status as FounderApprovalRequestRow["status"],
    requestedByUserId: r.requested_by_user_id as string,
    approverUserId: (r.approver_user_id as string | null) ?? null,
    approverRole: (r.approver_role as string | null) ?? null,
    headline: r.headline as string,
    context: (r.context_jsonb as Record<string, unknown>) ?? {},
    decisionNotes: (r.decision_notes as string | null) ?? null,
    deadlineAt: (r.deadline_at as string | null) ?? null,
    decidedAt: (r.decided_at as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function getPhaseSnapshots(
  ctx: TenancyCtx,
  programId: string,
  phaseNumber?: number,
): Promise<PhaseSnapshot[]> {
  assertTenancy(ctx);
  await assertProgramReadable(ctx, programId);
  const params: unknown[] = [programId];
  const phaseFilter =
    phaseNumber !== undefined
      ? ` AND phase_number = $${params.push(phaseNumber)}`
      : "";
  const rows = await azureRead.query<Record<string, unknown>>(
    `SELECT * FROM phase_snapshots WHERE engagement_id = $1${phaseFilter} ORDER BY created_at DESC`,
    params,
    { missingTable: "throw" },
  );
  return rows.map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    phaseNumber: r.phase_number as number,
    phaseName: (r.phase_name as string | null) ?? null,
    snapshot: (r.snapshot_jsonb as Record<string, unknown>) ?? {},
    lockedByUserId: (r.locked_by_user_id as string | null) ?? null,
    lockedAt: (r.locked_at as string | null) ?? null,
    approvalStatus: r.approval_status as PhaseSnapshot["approvalStatus"],
    createdAt: r.created_at as string,
  }));
}

export async function getStrategicMovePortfolio(
  ctx: TenancyCtx,
  opts: {
    limit?: number;
    supabase?: SupabaseClient;
    includeArchived?: boolean;
    archivedOnly?: boolean;
  } = {},
): Promise<StrategicMovePortfolio> {
  const programs = await getProgramPortfolio(ctx, opts);
  const { buildStrategicMovePortfolio } = await import("./transformers");
  return buildStrategicMovePortfolio(ctx, programs, opts);
}

export async function getStrategicMoveById(
  ctx: TenancyCtx,
  moveId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<StrategicMove | null> {
  const program = await getProgramById(ctx, moveId, opts);
  if (!program) return null;
  const { buildStrategicMove } = await import("./transformers");
  return buildStrategicMove(ctx, program, opts);
}
