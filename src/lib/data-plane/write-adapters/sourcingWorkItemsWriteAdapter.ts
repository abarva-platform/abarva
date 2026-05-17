// Sourcing work-items write adapter.
//
// Backs the persisted-write half of the Renewal Cockpit action layer: serve
// notice, assign owner, and create a Tower watch item all create a real
// `sourcing_work_items` row (migration 20260517100000) through this seam.
//
// The Supabase adapter is the default — `ABARVA_DATA_PLANE` unset / `supabase`.
// `azure-postgres` is opt-in for the cutover rehearsal; it runs the insert
// inside a real BEGIN/COMMIT transaction. Additive: it does not edit the
// foundation write contracts.
//
// Every write is audit-stamped — `created_by` carries the acting user, so a
// VP (and an auditor) can see who served notice and when.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import type {
  NewSourcingWorkItem,
  SourcingWorkItem,
  WorkItemStatus,
} from '@/lib/source/work-items/types';
import { validateNewWorkItem } from '@/lib/source/work-items/work-item-model';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

/** A write outcome — `ok:false` carries a human-readable message. */
export interface WorkItemWriteOutcome<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

function ok<T>(data?: T): WorkItemWriteOutcome<T> {
  return { ok: true, data };
}
function fail<T>(error: string): WorkItemWriteOutcome<T> {
  return { ok: false, error };
}

/** Fields a status update can change. */
export interface WorkItemStatusUpdate {
  readonly workItemId: string;
  readonly tenantKey: string;
  readonly status: WorkItemStatus;
  readonly updatedBy: string | null;
}

/** The snake_case insert payload — shared shape for both planes. */
function toInsertColumns(input: NewSourcingWorkItem): Record<string, unknown> {
  return {
    tenant_client_key: canonicalTenantKey(input.tenantClientKey),
    subject_kind: input.subjectKind,
    subject_ref: input.subjectRef,
    subject_label: input.subjectLabel,
    kind: input.kind,
    title: input.title,
    owner: input.owner,
    due_date: input.dueDate,
    status: input.status,
    legal_status: input.legalStatus,
    procurement_status: input.procurementStatus,
    note: input.note,
    created_by: input.createdBy,
    updated_by: input.createdBy,
  };
}

/** Map a returned insert/update row onto the view-model shape. */
function mapRow(row: Record<string, unknown>): SourcingWorkItem {
  return {
    id: String(row.id),
    tenantClientKey: String(row.tenant_client_key),
    subjectKind: row.subject_kind as SourcingWorkItem['subjectKind'],
    subjectRef: String(row.subject_ref),
    subjectLabel: (row.subject_label as string | null) ?? '',
    kind: row.kind as SourcingWorkItem['kind'],
    title: (row.title as string | null) ?? '',
    owner: (row.owner as string | null) ?? null,
    dueDate: (row.due_date as string | null) ?? null,
    status: row.status as WorkItemStatus,
    legalStatus: (row.legal_status as SourcingWorkItem['legalStatus']) ?? null,
    procurementStatus:
      (row.procurement_status as SourcingWorkItem['procurementStatus']) ?? null,
    note: (row.note as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: String(row.created_at ?? ''),
    updatedBy: (row.updated_by as string | null) ?? null,
    updatedAt: String(row.updated_at ?? ''),
  };
}

/** A sourcing work-items write adapter for one physical data plane. */
export interface SourcingWorkItemsWriteAdapter {
  readonly name: DataPlane;
  /** Persist a new work item. Validates before the physical insert. */
  createWorkItem(
    input: NewSourcingWorkItem,
  ): Promise<WorkItemWriteOutcome<SourcingWorkItem>>;
  /** Advance a work item's lifecycle status. */
  updateStatus(
    input: WorkItemStatusUpdate,
  ): Promise<WorkItemWriteOutcome<SourcingWorkItem>>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

export function createSupabaseSourcingWorkItemsWriteAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): SourcingWorkItemsWriteAdapter {
  return {
    name: 'supabase',

    async createWorkItem(input) {
      const validation = validateNewWorkItem(input);
      if (!validation.ok) {
        return fail(validation.error ?? 'invalid work item');
      }
      const { data, error } = await getClient()
        .from('sourcing_work_items')
        .insert(toInsertColumns(input))
        .select('*')
        .single();
      if (error) return fail(error.message);
      return ok(mapRow(data as Record<string, unknown>));
    },

    async updateStatus(input) {
      const { data, error } = await getClient()
        .from('sourcing_work_items')
        .update({
          status: input.status,
          updated_by: input.updatedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.workItemId)
        .eq('tenant_client_key', canonicalTenantKey(input.tenantKey))
        .select('*')
        .single();
      if (error) return fail(error.message);
      return ok(mapRow(data as Record<string, unknown>));
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? 'unknown');
}

export function createAzureSourcingWorkItemsWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-data-plane-work-items-write'),
): SourcingWorkItemsWriteAdapter {
  return {
    name: 'azure-postgres',

    async createWorkItem(input) {
      const validation = validateNewWorkItem(input);
      if (!validation.ok) {
        return fail(validation.error ?? 'invalid work item');
      }
      try {
        const columns = toInsertColumns(input);
        const keys = Object.keys(columns);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = keys.map((k) => columns[k]);
        const rows = await session((sql) =>
          sql<Record<string, unknown>>(
            `INSERT INTO sourcing_work_items (${keys.join(', ')})
             VALUES (${placeholders})
             RETURNING *`,
            values,
          ),
        );
        if (!rows[0]) return fail('work item not returned after insert');
        return ok(mapRow(rows[0]));
      } catch (err) {
        return fail(errMessage(err));
      }
    },

    async updateStatus(input) {
      try {
        const rows = await session((sql) =>
          sql<Record<string, unknown>>(
            `UPDATE sourcing_work_items
                SET status = $1, updated_by = $2, updated_at = now()
              WHERE id = $3 AND tenant_client_key = $4
              RETURNING *`,
            [
              input.status,
              input.updatedBy,
              input.workItemId,
              canonicalTenantKey(input.tenantKey),
            ],
          ),
        );
        if (!rows[0]) return fail('work item not found after status update');
        return ok(mapRow(rows[0]));
      } catch (err) {
        return fail(errMessage(err));
      }
    },
  };
}

// --- selection -------------------------------------------------------------

export const supabaseSourcingWorkItemsWriteAdapter: SourcingWorkItemsWriteAdapter =
  createSupabaseSourcingWorkItemsWriteAdapter();
export const azureSourcingWorkItemsWriteAdapter: SourcingWorkItemsWriteAdapter =
  createAzureSourcingWorkItemsWriteAdapter();

/**
 * Select the sourcing work-items write adapter for the configured data plane.
 * Defaults to Supabase — production write behavior is unchanged.
 */
export function selectSourcingWorkItemsWriteAdapter(
  plane?: DataPlane,
): SourcingWorkItemsWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureSourcingWorkItemsWriteAdapter
    : supabaseSourcingWorkItemsWriteAdapter;
}
