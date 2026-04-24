import { currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getActiveClientRow } from '@/lib/active-client';
import { isExternalOnlyRole, resolveSessionRole } from '@/lib/auth/access-routing';
import { runSentinelTurn } from '@/lib/sentinel/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await currentUser().catch(() => null);
  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const email = user.primaryEmailAddress?.emailAddress
    ?? user.emailAddresses?.[0]?.emailAddress
    ?? null;
  const role = resolveSessionRole(user.publicMetadata?.role as string | undefined, email);
  if (isExternalOnlyRole(role)) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    message?: string;
    activePatternSlug?: string | null;
    clientKey?: string | null;
  };
  const message = body.message?.trim();
  if (!message) {
    return Response.json({ error: 'bad_request', detail: 'message required' }, { status: 400 });
  }

  const activeClient = await getActiveClientRow(body.clientKey);
  if (!activeClient) {
    return Response.json({ error: 'client_not_found' }, { status: 404 });
  }

  const result = await runSentinelTurn({
    ctx: {
      clientKey: activeClient.key,
      clientName: activeClient.name,
      industryCode: activeClient.industry_code,
      userId: user.id,
    },
    message,
    activePatternSlug: body.activePatternSlug,
  });

  return Response.json(result);
}
