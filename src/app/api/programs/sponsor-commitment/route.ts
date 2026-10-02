import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  checkTenantAccessByKey,
  tenantKeyForProgramCode,
} from '@/lib/auth/tenant-access';
import type { SponsorCommitmentLedger } from '@/lib/workflow/sponsorCommitment';

// Legacy sponsor-commitment read API. Sponsor records are now contact-only.
//
// POST is retired: sponsors do not approve or submit workflow commitments.
//
// GET  /api/programs/sponsor-commitment?programCode=APX-01
// returns any legacy record for historical display only.
//
// Tenant gate shape matches /api/programs/approve (C2-07) — cross-tenant
// requests return 403. This route only reads historical entries.
//
// Legacy ledger remains read-only for compatibility.

const LEDGER_DIR = join(process.cwd(), '.approvals');
const LEDGER_PATH = join(LEDGER_DIR, 'sponsor-commitments.json');

function readLedger(): SponsorCommitmentLedger {
  if (!existsSync(LEDGER_PATH)) return { schemaVersion: '1.0', entries: [] };
  try {
    return JSON.parse(
      readFileSync(LEDGER_PATH, 'utf8'),
    ) as SponsorCommitmentLedger;
  } catch {
    return { schemaVersion: '1.0', entries: [] };
  }
}

export async function POST(_request: NextRequest) {
  void _request;
  return NextResponse.json(
    {
      error: 'sponsor_commitment_retired',
      message:
        'Sponsor contacts do not submit approvals or workflow commitments. An authorized workspace user records product decisions; sponsors may receive informational progress updates.',
    },
    { status: 410 },
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const programCode = request.nextUrl.searchParams.get('programCode');
  if (!programCode) {
    return NextResponse.json(
      { error: 'programCode required' },
      { status: 400 },
    );
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
  const matches = ledger.entries
    .filter((e) => e.programCode === programCode)
    .sort((a, b) => (a.committedAt < b.committedAt ? 1 : -1));

  return NextResponse.json({
    ok: true,
    record: matches[0] ?? null,
    history: matches,
  });
}
