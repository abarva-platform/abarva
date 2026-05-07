// TOWER · T-4 — Deferred metrics manifest.
//
// Per the Load Path Manifest v1.0.0 (locked 2026-05-07): the Three Tests gate
// (template-loadable · integration target exists · source allows) defers any
// metric that fails one or more tests. Deferred metrics show in the "Coming
// next" footer block above the Tower doctrine line as roadmap signals.
//
// CIO View defers 5 metrics (1 in Adoption, 4 in Risk). Tower CFO View
// surfaces all five as the platform roadmap because they share the substrate.
//
// Pure deterministic helper. No DB, no model calls.

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type DeferredMetricView = 'tower-cfo' | 'cio';

export interface DeferredMetric {
  key: string;
  label: string;
  /** Plain-English prerequisite. Doubles as a roadmap signal. */
  comingWhen: string;
  /** Originating CIO View component, for grouping if a UI wants it. */
  component?: 'inventory' | 'adoption' | 'value' | 'risk' | 'cost';
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFERRED_METRICS: ReadonlyArray<DeferredMetric> = [
  {
    key: 'ai_assisted_workflows_pct',
    label: 'AI-Assisted Workflows %',
    comingWhen: 'Workflow telemetry instrumentation in place',
    component: 'adoption',
  },
  {
    key: 'bias_reviews_complete',
    label: 'Bias Reviews Complete',
    comingWhen: 'Model risk governance platform deployed (Credo AI, Fiddler, etc.)',
    component: 'risk',
  },
  {
    key: 'drift_alerts',
    label: 'Drift Alerts',
    comingWhen: 'MLOps platform with drift detection deployed (W&B, MLFlow, Datadog ML, etc.)',
    component: 'risk',
  },
  {
    key: 'phi_incidents',
    label: 'PHI Incidents',
    comingWhen: 'DLP integration active (Microsoft Purview, Symantec, etc.)',
    component: 'risk',
  },
  {
    key: 'audit_trail_coverage_pct',
    label: 'Audit Trail Coverage',
    comingWhen: 'Per-decision logging instrumentation across AI initiatives',
    component: 'risk',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the deferred metrics relevant to a given Tower view.
 * Tower CFO View shows the platform roadmap (all 5).
 * CIO View shows them grouped by component (caller groups if needed).
 */
export function listDeferredMetrics(view: DeferredMetricView): ReadonlyArray<DeferredMetric> {
  // Same set surfaced for both views in v1; differentiation comes from
  // grouping/styling at the surface layer, not from the data.
  if (view === 'tower-cfo' || view === 'cio') {
    return DEFERRED_METRICS;
  }
  return [];
}
