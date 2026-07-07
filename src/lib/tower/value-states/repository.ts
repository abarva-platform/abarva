import "server-only";

import type { PoolClient } from "pg";
import { azureRead } from "@/lib/data-plane/azureRead";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { buildTowerAiOpsCostLedgerFromValueLayers } from "@/lib/tower/ai-ops-cost-ledger";
import {
  buildLayerState,
  buildProjectedAndTrackedCells,
  normalizeCell,
  sumLayerHours,
  sumLayerUsd,
  type TowerValueTelemetry,
} from "./calculations";
import { firstRow, toRecord, withValueStateTransaction } from "./db";
import {
  VALUE_LAYER_DEFINITIONS,
  VALUE_STATE_LAYERS,
  type TowerMoveValueDetail,
  type TowerPortfolioArrow,
  type TowerPortfolioMove,
  type TowerPortfolioValueRollup,
  type ValueLayerState,
  type ValueStateCell,
  type ValueStateLayer,
} from "./types";

type MoveRow = {
  id: string;
  name: string;
  status: string | null;
  lifecycle_state: string | null;
  current_phase: number | null;
  current_gate: string | null;
  template_kind: "Move" | "SourceWorkflow" | null;
  template_slug: string | null;
  template_name: string | null;
};

type ValueStateRow = {
  id: string;
  layer_type: ValueStateLayer;
  projected_jsonb: unknown;
  tracked_jsonb: unknown;
  verified_jsonb: unknown;
  updated_at: string | null;
};

type PortfolioMoveRow = MoveRow & {
  projected_usd: string | number | null;
  tracked_usd: string | number | null;
  verified_usd: string | number | null;
};

type ArrowRow = {
  id: string;
  from_move_id: string;
  from_move_name: string;
  to_move_id: string;
  to_move_name: string;
  relation_type: string;
  note: string | null;
};

const PORTFOLIO_ROWS_SQL = `
      SELECT
        e.id,
        e.name,
        e.status,
        e.lifecycle_state,
        e.current_phase,
        mi.current_gate,
        mt.kind AS template_kind,
        mt.slug AS template_slug,
        mt.name AS template_name,
        COALESCE((vs.projected_jsonb->>'value')::numeric, e.value_projected_high_usd, e.value_projected_low_usd, 0)::text AS projected_usd,
        COALESCE((vs.tracked_jsonb->>'value')::numeric, 0)::text AS tracked_usd,
        COALESCE((vs.verified_jsonb->>'value')::numeric, e.value_verified_usd, 0)::text AS verified_usd
      FROM public.engagements e
      LEFT JOIN public.move_instances mi
        ON mi.engagement_id = e.id
       AND mi.client_id = e.client_id
      LEFT JOIN public.move_templates mt
        ON mt.id = mi.template_id
      LEFT JOIN public.value_states vs
        ON vs.client_id = e.client_id
       AND vs.move_id = e.id
       AND vs.layer_type = 'realized_value_usd'
       AND vs.deleted_at IS NULL
      WHERE e.client_id = $1
        AND e.deleted_at IS NULL
        AND COALESCE(e.status, 'active') NOT IN ('archived', 'deleted', 'retired')
      ORDER BY mt.kind NULLS LAST, e.name ASC
    `;

const SOURCE_PROJECTED_USD_SQL = `
        SELECT COALESCE(SUM(svl.projected_amount), 0)::text AS projected_usd
        FROM public.source_value_lines svl
        JOIN public.engagements e ON e.id = svl.program_id
        WHERE e.client_id = $1
          AND e.deleted_at IS NULL
          AND svl.value_unit = 'usd'
      `;

