// programs-page-view.ts
//
// Page-level view types for the Programs surface.
//
// These types compose existing view-model primitives from types.ui.ts
// into page-ready shapes for the three Programs page categories:
//   - ProgramsIndexView      → /programs           (portfolio index)
//   - ProgramDetailView      → /programs/:programId (single program)
//   - ProgramOriginationView → /programs/new        (origination flow)
//
// Phase model: 7-phase P0–P6 (Originate / Discovery / Synthesis / Design /
// Build / Activate / Operate) per the shell wave canonical model.
//
// Demo anchor (CORR — aligned to pages.yaml §demo-data-baseline):
//   Flagship: APX-CDP-2026 · Apex Retail CDP Activation · P3 Design
//   Gate:     Design gate cleared Apr 27 · Build gate (P3→P4) pending 2/5 criteria
//   Blockers: Vendor C contract · privacy architecture sign-off · build brief
//   Evidence: 100% (Design gate cleared)
//   Source:   AMS Vendor Consolidation 2026 · Stage 7 BAFO · Vendor C selected
//
// Do NOT modify types.ui.ts solely to accommodate these types.

import type {
  ArchetypeKey,
  InboxItem,
  ModuleState,
  OriginationForm,
  PatternMatch,
  PersonRef,
  PhaseState,
  PortfolioFilters,
  ProgramFullState,
  ProgramSummary,
  ViewerRole,
} from './types.ui';

// ── Canonical phase model (7-phase P0–P6) ─────────────────────────────
// Shell wave canonical lifecycle per PHASE_LABEL_MAP in programs-fixture.ts.
// Hard gates at P1 entry (Discovery approved), P3 entry (Design approved),
// P5 entry (Activate approved). Soft transitions on remaining phases.

export const CANONICAL_SEVEN_PHASES = [
  { canonicalPhase: 0, name: 'Originate',  gateType: 'none' as const },
  { canonicalPhase: 1, name: 'Discovery',  gateType: 'hard' as const },
  { canonicalPhase: 2, name: 'Synthesis',  gateType: 'soft' as const },
  { canonicalPhase: 3, name: 'Design',     gateType: 'hard' as const },
  { canonicalPhase: 4, name: 'Build',      gateType: 'soft' as const },
  { canonicalPhase: 5, name: 'Activate',   gateType: 'hard' as const },
  { canonicalPhase: 6, name: 'Operate',    gateType: 'none' as const },
] as const;

// Back-compat alias — remove after all consumers migrate to CANONICAL_SEVEN_PHASES
/** @deprecated use CANONICAL_SEVEN_PHASES */
export const CANONICAL_SIX_PHASES = CANONICAL_SEVEN_PHASES;

export type CanonicalPhaseNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CanonicalPhaseName = typeof CANONICAL_SEVEN_PHASES[number]['name'];

// ── ProgramsIndexView ─────────────────────────────────────────────────
// Props for the portfolio index page (/programs).
// Contains the filtered + sorted program list, personal inbox items,
// active filters, and the viewer's resolved role.
//
// The `clientContext` field is optional; when present it scopes the
// view to a single client (used by the tenant-scoped index at
// /tenant/[tenantSlug]/programs).

// PortfolioFilters already covers search, phase, archetype, status,
// sponsor, pattern, myRole, shape. No additional fields needed yet,
// so we alias rather than declare an empty interface (which fails
// @typescript-eslint/no-empty-object-type).
export type ProgramsIndexFilters = PortfolioFilters;

export interface ProgramsIndexView {
  // Viewer identity
  viewerRole: ViewerRole;
  viewerPersonId: string;

  // Program list (already filtered + sorted server-side)
  programs: ProgramSummary[];
  totalCount: number;

  // Attention inbox — items requiring viewer action in the next 48 h
  inboxItems: InboxItem[];
  inboxCount: number;

  // Active filters applied to this view
  filters: ProgramsIndexFilters;

  // Client context — present when viewing a tenant-scoped index
  clientContext?: {
    clientId: string;
    clientName: string;
    tenantSlug: string;
  };

  // Origin paths available on this surface (used to render action chips)
  availableOriginPaths: Array<'intelligence_thread' | 'tower_signal' | 'user_initiated'>;

  // Summary statistics (computed from programs array, duplicated here
  // so the header can render without iterating the list)
  stats: {
    activeCount: number;
    awaitingGateCount: number;
    blockedCount: number;
    completedCount: number;
  };
}

