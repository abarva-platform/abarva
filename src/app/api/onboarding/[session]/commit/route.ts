import type { NextRequest } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { asOnboardingSupabaseClient, commitOnboardingSession } from '@/lib/onboarding/apex-p18-pack-ingestion';
import { getServerSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ session: string }> }): Promise<Response> {
  try {
    await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const { session: sessionId } = await params;
  try {
    const session = await commitOnboardingSession(asOnboardingSupabaseClient(getServerSupabase()), sessionId);
    return Response.json({ ok: true, session });
  } catch (error) {
    return Response.json({
      error: 'commit_failed',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 400 });
  }
}
