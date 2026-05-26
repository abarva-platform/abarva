// Stripe-webhook domain write adapter — Slice 3e of the write-path migration.
//
// Per `docs/architecture/azure/DATA-ACCESS-ADAPTER-WRITE-PATH-DESIGN.md`
// (§3, Slice 3e), the Stripe webhook route persists billing state with a
// small set of plain `UPDATE`s keyed by Stripe identifiers: an invoice
// status transition (paid / overdue / sent), an optional paid timestamp,
// and — on `invoice.paid` — an engagement outcome-fee status.
//
// This module routes ONLY those Postgres writes behind the data-plane write
// seam. It does NOT touch — and must never touch — Stripe webhook signature
// verification, event idempotency / dedup, which events are handled, or any
// amount / currency / financial computation. Those stay verbatim in
// `route.ts`. The migration here is purely: take the existing DB UPDATE and
// route it through `selectWriteAdapter()`.
//
// Why this domain module exists separately from the generic adapters:
//
//  - The webhook's DB writes are `UPDATE`s, not the append-only INSERT that
//    `appendAudit` models, so they are committed as `WriteUnit`s via
//    `commit()`.
//  - The Supabase write adapter's `commit()` statement runner executes SQL
//    through a `data_plane_exec` RPC. For a FINANCIAL route we will not make
//    correctness contingent on an RPC that is not yet provisioned in
//    production — so on the Supabase plane this module issues the *exact*
//    `.update()` calls the route performed pre-seam. The row writes are
//    byte-faithful and the default production behavior is unchanged.
//  - On the Azure plane (`ABARVA_DATA_PLANE=azure-postgres`, opt-in only,
//    rehearsal / post-flip) the same operations route through the Azure
//    write adapter's `commit()` as parameterized, transaction-scoped SQL.
//
// Idempotency: the webhook's own event dedup (in `route.ts`) is the primary
// guard and is untouched. Each `WriteUnit` additionally carries an
// `idempotencyKey` derived from the Stripe event + invoice id, so a replayed
// commit on the Azure path is uniform with the rest of the write seam. The
// underlying writes are themselves idempotent — they set a target state by a
// stable key, so a replay re-applies the same state.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import { getServerSupabase } from '@/lib/supabase-server';
import { selectWriteAdapter } from './index';
import type { DataPlaneWriteAdapter, WriteStatementRunner } from './types';

/** Status an invoice row may be moved to by a webhook event. */
export type InvoiceStatus = 'paid' | 'overdue' | 'sent';

/** Outcome-fee status an engagement row may be moved to. */
export type EngagementOutcomeFeeStatus = 'paid';

/**
 * The webhook persistence surface. One method per DB write the Stripe
 * webhook performs. The route calls these instead of touching Supabase
 * directly; the physical plane is an implementation detail chosen by
 * `ABARVA_DATA_PLANE`.
 */
export interface WebhookWriteDataSource {
  /**
   * Move an invoice row (matched by `stripe_invoice_id`) to `status`.
   * When `paidAt` is supplied it is also written to `paid_at` — this is the
   * `invoice.paid` transition. The `eventId` is used only to build the
   * idempotency key; it carries no financial meaning.
   */
  setInvoiceStatus(args: {
    eventId: string;
    stripeInvoiceId: string;
    status: InvoiceStatus;
    paidAt?: string;
  }): Promise<void>;

  /**
   * Move an engagement row (matched by primary-key `id`) outcome-fee status.
   * Only invoked on `invoice.paid` when the invoice metadata carries an
   * `engagement_id`.
   */
  setEngagementOutcomeFeeStatus(args: {
    eventId: string;
    engagementId: string;
    status: EngagementOutcomeFeeStatus;
  }): Promise<void>;
}

/** Stable tenant scope for the webhook write units. Billing writes are not
 * tenant-keyed at the row level (they match on Stripe ids), so the unit
 * carries the platform scope purely to satisfy the contract shape. */
const WEBHOOK_TENANT_SCOPE = 'platform-billing';
/** Actor for the write units — the webhook acts as the Stripe system actor. */
const WEBHOOK_ACTOR = 'system:stripe-webhook';

