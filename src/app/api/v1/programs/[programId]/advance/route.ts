// POST /api/v1/programs/:programId/advance · advance one phase
// Body: { toPhase: number, snapshot?: object, bypassGate?: boolean, approvalId?: string }
// Runs evaluateGate first; hard-fails (severity='hard') block advance.
// Soft-fails allowed with bypassGate=true (lead override).

import { NextRequest } from 'next/server';
import { getProgramById } from '@/lib/programs/queries';
import { advancePhase } from '@/lib/programs/mutations';
import { evaluateGate, requestFounderApproval } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';
import { getServerSupabase } from '@/lib/supabase-server';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (accessPolicy.programIdsAllowed !== null && !accessPolicy.programIdsAllowed.includes(programId)) {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }
    const body = (await req.json()) as { toPhase?: number; snapshot?: Record<string, unknown>; bypassGate?: boolean; approvalId?: string };
    if (typeof body?.toPhase !== 'number') {
      return Response.json({ error: 'bad_request', detail: 'toPhase required' }, { status: 400 });
    }

    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const fromPhase = program.currentPhase ?? 0;

    const gate = await evaluateGate(ctx, programId, fromPhase, body.toPhase);
    const hardFails = gate.failedChecks.filter((c) => c.severity === 'hard');

    if (hardFails.length > 0) {
      return Response.json(
        { error: 'gate_blocked', gate, detail: 'Hard-gate checks must pass before advance' },
        { status: 409 },
      );
    }

    if (gate.requiresApproval && !body.approvalId) {
      // Create a pending founder approval request and return it
      const approvalId = await requestFounderApproval(ctx, programId, {
        requestType: 'phase_gate',
        headline: `Approve phase ${fromPhase} → ${body.toPhase} gate`,
        approverRole: gate.approverRole ?? 'sponsor',
        deadlineHours: 48,
        context: { from_phase: fromPhase, to_phase: body.toPhase, bypass_gate: !!body.bypassGate },
      });
      return Response.json(
        { error: 'approval_required', approvalId, gate, detail: 'Approval request created · re-send with approvalId once approved' },
        { status: 202 },
      );
    }

    if (body.bypassGate && !accessPolicy.canApproveGates && ctx.role !== 'founder') {
      return Response.json(
        { error: 'forbidden', detail: 'phase-gate approval permission is required to bypass a gate' },
        { status: 403 },
      );
    }

    if (gate.requiresApproval && body.approvalId) {
      const sb = getServerSupabase();
      const { data: approval, error: approvalError } = await sb
        .from('founder_approval_requests')
        .select('id, status, engagement_id')
        .eq('id', body.approvalId)
        .eq('engagement_id', programId)
        .maybeSingle();
      if (approvalError || !approval || approval.status !== 'approved') {
        return Response.json(
          {
            error: 'approval_not_cleared',
            detail: 'Phase gate approval must be approved before the phase can advance',
          },
          { status: 409 },
        );
      }
    }

    const result = await advancePhase(ctx, {
      programId,
      fromPhase,
      toPhase: body.toPhase,
      snapshot: body.snapshot ?? {},
      approvedByUserId: ctx.userId,
      bypassGate: body.bypassGate,
    });

    return Response.json({ ok: true, programId: result.programId, newPhase: result.newPhase, snapshotId: result.snapshotId });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/advance]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
