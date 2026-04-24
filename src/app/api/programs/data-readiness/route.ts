import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { checkTenantAccessByKey, tenantKeyForProgramCode } from '@/lib/auth/tenant-access';
import {
  validateDataReadiness,
  type DataReadinessInput,
  type DataReadinessLedger,
  type DataReadinessRecord,
} from '@/lib/workflow/dataReadiness';

// FM-02 · data readiness ledger API
//
// POST body: DataReadinessInput (all five dimensions)
// GET ?programCode=APX-01 returns latest record or null.

const LEDGER_DIR = join(process.cwd(), '.approvals');
const LEDGER_PATH = join(LEDGER_DIR, 'data-readiness.json');

function readLedger(): DataReadinessLedger {
  if (!existsSync(LEDGER_PATH)) return { schemaVersion: '1.0', entries: [] };
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as DataReadinessLedger;
  } catch {
    return { schemaVersion: '1.0', entries: [] };
  }
}

function writeLedger(ledger: DataReadinessLedger): void {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: Partial<DataReadinessInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const errors = validateDataReadiness(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
  }

  const programCode = body.programCode as string;
  const ownerKey = tenantKeyForProgramCode(programCode);
  if (!ownerKey) return NextResponse.json({ error: 'unknown programCode' }, { status: 404 });
  const access = await checkTenantAccessByKey(ownerKey);
  if (!access.ok) {
    const status = access.reason === 'unauthenticated' ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.emailAddresses[0]?.emailAddress || null;

  const record: DataReadinessRecord = {
    ...(body as DataReadinessInput),
    id: `${programCode}:readiness:${Date.now()}`,
    assessedById: session.userId,
    assessedByName: name,
    assessedAt: new Date().toISOString(),
  };

  const ledger = readLedger();
  ledger.entries.push(record);
  writeLedger(ledger);

  return NextResponse.json({ ok: true, record });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const programCode = request.nextUrl.searchParams.get('programCode');
  if (!programCode) return NextResponse.json({ error: 'programCode required' }, { status: 400 });

  const ownerKey = tenantKeyForProgramCode(programCode);
  if (!ownerKey) return NextResponse.json({ error: 'unknown programCode' }, { status: 404 });
  const access = await checkTenantAccessByKey(ownerKey);
  if (!access.ok) {
    const status = access.reason === 'unauthenticated' ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const ledger = readLedger();
  const matches = ledger.entries
    .filter((e) => e.programCode === programCode)
    .sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : -1));

  return NextResponse.json({ ok: true, record: matches[0] ?? null, history: matches });
}