function p10ArrowsSql(hasMoveFilter: boolean): string {
  return `
      SELECT
        md.id,
        md.from_move_id,
        from_move.name AS from_move_name,
        md.to_move_id,
        to_move.name AS to_move_name,
        md.relation_type::text,
        md.note
      FROM public.move_dependencies md
      JOIN public.engagements from_move ON from_move.id = md.from_move_id
      JOIN public.engagements to_move ON to_move.id = md.to_move_id
      WHERE md.client_id = $1
        AND md.deleted_at IS NULL
        ${hasMoveFilter ? "AND (md.from_move_id = ANY($2::uuid[]) OR md.to_move_id = ANY($2::uuid[]))" : ""}
      ORDER BY from_move.name ASC, to_move.name ASC
    `;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isUuid(value: string | null | undefined): boolean {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    ),
  );
}

export function canAttestTowerValue(
  ctx: Pick<TenancyCtx, "role" | "email">,
): boolean {
  const role = (ctx.role ?? "").toLowerCase();
  const email = (ctx.email ?? "").toLowerCase();
  return (
    [
      "cfo",
      "finance",
      "finance_admin",
      "client_admin",
      "tenant_admin",
      "admin",
      "maestro",
    ].includes(role) || email.includes("cfo")
  );
}

function clientKeyForAudit(ctx: TenancyCtx): string {
  return ctx.clientKey?.trim() || ctx.clientId;
}

async function getMove(
  client: PoolClient,
  clientId: string,
  moveId: string,
): Promise<MoveRow | null> {
  return firstRow(
    (
      await client.query<MoveRow>(
        `
      SELECT
        e.id,
        e.name,
        e.status,
        e.lifecycle_state,
        e.current_phase,
        mi.current_gate,
        mt.kind AS template_kind,
        mt.slug AS template_slug,
        mt.name AS template_name
      FROM public.engagements e
      LEFT JOIN public.move_instances mi
        ON mi.engagement_id = e.id
       AND mi.client_id = e.client_id
      LEFT JOIN public.move_templates mt
        ON mt.id = mi.template_id
      WHERE e.client_id = $1
        AND e.id = $2
        AND e.deleted_at IS NULL
      LIMIT 1
    `,
        [clientId, moveId],
      )
    ).rows,
  );
}

