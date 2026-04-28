// INTEL4 · Intelligence Lens Tabs view-model.
//
// Pure deterministic helper that returns metadata for the five canonical
// lens tabs on the Intelligence surface: Summary, Evidence, Programs,
// Actions, Signals.
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
  | 'summary'
  | 'evidence'
  | 'programs'
  | 'actions'
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
    key: 'summary',
    label: 'Summary',
    description: 'Sentinel summary, active patterns, and decision framing',
    hasApexRetailContent: true,
  },
  {
    key: 'evidence',
    label: 'Evidence',
    description: 'Evidence manifest — confirmed, missing, and deferred items',
    hasApexRetailContent: true,
  },
  {
    key: 'programs',
    label: 'Programs',
    description: 'Affected program map and linked operating risk surface',
    hasApexRetailContent: true,
  },
  {
    key: 'actions',
    label: 'Actions',
    description: 'Priority-ordered Sentinel follow-through actions',
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
 * Falls back to 'summary' for any unknown or missing value.
 */
export function resolveIntelligenceTab(
  raw: string | undefined | null,
): IntelligenceLensTab {
  if (raw && VALID_TAB_KEYS.has(raw)) {
    return raw as IntelligenceLensTab;
  }
  return 'summary';
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
