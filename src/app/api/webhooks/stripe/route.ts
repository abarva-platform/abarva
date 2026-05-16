import { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient, isStripeConfigured } from '@/lib/billing/stripe';
import { webhookWriteDataSource } from '@/lib/data-plane/write-adapters/webhookWriteAdapter';

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

  // DB writes route through the data-plane write seam (Slice 3e). Signature
  // verification, event dedup, and which events are handled are unchanged.
  const writes = webhookWriteDataSource;

  try {
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      await writes.setInvoiceStatus({
        eventId: event.id,
        stripeInvoiceId: invoice.id as string,
        status: 'paid',
        paidAt: new Date().toISOString(),
      });
      const engagementId = (invoice.metadata as Record<string, string> | null)?.engagement_id;
      if (engagementId) {
        await writes.setEngagementOutcomeFeeStatus({
          eventId: event.id,
          engagementId,
          status: 'paid',
        });
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      await writes.setInvoiceStatus({
        eventId: event.id,
        stripeInvoiceId: invoice.id as string,
        status: 'overdue',
      });
    } else if (event.type === 'invoice.finalized') {
      const invoice = event.data.object as Stripe.Invoice;
      await writes.setInvoiceStatus({
        eventId: event.id,
        stripeInvoiceId: invoice.id as string,
        status: 'sent',
      });
    }
  } catch (err) {
    console.error('[stripe-webhook-handler]', err);
    return new Response('handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