// ── ProgramDetailView ──────────────────────────────────────────────────
// Props for the single-program detail page (/programs/:programId).
// Composes ProgramFullState with page-level UI state that the route
// owns (active tab, active phase, Nexus panel mode).
//
// The `activeTab` drives which section renders in the main canvas area.
// Not persisted to the DB; it is ephemeral client-side state but defined
// here so server components can supply a resolved initial value.

export type ProgramDetailTab =
  | 'overview'      // Phase journey + sponsor dashboard
  | 'workshop'      // Active module workspace
  | 'deliverables'  // Versioned artifact list
  | 'evidence'      // Evidence artifacts
  | 'actions'       // Open work items and risks
  | 'gate'          // Phase gate check + approvals
  | 'decisions';    // Decision log

export interface ProgramDetailView {
  // Core program state (DB-derived via buildProgramFullState)
  program: ProgramFullState;

  // Viewer identity
  viewerRole: ViewerRole;
  viewerPersonId: string;

  // Page navigation state
  activeTab: ProgramDetailTab;

  // Phase the user is currently inspecting.  Defaults to currentPhase.
  focusedPhase: CanonicalPhaseNumber;

  // Focused module within the phase (null when no module is open)
  focusedModuleKey: string | null;

  // Resolved phases with state — usually taken directly from
  // program.phases, but typed here for clarity
  phases: PhaseState[];

  // Modules visible in the current focusedPhase
  currentPhaseModules: ModuleState[];

  // Next action the viewer is expected to take (used for coaching strip)
  nextAction: ProgramDetailNextAction | null;

  // Whether the Nexus panel is docked open on this view
  nexusPanelOpen: boolean;
}

export interface ProgramDetailNextAction {
  type: 'complete_module' | 'review_deliverable' | 'clear_gate' | 'resolve_risk' | 'approve_request';
  label: string;
  moduleKey?: string;
  deliverableId?: string;
  programId: string;
}

// ── ProgramOriginationView ────────────────────────────────────────────
// Props for the program origination flow page (/programs/new).
// Covers all three origin paths:
//   - user_initiated     — blank form
//   - intelligence_thread — pre-loaded from a thread
//   - tower_signal        — pre-loaded from a tower signal
//
// After the classifier runs, `patternMatches` is populated and the
// view transitions to the pattern-selection step.

export type OriginationSource =
  | 'user_initiated'
  | 'intelligence_thread'
  | 'tower_signal';

export type OriginationStep =
  | 'intake'          // Fill out the origination form
  | 'classifying'     // Classifier is running (loading state)
  | 'pattern_select'  // Classifier returned matches; user selects
  | 'confirming'      // Shape confirmed; user reviews before submit
  | 'creating'        // POST in flight
  | 'complete';       // Program created; redirect pending

export interface OriginationPrefill {
  name?: string;
  useCase?: string;
  targetOutcome?: string;
  sponsorPersonId?: string;
  leadPersonId?: string;
  industryHint?: string;
  functionHint?: string;
  budgetRangeHint?: string;
  timelineHint?: string;
}

export interface ProgramOriginationView {
  // Which path launched the origination
  source: OriginationSource;

  // Resolved viewer identity
  viewerRole: ViewerRole;
  viewerPersonId: string;

  // Current step in the multi-step flow
  step: OriginationStep;

  // Form data — partially or fully filled
  form: OriginationForm;

  // Thread / signal context when source !== 'user_initiated'
  sourceRef?: {
    id: string;
    type: 'intelligence_thread' | 'tower_signal';
    label: string;         // Shown in the "sourced from" banner
    preloadDepthPct: number; // 0–100; determines pre-load badge
  };

  // Classifier results — populated after step transitions to 'pattern_select'
  patternMatches: PatternMatch[];
  selectedPatternKey: string | null;

  // Accepted shape override (when user picks custom or template instead
  // of the top pattern match)
  shapeOverride: 'template' | 'custom' | null;

  // Sponsor + lead candidate lists for the person pickers
  sponsorOptions: PersonRef[];
  leadOptions: PersonRef[];

  // Archetype inferred from use-case text (null until classifier has run)
  inferredArchetype: ArchetypeKey | null;

  // Classifier stage events displayed in the origination progress strip
  classifierStages: OriginationClassifierStage[];

  // Error state — null when no error
  error: string | null;

