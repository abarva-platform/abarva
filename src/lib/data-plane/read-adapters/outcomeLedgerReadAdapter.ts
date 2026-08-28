// Outcome ledger read adapter · Wave 3, Slice 3.1.
//
// Reads the current value claims for one tenant from the
// `outcome_ledger` table (migration 20260516180000_outcome_ledger.sql)
// and maps the persisted snake_case columns onto the `OutcomeLedgerRow`
// view-model shape consumed by `buildOutcomeLedgerView`.
//
// Routed through the data-plane read-adapter seam so the Azure cutover
// (`ABARVA_DATA_PLANE=azure-postgres`) needs no route rewrite — same
// switch as the other per-domain adapters in this directory.
//
// Reads are tenant-scoped and current-view only (`is_current`); the
// ledger's append-only history rows are not surfaced here.

import {
  getAzureReadFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import type {
  OutcomeLedgerRow,
  OutcomeSubjectKind,
} from '@/lib/tower/outcome-ledger/types';
import { OUTCOME_SUBJECT_KINDS } from '@/lib/tower/outcome-ledger/types';
import type {
  ValueCounterfactualConfidence,
  ValueGovernanceReviewStatus,
  ValueLedgerCategory,
  ValueMeasurementUnit,
  ValueReadinessState,
} from '@/lib/tower/ai-value-outcome-ledger';
import {
  VALUE_COUNTERFACTUAL_CONFIDENCE_LEVELS,
  VALUE_GOVERNANCE_REVIEW_STATUSES,
  VALUE_LEDGER_CATEGORIES,
  VALUE_MEASUREMENT_UNITS,
  VALUE_READINESS_STATES,
} from '@/lib/tower/ai-value-outcome-ledger';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlaneForTenant } from './resolveDataPlane';
import type { DataPlane } from './types';

/** The columns the adapter reads, shared by both planes. */
const LEDGER_COLUMNS = [
  'id',
  'supersedes_entry_id',
  'is_current',
  'tenant_client_key',
  'client_id',
  'subject_kind',
  'subject_ref',
  'subject_label',
  'value_rung',
  'value_category',
  'measurement_unit',
  'projected_amount',
  'realized_amount',
  'baseline_amount',
  'counterfactual_confidence',
  'governance_review_status',
  'measurement_owner_role',
  'evidence_pointer',
  'evidence_claim_ids',
  'note',
  'recorded_by',
  'recorded_at',
] as const;

/** A reader for one physical data plane. Never throws — returns []. */
export interface OutcomeLedgerReadAdapter {
  readonly name: DataPlane;
  /** Current-view value claims for one tenant, by canonical tenant key. */
  getCurrentEntries(tenantClientKey: string): Promise<OutcomeLedgerRow[]>;
}

// --- Row mapping (shared) ----------------------------------------------------

function coerceEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof raw === 'string' && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback;
}

function coerceNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function coerceStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === 'string');
}

function coerceString(raw: unknown): string | null {
  return typeof raw === 'string' ? raw : null;
}

/**
 * Map one raw DB row (snake_case, loosely typed) onto an
 * `OutcomeLedgerRow`. Unknown enum values fall back to the
 * least-privileged option so a malformed row never crashes the view.
 */
