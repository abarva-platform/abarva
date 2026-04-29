// PROG-D — Program Detail route
// /programs/[id]?phase=N
//
// Server component: resolves programId + viewingPhase from params/searchParams,
// tries real DB data first, falls back to fixture, then merges and renders.

import { buildProgramDetailView } from '@/lib/programs/programs-detail-view';
import { ProgramDetailPage } from '@/components/programs/ProgramDetailPage';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getEngagementWithPhaseData } from '@/lib/programs/db-phase-queries';
import type { EvidenceItem, ProgramGateStatus } from '@/lib/programs/programs-types';
import { parseTimelineFiltersFromSearchParams } from '@/lib/reasoning/instance-event-timeline-filters';
import { getPhaseOverride } from '@/lib/programs/phase-overrides';

export const dynamic = 'force-dynamic';

export default async function ProgramDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const phase = typeof sp.phase === 'string' ? sp.phase : undefined;
  const viewingPhase = phase ? parseInt(phase, 10) : undefined;

  // Decode timeline filter URL params (`?tlKind=…&tlSince=…&tlSearch=…`).
  // Falls through to an empty object when no params are present.
  const timelineFilters = parseTimelineFiltersFromSearchParams(sp);
  const preservedSearchParams: Record<string, string | undefined> = {};
  if (phase !== undefined) preservedSearchParams.phase = phase;

  // Try real DB data first
  let dbData = null;
  try {
    const user = await getCurrentUser();
    if (user?.defaultClientId) {
      dbData = await getEngagementWithPhaseData(id);
    }
  } catch {
    // silently fall back to fixture
  }

  // Extract the DB currentPhase BEFORE building the view so we can pass it as
  // overrideCurrentPhase. This ensures phase slots and workbench content reflect the
  // real phase (e.g. P3 after gate approval) rather than the fixture's hardcoded phase.
  const dbCurrentPhase = dbData?.engagement?.current_phase ?? undefined;

  // In-memory demo override (set via PATCH /api/v1/programs/:id/phase) takes
  // precedence over the DB value so a one-click phase advance is reflected
  // immediately after router.refresh() without a DB write.
  const memPhaseOverride = getPhaseOverride(id);
  const resolvedCurrentPhase = memPhaseOverride ?? dbCurrentPhase ?? undefined;

  // Build view from fixture (always as base), passing resolved phase override when available.
  const view = buildProgramDetailView(id, viewingPhase, resolvedCurrentPhase);

  // Always ensure the view uses the requested programId, not the fixture fallback id.
  // This matters when the program is not in the fixture set (e.g. newly created programs).
  if (view.programId !== id) {
    view.programId = id;
    view.displayId = id.toUpperCase().slice(0, 12);
  }

  // Merge real DB fields into the fixture view if available
  if (dbData?.engagement) {
    const eng = dbData.engagement;

    // Override key scalar fields with real data
    view.name = eng.name ?? view.name;
    // currentPhase is already set correctly via resolvedCurrentPhase above.
    // Only fall back to the DB value when there is no in-memory demo override.
    if (memPhaseOverride === undefined && eng.current_phase !== null && eng.current_phase !== undefined) {
      const clampedPhase = Math.max(0, Math.min(6, eng.current_phase)) as typeof view.currentPhase;
      view.currentPhase = clampedPhase;
    }

    // Merge real evidence if available
    if (dbData.evidence.length > 0 && view.phasePanel.evidenceItems !== undefined) {
      const realEvidence: EvidenceItem[] = dbData.evidence.map((e) => {
        const dateLabel = e.observed_at
          ? new Date(e.observed_at).toLocaleDateString()
          : new Date(e.created_at).toLocaleDateString();
        const rawConfidence = (e.confidence_level ?? '').toLowerCase();
        const confidence: EvidenceItem['confidence'] =
          rawConfidence === 'high'
            ? 'high'
            : rawConfidence === 'low'
            ? 'low'
            : 'medium';
        return {
          id: e.id,
          citation: `[DB] ${e.evidence_type ?? 'Document'} · ${dateLabel}`,
          source: e.evidence_type ?? 'Uploaded document',
          excerpt: (e.summary ?? '').slice(0, 200),
          confidence,
          hasContradiction: false,
        };
      });
      view.phasePanel.evidenceItems = [
        ...(view.phasePanel.evidenceItems ?? []),
        ...realEvidence,
      ];
    }

    // Milestone count — logged for Sprint 1B full milestone UI
    const milestones = eng.program_milestones ?? [];
    if (milestones.length > 0) {
      console.log('[DB] Real milestones:', milestones.length);
    }

    // Gate approval status from real DB — map phase_approvals.action to gateStatus
    const latestApproval = dbData.gateApprovals[0];
    if (latestApproval) {
      const action = latestApproval.action;
      let gateStatus: ProgramGateStatus | null = null;
      if (action === 'approved') {
        gateStatus = 'approved';
      } else if (action === 'escalated' || action === 'refined' || action === 'disputed') {
        gateStatus = 'pending';
      }
      if (gateStatus !== null) {
        view.gateStatus = gateStatus;
      }
    }
  }

  return (
    <ProgramDetailPage
      view={view}
      timelineFilters={timelineFilters}
      preservedSearchParams={preservedSearchParams}
    />
  );
}
