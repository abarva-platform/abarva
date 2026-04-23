import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Priority 2 item 2 · phase-gate advancement that moves a program forward.
//
// POST /api/programs/phase-gate
// body: { programCode: string, fromPhase: number, toPhase: number, gateCriterion?: string }
//
// Persists to `.approvals/phase-gates.json` · separate ledger from
// approvals to keep event kinds cleanly split. Records approver identity +
// timestamp so the assigned-to-me queue + notifications layers can read it.

interface PhaseGateEntry {
  id: string;
  programCode: string;
  fromPhase: number;
  toPhase: number;
  gateCriterion: string;
  advancedById: string;
  advancedByEmail: string | null;
  advancedByName: string | null;
  advancedByRole: string | null;
  timestamp: string;
}

interface PhaseGateLedger {
  schemaVersion: '1.0';
  entries: PhaseGateEntry[];
}

const LEDGER_DIR = join(process.cwd(), '.approvals');
const LEDGER_PATH = join(LEDGER_DIR, 'phase-gates.json');

function readLedger(): PhaseGateLedger {
  if (!existsSync(LEDGER_PATH)) return { schemaVersion: '1.0', entries: [] };
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as PhaseGateLedger;
  } catch {
    return { schemaVersion: '1.0', entries: [] };
  }
}

function writeLedger(ledger: PhaseGateLedger): void {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Partial<PhaseGateEntry>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const programCode = typeof body.programCode === 'string' ? body.programCode.trim() : '';
  const fromPhase = typeof body.fromPhase === 'number' ? body.fromPhase : null;
  const toPhase = typeof body.toPhase === 'number' ? body.toPhase : null;
  const gateCriterion = typeof body.gateCriterion === 'string' ? body.gateCriterion.trim() : 'Phase gate advance';
  if (!programCode || fromPhase === null || toPhase === null) {
    return NextResponse.json({ error: 'programCode, fromPhase, toPhase required' }, { status: 400 });
  }
  if (toPhase !== fromPhase + 1) {
    return NextResponse.json({ error: 'toPhase must be fromPhase + 1' }, { status: 400 });
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);
  const role = (user.publicMetadata?.role as string | undefined) ?? null;
  const email = user.emailAddresses[0]?.emailAddress ?? null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || email;

  const entry: PhaseGateEntry = {
    id: `${programCode}:P${fromPhase}->P${toPhase}:${Date.now()}`,
    programCode,
    fromPhase,
    toPhase,
    gateCriterion,
    advancedById: session.userId,
    advancedByEmail: email,
    advancedByName: name,
    advancedByRole: role,
    timestamp: new Date().toISOString(),
  };

  const ledger = readLedger();
  ledger.entries.push(entry);
  writeLedger(ledger);

  return NextResponse.json({ ok: true, entry });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const programCode = request.nextUrl.searchParams.get('programCode');
  const ledger = readLedger();
  const filtered = ledger.entries
    .filter((e) => (programCode ? e.programCode === programCode : true))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return NextResponse.json({ ok: true, entries: filtered });
}
