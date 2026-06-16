import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type { AiControlTowerLoadPlan } from './load-plan';

type JsonRecord = Record<string, unknown>;

export interface AiControlTowerCommitBatch {
  refreshRun: JsonRecord;
  sources: JsonRecord[];
  rowsByTable: Record<string, JsonRecord[]>;
}

export interface AiControlTowerWriteResult {
  refreshRunId: string;
  tables: Array<{
    table: string;
    rowsAttempted: number;
    rowsCommitted: number;
  }>;
  errors: Array<{
    table: string;
    message: string;
  }>;
}

const TABLE_CONFLICTS: Record<string, string> = {
  ai_control_sources: 'client_id,refresh_run_id,source_key',
  ai_control_initiatives: 'client_id,refresh_run_id,initiative_key',
  ai_control_tool_usage_monthly: 'client_id,refresh_run_id,tool_key,user_group_or_team,period_start',
  ai_control_persona_productivity: 'client_id,refresh_run_id,persona_key,workflow,metric_key',
  ai_control_dora_metrics: 'client_id,refresh_run_id,team,repo,period_start',
  ai_control_agent_outcomes: 'client_id,refresh_run_id,agent_key',
  ai_control_benefit_realization: 'client_id,refresh_run_id,benefit_key',
  ai_control_spend_contracts: 'client_id,refresh_run_id,spend_key',
  ai_control_risk_governance: 'client_id,refresh_run_id,risk_key',
  ai_control_actions: 'client_id,refresh_run_id,action_key',
  ai_control_evidence_items: 'client_id,refresh_run_id,evidence_key',
  ai_control_context_facts: 'client_id,refresh_run_id,record_type,record_key,fact_key',
  ai_control_context_relationships: 'client_id,refresh_run_id,relationship_key',
};

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function asDate(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function splitList(value: unknown): string[] {
  return (asText(value) ?? '')
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDataClass(value: unknown): string {
  const normalized = asText(value)?.toLowerCase();
  if (normalized === 'public' || normalized === 'internal' || normalized === 'confidential' || normalized === 'restricted') {
    return normalized;
  }
  return 'internal';
}

function normalizeEvidenceState(value: unknown): string {
  const normalized = asText(value)?.toLowerCase();
  if (normalized === 'usable') return 'usable';
  if (normalized === 'retrieval_verified') return 'retrieval_verified';
  if (normalized === 'low_confidence') return 'low_confidence';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'review_required') return 'review_required';
  return 'received';
}

function splitRecordId(value: unknown): { recordType: string; recordKey: string } {
  const raw = asText(value) ?? 'unknown:unknown';
  const separator = raw.indexOf(':');
  if (separator < 0) return { recordType: 'record', recordKey: raw };
  return {
    recordType: raw.slice(0, separator) || 'record',
    recordKey: raw.slice(separator + 1) || raw,
  };
}

function sourceIdFor(sourceIdByKey: Record<string, string>, value: unknown): string | null {
  const key = asText(value);
  return key ? sourceIdByKey[key] ?? null : null;
}

function payloadRows(plan: AiControlTowerLoadPlan, table: string): JsonRecord[] {
  return (plan.tableRows[table] ?? [])
    .map((row) => row.payload)
    .filter((payload): payload is JsonRecord => Boolean(payload && typeof payload === 'object' && !Array.isArray(payload)));
}

export function prepareAiControlTowerCommitBatch(args: {
  plan: AiControlTowerLoadPlan;
  refreshRunId: string;
  sourceIdByKey: Record<string, string>;
}): AiControlTowerCommitBatch {
  const { plan, refreshRunId, sourceIdByKey } = args;
  const base = {
    client_id: plan.clientId,
    refresh_run_id: refreshRunId,
  };

  const sources = payloadRows(plan, 'ai_control_sources').map((row) => ({
    ...base,
    source_key: asText(row.source_id) ?? 'unknown-source',
    source_type: asText(row.source_type) ?? 'unknown',
    source_system: asText(row.source_system) ?? 'unknown',
    source_name: asText(row.source_name) ?? asText(row.source_system) ?? 'Unknown source',
    owner_role: asText(row.owner_role),
    cadence: asText(row.cadence),
    data_class: normalizeDataClass(row.data_class),
    period_end: asDate(row.period_end),
    refresh_status: asText(row.refresh_status) ?? 'received',
    payload: row,
  }));

  const rowsByTable: Record<string, JsonRecord[]> = {
    ai_control_initiatives: payloadRows(plan, 'ai_control_initiatives').map((row) => ({
      ...base,
      source_id: sourceIdFor(sourceIdByKey, row.source_id),
      initiative_key: asText(row.initiative_id) ?? 'unknown-initiative',
      initiative_name: asText(row.initiative_name) ?? 'Unknown initiative',
      category: asText(row.category),
      stage: asText(row.stage),
      business_owner_role: asText(row.business_owner_role) ?? asText(row.owner),
      executive_sponsor_role: asText(row.executive_sponsor_role) ?? asText(row.sponsor),
      vendor: asText(row.vendor),
      tool_or_system: asText(row.tool_or_system),
      impacted_personas: splitList(row.impacted_personas),
      promised_benefit: asText(row.promised_benefit),
      target_metric_key: asText(row.target_metric_key),
      baseline_value: asNumber(row.baseline_value),
      target_value: asNumber(row.target_value),
      target_date: asDate(row.target_date),
      status_flag: asText(row.status_flag),
      payload: row,
    })),
    ai_control_tool_usage_monthly: payloadRows(plan, 'ai_control_tool_usage_monthly').map((row) => ({
      ...base,
      source_id: sourceIdFor(sourceIdByKey, row.source_id),
      tool_key: asText(row.tool_id) ?? asText(row.tool_key) ?? 'unknown-tool',
      tool_name: asText(row.tool_name) ?? 'Unknown tool',
      vendor: asText(row.vendor),
      user_group_or_team: asText(row.user_group_or_team) ?? asText(row.team) ?? 'Unknown group',
      persona: asText(row.persona),
      period_start: asDate(row.period_start) ?? plan.refreshRun.reporting_period_start,
      period_end: asDate(row.period_end) ?? plan.refreshRun.reporting_period_end,
      licensed_seats: asNumber(row.licensed_seats),
      active_users: asNumber(row.active_users),
      usage_events: asNumber(row.usage_events),
      accepted_or_completed_events: asNumber(row.accepted_events) ?? asNumber(row.accepted_or_completed_events),
      utilization_pct: asNumber(row.utilization_pct),
      monthly_spend_usd: asNumber(row.monthly_spend_usd),
      evidence_state: normalizeEvidenceState(row.evidence_state),
      payload: row,
    })),
    ai_control_persona_productivity: payloadRows(plan, 'ai_control_persona_productivity').map((row) => ({
      ...base,
      source_id: sourceIdFor(sourceIdByKey, row.source_id),
      persona_key: asText(row.persona_id) ?? asText(row.persona_key) ?? 'unknown-persona',
      persona_name: asText(row.persona_name) ?? 'Unknown persona',
      function_name: asText(row.function),
      workflow: asText(row.workflow) ?? 'Unknown workflow',
      metric_key: asText(row.metric_key) ?? 'unknown_metric',
      unit: asText(row.unit),
      baseline_value: asNumber(row.baseline_value),
      current_value: asNumber(row.current_value),
      target_value: asNumber(row.target_value),
      initiative_key: asText(row.initiative_id),
      confidence: asText(row.confidence)?.toLowerCase(),
      evidence_state: normalizeEvidenceState(row.evidence_state),
      payload: row,
    })),
    ai_control_dora_metrics: payloadRows(plan, 'ai_control_dora_metrics').map((row) => ({
      ...base,
      source_id: sourceIdFor(sourceIdByKey, row.source_id),
      team: asText(row.team) ?? 'Unknown team',
      repo: asText(row.repo) ?? 'unknown-repo',
      tool_key: asText(row.tool_id),
      period_start: asDate(row.current_period_start) ?? asDate(row.period_start) ?? plan.refreshRun.reporting_period_start,
      period_end: asDate(row.current_period_end) ?? asDate(row.period_end) ?? plan.refreshRun.reporting_period_end,
      deployment_frequency_before: asNumber(row.deployment_frequency_before),
      deployment_frequency_after: asNumber(row.deployment_frequency_after),
      lead_time_hours_before: asNumber(row.lead_time_hours_before),
      lead_time_hours_after: asNumber(row.lead_time_hours_after),
      change_failure_rate_pct_before: asNumber(row.change_failure_rate_pct_before),
      change_failure_rate_pct_after: asNumber(row.change_failure_rate_pct_after),
      mttr_hours_before: asNumber(row.mttr_hours_before),
      mttr_hours_after: asNumber(row.mttr_hours_after),
      sample_size_deploys: asNumber(row.sample_size_deploys),
      evidence_state: normalizeEvidenceState(row.evidence_state),
      payload: row,
    })),
    ai_control_agent_outcomes: [
      ...payloadRows(plan, 'ai_control_agent_outcomes').map((row) => ({
        ...base,
        source_id: sourceIdFor(sourceIdByKey, row.source_id),
        agent_key: asText(row.agent_id) ?? asText(row.agent_key) ?? 'unknown-agent',
        vendor: asText(row.vendor) ?? (asText(row.agent_name)?.toLowerCase().includes('now assist') ? 'ServiceNow' : 'Unknown vendor'),
        module: asText(row.module) ?? asText(row.queue_or_group),
        agent_name: asText(row.agent_name) ?? 'Unknown agent',
        persona: asText(row.persona),
        workflow: asText(row.workflow),
        eligible_volume: asNumber(row.eligible_volume) ?? asNumber(row.transaction_volume),
        ai_touched_volume: asNumber(row.ai_touched_volume),
        auto_resolved_volume: asNumber(row.auto_resolved_volume),
        cycle_time_before: asNumber(row.cycle_time_before_hours) ?? asNumber(row.mttr_hours_before),
        cycle_time_after: asNumber(row.cycle_time_after_hours) ?? asNumber(row.mttr_hours_after),
        quality_before: asNumber(row.error_rate_pct_before) ?? asNumber(row.reopen_rate_pct_before),
        quality_after: asNumber(row.error_rate_pct_after) ?? asNumber(row.reopen_rate_pct_after),
        monthly_spend_usd: asNumber(row.monthly_spend_usd),
        evidence_state: normalizeEvidenceState(row.evidence_state),
        payload: row,
      })),
    ],
    ai_control_benefit_realization: payloadRows(plan, 'ai_control_benefit_realization').map((row) => ({
      ...base,
      source_id: sourceIdFor(sourceIdByKey, row.source_id),
      benefit_key: asText(row.benefit_id) ?? asText(row.benefit_key) ?? 'unknown-benefit',
      initiative_key: asText(row.initiative_id),
      benefit_name: asText(row.benefit_name) ?? 'Unknown benefit',
      metric_key: asText(row.metric_key),
      baseline_value: asNumber(row.baseline_value),
      current_value: asNumber(row.current_value),
      target_value: asNumber(row.target_value),
      promised_annual_value_usd: asNumber(row.promised_annual_value_usd),
      realized_annual_value_usd: asNumber(row.realized_annual_value_usd),
      confidence: asText(row.confidence)?.toLowerCase(),
      readiness_state: asText(row.readiness_state),
      evidence_state: normalizeEvidenceState(row.evidence_state),
      payload: row,
    })),
    ai_control_spend_contracts: payloadRows(plan, 'ai_control_spend_contracts').map((row) => ({
      ...base,
      source_id: sourceIdFor(sourceIdByKey, row.source_id),
      spend_key: asText(row.spend_id) ?? asText(row.spend_key) ?? 'unknown-spend',
      initiative_key: asText(row.initiative_id),
      vendor: asText(row.vendor) ?? 'Unknown vendor',
      product_or_service: asText(row.product_or_service) ?? 'Unknown product',
      spend_type: asText(row.spend_type),
      monthly_spend_usd: asNumber(row.monthly_spend_usd),
      annualized_spend_usd: asNumber(row.annualized_spend_usd),
      renewal_date: asDate(row.renewal_date),
      unit_economics_metric: asText(row.unit_economics_metric),
      unit_economics_value: asNumber(row.unit_economics_value),
      evidence_state: normalizeEvidenceState(row.evidence_state),
      payload: row,
    })),
    ai_control_risk_governance: payloadRows(plan, 'ai_control_risk_governance').map((row) => ({
      ...base,
      source_id: sourceIdFor(sourceIdByKey, row.source_id),
      risk_key: asText(row.risk_id) ?? asText(row.risk_key) ?? 'unknown-risk',
      initiative_key: asText(row.initiative_id),
      dimension: asText(row.dimension) ?? 'unknown',
      severity: asText(row.severity)?.toLowerCase() ?? 'medium',
      status: asText(row.status),
      risk_description: asText(row.risk_description) ?? 'Risk description missing',
      owner_role: asText(row.owner_role),
      required_action: asText(row.required_action),
      governance_gate: asText(row.governance_gate)?.toLowerCase(),
      evidence_state: normalizeEvidenceState(row.evidence_state) === 'received' ? 'review_required' : normalizeEvidenceState(row.evidence_state),
      payload: row,
    })),
    ai_control_actions: plan.derivedActions.map((row) => ({
      ...base,
      action_key: row.action_key,
      related_record_type: row.related_record_type,
      related_record_key: row.related_record_key,
      posture: row.posture,
      title: row.title,
      rationale: row.rationale,
      owner_role: row.owner_role,
      due_date: row.due_date,
      status: row.status,
      evidence_state: row.evidence_state,
      payload: row.payload,
    })),
    ai_control_evidence_items: plan.contextRows.evidence.map((row) => ({
      ...base,
      evidence_key: asText(row.evidence_key) ?? 'unknown-evidence',
      record_type: splitRecordId(row.record_external_id).recordType,
      record_key: splitRecordId(row.record_external_id).recordKey,
      evidence_type: asText(row.evidence_type) ?? 'unknown',
      citation_label: asText(row.citation_label) ?? 'Evidence item',
      citation_locator: {
        locator: row.citation_locator,
        source_sheet: row.source_sheet,
        source_row_number: row.source_row_number,
      },
      evidence_pointer: asText(row.evidence_pointer),
      evidence_state: row.evidence_usable === true ? 'usable' : 'review_required',
      confidence: asNumber(row.confidence),
      payload: row,
    })),
    ai_control_context_facts: plan.contextRows.facts.map((row) => {
      const record = splitRecordId(row.record_id);
      return {
        ...base,
        record_type: record.recordType,
        record_key: record.recordKey,
        fact_key: asText(row.fact_key) ?? 'unknown_fact',
        fact_type: asText(row.fact_type) ?? 'unknown',
        fact_value: row.fact_value ?? null,
        fact_text: asText(row.fact_text) ?? '',
        confidence: asNumber(row.confidence),
        evidence_state: normalizeEvidenceState(row.evidence_state),
        evidence_keys: [],
        payload: row,
      };
    }),
    ai_control_context_relationships: plan.contextRows.relationships.map((row) => {
      const from = splitRecordId(row.from_external_id);
      const to = splitRecordId(row.to_external_id);
      return {
        ...base,
        relationship_key: asText(row.relationship_key) ?? `${from.recordKey}-${to.recordKey}`,
        relationship_type: asText(row.relationship_type) ?? 'related_to',
        from_record_type: from.recordType,
        from_record_key: from.recordKey,
        to_record_type: to.recordType,
        to_record_key: to.recordKey,
        properties: row.properties ?? {},
      };
    }),
  };

  return {
    refreshRun: {
      ...plan.refreshRun,
      id: refreshRunId,
    },
    sources,
    rowsByTable,
  };
}

export async function writeAiControlTowerLoadPlan(plan: AiControlTowerLoadPlan): Promise<AiControlTowerWriteResult> {
  const sb = getAzureWriteFluentClient();
  const errors: AiControlTowerWriteResult['errors'] = [];
  const tables: AiControlTowerWriteResult['tables'] = [];
  const refreshResult = await sb
    .from<{ id: string }[]>('ai_control_refresh_runs')
    .upsert(plan.refreshRun, { onConflict: 'client_id,refresh_run_key' })
    .select('id')
    .maybeSingle<{ id: string }>();

  if (refreshResult.error || !refreshResult.data?.id) {
    return {
      refreshRunId: '',
      tables,
      errors: [{
        table: 'ai_control_refresh_runs',
        message: refreshResult.error?.message ?? 'Refresh run upsert did not return an id.',
      }],
    };
  }

  const refreshRunId = refreshResult.data.id;
  const sourceRows = payloadRows(plan, 'ai_control_sources').map((row) => ({
    client_id: plan.clientId,
    refresh_run_id: refreshRunId,
    source_key: asText(row.source_id) ?? 'unknown-source',
    source_type: asText(row.source_type) ?? 'unknown',
    source_system: asText(row.source_system) ?? 'unknown',
    source_name: asText(row.source_name) ?? asText(row.source_system) ?? 'Unknown source',
    owner_role: asText(row.owner_role),
    cadence: asText(row.cadence),
    data_class: normalizeDataClass(row.data_class),
    period_end: asDate(row.period_end),
    refresh_status: asText(row.refresh_status) ?? 'received',
    payload: row,
  }));

  const sourceResult = await sb
    .from<Array<{ id: string; source_key: string }>>('ai_control_sources')
    .upsert(sourceRows, { onConflict: TABLE_CONFLICTS.ai_control_sources })
    .select('id, source_key');

  if (sourceResult.error) {
    errors.push({ table: 'ai_control_sources', message: sourceResult.error.message });
  }
  tables.push({
    table: 'ai_control_sources',
    rowsAttempted: sourceRows.length,
    rowsCommitted: sourceResult.error ? 0 : sourceRows.length,
  });

  const sourceIdByKey = Object.fromEntries((sourceResult.data ?? []).map((row) => [row.source_key, row.id]));
  const batch = prepareAiControlTowerCommitBatch({ plan, refreshRunId, sourceIdByKey });

  for (const [table, rows] of Object.entries(batch.rowsByTable)) {
    if (rows.length === 0) continue;
    const result = await sb.from(table).upsert(rows, { onConflict: TABLE_CONFLICTS[table] });
    if (result.error) {
      errors.push({ table, message: result.error.message });
    }
    tables.push({
      table,
      rowsAttempted: rows.length,
      rowsCommitted: result.error ? 0 : rows.length,
    });
  }

  return { refreshRunId, tables, errors };
}
