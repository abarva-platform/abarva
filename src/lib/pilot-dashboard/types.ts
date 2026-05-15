// Pilot success metrics dashboard types · C5 Phase 1 + 2
//
// Per the spec at docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md.
// Phase 1 = substrate health (reuses existing broker overview).
// Phase 2 = engagement quality (Sentinel turn aggregates).
//
// Phase 3 (KPI strip) and Phase 4 (SLA conformance) need new
// persistence (tenant_refresh_log + incident_log) and are tracked
// separately.

export interface PilotDashboardData {
  /** Tenant the dashboard is scoped to. */
  readonly tenantClientKey: string;
  /** Display name (canonical, not the URL slug). */
  readonly tenantDisplayName: string;
  /** ISO-8601 timestamp the dashboard was generated. */
  readonly generatedAt: string;

  /** Panel 1 — health-at-a-glance KPIs (subset implementable today). */
  readonly headline: HeadlineKpis;

  /** Panel 2 — engagement quality. */
  readonly engagement: EngagementSnapshot;

  /** Panel 3 — substrate health (reuses broker overview). */
  readonly substrate: SubstrateSnapshot;

  /** Banners surfacing degraded state (e.g., "incident log not yet wired"). */
  readonly banners: ReadonlyArray<DashboardBanner>;
}

export interface HeadlineKpis {
  /** Number of Sentinel turns in the last 7 days for this tenant. */
  readonly sentinelTurns7d: number;
  /** Number of distinct engagement-id seen in turn_traces in 7d (proxy for active CXOs). */
  readonly engagementsActive7d: number;
  /** Substrate freshness — populated when tenant_refresh_log exists; null today. */
  readonly substrateFreshnessDays: number | null;
  /** Quarantine queue depth right now. */
  readonly quarantineOpen: number;
  /** Number of incidents opened in the last 7 days. Null when incident log isn't wired. */
  readonly incidents7d: number | null;
}

export interface EngagementSnapshot {
  /** Top Sentinel questions this month, ranked by frequency. Up to 10. */
  readonly topQuestions: ReadonlyArray<TopQuestion>;
  /** Up to 5 turns randomly sampled for the founder's weekly review. */
  readonly qualitySample: ReadonlyArray<TurnSample>;
  /** Average latency (ms) across the last 7 days of turns. */
  readonly avgLatencyMs7d: number | null;
  /** Total prompt + completion tokens last 7 days. */
  readonly tokens7d: { readonly input: number; readonly output: number } | null;
}

export interface TopQuestion {
  /** Excerpt of the user message that opened the turn. */
  readonly questionExcerpt: string;
  /** How many turns share this normalized question this month. */
  readonly count: number;
  /** Most recent ISO timestamp this question was asked. */
  readonly lastAskedAt: string;
}

export interface TurnSample {
  readonly turnId: string;
  readonly engagementId: string | null;
  readonly model: string | null;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly latencyMs: number | null;
  readonly createdAt: string;
}

export interface SubstrateSnapshot {
  /** 15 coverage-by-domain tiles. */
  readonly coverageTiles: ReadonlyArray<{
    readonly domain: string;
    readonly label: string;
    readonly rowCount: number;
  }>;
  /** 6 synthesized context cards. */
  readonly contextCards: ReadonlyArray<{
    readonly key: string;
    readonly title: string;
    readonly evidenceCount: number;
    readonly confidence: string;
  }>;
  /** Total evidence row count across all segments. */
  readonly totalEvidence: number;
  /** Average per-record confidence (0-1). */
  readonly averageConfidence: number;
}

export interface DashboardBanner {
  readonly severity: 'info' | 'warning';
  readonly key: string;
  readonly message: string;
}