async function getTelemetry(
  client: PoolClient,
  clientId: string,
  moveId: string,
): Promise<TowerValueTelemetry> {
  const [app, roles, dora, tools, discovery, kill] = await Promise.all([
    client.query<{
      application_count: string;
      modern_app_count: string;
      legacy_app_count: string;
      annual_run_cost_usd: string | null;
      ai_fit_avg: string | null;
    }>(
      `
        SELECT
          COUNT(*)::text AS application_count,
          COUNT(*) FILTER (WHERE is_modern)::text AS modern_app_count,
          COUNT(*) FILTER (WHERE NOT is_modern)::text AS legacy_app_count,
          COALESCE(SUM(annual_run_cost_usd), 0)::text AS annual_run_cost_usd,
          COALESCE(AVG(ai_fit_score), 0)::text AS ai_fit_avg
        FROM public.application_portfolio
        WHERE client_id = $1
          AND deleted_at IS NULL
      `,
      [clientId],
    ),
    client.query<{ engineering_fte: string | null }>(
      `
        SELECT COALESCE(SUM(fte_count), 0)::text AS engineering_fte
        FROM public.roles_inventory
        WHERE client_id = $1
          AND deleted_at IS NULL
          AND (
            function_area ILIKE '%engineer%'
            OR function_area ILIKE '%technology%'
            OR title ILIKE '%engineer%'
            OR title ILIKE '%developer%'
            OR title ILIKE '%platform%'
          )
      `,
      [clientId],
    ),
    client.query<{
      dora_sample_count: string;
      deploy_freq_per_week_avg: string | null;
      lead_time_hours_avg: string | null;
      mttr_hours_avg: string | null;
      change_failure_rate_pct_avg: string | null;
      reliability_pct_avg: string | null;
    }>(
      `
        SELECT
          COUNT(*)::text AS dora_sample_count,
          COALESCE(AVG(deploy_freq_per_week), 0)::text AS deploy_freq_per_week_avg,
          COALESCE(AVG(lead_time_hours), 0)::text AS lead_time_hours_avg,
          COALESCE(AVG(mttr_hours), 0)::text AS mttr_hours_avg,
          COALESCE(AVG(change_failure_rate_pct), 0)::text AS change_failure_rate_pct_avg,
          COALESCE(AVG(reliability_pct), 0)::text AS reliability_pct_avg
        FROM public.dora_baselines
        WHERE client_id = $1
          AND deleted_at IS NULL
      `,
      [clientId],
    ),
    client.query<{
      licensed_seats: string | null;
      activated_seats: string | null;
      dau: string | null;
      mau: string | null;
      annual_ai_tool_cost_usd: string | null;
    }>(
      `
        SELECT
          COALESCE(SUM(licensed_seats), 0)::text AS licensed_seats,
          COALESCE(SUM(activated_seats), 0)::text AS activated_seats,
          COALESCE(SUM(dau), 0)::text AS dau,
          COALESCE(SUM(mau), 0)::text AS mau,
          COALESCE(SUM(annual_cost_usd), 0)::text AS annual_ai_tool_cost_usd
        FROM public.ai_tool_footprint
        WHERE client_id = $1
          AND deleted_at IS NULL
      `,
      [clientId],
    ),
    client.query<{
      instrument_count: string;
      completed_count: string;
    }>(
      `
        SELECT
          COUNT(*)::text AS instrument_count,
          COUNT(*) FILTER (WHERE status = 'complete')::text AS completed_count
        FROM public.discovery_instruments
        WHERE client_id = $1
          AND move_id = $2
          AND deleted_at IS NULL
      `,
      [clientId, moveId],
    ),
    client.query<{
      total: string;
      pass: string;
      watch: string;
      fail: string;
      waived: string;
      not_evaluated: string;
    }>(
      `
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE status = 'pass')::text AS pass,
          COUNT(*) FILTER (WHERE status = 'watch')::text AS watch,
          COUNT(*) FILTER (WHERE status = 'fail')::text AS fail,
          COUNT(*) FILTER (WHERE status = 'waived')::text AS waived,
          COUNT(*) FILTER (WHERE status = 'not_evaluated')::text AS not_evaluated
        FROM public.kill_criteria
        WHERE client_id = $1
          AND move_id = $2
          AND deleted_at IS NULL
      `,
      [clientId, moveId],
    ),
  ]);

  const appRow = firstRow(app.rows);
  const roleRow = firstRow(roles.rows);
  const doraRow = firstRow(dora.rows);
  const toolRow = firstRow(tools.rows);
  const discoveryRow = firstRow(discovery.rows);
  const killRow = firstRow(kill.rows);

  return {
    applicationCount: asNumber(appRow?.application_count),
    modernAppCount: asNumber(appRow?.modern_app_count),
    legacyAppCount: asNumber(appRow?.legacy_app_count),
    annualRunCostUsd: asNumber(appRow?.annual_run_cost_usd),
    aiFitAvg: asNumber(appRow?.ai_fit_avg),
    engineeringFte: asNumber(roleRow?.engineering_fte),
    doraSampleCount: asNumber(doraRow?.dora_sample_count),
    deployFreqPerWeekAvg: asNumber(doraRow?.deploy_freq_per_week_avg),
    leadTimeHoursAvg: asNumber(doraRow?.lead_time_hours_avg),
    mttrHoursAvg: asNumber(doraRow?.mttr_hours_avg),
    changeFailureRatePctAvg: asNumber(doraRow?.change_failure_rate_pct_avg),
    reliabilityPctAvg: asNumber(doraRow?.reliability_pct_avg),
    licensedSeats: asNumber(toolRow?.licensed_seats),
    activatedSeats: asNumber(toolRow?.activated_seats),
    dau: asNumber(toolRow?.dau),
    mau: asNumber(toolRow?.mau),
    annualAiToolCostUsd: asNumber(toolRow?.annual_ai_tool_cost_usd),
    discoveryInstrumentCount: asNumber(discoveryRow?.instrument_count),
    completedDiscoveryInstrumentCount: asNumber(discoveryRow?.completed_count),
    killCriteria: {
      total: asNumber(killRow?.total),
      pass: asNumber(killRow?.pass),
      watch: asNumber(killRow?.watch),
      fail: asNumber(killRow?.fail),
      waived: asNumber(killRow?.waived),
      notEvaluated: asNumber(killRow?.not_evaluated),
    },
  };
}

