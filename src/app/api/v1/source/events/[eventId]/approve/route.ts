// POST /api/v1/source/events/[eventId]/approve
//
// Client-scoped Source approval endpoint: review and approve (or reject)
// a sourcing event created via the commit_source_event tool. On approval
// the event's lifecycle_state advances to 'active'; on rejection it moves
// to 'archived'. An approval record is written to source_event_approvals.

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getServerSupabase } from '@/lib/supabase-server';
import { getActiveClientRow } from '@/lib/active-client';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';

interface ApproveBody {
  action: 'approve' | 'reject';
  notes?: string;
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

  if (body.action !== 'approve' && body.action !== 'reject') {
    return Response.json({ error: 'invalid_action', detail: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  const supabase = getServerSupabase();

  // Fetch the event to check it exists and get current state
  const { data: event, error: fetchError } = await supabase
    .from('source_events')
    .select('id, lifecycle_state, event_name, event_code, client_key')
    .eq('id', eventId)
    .eq('client_key', activeClient.key)
    .single();

  if (fetchError || !event) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const fromState = event.lifecycle_state as string;
  const toState = body.action === 'approve' ? 'active' : 'archived';

  // Update lifecycle_state on the event
  const { error: updateError } = await supabase
    .from('source_events')
    .update({ lifecycle_state: toState })
    .eq('id', eventId)
    .eq('client_key', activeClient.key);

  if (updateError) {
    return Response.json({ error: 'update_failed', detail: updateError.message }, { status: 500 });
  }

  // Insert approval record
  const { error: approvalError } = await supabase
    .from('source_event_approvals')
    .insert({
      event_id: eventId,
      action: body.action === 'approve' ? 'admin_review' : 'rejected',
      approved_by_user_id: tenancy.userId,
      from_state: fromState,
      to_state: toState,
      notes: body.notes ?? null,
    });

  if (approvalError) {
    // Non-fatal — event is already updated; log and continue.
    console.error('[approve] approval record insert failed:', approvalError.message);
  }

  return Response.json({
    ok: true,
    eventId,
    action: body.action,
    newLifecycleState: toState,
  });
}
