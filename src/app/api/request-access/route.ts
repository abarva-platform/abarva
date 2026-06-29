import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { isWorkEmail } from '@/lib/public-site/work-email';

export const runtime = 'nodejs';

type RequestAccessBody = {
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  companySize?: string;
  industry?: string;
  orgType?: string;
  initiative?: string;
};

// Inbound private-preview lead notifications go to the shared intake plus founder copy.
const LEAD_INBOXES = ['admin@abarva.ai', 'anand.sundaram@thesundaram.com'] as const;
const DEFAULT_FROM_EMAIL = 'AbarVa Preview <support@send.abarva.ai>';

function resolveLeadFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
}

/**
 * Public, unauthenticated lead capture for the signed-out marketing landing page.
 * Stores the request in `access_requests` (durable) and emails the private-preview
 * intake recipients via Resend (notification). Both paths are best-effort; we only
 * fail the request if neither durable path succeeds in production.
 */
export async function POST(req: NextRequest) {
  let body: RequestAccessBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const company = body.company?.trim();

  if (!name || !email || !company) {
    return NextResponse.json(
      { error: 'Name, work email, and company are required.' },
      { status: 400 },
    );
  }
  if (!isWorkEmail(email)) {
    return NextResponse.json({ error: 'Please use your work email.' }, { status: 422 });
  }

  const orgType = body.orgType === 'si' ? 'si' : 'enterprise';
  const lead = {
    name,
    email,
    company,
    role: body.role?.trim() || null,
    company_size: body.companySize?.trim() || null,
    industry: body.industry?.trim() || null,
    org_type: orgType,
    initiative: body.initiative?.trim() || null,
    source: 'private-preview-landing',
    user_agent: req.headers.get('user-agent')?.slice(0, 500) || null,
  };

  let stored = false;
  let emailed = false;

  // 1) Durable store.
  try {
    const sb = getAzureWriteFluentClient();
    const { error } = await sb.from('access_requests').insert(lead);
    if (error) throw new Error(error.message ?? String(error));
    stored = true;
  } catch (err) {
    console.error('[request-access] store failed:', err);
  }

  // 2) Notify the private-preview intake recipients.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: resolveLeadFromEmail(),
        to: [...LEAD_INBOXES],
        replyTo: email,
        subject: `Preview request — ${name} · ${company}`,
        text: [
          'New private-preview access request',
          '',
          `Name:          ${name}`,
          `Work email:    ${email}`,
          `Company:       ${company}`,
          `Role:          ${lead.role ?? '—'}`,
          `Company size:  ${lead.company_size ?? '—'}`,
          `Industry:      ${lead.industry ?? '—'}`,
          `Org type:      ${orgType === 'si' ? 'System Integrator / advisory' : 'Enterprise / industry buyer'}`,
          '',
          'Top AI initiative to pressure-test:',
          lead.initiative ?? '—',
        ].join('\n'),
      });
      emailed = true;
    } catch (err) {
      console.error('[request-access] email failed:', err);
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.info('[request-access] (no RESEND_API_KEY set) lead:', lead);
  }

  // In production, only surface an error if we captured the lead nowhere.
  if (process.env.NODE_ENV === 'production' && !stored && !emailed) {
    return NextResponse.json(
      { error: 'Could not submit right now. Please try again, or email admin@abarva.ai.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
