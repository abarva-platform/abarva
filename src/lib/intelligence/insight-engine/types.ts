import type { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

export type InsightMateriality = "high" | "medium" | "low";
export type InsightConfidence = "high" | "medium" | "low" | "none";
export type InsightFreshness =
  | "fresh"
  | "attention"
  | "stale"
  | "review"
  | "unknown";
export type InsightLifecycleState =
  | "active"
  | "review_required"
  | "blocked_by_gap"
  | "superseded";

export interface ContextInsight {
  id?: string;
  clientId: string;
  tenantKey: string;
  headline: string;
  soWhat: string;
  domain: string;
  materiality: InsightMateriality;
  derivedFromRecordIds: string[];
  derivedFromFactIds: string[];
  ruleId: string;
  evidence: string | null;
  confidence: InsightConfidence;
  freshnessStatus: InsightFreshness;
  lifecycleState: InsightLifecycleState;
  action: string | null;
  entityName: string | null;
  entityType: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RuleEvaluationContext {
  tenantKey: string;
  clientId: string;
  db: ReturnType<typeof getAzureReadFluentClient>;
}

export interface RuleResult {
  fired: boolean;
  insights: Array<Omit<ContextInsight, "id" | "createdAt" | "updatedAt">>;
  errors?: string[];
}

export interface SignificanceRuleRow {
  rule_key: string;
  name: string;
  enabled: boolean;
}

export interface ContextInsightRow {
  id: string;
  client_id: string;
  tenant_key: string;
  headline: string;
  so_what: string;
  domain: string;
  materiality: InsightMateriality;
  derived_from_record_ids: string[] | null;
  derived_from_fact_ids: string[] | null;
  rule_id: string;
  evidence: string | null;
  confidence: InsightConfidence;
  freshness_status: InsightFreshness;
  lifecycle_state: InsightLifecycleState;
  action: string | null;
  entity_name: string | null;
  entity_type: string | null;
  created_at: string;
  updated_at: string;
}

export function mapInsightRow(row: ContextInsightRow): ContextInsight {
  return {
    id: row.id,
    clientId: row.client_id,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function insightToRow(
  insight: Omit<ContextInsight, "id" | "createdAt" | "updatedAt">,
) {
  return {
    client_id: insight.clientId,
    tenant_key: insight.tenantKey,
    headline: insight.headline,
    so_what: insight.soWhat,
    domain: insight.domain,
    materiality: insight.materiality,
    derived_from_record_ids: insight.derivedFromRecordIds,
    derived_from_fact_ids: insight.derivedFromFactIds,
    rule_id: insight.ruleId,
    evidence: insight.evidence,
    confidence: insight.confidence,
    freshness_status: insight.freshnessStatus,
    lifecycle_state: insight.lifecycleState,
    action: insight.action,
    entity_name: insight.entityName,
    entity_type: insight.entityType,
    updated_at: new Date().toISOString(),
  };
}
