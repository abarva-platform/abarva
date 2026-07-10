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

// Inbound private-preview lead notifications go here.
const LEAD_INBOX = 'admin@abarva.ai';
const DEFAULT_REQUEST_ACCESS_FROM = 'AbarVa Preview <support@send.abarva.ai>';

function requestAccessFrom(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_REQUEST_ACCESS_FROM;
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function sendRequestAccessOperationalAlert(input: {
  severity: 'warning' | 'critical';
  failures: string[];
  lead: {
    name: string;
    email: string;
    company: string;
    role: string | null;
    company_size: string | null;
    industry: string | null;
    org_type: string;
    initiative: string | null;
    source: string;
    user_agent: string | null;
  };
  stored: boolean;
  emailed: boolean;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[request-access] operational alert skipped: RESEND_API_KEY missing', {
      severity: input.severity,
      failures: input.failures,
      stored: input.stored,
      emailed: input.emailed,
    });
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: requestAccessFrom(),
      to: [LEAD_INBOX],
      subject: `[AbarVa alert] Request access ${input.severity}`,
      text: [
        `Request-access ${input.severity} alert`,
        '',
        'The public private-preview request path hit an operational failure.',
        '',
        `Failures: ${input.failures.join('; ')}`,
        `Stored in access_requests: ${input.stored ? 'yes' : 'no'}`,
        `Lead email sent: ${input.emailed ? 'yes' : 'no'}`,
        '',
        'Lead context:',
        `Name:          ${input.lead.name}`,
        `Work email:    ${input.lead.email}`,
        `Company:       ${input.lead.company}`,
        `Role:          ${input.lead.role ?? '-'}`,
        `Company size:  ${input.lead.company_size ?? '-'}`,
        `Industry:      ${input.lead.industry ?? '-'}`,
        `Org type:      ${input.lead.org_type}`,
        `Source:        ${input.lead.source}`,
        `User agent:    ${input.lead.user_agent ?? '-'}`,
        '',
        'Top AI initiative to pressure-test:',
        input.lead.initiative ?? '-',
      ].join('\n'),
    });
    return true;
  } catch (err) {
    console.error('[request-access] operational alert failed:', err);
    return false;
  }
}

/**
 * Public, unauthenticated lead capture for the signed-out marketing landing page.
 * Stores the request in `access_requests` (durable) and emails admin@abarva.ai
 * via Resend (notification). Both paths are best-effort; we only fail the request
 * if neither durable path succeeds in production.
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
  const failures: string[] = [];

  // 1) Durable store.
  try {
    const sb = getAzureWriteFluentClient();
    const { error } = await sb.from('access_requests').insert(lead);
    if (error) throw new Error(error.message ?? String(error));
    stored = true;
  } catch (err) {
    console.error('[request-access] store failed:', err);
    failures.push(`store_failed: ${formatError(err)}`);
  }

  // 2) Notify admin@abarva.ai.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: requestAccessFrom(),
        to: [LEAD_INBOX],
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
      failures.push(`lead_email_failed: ${formatError(err)}`);
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.info('[request-access] (no RESEND_API_KEY set) lead:', lead);
  } else {
    failures.push('lead_email_skipped: RESEND_API_KEY missing');
  }

  if (failures.length > 0) {
    await sendRequestAccessOperationalAlert({
      severity: stored || emailed ? 'warning' : 'critical',
      failures,
      lead,
      stored,
      emailed,
    });
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
