import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Priority 1 · User provisioning end-to-end.
//
// POST /api/admin/invite
// body: { email: string, role?: 'admin'|'maestro'|'client_viewer'|'observer', clientId?: string, clientName?: string }
//
// Callers: admin UI on /platform/admin/users (Steward surface). Uses Clerk's
// invitation API — email recipient receives a magic link, completes sign-up,
// public metadata is pre-seeded from the invite payload.
//
// Only admin-role callers can invite. Per autonomy charter, destructive /
// privileged operations need explicit gating.

interface InviteBody {
  email?: string;
  role?: string;
  clientId?: string;
  clientName?: string;
  firstName?: string;
  lastName?: string;
}

const ALLOWED_ROLES = new Set(['admin', 'maestro', 'client_viewer', 'observer']);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const clerk = await clerkClient();
  const callingUser = await clerk.users.getUser(session.userId);
  const callingRole = (callingUser.publicMetadata?.role as string | undefined) ?? '';
  if (callingRole !== 'admin') {
    return NextResponse.json({ error: 'forbidden · admin role required' }, { status: 403 });
  }

  let body: InviteBody;
  try {
    body = (await request.json()) as InviteBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }
  const role = typeof body.role === 'string' && ALLOWED_ROLES.has(body.role) ? body.role : 'client_viewer';

  const publicMetadata: Record<string, unknown> = { role };
  if (body.clientId) publicMetadata.clientId = body.clientId;
  if (body.clientName) publicMetadata.clientName = body.clientName;
  if (body.clientId) publicMetadata.defaultClientId = body.clientId;

  try {
    const invite = await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata,
      redirectUrl: `${getAppUrl(request)}/auth-redirect`,
      notify: true,
    });
    return NextResponse.json({
      ok: true,
      invitationId: invite.id,
      email: invite.emailAddress,
      status: invite.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invite failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/admin/invite · list pending invitations (admin only).
export async function GET() {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const clerk = await clerkClient();
  const callingUser = await clerk.users.getUser(session.userId);
  const callingRole = (callingUser.publicMetadata?.role as string | undefined) ?? '';
  if (callingRole !== 'admin') {
    return NextResponse.json({ error: 'forbidden · admin role required' }, { status: 403 });
  }
  try {
    const list = await clerk.invitations.getInvitationList({ limit: 50, status: 'pending' });
    const data = Array.isArray(list) ? list : list.data;
    return NextResponse.json({
      ok: true,
      invitations: data.map((inv) => ({
        id: inv.id,
        email: inv.emailAddress,
        status: inv.status,
        createdAt: inv.createdAt,
        publicMetadata: inv.publicMetadata ?? {},
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'list failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getAppUrl(request: NextRequest): string {
  const host = request.headers.get('host') ?? 'app.abarva.ai';
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}