async function getValueRows(
  client: PoolClient,
  clientId: string,
  moveId: string,
): Promise<ValueStateRow[]> {
  return (
    await client.query<ValueStateRow>(
      `
      SELECT id, layer_type, projected_jsonb, tracked_jsonb, verified_jsonb, updated_at
      FROM public.value_states
      WHERE client_id = $1
        AND move_id = $2
        AND deleted_at IS NULL
      ORDER BY array_position($3::value_state_layer_type[], layer_type)
    `,
      [clientId, moveId, VALUE_STATE_LAYERS],
    )
  ).rows;
}

async function upsertProjectedTrackedRows(
  client: PoolClient,
  ctx: TenancyCtx,
  moveId: string,
  computed: Record<
    ValueStateLayer,
    { projected: ValueStateCell; tracked: ValueStateCell }
  >,
): Promise<void> {
  for (const layer of VALUE_STATE_LAYERS) {
    const cells = computed[layer];
    await client.query(
      `
        INSERT INTO public.value_states (
          client_id,
          move_id,
          layer_type,
          projected_jsonb,
          tracked_jsonb,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $6)
        ON CONFLICT (client_id, move_id, layer_type)
        DO UPDATE SET
          projected_jsonb = EXCLUDED.projected_jsonb,
          tracked_jsonb = EXCLUDED.tracked_jsonb,
          updated_by = EXCLUDED.updated_by,
          updated_at = now()
      `,
      [
        ctx.clientId,
        moveId,
        layer,
        JSON.stringify(cells.projected),
        JSON.stringify(cells.tracked),
        ctx.userId,
      ],
    );
  }
}

function rowsToLayers(
  moveId: string,
  rows: ValueStateRow[],
  computed: Record<
    ValueStateLayer,
    { projected: ValueStateCell; tracked: ValueStateCell }
  >,
): ValueLayerState[] {
  const byLayer = new Map(rows.map((row) => [row.layer_type, row]));
  return VALUE_STATE_LAYERS.map((layer) => {
    const row = byLayer.get(layer);
    const fallback = computed[layer];
    const verifiedFallback = {
      kind: "verified" as const,
      value: null,
      unit: VALUE_LAYER_DEFINITIONS[layer].format,
      label: "Not attested",
      confidence: "stub" as const,
      basis: "CFO attestation has not been recorded for this value layer.",
      computedAt: null,
      evidence: [],
    };
    return buildLayerState({
      id: row?.id ?? null,
      moveId,
      layer,
      projected: normalizeCell(
        row?.projected_jsonb,
        fallback.projected,
        "projected",
      ),
      tracked: normalizeCell(row?.tracked_jsonb, fallback.tracked, "tracked"),
      verified: normalizeCell(
        row?.verified_jsonb,
        verifiedFallback,
        "verified",
      ),
      updatedAt: row?.updated_at ?? null,
    });
  });
}

async function loadP10Arrows(
  client: PoolClient,
  clientId: string,
  moveIds?: string[],
): Promise<TowerPortfolioArrow[]> {
  const params: unknown[] = [clientId];
  const hasMoveFilter = Boolean(moveIds && moveIds.length > 0);
  if (hasMoveFilter) params.push(moveIds);
  const rows = (
    await client.query<ArrowRow>(p10ArrowsSql(hasMoveFilter), params)
  ).rows;
  return rows.map((row) => ({
    id: row.id,
    fromMoveId: row.from_move_id,
    fromMoveName: row.from_move_name,
    toMoveId: row.to_move_id,
    toMoveName: row.to_move_name,
    relationType: row.relation_type,
    note: row.note,
  }));
}

