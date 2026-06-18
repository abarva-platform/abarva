import { azureRead, type AzureReadClient } from '@/lib/data-plane/azureRead';

export type ContextInsightMateriality = 'high' | 'medium' | 'low';
export type ContextInsightConfidence = 'high' | 'medium' | 'low' | 'none';
export type ContextInsightFreshness = 'fresh' | 'attention' | 'stale' | 'review' | 'unknown';
export type ContextInsightLifecycle = 'active' | 'review_required' | 'blocked_by_gap' | 'superseded';

export interface ContextInsight {
  id: string;
  tenantKey: string;
  headline: string;
  soWhat: string;
  domain: string;
  materiality: ContextInsightMateriality;
  derivedFromRecordIds: string[];
  derivedFromFactIds: string[];
  ruleId: string;
  evidence: string | null;
  confidence: ContextInsightConfidence;
  freshnessStatus: ContextInsightFreshness;
  lifecycleState: ContextInsightLifecycle;
  action: string | null;
  entityName: string | null;
  entityType: string | null;
  insightPayload: Record<string, unknown>;
  updatedAt: string;
}

interface ContextInsightRow {
  id: string;
  tenant_key: string;
  headline: string;
  so_what: string;
  domain: string;
  materiality: ContextInsightMateriality;
  derived_from_record_ids: string[] | null;
  derived_from_fact_ids: string[] | null;
  rule_id: string;
  evidence: string | null;
  confidence: ContextInsightConfidence;
  freshness_status: ContextInsightFreshness;
  lifecycle_state: ContextInsightLifecycle;
  action: string | null;
  entity_name: string | null;
  entity_type: string | null;
  insight_payload: Record<string, unknown> | null;
  updated_at: string;
}

export interface ListContextInsightsOptions {
  tenantKey: string;
  domain?: string | null;
  materiality?: ContextInsightMateriality | null;
  includeSuperseded?: boolean;
  limit?: number;
}

const MATERIALITY_SORT: Record<ContextInsightMateriality, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function normalizeContextInsightLimit(value: number | null | undefined): number {
  if (!Number.isFinite(value ?? NaN)) return 50;
  const intValue = Math.trunc(value as number);
  if (intValue < 1) return 1;
  return Math.min(intValue, 100);
}

function rowToInsight(row: ContextInsightRow): ContextInsight {
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    headline: row.headline,
    soWhat: row.so_what,
    domain: row.domain,
    materiality: row.materiality,
    derivedFromRecordIds: row.derived_from_record_ids ?? [],
    derivedFromFactIds: row.derived_from_fact_ids ?? [],
    ruleId: row.rule_id,
    evidence: row.evidence,
    confidence: row.confidence,
    freshnessStatus: row.freshness_status,
    lifecycleState: row.lifecycle_state,
    action: row.action,
    entityName: row.entity_name,
    entityType: row.entity_type,
    insightPayload: row.insight_payload ?? {},
    updatedAt: row.updated_at,
  };
}

export async function listContextInsights(
  options: ListContextInsightsOptions,
  db: AzureReadClient = azureRead,
): Promise<ContextInsight[]> {
  const tenantKey = options.tenantKey.trim();
  if (!tenantKey) return [];

  const params: unknown[] = [tenantKey];
  const where = ['tenant_key = $1'];
  if (!options.includeSuperseded) {
    where.push("lifecycle_state <> 'superseded'");
  }
  if (options.domain?.trim()) {
    params.push(options.domain.trim());
    where.push(`domain = $${params.length}`);
  }
  if (options.materiality) {
    params.push(options.materiality);
    where.push(`materiality = $${params.length}`);
  }
  params.push(normalizeContextInsightLimit(options.limit));

  const rows = await db.query<ContextInsightRow>(
    `
      SELECT
        id,
        tenant_key,
        headline,
        so_what,
        domain,
        materiality,
        derived_from_record_ids,
        derived_from_fact_ids,
        rule_id,
        evidence,
        confidence,
        freshness_status,
        lifecycle_state,
        action,
        entity_name,
        entity_type,
        insight_payload,
        updated_at
      FROM context_insights
      WHERE ${where.join(' AND ')}
      ORDER BY
        CASE materiality WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        updated_at DESC
      LIMIT $${params.length}
    `,
    params,
    { missingTable: 'empty' },
  );

  return rows
    .map(rowToInsight)
    .sort((a, b) => (
      MATERIALITY_SORT[a.materiality] - MATERIALITY_SORT[b.materiality]
      || b.updatedAt.localeCompare(a.updatedAt)
    ));
}
