// Sourcing work-items data-plane adapters · unit tests.
//
//   - the write adapter validates before the physical insert;
//   - a successful insert maps the returned row onto the view-model shape;
//   - the read adapter degrades to [] (never throws) on a missing table;
//   - default plane stays Supabase, Azure is selectable by env.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createSupabaseSourcingWorkItemsWriteAdapter,
  selectSourcingWorkItemsWriteAdapter,
} from '@/lib/data-plane/write-adapters/sourcingWorkItemsWriteAdapter';
import {
  createSupabaseSourcingWorkItemsReadAdapter,
  selectSourcingWorkItemsReadAdapter,
} from '@/lib/data-plane/read-adapters/sourcingWorkItemsReadAdapter';
import type { NewSourcingWorkItem } from '@/lib/source/work-items/types';

function newItem(
  overrides: Partial<NewSourcingWorkItem> = {},
): NewSourcingWorkItem {
  return {
    tenantClientKey: 'apexretail',
    subjectKind: 'contract',
    subjectRef: 'contract-1',
    subjectLabel: 'Adobe — Creative Cloud',
    kind: 'tower_watch',
    title: 'Tower watch — Adobe renewal',
    owner: null,
    dueDate: '2026-08-01',
    status: 'open',
    legalStatus: null,
    procurementStatus: null,
    note: null,
    createdBy: 'user-1',
    ...overrides,
  };
}

/** A minimal Supabase stub for an insert returning one row. */
function insertStub(returnRow: Record<string, unknown> | null, error?: string) {
  const single = jest.fn().mockResolvedValue(
    error ? { data: null, error: { message: error } } : { data: returnRow, error: null },
  );
  const select = jest.fn(() => ({ single }));
  const insert = jest.fn(() => ({ select }));
  const from = jest.fn(() => ({ insert }));
  return { client: { from } as unknown as SupabaseClient, insert };
}

/** A minimal Supabase stub for a select chain resolving to data/error. */
function selectStub(data: unknown, error?: string) {
  const terminal = Promise.resolve(
    error ? { data: null, error: { message: error } } : { data, error: null },
  );
  const order = jest.fn(() => terminal);
  const chain: Record<string, unknown> = { order };
  chain.eq = jest.fn(() => chain);
  const select = jest.fn(() => chain);
  const from = jest.fn(() => ({ select }));
  return { from } as unknown as SupabaseClient;
}

const PERSISTED_ROW = {
  id: 'wi-1',
  tenant_client_key: 'apexretail',
  subject_kind: 'contract',
  subject_ref: 'contract-1',
  subject_label: 'Adobe — Creative Cloud',
  kind: 'tower_watch',
  title: 'Tower watch — Adobe renewal',
  owner: null,
  due_date: '2026-08-01',
  status: 'open',
  legal_status: null,
  procurement_status: null,
  note: null,
  created_by: 'user-1',
  created_at: '2026-05-17T10:00:00Z',
  updated_by: 'user-1',
  updated_at: '2026-05-17T10:00:00Z',
};

describe('sourcing work-items write adapter', () => {
  it('rejects an invalid work item before touching the data plane', async () => {
    const { client, insert } = insertStub(null);
    const adapter = createSupabaseSourcingWorkItemsWriteAdapter(() => client);
    const outcome = await adapter.createWorkItem(
      newItem({ kind: 'owner_assignment', owner: null }),
    );
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/owner/);
    expect(insert).not.toHaveBeenCalled();
  });

  it('persists a valid work item and maps the returned row', async () => {
    const { client } = insertStub(PERSISTED_ROW);
    const adapter = createSupabaseSourcingWorkItemsWriteAdapter(() => client);
    const outcome = await adapter.createWorkItem(newItem());
    expect(outcome.ok).toBe(true);
    expect(outcome.data?.id).toBe('wi-1');
    expect(outcome.data?.kind).toBe('tower_watch');
    expect(outcome.data?.tenantClientKey).toBe('apexretail');
    expect(outcome.data?.createdBy).toBe('user-1');
  });

  it('surfaces a write error from the data plane', async () => {
    const { client } = insertStub(null, 'permission denied');
    const adapter = createSupabaseSourcingWorkItemsWriteAdapter(() => client);
    const outcome = await adapter.createWorkItem(newItem());
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/permission denied/);
  });
});

describe('sourcing work-items read adapter', () => {
  it('maps persisted rows onto the view-model shape', async () => {
    const adapter = createSupabaseSourcingWorkItemsReadAdapter(() =>
      selectStub([PERSISTED_ROW]),
    );
    const items = await adapter.listForSubject(
      'apexretail',
      'contract',
      'contract-1',
    );
    expect(items).toHaveLength(1);
    expect(items[0].subjectRef).toBe('contract-1');
    expect(items[0].kind).toBe('tower_watch');
  });

  it('degrades to [] when the table does not exist (migration not applied)', async () => {
    const adapter = createSupabaseSourcingWorkItemsReadAdapter(() =>
      selectStub(null, 'relation "sourcing_work_items" does not exist'),
    );
    const items = await adapter.listForTenant('apexretail');
    expect(items).toEqual([]);
  });

  it('lists by kind for the Tower watch read', async () => {
    const adapter = createSupabaseSourcingWorkItemsReadAdapter(() =>
      selectStub([PERSISTED_ROW]),
    );
    const items = await adapter.listByKind('apexretail', 'tower_watch');
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('tower_watch');
  });
});

describe('adapter selection', () => {
  it('defaults to the Supabase plane', () => {
    expect(selectSourcingWorkItemsWriteAdapter().name).toBe('supabase');
    expect(selectSourcingWorkItemsReadAdapter().name).toBe('supabase');
  });

  it('selects the Azure plane when explicitly requested', () => {
    expect(selectSourcingWorkItemsWriteAdapter('azure-postgres').name).toBe(
      'azure-postgres',
    );
    expect(selectSourcingWorkItemsReadAdapter('azure-postgres').name).toBe(
      'azure-postgres',
    );
  });
});
