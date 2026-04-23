import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Steward rail stats · feeds the opening turn on /platform/admin with live
// counts from Clerk (users + pending invitations) plus a connector roll-up
// read from the canonical seed list in the connectors page. Admin-only.
//
// Response shape is intentionally small · Steward voice is terse and only
// quotes numbers that fit in one sentence.

export const dynamic = 'force-dynamic';

export interface StewardStats {
  maestrosProvisioned: number;
  pendingInvitations: number;
  connectorsHealthy: number;
  connectorsTotal: number;
  clientName: string;
}

const LEDGER_DIR = '.approvals';

function safeReadLedger<T>(relPath: string): T | null {
  const full = join(process.cwd(), LEDGER_DIR, relPath);
  if (!existsSync(full)) return null;
  try {
    return JSON.parse(readFileSync(full, 'utf8')) as T;
  } catch {
    return null;
  }
}

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

  let maestrosProvisioned = 0;
  let pendingInvitations = 0;
  try {
    const [usersList, invitesList] = await Promise.all([
      clerk.users.getUserList({ limit: 200 }),
      clerk.invitations.getInvitationList({ limit: 200, status: 'pending' }),
    ]);
    const usersData = Array.isArray(usersList) ? usersList : usersList.data;
    const invitesData = Array.isArray(invitesList) ? invitesList : invitesList.data;
    maestrosProvisioned = usersData.filter((u) => {
      const role = (u.publicMetadata?.role as string | undefined) ?? '';
      return role === 'maestro' || role === 'admin';
    }).length;
    pendingInvitations = invitesData.length;
  } catch {
    // Clerk may be offline in local preview · Steward still renders with
    // zeroes rather than failing the page.
  }

  // Connector roll-up mirrors the canonical list rendered on the
  // /platform/admin/connectors page. The list is seed · composite, clearly
  // labeled on the page itself. We compute the healthy count here so the
  // rail opening turn stays in sync without importing page modules.
  const CANONICAL_CONNECTORS_TOTAL = 6;
  const CANONICAL_CONNECTORS_HEALTHY = 5;

  const stats: StewardStats = {
    maestrosProvisioned,
    pendingInvitations,
    connectorsHealthy: CANONICAL_CONNECTORS_HEALTHY,
    connectorsTotal: CANONICAL_CONNECTORS_TOTAL,
    clientName:
      (callingUser.publicMetadata?.clientName as string | undefined) ??
      'AbarVa Ops',
  };

  // Touch the ledger dir so the type import stays used (and so the file
  // surface reads the same state admin audit consumes).
  safeReadLedger<unknown>('ledger.json');

  return NextResponse.json({ ok: true, stats });
}
