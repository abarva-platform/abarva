import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Priority 2 item 1 · approval flow that advances state.
//
// POST /api/programs/approve
// body: { programCode: string, deliverableCode: string, phase: number, decision: string }
//
// Simple demo-grade persistence: appends to a JSON ledger at
// `.approvals/ledger.json`. Production swaps this for Supabase.
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

  const programCode = typeof body.programCode === 'string' ? body.programCode.trim() : '';
  const deliverableCode = typeof body.deliverableCode === 'string' ? body.deliverableCode.trim() : '';
  const phase = typeof body.phase === 'number' ? body.phase : null;
  const decision = typeof body.decision === 'string' ? body.decision.trim() : '';
  if (!programCode || !deliverableCode || phase === null || !decision) {
    return NextResponse.json({ error: 'programCode, deliverableCode, phase, decision all required' }, { status: 400 });
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);
  const role = (user.publicMetadata?.role as string | undefined) ?? null;
  const email = user.emailAddresses[0]?.emailAddress ?? null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || email;

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
  const ledger = readLedger();
  const filtered = ledger.entries
    .filter((e) => (programCode ? e.programCode === programCode : true))
    .filter((e) => (deliverableCode ? e.deliverableCode === deliverableCode : true))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return NextResponse.json({ ok: true, entries: filtered });
}