export function mapOutcomeLedgerRow(raw: Record<string, unknown>): OutcomeLedgerRow {
  const projected = coerceNumber(raw.projected_amount);
  return {
    id: String(raw.id ?? ''),
    supersedesEntryId: coerceString(raw.supersedes_entry_id),
    isCurrent: raw.is_current !== false,
    tenantClientKey: String(raw.tenant_client_key ?? ''),
    clientId: coerceString(raw.client_id),
    subjectKind: coerceEnum<OutcomeSubjectKind>(
      raw.subject_kind,
      OUTCOME_SUBJECT_KINDS,
      'move',
    ),
    subjectRef: String(raw.subject_ref ?? ''),
    subjectLabel: String(raw.subject_label ?? ''),
    valueRung: coerceEnum<ValueReadinessState>(
      raw.value_rung,
      VALUE_READINESS_STATES,
      'projected_only',
    ),
    valueCategory: coerceEnum<ValueLedgerCategory>(
      raw.value_category,
      VALUE_LEDGER_CATEGORIES,
      'productivity',
    ),
    measurementUnit: coerceEnum<ValueMeasurementUnit>(
      raw.measurement_unit,
      VALUE_MEASUREMENT_UNITS,
      'usd_seed',
    ),
    projectedAmount: projected ?? 0,
    realizedAmount: coerceNumber(raw.realized_amount),
    baselineAmount: coerceNumber(raw.baseline_amount),
    counterfactualConfidence: coerceEnum<ValueCounterfactualConfidence>(
      raw.counterfactual_confidence,
      VALUE_COUNTERFACTUAL_CONFIDENCE_LEVELS,
      'low',
    ),
    governanceReviewStatus: coerceEnum<ValueGovernanceReviewStatus>(
      raw.governance_review_status,
      VALUE_GOVERNANCE_REVIEW_STATUSES,
      'not_started',
    ),
    measurementOwnerRole: coerceString(raw.measurement_owner_role),
    evidencePointer: coerceString(raw.evidence_pointer),
    evidenceClaimIds: coerceStringArray(raw.evidence_claim_ids),
    note: coerceString(raw.note),
    recordedBy: coerceString(raw.recorded_by),
    recordedAt: String(raw.recorded_at ?? ''),
  };
}

// --- Supabase adapter (DEFAULT) ---------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/** Build the Supabase outcome-ledger adapter. */
export function createSupabaseOutcomeLedgerReadAdapter(
  getClient: SupabaseFactory = getAzureReadFluentClient,
): OutcomeLedgerReadAdapter {
  return {
    name: 'supabase',
    async getCurrentEntries(tenantClientKey) {
      const { data, error } = await getClient()
        .from('outcome_ledger')
        .select(LEDGER_COLUMNS.join(', '))
        .eq('tenant_client_key', tenantClientKey)
        .eq('is_current', true)
        .order('recorded_at', { ascending: false });
      if (error || !data) return [];
      return (data as unknown as Record<string, unknown>[]).map(
        mapOutcomeLedgerRow,
      );
    },
  };
}

// --- Azure Postgres adapter (opt-in) ----------------------------------------

/** Build the Azure Postgres outcome-ledger adapter. */
export function createAzureOutcomeLedgerReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-outcome-ledger'),
): OutcomeLedgerReadAdapter {
  return {
    name: 'azure-postgres',
    async getCurrentEntries(tenantClientKey) {
      try {
        return await session(async (run) => {
          const rows = await run<Record<string, unknown>>(
            `SELECT ${LEDGER_COLUMNS.join(', ')}
               FROM outcome_ledger
              WHERE tenant_client_key = $1
                AND is_current = true
              ORDER BY recorded_at DESC`,
            [tenantClientKey],
          );
          return rows.map(mapOutcomeLedgerRow);
        });
      } catch {
        // Missing table / connection — degrade gracefully like Slice 2.
        return [];
      }
    },
  };
}

// --- Selection ---------------------------------------------------------------

export const supabaseOutcomeLedgerReadAdapter: OutcomeLedgerReadAdapter =
  createSupabaseOutcomeLedgerReadAdapter();
export const azureOutcomeLedgerReadAdapter: OutcomeLedgerReadAdapter =
  createAzureOutcomeLedgerReadAdapter();

/** Select the outcome-ledger read adapter for the configured data plane. */
export function selectOutcomeLedgerReadAdapter(
  plane?: DataPlane,
  tenantKey?: string | null,
): OutcomeLedgerReadAdapter {
  const target = resolveDataPlaneForTenant(tenantKey, plane);
  return target === 'azure-postgres'
    ? azureOutcomeLedgerReadAdapter
    : supabaseOutcomeLedgerReadAdapter;
}
