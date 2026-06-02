import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
  getResponsibleAiAcknowledgmentSubjectForRequest,
  recordResponsibleAiAcknowledgment,
} from '@/lib/ai-liability/responsible-ai-acknowledgment';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    body.accepted !== true ||
    body.textVersion !== RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION
  ) {
    return NextResponse.json(
      { error: 'current Responsible AI acknowledgment must be accepted' },
      { status: 400 },
    );
  }

  const subject = await getResponsibleAiAcknowledgmentSubjectForRequest().catch(
    () => null,
  );
  if (!subject) {
    return NextResponse.json(
      { error: 'acknowledgment subject unavailable' },
      { status: 503 },
    );
  }

  const requestHeaders = await headers();
  const ipAddress = firstForwardedIp(requestHeaders.get('x-forwarded-for'));
  const userAgent = requestHeaders.get('user-agent');
  const result = await recordResponsibleAiAcknowledgment({
    subject,
    ipAddress,
    userAgent,
    source: 'first_login_clickwrap',
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'acknowledgment ledger unavailable' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}

function firstForwardedIp(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}
