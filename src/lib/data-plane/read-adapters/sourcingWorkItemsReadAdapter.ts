// Sourcing work-items read adapter.
//
// Reads persisted `sourcing_work_items` rows (migration
// 20260517100000_sourcing_work_items.sql) for one tenant and maps the
// snake_case columns onto the `SourcingWorkItem` view-model shape.
//
// Routed through the data-plane read-adapter seam so the Azure cutover
// (`ABARVA_DATA_PLANE=azure-postgres`) needs no route rewrite — same switch
// as the other per-domain adapters in this directory. Additive: it does not
// edit the foundation read contracts.
//
// Reads are tenant-scoped. The adapter is fail-soft: a missing table (the
// migration is authored-not-applied until the founder runs db:migrate)
// degrades to an empty list rather than throwing, so the cockpit and the
// queue keep rendering.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import type {
  SourcingWorkItem,
  WorkItemKind,
  WorkItemLegalStatus,
  WorkItemMetadata,
  WorkItemProcurementStatus,
  WorkItemStatus,
  WorkItemSubjectKind,
} from '@/lib/source/work-items/types';
import {
  WORK_ITEM_KINDS,
  WORK_ITEM_STATUSES,
  WORK_ITEM_SUBJECT_KINDS,
} from '@/lib/source/work-items/types';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** The columns the adapter reads, shared by both planes. */
const WORK_ITEM_COLUMNS = [
  'id',
  'tenant_client_key',
  'subject_kind',
  'subject_ref',
  'subject_label',
  'kind',
  'title',
  'owner',
  'due_date',
  'status',
  'legal_status',
  'procurement_status',
  'note',
  'metadata',
  'created_by',
  'created_at',
  'updated_by',
  'updated_at',
] as const;

/** A raw `sourcing_work_items` row, snake_case as stored. */
interface WorkItemRow {
  id: string;
  tenant_client_key: string;
  subject_kind: string;
  subject_ref: string;
  subject_label: string | null;
  kind: string;
  title: string | null;
  owner: string | null;
  due_date: string | null;
  status: string;
  legal_status: string | null;
  procurement_status: string | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

function asSubjectKind(value: string): WorkItemSubjectKind {
  return (WORK_ITEM_SUBJECT_KINDS as readonly string[]).includes(value)
    ? (value as WorkItemSubjectKind)
    : 'contract';
}
function asKind(value: string): WorkItemKind {
  return (WORK_ITEM_KINDS as readonly string[]).includes(value)
    ? (value as WorkItemKind)
    : 'owner_assignment';
}
function asStatus(value: string): WorkItemStatus {
  return (WORK_ITEM_STATUSES as readonly string[]).includes(value)
    ? (value as WorkItemStatus)
    : 'open';
}
const LEGAL_STATUSES = ['not_started', 'drafting', 'in_review', 'served', 'not_applicable'];
const PROC_STATUSES = ['not_started', 'in_progress', 'completed', 'not_applicable'];
function asLegalStatus(value: string | null): WorkItemLegalStatus | null {
  return value && LEGAL_STATUSES.includes(value)
    ? (value as WorkItemLegalStatus)
    : null;
}
function asProcurementStatus(value: string | null): WorkItemProcurementStatus | null {
  return value && PROC_STATUSES.includes(value)
    ? (value as WorkItemProcurementStatus)
    : null;
}
/** Coerce a raw JSONB metadata value into the string-map view-model shape. */
function asMetadata(value: Record<string, unknown> | null): WorkItemMetadata {
  const out: WorkItemMetadata = {};
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string') out[k] = v;
    }
  }
  return out;
}