  // After creation succeeds, the programId to redirect to
  createdProgramId: string | null;
}

export interface OriginationClassifierStage {
  id: string;
  label: string;
  detail: string;
  state: 'pending' | 'running' | 'complete' | 'error';
}

// ── buildProgramsIndexView ────────────────────────────────────────────────
// Returns a deterministic ProgramsIndexView for the PROG-C index page.
// Uses the APEX_PROGRAMS_FIXTURE as the data source; no DB, no model calls.
// tenant param is 'apex-retail' for the demo anchor.

import type {
  ProgramAgentRailItem,
  ProgramRow,
  ProgramWorkbenchContent,
  ProgramsIndexView as ProgramsIndexViewV2,
} from './programs-types';
import { APEX_PROGRAMS_FIXTURE } from './programs-fixture';

export type ProgramsIndexFilterKey = 'all' | 'active' | 'idle' | 'gated';

export function normalizeProgramsIndexFilter(value: string | null): ProgramsIndexFilterKey {
  if (value === 'active' || value === 'idle' || value === 'gated') return value;
  return 'all';
}

export function filterProgramRowsForIndex(
  programs: ReadonlyArray<ProgramRow>,
  filter: ProgramsIndexFilterKey,
): ProgramRow[] {
  if (filter === 'active') return programs.filter((p) => !p.isIdle);
  if (filter === 'idle') return programs.filter((p) => p.isIdle);
  if (filter === 'gated') return programs.filter((p) => p.gateStatus === 'pending');
  return [...programs];
}

export function getProgramsIndexEmptyStateCopy(filter: ProgramsIndexFilterKey): string {
  if (filter === 'idle') return 'No programs are currently idle.';
  if (filter === 'active') return 'No programs are currently active.';
  if (filter === 'gated') return 'No programs have pending gate reviews.';
  return 'No programs are in the canonical portfolio yet.';
}

export function buildProgramsIndexView(tenant: 'apex-retail'): ProgramsIndexViewV2 {
  const tenantLabel = tenant === 'apex-retail' ? 'Apex Retail Group' : 'Apex Retail Group';
  const programs: ProgramRow[] = APEX_PROGRAMS_FIXTURE;

  const totalActive = programs.filter((p) => !p.isIdle).length;
  const gatesPending = programs.filter((p) => p.gateStatus === 'pending').length;
  const idleCount = programs.filter((p) => p.isIdle).length;

  const portfolioWorkbench: ProgramWorkbenchContent = {
    title: 'Nexus Portfolio Workbench',
    prose:
      'Six programs in flight across the Apex Retail portfolio. APX-CDP-2026 is the critical path — Design gate cleared Apr 27, now in P3 Design with Build gate 2 of 5 criteria met. Vendor C contract is the near-term blocker. APX-MRC-2025 has been idle 9 days; sponsor re-engagement recommended before the Q3 cadence review.',
    actionsLabel: 'Nexus recommends',
    actions: [
      {
        letter: 'A',
        text: 'Advance APX-CDP-2026 Build gate',
        detail: 'Close Vendor C contract · privacy architecture sign-off · build brief scoping',
      },
      {
        letter: 'B',
        text: 'Resume APX-MRC-2025',
        detail: 'Idle 9 days — engage sponsor before Q3 review',
      },
      {
        letter: 'C',
        text: 'Review APX-CC-2026 Build progress',
        detail: 'Activate gate approaching — IVR migration critical path',
      },
    ],
  };

  const agentRail: ProgramAgentRailItem[] = [
    {
      initials: 'Nx',
      name: 'Nexus',
      job: 'Orchestrating 6 programs · APX-CDP-2026 critical path',
      state: 'active',
    },
    {
      initials: 'Sn',
      name: 'Sentinel',
      job: 'Design gate review · APX-CDP-2026 evidence gap',
      state: 'on_call',
    },
    {
      initials: 'At',
      name: 'Atlas',
      job: 'APX-CC-2026 Activate brief ready · DFV2 steady state',
      state: 'on_call',
    },
    {
      initials: 'St',
      name: 'Steward',
      job: 'APX-CDP-2026 privacy boundary review pending',
      state: 'advisory',
    },
  ];

  return {
    tenant: tenantLabel,
    totalActive,
    gatesPending,
    idleCount,
    capacityLabel: 'Q3 60% capacity',
    portfolioWorkbench,
    agentRail,
    programs,
  };
}
