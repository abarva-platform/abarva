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

export const dynamic = 'force-dynamic';

export default async function ProgramDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ phase?: string }>;
}) {
  const { id } = await params;
  const { phase } = await searchParams;
  const viewingPhase = phase ? parseInt(phase, 10) : undefined;

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

  // Build view from fixture (always as base)
  const view = buildProgramDetailView(id, viewingPhase);

  // Merge real DB fields into the fixture view if available
  if (dbData?.engagement) {
    const eng = dbData.engagement;

    // Override key scalar fields with real data
    view.name = eng.name ?? view.name;
    if (eng.current_phase !== null && eng.current_phase !== undefined) {
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

  return <ProgramDetailPage view={view} />;
}