/**
 * Supabase implementation — the DEFAULT plane. Issues the verbatim
 * `.update()` calls the pre-seam route performed: identical tables, identical
 * column bodies, identical match keys. Production behavior is unchanged.
 *
 * The Supabase client factory is injectable so tests drive it without a live
 * backend.
 */
export function createSupabaseWebhookWriteDataSource(
  getClient: () => SupabaseClient = getServerSupabase,
): WebhookWriteDataSource {
  return {
    async setInvoiceStatus({ stripeInvoiceId, status, paidAt }): Promise<void> {
      const sb = getClient();
      const patch: Record<string, unknown> = { status };
      if (paidAt !== undefined) patch.paid_at = paidAt;
      const { error } = await sb
        .from('invoices')
        .update(patch)
        .eq('stripe_invoice_id', stripeInvoiceId);
      if (error) {
        throw new Error(`webhook_invoice_update_failed: ${error.message}`);
      }
    },

    async setEngagementOutcomeFeeStatus({ engagementId, status }): Promise<void> {
      const sb = getClient();
      const { error } = await sb
        .from('engagements')
        .update({ outcome_fee_status: status })
        .eq('id', engagementId);
      if (error) {
        throw new Error(`webhook_engagement_update_failed: ${error.message}`);
      }
    },
  };
}

/**
 * Azure Postgres implementation — opt-in (`ABARVA_DATA_PLANE=azure-postgres`),
 * rehearsal / post-flip only. Routes each UPDATE through the Azure write
 * adapter's `commit()`, so the statement runs inside a real transaction with
 * the per-user RLS context set, exactly as the generic write adapter does.
 *
 * The write adapter is injectable so tests drive it without a live backend.
 */
export function createAzureWebhookWriteDataSource(
  writeAdapter: DataPlaneWriteAdapter = selectWriteAdapter('azure-postgres'),
): WebhookWriteDataSource {
  return {
    async setInvoiceStatus({ eventId, stripeInvoiceId, status, paidAt }): Promise<void> {
      const result = await writeAdapter.commit<void>({
        idempotencyKey: `stripe_webhook:invoice:${eventId}:${stripeInvoiceId}`,
        tenantKey: WEBHOOK_TENANT_SCOPE,
        actorUserId: WEBHOOK_ACTOR,
        async run(stmt: WriteStatementRunner) {
          if (paidAt !== undefined) {
            await stmt(
              'UPDATE invoices SET status = $1, paid_at = $2 WHERE stripe_invoice_id = $3',
              [status, paidAt, stripeInvoiceId],
            );
          } else {
            await stmt('UPDATE invoices SET status = $1 WHERE stripe_invoice_id = $2', [
              status,
              stripeInvoiceId,
            ]);
          }
        },
      });
      if (!result.ok) {
        throw new Error(
          `webhook_invoice_update_failed: ${result.reason}` +
            (result.detail ? ` (${result.detail})` : ''),
        );
      }
    },

    async setEngagementOutcomeFeeStatus({ eventId, engagementId, status }): Promise<void> {
      const result = await writeAdapter.commit<void>({
        idempotencyKey: `stripe_webhook:engagement:${eventId}:${engagementId}`,
        tenantKey: WEBHOOK_TENANT_SCOPE,
        actorUserId: WEBHOOK_ACTOR,
        async run(stmt: WriteStatementRunner) {
          await stmt('UPDATE engagements SET outcome_fee_status = $1 WHERE id = $2', [
            status,
            engagementId,
          ]);
        },
      });
      if (!result.ok) {
        throw new Error(
          `webhook_engagement_update_failed: ${result.reason}` +
            (result.detail ? ` (${result.detail})` : ''),
        );
      }
    },
  };
}

/**
 * Select the webhook write data source for the configured data plane.
 * Defaults to Supabase — production write behavior is unchanged unless
 * `ABARVA_DATA_PLANE=azure-postgres` is explicitly set.
 */
export function createWebhookWriteDataSource(): WebhookWriteDataSource {
  return selectWriteAdapter().name === 'azure-postgres'
    ? createAzureWebhookWriteDataSource()
    : createSupabaseWebhookWriteDataSource();
}

/** The default webhook write data source, honoring `ABARVA_DATA_PLANE`. */
export const webhookWriteDataSource: WebhookWriteDataSource =
  createWebhookWriteDataSource();