function buildFallbackArrow(move: MoveRow): TowerPortfolioArrow[] {
  if (!move.template_slug?.includes("it-productivity")) return [];
  return [
    {
      id: `fallback-${move.id}-source`,
      fromMoveId: move.id,
      fromMoveName: move.name,
      toMoveId: move.id,
      toMoveName: "Source workflows",
      relationType: "informs",
      note: "P10 dependency DAG is parallel; fallback shows IT-Productivity value depends on Source workflow value realization.",
    },
  ];
}

async function writeAttestationAudit(
  client: PoolClient,
  ctx: TenancyCtx,
  input: {
    moveId: string;
    layer: ValueStateLayer;
    note: string | null;
    value: number | string | null;
  },
): Promise<void> {
  await client.query(
    `
      INSERT INTO public.program_audit_log (
        tenant_key,
        program_id,
        engagement_id,
        actor_id,
        actor_role,
        action,
        from_state,
        to_state,
        rationale,
        evidence_refs
      )
      VALUES ($1, $2, $3, $4, $5, 'tower_value_attested', 'tracked', 'verified', $6, $7::text[])
    `,
    [
      clientKeyForAudit(ctx),
      input.moveId,
      input.moveId,
      isUuid(ctx.userId) ? ctx.userId : null,
      ctx.role ?? null,
      input.note ??
        `Verified ${input.layer} as ${String(input.value ?? "blank")}`,
      [`value_states:${input.moveId}:${input.layer}`],
    ],
  );
}

export async function getMoveValueDetail(
  ctx: TenancyCtx,
  moveId: string,
): Promise<TowerMoveValueDetail> {
  return withValueStateTransaction(async (client) => {
    const move = await getMove(client, ctx.clientId, moveId);
    if (!move) throw new Error("move_not_found");
    const telemetry = await getTelemetry(client, ctx.clientId, moveId);
    const computed = buildProjectedAndTrackedCells(
      telemetry,
      new Date().toISOString(),
    );
    await upsertProjectedTrackedRows(client, ctx, moveId, computed);
    const rows = await getValueRows(client, ctx.clientId, moveId);
    const layers = rowsToLayers(moveId, rows, computed);
    const arrows = await loadP10Arrows(client, ctx.clientId, [moveId]);
    const p10Arrows = arrows.length > 0 ? arrows : buildFallbackArrow(move);
    const aiOpsCost = buildTowerAiOpsCostLedgerFromValueLayers(
      layers,
      new Date().toISOString(),
    );

    return {
      move: {
        id: move.id,
        name: move.name,
        status: move.status,
        lifecycleState: move.lifecycle_state,
        currentPhase: move.current_phase,
        currentGate: move.current_gate,
        templateKind: move.template_kind,
        templateSlug: move.template_slug,
        templateName: move.template_name,
      },
      client: {
        id: ctx.clientId,
        key: ctx.clientKey ?? null,
      },
      layers,
      totals: {
        projectedUsd: sumLayerUsd(layers, "projected"),
        trackedUsd: sumLayerUsd(layers, "tracked"),
        verifiedUsd: sumLayerUsd(layers, "verified"),
        projectedHours: sumLayerHours(layers, "projected"),
        trackedHours: sumLayerHours(layers, "tracked"),
        verifiedHours: sumLayerHours(layers, "verified"),
      },
      aiOpsCost,
      canAttest: canAttestTowerValue(ctx),
      p10: {
        source: arrows.length > 0 ? "move_dependencies" : "fallback",
        arrows: p10Arrows,
      },
    };
  });
}

