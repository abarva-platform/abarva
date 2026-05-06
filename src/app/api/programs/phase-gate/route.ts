import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { checkTenantAccessByKey, tenantKeyForProgramCode } from '@/lib/auth/tenant-access';
import { getLatestSponsorCommitment } from '@/lib/workflow/sponsorCommitmentLedger';
import { getProgramTensionRecords, getStakeholderSuccessRecords } from '@/lib/workflow/stakeholderSuccessLedger';
import { dataReadinessGateMet } from '@/lib/workflow/dataReadinessLedger';
import { getServerSupabase } from '@/lib/supabase-server';
import { getSeedPlan } from '@/lib/deliverables/seed-route-resolver';
import { writeProgramAuditLogBestEffort } from '@/lib/programs/audit-log';

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

  // Tenant gate · same shape as /api/programs/approve. A phase-gate
  // advance is a stateful write on a tenant-owned program; cross-tenant
  // requests must fail here too.
  const ownerKey = tenantKeyForProgramCode(programCode);
  if (!ownerKey) {
    return NextResponse.json({ error: 'unknown programCode' }, { status: 404 });
  }
  const access = await checkTenantAccessByKey(ownerKey);
  if (!access.ok) {
    const status = access.reason === 'unauthenticated' ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  // FM-03 · Phase 1 → 2 gate requires a sponsor commitment record. Other
  // phase transitions have their own preconditions (Phase 2→3 needs the
  // tension-capture fields per FM-04, etc.) — those land in follow-up
  // items. For now, enforce only the FM-03 precondition.
  if (fromPhase === 1 && toPhase === 2) {
    const commitment = getLatestSponsorCommitment(programCode);
    if (!commitment) {
      return NextResponse.json(
        {
          error: 'precondition_failed',
          precondition: 'sponsor_commitment',
          message: 'Phase 1 → Phase 2 requires a sponsor commitment record. Submit the commitment form on D01 Charter first.',
        },
        { status: 412 },
      );
    }
    // FM-04 · require at least one success record (D02) and one tension
    // record (D04). Full per-stakeholder enforcement needs Codex's
    // stakeholder resolver; this floor catches "empty D02/D04" gates.
    const successRecords = getStakeholderSuccessRecords(programCode);
    if (successRecords.length === 0) {
      return NextResponse.json(
        {
          error: 'precondition_failed',
          precondition: 'stakeholder_success',
          message: 'Phase 1 → Phase 2 requires at least one stakeholder success definition. Capture on D02 Stakeholder Map first.',
        },
        { status: 412 },
      );
    }
    const tensionRecords = getProgramTensionRecords(programCode);
    if (tensionRecords.length === 0) {
      return NextResponse.json(
        {
          error: 'precondition_failed',
          precondition: 'program_tension',
          message: 'Phase 1 → Phase 2 requires at least one program tension with named owner. Capture on D04 Intake Synthesis first.',
        },
        { status: 412 },
      );
    }
    // FM-02 · require a data-readiness record with no blocked dimensions.
    // Gaps are allowed (the tenant has acknowledged them); blocks are hard
    // stops until resolved.
    const readinessGate = dataReadinessGateMet(programCode);
    if (!readinessGate.met) {
      return NextResponse.json(
        {
          error: 'precondition_failed',
          precondition: 'data_readiness',
          reason: readinessGate.reason,
          blockedDimensions: readinessGate.blockedDimensions,
          message:
            readinessGate.reason === 'no_record'
              ? 'Phase 1 → Phase 2 requires a data-readiness assessment. Submit the five-dimension form on D03 Success Metric Tree first.'
              : `Phase 1 → Phase 2 is blocked by ${readinessGate.blockedDimensions.length} data dimension${readinessGate.blockedDimensions.length === 1 ? '' : 's'} (${readinessGate.blockedDimensions.join(', ')}). Resolve or reclassify before advancing.`,
        },
        { status: 412 },
      );
    }
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

  // Supabase writes — additive to the filesystem ledger. Failures are logged
  // but never surface as HTTP errors; the ledger remains the source of truth
  // until the Supabase layer is fully promoted.
  let engagementId: string | null = null;
  try {
    // Resolve the engagement UUID from the programCode via the seed plan's
    // graph_node_id, which is the stable link between seed metadata and DB rows.
    const plan = getSeedPlan();
    const seedProgram = plan.programs.find(
      (p) => p.code.trim().toLowerCase() === programCode.trim().toLowerCase(),
    );
    const graphNodeId = seedProgram?.graphNodeId ?? null;

    if (graphNodeId) {
      const sb = getServerSupabase();

      // 1. Look up the engagement row.
      const { data: engRow, error: fetchErr } = await sb
        .from('engagements')
        .select('id, current_phase, gates_passed')
        .eq('graph_node_id', graphNodeId)
        .maybeSingle();

      if (fetchErr) {
        console.error('[phase-gate] supabase fetch failed', { programCode, graphNodeId, message: fetchErr.message });
      } else if (engRow) {
        engagementId = engRow.id as string;

        // 2. Build the deduplicated gates_passed array with the new phase appended.
        const existingGates: number[] = Array.isArray(engRow.gates_passed) ? (engRow.gates_passed as number[]) : [];
        const updatedGates = Array.from(new Set([...existingGates, toPhase])).sort((a, b) => a - b);

        // 3. UPDATE engagements SET current_phase = toPhase, gates_passed = deduplicated array.
        const { error: updateErr } = await sb
          .from('engagements')
          .update({
            current_phase: toPhase,
            gates_passed: updatedGates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', engagementId);

        if (updateErr) {
          console.error('[phase-gate] supabase update failed', { programCode, engagementId, message: updateErr.message });
        }
      } else {
        console.warn('[phase-gate] no engagement row found for graph_node_id', { programCode, graphNodeId });
      }
    } else {
      console.warn('[phase-gate] no graphNodeId resolved for programCode', { programCode });
    }
  } catch (err) {
    console.error('[phase-gate] supabase write threw', { programCode, message: err instanceof Error ? err.message : String(err) });
  }

  // 4. Audit log — best-effort; never blocks the response.
  await writeProgramAuditLogBestEffort(
    { clientId: ownerKey, userId: session.userId, role: role ?? undefined },
    {
      tenantKey: ownerKey,
      programId: programCode,
      engagementId: engagementId ?? undefined,
      action: 'PHASE_GATE_ADVANCED',
      fromState: `P${fromPhase}`,
      toState: `P${toPhase}`,
      rationale: gateCriterion,
    },
  );

  return NextResponse.json({ ok: true, entry });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const programCode = request.nextUrl.searchParams.get('programCode');

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
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return NextResponse.json({ ok: true, entries: filtered });
}
