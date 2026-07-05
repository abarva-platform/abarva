// POST /api/v1/source/events/[eventId]/approve
//
// Client-scoped Source approval endpoint. The event-creation approval IS the
// strategy gate: approving attests that the reviewer read the auto-generated
// strategy memo, the value target, and the archetype + rigor call. There is
// no separate "Strategy" canvas stage — an approve advances the event
// straight to Scope (the first stage with real client work).
//
// Actions:
//   approve   → lifecycle_state 'active' (requires all three confirmations);
//               advances current_stage_key 'strategy' → 'scope'.
//   send_back → stays 'waiting_on_client'; the reviewer's comment is recorded
//               so the creator can revise.
//   reject    → lifecycle_state 'archived'.
// An approval record is written to source_event_approvals in every case.

import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { selectSourceWriteAdapter } from '@/lib/data-plane/write-adapters/sourceWriteAdapter';
import {
  evaluateSourceApprovalDecision,
  type SourceApprovalConfirmations,
} from '@/lib/source/approval-decision';

interface ApproveBody {
  action: 'approve' | 'reject' | 'send_back';
  notes?: string;
  confirmations?: SourceApprovalConfirmations;
}

/**
 * Fold the reviewer's free-text comment and the attested confirmations into a
 * single human-readable notes string for the append-only approval record.
 */
function composeApprovalNotes(
  comment: string | undefined,
  action: ApproveBody['action'],
): string | null {
  const trimmed = comment?.trim();
  if (action === 'approve') {
    const attest = 'Confirmed review of strategy memo, value target, and archetype + rigor.';
    return trimmed ? `${attest}\n${trimmed}` : attest;
  }
  return trimmed ? trimmed : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json({ error: 'no_client', detail: 'No active client for Source approval' }, { status: 403 });
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);

  if (!accessPolicy?.canApproveSourceStages) {
    return Response.json({
      error: 'forbidden_source_admin_required',
      detail: 'Client admin or explicit Source stage approval rights are required to approve sourcing events.',
    }, { status: 403 });
  }

  let body: ApproveBody;
  try {
    body = (await request.json()) as ApproveBody;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const supabase = getAzureReadFluentClient();

  // Fetch the event to check it exists and get current state + stage.
  const { data: event, error: fetchError } = await supabase
    .from('source_events')
    .select('id, lifecycle_state, current_stage_key, event_name, event_code, client_key')
    .eq('id', eventId)
    .eq('client_key', activeClient.key)
    .single();

  if (fetchError || !event) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  // Resolve the decision (validates action + confirmations, decides the
  // lifecycle transition and whether to advance the stage).
  const decision = evaluateSourceApprovalDecision(body.action, body.confirmations, {
    currentStageKey: event.current_stage_key as string | null,
  });
  if (!decision.ok) {
    const status = decision.error === 'confirmations_required' ? 422 : 400;
    return Response.json(
      {
        error: decision.error,
        detail: decision.detail,
        ...(decision.missingConfirmations ? { missingConfirmations: decision.missingConfirmations } : {}),
      },
      { status },
    );
  }

  const fromState = event.lifecycle_state as string;
  const toState = decision.toState!;

  // DB write routed through the data-plane write seam (Slice 3b): the
  // lifecycle update + the append-only approval record. On Azure the two
  // run in one transaction; on Supabase they apply individually as before.
  const approvalWrite = await selectSourceWriteAdapter(
    undefined,
    activeClient.key,
  ).applyApproval({
    eventId,
    clientKey: activeClient.key,
    fromState,
    toState,
    approvalAction: decision.approvalAction,
    approvedByUserId: tenancy.userId,
    notes: composeApprovalNotes(body.notes, body.action),
  });

  if (!approvalWrite.ok) {
    return Response.json(
      { error: 'update_failed', detail: approvalWrite.error },
      { status: 500 },
    );
  }

  // Advance the stage past the (unworked) strategy stage on approval. The
  // strategy memo remains viewable in the rail; Scope is the first stage the
  // client actually works. Non-fatal: a stage-advance miss leaves the event
  // active at strategy rather than blocking the approval.
  let stageAdvancedTo: string | null = null;
  if (decision.advanceStageTo) {
    const stageWrite = await selectSourceWriteAdapter(
      undefined,
      activeClient.key,
    ).updateStage({
      eventId,
      clientKey: activeClient.key,
      stageKey: decision.advanceStageTo,
      lifecycleState: toState,
      updatedAtIso: new Date().toISOString(),
    });
    if (!stageWrite.ok) {
      console.error('[POST /api/v1/source/events/:eventId/approve] stage_advance_failed', {
        eventId,
        message: stageWrite.error,
      });
    } else {
      stageAdvancedTo = decision.advanceStageTo;
    }
  }

  return Response.json({
    ok: true,
    eventId,
    action: body.action,
    newLifecycleState: toState,
    stageAdvancedTo,
  });
}
