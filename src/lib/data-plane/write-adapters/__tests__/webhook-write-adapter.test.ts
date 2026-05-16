// Unit tests for the Stripe-webhook domain write adapter (Slice 3e).
//
// Pins the contract that matters for the Azure parallel-run cutover:
//   - the Supabase plane (DEFAULT) issues the verbatim `.update()` calls the
//     pre-seam route performed — same tables, same column bodies, same keys;
//   - `invoice.paid` writes `paid_at`; the other transitions do not;
//   - the Azure plane routes each UPDATE through the write adapter's
//     `commit()` as parameterized SQL inside a unit carrying an idempotency
//     key — no behavior leaks onto the default path;
//   - a backend rejection surfaces as a thrown error so the route returns a
//     non-2xx and Stripe retries (idempotency / dedup itself is in route.ts
//     and is not touched here).

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createSupabaseWebhookWriteDataSource,
  createAzureWebhookWriteDataSource,
} from '../webhookWriteAdapter';
import type { DataPlaneWriteAdapter, WriteResult, WriteUnit } from '../types';
import { writeOk, writeRejected } from '../types';

// --- Supabase plane (DEFAULT) ----------------------------------------------

/** A Supabase client mock recording `.from().update().eq()` calls. */
function fakeSupabase(error: { message: string } | null = null): {
  client: SupabaseClient;
  calls: Array<{ table: string; patch: Record<string, unknown>; col: string; val: unknown }>;
} {
  const calls: Array<{
    table: string;
    patch: Record<string, unknown>;
    col: string;
    val: unknown;
  }> = [];
  const client = {
    from(table: string) {
      return {
        update(patch: Record<string, unknown>) {
          return {
            eq(col: string, val: unknown) {
              calls.push({ table, patch, col, val });
              return Promise.resolve({ error });
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe('supabase webhook write data source (default plane)', () => {
  it('setInvoiceStatus issues the verbatim invoices UPDATE keyed by stripe id', async () => {
    const { client, calls } = fakeSupabase();
    const ds = createSupabaseWebhookWriteDataSource(() => client);
    await ds.setInvoiceStatus({
      eventId: 'evt_1',
      stripeInvoiceId: 'in_123',
      status: 'sent',
    });
    expect(calls).toEqual([
      { table: 'invoices', patch: { status: 'sent' }, col: 'stripe_invoice_id', val: 'in_123' },
    ]);
  });

  it('setInvoiceStatus writes paid_at only when supplied (invoice.paid)', async () => {
    const { client, calls } = fakeSupabase();
    const ds = createSupabaseWebhookWriteDataSource(() => client);
    await ds.setInvoiceStatus({
      eventId: 'evt_2',
      stripeInvoiceId: 'in_456',
      status: 'paid',
      paidAt: '2026-05-15T00:00:00.000Z',
    });
    expect(calls[0].patch).toEqual({
      status: 'paid',
      paid_at: '2026-05-15T00:00:00.000Z',
    });
  });

  it('setEngagementOutcomeFeeStatus issues the verbatim engagements UPDATE by id', async () => {
    const { client, calls } = fakeSupabase();
    const ds = createSupabaseWebhookWriteDataSource(() => client);
    await ds.setEngagementOutcomeFeeStatus({
      eventId: 'evt_3',
      engagementId: 'eng-9',
      status: 'paid',
    });
    expect(calls).toEqual([
      {
        table: 'engagements',
        patch: { outcome_fee_status: 'paid' },
        col: 'id',
        val: 'eng-9',
      },
    ]);
  });

  it('throws on a Supabase error so the route returns non-2xx and Stripe retries', async () => {
    const { client } = fakeSupabase({ message: 'connection reset' });
    const ds = createSupabaseWebhookWriteDataSource(() => client);
    await expect(
      ds.setInvoiceStatus({ eventId: 'e', stripeInvoiceId: 'in_x', status: 'overdue' }),
    ).rejects.toThrow(/webhook_invoice_update_failed: connection reset/);
  });
});

// --- Azure plane (opt-in) ---------------------------------------------------

/** A write adapter that records the units committed to it. */
function recordingAdapter(
  result: WriteResult<void> = writeOk<void>(undefined),
): { adapter: DataPlaneWriteAdapter; units: WriteUnit<unknown>[]; sql: string[] } {
  const units: WriteUnit<unknown>[] = [];
  const sql: string[] = [];
  const adapter: DataPlaneWriteAdapter = {
    name: 'azure-postgres',
    async commit<T>(unit: WriteUnit<T>): Promise<WriteResult<T>> {
      units.push(unit as WriteUnit<unknown>);
      // Drive the unit body so the emitted SQL is observable.
      await unit.run(async (s) => {
        sql.push(s);
        return [];
      });
      return result as WriteResult<T>;
    },
    async appendAudit() {
      return writeOk({ id: 'x' });
    },
  };
  return { adapter, units, sql };
}

describe('azure webhook write data source (opt-in plane)', () => {
  it('routes the invoice UPDATE through commit with an idempotency key', async () => {
    const { adapter, units, sql } = recordingAdapter();
    const ds = createAzureWebhookWriteDataSource(adapter);
    await ds.setInvoiceStatus({
      eventId: 'evt_1',
      stripeInvoiceId: 'in_123',
      status: 'overdue',
    });
    expect(units).toHaveLength(1);
    expect(units[0].idempotencyKey).toBe('stripe_webhook:invoice:evt_1:in_123');
    expect(sql[0]).toContain('UPDATE invoices SET status = $1');
    expect(sql[0]).toContain('WHERE stripe_invoice_id = $2');
  });

  it('emits the paid_at column in the SQL when paidAt is supplied', async () => {
    const { adapter, sql } = recordingAdapter();
    const ds = createAzureWebhookWriteDataSource(adapter);
    await ds.setInvoiceStatus({
      eventId: 'evt_2',
      stripeInvoiceId: 'in_456',
      status: 'paid',
      paidAt: '2026-05-15T00:00:00.000Z',
    });
    expect(sql[0]).toContain('paid_at = $2');
  });

  it('routes the engagement UPDATE through commit keyed by id', async () => {
    const { adapter, units, sql } = recordingAdapter();
    const ds = createAzureWebhookWriteDataSource(adapter);
    await ds.setEngagementOutcomeFeeStatus({
      eventId: 'evt_3',
      engagementId: 'eng-9',
      status: 'paid',
    });
    expect(units[0].idempotencyKey).toBe('stripe_webhook:engagement:evt_3:eng-9');
    expect(sql[0]).toContain('UPDATE engagements SET outcome_fee_status = $1');
  });

  it('throws when the write adapter rejects the commit', async () => {
    const { adapter } = recordingAdapter(writeRejected<void>('backend_error', 'down'));
    const ds = createAzureWebhookWriteDataSource(adapter);
    await expect(
      ds.setInvoiceStatus({ eventId: 'e', stripeInvoiceId: 'in_x', status: 'sent' }),
    ).rejects.toThrow(/webhook_invoice_update_failed: backend_error \(down\)/);
  });
});
