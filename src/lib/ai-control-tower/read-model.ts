import { readFile } from 'node:fs/promises';
import path from 'node:path';

import Papa from 'papaparse';

import { azureRead } from '@/lib/data-plane/azureRead';
import {
  derivedEnterpriseReadToTowerFacts,
  getDerivedEnterpriseReadForTenant,
  type DerivedEnterpriseReadSummary,
} from '@/lib/enterprise-context/derived-enterprise-read';
import type {
  AiControlTowerContextFact,
  AiControlTowerEvidenceStatus,
} from './contracts';

type JsonRecord = Record<string, unknown>;

export type AiControlTowerReadSource =
  | 'ai_control_data_plane'
  | 'first_capital_local_synthetic_fallback'
  | 'empty';

export interface AiControlTowerKpi {
  key: string;
  label: string;
  value: string;
  note: string;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'neutral';
}

export interface AiControlTowerInitiativeRead {
  id: string;
  title: string;
  functionName: string;
  category: string;
  stage: string;
  posture: string;
  owner: string;
  sponsor: string;
  vendor: string;
  system: string;
  personas: string[];
  promisedBenefit: string;
  metric: string;
  baseline: number | null;
  target: number | null;
  committedUsd: number;
  spendUsd: number;
  promisedUsd: number;
  realizedUsd: number;
  realizedPct: number | null;
  confidence: string;
  evidenceState: AiControlTowerEvidenceStatus;
  status: string;
  notes: string;
  risks: string[];
  citations: string[];
}

export interface AiControlTowerUsageRead {
  id: string;
  functionName: string;
  toolName: string;
  vendor: string;
  persona: string;
  seats: number;
  activeUsers: number;
  adoptionPct: number | null;
  monthlySpendUsd: number;
  timeSavingsHours: number | null;
  estimatedBenefitUsd: number;
  blocker: string;
  evidenceState: AiControlTowerEvidenceStatus;
}

export interface AiControlTowerProductivityRead {
  id: string;
  functionName: string;
  persona: string;
  workflow: string;
  metric: string;
  baseline: number | null;
  current: number | null;
  target: number | null;
  unit: string;
  initiativeId: string | null;
  confidence: string;
  evidenceState: AiControlTowerEvidenceStatus;
}

export interface AiControlTowerAgentRead {
  id: string;
  functionName: string;
  vendor: string;
  module: string;
  name: string;
  persona: string;
  workflow: string;
  eligibleVolume: number | null;
  touchedVolume: number | null;
  autoResolvedVolume: number | null;
  deflectionPct: number | null;
  autoResolvePct: number | null;
  cycleTimeBefore: number | null;
  cycleTimeAfter: number | null;
  monthlySpendUsd: number;
  valueUsd: number;
  governance: string;
  notes: string;
  evidenceState: AiControlTowerEvidenceStatus;
}

export interface AiControlTowerSpendRead {
  id: string;
  initiativeId: string | null;
  functionName: string;
  vendor: string;
  product: string;
  spendType: string;
  monthlySpendUsd: number;
  annualizedSpendUsd: number;
  renewalDate: string | null;
  unitMetric: string;
  unitValue: number | null;
  evidenceState: AiControlTowerEvidenceStatus;
  notes: string;
}

export interface AiControlTowerRiskRead {
  id: string;
  initiativeId: string | null;
  functionName: string;
  name: string;
  dimension: string;
  severity: string;
  status: string;
  description: string;
  owner: string;
  requiredAction: string;
  gate: string;
  evidenceState: AiControlTowerEvidenceStatus;
}

export interface AiControlTowerActionRead {
  id: string;
  relatedType: string;
  relatedKey: string;
  posture: string;
  title: string;
  rationale: string;
  owner: string;
  dueDate: string | null;
  status: string;
  evidenceState: AiControlTowerEvidenceStatus;
}

export interface AiControlTowerEvidenceRead {
  id: string;
  recordType: string;
  recordKey: string;
  evidenceType: string;
  citationLabel: string;
  pointer: string;
  evidenceState: AiControlTowerEvidenceStatus;
  confidence: number | null;
}

export interface AiControlTowerFunctionRead {
  name: string;
  initiatives: number;
  activeUsers: number;
  seats: number;
  adoptionPct: number | null;
  spendUsd: number;
  realizedUsd: number;
  promisedUsd: number;
  risks: number;
  actions: number;
  status: 'green' | 'amber' | 'red' | 'blue';
  driver: string;
  blocker: string;
}

export interface AiControlTowerReadModel {
  clientId: string | null;
  clientKey: string | null;
  tenantName: string;
  source: AiControlTowerReadSource;
  sourceDisclosure: string;
  refreshRunId: string | null;
  refreshRunKey: string | null;
  reportingPeriodEnd: string | null;
  rowCounts: Record<string, number>;
  kpis: AiControlTowerKpi[];
  functions: AiControlTowerFunctionRead[];
  initiatives: AiControlTowerInitiativeRead[];
  usage: AiControlTowerUsageRead[];
  productivity: AiControlTowerProductivityRead[];
  agents: AiControlTowerAgentRead[];
  spend: AiControlTowerSpendRead[];
  risks: AiControlTowerRiskRead[];
  actions: AiControlTowerActionRead[];
  evidence: AiControlTowerEvidenceRead[];
  facts: AiControlTowerContextFact[];
  derivedEnterpriseRead?: DerivedEnterpriseReadSummary | null;
}

