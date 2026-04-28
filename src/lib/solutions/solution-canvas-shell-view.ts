// solution-canvas-shell-view.ts — SOL10
//
// Deterministic view model for the Solution Canvas shell — the outer
// chrome that wraps the SolutionCanvas content surface.
//
// The shell manages: breadcrumbs, tab strip, empty state, and the
// solution metadata header. It deliberately does NOT embed the canvas
// content — that is SolutionCanvas (SOL11). The shell is the frame;
// SOL11 is the picture.
//
// Deterministic: no runtime clocks, no random(), no model calls.
// Pattern: mirrors other shell view models (programs-detail-view.ts).
//
// This module explicitly DOES NOT:
//   - call fetch, Date.now, Math.random, or new Date.
//   - import from @/lib/source/, @/lib/auth/, @/lib/agent/, supabase.
//   - render any UI or define React hooks.

// ─── Types ────────────────────────────────────────────────────────────────────

export type CanvasShellTab =
  | 'canvas'
  | 'workshops'
  | 'deliverables'
  | 'evidence'
  | 'team';

export type CanvasShellLoadState = 'loaded' | 'empty' | 'error';

export interface CanvasShellBreadcrumb {
  label: string;
  href: string | null;
  isCurrent: boolean;
}

export interface CanvasShellTabItem {
  tab: CanvasShellTab;
  label: string;
  href: string;
  isActive: boolean;
  /** True when the tab is present but not yet implemented. */
  isDisabled: boolean;
  disabledReason: string | null;
}

export interface CanvasShellMetadata {
  /** Short label for the solution type, e.g. "AI-Led PDLC". */
  solutionTypeLabel: string;
  archetypeKey: string | null;
  archetypeLabel: string | null;
  /** Owner / steward display name. */
  ownerLabel: string;
  /** Short breadcrumb-friendly title. */
  shortTitle: string;
}

export interface CanvasShellEmptyState {
  headline: string;
  subtext: string;
  /** Primary CTA label (e.g. "Start a Solution Canvas"). */
  ctaLabel: string;
  ctaHref: string;
}

export interface SolutionCanvasShellView {
  /** Full solution title — used in the H1. */
  title: string;
  /** Tab strip for switching between canvas sub-surfaces. */
  tabs: readonly CanvasShellTabItem[];
  /** Breadcrumb trail for this canvas page. */
  breadcrumbs: readonly CanvasShellBreadcrumb[];
  /** Canonical metadata for the solution header card. */
  metadata: CanvasShellMetadata;
  /** Empty state content — rendered when loadState is 'empty'. */
  emptyState: CanvasShellEmptyState;
  /** Current load state of the canvas surface. */
  loadState: CanvasShellLoadState;
  /** Active tab key. */
  activeTab: CanvasShellTab;
  /** True when any tab other than 'canvas' is active. */
  isSubtabActive: boolean;
  deterministicSeed: true;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<CanvasShellTab, string> = {
  canvas: 'Canvas',
  workshops: 'Workshops',
  deliverables: 'Deliverables',
  evidence: 'Evidence',
  team: 'Team',
};

// Tabs that have deferred implementation in the current wave.
const DEFERRED_TABS: ReadonlySet<CanvasShellTab> = new Set([
  'workshops',
  'deliverables',
  'evidence',
  'team',
]);

const DEFERRED_REASON =
  'This surface is deferred to a future wave. Canvas tab is the active workbench.';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a canonical tab strip for a solution canvas page.
 *
 * @param solutionSlug - URL slug for the solution (e.g. 'apx-cdp-2026').
 * @param activeTab - Which tab is currently active.
 * @param basePath - Base URL path prefix (e.g. '/solutions').
 */
export function buildCanvasShellTabs(
  solutionSlug: string,
  activeTab: CanvasShellTab = 'canvas',
  basePath = '/solutions',
): readonly CanvasShellTabItem[] {
  const tabs: CanvasShellTab[] = ['canvas', 'workshops', 'deliverables', 'evidence', 'team'];
  return tabs.map((tab) => ({
    tab,
    label: TAB_LABELS[tab],
    href: basePath + '/' + solutionSlug + (tab === 'canvas' ? '' : '/' + tab),
    isActive: tab === activeTab,
    isDisabled: DEFERRED_TABS.has(tab),
    disabledReason: DEFERRED_TABS.has(tab) ? DEFERRED_REASON : null,
  }));
}

/**
 * Build breadcrumbs for a solution canvas page.
 */
export function buildCanvasShellBreadcrumbs(
  solutionTitle: string,
  basePath = '/solutions',
): readonly CanvasShellBreadcrumb[] {
  return [
    { label: 'Solutions', href: basePath, isCurrent: false },
    { label: solutionTitle, href: null, isCurrent: true },
  ];
}

/**
 * Build the canonical empty state for a solution canvas with no content.
 */
export function buildCanvasEmptyState(
  basePath = '/solutions',
): CanvasShellEmptyState {
  return {
    headline: 'No solution canvas yet',
    subtext:
      'A solution canvas captures architecture decisions, component choices, ' +
      'build/buy guidance, and recommended workshops for this initiative.',
    ctaLabel: 'Start a Solution Canvas',
    ctaHref: basePath + '/new',
  };
}

/**
 * Build the full Solution Canvas shell view model.
 *
 * @param title - Full solution title.
 * @param solutionSlug - URL-safe solution identifier.
 * @param activeTab - Currently active tab (default: 'canvas').
 * @param loadState - Whether the canvas has content or is empty/error.
 * @param metadata - Solution metadata for the header card.
 * @param basePath - Route prefix (default: '/solutions').
 */
export function buildSolutionCanvasShellView(
  title: string,
  solutionSlug: string,
  activeTab: CanvasShellTab = 'canvas',
  loadState: CanvasShellLoadState = 'loaded',
  metadata?: Partial<CanvasShellMetadata>,
  basePath = '/solutions',
): SolutionCanvasShellView {
  const resolvedMetadata: CanvasShellMetadata = {
    solutionTypeLabel: metadata?.solutionTypeLabel ?? 'Solution',
    archetypeKey: metadata?.archetypeKey ?? null,
    archetypeLabel: metadata?.archetypeLabel ?? null,
    ownerLabel: metadata?.ownerLabel ?? 'Unassigned',
    shortTitle: metadata?.shortTitle ?? title,
  };

  return {
    title,
    tabs: buildCanvasShellTabs(solutionSlug, activeTab, basePath),
    breadcrumbs: buildCanvasShellBreadcrumbs(title, basePath),
    metadata: resolvedMetadata,
    emptyState: buildCanvasEmptyState(basePath),
    loadState,
    activeTab,
    isSubtabActive: activeTab !== 'canvas',
    deterministicSeed: true,
  };
}

/**
 * Returns the active tab item from the shell view, or null if not found
 * (should never happen with a well-formed view).
 */
export function getActiveTabItem(
  view: SolutionCanvasShellView,
): CanvasShellTabItem | null {
  return view.tabs.find((t) => t.isActive) ?? null;
}

/**
 * Returns all enabled (non-disabled) tabs.
 */
export function getEnabledTabs(
  view: SolutionCanvasShellView,
): readonly CanvasShellTabItem[] {
  return view.tabs.filter((t) => !t.isDisabled);
}

/**
 * Short summary string for the shell view.
 * e.g. "AI-Led PDLC · canvas · loaded"
 */
export function describeCanvasShell(view: SolutionCanvasShellView): string {
  return (
    view.metadata.solutionTypeLabel +
    ' · ' +
    view.activeTab +
    ' · ' +
    view.loadState
  );
}
