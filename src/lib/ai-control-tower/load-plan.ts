import {
  AI_CONTROL_TOWER_REQUIRED_SHEETS,
  AI_CONTROL_TOWER_SHEET_CONTRACTS,
  normalizeAiControlHeader,
  type AiControlTowerEvidenceStatus,
} from './contracts';

type JsonRecord = Record<string, unknown>;

export interface AiControlTowerCanonicalPackage {
  package_id?: string;
  generated_at?: string;
  client?: {
    client_reference?: string;
    client_display_name?: string;
    reporting_period_start?: string;
    reporting_period_end?: string;
    template_version?: string;
  };
  sheets?: Record<string, JsonRecord[]>;
  load_target?: {
    context_records?: JsonRecord[];
    context_facts?: JsonRecord[];
    context_relationships?: JsonRecord[];
    context_evidence?: JsonRecord[];
  };
}

export interface AiControlTowerLoadDiagnostic {
  level: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  sheetName?: string;
}

export interface AiControlTowerDerivedActionRow extends JsonRecord {
  action_key: string;
  related_record_type: string;
  related_record_key: string;
  posture: 'scale' | 'freeze' | 'hold' | 'prove' | 'assign_owner' | 'monitor';
  title: string;
  rationale: string;
  owner_role: string | null;
  due_date: string | null;
  status: 'proposed';
  evidence_state: 'review_required' | 'usable';
  payload: {
    source: 'system_derived';
    derivation_rule: string;
    source_sheet: string;
    source_record: JsonRecord;
  };
}

interface AiControlTowerDerivedActionDraft {
  action_key: string;
  related_record_type: string;
  related_record_key: string;
  posture: AiControlTowerDerivedActionRow['posture'];
  title: string;
  rationale: string;
  owner_role: string | null;
  due_date: string | null;
  evidence_state: AiControlTowerDerivedActionRow['evidence_state'];
  payload: AiControlTowerDerivedActionRow['payload'];
}

export interface AiControlTowerLoadPlan {
  planVersion: 'ai-control-tower-load-plan-v1';
  clientId: string;
  clientKey: string | null;
  packageId: string | null;
  refreshRun: JsonRecord;
  sourceKeyById: Record<string, string>;
  tableRows: Record<string, JsonRecord[]>;
  contextRows: {
    records: JsonRecord[];
    facts: JsonRecord[];
    relationships: JsonRecord[];
    evidence: JsonRecord[];
  };
  derivedActions: AiControlTowerDerivedActionRow[];
  rowCounts: Record<string, number>;
  diagnostics: AiControlTowerLoadDiagnostic[];
}

const SHEET_KEY_BY_NAME: Record<string, string> = {
  'Source Manifest': 'source_manifest',
  'Initiative Registry': 'initiative_registry',
  'Tool Usage Monthly': 'tool_usage_monthly',
  'Persona Productivity': 'persona_productivity',
  'DORA Metrics': 'dora_metrics',
  'ServiceNow AI Agents': 'servicenow_ai_agents',
  'ERP HR Finance Agents': 'erp_hr_finance_agents',
  'Benefit Realization': 'benefit_realization',
  'Spend Contracts': 'spend_contracts',
  'Risk Governance': 'risk_governance',
  'Evidence Links': 'evidence_links',
  'Refresh Log': 'refresh_log',
  'Action Decision Log': 'action_decision_log',
};

const TARGET_TABLE_BY_SHEET_KEY: Record<string, string> = Object.fromEntries(
  AI_CONTROL_TOWER_SHEET_CONTRACTS.map((contract) => [
    SHEET_KEY_BY_NAME[contract.sheetName],
    contract.targetTable,
  ]),
);

export function aiControlTowerSheetKey(sheetName: string): string {
  return SHEET_KEY_BY_NAME[sheetName] ?? normalizeAiControlHeader(sheetName);
}