export async function attestValueLayer(
  ctx: TenancyCtx,
  input: {
    moveId: string;
    layer: ValueStateLayer;
    note?: string | null;
  },
): Promise<TowerMoveValueDetail> {
  if (!VALUE_STATE_LAYERS.includes(input.layer))
    throw new Error("invalid_layer");
  if (!canAttestTowerValue(ctx))
    throw new Error("forbidden_cfo_attestation_required");

  return withValueStateTransaction(async (client) => {
    const move = await getMove(client, ctx.clientId, input.moveId);
    if (!move) throw new Error("move_not_found");
    const telemetry = await getTelemetry(client, ctx.clientId, input.moveId);
    const computed = buildProjectedAndTrackedCells(
      telemetry,
      new Date().toISOString(),
    );
    await upsertProjectedTrackedRows(client, ctx, input.moveId, computed);
    const rowsBefore = await getValueRows(client, ctx.clientId, input.moveId);
    const beforeLayer = rowsToLayers(input.moveId, rowsBefore, computed).find(
      (row) => row.layer === input.layer,
    );
    if (!beforeLayer) throw new Error("value_layer_not_found");

    const verified: ValueStateCell = {
      ...beforeLayer.tracked,
      kind: "verified",
      confidence: "attested",
      label: `Verified: ${beforeLayer.tracked.label}`,
      basis: input.note?.trim()
        ? input.note.trim()
        : `CFO attested tracked ${VALUE_LAYER_DEFINITIONS[input.layer].label}.`,
      evidence: [
        ...beforeLayer.tracked.evidence,
        {
          id: `attestation-${input.moveId}-${input.layer}`,
          label: "CFO attestation event",
          source: "program_audit_log",
          confidence: "high",
        },
      ],
      computedAt: new Date().toISOString(),
      attestation: {
        actorId: ctx.userId,
        actorRole: ctx.role ?? null,
        attestedAt: new Date().toISOString(),
        note: input.note?.trim() || null,
      },
    };

    await client.query(
      `
        UPDATE public.value_states
        SET verified_jsonb = $4::jsonb,
            attested_by = $5,
            attested_at = now(),
            updated_by = $6,
            updated_at = now()
        WHERE client_id = $1
          AND move_id = $2
          AND layer_type = $3
          AND deleted_at IS NULL
      `,
      [
        ctx.clientId,
        input.moveId,
        input.layer,
        JSON.stringify(verified),
        isUuid(ctx.userId) ? ctx.userId : null,
        ctx.userId,
      ],
    );

    await writeAttestationAudit(client, ctx, {
      moveId: input.moveId,
      layer: input.layer,
      note: input.note ?? null,
      value: verified.value,
    });

    const rowsAfter = await getValueRows(client, ctx.clientId, input.moveId);
    const layers = rowsToLayers(input.moveId, rowsAfter, computed);
    const arrows = await loadP10Arrows(client, ctx.clientId, [input.moveId]);
    const aiOpsCost = buildTowerAiOpsCostLedgerFromValueLayers(
      layers,
      new Date().toISOString(),
    );
    return {
      move: {
        id: move.id,
        name: move.name,
        status: move.status,
        lifecycleState: move.lifecycle_state,
        currentPhase: move.current_phase,
        currentGate: move.current_gate,
        templateKind: move.template_kind,
        templateSlug: move.template_slug,
        templateName: move.template_name,
      },
      client: {
        id: ctx.clientId,
        key: ctx.clientKey ?? null,
      },
      layers,
      totals: {
        projectedUsd: sumLayerUsd(layers, "projected"),
        trackedUsd: sumLayerUsd(layers, "tracked"),
        verifiedUsd: sumLayerUsd(layers, "verified"),
        projectedHours: sumLayerHours(layers, "projected"),
        trackedHours: sumLayerHours(layers, "tracked"),
        verifiedHours: sumLayerHours(layers, "verified"),
      },
      aiOpsCost,
      canAttest: canAttestTowerValue(ctx),
      p10: {
        source: arrows.length > 0 ? "move_dependencies" : "fallback",
        arrows: arrows.length > 0 ? arrows : buildFallbackArrow(move),
      },
    };
  });
}

async function listPortfolioRowsViaAzure(
  clientId: string,
): Promise<PortfolioMoveRow[]> {
  return azureRead.query<PortfolioMoveRow>(PORTFOLIO_ROWS_SQL, [clientId], {
    missingTable: "throw",
  });
}

async function sourceProjectedUsdViaAzure(clientId: string): Promise<number> {
  try {
    const rows = await azureRead.query<{ projected_usd: string | null }>(
      SOURCE_PROJECTED_USD_SQL,
      [clientId],
      { missingTable: "throw" },
    );
    return asNumber(firstRow(rows)?.projected_usd);
  } catch {
    return 0;
  }
}

