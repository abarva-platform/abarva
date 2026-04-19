import { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient, isStripeConfigured } from '@/lib/billing/stripe';
import { getServerSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return new Response('Stripe not configured', { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return new Response('missing signature or webhook secret', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('[stripe-webhook] bad signature', err);
    return new Response('bad signature', { status: 400 });
  }

  const sb = getServerSupabase();

  try {
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      await sb
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('stripe_invoice_id', invoice.id);
      const engagementId = (invoice.metadata as Record<string, string> | null)?.engagement_id;
      if (engagementId) {
        await sb.from('engagements').update({ outcome_fee_status: 'paid' }).eq('id', engagementId);
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      await sb.from('invoices').update({ status: 'overdue' }).eq('stripe_invoice_id', invoice.id);
    } else if (event.type === 'invoice.finalized') {
      const invoice = event.data.object as Stripe.Invoice;
      await sb.from('invoices').update({ status: 'sent' }).eq('stripe_invoice_id', invoice.id);
    }
  } catch (err) {
    console.error('[stripe-webhook-handler]', err);
    return new Response('handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
