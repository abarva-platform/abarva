import "server-only";

import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
} from "@/lib/data-plane/postgresCompat";
import { runInsightEvaluation } from "@/lib/intelligence/insight-engine";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export type ContextRefreshTrigger =
  | "csv_upload"
  | "source_artifact"
  | "move_artifact"
  | "manual"
  | "api_sync";

export interface ContextRefreshEvent {
  id: string;
  clientId: string;
  tenantKey: string;
  triggeredBy: ContextRefreshTrigger;
  sourceId: string | null;
  sourceLabel: string | null;
  periodLabel: string | null;
  rowsSeen: number;
  rowsAccepted: number;
  rowsRejected: number;
  factsCreated: number;
  factsUpdated: number;
  factsSuperseded: number;
  approvalRequired: boolean;
  affectedSurfaces: string[];
  receiptUrl: string | null;
  createdAt: string;
}

export interface RecordContextRefreshEventInput {
  clientId: string;
  tenantKey?: string | null;
  triggeredBy: ContextRefreshTrigger;
  sourceId?: string | null;
  sourceLabel?: string | null;
  periodLabel?: string | null;
  rowsSeen?: number;
  rowsAccepted?: number;
  rowsRejected?: number;
  factsCreated?: number;
  factsUpdated?: number;
  factsSuperseded?: number;
  approvalRequired?: boolean;
  affectedSurfaces?: string[];
  receiptUrl?: string | null;
  evaluateInsights?: boolean;
}

interface ContextRefreshEventRow {
  id: string;
  client_id: string;
  tenant_key: string;
  triggered_by: ContextRefreshTrigger;
  source_id: string | null;
  source_label: string | null;
  period_label: string | null;
  rows_seen: number | string | null;
  rows_accepted: number | string | null;
  rows_rejected: number | string | null;
  facts_created: number | string | null;
  facts_updated: number | string | null;
  facts_superseded: number | string | null;
  approval_required: boolean | null;
  affected_surfaces: string[] | null;
  receipt_url: string | null;
  created_at: string;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapRow(row: ContextRefreshEventRow): ContextRefreshEvent {
  return {
    id: row.id,
    clientId: row.client_id,
    tenantKey: row.tenant_key,
    triggeredBy: row.triggered_by,
    sourceId: row.source_id,
    sourceLabel: row.source_label,
    periodLabel: row.period_label,
    rowsSeen: toNumber(row.rows_seen),
    rowsAccepted: toNumber(row.rows_accepted),
    rowsRejected: toNumber(row.rows_rejected),
    factsCreated: toNumber(row.facts_created),
    factsUpdated: toNumber(row.facts_updated),
    factsSuperseded: toNumber(row.facts_superseded),
    approvalRequired: Boolean(row.approval_required),
    affectedSurfaces: row.affected_surfaces ?? [],
    receiptUrl: row.receipt_url,
    createdAt: row.created_at,
  };
}

async function resolveTenantKeyForEvent(input: {
  clientId: string;
  tenantKey?: string | null;
}): Promise<string> {
  if (input.tenantKey) return canonicalTenantKey(input.tenantKey);

  const result = await getAzureReadFluentClient()
    .from<Array<{ key: string | null; slug: string | null }>>("clients")
    .select("key,slug")
    .eq("id", input.clientId)
    .limit(1)
    .maybeSingle();
  if (!result.error) {
    const key = result.data?.key ?? result.data?.slug;
    if (key) return canonicalTenantKey(key);
  }
  return canonicalTenantKey(input.clientId);
}

export async function listContextRefreshEventsForTenant(
  tenantKeyInput: string,
): Promise<{ events: ContextRefreshEvent[]; errors: string[] }> {
  const tenantKey = canonicalTenantKey(tenantKeyInput);
  const result = await getAzureReadFluentClient()
    .from<ContextRefreshEventRow[]>("context_refresh_events")
    .select(
      "id,client_id,tenant_key,triggered_by,source_id,source_label,period_label,rows_seen,rows_accepted,rows_rejected,facts_created,facts_updated,facts_superseded,approval_required,affected_surfaces,receipt_url,created_at",
    )
    .eq("tenant_key", tenantKey)
    .order("created_at", { ascending: false })
    .limit(200);

  if (result.error) {
    return { events: [], errors: [result.error.message] };
  }
  return { events: (result.data ?? []).map(mapRow), errors: [] };
}

export async function recordContextRefreshEvent(
  input: RecordContextRefreshEventInput,
): Promise<ContextRefreshEvent | null> {
  const tenantKey = await resolveTenantKeyForEvent(input);
  const result = await getAzureWriteFluentClient()
    .from("context_refresh_events")
    .insert({
      client_id: input.clientId,
      tenant_key: tenantKey,
      triggered_by: input.triggeredBy,
      source_id: input.sourceId ?? null,
      source_label: input.sourceLabel ?? null,
      period_label: input.periodLabel ?? null,
      rows_seen: input.rowsSeen ?? 0,
      rows_accepted: input.rowsAccepted ?? 0,
      rows_rejected: input.rowsRejected ?? 0,
      facts_created: input.factsCreated ?? 0,
      facts_updated: input.factsUpdated ?? 0,
      facts_superseded: input.factsSuperseded ?? 0,
      approval_required: input.approvalRequired ?? false,
      affected_surfaces: input.affectedSurfaces ?? [],
      receipt_url: input.receiptUrl ?? null,
    })
    .select(
      "id,client_id,tenant_key,triggered_by,source_id,source_label,period_label,rows_seen,rows_accepted,rows_rejected,facts_created,facts_updated,facts_superseded,approval_required,affected_surfaces,receipt_url,created_at",
    )
    .single<ContextRefreshEventRow>();

  if (result.error || !result.data) {
    console.warn("[context-refresh-events] insert failed", {
      tenantKey,
      triggeredBy: input.triggeredBy,
      error: result.error?.message,
    });
    return null;
  }

  if (input.evaluateInsights !== false) {
    runInsightEvaluation(tenantKey).catch((error) => {
      console.warn("[context-refresh-events] insight evaluation failed", {
        tenantKey,
        triggeredBy: input.triggeredBy,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  return mapRow(result.data);
}
