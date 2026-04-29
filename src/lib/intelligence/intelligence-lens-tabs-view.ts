// INTEL4 + INT1 + INT3 + INT4 + INT5 + INT6 + INT7 + INT8 · Intelligence Lens Tabs view-model.
//
// Pure deterministic helper that returns metadata for the twelve canonical
// lens tabs on the Intelligence surface: Summary, Evidence, Programs,
// Actions, Signals, Pattern Plan, Gap Queue, Contradiction Monitor,
// Programme Risk, Gate Readiness, Engagement Scorecard, Milestone Tracker.
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
  | 'signals'
  | 'pattern_plan'
  | 'gap_queue'
  | 'contradiction_monitor'
  | 'programme_risk'
  | 'gate_readiness'
  | 'engagement_scorecard'
  | 'milestone_tracker';

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
  {
    key: 'pattern_plan',
    label: 'Pattern Plan',
    description: 'Client-specific applied pattern plan — application status, evidence gaps, and priority actions',
    hasApexRetailContent: true,
  },
  {
    key: 'gap_queue',
    label: 'Gap Queue',
    description: 'Prioritized evidence gap close-out queue — critical and high-urgency items first',
    hasApexRetailContent: true,
  },
  {
    key: 'contradiction_monitor',
    label: 'Contradictions',
    description: 'Per-pattern contradiction monitor — active contradictions, resolution status, severity, and blocked gates across the Apex Retail engagement',
    hasApexRetailContent: true,
  },
  {
    key: 'programme_risk',
    label: 'Programme Risk',
    description: 'Cross-reference of contradictions, evidence gaps, and gate status rolled up to programme-level risk signals for the 4 Apex AI programmes',
    hasApexRetailContent: true,
  },
  {
    key: 'gate_readiness',
    label: 'Gate Readiness',
    description: 'Per-programme gate readiness checklist — what Sentinel needs confirmed before each programme can advance to its next milestone gate',
    hasApexRetailContent: true,
  },
  {
    key: 'engagement_scorecard',
    label: 'Scorecard',
    description: 'Engagement intelligence scorecard — per-programme traffic-light rollup of pattern application, evidence confidence, contradiction count, and gate state',
    hasApexRetailContent: true,
  },
  {
    key: 'milestone_tracker',
    label: 'Milestones',
    description: 'Per-programme upcoming milestone schedule — status, blockers, and Sentinel notes for key gates, reviews, decisions, and deliveries',
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
