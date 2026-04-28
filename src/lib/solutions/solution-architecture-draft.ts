// solution-architecture-draft.ts — SOL11
//
// Canvas-ready view model for a Solution Architecture Draft.
// Layers display metadata (section readiness, blocker summaries, navigation
// hints) on top of the core ArchitectureDraft from architecture-draft-read-model.ts
// (SOL12). Consumed by SolutionCanvasShell (SOL10) when the 'canvas' tab is
// active and the architect has an architecture draft to display.
//
// Deterministic: no runtime clocks, no random(), no model calls.
// Pattern: mirrors deliverables-library-view.ts — pill filters + drill-down.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/**
//   - src/lib/source/**, src/lib/auth/**
//   - supabase/**

import {
  buildArchitectureDraft,
  summarizeArchitectureDraft,
  getArchitectureBlockers,
  ARCHITECTURE_DRAFT_SECTION_KEYS,
  type ArchitectureDraft,
  type ArchitectureDraftInput,
  type ArchitectureDraftSection,
  type ArchitectureDraftSectionKey,
  type ArchitectureDraftStatus,
  type ArchitectureDraftSummary,
} from './architecture-draft-read-model';

// ─── Re-export core types ─────────────────────────────────────────────────────
// Callers can import everything they need from a single entry point.

export type {
  ArchitectureDraft,
  ArchitectureDraftInput,
  ArchitectureDraftSection,
  ArchitectureDraftSectionKey,
  ArchitectureDraftStatus,
  ArchitectureDraftSummary,
};

// ─── Section readiness ────────────────────────────────────────────────────────

/**
 * Readiness level for a single draft section, computed from the items
 * anchored to that section.
 *
 * - `complete`   — no blocking risks or evidence gaps
 * - `needs_work` — at least one approval-blocking risk or evidence gap
 * - `workshop`   — at least one workshop-gated assumption (but no blocker)
 * - `empty`      — no content anchored to the section at all
 */
export type SectionReadiness = 'complete' | 'needs_work' | 'workshop' | 'empty';

// ─── View types ───────────────────────────────────────────────────────────────

export interface SolutionArchitectureDraftSectionView {
  /** Canonical section key */
  sectionKey: ArchitectureDraftSectionKey;
  /** Human-readable title (from the underlying section) */
  title: string;
  /** Section narrative for the canvas body */
  narrative: string;
  /** Bullet body lines for the canvas body */
  body: readonly string[];
  /** Count of assumptions anchored to this section */
  assumptionCount: number;
  /** Count of assumptions requiring workshop validation */
  workshopAssumptionCount: number;
  /** Count of components anchored to this section */
  componentCount: number;
  /** Count of risks anchored to this section */
  riskCount: number;
  /** True if any risk anchored here blocks approval */
  hasBlockingRisk: boolean;
  /** Count of evidence gaps anchored to this section */
  evidenceGapCount: number;
  /** True if any evidence gap anchored here blocks approval */
  hasBlockingEvidenceGap: boolean;
  /** Computed readiness level */
  readiness: SectionReadiness;
  /** Pill label for the readiness badge */
  readinessLabel: string;
}

export interface SolutionArchitectureDraftBlocker {
  kind: 'risk' | 'evidence_gap';
  id: string;
  sectionKey: ArchitectureDraftSectionKey;
  description: string;
}

export interface SolutionArchitectureDraftView {
  /** The full underlying draft */
  draft: ArchitectureDraft;
  /** At-a-glance summary */
  summary: ArchitectureDraftSummary;
  /** Canvas-ready section views in canonical order */
  sectionViews: readonly SolutionArchitectureDraftSectionView[];
  /** Explicit blockers (blocking risks + blocking evidence gaps) */
  blockers: readonly SolutionArchitectureDraftBlocker[];
  /** True when any blocker is present */
  isBlocked: boolean;
  /** Count of sections that need work */
  sectionsNeedingWork: number;
  /** Count of sections that are complete */
  sectionsComplete: number;
  /** Human-readable status label */
  statusLabel: string;
  /** Recommended next action from the underlying draft */
  recommendedNextAction: string;
  /** Ready for canvas render — always true in the deterministic stub */
  canvasReady: boolean;
  deterministicSeed: true;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ArchitectureDraftStatus, string> = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  approved: 'Approved',
  requires_workshop: 'Requires Workshop',
  blocked: 'Blocked',
};

