/**
 * W32A — Programs Phase Filter View Model
 *
 * Pure TypeScript read-model for the phase filter surface on the Programs Index.
 * No React. No network calls. No model calls. Deterministic seed output only.
 *
 * Phases follow the six-phase canonical lifecycle as used in the AbarVa program workflow.
 * Internal keys remain stable for compatibility; labels use the strategy-to-approval
 * control-plane names.
 * which map to the blueprint's interactive filter bar specification.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProgramPhase =
  | 'discovery'
  | 'synthesis'
  | 'design'
  | 'build'
  | 'activate'
  | 'operate';

export interface PhaseFilterOption {
  phase: ProgramPhase;
  label: string;
  description: string;
  isCurrentPhase: boolean; // for apex-retail cdp program
  programCount: number;    // deterministic seed count
}

export interface PhaseFilterView {
  options: PhaseFilterOption[];
  activePhase: ProgramPhase | 'all';
  totalPrograms: number;
  deterministicSeed: true;
  caveat: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASE_LABEL_MAP: Record<ProgramPhase, string> = {
  discovery: 'Discovery',
  synthesis: 'Synthesis',
  design: 'Design',
  build: 'Execution Roadmap',
  activate: 'Approval & Mobilization',
  operate: 'Tower Handoff',
};

const PHASE_DESCRIPTION_MAP: Record<ProgramPhase, string> = {
  discovery:
    'Frame the problem, identify the sponsor, and scope the opportunity.',
  synthesis:
    'Surface findings, contradictions, and synthesise stakeholder input.',
  design:
    'Solution match, vendor evaluation, business case, and decision memo.',
  build:
    'Workstreams, estimates, timeline, milestones, dependencies, RACI, risks, and execution success criteria.',
  activate:
    'Business case, funding package, sponsor alignment, readiness, and change-management approval.',
  operate:
    'Tower monitoring contract, data-feed ownership, escalation thresholds, and value tracking cadence.',
};

const DETERMINISTIC_CAVEAT =
  'Phase counts are deterministic seed data derived from the Wave 2 Apex Retail programme seed. ' +
  'Live programme counts will differ once runtime ingestion is wired.';

// ---------------------------------------------------------------------------
// Apex Retail deterministic programme counts per phase
// (Apex Retail has 4 programs: Contact Center AI, CDP, Store Assoc Productivity, Demand Forecasting)
// CDP is currently in Execution Roadmap phase. Others are distributed across earlier phases.
// ---------------------------------------------------------------------------

const APEX_RETAIL_PHASE_COUNTS: Record<ProgramPhase, number> = {
  discovery: 1,  // Demand Forecasting — early framing
  synthesis: 1,  // Store Associate Productivity — synthesis stage
  design: 1,     // Contact Center AI — design and vendor evaluation
  build: 1,      // CDP — currently in Execution Roadmap phase (current phase)
  activate: 0,   // None in Approval & Mobilization yet
  operate: 0,    // None in Tower Handoff yet
};

// Meridian tenant has 2 programs (Intelligence demo tenant — thinner seed)
const MERIDIAN_PHASE_COUNTS: Record<ProgramPhase, number> = {
  discovery: 1,
  synthesis: 1,
  design: 0,
  build: 0,
  activate: 0,
  operate: 0,
};

// Default (unknown tenant) — all zeros
const DEFAULT_PHASE_COUNTS: Record<ProgramPhase, number> = {
  discovery: 0,
  synthesis: 0,
  design: 0,
  build: 0,
  activate: 0,
  operate: 0,
};

// Current phase per tenant for the flagship program
const TENANT_CURRENT_PHASE: Record<string, ProgramPhase> = {
  'apex-retail': 'build',
  meridian: 'synthesis',
  'meridian-health': 'synthesis',
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function getPhaseCounts(tenantSlug: string): Record<ProgramPhase, number> {
  if (tenantSlug === 'apex-retail') return APEX_RETAIL_PHASE_COUNTS;
  if (tenantSlug === 'meridian' || tenantSlug === 'meridian-health') {
    return MERIDIAN_PHASE_COUNTS;
  }
  return DEFAULT_PHASE_COUNTS;
}

function getTotalPrograms(tenantSlug: string): number {
  const counts = getPhaseCounts(tenantSlug);
  return (Object.values(counts) as number[]).reduce((sum, n) => sum + n, 0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the human-readable label for a ProgramPhase.
 */
export function getPhaseLabel(phase: ProgramPhase): string {
  return PHASE_LABEL_MAP[phase];
}

/**
 * Returns all phases that have at least one program for the given tenant.
 */
export function getPhasesWithPrograms(tenantSlug: string): ProgramPhase[] {
  const counts = getPhaseCounts(tenantSlug);
  const all: ProgramPhase[] = [
    'discovery',
    'synthesis',
    'design',
    'build',
    'activate',
    'operate',
  ];
  return all.filter((phase) => counts[phase] > 0);
}

/**
 * Builds the full PhaseFilterView for the Programs Index page.
 *
 * @param tenantSlug - The tenant identifier (e.g. 'apex-retail')
 * @param activePhase - The currently active filter (defaults to 'all')
 */
export function buildPhaseFilterView(
  tenantSlug: string,
  activePhase: ProgramPhase | 'all' = 'all',
): PhaseFilterView {
  const counts = getPhaseCounts(tenantSlug);
  const currentPhase: ProgramPhase | undefined = TENANT_CURRENT_PHASE[tenantSlug];

  const all: ProgramPhase[] = [
    'discovery',
    'synthesis',
    'design',
    'build',
    'activate',
    'operate',
  ];

  const options: PhaseFilterOption[] = all.map((phase) => ({
    phase,
    label: PHASE_LABEL_MAP[phase],
    description: PHASE_DESCRIPTION_MAP[phase],
    isCurrentPhase: phase === currentPhase,
    programCount: counts[phase],
  }));

  return {
    options,
    activePhase,
    totalPrograms: getTotalPrograms(tenantSlug),
    deterministicSeed: true,
    caveat: DETERMINISTIC_CAVEAT,
  };
}
