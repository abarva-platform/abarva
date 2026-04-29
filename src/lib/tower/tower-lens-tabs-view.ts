// TOWER4 + TOWER1 + TOWER2 + TOWER3 + TOWER8 + TOWER9 · Tower Lens Tabs view-model.
//
// Pure deterministic helper that returns metadata for the nine lens tabs
// on the Control Tower surface: Portfolio, Scorecards, Pressure, Source Commercial, Decisions, Value at Risk, Executive Brief, Programme Gates, Reasoning Activity.
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
  | 'source_commercial'
  | 'decisions'
  | 'value_at_risk'
  | 'executive_brief'
  | 'programme_gates'
  | 'reasoning_activity';

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
    key: 'source_commercial',
    label: 'Source Commercial',
    description: 'Source pricing, BAFO, and selection readiness signals — AMS Vendor Consolidation 2026',
    hasApexRetailContent: true,
  },
  {
    key: 'decisions',
    label: 'Decisions',
    description: 'Executive decision queue — decisions requiring leadership attention across Source and Programs',
    hasApexRetailContent: true,
  },
  {
    key: 'value_at_risk',
    label: 'Value at Risk',
    description: 'Value at risk portfolio lens — value at stake, evidence confidence, blockers, and decision needs',
    hasApexRetailContent: true,
  },
  {
    key: 'executive_brief',
    label: 'Executive Brief',
    description: 'Atlas executive summary — value, risk, and adoption signals',
    hasApexRetailContent: true,
  },
  {
    key: 'programme_gates',
    label: 'Programme Gates',
    description: 'Gate status across all 4 Apex AI programmes — pending, blocked, at-risk indicators and cross-programme dependencies',
    hasApexRetailContent: true,
  },
  {
    key: 'reasoning_activity',
    label: 'Reasoning Activity',
    description: 'AI reasoning activity brief — active contradictions, cross-stage handoff readiness, and pattern synthesis signals across the Apex Retail engagement',
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
