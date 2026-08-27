import { azureRead } from "@/lib/data-plane/azureRead";
import { denseAssessmentIdForTenant } from "@/lib/ecl/denseAssessment";

type Numeric = string | number | null;

interface TowerEclProjectionRow {
  row_key: string;
  page_key: string;
  row_type: string;
  claim_gate_status: string;
  claim_gate_reason_code: string | null;
  claim_gate_reason_detail: string | null;
  next_gate: string | null;
  funded_amount_usd: Numeric;
  promised_value_usd: Numeric;
  claimable_value_usd: Numeric;
  blocked_value_usd: Numeric;
  proof_maturity_score: number | null;
  risk_pressure_score: number | null;
  usage_strength_score: number | null;
  owner_role: string | null;
  handoff_module: string | null;
  display_payload_json: Record<string, unknown>;
  gap_flags_json: unknown[];
  source_refs_json: unknown[];
}

interface TowerServingRow {
  readonly payload_json: TowerEclProjectionRow;
}

export interface TowerEclProjectionPreview {
  provider: "ecl_projection_db";
  tenantKey: string;
  assessmentId: string;
  rowCount: number;
  pageCounts: Array<{ pageKey: string; count: number }>;
  typeCounts: Array<{ rowType: string; count: number }>;
  gateCounts: Array<{ gateStatus: string; count: number }>;
  totals: {
    fundedUsd: number;
    promisedUsd: number;
    claimableUsd: number;
    blockedUsd: number;
  };
  priorityRows: Array<{
    rowKey: string;
    pageKey: string;
    rowType: string;
    title: string;
    ownerRole: string | null;
    gateStatus: string;
    gateReason: string;
    nextGate: string | null;
    promisedUsd: number;
    blockedUsd: number;
    proofMaturityScore: number | null;
    riskPressureScore: number | null;
    usageStrengthScore: number | null;
    gapCount: number;
    sourceRefCount: number;
  }>;
}

function numberValue(value: Numeric): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function displayTitle(row: TowerEclProjectionRow): string {
  const payload = row.display_payload_json ?? {};
  return (
    textValue(payload.title) ??
    textValue(payload.program_name) ??
    textValue(payload.use_case_name) ??
    textValue(payload.risk_or_control_name) ??
    textValue(payload.contract_id) ??
    row.row_key
  );
}

function countBy<T extends string>(
  rows: TowerEclProjectionRow[],
  key: (row: TowerEclProjectionRow) => T,
): Array<{ key: T; count: number }> {
  const counts = new Map<T, number>();
  for (const row of rows) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ key: name, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export async function readTowerEclProjectionPreview(
  tenantKey: string | null,
): Promise<TowerEclProjectionPreview | null> {
  if (!tenantKey) return null;
  const assessmentId = denseAssessmentIdForTenant(tenantKey);

  const servingRows = await azureRead.query<TowerServingRow>(
    `select payload_json
     from serving.tower_command_center
     where tenant_key = $1
       and assessment_id = $2
     order by
       (payload_json->>'blocked_value_usd')::numeric desc nulls last,
       (payload_json->>'risk_pressure_score')::numeric desc nulls last,
       row_key
     limit 2000`,
    [tenantKey, assessmentId],
    { missingTable: "empty" },
  );
  const rows = servingRows.map((row) => row.payload_json);

  // No projected rows for this tenant/assessment is a legitimate state, not a fault: the ECL
  // projection may simply not have been built for this tenant yet. Return null so the optional
  // preview panel hides itself and the base Command Center still renders. Throwing here took the
  // whole /tower route down for every tenant without a dense-source projection.
  if (rows.length === 0) {
    return null;
  }

  const pageCounts = countBy(rows, (row) => row.page_key).map(
    ({ key, count }) => ({ pageKey: key, count }),
  );
  const typeCounts = countBy(rows, (row) => row.row_type).map(
    ({ key, count }) => ({ rowType: key, count }),
  );
  const gateCounts = countBy(rows, (row) => row.claim_gate_status).map(
    ({ key, count }) => ({ gateStatus: key, count }),
  );

  return {
    provider: "ecl_projection_db",
    tenantKey,
    assessmentId,
    rowCount: rows.length,
    pageCounts,
    typeCounts,
    gateCounts,
    totals: {
      fundedUsd: rows.reduce((sum, row) => sum + numberValue(row.funded_amount_usd), 0),
      promisedUsd: rows.reduce((sum, row) => sum + numberValue(row.promised_value_usd), 0),
      claimableUsd: rows.reduce((sum, row) => sum + numberValue(row.claimable_value_usd), 0),
      blockedUsd: rows.reduce((sum, row) => sum + numberValue(row.blocked_value_usd), 0),
    },
    priorityRows: rows.slice(0, 12).map((row) => ({
      rowKey: row.row_key,
      pageKey: row.page_key,
      rowType: row.row_type,
      title: displayTitle(row),
      ownerRole: row.owner_role,
      gateStatus: row.claim_gate_status,
      gateReason:
        row.claim_gate_reason_detail ??
        row.claim_gate_reason_code ??
        "No gate reason recorded.",
      nextGate: row.next_gate,
      promisedUsd: numberValue(row.promised_value_usd),
      blockedUsd: numberValue(row.blocked_value_usd),
      proofMaturityScore: row.proof_maturity_score,
      riskPressureScore: row.risk_pressure_score,
      usageStrengthScore: row.usage_strength_score,
      gapCount: Array.isArray(row.gap_flags_json) ? row.gap_flags_json.length : 0,
      sourceRefCount: Array.isArray(row.source_refs_json) ? row.source_refs_json.length : 0,
    })),
  };
}