const READINESS_LABELS: Record<SectionReadiness, string> = {
  complete: 'Complete',
  needs_work: 'Needs Work',
  workshop: 'Workshop Required',
  empty: 'Empty',
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function computeSectionReadiness(
  section: ArchitectureDraftSection,
  draft: ArchitectureDraft,
): SectionReadiness {
  const sectionKey = section.key;

  const hasContent =
    section.assumptionIds.length > 0 ||
    section.componentIds.length > 0 ||
    section.riskIds.length > 0 ||
    section.evidenceGapIds.length > 0;

  if (!hasContent) return 'empty';

  const blockingRisk = draft.risks.some(
    (r) => r.sectionKey === sectionKey && r.blocksApproval,
  );
  const blockingGap = draft.evidenceGaps.some(
    (g) => g.sectionKey === sectionKey && g.impact === 'blocks_approval',
  );

  if (blockingRisk || blockingGap) return 'needs_work';

  const workshopAssumption = draft.assumptions.some(
    (a) => a.sectionKey === sectionKey && a.requiresWorkshopValidation,
  );

  return workshopAssumption ? 'workshop' : 'complete';
}

function buildSectionView(
  section: ArchitectureDraftSection,
  draft: ArchitectureDraft,
): SolutionArchitectureDraftSectionView {
  const { key: sectionKey } = section;

  const assumptions = draft.assumptions.filter((a) => a.sectionKey === sectionKey);
  const components = draft.components.filter((c) => c.sectionKey === sectionKey);
  const risks = draft.risks.filter((r) => r.sectionKey === sectionKey);
  const evidenceGaps = draft.evidenceGaps.filter((g) => g.sectionKey === sectionKey);

  const workshopAssumptionCount = assumptions.filter((a) => a.requiresWorkshopValidation).length;
  const hasBlockingRisk = risks.some((r) => r.blocksApproval);
  const hasBlockingEvidenceGap = evidenceGaps.some((g) => g.impact === 'blocks_approval');

  const readiness = computeSectionReadiness(section, draft);

  return {
    sectionKey,
    title: section.title,
    narrative: section.narrative,
    body: section.body,
    assumptionCount: assumptions.length,
    workshopAssumptionCount,
    componentCount: components.length,
    riskCount: risks.length,
    hasBlockingRisk,
    evidenceGapCount: evidenceGaps.length,
    hasBlockingEvidenceGap,
    readiness,
    readinessLabel: READINESS_LABELS[readiness],
  };
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Build the canvas-ready view for a Solution Architecture Draft.
 *
 * Accepts an optional `ArchitectureDraftInput` to customise the underlying
 * draft; when omitted the canonical deterministic seed draft is used.
 *
 * Every call with the same input produces a byte-equal output.
 */
export function buildSolutionArchitectureDraftView(
  input?: ArchitectureDraftInput,
): SolutionArchitectureDraftView {
  const draft = buildArchitectureDraft(input);
  const summary = summarizeArchitectureDraft(draft);
  const rawBlockers = getArchitectureBlockers(draft);

  const blockers: SolutionArchitectureDraftBlocker[] = rawBlockers.map((b) => ({
    kind: b.kind,
    id: b.id,
    sectionKey: b.sectionKey,
    description: b.description,
  }));

  // Build section views in canonical section order
  const sectionViews = ARCHITECTURE_DRAFT_SECTION_KEYS.map((key) => {
    const section = draft.sections.find((s) => s.key === key);
    // Sections must always exist for canonical keys; fall back to empty shape
    if (!section) {
      return {
        sectionKey: key,
        title: key,
        narrative: '',
        body: [],
        assumptionCount: 0,
        workshopAssumptionCount: 0,
        componentCount: 0,
        riskCount: 0,
        hasBlockingRisk: false,
        evidenceGapCount: 0,
        hasBlockingEvidenceGap: false,
        readiness: 'empty' as SectionReadiness,
        readinessLabel: READINESS_LABELS['empty'],
      } satisfies SolutionArchitectureDraftSectionView;
    }
    return buildSectionView(section, draft);
  });

  const sectionsNeedingWork = sectionViews.filter((s) => s.readiness === 'needs_work').length;
  const sectionsComplete = sectionViews.filter((s) => s.readiness === 'complete').length;

  return {
    draft,
    summary,
    sectionViews,
    blockers,
    isBlocked: blockers.length > 0,
    sectionsNeedingWork,
    sectionsComplete,
    statusLabel: STATUS_LABELS[draft.status],
    recommendedNextAction: draft.recommendedNextAction,
    canvasReady: true,
    deterministicSeed: true,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the canvas-ready section view for a specific section key.
 * Returns `null` if the key is not found (should not happen with canonical keys).
 */
export function getSectionView(
  view: SolutionArchitectureDraftView,
  sectionKey: ArchitectureDraftSectionKey,
): SolutionArchitectureDraftSectionView | null {
  for (const sv of view.sectionViews) {
    if (sv.sectionKey === sectionKey) return sv;
  }
  return null;
}

/**
 * Returns all section views matching a given readiness level.
 */
export function getSectionsByReadiness(
  view: SolutionArchitectureDraftView,
  readiness: SectionReadiness,
): readonly SolutionArchitectureDraftSectionView[] {
  return view.sectionViews.filter((s) => s.readiness === readiness);
}

/**
 * Returns a concise prose summary for display.
 * e.g. "Draft · 8 sections · 2 need work · 1 blocker"
 */
export function describeSolutionArchitectureDraft(view: SolutionArchitectureDraftView): string {
  const parts: string[] = [view.statusLabel];
  parts.push(`${view.sectionViews.length} section${view.sectionViews.length !== 1 ? 's' : ''}`);
  if (view.sectionsNeedingWork > 0) {
    parts.push(`${view.sectionsNeedingWork} need${view.sectionsNeedingWork === 1 ? 's' : ''} work`);
  }
  if (view.blockers.length > 0) {
    parts.push(`${view.blockers.length} blocker${view.blockers.length !== 1 ? 's' : ''}`);
  }
  return parts.join(' · ');
}
