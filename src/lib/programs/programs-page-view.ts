// programs-page-view.ts
//
// Page-level view types for the Programs surface.
//
// These types compose existing view-model primitives from types.ui.ts
// into page-ready shapes for the three Programs page categories:
//   - ProgramsIndexView     → /programs   (portfolio index + inbox)
//   - ProgramDetailView     → /programs/:programId   (single program)
//   - ProgramOriginationView → /programs/new   (origination flow)
//
// Phase names come from the CANONICAL_SIX_PHASES constant below,
// which matches PHASE_LABELS in types.db.ts (phases 0–5).
// Actual program names and phases used throughout are those from the
// Apex Retail Group demo seed (programs-demo-apex.ts):
//   1. Contact Center AI Transformation  · Phase 4 Execute  · pattern
//   2. Unified Customer Data Platform    · Phase 1 Charter  · pattern
//   3. Store Associate Productivity      · Phase 1 Charter  · custom
//   4. Demand Forecasting AI             · Phase 5 Verify   · completed
//
// File destination: src/lib/programs/programs-page-view.ts
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

// ── Canonical phase model ──────────────────────────────────────────────
// Six-phase lifecycle shared by Template and Pattern shapes.
// Custom shapes may use a subset or specialized phase names, but
// this constant defines the canonical reference.
//
// Phase 0 · Origination: use-case captured, scope drafted, sponsor assigned
// Phase 1 · Charter:     scope locked, success criteria, baseline request
// Phase 2 · Diagnose:    data analyzed, findings, contradictions flagged
// Phase 3 · Design:      solution options, tradeoffs, recommendation
// Phase 4 · Execute:     build, integrate, deploy, measure
// Phase 5 · Verify:      outcome measurement, benefit realization
//
// Hard gates: Phase 2 entry (Charter signed) · Phase 4 entry (Design
// approved) · Phase 5 CXO verification (before outcome invoice).
// All other transitions are soft with unresolved markers.

export const CANONICAL_SIX_PHASES = [
  { canonicalPhase: 0, name: 'Origination', gateType: 'none' as const },
  { canonicalPhase: 1, name: 'Charter',     gateType: 'soft' as const },
  { canonicalPhase: 2, name: 'Diagnose',    gateType: 'hard' as const },
  { canonicalPhase: 3, name: 'Design',      gateType: 'soft' as const },
  { canonicalPhase: 4, name: 'Execute',     gateType: 'hard' as const },
  { canonicalPhase: 5, name: 'Verify',      gateType: 'hard' as const },
] as const;

export type CanonicalPhaseNumber = 0 | 1 | 2 | 3 | 4 | 5;
export type CanonicalPhaseName = typeof CANONICAL_SIX_PHASES[number]['name'];

// ── ProgramsIndexView ─────────────────────────────────────────────────
// Props for the portfolio index page (/programs).
// Contains the filtered + sorted program list, personal inbox items,
// active filters, and the viewer's resolved role.
//
// The `clientContext` field is optional; when present it scopes the
// view to a single client (used by the tenant-scoped index at
// /tenant/[tenantSlug]/programs).

export interface ProgramsIndexFilters extends PortfolioFilters {
  // PortfolioFilters already covers search, phase, archetype, status,
  // sponsor, pattern, myRole, shape.  No additional fields needed yet.
}

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
