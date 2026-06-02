import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION,
  currentUserCanSignSystemRoleAcknowledgment,
  getSystemRoleAcknowledgmentSubjectForRequest,
  recordSystemRoleAcknowledgment,
} from '@/lib/ai-liability/system-role-acknowledgment';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    body.accepted !== true ||
    body.textVersion !== SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION
  ) {
    return NextResponse.json(
      { error: 'current system role acknowledgment must be accepted' },
      { status: 400 },
    );
  }

  const subject = await getSystemRoleAcknowledgmentSubjectForRequest().catch(
    () => null,
  );
  if (!subject) {
    return NextResponse.json(
      { error: 'system role acknowledgment subject unavailable' },
      { status: 503 },
    );
  }

  if (!(await currentUserCanSignSystemRoleAcknowledgment())) {
    return NextResponse.json(
      { error: 'tenant admin access required' },
      { status: 403 },
    );
  }

  const requestHeaders = await headers();
  const ipAddress = firstForwardedIp(requestHeaders.get('x-forwarded-for'));
  const userAgent = requestHeaders.get('user-agent');
  const result = await recordSystemRoleAcknowledgment({
    subject,
    ipAddress,
    userAgent,
    source: 'tenant_admin_onboarding',
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'system role acknowledgment ledger unavailable' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}

function firstForwardedIp(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}
