// TOWER · Durable P4 projection read model.
//
// Reads `ai_control_tower_lens_mv` (the materialized projection of the AI
// Control Tower lens over the committed context layer — see
// supabase/migrations/20260621120000_ai_control_tower_lens_mv.sql and §4f of
// docs/codex-handoff/FIRST_CAPITAL_INTELLIGENCE_SUBSTRATE_BRIEF.md) for a given
// tenant and shapes the MV rows into the existing `AiControlTowerReadModel`
// lens shapes.
//
// Why a projection: the legacy Tower read model
// (src/lib/ai-control-tower/read-model.ts) reads a *separate* substrate
// (`ai_control_*` tables). Tenants whose context was loaded into
// `enterprise_context_*` but never re-loaded into the Tower substrate fall back
// to a packaged synthetic demo. This read model lets `getAiControlTowerReadModel`
// add a `context_projection` precedence step BEFORE the synthetic fallback, so
// every tenant with committed context gets a live Tower automatically.
//
// Design: the DB fetch (impure) is separated from the shaping (pure). The pure
// `shapeControlTowerLensProjection(rows)` is the unit-tested core; the MV itself
// cannot be exercised off the private VNet.
//
// Lens shapes are NOT redefined here — they are re-used from
// '@/lib/ai-control-tower/read-model'.

import { azureRead, type AzureReadClient } from '@/lib/data-plane/azureRead';
import type { AiControlTowerEvidenceStatus } from '@/lib/ai-control-tower/contracts';
import type {
  AiControlTowerActionRead,
  AiControlTowerAgentRead,
  AiControlTowerEvidenceRead,
  AiControlTowerInitiativeRead,
  AiControlTowerProductivityRead,
  AiControlTowerRiskRead,
  AiControlTowerSpendRead,
  AiControlTowerUsageRead,
} from '@/lib/ai-control-tower/read-model';

// ─────────────────────────────────────────────────────────────────────────────
// MV row contract
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One row of `ai_control_tower_lens_mv`. The `facts` column is the per-record
 * JSONB bag keyed by fact_key; each entry carries `{ value, text, numeric,
 * date, unit, as_of, confidence, evidence, fact_id }` (see the MV definition).
 */
export interface ControlTowerLensProjectionRow {
  record_uid: string;
  client_id: string | null;
  tenant_key: string;
  canonical_record_id: string | null;
  lens_record_type: string;
  record_subtype: string | null;
  title: string | null;
  business_function: string | null;
  dimension_family: string | null;
  domain_segment: string | null;
  owner: string | null;
  steward_owner: string | null;
  payload: Record<string, unknown> | null;
  facts: Record<string, ControlTowerLensFactEntry> | null;
  fact_count: number | string | null;
  record_confidence: number | string | null;
  max_fact_confidence: number | string | null;
  freshness_status: string | null;
  evidence_pointer: string | null;
  has_evidence_pointer: boolean | null;
  source_file: string | null;
  source_row_number: number | string | null;
}

export interface ControlTowerLensFactEntry {
  value?: unknown;
  text?: string | null;
  numeric?: string | number | null;
  date?: string | null;
  unit?: string | null;
  as_of?: string | null;
  confidence?: number | string | null;
  evidence?: string | null;
  fact_id?: string | null;
}

/**
 * The shaped projection. Mirrors the per-lens arrays on
 * `AiControlTowerReadModel`, so `getAiControlTowerReadModel` can splice it in as
 * the `context_projection` source without changing any lens shape.
 */
