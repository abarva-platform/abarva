// PROG-D — Program Detail route
// /programs/[id]?phase=N
//
// Server component: resolves programId + viewingPhase from params/searchParams,
// tries real DB data first, falls back to fixture, then merges and renders.
//
// OV2-3b · patternId resolution choice (path ii)
// ─────────────────────────────────────────────
// The engagements table does NOT carry a canonical archetype patternId
// column (genome_pattern_matches is many-to-many, not 1:1). The de-facto
// source-of-truth on the program-detail surface is the in-memory
// `APEX_RETAIL_PROGRAM_INSTANCES` fixture which already feeds three other
// pattern-driven panels on this page (lifecycle mini-graph, failure-mode
// chip, evidence heatmap). We resolve patternId from the same fixture
// rather than extending db-phase-queries.ts to surface a column that
// does not exist server-side. When the broker contract eventually owns
// pattern resolution (post PR-V), this lookup migrates to the broker
// without changing the Phase0Primer prop.

import { buildProgramDetailView } from '@/lib/programs/programs-detail-view';
import { ProgramDetailPage } from '@/components/programs/ProgramDetailPage';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getActiveClientRow } from '@/lib/active-client';
import { getEngagementWithPhaseData } from '@/lib/programs/db-phase-queries';
import type { EvidenceItem, ProgramGateStatus } from '@/lib/programs/programs-types';
import { parseTimelineFiltersFromSearchParams } from '@/lib/reasoning/instance-event-timeline-filters';
import { getPhaseOverride } from '@/lib/programs/phase-overrides';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getArchetypePrimer } from '@/lib/programs/archetype-primers';
import { APEX_PROGRAMS_FIXTURE } from '@/lib/programs/programs-fixture';
import { MERIDIAN_PROGRAMS_FIXTURE } from '@/lib/programs/meridian-fixture';
import type { Artifact } from '@/lib/agent/artifacts';
import { canonicalClientDisplayName } from '@/lib/client-config';

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
  let activeClientName: string | null = null;
  // CB-8 · whether the session has a real tenant binding. Threaded
  // into AppShell so the 4-mode toggle can correctly disable
  // Tenant / Full when no tenant is bound — `tenantName` is a display
  // string defaulted in AppShell and is NOT a reliable proxy.
  let hasTenantKey = false;
  try {
    const user = await getCurrentUser();
    if (user?.defaultClientId || user?.metadataClientKey) {
      hasTenantKey = true;
      const clientRow = await getActiveClientRow().catch(() => null);
      activeClientName = canonicalClientDisplayName({
        key: clientRow?.key,
        name: clientRow?.name,
      });
      dbData = await getEngagementWithPhaseData(
        id,
        clientRow?.id ?? null,
        clientRow
          ? {
              clientId: clientRow.id,
              userId: user.personId ?? (user.clerkUserId ? `clerk:${user.clerkUserId}` : 'program-detail-page'),
              role: user.primaryRole,
            }
          : null,
      );
    }
  } catch {
    // silently fall back to fixture
  }

  const fixtureTenantName = resolveFixtureTenantName(id);
  if (!dbData && fixtureTenantName && activeClientName && fixtureTenantName !== activeClientName) {
    notFound();
  }
  if (!dbData && !fixtureTenantName && hasTenantKey) {
    notFound();
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
    view.lifecycleState = eng.lifecycle_state ?? null;
    if (activeClientName) {
      view.tenant = activeClientName;
    }
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

    if (dbData.programEvidenceItems.length > 0) {
      const currentPhaseEvidence: EvidenceItem[] = dbData.programEvidenceItems
        .filter((e) => e.phase === null || e.phase === view.viewingPhase)
        .slice(0, 8)
        .map((e) => {
          const confidenceValue = typeof e.confidence === 'string' ? Number(e.confidence) : e.confidence ?? 0.7;
          const confidence: EvidenceItem['confidence'] =
            confidenceValue >= 0.75 ? 'high' : confidenceValue < 0.55 ? 'low' : 'medium';
          return {
            id: e.id,
            citation: `[Program evidence] ${e.evidence_type} · ${new Date(e.created_at).toLocaleDateString()}`,
            source: e.title,
            excerpt: e.summary.slice(0, 220),
            confidence,
            hasContradiction: false,
          };
        });
      view.phasePanel.evidenceItems = [
        ...(view.phasePanel.evidenceItems ?? []),
        ...currentPhaseEvidence,
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

    if (eng.lifecycle_state === 'submitted_for_approval') {
      view.gateStatus = 'pending';
      view.workbench = {
        ...view.workbench,
        prose:
          'This strategic move brief has been submitted to Setup for tenant-admin approval. ' +
          'Phase 0 stays locked until the approval queue accepts the seed, sponsor, ' +
          'lead, value hypothesis, and scope boundary.',
      };
    } else if (eng.lifecycle_state === 'completed') {
      view.gateStatus = 'completed';
      view.phases = view.phases.map((slot) => ({
        ...slot,
        state: 'done',
        gateStatus: 'approved',
      }));
      view.workbench = {
        ...view.workbench,
        prose:
          'This strategic move lifecycle is complete. Execution now happens outside AbarVa; ' +
          'Tower observes status feeds, detects drift, and escalates decisions against ' +
          'the signed P6 tracking contract.',
      };
    } else if (eng.lifecycle_state === 'approved' && view.currentPhase === 0) {
      const hasSignedP0Seed = dbData.deliverables.some(
        (deliverable) =>
          deliverableKeyAppliesToPhase(deliverable.deliverable_type_key, 0) &&
          deliverable.status === 'signed_off',
      );
      view.gateStatus = hasSignedP0Seed ? 'open' : 'pending';
      view.workbench = {
        ...view.workbench,
        prose:
          hasSignedP0Seed
            ? 'The P0 seed deliverable is signed off. Nexus can now run the P0 exit check and request Discovery.'
            : 'This strategic move is approved for P0 Origination. Nexus should now help complete ' +
              'the P0 entry and exit criteria, generate the seed deliverables, and submit ' +
              'the P0 exit approval before Discovery unlocks.',
      };
    }
  }

  // OV2-3b · Resolve the Phase-0 archetype primer (when applicable).
  // Only fetched when the program is currently in P0; the primer is
  // wasted weight on later phases. The lookup is `displayId` first, then
  // `id` (case-insensitive) — same precedence as every other patternId
  // resolver on this page.
  let phase0Primer = null;
  if (view.currentPhase === 0) {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    const patternId = instance?.patternId ?? null;
    if (patternId) {
      phase0Primer = getArchetypePrimer(patternId);
    }
  }

  return (
    <ProgramDetailPage
      view={view}
      timelineFilters={timelineFilters}
      preservedSearchParams={preservedSearchParams}
      phase0Primer={phase0Primer}
      initialNexusArtifacts={buildDbBackedNexusArtifacts(dbData, view.viewingPhase)}
      hasTenantKey={hasTenantKey}
    />
  );
}

function buildDbBackedNexusArtifacts(
  dbData: Awaited<ReturnType<typeof getEngagementWithPhaseData>>,
  viewingPhase: number,
): Artifact[] {
  if (!dbData) return [];

  const deliverablesForPhase = dbData.deliverables.filter((deliverable) =>
    deliverableKeyAppliesToPhase(deliverable.deliverable_type_key, viewingPhase),
  );
  const signedDeliverables = deliverablesForPhase.filter((deliverable) => deliverable.status === 'signed_off');
  const phaseEvidence = dbData.programEvidenceItems.filter((item) => item.phase === null || item.phase === viewingPhase);
  const latestAudit = dbData.auditLogs[0];

  const artifacts: Artifact[] = [];
  if (deliverablesForPhase.length > 0) {
    artifacts.push({
      type: 'phase-progress',
      evidenceItemId: `db-deliverables-p${viewingPhase}`,
      label: `DB-backed P${viewingPhase} deliverables`,
      severity: 'hard',
      status: signedDeliverables.length > 0 ? 'met' : 'unknown',
      detail: `${signedDeliverables.length}/${deliverablesForPhase.length} current-phase deliverables are signed off in deliverables_v2.`,
    });
  }

  if (phaseEvidence.length > 0) {
    artifacts.push({
      type: 'phase-progress',
      evidenceItemId: `db-evidence-p${viewingPhase}`,
      label: `DB-backed P${viewingPhase} evidence`,
      severity: 'soft',
      status: 'met',
      detail: `${phaseEvidence.length} strategic move evidence item${phaseEvidence.length === 1 ? '' : 's'} available from program_evidence_items.`,
    });
  }

  if (dbData.engagement.program_milestones.length > 0) {
    const phaseMilestones = dbData.engagement.program_milestones.filter(
      (milestone) => milestone.phase_number === null || milestone.phase_number === viewingPhase,
    );
    if (phaseMilestones.length > 0) {
      artifacts.push({
        type: 'phase-progress',
        evidenceItemId: `db-milestones-p${viewingPhase}`,
        label: `DB-backed P${viewingPhase} milestones`,
        severity: viewingPhase === 4 ? 'hard' : 'soft',
        status: 'met',
        detail: `${phaseMilestones.length} milestone${phaseMilestones.length === 1 ? '' : 's'} recorded for this phase.`,
      });
    }
  }

  if (latestAudit) {
    artifacts.push({
      type: 'phase-progress',
      evidenceItemId: 'db-latest-audit-receipt',
      label: 'Latest durable audit receipt',
      severity: 'soft',
      status: 'met',
      detail: `${latestAudit.action}${latestAudit.to_state ? ` → ${latestAudit.to_state}` : ''} recorded in program_audit_log.`,
    });
  }

  return artifacts;
}

function deliverableKeyAppliesToPhase(key: string, phase: number): boolean {
  if (phase === 0) return ['origination_brief', 'program_seed_brief', 'program_seed'].includes(key);
  if (phase === 1) {
    return [
      'discovery_report',
      'discovery_notes',
      'discovery_summary',
      'current_state_summary',
      'baseline',
      'baseline_metrics',
      'meeting_notes',
      'workshop_notes',
      'stakeholder_map',
    ].includes(key);
  }
  if (phase === 2) return ['charter', 'synthesis_options_memo', 'workshop_facilitator_guide', 'value_baseline'].includes(key);
  if (phase === 3) return ['design_spec', 'design', 'design_brief', 'requirements_traceability', 'requirements_design_outcome_trace', 'traceability_matrix'].includes(key);
  if (phase === 4) return ['execution_roadmap', 'execution_plan', 'mobilization_roadmap', 'requirements_traceability', 'requirements_design_outcome_trace', 'traceability_matrix'].includes(key);
  if (phase === 5) return ['business_case', 'funding_business_case', 'approval_packet', 'approval_memo', 'funding_approval', 'capacity_approval', 'sponsor_alignment', 'stakeholder_alignment', 'readiness_and_change_plan', 'change_management_plan', 'business_readiness_plan'].includes(key);
  if (phase === 6) return ['tower_handoff_plan', 'execution_monitoring_plan', 'control_tower_handoff', 'outcome_report'].includes(key);
  return false;
}

function resolveFixtureTenantName(programId: string): string | null {
  if (APEX_PROGRAMS_FIXTURE.some((p) => p.id === programId)) return 'Apex Retail Group';
  if (MERIDIAN_PROGRAMS_FIXTURE.some((p) => p.id === programId)) return 'Meridian Health System';
  return null;
}