async function loadP10ArrowsViaAzure(
  clientId: string,
  moveIds?: string[],
): Promise<TowerPortfolioArrow[]> {
  const hasMoveFilter = Boolean(moveIds && moveIds.length > 0);
  const params: unknown[] = [clientId];
  if (hasMoveFilter) params.push(moveIds);
  const rows = await azureRead.query<ArrowRow>(
    p10ArrowsSql(hasMoveFilter),
    params,
    {
      missingTable: "throw",
    },
  );
  return rows.map((row) => ({
    id: row.id,
    fromMoveId: row.from_move_id,
    fromMoveName: row.from_move_name,
    toMoveId: row.to_move_id,
    toMoveName: row.to_move_name,
    relationType: row.relation_type,
    note: row.note,
  }));
}

function rowToPortfolioMove(row: PortfolioMoveRow): TowerPortfolioMove {
  return {
    moveId: row.id,
    moveName: row.name,
    templateKind: row.template_kind,
    templateSlug: row.template_slug,
    status: row.status,
    currentGate: row.current_gate,
    projectedUsd: asNumber(row.projected_usd),
    trackedUsd: asNumber(row.tracked_usd),
    verifiedUsd: asNumber(row.verified_usd),
    href: '/tower',
  };
}

export async function getPortfolioValueRollup(
  ctx: TenancyCtx,
): Promise<TowerPortfolioValueRollup> {
  const rows = await listPortfolioRowsViaAzure(ctx.clientId);
  const moves = rows.map(rowToPortfolioMove);
  const sourceProjected = await sourceProjectedUsdViaAzure(ctx.clientId);
  const arrows = await loadP10ArrowsViaAzure(
    ctx.clientId,
    moves.map((move) => move.moveId),
  );
  const fallbackArrows =
    arrows.length > 0 ? [] : rows.flatMap((row) => buildFallbackArrow(row));

  const activeSourceWorkflowCount = moves.filter(
    (move) => move.templateKind === "SourceWorkflow",
  ).length;
  const activeMoveCount = moves.filter(
    (move) => move.templateKind !== "SourceWorkflow",
  ).length;
  const projectedFromMoves = moves.reduce(
    (sum, move) => sum + move.projectedUsd,
    0,
  );
  const trackedUsd = moves.reduce((sum, move) => sum + move.trackedUsd, 0);
  const verifiedUsd = moves.reduce((sum, move) => sum + move.verifiedUsd, 0);

  return {
    clientId: ctx.clientId,
    moves,
    arrows: arrows.length > 0 ? arrows : fallbackArrows,
    p10Source: arrows.length > 0 ? "move_dependencies" : "fallback",
    totals: {
      projectedUsd: projectedFromMoves + sourceProjected,
      trackedUsd,
      verifiedUsd,
      activeMoveCount,
      activeSourceWorkflowCount,
    },
  };
}

export function errorCode(error: unknown): {
  code: string;
  message: string;
  status: number;
} {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "move_not_found")
    return { code: "not_found", message: "Move not found.", status: 404 };
  if (message === "invalid_layer")
    return {
      code: "invalid_layer",
      message: "Unknown Tower value layer.",
      status: 400,
    };
  if (message === "forbidden_cfo_attestation_required") {
    return {
      code: "forbidden",
      message:
        "Verified value attestation requires CFO or finance-admin authority.",
      status: 403,
    };
  }
  if (message.includes("DATABASE_URL")) {
    return { code: "db_unavailable", message, status: 503 };
  }
  return { code: "tower_value_error", message, status: 500 };
}

export function parseLayer(value: unknown): ValueStateLayer | null {
  return typeof value === "string" &&
    VALUE_STATE_LAYERS.includes(value as ValueStateLayer)
    ? (value as ValueStateLayer)
    : null;
}

export function valueStateJson(value: unknown): Record<string, unknown> {
  return toRecord(value);
}
