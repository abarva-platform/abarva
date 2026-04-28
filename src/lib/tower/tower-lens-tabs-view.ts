// TOWER4 · Tower Lens Tabs view-model.
//
// Pure deterministic helper that returns metadata for the four lens tabs
// on the Control Tower surface: Portfolio, Scorecards, Pressure, Executive Brief.
//
// No model calls, no fetch, no Date.now / Math.random / new Date,
// no live data. Same input → identical output.
//
// This module does NOT import:
//   - src/lib/source/**
//   - src/lib/sentinel/**, src/lib/nexus/**
//   - src/lib/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type TowerTabKey =
  | 'portfolio'
  | 'scorecards'
  | 'pressure'
  | 'executive_brief';

export interface TowerTabMeta {
  key: TowerTabKey;
  label: string;
  description: string;
  /**
   * Whether this tab has seeded content for Apex Retail.
   * Other tenants receive a low-data disclosure on all tabs.
   */
  hasApexRetailContent: boolean;
}

export interface TowerLensTabsView {
  activeTab: TowerTabKey;
  tabs: TowerTabMeta[];
  deterministicSeed: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const TOWER_TABS: ReadonlyArray<TowerTabMeta> = [
  {
    key: 'portfolio',
    label: 'Portfolio',
    description: 'Programme portfolio — pressure cards and vendor programme overview',
    hasApexRetailContent: true,
  },
  {
    key: 'scorecards',
    label: 'Scorecards',
    description: 'Active lens scorecards — programme health by domain',
    hasApexRetailContent: true,
  },
  {
    key: 'pressure',
    label: 'Pressure',
    description: 'Proactive pressure signals — blockers and at-risk indicators',
    hasApexRetailContent: true,
  },
  {
    key: 'executive_brief',
    label: 'Executive Brief',
    description: 'Atlas executive summary — value, risk, and adoption signals',
    hasApexRetailContent: true,
  },
];

const VALID_TOWER_TAB_KEYS = new Set<string>(TOWER_TABS.map((t) => t.key));

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the active Tower lens tab from a raw searchParam value.
 * Falls back to 'portfolio' for any unknown or missing value.
 */
export function resolveTowerTab(
  raw: string | undefined | null,
): TowerTabKey {
  if (raw && VALID_TOWER_TAB_KEYS.has(raw)) {
    return raw as TowerTabKey;
  }
  return 'portfolio';
}

/**
 * Build the TowerLensTabsView for the given active tab.
 */
export function buildTowerLensTabsView(
  activeTab: TowerTabKey,
): TowerLensTabsView {
  return {
    activeTab,
    tabs: [...TOWER_TABS],
    deterministicSeed: true,
  };
}
