import type { NextRequest } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { asOnboardingSupabaseClient, getOnboardingSession } from '@/lib/onboarding/apex-p18-pack-ingestion';
import { getServerSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ session: string }> }): Promise<Response> {
  try {
    await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const { session: sessionId } = await params;
  const session = await getOnboardingSession(asOnboardingSupabaseClient(getServerSupabase()), sessionId);
  if (!session) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }
  return Response.json({ ok: true, session });
}
