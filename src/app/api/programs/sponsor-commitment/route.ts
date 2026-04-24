import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { checkTenantAccessByKey, tenantKeyForProgramCode } from '@/lib/auth/tenant-access';
import {
  validateSponsorCommitment,
  type SponsorCommitmentInput,
  type SponsorCommitmentLedger,
  type SponsorCommitmentRecord,
} from '@/lib/workflow/sponsorCommitment';

// FM-03 P0 · sponsor commitment persistence
//
// POST /api/programs/sponsor-commitment
// body: SponsorCommitmentInput — see src/lib/workflow/sponsorCommitment.ts
//
// GET  /api/programs/sponsor-commitment?programCode=APX-01
// returns the most recent commitment record for that programCode, or null.
//
// Tenant gate shape matches /api/programs/approve (C2-07) — cross-tenant
// requests return 403. The commitment must be signed by a member of the
// tenant that owns the program.
//
// Persistence: .approvals/sponsor-commitments.json ledger file (same
// pattern as approvals / phase-gates). Production swaps to Supabase.

const LEDGER_DIR = join(process.cwd(), '.approvals');
const LEDGER_PATH = join(LEDGER_DIR, 'sponsor-commitments.json');

function readLedger(): SponsorCommitmentLedger {
  if (!existsSync(LEDGER_PATH)) return { schemaVersion: '1.0', entries: [] };
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as SponsorCommitmentLedger;
  } catch {
    return { schemaVersion: '1.0', entries: [] };
  }
}

function writeLedger(ledger: SponsorCommitmentLedger): void {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Partial<SponsorCommitmentInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const errors = validateSponsorCommitment(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
  }

  // Tenant gate · same pattern as /api/programs/approve. The sponsor must
  // be a member of the tenant that owns this programCode.
  const programCode = body.programCode as string;
  const ownerKey = tenantKeyForProgramCode(programCode);
  if (!ownerKey) {
    return NextResponse.json({ error: 'unknown programCode' }, { status: 404 });
  }
  const access = await checkTenantAccessByKey(ownerKey);
  if (!access.ok) {
    const status = access.reason === 'unauthenticated' ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);
  const email = user.emailAddresses[0]?.emailAddress ?? null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || email;

  const record: SponsorCommitmentRecord = {
    id: `${programCode}:${Date.now()}`,
    programCode,
    budgetCeiling: body.budgetCeiling!,
    decisionGates: body.decisionGates!,
    resistanceInterventions: body.resistanceInterventions!,
    timeAllocation: body.timeAllocation!,
    sponsorUserId: session.userId,
    sponsorEmail: email,
    sponsorName: name,
    committedAt: new Date().toISOString(),
  };

  const ledger = readLedger();
  ledger.entries.push(record);
  writeLedger(ledger);

  return NextResponse.json({ ok: true, record });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const programCode = request.nextUrl.searchParams.get('programCode');
  if (!programCode) {
    return NextResponse.json({ error: 'programCode required' }, { status: 400 });
  }

  const ownerKey = tenantKeyForProgramCode(programCode);
  if (!ownerKey) {
    return NextResponse.json({ error: 'unknown programCode' }, { status: 404 });
  }
  const access = await checkTenantAccessByKey(ownerKey);
  if (!access.ok) {
    const status = access.reason === 'unauthenticated' ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const ledger = readLedger();
  const matches = ledger.entries.filter((e) => e.programCode === programCode).sort((a, b) => (a.committedAt < b.committedAt ? 1 : -1));

  return NextResponse.json({ ok: true, record: matches[0] ?? null, history: matches });
}