interface AiControlTowerReadRows {
  refreshRun: JsonRecord | null;
  sources: JsonRecord[];
  initiatives: JsonRecord[];
  usage: JsonRecord[];
  productivity: JsonRecord[];
  dora: JsonRecord[];
  agents: JsonRecord[];
  benefits: JsonRecord[];
  spend: JsonRecord[];
  risks: JsonRecord[];
  actions: JsonRecord[];
  evidence: JsonRecord[];
  facts: JsonRecord[];
}

const EMPTY_ROWS: AiControlTowerReadRows = {
  refreshRun: null,
  sources: [],
  initiatives: [],
  usage: [],
  productivity: [],
  dora: [],
  agents: [],
  benefits: [],
  spend: [],
  risks: [],
  actions: [],
  evidence: [],
  facts: [],
};

function text(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  const stringValue = String(value).trim();
  return stringValue || fallback;
}

function nullableText(value: unknown): string | null {
  const valueText = text(value);
  return valueText || null;
}

function num(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNum(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = num(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateText(value: unknown): string | null {
  const raw = nullableText(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeFunctionName(value: unknown): string {
  const raw = text(value, 'Unassigned');
  const cleaned = raw
    .replace(/^FCF-BF-/i, '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  if (cleaned === 'Tech') return 'Technology';
  if (cleaned === 'Risk') return 'Risk & Compliance';
  if (cleaned === 'Finance') return 'Finance & Accounting';
  if (cleaned === 'Ops') return 'Operations';
  return cleaned;
}

function evidenceState(value: unknown): AiControlTowerEvidenceStatus {
  const state = text(value).toLowerCase();
  if (state === 'retrieval_verified' || state === 'retrieval_proven') return 'retrieval_proven';
  if (state === 'review_required' || state === 'low_confidence') return 'review_required';
  if (state === 'missing' || state === 'rejected') return 'missing';
  return 'committed';
}

function pct(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 100);
}

function money(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function toneForEvidence(count: number): AiControlTowerKpi['tone'] {
  return count > 0 ? 'green' : 'red';
}

function arrayFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean);
  const raw = text(value);
  if (!raw) return [];
  return raw.split(/[|,;]/).map((item) => item.trim()).filter(Boolean);
}

function lowerIncludes(value: string, needle: string): boolean {
  return value.toLowerCase().includes(needle.toLowerCase());
}

async function safeSelect(table: string, refreshRunId: string): Promise<JsonRecord[]> {
  return azureRead.select<JsonRecord>({
    table,
    where: { refresh_run_id: refreshRunId },
    missingTable: 'empty',
  }).catch(() => []);
}

async function readDataPlaneRows(args: {
  clientId?: string | null;
  clientKey?: string | null;
}): Promise<AiControlTowerReadRows> {
  const where: Record<string, string> | null = args.clientId
    ? { client_id: args.clientId }
    : args.clientKey
      ? { client_key: args.clientKey }
      : null;
  if (!where) return EMPTY_ROWS;

  const refreshRun = await azureRead
    .maybeSingle<JsonRecord>({
      table: 'ai_control_refresh_runs',
      where,
      orderBy: { column: 'reporting_period_end', direction: 'desc', nulls: 'last' },
      missingTable: 'empty',
    })
    .catch(() => null);
  const refreshRunId = text(refreshRun?.id);
  if (!refreshRunId) return EMPTY_ROWS;

  const [
    sources,
    initiatives,
    usage,
    productivity,
    dora,
    agents,
    benefits,
    spend,
    risks,
    actions,
    evidence,
    facts,
  ] = await Promise.all([
    safeSelect('ai_control_sources', refreshRunId),
    safeSelect('ai_control_initiatives', refreshRunId),
    safeSelect('ai_control_tool_usage_monthly', refreshRunId),
    safeSelect('ai_control_persona_productivity', refreshRunId),
    safeSelect('ai_control_dora_metrics', refreshRunId),
    safeSelect('ai_control_agent_outcomes', refreshRunId),
    safeSelect('ai_control_benefit_realization', refreshRunId),
    safeSelect('ai_control_spend_contracts', refreshRunId),
    safeSelect('ai_control_risk_governance', refreshRunId),
    safeSelect('ai_control_actions', refreshRunId),
    safeSelect('ai_control_evidence_items', refreshRunId),
    safeSelect('ai_control_context_facts', refreshRunId),
  ]);

  return {
    refreshRun,
    sources,
    initiatives,
    usage,
    productivity,
    dora,
    agents,
    benefits,
    spend,
    risks,
    actions,
    evidence,
    facts,
  };
}

function fallbackAllowed(clientKey: string | null | undefined, tenantName: string | null | undefined): boolean {
  const probe = `${clientKey ?? ''} ${tenantName ?? ''}`.toLowerCase();
  return probe.includes('first') || probe.includes('capital');
}

const FIRST_CAPITAL_TOWER_FALLBACK_ROOT = path.join(
  process.cwd(),
  'datasets',
  'first-capital-financial-synthetic-v2',
);

async function parseFirstCapitalFallbackCsv(relativePath: string): Promise<JsonRecord[]> {
  const absolute = path.join(FIRST_CAPITAL_TOWER_FALLBACK_ROOT, relativePath);
  const csv = await readFile(absolute, 'utf8');
  const parsed = Papa.parse<JsonRecord>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return parsed.data.filter((row) => Object.values(row).some((value) => text(value)));
}

async function readFirstCapitalFallbackRows(): Promise<AiControlTowerReadRows> {
  try {
    const [
      initiatives,
      benefits,
      usage,
      agents,
      serviceNow,
      scorecard,
      modelRisks,
      spend,
      risks,
      gates,
    ] = await Promise.all([
      parseFirstCapitalFallbackCsv('06-initiatives/initiatives.csv').catch(() => []),
      parseFirstCapitalFallbackCsv('ai-control-tower/T02_benefit-realization.csv'),
      parseFirstCapitalFallbackCsv('ai-control-tower/T03_copilot-adoption-by-function.csv'),
      parseFirstCapitalFallbackCsv('ai-control-tower/T04_erp-platform-agents.csv'),
      parseFirstCapitalFallbackCsv('ai-control-tower/T05_servicenow-automation-metrics.csv'),
      parseFirstCapitalFallbackCsv('ai-control-tower/T06_function-ai-productivity-scorecard.csv'),
      parseFirstCapitalFallbackCsv('ai-control-tower/T07_model-risk-inventory.csv'),
      parseFirstCapitalFallbackCsv('ai-control-tower/T08_ai-spend-by-initiative.csv'),
      parseFirstCapitalFallbackCsv('ai-control-tower/T09_ai-risk-register.csv'),
      parseFirstCapitalFallbackCsv('ai-control-tower/T10_gate-approval-history.csv'),
    ]);

    const initiativeRows = initiatives.map((row) => ({
      initiative_key: text(row.initiative_id ?? row.id),
      initiative_name: text(row.title ?? row.initiative_name ?? row.name),
      category: text(row.type ?? row.category ?? row.theme),
      stage: text(row.stage ?? row.status),
      business_owner_role: text(row.owner_role ?? row.owner ?? row.sponsor_role),
      executive_sponsor_role: text(row.sponsor_role ?? row.executive_sponsor_role),
      vendor: text(row.vendor),
      tool_or_system: text(row.system_id ?? row.tool_or_system),
      impacted_personas: arrayFromUnknown(row.impacted_personas),
      promised_benefit: text(row.promised_benefit ?? row.description),
      target_metric_key: text(row.target_metric_key ?? row.metric),
      status_flag: text(row.posture ?? row.status_flag ?? row.status),
      payload: row,
    }));

    const benefitRows = benefits.map((row) => ({
      benefit_key: `${text(row.initiative_id)}-${text(row.benefit_category)}`,
      initiative_key: text(row.initiative_id),
      benefit_name: text(row.benefit_category),
      metric_key: text(row.benefit_category),
      promised_annual_value_usd: num(row.projected_roi_usd || row.committed_roi_usd),
      realized_annual_value_usd: num(row.realized_ytd_usd),
      confidence: text(row.evidence_quality).toLowerCase(),
      readiness_state: text(row.realizaton_status ?? row.realization_status),
      evidence_state: text(row.evidence_quality).toLowerCase() === 'low' ? 'review_required' : 'received',
      payload: row,
    }));

    const usageRows = usage.map((row) => ({
      tool_key: `${text(row.function_id)}-${text(row.copilot_product)}`,
      tool_name: text(row.copilot_product),
      vendor: lowerIncludes(text(row.copilot_product), 'github') ? 'GitHub' : 'Microsoft',
      user_group_or_team: normalizeFunctionName(row.function_name),
      persona: normalizeFunctionName(row.function_name),
      licensed_seats: num(row.seats_allocated),
      active_users: num(row.seats_active),
      utilization_pct: num(row.adoption_pct),
      monthly_spend_usd: 0,
      evidence_state: text(row.evidence_quality).toLowerCase() === 'low' ? 'review_required' : 'received',
      payload: row,
    }));

    const agentRows = [
      ...agents.map((row) => ({
        agent_key: text(row.agent_id),
        vendor: text(row.vendor),
        module: text(row.capability_type),
        agent_name: text(row.agent_name),
        persona: normalizeFunctionName(row.business_function),
        workflow: text(row.capability_type),
        eligible_volume: num(row.active_users),
        ai_touched_volume: num(row.active_users),
        auto_resolved_volume: null,
        monthly_spend_usd: num(row.monthly_cost_incremental_usd),
        evidence_state: text(row.model_risk_assessed).toLowerCase() === 'false' ? 'review_required' : 'received',
        payload: row,
      })),
      ...serviceNow.map((row) => ({
        agent_key: text(row.workflow_id),
        vendor: 'ServiceNow',
        module: text(row.workflow_type),
        agent_name: text(row.workflow_name),
        persona: normalizeFunctionName(row.business_function),
        workflow: text(row.workflow_name),
        eligible_volume: num(row.monthly_volume_tickets),
        ai_touched_volume: num(row.monthly_volume_tickets) * (num(row.ai_deflection_rate_pct) / 100),
        auto_resolved_volume: num(row.monthly_volume_tickets) * (num(row.auto_resolve_rate_pct) / 100),
        cycle_time_before: num(row.avg_mttr_before_hrs),
        cycle_time_after: num(row.avg_mttr_after_hrs),
        monthly_spend_usd: 0,
        evidence_state: 'received',
        payload: row,
      })),
    ];

    const productivityRows = scorecard.map((row) => ({
      persona_key: text(row.function_id),
      persona_name: normalizeFunctionName(row.function_name),
      function_name: normalizeFunctionName(row.function_name),
      workflow: 'AI productivity scorecard',
      metric_key: 'benefit_realization',
      unit: 'percent',
      baseline_value: 0,
      current_value: num(row.realization_pct),
      target_value: 100,
      confidence: text(row.tower_rag_status).toLowerCase() === 'green' ? 'high' : 'medium',
      evidence_state: text(row.tower_rag_status).toLowerCase() === 'red' ? 'review_required' : 'received',
      payload: row,
    }));

    const spendRows = spend.map((row) => ({
      spend_key: text(row.initiative_id),
      initiative_key: text(row.initiative_id),
      vendor: 'Mixed',
      product_or_service: text(row.title),
      spend_type: text(row.posture),
      monthly_spend_usd: num(row.ytd_actuals_usd) / 12,
      annualized_spend_usd: num(row.fy26_budget_usd),
      renewal_date: null,
      evidence_state: 'received',
      payload: row,
    }));

    const riskRows = [
      ...risks.map((row) => ({
        risk_key: text(row.risk_id),
        initiative_key: text(row.linked_initiative_id),
        dimension: text(row.risk_type),
        severity: text(row.impact).toLowerCase() === 'critical' ? 'critical' : text(row.impact).toLowerCase(),
        status: text(row.status),
        risk_description: text(row.notes || row.risk_name),
        owner_role: text(row.owner_role),
        required_action: text(row.regulatory_implication),
        governance_gate: text(row.control_adequacy).toLowerCase().includes('inadequate') ? 'fail' : 'partial',
        evidence_state: 'review_required',
        payload: row,
      })),
      ...modelRisks
        .filter((row) => text(row.validation_status).toLowerCase() !== 'current')
        .map((row) => ({
          risk_key: text(row.model_id),
          initiative_key: '',
          dimension: 'model_risk',
          severity: text(row.sr117_tier).toLowerCase() === 'tier_1' ? 'critical' : 'high',
          status: text(row.validation_status),
          risk_description: `${text(row.model_name)} validation status: ${text(row.validation_status)}.`,
          owner_role: 'Chief Model Risk Officer',
          required_action: 'Schedule SR 11-7 validation or remove from decisioning path.',
          governance_gate: 'fail',
          evidence_state: 'review_required',
          payload: row,
        })),
    ];

    const actionRows = gates
      .filter((row) => text(row.decision).toLowerCase() !== 'approved' || text(row.conditions))
      .slice(0, 10)
      .map((row) => ({
        action_key: text(row.gate_id),
        related_record_type: 'initiative',
        related_record_key: text(row.initiative_id),
        posture: text(row.decision).toLowerCase() === 'approved' ? 'monitor' : 'hold',
        title: `${text(row.gate_name)} follow-up`,
        rationale: text(row.conditions, 'Gate needs named owner and evidence before next steering decision.'),
        owner_role: text(row.approved_by_role),
        due_date: dateText(row.next_gate_target_date),
        status: 'proposed',
        evidence_state: 'review_required',
        payload: row,
      }));

    const evidenceRows = [
      ...benefits.map((row, index) => ({
        evidence_key: `T02-${index + 2}`,
        record_type: 'benefit_realization',
        record_key: text(row.initiative_id),
        evidence_type: 'csv_row',
        citation_label: `T02 benefit realization row ${index + 2}`,
        evidence_pointer: text(row.evidence_source),
        evidence_state: text(row.evidence_quality).toLowerCase() === 'low' ? 'review_required' : 'received',
        confidence: text(row.evidence_quality).toLowerCase() === 'high' ? 0.92 : 0.68,
      })),
      ...spend.map((row, index) => ({
        evidence_key: `T08-${index + 2}`,
        record_type: 'spend_contract',
        record_key: text(row.initiative_id),
        evidence_type: 'csv_row',
        citation_label: `T08 spend row ${index + 2}`,
        evidence_pointer: 'ai spend by initiative',
        evidence_state: 'received',
        confidence: 0.84,
      })),
    ];

    const factRows = [
      ...benefitRows.map((row) => ({
        id: `fact-benefit-${row.benefit_key}`,
        record_type: 'benefit_realization',
        record_key: row.initiative_key,
        fact_key: 'benefit_realization_usd',
        fact_type: 'money',
        fact_text: `${row.initiative_key} has ${money(num(row.realized_annual_value_usd))} realized against ${money(num(row.promised_annual_value_usd))} promised.`,
        confidence: row.confidence === 'high' ? 0.9 : 0.62,
        evidence_state: row.evidence_state,
        evidence_keys: [`T02-${row.initiative_key}`],
      })),
      ...riskRows.map((row) => ({
        id: `fact-risk-${row.risk_key}`,
        record_type: 'risk_governance',
        record_key: text(row.initiative_key || row.risk_key),
        fact_key: 'review_required_count',
        fact_type: 'risk',
        fact_text: `${row.risk_description} Required action: ${row.required_action}`,
        confidence: 0.72,
        evidence_state: row.evidence_state,
        evidence_keys: [`T09-${row.risk_key}`],
      })),
    ];

    return {
      refreshRun: {
        id: 'first-capital-local-synthetic-v2',
        refresh_run_key: 'first-capital-v2-local-fallback',
        reporting_period_end: '2026-05-31',
        client_key: 'firstcapital',
      },
      sources: [],
      initiatives: initiativeRows,
      usage: usageRows,
      productivity: productivityRows,
      dora: [],
      agents: agentRows,
      benefits: benefitRows,
      spend: spendRows,
      risks: riskRows,
      actions: actionRows,
      evidence: evidenceRows,
      facts: factRows,
    };
  } catch {
    return EMPTY_ROWS;
  }
}

function firstByKey(rows: JsonRecord[], key: string): Map<string, JsonRecord> {
  const map = new Map<string, JsonRecord>();
  for (const row of rows) {
    const rowKey = text(row[key]);
    if (rowKey && !map.has(rowKey)) map.set(rowKey, row);
  }
  return map;
}

function manyByKey(rows: JsonRecord[], key: string): Map<string, JsonRecord[]> {
  const map = new Map<string, JsonRecord[]>();
  for (const row of rows) {
    const rowKey = text(row[key]);
    if (!rowKey) continue;
    const next = map.get(rowKey) ?? [];
    next.push(row);
    map.set(rowKey, next);
  }
  return map;
}

function buildInitiatives(rows: AiControlTowerReadRows): AiControlTowerInitiativeRead[] {
  const benefits = manyByKey(rows.benefits, 'initiative_key');
  const spend = manyByKey(rows.spend, 'initiative_key');
  const risks = manyByKey(rows.risks, 'initiative_key');
  const evidence = manyByKey(rows.evidence, 'record_key');

  const keys = new Set<string>([
    ...rows.initiatives.map((row) => text(row.initiative_key)).filter(Boolean),
    ...rows.benefits.map((row) => text(row.initiative_key)).filter(Boolean),
    ...rows.spend.map((row) => text(row.initiative_key)).filter(Boolean),
    ...rows.risks.map((row) => text(row.initiative_key)).filter(Boolean),
  ]);
  const initiativeByKey = firstByKey(rows.initiatives, 'initiative_key');

  return [...keys].map((id) => {
    const row = initiativeByKey.get(id) ?? {};
    const benefitRows = benefits.get(id) ?? [];
    const spendRows = spend.get(id) ?? [];
    const riskRows = risks.get(id) ?? [];
    const evidenceRows = evidence.get(id) ?? [];
    const rowPayload = row.payload && typeof row.payload === 'object' ? (row.payload as JsonRecord) : {};
    const firstBenefitPayload = benefitRows[0]?.payload && typeof benefitRows[0]?.payload === 'object'
      ? (benefitRows[0]?.payload as JsonRecord)
      : {};
    const promisedUsd = benefitRows.reduce((sum, item) => sum + num(item.promised_annual_value_usd), 0);
    const realizedUsd = benefitRows.reduce((sum, item) => sum + num(item.realized_annual_value_usd), 0);
    const spendUsd = spendRows.reduce((sum, item) => sum + num(item.annualized_spend_usd), 0);
    const committedUsd = Math.max(spendUsd, promisedUsd ? promisedUsd / 3 : 0, num(row.committed_usd));
    const functionName = normalizeFunctionName(
      row.function_name ??
        row.business_function ??
        rowPayload.business_function,
    );
    const fallbackTitle = text(spendRows[0]?.product_or_service || benefitRows[0]?.benefit_name || id);
    const confidence = text(benefitRows[0]?.confidence, text(row.confidence, 'medium')).toLowerCase();
    return {
      id,
      title: text(row.initiative_name, fallbackTitle),
      functionName,
      category: text(row.category, 'AI initiative'),
      stage: text(row.stage, 'portfolio'),
      posture: text(row.status_flag, text(spendRows[0]?.spend_type, 'review')),
      owner: text(row.business_owner_role, 'Unassigned owner'),
      sponsor: text(row.executive_sponsor_role, text(row.business_owner_role, 'Unassigned sponsor')),
      vendor: text(row.vendor, text(spendRows[0]?.vendor, 'Mixed')),
      system: text(row.tool_or_system, text(spendRows[0]?.product_or_service, 'Portfolio')),
      personas: arrayFromUnknown(row.impacted_personas),
      promisedBenefit: text(row.promised_benefit, text(benefitRows[0]?.benefit_name, 'Benefit lineage required')),
      metric: text(row.target_metric_key, text(benefitRows[0]?.metric_key, 'benefit_realization_usd')),
      baseline: nullableNum(row.baseline_value ?? benefitRows[0]?.baseline_value),
      target: nullableNum(row.target_value ?? benefitRows[0]?.target_value),
      committedUsd,
      spendUsd,
      promisedUsd,
      realizedUsd,
      realizedPct: promisedUsd ? pct(realizedUsd, promisedUsd) : nullableNum(benefitRows[0]?.realization_pct),
      confidence,
      evidenceState: evidenceState(benefitRows[0]?.evidence_state ?? evidenceRows[0]?.evidence_state),
      status: text(benefitRows[0]?.readiness_state, text(row.status_flag, 'watch')),
      notes: text(row.notes ?? firstBenefitPayload.notes),
      risks: riskRows.map((risk) => text(risk.risk_description)).filter(Boolean),
      citations: evidenceRows.map((item) => text(item.evidence_key || item.citation_label)).filter(Boolean),
    };
  });
}

function buildUsage(rows: JsonRecord[]): AiControlTowerUsageRead[] {
  return rows.map((row) => ({
    id: text(row.tool_key, text(row.id)),
    functionName: normalizeFunctionName(row.user_group_or_team ?? row.function_name ?? row.persona),
    toolName: text(row.tool_name),
    vendor: text(row.vendor),
    persona: text(row.persona, normalizeFunctionName(row.user_group_or_team)),
    seats: num(row.licensed_seats),
    activeUsers: num(row.active_users),
    adoptionPct: nullableNum(row.utilization_pct),
    monthlySpendUsd: num(row.monthly_spend_usd),
    timeSavingsHours: nullableNum(row.payload && typeof row.payload === 'object'
      ? (row.payload as JsonRecord).verified_time_savings_hrs_per_fte_month
      : null),
    estimatedBenefitUsd: num(row.payload && typeof row.payload === 'object'
      ? (row.payload as JsonRecord).estimated_benefit_usd_annual
      : 0),
    blocker: text(row.payload && typeof row.payload === 'object' ? (row.payload as JsonRecord).blocker : ''),
    evidenceState: evidenceState(row.evidence_state),
  }));
}

function buildProductivity(rows: AiControlTowerReadRows): AiControlTowerProductivityRead[] {
  const personaRows = rows.productivity.map((row) => ({
    id: text(row.persona_key, text(row.id)),
    functionName: normalizeFunctionName(row.function_name ?? row.persona_name),
    persona: text(row.persona_name),
    workflow: text(row.workflow),
    metric: text(row.metric_key),
    baseline: nullableNum(row.baseline_value),
    current: nullableNum(row.current_value),
    target: nullableNum(row.target_value),
    unit: text(row.unit),
    initiativeId: nullableText(row.initiative_key),
    confidence: text(row.confidence, 'medium'),
    evidenceState: evidenceState(row.evidence_state),
  }));
  const doraRows = rows.dora.map((row) => ({
    id: `${text(row.team)}-${text(row.repo)}`,
    functionName: 'Technology',
    persona: text(row.team),
    workflow: text(row.repo),
    metric: 'developer_lead_time_delta',
    baseline: nullableNum(row.lead_time_hours_before),
    current: nullableNum(row.lead_time_hours_after),
    target: null,
    unit: 'hours',
    initiativeId: nullableText(row.tool_key),
    confidence: 'medium',
    evidenceState: evidenceState(row.evidence_state),
  }));
  return [...personaRows, ...doraRows];
}

function buildAgents(rows: JsonRecord[]): AiControlTowerAgentRead[] {
  return rows.map((row) => {
    const eligible = nullableNum(row.eligible_volume);
    const touched = nullableNum(row.ai_touched_volume);
    const resolved = nullableNum(row.auto_resolved_volume);
    return {
      id: text(row.agent_key, text(row.id)),
      functionName: normalizeFunctionName(row.function_name ?? row.persona ?? row.business_function),
      vendor: text(row.vendor),
      module: text(row.module),
      name: text(row.agent_name),
      persona: text(row.persona),
      workflow: text(row.workflow),
      eligibleVolume: eligible,
      touchedVolume: touched,
      autoResolvedVolume: resolved,
      deflectionPct: eligible && touched !== null ? pct(touched, eligible) : nullableNum(row.deflection_rate_pct),
      autoResolvePct: eligible && resolved !== null ? pct(resolved, eligible) : nullableNum(row.auto_resolve_rate_pct),
      cycleTimeBefore: nullableNum(row.cycle_time_before),
      cycleTimeAfter: nullableNum(row.cycle_time_after),
      monthlySpendUsd: num(row.monthly_spend_usd),
      valueUsd: num(row.monthly_cost_avoided_usd) * 12,
      governance: text(row.payload && typeof row.payload === 'object'
        ? (row.payload as JsonRecord).model_risk_assessed
        : row.evidence_state),
      notes: text(row.payload && typeof row.payload === 'object' ? (row.payload as JsonRecord).notes : ''),
      evidenceState: evidenceState(row.evidence_state),
    };
  });
}

function buildSpend(rows: JsonRecord[], initiatives: AiControlTowerInitiativeRead[]): AiControlTowerSpendRead[] {
  const initiativeByKey = new Map(initiatives.map((initiative) => [initiative.id, initiative]));
  return rows.map((row) => {
    const initiativeId = nullableText(row.initiative_key);
    return {
      id: text(row.spend_key, text(row.id)),
      initiativeId,
      functionName: initiativeId ? initiativeByKey.get(initiativeId)?.functionName ?? 'Unassigned' : 'Unassigned',
      vendor: text(row.vendor),
      product: text(row.product_or_service),
      spendType: text(row.spend_type),
      monthlySpendUsd: num(row.monthly_spend_usd),
      annualizedSpendUsd: num(row.annualized_spend_usd),
      renewalDate: dateText(row.renewal_date),
      unitMetric: text(row.unit_economics_metric),
      unitValue: nullableNum(row.unit_economics_value),
      evidenceState: evidenceState(row.evidence_state),
      notes: text(row.payload && typeof row.payload === 'object' ? (row.payload as JsonRecord).notes : ''),
    };
  });
}

function buildRisks(rows: JsonRecord[], initiatives: AiControlTowerInitiativeRead[]): AiControlTowerRiskRead[] {
  const initiativeByKey = new Map(initiatives.map((initiative) => [initiative.id, initiative]));
  return rows.map((row) => {
    const initiativeId = nullableText(row.initiative_key);
    const payload = row.payload && typeof row.payload === 'object' ? (row.payload as JsonRecord) : {};
    return {
      id: text(row.risk_key, text(row.id)),
      initiativeId,
      functionName: normalizeFunctionName(payload.business_function ?? initiativeByKey.get(initiativeId ?? '')?.functionName),
      name: text(payload.risk_name, text(row.dimension)),
      dimension: text(row.dimension),
      severity: text(row.severity),
      status: text(row.status),
      description: text(row.risk_description),
      owner: text(row.owner_role),
      requiredAction: text(row.required_action),
      gate: text(row.governance_gate),
      evidenceState: evidenceState(row.evidence_state),
    };
  });
}

function buildActions(rows: JsonRecord[]): AiControlTowerActionRead[] {
  return rows.map((row) => ({
    id: text(row.action_key, text(row.id)),
    relatedType: text(row.related_record_type),
    relatedKey: text(row.related_record_key),
    posture: text(row.posture),
    title: text(row.title),
    rationale: text(row.rationale),
    owner: text(row.owner_role),
    dueDate: dateText(row.due_date),
    status: text(row.status),
    evidenceState: evidenceState(row.evidence_state),
  }));
}

function buildEvidence(rows: JsonRecord[]): AiControlTowerEvidenceRead[] {
  return rows.map((row) => ({
    id: text(row.evidence_key, text(row.id)),
    recordType: text(row.record_type),
    recordKey: text(row.record_key),
    evidenceType: text(row.evidence_type),
    citationLabel: text(row.citation_label),
    pointer: text(row.evidence_pointer),
    evidenceState: evidenceState(row.evidence_state),
    confidence: nullableNum(row.confidence),
  }));
}

function buildFacts(rows: JsonRecord[], clientId: string | null, refreshRunId: string | null): AiControlTowerContextFact[] {
  return rows.map((row, index) => ({
    factId: text(row.id, `fact-${index}`),
    clientId: clientId ?? 'unknown-client',
    refreshRunId: refreshRunId ?? 'unknown-refresh',
    recordType: text(row.record_type),
    recordKey: text(row.record_key),
    factKey: text(row.fact_key),
    factType: text(row.fact_type),
    factText: text(row.fact_text),
    confidence: nullableNum(row.confidence),
    evidenceStatus: evidenceState(row.evidence_state),
    evidenceIds: arrayFromUnknown(row.evidence_keys),
  }));
}

function buildFunctions(args: {
  initiatives: AiControlTowerInitiativeRead[];
  usage: AiControlTowerUsageRead[];
  spend: AiControlTowerSpendRead[];
  risks: AiControlTowerRiskRead[];
  actions: AiControlTowerActionRead[];
}): AiControlTowerFunctionRead[] {
  const names = new Set<string>([
    ...args.initiatives.map((row) => row.functionName),
    ...args.usage.map((row) => row.functionName),
    ...args.spend.map((row) => row.functionName),
    ...args.risks.map((row) => row.functionName),
  ].filter(Boolean));

  return [...names].sort().map((name) => {
    const initiatives = args.initiatives.filter((row) => row.functionName === name);
    const usage = args.usage.filter((row) => row.functionName === name);
    const spendRows = args.spend.filter((row) => row.functionName === name);
    const risks = args.risks.filter((row) => row.functionName === name);
    const seats = usage.reduce((sum, row) => sum + row.seats, 0);
    const activeUsers = usage.reduce((sum, row) => sum + row.activeUsers, 0);
    const spendUsd =
      spendRows.reduce((sum, row) => sum + row.annualizedSpendUsd, 0) ||
      usage.reduce((sum, row) => sum + row.monthlySpendUsd * 12, 0);
    const realizedUsd =
      initiatives.reduce((sum, row) => sum + row.realizedUsd, 0) ||
      usage.reduce((sum, row) => sum + row.estimatedBenefitUsd, 0);
    const promisedUsd = initiatives.reduce((sum, row) => sum + row.promisedUsd, 0);
    const redRiskCount = risks.filter((risk) => ['critical', 'high'].includes(risk.severity.toLowerCase())).length;
    const status: AiControlTowerFunctionRead['status'] =
      redRiskCount > 0 ? 'red' : spendUsd > 0 && realizedUsd === 0 ? 'amber' : activeUsers > 0 ? 'green' : 'blue';
    return {
      name,
      initiatives: initiatives.length,
      activeUsers,
      seats,
      adoptionPct: pct(activeUsers, seats),
      spendUsd,
      realizedUsd,
      promisedUsd,
      risks: redRiskCount,
      actions: args.actions.filter((action) => initiatives.some((initiative) => initiative.id === action.relatedKey)).length,
      status,
      driver:
        initiatives.sort((a, b) => b.realizedUsd - a.realizedUsd)[0]?.title ??
        usage.sort((a, b) => b.estimatedBenefitUsd - a.estimatedBenefitUsd)[0]?.toolName ??
        'No driver loaded',
      blocker: risks[0]?.description ?? 'No active blocker loaded',
    };
  });
}

function buildKpis(args: {
  initiatives: AiControlTowerInitiativeRead[];
  usage: AiControlTowerUsageRead[];
  spend: AiControlTowerSpendRead[];
  evidence: AiControlTowerEvidenceRead[];
  risks: AiControlTowerRiskRead[];
}): AiControlTowerKpi[] {
  const promised = args.initiatives.reduce((sum, row) => sum + row.promisedUsd, 0);
  const realized = args.initiatives.reduce((sum, row) => sum + row.realizedUsd, 0);
  const spend = args.spend.reduce((sum, row) => sum + row.annualizedSpendUsd, 0) ||
    args.usage.reduce((sum, row) => sum + row.monthlySpendUsd * 12, 0);
  const seats = args.usage.reduce((sum, row) => sum + row.seats, 0);
  const active = args.usage.reduce((sum, row) => sum + row.activeUsers, 0);
  const redRisks = args.risks.filter((risk) => ['critical', 'high'].includes(risk.severity.toLowerCase())).length;
  const evidenceGood = args.evidence.filter((item) => item.evidenceState === 'committed' || item.evidenceState === 'retrieval_proven').length;

  return [
    {
      key: 'initiatives',
      label: 'Observed initiatives',
      value: String(args.initiatives.length),
      note: `${redRisks} governance / evidence pressures`,
      tone: 'blue',
    },
    {
      key: 'value',
      label: 'Measured value',
      value: money(realized),
      note: promised ? `${pct(realized, promised) ?? 0}% of promised value` : 'promised value not loaded',
      tone: realized > 0 && evidenceGood > 0 ? 'green' : 'amber',
    },
    {
      key: 'spend',
      label: 'AI spend exposure',
      value: money(spend),
      note: `${args.spend.length} committed spend rows`,
      tone: spend > 0 ? 'amber' : 'red',
    },
    {
      key: 'adoption',
      label: 'Active adoption',
      value: `${pct(active, seats) ?? 0}%`,
      note: `${active.toLocaleString()} active of ${seats.toLocaleString()} seats`,
      tone: active > 0 ? 'green' : 'red',
    },
    {
      key: 'evidence',
      label: 'Evidence posture',
      value: String(evidenceGood),
      note: `${args.evidence.length} evidence rows tracked`,
      tone: toneForEvidence(evidenceGood),
    },
  ];
}

function buildModel(args: {
  rows: AiControlTowerReadRows;
  clientId: string | null;
  clientKey: string | null;
  tenantName: string;
  source: AiControlTowerReadSource;
  derivedEnterpriseRead?: DerivedEnterpriseReadSummary | null;
}): AiControlTowerReadModel {
  const refreshRunId = text(args.rows.refreshRun?.id) || null;
  const initiatives = buildInitiatives(args.rows);
  const usage = buildUsage(args.rows.usage);
  const productivity = buildProductivity(args.rows);
  const agents = buildAgents(args.rows.agents);
  const spend = buildSpend(args.rows.spend, initiatives);
  const risks = buildRisks(args.rows.risks, initiatives);
  const actions = buildActions(args.rows.actions);
  const evidence = buildEvidence(args.rows.evidence);
  const facts = [
    ...derivedEnterpriseReadToTowerFacts({
      read: args.derivedEnterpriseRead ?? null,
      clientId: args.clientId,
      refreshRunId,
    }),
    ...buildFacts(args.rows.facts, args.clientId, refreshRunId),
  ];
  const functions = buildFunctions({ initiatives, usage, spend, risks, actions });
  const kpis = buildKpis({ initiatives, usage, spend, evidence, risks });
  const rowCounts = {
    refreshRuns: args.rows.refreshRun ? 1 : 0,
    sources: args.rows.sources.length,
    initiatives: initiatives.length,
    usage: usage.length,
    productivity: productivity.length,
    dora: args.rows.dora.length,
    agents: agents.length,
    benefits: args.rows.benefits.length,
    spend: spend.length,
    risks: risks.length,
    actions: actions.length,
    evidence: evidence.length,
    facts: facts.length,
  };
  const sourceDisclosure =
    args.source === 'ai_control_data_plane'
      ? 'Read from committed AI Control Tower data-plane tables.'
      : args.source === 'first_capital_local_synthetic_fallback'
        ? 'No committed AI Control Tower rows were found for this tenant in this session, so the page is using the packaged First Capital v2 synthetic substrate as a clearly labeled demo fallback.'
        : 'No AI Control Tower substrate was found for this tenant.';

  return {
    clientId: args.clientId,
    clientKey: args.clientKey,
    tenantName: args.tenantName,
    source: args.source,
    sourceDisclosure,
    refreshRunId,
    refreshRunKey: text(args.rows.refreshRun?.refresh_run_key) || null,
    reportingPeriodEnd: dateText(args.rows.refreshRun?.reporting_period_end),
    rowCounts,
    kpis,
    functions,
    initiatives,
    usage,
    productivity,
    agents,
    spend,
    risks,
    actions,
    evidence,
    facts,
    derivedEnterpriseRead: args.derivedEnterpriseRead ?? null,
  };
}

export function emptyAiControlTowerReadModel(args: {
  clientId?: string | null;
  clientKey?: string | null;
  tenantName?: string | null;
} = {}): AiControlTowerReadModel {
  return buildModel({
    rows: EMPTY_ROWS,
    clientId: args.clientId ?? null,
    clientKey: args.clientKey ?? null,
    tenantName: args.tenantName ?? 'AbarVa Client',
    source: 'empty',
    derivedEnterpriseRead: null,
  });
}

export async function getAiControlTowerReadModel(args: {
  clientId?: string | null;
  clientKey?: string | null;
  tenantName?: string | null;
}): Promise<AiControlTowerReadModel> {
  const derivedEnterpriseRead = await getDerivedEnterpriseReadForTenant(args.clientKey ?? args.tenantName);
  const rows = await readDataPlaneRows({
    clientId: args.clientId,
    clientKey: args.clientKey,
  });
  const hasDataPlaneRows = Boolean(rows.refreshRun) &&
    (rows.initiatives.length > 0 || rows.usage.length > 0 || rows.benefits.length > 0 || rows.spend.length > 0);
  if (hasDataPlaneRows) {
    return buildModel({
      rows,
      clientId: args.clientId ?? text(rows.refreshRun?.client_id) ?? null,
      clientKey: args.clientKey ?? text(rows.refreshRun?.client_key) ?? null,
      tenantName: args.tenantName ?? 'AbarVa Client',
      source: 'ai_control_data_plane',
      derivedEnterpriseRead,
    });
  }

  if (fallbackAllowed(args.clientKey, args.tenantName)) {
    const fallbackRows = await readFirstCapitalFallbackRows();
    if (fallbackRows.initiatives.length > 0 || fallbackRows.benefits.length > 0) {
      return buildModel({
        rows: fallbackRows,
        clientId: args.clientId ?? null,
        clientKey: args.clientKey ?? 'firstcapital',
        tenantName: args.tenantName ?? 'First Capital Financial',
        source: 'first_capital_local_synthetic_fallback',
        derivedEnterpriseRead,
      });
    }
  }

  return buildModel({
    rows: EMPTY_ROWS,
    clientId: args.clientId ?? null,
    clientKey: args.clientKey ?? null,
    tenantName: args.tenantName ?? 'AbarVa Client',
    source: 'empty',
    derivedEnterpriseRead,
  });
}
