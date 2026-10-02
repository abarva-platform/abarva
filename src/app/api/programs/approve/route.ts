import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  checkTenantAccessByKey,
  tenantKeyForProgramCode,
} from '@/lib/auth/tenant-access';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { azureRead } from '@/lib/data-plane/azureRead';
import { getSeedPlan } from '@/lib/deliverables/seed-route-resolver';

// Priority 2 item 1 · approval flow that advances state.
//
// POST /api/programs/approve
// body: { programCode: string, deliverableCode: string, phase: number, decision: string }
//
// Legacy local ledger; governed Moves approvals use the v1 program routes.
// Keep approver identity and timestamp attached to each recorded decision.
// Every approval writes the approver (from Clerk session) + timestamp +
// program + deliverable. The ledger is read by GET to surface approvals
// in-product.

interface ApprovalEntry {
  id: string;
  programCode: string;
  deliverableCode: string;
  phase: number;
  decision: string;
  approverId: string;
  approverEmail: string | null;
  approverName: string | null;
  approverRole: string | null;
  timestamp: string;
}

interface ApprovalLedger {
  schemaVersion: '1.0';
  entries: ApprovalEntry[];
}

const LEDGER_DIR = join(process.cwd(), '.approvals');
const LEDGER_PATH = join(LEDGER_DIR, 'ledger.json');

function readLedger(): ApprovalLedger {
  if (!existsSync(LEDGER_PATH)) return { schemaVersion: '1.0', entries: [] };
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as ApprovalLedger;
  } catch {
    return { schemaVersion: '1.0', entries: [] };
  }
}

function writeLedger(ledger: ApprovalLedger): void {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
}

async function resolveProgramEngagement(
  programCode: string,
  ownerKey: string,
): Promise<{ id: string } | null> {
  const program = getSeedPlan().programs.find(
    (entry) =>
      entry.code.trim().toLowerCase() === programCode.trim().toLowerCase(),
  );
  if (!program || program.tenantKey !== ownerKey) return null;
  return azureRead.maybeSingle<{ id: string }>({
    table: 'engagements',
    columns: ['id'],
    where: { graph_node_id: program.graphNodeId },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Partial<ApprovalEntry> & { decision?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const programCode =
    typeof body.programCode === 'string' ? body.programCode.trim() : '';
  const deliverableCode =
    typeof body.deliverableCode === 'string' ? body.deliverableCode.trim() : '';
  const phase = typeof body.phase === 'number' ? body.phase : null;
  const decision =
    typeof body.decision === 'string' ? body.decision.trim() : '';
  if (!programCode || !deliverableCode || phase === null || !decision) {
    return NextResponse.json(
      { error: 'programCode, deliverableCode, phase, decision all required' },
      { status: 400 },
    );
  }

  // Resolve the program's tenant, then require membership before the write.
  const ownerKey = tenantKeyForProgramCode(programCode);
  if (!ownerKey) {
    return NextResponse.json({ error: 'unknown programCode' }, { status: 404 });
  }
  const access = await checkTenantAccessByKey(ownerKey);
  if (!access.ok) {
    const status = access.reason === 'unauthenticated' ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  try {
    const tenantContext = await requireTenancy();
    const engagement = await resolveProgramEngagement(programCode, ownerKey);
    if (!engagement) {
      return NextResponse.json({ error: 'unknown program' }, { status: 404 });
    }
    const policy = await loadUserProgramAccessPolicy(tenantContext, {
      programId: engagement.id,
    });
    if (
      !policy.canApproveGates ||
      (Array.isArray(policy.programIdsAllowed) &&
        !policy.programIdsAllowed.includes(engagement.id))
    ) {
      return NextResponse.json(
        {
          error: 'forbidden',
          detail:
            'Approval requires an authenticated workspace user with approval permission. Sponsor status alone does not grant approval authority.',
        },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        error: 'forbidden',
        detail: 'Could not verify workspace approval permission.',
      },
      { status: 403 },
    );
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);
  const role = (user.publicMetadata?.role as string | undefined) ?? null;
  const email = user.emailAddresses[0]?.emailAddress ?? null;
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || email;

  const entry: ApprovalEntry = {
    id: `${programCode}:${deliverableCode}:${Date.now()}`,
    programCode,
    deliverableCode,
    phase,
    decision,
    approverId: session.userId,
    approverEmail: email,
    approverName: name,
    approverRole: role,
    timestamp: new Date().toISOString(),
  };

  const ledger = readLedger();
  ledger.entries.push(entry);
  writeLedger(ledger);

  return NextResponse.json({ ok: true, entry });
}

// GET /api/programs/approve?programCode=APX-01 · list approvals
// for a program (most recent first).
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const programCode = request.nextUrl.searchParams.get('programCode');
  const deliverableCode = request.nextUrl.searchParams.get('deliverableCode');

  // Tenant gate on reads: when a specific programCode is requested, verify
  // membership first. Absent programCode we return an empty ledger — the
  // caller must name the program to read its approvals.
  if (programCode) {
    const ownerKey = tenantKeyForProgramCode(programCode);
    if (!ownerKey) {
      return NextResponse.json({ ok: true, entries: [] });
    }
    const access = await checkTenantAccessByKey(ownerKey);
    if (!access.ok) {
      const status = access.reason === 'unauthenticated' ? 401 : 403;
      return NextResponse.json({ error: access.reason }, { status });
    }
  } else {
    return NextResponse.json({ ok: true, entries: [] });
  }

  const ledger = readLedger();
  const filtered = ledger.entries
    .filter((e) => (programCode ? e.programCode === programCode : true))
    .filter((e) =>
      deliverableCode ? e.deliverableCode === deliverableCode : true,
    )
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return NextResponse.json({ ok: true, entries: filtered });
}
