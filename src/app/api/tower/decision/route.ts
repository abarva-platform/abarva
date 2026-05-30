// Tower decide-and-route endpoint — Fund / Pause / Kill a portfolio item.
//
// Tower today is a read-and-attest surface (per audit
// `docs/audits/TOWER-MODULE-AUDIT-2026-05-22.md` §6). This route turns it
// into a decide-and-route surface: a Tower CIO can fund / pause / kill a
// Move (or Program) from the portfolio card. Each decision is
// audit-logged through the existing `writeProgramAuditLog` pattern — we
// do NOT introduce a new logger.
//
// Persistence is intentionally minimal: we write to the same
// `program_audit_log` table the Programs surface uses, so the decision
// trail is already discoverable by the audit reader and the cross-module
// trace viewer. State-machine writes (engagement lifecycle / Move kill)
// remain in the Programs/Moves write-adapters and are out of scope for
// this slice — Tower's job here is the decision *signal* and audit trail.

import { NextRequest, NextResponse } from 'next/server';
import { requireTenancy } from '@/lib/auth/tenancy';
import { writeProgramAuditLog } from '@/lib/programs/audit-log';

export const runtime = 'nodejs';

type TowerDecisionAction = 'fund' | 'pause' | 'kill';

const ALLOWED_ACTIONS: ReadonlySet<TowerDecisionAction> = new Set([
  'fund',
  'pause',
  'kill',
]);

interface TowerDecisionBody {
  programId?: string;
  moveId?: string;
  action?: string;
  rationale?: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: TowerDecisionBody;
  try {
    body = (await request.json()) as TowerDecisionBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const action = (body.action ?? '').trim().toLowerCase() as TowerDecisionAction;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: 'invalid_action', allowed: Array.from(ALLOWED_ACTIONS) },
      { status: 400 },
    );
  }

  const programId = (body.programId ?? body.moveId ?? '').trim();
  if (!programId) {
    return NextResponse.json({ error: 'missing_program_id' }, { status: 400 });
  }

  const rationale = (body.rationale ?? '').trim() || null;

  try {
    await writeProgramAuditLog(tenancy, {
      programId,
      action: `tower.decision.${action}`,
      fromState: 'tower.review',
      toState: `tower.${action}`,
      rationale,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'audit_write_failed',
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    action,
    programId,
    loggedAt: new Date().toISOString(),
  });
}
