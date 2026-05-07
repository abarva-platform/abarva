// TOWER4 + TOWER1 + TOWER2 + TOWER3 + TOWER8 + TOWER9 · Tower Lens Tabs view-model.
//
// T-2 (Tower Fix Package, 2026-05-07): reduced from 10 tabs to 5 working tabs.
// The dropped 5 (pressure, source_commercial, decisions, value_at_risk,
// reasoning_activity) either duplicated Portfolio content or lived on other
// surfaces. Per pr-t-2-sub-nav-reduction.md tab-by-tab disposition:
//   - pressure → already on Portfolio as "Today's pressures"
//   - source_commercial → /source surface
//   - decisions → on Portfolio via Atlas observations
//   - value_at_risk → that's the dimension toggle (Value/Risk/Contract/Adoption)
//   - reasoning_activity → in Atlas chat
//
// Pure deterministic helper that returns metadata for the five remaining tabs:
// Portfolio, Scorecards, Gates, Dependencies, Executive Brief.
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
  | 'programme_gates'
  | 'dependencies'
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
    description: "What's the state right now — today's dashboard, pressures, and Atlas observations.",
    hasApexRetailContent: true,
  },
  {
    key: 'scorecards',
    label: 'Scorecards',
    description: 'Per-program performance — programme health by domain.',
    hasApexRetailContent: true,
  },
  {
    key: 'programme_gates',
    label: 'Gates',
    description: 'Cross-portfolio P0→P5 lifecycle status across all programmes.',
    hasApexRetailContent: true,
  },
  {
    key: 'dependencies',
    label: 'Dependencies',
    description: 'Cross-program dependency map — source events, programs, and what blocks what.',
    hasApexRetailContent: true,
  },
  {
    key: 'executive_brief',
    label: 'Executive brief',
    description: 'Generated artifact for sponsor consumption — value, risk, adoption signals.',
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
 *
 * Direct-URL access to dropped tabs (?tab=pressure, ?tab=decisions, etc.)
 * lands on Portfolio — silently, since the jobs those tabs did are now
 * fulfilled inside Portfolio.
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
