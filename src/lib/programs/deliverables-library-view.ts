// deliverables-library-view.ts — PDEL6
//
// Filter view model for the Program Deliverables Library.
// Layers filtering (by phase, version state, evidence state) on top of
// the existing deliverable inventory from program-deliverables-evidence-view.ts.
//
// Deterministic: no runtime clocks, no random(), no model calls.
// Pattern: mirrors phase-filter-view.ts — pill options + filtered list.

import {
  buildProgramDeliverablesEvidenceView,
  DELIVERABLE_EVIDENCE_STATES,
  DELIVERABLE_PHASE_IDS,
  DELIVERABLE_VERSION_STATES,
  type DeliverableEntry,
  type DeliverableEvidenceState,
  type DeliverablePhaseId,
  type DeliverableVersionState,
} from './program-deliverables-evidence-view';

// ─── Filter types ─────────────────────────────────────────────────────────────

export type DeliverablesPhaseFilter = DeliverablePhaseId | 'all';
export type DeliverablesVersionFilter = DeliverableVersionState | 'all';
export type DeliverablesEvidenceFilter = DeliverableEvidenceState | 'all';

export interface DeliverablesFilterPill<T extends string> {
  key: T;
  label: string;
  count: number;
  active: boolean;
}

export interface DeliverablesLibraryFilterView {
  /** All deliverables that match the active filters */
  filteredDeliverables: DeliverableEntry[];
  /** Total across all filters */
  totalDeliverables: number;
  /** Count of currently filtered results */
  filteredCount: number;
  /** Phase filter pills — "All" + one per phase that has deliverables */
  phasePills: Array<DeliverablesFilterPill<DeliverablesPhaseFilter>>;
  /** Version state filter pills — "All" + one per version state present */
  versionPills: Array<DeliverablesFilterPill<DeliverablesVersionFilter>>;
  /** Evidence state filter pills — "All" + one per evidence state present */
  evidencePills: Array<DeliverablesFilterPill<DeliverablesEvidenceFilter>>;
  /** Active filters (for display/clear) */
  activePhase: DeliverablesPhaseFilter;
  activeVersion: DeliverablesVersionFilter;
  activeEvidence: DeliverablesEvidenceFilter;
  /** True when any non-"all" filter is active */
  isFiltered: boolean;
  deterministicSeed: true;
}

// ─── Phase label map ──────────────────────────────────────────────────────────

const PHASE_LABELS: Record<DeliverablePhaseId, string> = {
  discovery: 'Discovery',
  synthesis: 'Synthesis',
  design: 'Design',
  build: 'Execution Roadmap',
  activate: 'Approval & Mobilization',
  operate: 'Tower Handoff',
};

const VERSION_LABELS: Record<DeliverableVersionState, string> = {
  draft: 'Draft',
  'in-review': 'In Review',
  approved: 'Approved',
  superseded: 'Superseded',
};

const EVIDENCE_LABELS: Record<DeliverableEvidenceState, string> = {
  complete: 'Complete',
  partial: 'Partial',
  missing: 'Missing',
};

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Build the filtered library view. Accepts any combination of phase,
 * version state, and evidence state filters ('all' disables that filter).
 *
 * All three filters are applied as AND predicates.
 */
export function buildDeliverablesLibraryFilterView(
  activePhase: DeliverablesPhaseFilter = 'all',
  activeVersion: DeliverablesVersionFilter = 'all',
  activeEvidence: DeliverablesEvidenceFilter = 'all',
): DeliverablesLibraryFilterView {
  // Pull the full deterministic inventory
  const view = buildProgramDeliverablesEvidenceView();
  const allDeliverables: DeliverableEntry[] = view.phaseGroups.flatMap(
    (group) => group.deliverables,
  );
  const totalDeliverables = allDeliverables.length;

  // Apply filters
  const filteredDeliverables = allDeliverables.filter((d) => {
    if (activePhase !== 'all' && d.phaseId !== activePhase) return false;
    if (activeVersion !== 'all' && d.versionState !== activeVersion) return false;
    if (activeEvidence !== 'all' && d.evidenceState !== activeEvidence) return false;
    return true;
  });

  // Phase pills
  const phasePills: Array<DeliverablesFilterPill<DeliverablesPhaseFilter>> = [
    {
      key: 'all',
      label: 'All phases',
      count: totalDeliverables,
      active: activePhase === 'all',
    },
    ...DELIVERABLE_PHASE_IDS.filter((phaseId) =>
      allDeliverables.some((d) => d.phaseId === phaseId),
    ).map((phaseId) => ({
      key: phaseId as DeliverablesPhaseFilter,
      label: PHASE_LABELS[phaseId],
      count: allDeliverables.filter((d) => d.phaseId === phaseId).length,
      active: activePhase === phaseId,
    })),
  ];

  // Version pills
  const versionPills: Array<DeliverablesFilterPill<DeliverablesVersionFilter>> = [
    {
      key: 'all',
      label: 'All states',
      count: totalDeliverables,
      active: activeVersion === 'all',
    },
    ...DELIVERABLE_VERSION_STATES.filter((state) =>
      allDeliverables.some((d) => d.versionState === state),
    ).map((state) => ({
      key: state as DeliverablesVersionFilter,
      label: VERSION_LABELS[state],
      count: allDeliverables.filter((d) => d.versionState === state).length,
      active: activeVersion === state,
    })),
  ];

  // Evidence pills
  const evidencePills: Array<DeliverablesFilterPill<DeliverablesEvidenceFilter>> = [
    {
      key: 'all',
      label: 'All evidence',
      count: totalDeliverables,
      active: activeEvidence === 'all',
    },
    ...DELIVERABLE_EVIDENCE_STATES.filter((state) =>
      allDeliverables.some((d) => d.evidenceState === state),
    ).map((state) => ({
      key: state as DeliverablesEvidenceFilter,
      label: EVIDENCE_LABELS[state],
      count: allDeliverables.filter((d) => d.evidenceState === state).length,
      active: activeEvidence === state,
    })),
  ];

  const isFiltered =
    activePhase !== 'all' ||
    activeVersion !== 'all' ||
    activeEvidence !== 'all';

  return {
    filteredDeliverables,
    totalDeliverables,
    filteredCount: filteredDeliverables.length,
    phasePills,
    versionPills,
    evidencePills,
    activePhase,
    activeVersion,
    activeEvidence,
    isFiltered,
    deterministicSeed: true,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns all distinct phases represented in the inventory (in canonical order).
 */
export function getRepresentedPhases(): DeliverablePhaseId[] {
  const view = buildProgramDeliverablesEvidenceView();
  const allDeliverables = view.phaseGroups.flatMap((g) => g.deliverables);
  const phaseSet = new Set(allDeliverables.map((d) => d.phaseId));
  return DELIVERABLE_PHASE_IDS.filter((p) => phaseSet.has(p));
}

/**
 * Returns a brief summary string for a filter state.
 * e.g. "3 deliverables · Discovery · Draft"
 */
export function buildFilterSummary(
  filterView: DeliverablesLibraryFilterView,
): string {
  const parts: string[] = [
    `${filterView.filteredCount} deliverable${filterView.filteredCount !== 1 ? 's' : ''}`,
  ];
  if (filterView.activePhase !== 'all') {
    parts.push(PHASE_LABELS[filterView.activePhase]);
  }
  if (filterView.activeVersion !== 'all') {
    parts.push(VERSION_LABELS[filterView.activeVersion]);
  }
  if (filterView.activeEvidence !== 'all') {
    parts.push(EVIDENCE_LABELS[filterView.activeEvidence]);
  }
  return parts.join(' · ');
}
