import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
} from "@/lib/data-plane/postgresCompat";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

import { evaluate as evaluateAdoptionBelowValueCase } from "./rules/adoption-below-value-case";
import { evaluate as evaluateConflictingFact } from "./rules/conflicting-fact";
import { evaluate as evaluateMaterialClaimUnapproved } from "./rules/material-claim-unapproved";
import { evaluate as evaluateRenewalWindowNoBenchmark } from "./rules/renewal-window-no-benchmark";
import { evaluate as evaluateSlaBreachWorsening } from "./rules/sla-breach-worsening";
import { evaluate as evaluateValueCoverageGap } from "./rules/value-coverage-gap";
import { insightToRow, mapInsightRow } from "./types";
import type {
  ContextInsight,
  ContextInsightRow,
  RuleEvaluationContext,
  SignificanceRuleRow,
} from "./types";

const EVALUATORS = {
  "renewal-window-no-benchmark": evaluateRenewalWindowNoBenchmark,
  "adoption-below-value-case": evaluateAdoptionBelowValueCase,
  "sla-breach-worsening": evaluateSlaBreachWorsening,
  "material-claim-unapproved": evaluateMaterialClaimUnapproved,
  "conflicting-fact": evaluateConflictingFact,
  "value-coverage-gap": evaluateValueCoverageGap,
};