export interface ControlTowerLensProjection {
  tenantKey: string;
  clientId: string | null;
  source: 'context_projection';
  recordCount: number;
  initiatives: AiControlTowerInitiativeRead[];
  spend: AiControlTowerSpendRead[];
  risks: AiControlTowerRiskRead[];
  agents: AiControlTowerAgentRead[];
  productivity: AiControlTowerProductivityRead[];
  usage: AiControlTowerUsageRead[];
  evidence: AiControlTowerEvidenceRead[];
  actions: AiControlTowerActionRead[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure scalar helpers (mirror read-model.ts conventions)
// ─────────────────────────────────────────────────────────────────────────────

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
  const parsed = Number(String(value).replace(/[$,%\s]/g, ''));
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

function evidenceStateFromProjection(
  hasEvidence: boolean | null,
  freshness: string | null,
): AiControlTowerEvidenceStatus {
  const state = text(freshness).toLowerCase();
  if (state === 'fresh' && hasEvidence) return 'retrieval_proven';
  if (state === 'stale' || state === 'attention') return 'review_required';
  return hasEvidence ? 'committed' : 'review_required';
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

// ─────────────────────────────────────────────────────────────────────────────
// Fact-bag accessors
// ─────────────────────────────────────────────────────────────────────────────

function factBag(row: ControlTowerLensProjectionRow): Record<string, ControlTowerLensFactEntry> {
  return row.facts && typeof row.facts === 'object' ? row.facts : {};
}

/** Scalar text for a fact_key — prefers explicit `text`, falls back to raw `value`. */
function factText(bag: Record<string, ControlTowerLensFactEntry>, ...keys: string[]): string {
  for (const key of keys) {
    const entry = bag[key];
    if (!entry) continue;
    const candidate = entry.text ?? entry.value;
    const out = text(candidate);
    if (out) return out;
  }
  return '';
}

/** Numeric for a fact_key — prefers typed `numeric`, falls back to raw `value`. */
function factNum(bag: Record<string, ControlTowerLensFactEntry>, ...keys: string[]): number | null {
  for (const key of keys) {
    const entry = bag[key];
    if (!entry) continue;
    const typed = nullableNum(entry.numeric);
    if (typed !== null) return typed;
    const fromValue = nullableNum(entry.text ?? entry.value);
    if (fromValue !== null) return fromValue;
  }
  return null;
}

/** Date for a fact_key — prefers typed `date`, falls back to raw `value`. */
function factDate(bag: Record<string, ControlTowerLensFactEntry>, ...keys: string[]): string | null {
  for (const key of keys) {
    const entry = bag[key];
    if (!entry) continue;
    const typed = dateText(entry.date);
    if (typed) return typed;
    const fromValue = dateText(entry.text ?? entry.value);
    if (fromValue) return fromValue;
  }
  return null;
}

function payloadOf(row: ControlTowerLensProjectionRow): Record<string, unknown> {
  return row.payload && typeof row.payload === 'object' ? row.payload : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-lens shapers (pure)
// ─────────────────────────────────────────────────────────────────────────────

function shapeInitiative(row: ControlTowerLensProjectionRow): AiControlTowerInitiativeRead {
  const bag = factBag(row);
  const payload = payloadOf(row);
  const promisedUsd = factNum(bag, 'promised_value_usd', 'committed_value_usd') ?? 0;
  const realizedUsd = factNum(bag, 'realized_value_usd') ?? 0;
  const spendUsd = factNum(bag, 'spend_ytd_usd', 'annualized_spend_usd') ?? 0;
  const committedUsd = factNum(bag, 'committed_value_usd') ?? Math.max(spendUsd, promisedUsd);
  return {
    id: text(row.canonical_record_id, row.record_uid),
    title: text(row.title, text(payload.name, 'Untitled initiative')),
    functionName: normalizeFunctionName(row.business_function ?? payload.business_function),
    category: factText(bag, 'category') || text(payload.category, 'AI initiative'),
    stage: factText(bag, 'stage', 'phase') || 'portfolio',
    posture: factText(bag, 'posture') || 'review',
    owner: text(row.owner, 'Unassigned owner'),
    sponsor: factText(bag, 'sponsor') || text(row.owner, 'Unassigned sponsor'),
    vendor: factText(bag, 'vendor') || 'Mixed',
    system: factText(bag, 'system', 'tool_or_system') || 'Portfolio',
    personas: text(factText(bag, 'impacted_personas'))
      .split(/[|,;]/)
      .map((part) => part.trim())
      .filter(Boolean),
    promisedBenefit: factText(bag, 'promised_benefit') || 'Benefit lineage required',
    metric: factText(bag, 'target_metric_key', 'metric') || 'benefit_realization_usd',
    baseline: factNum(bag, 'baseline'),
    target: factNum(bag, 'target'),
    committedUsd,
    spendUsd,
    promisedUsd,
    realizedUsd,
    realizedPct: promisedUsd ? Math.round((realizedUsd / promisedUsd) * 100) : null,
    confidence: factText(bag, 'confidence') || 'medium',
    evidenceState: evidenceStateFromProjection(row.has_evidence_pointer, row.freshness_status),
    status: factText(bag, 'status', 'posture') || 'watch',
    notes: factText(bag, 'notes'),
    risks: [],
    citations: [],
  };
}

function shapeSpend(row: ControlTowerLensProjectionRow): AiControlTowerSpendRead {
  const bag = factBag(row);
  return {
    id: text(row.canonical_record_id, row.record_uid),
    initiativeId: nullableText(factText(bag, 'initiative_id')),
    functionName: normalizeFunctionName(row.business_function),
    vendor: factText(bag, 'vendor') || 'Mixed',
    product: factText(bag, 'product', 'product_or_service') || text(row.title),
    spendType: factText(bag, 'spend_type') || 'committed',
    monthlySpendUsd: factNum(bag, 'monthly_spend_usd') ?? 0,
    annualizedSpendUsd: factNum(bag, 'annualized_spend_usd', 'spend_ytd_usd') ?? 0,
    renewalDate: factDate(bag, 'renewal_date', 'contract_renewal_date'),
    unitMetric: factText(bag, 'unit_economics_metric'),
    unitValue: factNum(bag, 'unit_economics_value'),
    evidenceState: evidenceStateFromProjection(row.has_evidence_pointer, row.freshness_status),
    notes: factText(bag, 'notes'),
  };
}

function shapeRisk(row: ControlTowerLensProjectionRow): AiControlTowerRiskRead {
  const bag = factBag(row);
  return {
    id: text(row.canonical_record_id, row.record_uid),
    initiativeId: nullableText(factText(bag, 'initiative_id', 'linked_initiative_id')),
    functionName: normalizeFunctionName(row.business_function),
    name: factText(bag, 'risk_name', 'name') || text(row.title),
    dimension: factText(bag, 'dimension', 'risk_type') || 'governance',
    severity: factText(bag, 'severity', 'impact') || 'medium',
    status: factText(bag, 'status') || 'open',
    description: factText(bag, 'risk_description', 'description', 'notes'),
    owner: text(row.owner, factText(bag, 'owner_role')),
    requiredAction: factText(bag, 'required_action', 'regulatory_implication'),
    gate: factText(bag, 'gate', 'governance_gate') || 'partial',
    evidenceState: evidenceStateFromProjection(row.has_evidence_pointer, row.freshness_status),
  };
}

function shapeAgent(row: ControlTowerLensProjectionRow): AiControlTowerAgentRead {
  const bag = factBag(row);
  const eligible = factNum(bag, 'eligible_volume');
  const touched = factNum(bag, 'ai_touched_volume');
  const resolved = factNum(bag, 'auto_resolved_volume');
  return {
    id: text(row.canonical_record_id, row.record_uid),
    functionName: normalizeFunctionName(row.business_function),
    vendor: factText(bag, 'vendor'),
    module: factText(bag, 'module', 'capability_type'),
    name: factText(bag, 'agent_name', 'name') || text(row.title),
    persona: factText(bag, 'persona') || normalizeFunctionName(row.business_function),
    workflow: factText(bag, 'workflow', 'capability_type'),
    eligibleVolume: eligible,
    touchedVolume: touched,
    autoResolvedVolume: resolved,
    deflectionPct:
      eligible && touched !== null ? Math.round((touched / eligible) * 100) : factNum(bag, 'deflection_rate_pct'),
    autoResolvePct:
      eligible && resolved !== null ? Math.round((resolved / eligible) * 100) : factNum(bag, 'auto_resolve_rate_pct'),
    cycleTimeBefore: factNum(bag, 'cycle_time_before'),
    cycleTimeAfter: factNum(bag, 'cycle_time_after'),
    monthlySpendUsd: factNum(bag, 'monthly_spend_usd') ?? 0,
    valueUsd: factNum(bag, 'value_usd', 'monthly_cost_avoided_usd') ?? 0,
    governance: factText(bag, 'governance', 'status', 'enforcement'),
    notes: factText(bag, 'notes'),
    evidenceState: evidenceStateFromProjection(row.has_evidence_pointer, row.freshness_status),
  };
}

function shapeProductivity(row: ControlTowerLensProjectionRow): AiControlTowerProductivityRead {
  const bag = factBag(row);
  return {
    id: text(row.canonical_record_id, row.record_uid),
    functionName: normalizeFunctionName(row.business_function),
    persona: factText(bag, 'persona', 'persona_name') || normalizeFunctionName(row.business_function),
    workflow: factText(bag, 'workflow') || 'AI productivity scorecard',
    metric: factText(bag, 'metric', 'metric_key') || 'benefit_realization',
    baseline: factNum(bag, 'baseline', 'baseline_value'),
    current: factNum(bag, 'current', 'current_value', 'realization_pct'),
    target: factNum(bag, 'target', 'target_value'),
    unit: factText(bag, 'unit') || 'percent',
    initiativeId: nullableText(factText(bag, 'initiative_id')),
    confidence: factText(bag, 'confidence') || 'medium',
    evidenceState: evidenceStateFromProjection(row.has_evidence_pointer, row.freshness_status),
  };
}

function shapeUsage(row: ControlTowerLensProjectionRow): AiControlTowerUsageRead {
  const bag = factBag(row);
  const seats = factNum(bag, 'seats', 'seats_purchased', 'seats_allocated') ?? 0;
  const active = factNum(bag, 'active_users', 'seats_active') ?? 0;
  return {
    id: text(row.canonical_record_id, row.record_uid),
    functionName: normalizeFunctionName(row.business_function),
    toolName: factText(bag, 'tool_name', 'copilot_product') || text(row.title),
    vendor: factText(bag, 'vendor'),
    persona: factText(bag, 'persona') || normalizeFunctionName(row.business_function),
    seats,
    activeUsers: active,
    adoptionPct: factNum(bag, 'adoption_pct', 'utilization_pct') ?? (seats ? Math.round((active / seats) * 100) : null),
    monthlySpendUsd: factNum(bag, 'monthly_spend_usd') ?? 0,
    timeSavingsHours: factNum(bag, 'verified_time_savings_hrs_per_fte_month', 'time_savings_hours'),
    estimatedBenefitUsd: factNum(bag, 'estimated_benefit_usd_annual', 'estimated_benefit_usd') ?? 0,
    blocker: factText(bag, 'blocker'),
    evidenceState: evidenceStateFromProjection(row.has_evidence_pointer, row.freshness_status),
  };
}

function shapeEvidence(row: ControlTowerLensProjectionRow): AiControlTowerEvidenceRead {
  const bag = factBag(row);
  return {
    id: text(row.canonical_record_id, row.record_uid),
    recordType: row.lens_record_type,
    recordKey: text(row.canonical_record_id, row.record_uid),
    evidenceType: factText(bag, 'evidence_type') || 'context_fact',
    citationLabel: factText(bag, 'citation_label') || text(row.title, text(row.source_file)),
    pointer: text(row.evidence_pointer, factText(bag, 'evidence_pointer')),
    evidenceState: evidenceStateFromProjection(row.has_evidence_pointer, row.freshness_status),
    confidence: nullableNum(row.max_fact_confidence ?? row.record_confidence),
  };
}

function shapeAction(row: ControlTowerLensProjectionRow): AiControlTowerActionRead {
  const bag = factBag(row);
  return {
    id: text(row.canonical_record_id, row.record_uid),
    relatedType: factText(bag, 'related_record_type') || 'initiative',
    relatedKey: factText(bag, 'related_record_key', 'initiative_id'),
    posture: factText(bag, 'posture') || 'hold',
    title: factText(bag, 'title', 'required_action') || text(row.title),
    rationale: factText(bag, 'rationale', 'conditions'),
    owner: text(row.owner, factText(bag, 'owner_role')),
    dueDate: factDate(bag, 'due_date', 'next_gate_target_date'),
    status: factText(bag, 'status') || 'proposed',
    evidenceState: evidenceStateFromProjection(row.has_evidence_pointer, row.freshness_status),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure shaping core (unit-tested)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure: shape MV rows into the typed lens projection. No DB, no clock.
 * Same input → identical output.
 */
export function shapeControlTowerLensProjection(
  rows: ControlTowerLensProjectionRow[],
): ControlTowerLensProjection {
  const first = rows[0];
  const projection: ControlTowerLensProjection = {
    tenantKey: text(first?.tenant_key),
    clientId: first?.client_id ?? null,
    source: 'context_projection',
    recordCount: rows.length,
    initiatives: [],
    spend: [],
    risks: [],
    agents: [],
    productivity: [],
    usage: [],
    evidence: [],
    actions: [],
  };

  for (const row of rows) {
    const type = text(row.lens_record_type).toLowerCase();
    switch (type) {
      case 'initiative':
      case 'benefit_realization':
        projection.initiatives.push(shapeInitiative(row));
        break;
      case 'spend_contract':
        projection.spend.push(shapeSpend(row));
        break;
      case 'risk_governance':
      case 'model_risk':
        projection.risks.push(shapeRisk(row));
        break;
      case 'agent':
        projection.agents.push(shapeAgent(row));
        break;
      case 'productivity':
        projection.productivity.push(shapeProductivity(row));
        break;
      case 'usage':
        projection.usage.push(shapeUsage(row));
        break;
      case 'action':
        projection.actions.push(shapeAction(row));
        break;
      case 'evidence':
        projection.evidence.push(shapeEvidence(row));
        break;
      default:
        // Records tagged only by dimension_family (governance_ai_evidence)
        // without one of the explicit Tower record types contribute evidence
        // lineage so the Evidence lens is never empty when context exists.
        projection.evidence.push(shapeEvidence(row));
        break;
    }
  }

  return projection;
}

// ─────────────────────────────────────────────────────────────────────────────
// DB fetch (impure) + entrypoint
// ─────────────────────────────────────────────────────────────────────────────

const LENS_MV_COLUMNS = [
  'record_uid',
  'client_id',
  'tenant_key',
  'canonical_record_id',
  'lens_record_type',
  'record_subtype',
  'title',
  'business_function',
  'dimension_family',
  'domain_segment',
  'owner',
  'steward_owner',
  'payload',
  'facts',
  'fact_count',
  'record_confidence',
  'max_fact_confidence',
  'freshness_status',
  'evidence_pointer',
  'has_evidence_pointer',
  'source_file',
  'source_row_number',
] as const;

/**
 * Read the durable Tower projection for a tenant from
 * `ai_control_tower_lens_mv` and shape it into the typed lens projection.
 *
 * Returns `null` when the MV has no rows for the tenant (so the caller can fall
 * through to the next precedence step — e.g. the synthetic fallback). Resolves
 * by `clientId` when supplied, else by `tenantKey`.
 *
 * NOT live-proven: the MV only exists inside the private VNet Postgres;
 * localhost cannot reach it. The `db` arg is injectable for unit tests.
 */
export async function getControlTowerLensProjection(args: {
  tenantKey?: string | null;
  clientId?: string | null;
  db?: AzureReadClient;
}): Promise<ControlTowerLensProjection | null> {
  const where: Record<string, string> = {};
  if (args.clientId) where.client_id = args.clientId;
  else if (args.tenantKey) where.tenant_key = args.tenantKey;
  else return null;

  const client = args.db ?? azureRead;
  const rows = await client
    .select<ControlTowerLensProjectionRow>({
      table: 'ai_control_tower_lens_mv',
      columns: LENS_MV_COLUMNS,
      where,
      missingTable: 'empty',
    })
    .catch(() => [] as ControlTowerLensProjectionRow[]);

  if (rows.length === 0) return null;
  return shapeControlTowerLensProjection(rows);
}
