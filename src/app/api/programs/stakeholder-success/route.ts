import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { checkTenantAccessByKey, tenantKeyForProgramCode } from '@/lib/auth/tenant-access';
import {
  validateProgramTension,
  validateStakeholderSuccess,
  type ProgramTensionInput,
  type ProgramTensionRecord,
  type StakeholderSuccessInput,
  type StakeholderSuccessLedger,
  type StakeholderSuccessRecord,
} from '@/lib/workflow/stakeholderSuccess';

// FM-04 P0 · stakeholder success + tension ledger API
//
// POST /api/programs/stakeholder-success
//   body: { kind: 'success', ...StakeholderSuccessInput }
//     OR  { kind: 'tension', ...ProgramTensionInput }
//
// GET /api/programs/stakeholder-success?programCode=APX-01
//   returns both lists filtered to the program.
//
// Tenant-gated per the C2-07 shape. Pair of ledger arrays in one JSON
// file to keep fs writes simple.

const LEDGER_DIR = join(process.cwd(), '.approvals');
const LEDGER_PATH = join(LEDGER_DIR, 'stakeholder-success.json');

function readLedger(): StakeholderSuccessLedger {
  if (!existsSync(LEDGER_PATH)) return { schemaVersion: '1.0', successEntries: [], tensionEntries: [] };
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as StakeholderSuccessLedger;
  } catch {
    return { schemaVersion: '1.0', successEntries: [], tensionEntries: [] };
  }
}

function writeLedger(ledger: StakeholderSuccessLedger): void {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
}

type PostBody =
  | { kind: 'success'; record: Partial<StakeholderSuccessInput> }
  | { kind: 'tension'; record: Partial<ProgramTensionInput> };

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (!body || (body.kind !== 'success' && body.kind !== 'tension')) {
    return NextResponse.json({ error: 'kind must be "success" or "tension"' }, { status: 400 });
  }

  const programCode = body.record?.programCode?.trim() ?? '';
  if (!programCode) {
    return NextResponse.json({ error: 'programCode required' }, { status: 400 });
  }

  const ownerKey = tenantKeyForProgramCode(programCode);
  if (!ownerKey) return NextResponse.json({ error: 'unknown programCode' }, { status: 404 });
  const access = await checkTenantAccessByKey(ownerKey);
  if (!access.ok) {
    const status = access.reason === 'unauthenticated' ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);
  const capturedByName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.emailAddresses[0]?.emailAddress || null;

  const ledger = readLedger();

  if (body.kind === 'success') {
    const errors = validateStakeholderSuccess(body.record);
    if (errors.length > 0) {
      return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
    }
    const record: StakeholderSuccessRecord = {
      ...(body.record as StakeholderSuccessInput),
      id: `${programCode}:success:${body.record.stakeholderId}:${Date.now()}`,
      capturedById: session.userId,
      capturedByName,
      capturedAt: new Date().toISOString(),
    };
    ledger.successEntries.push(record);
    writeLedger(ledger);
    return NextResponse.json({ ok: true, record });
  }

  const tensionErrors = validateProgramTension(body.record);
  if (tensionErrors.length > 0) {
    return NextResponse.json({ error: 'validation_failed', errors: tensionErrors }, { status: 422 });
  }
  const record: ProgramTensionRecord = {
    ...(body.record as ProgramTensionInput),
    id: `${programCode}:tension:${body.record.stakeholderId}:${Date.now()}`,
    capturedById: session.userId,
    capturedByName,
    capturedAt: new Date().toISOString(),
  };
  ledger.tensionEntries.push(record);
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
  const successEntries = ledger.successEntries.filter((e) => e.programCode === programCode);
  const tensionEntries = ledger.tensionEntries.filter((e) => e.programCode === programCode);

  return NextResponse.json({ ok: true, successEntries, tensionEntries });
}