/** Map one persisted row onto the `SourcingWorkItem` view-model shape. */
function mapRow(row: WorkItemRow): SourcingWorkItem {
  return {
    id: row.id,
    tenantClientKey: row.tenant_client_key,
    subjectKind: asSubjectKind(row.subject_kind),
    subjectRef: row.subject_ref,
    subjectLabel: row.subject_label ?? '',
    kind: asKind(row.kind),
    title: row.title ?? '',
    owner: row.owner,
    dueDate: row.due_date,
    status: asStatus(row.status),
    legalStatus: asLegalStatus(row.legal_status),
    procurementStatus: asProcurementStatus(row.procurement_status),
    note: row.note,
    metadata: asMetadata(row.metadata),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

/** True when the error is the migration-not-applied / missing-table case. */
function isMissingTable(message: string): boolean {
  return /sourcing_work_items|schema cache|does not exist|relation .* does not exist/i.test(
    message,
  );
}

/** A sourcing work-items read adapter for one physical data plane. */
export interface SourcingWorkItemsReadAdapter {
  readonly name: DataPlane;
  /** All work items for one tenant, newest first. Fail-soft to []. */
  listForTenant(tenantKey: string): Promise<SourcingWorkItem[]>;
  /** Work items for one subject (e.g. a contract id). Fail-soft to []. */
  listForSubject(
    tenantKey: string,
    subjectKind: WorkItemSubjectKind,
    subjectRef: string,
  ): Promise<SourcingWorkItem[]>;
  /** Work items of one kind for a tenant (backs the Tower watch read). */
  listByKind(tenantKey: string, kind: WorkItemKind): Promise<SourcingWorkItem[]>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

export function createSupabaseSourcingWorkItemsReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): SourcingWorkItemsReadAdapter {
  /** Normalize a Supabase query outcome into mapped rows, fail-soft. */
  function settle(result: {
    data: unknown;
    error: { message: string } | null;
  }): SourcingWorkItem[] {
    if (result.error) {
      if (isMissingTable(result.error.message)) return [];
      throw new Error(result.error.message);
    }
    return ((result.data as WorkItemRow[] | null) ?? []).map(mapRow);
  }

  return {
    name: 'supabase',

    async listForTenant(tenantKey) {
      const key = canonicalTenantKey(tenantKey);
      try {
        const result = await getClient()
          .from('sourcing_work_items')
          .select(WORK_ITEM_COLUMNS.join(','))
          .eq('tenant_client_key', key)
          .order('created_at', { ascending: false });
        return settle(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isMissingTable(message)) return [];
        throw err;
      }
    },

    async listForSubject(tenantKey, subjectKind, subjectRef) {
      const key = canonicalTenantKey(tenantKey);
      try {
        const result = await getClient()
          .from('sourcing_work_items')
          .select(WORK_ITEM_COLUMNS.join(','))
          .eq('tenant_client_key', key)
          .eq('subject_kind', subjectKind)
          .eq('subject_ref', subjectRef)
          .order('created_at', { ascending: false });
        return settle(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isMissingTable(message)) return [];
        throw err;
      }
    },

    async listByKind(tenantKey, kind) {
      const key = canonicalTenantKey(tenantKey);
      try {
        const result = await getClient()
          .from('sourcing_work_items')
          .select(WORK_ITEM_COLUMNS.join(','))
          .eq('tenant_client_key', key)
          .eq('kind', kind)
          .order('created_at', { ascending: false });
        return settle(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isMissingTable(message)) return [];
        throw err;
      }
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

export function createAzureSourcingWorkItemsReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-work-items-read'),
): SourcingWorkItemsReadAdapter {
  async function run(
    where: string,
    params: unknown[],
  ): Promise<SourcingWorkItem[]> {
    try {
      const rows = await session((sql) =>
        sql<WorkItemRow>(
          `SELECT ${WORK_ITEM_COLUMNS.join(', ')}
             FROM sourcing_work_items
            WHERE ${where}
            ORDER BY created_at DESC`,
          params,
        ),
      );
      return rows.map(mapRow);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isMissingTable(message)) return [];
      throw err;
    }
  }

  return {
    name: 'azure-postgres',

    async listForTenant(tenantKey) {
      return run('tenant_client_key = $1', [canonicalTenantKey(tenantKey)]);
    },

    async listForSubject(tenantKey, subjectKind, subjectRef) {
      return run(
        'tenant_client_key = $1 AND subject_kind = $2 AND subject_ref = $3',
        [canonicalTenantKey(tenantKey), subjectKind, subjectRef],
      );
    },

    async listByKind(tenantKey, kind) {
      return run('tenant_client_key = $1 AND kind = $2', [
        canonicalTenantKey(tenantKey),
        kind,
      ]);
    },
  };
}

// --- selection -------------------------------------------------------------

export const supabaseSourcingWorkItemsReadAdapter: SourcingWorkItemsReadAdapter =
  createSupabaseSourcingWorkItemsReadAdapter();
export const azureSourcingWorkItemsReadAdapter: SourcingWorkItemsReadAdapter =
  createAzureSourcingWorkItemsReadAdapter();

/**
 * Select the sourcing work-items read adapter for the configured data plane.
 * Defaults to Supabase — production read behavior is unchanged.
 */
export function selectSourcingWorkItemsReadAdapter(
  plane?: DataPlane,
): SourcingWorkItemsReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureSourcingWorkItemsReadAdapter
    : supabaseSourcingWorkItemsReadAdapter;
}
