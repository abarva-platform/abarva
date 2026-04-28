// pattern-graph-shell-view.ts — I6
//
// Shell view model for the Pattern Graph UI.
// Analogous to SolutionCanvasShell for solutions.
//
// No React. No network calls. No model calls. Deterministic seed output only.
//
// I6 explicitly DOES NOT:
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/atlas/,
//     src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.

import { buildPatternRegistryView } from './pattern-registry-lifecycle';
import {
  buildPatternGraphView,
  getHighDegreePatterns,
} from './pattern-graph-read-model';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PatternGraphShellTab = 'graph' | 'registry' | 'promotions';

export interface PatternGraphShellTabItem {
  tab: PatternGraphShellTab;
  label: string;
  href: string;
  isActive: boolean;
  isDisabled: boolean;
  disabledReason: string | null;
}

export interface PatternGraphShellBreadcrumb {
  label: string;
  href: string | null;
  isCurrent: boolean;
}

export interface PatternGraphShellView {
  title: string;
  tabs: readonly PatternGraphShellTabItem[];
  breadcrumbs: readonly PatternGraphShellBreadcrumb[];
  activeTab: PatternGraphShellTab;
  totalPatterns: number;
  activePatterns: number;
  highDegreeCount: number;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BASE_PATH = '/intelligence/patterns';
const DISABLED_REASON = 'Deferred to a future wave.';

const TAB_META: readonly {
  tab: PatternGraphShellTab;
  label: string;
  segment: string;
}[] = [
  { tab: 'graph', label: 'Graph', segment: 'graph' },
  { tab: 'registry', label: 'Registry', segment: 'registry' },
  { tab: 'promotions', label: 'Promotions', segment: 'promotions' },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildTabs(
  activeTab: PatternGraphShellTab,
  basePath: string,
): readonly PatternGraphShellTabItem[] {
  return TAB_META.map((meta) => {
    const isGraphTab = meta.tab === 'graph';
    return {
      tab: meta.tab,
      label: meta.label,
      href: `${basePath}/${meta.segment}`,
      isActive: meta.tab === activeTab,
      isDisabled: !isGraphTab,
      disabledReason: isGraphTab ? null : DISABLED_REASON,
    };
  });
}

function buildBreadcrumbs(
  activeTab: PatternGraphShellTab,
  basePath: string,
): readonly PatternGraphShellBreadcrumb[] {
  const tabLabel = TAB_META.find((m) => m.tab === activeTab)?.label ?? activeTab;
  return [
    {
      label: 'Intelligence',
      href: '/intelligence',
      isCurrent: false,
    },
    {
      label: 'Pattern Graph',
      href: basePath,
      isCurrent: activeTab === 'graph',
    },
    ...(activeTab !== 'graph'
      ? [
          {
            label: tabLabel,
            href: null,
            isCurrent: true,
          },
        ]
      : []),
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds the PatternGraphShellView for a given active tab and base path.
 * Pulls live counts from PAT1 (registry) and I5 (graph).
 * Only the 'graph' tab is enabled; 'registry' and 'promotions' are disabled.
 */
export function buildPatternGraphShellView(
  activeTab: PatternGraphShellTab = 'graph',
  basePath: string = DEFAULT_BASE_PATH,
): PatternGraphShellView {
  const registry = buildPatternRegistryView();
  const graphView = buildPatternGraphView();
  const highDegreeNodes = getHighDegreePatterns(graphView);

  return {
    title: 'Pattern Graph',
    tabs: buildTabs(activeTab, basePath),
    breadcrumbs: buildBreadcrumbs(activeTab, basePath),
    activeTab,
    totalPatterns: registry.totalCount,
    activePatterns: registry.activeCount,
    highDegreeCount: highDegreeNodes.length,
    deterministicSeed: true,
  };
}

/**
 * Returns a single PatternGraphShellTabItem by tab key, or null if not found.
 */
export function getPatternGraphTabItem(
  view: PatternGraphShellView,
  tab: PatternGraphShellTab,
): PatternGraphShellTabItem | null {
  for (const item of view.tabs) {
    if (item.tab === tab) return item;
  }
  return null;
}

/**
 * Returns a concise prose description of a PatternGraphShellView.
 * Example: "Pattern Graph · graph · 8 patterns · 2 high-degree"
 */
export function describePatternGraphShell(view: PatternGraphShellView): string {
  return (
    view.title +
    ' · ' +
    view.activeTab +
    ' · ' +
    view.totalPatterns +
    ' patterns · ' +
    view.highDegreeCount +
    ' high-degree'
  );
}
