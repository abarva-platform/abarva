// INTEL4 · Intelligence Lens Tabs view-model.
//
// Pure deterministic helper that returns metadata for the four lens tabs
// on the Intelligence surface: Overview, Patterns, Evidence, Signals.
//
// No model calls, no fetch, no Date.now / Math.random / new Date,
// no live data. Same input → identical output.
//
// This module does NOT import:
//   - src/lib/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type IntelligenceLensTab =
  | 'overview'
  | 'patterns'
  | 'evidence'
  | 'signals';

export interface IntelligenceLensTabMeta {
  key: IntelligenceLensTab;
  label: string;
  description: string;
  /**
   * Whether this tab has seeded content for Apex Retail.
   * Other tenants receive a "thin" low-data disclosure on all tabs.
   */
  hasApexRetailContent: boolean;
}

export interface IntelligenceLensTabsView {
  activeTab: IntelligenceLensTab;
  tabs: IntelligenceLensTabMeta[];
  deterministicSeed: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const INTELLIGENCE_TABS: ReadonlyArray<IntelligenceLensTabMeta> = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'Sentinel summary and active pattern brief',
    hasApexRetailContent: true,
  },
  {
    key: 'patterns',
    label: 'Patterns',
    description: 'Pattern detections ranked by confidence and impact',
    hasApexRetailContent: true,
  },
  {
    key: 'evidence',
    label: 'Evidence',
    description: 'Evidence manifest — confirmed, missing, and deferred items',
    hasApexRetailContent: true,
  },
  {
    key: 'signals',
    label: 'Signals',
    description: 'Raw Sentinel signals and workflow canvas modes',
    hasApexRetailContent: true,
  },
];

const VALID_TAB_KEYS = new Set<string>(INTELLIGENCE_TABS.map((t) => t.key));

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the active Intelligence lens tab from a raw searchParam value.
 * Falls back to 'overview' for any unknown or missing value.
 */
export function resolveIntelligenceTab(
  raw: string | undefined | null,
): IntelligenceLensTab {
  if (raw && VALID_TAB_KEYS.has(raw)) {
    return raw as IntelligenceLensTab;
  }
  return 'overview';
}

/**
 * Build the IntelligenceLensTabsView for the given active tab.
 */
export function buildIntelligenceLensTabsView(
  activeTab: IntelligenceLensTab,
): IntelligenceLensTabsView {
  return {
    activeTab,
    tabs: [...INTELLIGENCE_TABS],
    deterministicSeed: true,
  };
}
