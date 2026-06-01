// PATCH /api/v1/source/:eventId/stage
// Body: { stageKey: SourceStageKey }
//
// Advances a persisted Source event to the requested stage. Seed events keep the
// legacy in-memory override path for demo fixtures, but DB rows must persist so
// the production E2E crawler can resume the lifecycle.

import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { selectSourceWriteAdapter } from '@/lib/data-plane/write-adapters/sourceWriteAdapter';
import { setStageOverride } from '@/lib/source/stage-overrides';
import { getSourceEventSeed } from '@/lib/source/mock-seed';
import { isCanonicalSourceStageKey, SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { inferClientKeyFromEmail, isClientKey } from '@/lib/client-config';
import {
  artifactStateRowToView,
  evidenceStateRowToView,
  gateCriterionStateRowToView,
  type SourceEventArtifactStateRow,
  type SourceEventEvidenceStateRow,
  type SourceEventGateCriterionStateRow,
} from '@/lib/source/canvas-substrate/types';
import {
  evaluateStagePromotionReadiness,
  firstGovernanceBlocker,
  normalizeApprovalReason,
} from '@/lib/source/source-governance-enforcement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string }> };

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number]);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId } = await params;
    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const body = (await req.json()) as { stageKey?: unknown; reason?: unknown };
    const stageKey = body?.stageKey;
    const reason = normalizeApprovalReason(body?.reason);

    if (!isCanonicalSourceStageKey(stageKey)) {
      return Response.json(
        {
          error: 'bad_request',
          detail: `stageKey must be one of: ${SOURCE_STAGE_ORDER.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const supabase = getAzureReadFluentClient();
    const eventQuery = supabase
      .from('source_events')
      .select('id, client_key, current_stage_key, lifecycle_state');
    const { data: persistedEvent, error: fetchError } = isUuid(eventId)
      ? await eventQuery.eq('id', eventId).maybeSingle()
      : { data: null, error: null };

    if (fetchError) {
      return Response.json({ error: 'lookup_failed', detail: fetchError.message }, { status: 500 });
    }

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey) ? currentUser.metadataClientKey : null) ??
      inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return Response.json({ error: 'no_client', detail: 'No active client for Source stage advancement' }, { status: 403 });
    }

    const accessPolicy = tenancy && activeClient
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
          sourceEventId: eventId,
        }).catch(() => null)
      : null;
    const canonicalAdminFallbackAllowed =
      !activeClient &&
      isCanonicalClientAdminEmail(currentUser?.email) &&
      Boolean(persistedEvent) &&
      persistedEvent?.client_key === effectiveClientKey;
    const canAdvance = Boolean(accessPolicy?.canApproveSourceStages || canonicalAdminFallbackAllowed);
    if (!canAdvance) {
      return Response.json({
        error: 'forbidden_source_stage_approval_required',
        detail: 'Source stage approval rights are required to advance sourcing events.',
      }, { status: 403 });
    }

    if (persistedEvent) {
      if (persistedEvent.client_key !== effectiveClientKey) {
        return Response.json({ error: 'not_found', detail: `No source event with id ${eventId}` }, { status: 404 });
      }

      const [
        { data: criterionRows, error: criteriaFetchError },
        { data: artifactRows, error: artifactFetchError },
        { data: evidenceRows, error: evidenceFetchError },
      ] = await Promise.all([
        supabase
          .from('source_event_gate_criterion_states')
          .select('*')
          .eq('source_event_id', eventId),
        supabase
          .from('source_event_artifact_states')
          .select('*')
          .eq('source_event_id', eventId)
          .eq('stage_key', persistedEvent.current_stage_key),
        supabase
          .from('source_event_evidence_states')
          .select('*')
          .eq('source_event_id', eventId)
          .eq('stage_key', persistedEvent.current_stage_key),
      ]);
      if (criteriaFetchError) {
        return Response.json({ error: 'lookup_failed', detail: criteriaFetchError.message }, { status: 500 });
      }
      if (artifactFetchError) {
        return Response.json({ error: 'lookup_failed', detail: artifactFetchError.message }, { status: 500 });
      }
      if (evidenceFetchError) {
        return Response.json({ error: 'lookup_failed', detail: evidenceFetchError.message }, { status: 500 });
      }

      const promotionReadiness = evaluateStagePromotionReadiness({
        currentStage: persistedEvent.current_stage_key as SourceStageKey,
        targetStage: stageKey,
        criteria: ((criterionRows ?? []) as SourceEventGateCriterionStateRow[]).map(
          gateCriterionStateRowToView,
        ),
        artifacts: ((artifactRows ?? []) as SourceEventArtifactStateRow[]).map(
          artifactStateRowToView,
        ),
        evidence: ((evidenceRows ?? []) as SourceEventEvidenceStateRow[]).map(
          evidenceStateRowToView,
        ),
        reason,
      });
      if (!promotionReadiness.ok) {
        const blocker = firstGovernanceBlocker(promotionReadiness);
        return Response.json(
          {
            error: blocker.code,
            detail: blocker.detail,
            blockers: promotionReadiness.blockers,
          },
          { status: 409 },
        );
      }

      // DB write routed through the data-plane write seam (Slice 3b).
      const stageWrite = await selectSourceWriteAdapter(
        undefined,
        effectiveClientKey,
      ).updateStage({
        eventId,
        clientKey: effectiveClientKey,
        stageKey,
        lifecycleState: stageKey === 'value' ? 'completed' : 'active',
        updatedAtIso: new Date().toISOString(),
      });

      if (!stageWrite.ok) {
        return Response.json({ error: 'update_failed', detail: stageWrite.error }, { status: 500 });
      }

      return Response.json({ ok: true, eventId, stageKey, persisted: true });
    }

    const event = getSourceEventSeed(eventId);
    if (!event) {
      return Response.json({ error: 'not_found', detail: `No source event with id ${eventId}` }, { status: 404 });
    }

    const seedPromotionReadiness = evaluateStagePromotionReadiness({
      currentStage: event.currentStageKey,
      targetStage: stageKey,
      criteria: [],
      reason,
    });
    if (!seedPromotionReadiness.ok) {
      const blocker = firstGovernanceBlocker(seedPromotionReadiness);
      return Response.json(
        {
          error: blocker.code,
          detail: blocker.detail,
          blockers: seedPromotionReadiness.blockers,
        },
        { status: 409 },
      );
    }

    setStageOverride(eventId, stageKey as SourceStageKey);

    return Response.json({ ok: true, eventId, stageKey, persisted: false });
  } catch (err) {
    console.error('[PATCH /api/v1/source/:eventId/stage]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
