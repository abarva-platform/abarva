import Stripe from 'stripe';
import { getServerSupabase } from '@/lib/supabase-server';
import { getEngagementById } from '@/lib/db/engagement';

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  client = new Stripe(key);
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function ensureStripeCustomerForClient(clientId: string): Promise<string> {
  const sb = getServerSupabase();
  const { data: clientRow, error } = await sb.from('clients').select('*').eq('id', clientId).single();
  if (error || !clientRow) throw new Error('Client not found');
  if (clientRow.stripe_customer_id) return clientRow.stripe_customer_id as string;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    name: (clientRow.legal_name as string | null) ?? (clientRow.name as string),
    email: (clientRow.billing_email as string | null) ?? undefined,
    metadata: {
      client_id: clientRow.id as string,
      industry: (clientRow.industry_code as string | null) ?? '',
    },
  });

  await sb.from('clients').update({ stripe_customer_id: customer.id }).eq('id', clientId);
  return customer.id;
}

export async function createOutcomeFeeInvoice(
  engagementId: string,
  feeUsd: number,
): Promise<{ stripe_invoice_id: string; row_id: string } | null> {
  if (!isStripeConfigured()) {
    console.warn('[billing] STRIPE_SECRET_KEY not set — skipping invoice creation');
    return null;
  }

  const engagement = await getEngagementById(engagementId);
  if (!engagement) throw new Error('Engagement not found');
  const clientId = (engagement as unknown as { client_id?: string }).client_id ?? null;
  if (!clientId) throw new Error('Engagement has no client_id — run migration 020 first');

  const customerId = await ensureStripeCustomerForClient(clientId);
  const stripe = getStripeClient();

  await stripe.invoiceItems.create({
    customer: customerId,
    amount: Math.round(feeUsd * 100),
    currency: 'usd',
    description: `AbarVa outcome fee — ${engagement.name}`,
  });

  const stripeInvoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true,
    metadata: { engagement_id: engagementId },
  });

  if (stripeInvoice.id) {
    await stripe.invoices.finalizeInvoice(stripeInvoice.id);
  }

  const sb = getServerSupabase();
  const { data: inserted, error: insErr } = await sb
    .from('invoices')
    .insert({
      engagement_id: engagementId,
      client_id: clientId,
      stripe_invoice_id: stripeInvoice.id,
      amount_usd: feeUsd,
      status: 'sent',
      due_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })
    .select()
    .single();
  if (insErr) throw insErr;

  await sb.from('engagements').update({ outcome_fee_status: 'invoiced' }).eq('id', engagementId);

  return {
    stripe_invoice_id: stripeInvoice.id ?? '',
    row_id: (inserted as { id: string }).id,
  };
}