function rowsForSheet(pkg: AiControlTowerCanonicalPackage, sheetName: string): JsonRecord[] {
  const sheets = pkg.sheets ?? {};
  const key = aiControlTowerSheetKey(sheetName);
  const rows = sheets[key];
  return Array.isArray(rows) ? rows : [];
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(String(value).replace(/[$,%\s,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function dateText(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function daysBetween(startIso: string | null, endIso: string | null): number | null {
  if (!startIso || !endIso) return null;
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 86_400_000);
}

function evidenceStateFromRow(row: JsonRecord): AiControlTowerEvidenceStatus {
  const state = text(row.evidence_state)?.toLowerCase();
  if (state === 'retrieval_verified') return 'retrieval_proven';
  if (state === 'review_required' || state === 'low_confidence') return 'review_required';
  if (state === 'rejected' || state === 'missing') return 'missing';
  return 'committed';
}

function normalizeRunType(raw: unknown): string {
  const value = text(raw)?.toLowerCase();
  if (value === 'monthly_template_upload' || value === 'template_upload') return 'template_upload';
  if (value === 'api_sync') return 'api_sync';
  if (value === 'admin_edit') return 'admin_edit';
  if (value === 'source_event') return 'source_event';
  if (value === 'move_event') return 'move_event';
  return 'synthetic_seed';
}

function normalizeRunStatus(raw: unknown): string {
  const value = text(raw)?.toLowerCase();
  if (value === 'completed') return 'parsed';
  if (value === 'committed' || value === 'indexed' || value === 'retrieval_verified') return value;
  if (value === 'failed') return 'failed';
  if (value === 'review_required') return 'review_required';
  return 'received';
}

function addAction(
  actions: AiControlTowerDerivedActionRow[],
  next: AiControlTowerDerivedActionDraft,
): void {
  if (actions.some((action) => action.action_key === next.action_key)) return;
  actions.push({
    action_key: next.action_key,
    related_record_type: next.related_record_type,
    related_record_key: next.related_record_key,
    posture: next.posture,
    title: next.title,
    rationale: next.rationale,
    owner_role: next.owner_role,
    due_date: next.due_date,
    status: 'proposed',
    evidence_state: next.evidence_state,
    payload: next.payload,
  });
}

function deriveActions(args: {
  pkg: AiControlTowerCanonicalPackage;
  reportingPeriodEnd: string | null;
}): AiControlTowerDerivedActionRow[] {
  const actions: AiControlTowerDerivedActionRow[] = [];
  const riskRows = rowsForSheet(args.pkg, 'Risk Governance');
  const benefitRows = rowsForSheet(args.pkg, 'Benefit Realization');
  const usageRows = rowsForSheet(args.pkg, 'Tool Usage Monthly');
  const spendRows = rowsForSheet(args.pkg, 'Spend Contracts');

  for (const row of riskRows) {
    const riskKey = text(row.risk_id) ?? text(row.risk_key) ?? text(row.initiative_id) ?? 'risk';
    const severity = text(row.severity)?.toLowerCase();
    const gate = text(row.governance_gate)?.toLowerCase();
    const shouldAct = severity === 'high' || severity === 'critical' || gate === 'fail' || gate === 'partial';
    if (!shouldAct) continue;
    const posture = gate === 'fail' || severity === 'critical' ? 'hold' : 'assign_owner';
    addAction(actions, {
      action_key: `act-risk-${riskKey}`,
      related_record_type: 'risk_governance',
      related_record_key: riskKey,
      posture,
      title: `${posture === 'hold' ? 'Hold' : 'Resolve'} ${text(row.dimension) ?? 'AI governance'} risk`,
      rationale: text(row.required_action) ?? text(row.risk_description) ?? 'Risk row needs executive owner/action before the claim can be used.',
      owner_role: text(row.owner_role),
      due_date: null,
      evidence_state: 'review_required',
      payload: {
        source: 'system_derived',
        derivation_rule: 'risk_severity_or_governance_gate',
        source_sheet: 'Risk Governance',
        source_record: row,
      },
    });
  }

  for (const row of benefitRows) {
    const benefitKey = text(row.benefit_id) ?? text(row.benefit_key) ?? text(row.initiative_id) ?? 'benefit';
    const readiness = text(row.readiness_state)?.toLowerCase();
    const confidence = text(row.confidence)?.toLowerCase();
    const realized = numberValue(row.realized_annual_value_usd);
    const shouldProve = readiness === 'projected_only' || readiness === 'baseline_set' || confidence === 'low' || realized === null;
    if (!shouldProve) continue;
    addAction(actions, {
      action_key: `act-prove-${benefitKey}`,
      related_record_type: 'benefit_realization',
      related_record_key: benefitKey,
      posture: 'prove',
      title: `Prove benefit for ${text(row.initiative_id) ?? benefitKey}`,
      rationale: 'Benefit is not yet defensible as realized value; attach finance-backed evidence or keep it projected.',
      owner_role: text(row.owner_role) ?? 'AI Portfolio PMO',
      due_date: null,
      evidence_state: 'review_required',
      payload: {
        source: 'system_derived',
        derivation_rule: 'benefit_not_realized_or_low_confidence',
        source_sheet: 'Benefit Realization',
        source_record: row,
      },
    });
  }

  for (const row of usageRows) {
    const toolKey = text(row.tool_id) ?? text(row.tool_key) ?? text(row.tool_name) ?? 'tool';
    const licensed = numberValue(row.licensed_seats);
    const active = numberValue(row.active_users);
    const spend = numberValue(row.monthly_spend_usd) ?? 0;
    const adoption = licensed && licensed > 0 && active !== null ? active / licensed : null;
    if (adoption === null || adoption >= 0.6 || spend < 7_500) continue;
    addAction(actions, {
      action_key: `act-adoption-${toolKey}-${text(row.user_group_or_team) ?? text(row.team) ?? 'group'}`.replace(/\s+/g, '-').toLowerCase(),
      related_record_type: 'tool_usage_monthly',
      related_record_key: toolKey,
      posture: 'prove',
      title: `Fix adoption before scaling ${text(row.tool_name) ?? toolKey}`,
      rationale: `Active usage is ${Math.round(adoption * 100)}% while monthly spend is $${Math.round(spend).toLocaleString('en-US')}.`,
      owner_role: text(row.owner_role) ?? 'Digital workplace or tool owner',
      due_date: null,
      evidence_state: evidenceStateFromRow(row) === 'review_required' ? 'review_required' : 'usable',
      payload: {
        source: 'system_derived',
        derivation_rule: 'low_adoption_with_material_spend',
        source_sheet: 'Tool Usage Monthly',
        source_record: row,
      },
    });
  }

  for (const row of spendRows) {
    const spendKey = text(row.spend_id) ?? text(row.spend_key) ?? text(row.vendor) ?? 'spend';
    const renewalDate = dateText(row.renewal_date);
    const daysToRenewal = daysBetween(args.reportingPeriodEnd, renewalDate);
    if (daysToRenewal === null || daysToRenewal < 0 || daysToRenewal > 90) continue;
    addAction(actions, {
      action_key: `act-renewal-${spendKey}`,
      related_record_type: 'spend_contract',
      related_record_key: spendKey,
      posture: 'monitor',
      title: `Review ${text(row.vendor) ?? 'AI vendor'} renewal`,
      rationale: `Renewal is within ${daysToRenewal} days; compare spend, adoption, and benefit evidence before approving.`,
      owner_role: text(row.owner_role) ?? 'CFO / Procurement',
      due_date: renewalDate,
      evidence_state: evidenceStateFromRow(row) === 'review_required' ? 'review_required' : 'usable',
      payload: {
        source: 'system_derived',
        derivation_rule: 'renewal_inside_90_days',
        source_sheet: 'Spend Contracts',
        source_record: row,
      },
    });
  }

  return actions;
}

function buildTableRows(args: {
  pkg: AiControlTowerCanonicalPackage;
  clientId: string;
  refreshRunKey: string;
}): Record<string, JsonRecord[]> {
  const tableRows: Record<string, JsonRecord[]> = {};
  for (const [sheetKey, targetTable] of Object.entries(TARGET_TABLE_BY_SHEET_KEY)) {
    if (!targetTable || targetTable === 'ai_control_refresh_runs') continue;
    const rows = args.pkg.sheets?.[sheetKey] ?? [];
    if (!Array.isArray(rows)) continue;
    tableRows[targetTable] = [
      ...(tableRows[targetTable] ?? []),
      ...rows.map((row) => ({
        client_id: args.clientId,
        refresh_run_key: args.refreshRunKey,
        source_key: text(row.source_id),
        evidence_state: text(row.evidence_state) ?? undefined,
        payload: row,
      })),
    ];
  }
  return tableRows;
}

export function buildAiControlTowerLoadPlan(input: {
  clientId: string;
  clientKey?: string | null;
  package: AiControlTowerCanonicalPackage;
}): AiControlTowerLoadPlan {
  const diagnostics: AiControlTowerLoadDiagnostic[] = [];
  const refreshRows = rowsForSheet(input.package, 'Refresh Log');
  const firstRefresh = refreshRows[0] ?? {};
  const reportingPeriodStart = input.package.client?.reporting_period_start ?? dateText(firstRefresh.reporting_period_start);
  const reportingPeriodEnd = input.package.client?.reporting_period_end ?? dateText(firstRefresh.reporting_period_end);
  const refreshRunKey = text(firstRefresh.refresh_run_id) ?? `RUN-${reportingPeriodEnd ?? 'UNKNOWN'}`;

  for (const sheetName of AI_CONTROL_TOWER_REQUIRED_SHEETS) {
    const rows = rowsForSheet(input.package, sheetName);
    if (rows.length === 0) {
      diagnostics.push({
        level: 'error',
        code: 'missing_required_sheet_rows',
        sheetName,
        message: `${sheetName} has no parseable rows.`,
      });
    }
  }

  const sourceRows = rowsForSheet(input.package, 'Source Manifest');
  const sourceKeyById: Record<string, string> = {};
  for (const row of sourceRows) {
    const sourceId = text(row.source_id);
    if (sourceId) sourceKeyById[sourceId] = sourceId;
  }

  const tableRows = buildTableRows({
    pkg: input.package,
    clientId: input.clientId,
    refreshRunKey,
  });
  const derivedActions = deriveActions({
    pkg: input.package,
    reportingPeriodEnd: reportingPeriodEnd ?? null,
  });
  tableRows.ai_control_actions = [
    ...(tableRows.ai_control_actions ?? []),
    ...derivedActions,
  ];

  const rowCounts: Record<string, number> = {};
  for (const [table, rows] of Object.entries(tableRows)) {
    rowCounts[table] = rows.length;
  }
  rowCounts.ai_control_context_records = input.package.load_target?.context_records?.length ?? 0;
  rowCounts.ai_control_context_facts = input.package.load_target?.context_facts?.length ?? 0;
  rowCounts.ai_control_context_relationships = input.package.load_target?.context_relationships?.length ?? 0;
  rowCounts.ai_control_context_evidence = input.package.load_target?.context_evidence?.length ?? 0;
  rowCounts.system_derived_actions = derivedActions.length;

  return {
    planVersion: 'ai-control-tower-load-plan-v1',
    clientId: input.clientId,
    clientKey: input.clientKey ?? input.package.client?.client_reference ?? null,
    packageId: input.package.package_id ?? null,
    refreshRun: {
      client_id: input.clientId,
      client_key: input.clientKey ?? input.package.client?.client_reference ?? null,
      refresh_run_key: refreshRunKey,
      reporting_period_start: reportingPeriodStart,
      reporting_period_end: reportingPeriodEnd,
      run_type: normalizeRunType(firstRefresh.run_type),
      status: normalizeRunStatus(firstRefresh.status),
      source_count: numberValue(firstRefresh.sources_seen) ?? sourceRows.length,
      rows_seen: numberValue(firstRefresh.rows_seen) ?? 0,
      rows_valid: numberValue(firstRefresh.rows_valid) ?? 0,
      rows_rejected: numberValue(firstRefresh.rows_rejected) ?? 0,
      review_required_count: numberValue(firstRefresh.review_required) ?? derivedActions.filter((action) => action.evidence_state === 'review_required').length,
      parser_version: input.package.client?.template_version ?? null,
      metadata: {
        package_id: input.package.package_id ?? null,
        generated_at: input.package.generated_at ?? null,
        source: 'ai_control_tower_template',
      },
    },
    sourceKeyById,
    tableRows,
    contextRows: {
      records: input.package.load_target?.context_records ?? [],
      facts: input.package.load_target?.context_facts ?? [],
      relationships: input.package.load_target?.context_relationships ?? [],
      evidence: input.package.load_target?.context_evidence ?? [],
    },
    derivedActions,
    rowCounts,
    diagnostics,
  };
}