const MATERIALITY_RANK: Record<ContextInsight["materiality"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const CONFIDENCE_RANK: Record<ContextInsight["confidence"], number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export interface InsightEvaluationReceipt {
  tenantKey: string;
  evaluated: number;
  fired: number;
  written: number;
  superseded: number;
  errors: string[];
}

type InsightWrite = Omit<ContextInsight, "id" | "createdAt" | "updatedAt">;

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isStrongerInsight(candidate: InsightWrite, current: InsightWrite) {
  const materiality =
    MATERIALITY_RANK[candidate.materiality] - MATERIALITY_RANK[current.materiality];
  if (materiality !== 0) return materiality < 0;
  return CONFIDENCE_RANK[candidate.confidence] < CONFIDENCE_RANK[current.confidence];
}

function mergeInsightForUpsert(current: InsightWrite, candidate: InsightWrite) {
  const winner = isStrongerInsight(candidate, current) ? candidate : current;
  return {
    ...winner,
    derivedFromRecordIds: uniqueStrings([
      ...current.derivedFromRecordIds,
      ...candidate.derivedFromRecordIds,
    ]),
    derivedFromFactIds: uniqueStrings([
      ...current.derivedFromFactIds,
      ...candidate.derivedFromFactIds,
    ]),
  };
}

export function dedupeInsightsForUpsert(insights: InsightWrite[]): InsightWrite[] {
  const byConflictKey = new Map<string, InsightWrite>();
  const output: InsightWrite[] = [];

  for (const insight of insights) {
    if (!insight.entityName) {
      output.push(insight);
      continue;
    }

    const key = `${insight.tenantKey}\u0000${insight.ruleId}\u0000${insight.entityName}`;
    const existing = byConflictKey.get(key);
    if (!existing) {
      byConflictKey.set(key, insight);
      output.push(insight);
      continue;
    }

    const merged = mergeInsightForUpsert(existing, insight);
    byConflictKey.set(key, merged);
    const index = output.indexOf(existing);
    if (index >= 0) output[index] = merged;
  }

  return output;
}

async function resolveClientId(tenantKey: string): Promise<string> {
  const db = getAzureReadFluentClient();
  for (const column of ["tenant_key", "slug"]) {
    const result = await db
      .from<Array<{ id: string }>>("clients")
      .select("id")
      .eq(column, tenantKey)
      .limit(1)
      .maybeSingle();
    if (!result.error && result.data?.id) return result.data.id;
  }
  return tenantKey;
}

async function loadEnabledRules(
  errors: string[],
): Promise<SignificanceRuleRow[]> {
  const db = getAzureReadFluentClient();
  const result = await db
    .from<SignificanceRuleRow[]>("significance_rules")
    .select("rule_key,name,enabled")
    .eq("enabled", true)
    .limit(100);
  if (result.error) {
    errors.push(`significance_rules: ${result.error.message}`);
    return [];
  }
  return result.data ?? [];
}

async function writeInsights(
  insights: InsightWrite[],
  errors: string[],
): Promise<number> {
  if (insights.length === 0) return 0;
  const db = getAzureWriteFluentClient();
  const deduped = dedupeInsightsForUpsert(insights);
  const result = await db
    .from("context_insights")
    .upsert(deduped.map(insightToRow), {
      onConflict: "tenant_key,rule_id,entity_name",
    });
  if (result.error) {
    errors.push(`context_insights upsert: ${result.error.message}`);
    return 0;
  }
  return result.count ?? deduped.length;
}

async function supersedeInactiveInsights(
  tenantKey: string,
  ruleId: string,
  activeEntityNames: Set<string>,
  errors: string[],
): Promise<number> {
  const db = getAzureReadFluentClient();
  const existing = await db
    .from<ContextInsightRow[]>("context_insights")
    .select(
      "id,client_id,tenant_key,headline,so_what,domain,materiality,derived_from_record_ids,derived_from_fact_ids,rule_id,evidence,confidence,freshness_status,lifecycle_state,action,entity_name,entity_type,created_at,updated_at",
    )
    .eq("tenant_key", tenantKey)
    .eq("rule_id", ruleId)
    .in("lifecycle_state", ["active", "review_required", "blocked_by_gap"])
    .limit(500);

  if (existing.error) {
    errors.push(`context_insights supersede lookup: ${existing.error.message}`);
    return 0;
  }

  const stale = (existing.data ?? []).filter(
    (row) => row.entity_name && !activeEntityNames.has(row.entity_name),
  );
  if (stale.length === 0) return 0;

  const writer = getAzureWriteFluentClient();
  let count = 0;
  for (const row of stale) {
    const result = await writer
      .from("context_insights")
      .update({
        lifecycle_state: "superseded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (result.error) {
      errors.push(
        `context_insights supersede ${row.id}: ${result.error.message}`,
      );
      continue;
    }
    count += result.count ?? 1;
  }
  return count;
}

export async function runInsightEvaluation(
  tenantKeyInput: string,
): Promise<InsightEvaluationReceipt> {
  const tenantKey = canonicalTenantKey(tenantKeyInput);
  const errors: string[] = [];
  const clientId = await resolveClientId(tenantKey);
  const rules = await loadEnabledRules(errors);
  const ctx: RuleEvaluationContext = {
    tenantKey,
    clientId,
    db: getAzureReadFluentClient(),
  };

  let fired = 0;
  let written = 0;
  let superseded = 0;

  for (const rule of rules) {
    const evaluator = EVALUATORS[rule.rule_key as keyof typeof EVALUATORS];
    if (!evaluator) continue;
    const result = await evaluator(ctx);
    if (result.errors?.length) {
      errors.push(
        ...result.errors.map((error) => `${rule.rule_key}: ${error}`),
      );
    }
    if (!result.fired) {
      superseded += await supersedeInactiveInsights(
        tenantKey,
        rule.rule_key,
        new Set(),
        errors,
      );
      continue;
    }
    fired += 1;
    written += await writeInsights(result.insights, errors);
    superseded += await supersedeInactiveInsights(
      tenantKey,
      rule.rule_key,
      new Set(
        result.insights
          .map((insight) => insight.entityName)
          .filter((value): value is string => Boolean(value)),
      ),
      errors,
    );
  }

  return {
    tenantKey,
    evaluated: rules.length,
    fired,
    written,
    superseded,
    errors,
  };
}

export async function listContextInsightsForTenant(
  tenantKeyInput: string,
): Promise<{ insights: ContextInsight[]; errors: string[] }> {
  const tenantKey = canonicalTenantKey(tenantKeyInput);
  const db = getAzureReadFluentClient();
  const result = await db
    .from<ContextInsightRow[]>("context_insights")
    .select(
      "id,client_id,tenant_key,headline,so_what,domain,materiality,derived_from_record_ids,derived_from_fact_ids,rule_id,evidence,confidence,freshness_status,lifecycle_state,action,entity_name,entity_type,created_at,updated_at",
    )
    .eq("tenant_key", tenantKey)
    .in("lifecycle_state", ["active", "review_required", "blocked_by_gap"])
    .order("updated_at", { ascending: false })
    .limit(200);

  if (result.error) {
    return { insights: [], errors: [result.error.message] };
  }

  const insights = (result.data ?? []).map(mapInsightRow).sort((a, b) => {
    const materiality =
      MATERIALITY_RANK[a.materiality] - MATERIALITY_RANK[b.materiality];
    if (materiality !== 0) return materiality;
    return String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""));
  });
  return { insights, errors: [] };
}
