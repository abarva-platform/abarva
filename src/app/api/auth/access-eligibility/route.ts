import { NextResponse } from 'next/server';
import { isLaunchApprovedEmail, getLaunchAccessProfile } from '@/lib/auth/launch-access-server';

export const dynamic = 'force-dynamic';

interface AccessEligibilityRequestBody {
  email?: string;
}

export async function POST(request: Request) {
  let body: AccessEligibilityRequestBody;

  try {
    body = (await request.json()) as AccessEligibilityRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid_request_body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !isLaunchApprovedEmail(email)) {
    return NextResponse.json({ error: 'access_not_provisioned' }, { status: 403 });
  }

  const profile = getLaunchAccessProfile(email);
  return NextResponse.json({
    ok: true,
    role: profile?.role ?? 'client',
    clientKey: profile?.clientKey ?? null,
  });
}
