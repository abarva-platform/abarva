// TOWER · T-4 — Metric provenance view-model.
//
// Per the AI Initiatives Substrate Package v1.1.0 (Load Path Manifest +
// Wireframe Addendum, locked 2026-05-07), every number on Tower CFO View
// gets an `ⓘ` provenance icon. Clicking opens a panel showing the load path:
//   1. How calculated
//   2. Day-1 load path (template field today)
//   3. Day-N integration target (named system + named API/method)
//   4. Source allows (universal / customer-owned / per-tool / etc.)
//   5. Last refreshed timestamp (deterministic seed)
//
// Pure deterministic helper. No DB, no model calls, no fetch, no Date.now,
// no Math.random. Same key → identical output.
//
// This module does NOT import:
//   - src/lib/source/**, src/lib/sentinel/**, src/lib/agent/**
//   - src/lib/auth/**, supabase/**

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type MetricProvenanceKey =
  | 'portfolio_roi'
  | 'active_pressures'
  | 'spend_at_risk'
  | 'renewals_90d'
  | 'adoption_rate';

export type LoadPathComplexity = 'easy' | 'medium' | 'hard';

export type SourceAllowsVerdict = 'universal' | 'customer_owned' | 'per_tool_varies' | 'restricted';

export interface MetricProvenancePanel {
  key: MetricProvenanceKey;
  metricLabel: string;
  /** How the value is computed at the substrate level. */
  calculation: string;
  /** Day-1 template field (or computed-from-template marker). */
  day1: {
    templateField: string;
    sourceTemplate: string;
  };
  /** Day-N named integration target with complexity hint. */
  dayN: {
    target: string;
    complexity: LoadPathComplexity;
    notes?: string;
  };
  /** Source-allows verdict + plain-English explanation. */
  sourceAllows: {
    verdict: SourceAllowsVerdict;
    explanation: string;
  };
  /** Deterministic last-refreshed marker for the panel. */
  lastRefreshed: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TOWER_METRIC_PROVENANCE: ReadonlyArray<MetricProvenancePanel> = [
  {
    key: 'portfolio_roi',
    metricLabel: 'Portfolio ROI',
    calculation:
      'Sum of measured_value_usd ÷ sum of committed_annual_usd, across all initiatives in the registry for this tenant.',
    day1: {
      templateField: 'measured_value_usd, committed_annual_usd',
      sourceTemplate: '{tenant}/full_load.json',
    },
    dayN: {
      target: 'FP&A system · finance API (Anaplan, Adaptive, Pigment, etc.)',
      complexity: 'medium',
      notes: 'FP&A integrations are real work but well-documented.',
    },
    sourceAllows: {
      verdict: 'customer_owned',
      explanation: "Customer's finance team owns the underlying data.",
    },
    lastRefreshed: '14m ago',
  },
  {
    key: 'active_pressures',
    metricLabel: 'Active pressures',
    calculation:
      'Count of initiatives where status_flag is in (cost_overrun, value_lag, stalled, duplication_risk, adoption_gap).',
    day1: {
      templateField: 'status_flag (per initiative)',
      sourceTemplate: '{tenant}/full_load.json',
    },
    dayN: {
      target: 'Derived from initiative state — no external integration needed.',
      complexity: 'easy',
    },
    sourceAllows: {
      verdict: 'universal',
      explanation: 'Internal data; computed from registry state.',
    },
    lastRefreshed: '14m ago',
  },
  {
    key: 'spend_at_risk',
    metricLabel: 'Spend at risk',
    calculation:
      'Sum of committed_annual_usd where status_flag is in (cost_overrun, value_lag, stalled, duplication_risk).',
    day1: {
      templateField: 'committed_annual_usd, status_flag',
      sourceTemplate: '{tenant}/full_load.json',
    },
    dayN: {
      target: 'Derived from registry state once committed amounts flow from FP&A.',
      complexity: 'easy',
    },
    sourceAllows: {
      verdict: 'customer_owned',
      explanation: "Customer's finance team owns committed amounts; status flags are internal.",
    },
    lastRefreshed: '14m ago',
  },
  {
    key: 'renewals_90d',
    metricLabel: 'Renewals · 90d',
    calculation:
      'Count from vendors.renewal_date within the next 90 days, joined to initiatives by vendor_id.',
    day1: {
      templateField: 'vendors[].renewal_date, vendors[].contract_value_usd',
      sourceTemplate: '{tenant}/full_load.json',
    },
    dayN: {
      target: 'Procurement system · contract management API (Coupa, Ariba, Ironclad).',
      complexity: 'easy',
    },
    sourceAllows: {
      verdict: 'customer_owned',
      explanation: "Customer's procurement team owns contract data.",
    },
    lastRefreshed: '14m ago',
  },
  {
    key: 'adoption_rate',
    metricLabel: 'Adoption rate',
    calculation:
      'Weighted average of per-initiative adoption KPIs (mau_count ÷ licensed_users), weighted by committed_annual_usd.',
    day1: {
      templateField: 'mau_count, licensed_users (per initiative)',
      sourceTemplate: '{tenant}/full_load.json',
    },
    dayN: {
      target:
        'Per-tool admin APIs: M365 Graph, Cursor admin, GitHub Copilot, ServiceNow Performance Analytics, SAP Cloud ALM.',
      complexity: 'medium',
      notes:
        'Major vendors expose admin APIs; custom internal tools require instrumentation per tool.',
    },
    sourceAllows: {
      verdict: 'per_tool_varies',
      explanation:
        'Each tool varies. M365 Graph ✅, Cursor ✅, GitHub ✅, custom internal tools require per-tool instrumentation.',
    },
    lastRefreshed: '14m ago',
  },
];

const TOWER_METRIC_PROVENANCE_BY_KEY = new Map<MetricProvenanceKey, MetricProvenancePanel>(
  TOWER_METRIC_PROVENANCE.map((p) => [p.key, p]),
);

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** All Tower CFO View metric provenance panels in display order. */
export function listTowerMetricProvenance(): ReadonlyArray<MetricProvenancePanel> {
  return TOWER_METRIC_PROVENANCE;
}

/**
 * Resolve the provenance panel for a metric key.
 * Returns null for unknown keys (caller must handle the absence).
 */
export function getTowerMetricProvenance(
  key: MetricProvenanceKey,
): MetricProvenancePanel | null {
  return TOWER_METRIC_PROVENANCE_BY_KEY.get(key) ?? null;
}

/** Human-readable label for a complexity tier. */
export function complexityLabel(c: LoadPathComplexity): string {
  if (c === 'easy') return 'easy';
  if (c === 'medium') return 'medium';
  return 'hard';
}

/** Human-readable label for a source-allows verdict. */
export function sourceAllowsLabel(v: SourceAllowsVerdict): string {
  if (v === 'universal') return '✅ Universal';
  if (v === 'customer_owned') return '✅ Customer-owned data';
  if (v === 'per_tool_varies') return '⚠️ Per-tool varies';
  return '❌ Restricted';
}
