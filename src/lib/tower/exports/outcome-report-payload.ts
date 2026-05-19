// Tower · outcome / measurement report · payload type + assembler
//
// G8 — the Tower surface tracks realized outcomes of AI initiatives but
// has produced nothing downloadable. This module assembles whatever
// real Tower substrate exists for the active tenant into a single
// typed payload that the DOCX (narrative) and XLSX (metrics tables)
// renderers consume.
//
// No-fabrication contract: this assembler reads only the AI Initiatives
// substrate (initiatives, vendors, KPIs) plus the deterministic Tower
// band-metrics view-model. It NEVER invents counts, dollar figures, or
// KPI values. When a tenant has thin substrate the payload carries the
// honest emptiness through to the renderers, which print explicit
// "no tracked outcomes yet" sections instead of placeholders.
//
// The assembler is split in two:
//   - buildTowerOutcomeReportPayload(input): pure — view-model in,
//     payload out. Deterministic, unit-testable, no I/O.
//   - The route layer (render-docx / render-xlsx) does the DB reads and
//     calls this with the loaded substrate.

import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';
import { STAGE_LABELS, STATUS_LABELS, formatUsd } from '@/lib/admin/ai-initiatives/labels';
import type { TowerBandMetricsView } from '@/lib/tower/band-metrics-view';

// ─────────────────────────────────────────────────────────────────────────────
// KPI input shape — a flattened view of the per-initiative measurement
// model. The route passes one row per (initiative, KPI quarter). Mirrors
// AIInitiativeKpi from detail-queries.ts but carries the owning
// initiative id/name so the report can group without re-querying.
// ─────────────────────────────────────────────────────────────────────────────

export interface TowerOutcomeKpiInput {
  initiativeId: string;
  initiativeDisplayId: string;
  initiativeName: string;
  kpiName: string;
  kpiUnit: string | null;
  quarter: string;
  kpiValue: number;
  targetValue: number | null;
  peerMedian: number | null;
  confidenceLevel: 'HIGH' | 'MED' | 'LOW';
}

export interface TowerOutcomeReportInput {
  tenantName: string;
  /** Client key (apexretail / meridian / arcturus). Stamped in headers. */
  tenantKey: string;
  /** ISO 8601 generated-at timestamp. */
  generatedAt: string;
  /** Tower "today" used for the 90-day activity window. */
  towerToday: string;
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  kpis: ReadonlyArray<TowerOutcomeKpiInput>;
  /** Deterministic band-metrics view-model already computed by the page. */
  bandMetrics: TowerBandMetricsView;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload — the renderer-facing shape. Everything here is already
// formatted for display; renderers do no further computation.
// ─────────────────────────────────────────────────────────────────────────────

/** One tracked initiative row, with its realized-vs-forecast posture. */
export interface OutcomeInitiativeRow {
  displayId: string;
  name: string;
  stageLabel: string;
  statusLabel: string;
  ownerName: string;
  ownerTitle: string;
  /** Formatted committed annual spend, or "—" when not loaded. */
  committedAnnual: string;
  /** Formatted measured (realized) value, or "—" when not loaded. */
  measuredValue: string;
  /**
   * Realized-vs-forecast verdict. Honest: 'not_measured' when no
   * measured value exists — never a fabricated delta.
   */
  realizedPosture:
    | { kind: 'not_measured' }
    | { kind: 'no_forecast' }
    | { kind: 'measured'; deltaLabel: string; ratio: number };
  confidenceLevel: 'HIGH' | 'MED' | 'LOW';
  statusSummary: string;
}

/** One KPI measurement-model row. */
export interface OutcomeKpiRow {
  initiativeDisplayId: string;
  initiativeName: string;
  kpiName: string;
  quarter: string;
  /** Formatted value with unit suffix when present. */
  valueLabel: string;
  /** Formatted target, or "—". */
  targetLabel: string;
  /** Formatted peer median, or "—". */
  peerMedianLabel: string;
  /** Honest attainment verdict vs. target. */
  attainment:
    | { kind: 'no_target' }
    | { kind: 'measured'; label: string; pct: number };
  confidenceLevel: 'HIGH' | 'MED' | 'LOW';
}

/** One vendor-portfolio row. */
export interface OutcomeVendorRow {
  vendorName: string;
  initiativeDisplayId: string;
  initiativeName: string;
  contractValue: string;
  renewalDate: string;
  /** Days until renewal relative to towerToday, or null when no date. */
  daysToRenewal: number | null;
  financialHealthLabel: string;
}

/** One band-metric tile, flattened for the report. */
export interface OutcomeBandMetricRow {
  label: string;
  value: string;
  subtext: string;
  confidence: string;
  tooltip: string;
}

/** A 90-day activity item — derived, not invented. */
export interface OutcomeActivityRow {
  /** ISO date of the activity. */
  date: string;
  /** Days from towerToday (negative = in the past, positive = upcoming). */
  dayOffset: number;
  category: 'renewal' | 'kpi_measurement';
  summary: string;
}

export interface TowerOutcomeReportPayload {
  tenantName: string;
  tenantKey: string;
  generatedAt: string;
  towerToday: string;

  /** True when the tenant has zero tracked initiatives. */
  isEmpty: boolean;

  /** Headline counts — all derived from real substrate. */
  summary: {
    initiativeCount: number;
    vendorCount: number;
    kpiCount: number;
    /** Initiatives carrying a non-null measured_value_usd. */
    measuredInitiativeCount: number;
    /** Initiatives in a pressure-bearing status flag. */
    pressuredInitiativeCount: number;
  };

  bandMetrics: ReadonlyArray<OutcomeBandMetricRow>;
  initiatives: ReadonlyArray<OutcomeInitiativeRow>;
  kpis: ReadonlyArray<OutcomeKpiRow>;
  vendors: ReadonlyArray<OutcomeVendorRow>;
  activity90d: ReadonlyArray<OutcomeActivityRow>;

  /**
   * Honest empty-state notes. One string per section that has no data;
   * renderers print these verbatim so the sparse report explains itself.
   */
  emptyNotes: {
    initiatives: string | null;
    kpis: string | null;
    vendors: string | null;
    activity: string | null;
    measurement: string | null;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PRESSURE_FLAGS = new Set([
  'cost_overrun',
  'value_lag',
  'stalled',
  'duplication_risk',
  'adoption_gap',
]);

const ACTIVITY_WINDOW_DAYS = 90;

const FINANCIAL_HEALTH_LABELS: Record<string, string> = {
  strong: 'Strong',
  moderate: 'Moderate',
  watch: 'Watch',
  at_risk: 'At risk',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function daysBetween(targetIso: string, fromIso: string): number | null {
  const target = Date.parse(targetIso);
  const from = Date.parse(fromIso);
  if (Number.isNaN(target) || Number.isNaN(from)) return null;
  return Math.round((target - from) / (1000 * 60 * 60 * 24));
}

function formatKpiValue(value: number, unit: string | null): string {
  const v = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return unit ? `${v} ${unit}` : v;
}

function confidenceUpper(c: string): string {
  return c.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Section builders
// ─────────────────────────────────────────────────────────────────────────────

function buildInitiativeRows(
  initiatives: ReadonlyArray<AIInitiative>,
): ReadonlyArray<OutcomeInitiativeRow> {
  return initiatives.map((i) => {
    let realizedPosture: OutcomeInitiativeRow['realizedPosture'];
    if (i.measuredValueUsd === null) {
      realizedPosture = { kind: 'not_measured' };
    } else if (i.committedAnnualUsd === null || i.committedAnnualUsd <= 0) {
      realizedPosture = { kind: 'no_forecast' };
    } else {
      const ratio = i.measuredValueUsd / i.committedAnnualUsd;
      const deltaLabel =
        ratio >= 1
          ? `${ratio.toFixed(2)}× committed — realized value exceeds committed annual spend`
          : `${ratio.toFixed(2)}× committed — realized value below committed annual spend`;
      realizedPosture = { kind: 'measured', deltaLabel, ratio };
    }

    return {
      displayId: i.displayId,
      name: i.name,
      stageLabel: STAGE_LABELS[i.stage] ?? i.stage,
      statusLabel: STATUS_LABELS[i.statusFlag] ?? i.statusFlag,
      ownerName: i.ownerName,
      ownerTitle: i.ownerTitle,
      committedAnnual: formatUsd(i.committedAnnualUsd),
      measuredValue: formatUsd(i.measuredValueUsd),
      realizedPosture,
      confidenceLevel: i.confidenceLevel,
      statusSummary: i.statusSummary,
    };
  });
}

function buildKpiRows(
  kpis: ReadonlyArray<TowerOutcomeKpiInput>,
): ReadonlyArray<OutcomeKpiRow> {
  return kpis
    .slice()
    .sort((a, b) => {
      if (a.initiativeDisplayId !== b.initiativeDisplayId) {
        return a.initiativeDisplayId.localeCompare(b.initiativeDisplayId);
      }
      if (a.kpiName !== b.kpiName) return a.kpiName.localeCompare(b.kpiName);
      return a.quarter.localeCompare(b.quarter);
    })
    .map((k) => {
      let attainment: OutcomeKpiRow['attainment'];
      if (k.targetValue === null || k.targetValue === 0) {
        attainment = { kind: 'no_target' };
      } else {
        const pct = (k.kpiValue / k.targetValue) * 100;
        attainment = {
          kind: 'measured',
          pct,
          label:
            pct >= 100
              ? `${pct.toFixed(0)}% of target — target met`
              : `${pct.toFixed(0)}% of target — below target`,
        };
      }
      return {
        initiativeDisplayId: k.initiativeDisplayId,
        initiativeName: k.initiativeName,
        kpiName: k.kpiName,
        quarter: k.quarter,
        valueLabel: formatKpiValue(k.kpiValue, k.kpiUnit),
        targetLabel:
          k.targetValue === null ? '—' : formatKpiValue(k.targetValue, k.kpiUnit),
        peerMedianLabel:
          k.peerMedian === null ? '—' : formatKpiValue(k.peerMedian, k.kpiUnit),
        attainment,
        confidenceLevel: k.confidenceLevel,
      };
    });
}

function buildVendorRows(
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  towerToday: string,
): ReadonlyArray<OutcomeVendorRow> {
  return vendors.map((v) => ({
    vendorName: v.vendorName,
    initiativeDisplayId: v.initiativeDisplayId,
    initiativeName: v.initiativeName,
    contractValue: formatUsd(v.contractValueUsd),
    renewalDate: v.renewalDate ?? '—',
    daysToRenewal: v.renewalDate ? daysBetween(v.renewalDate, towerToday) : null,
    financialHealthLabel: v.financialHealth
      ? (FINANCIAL_HEALTH_LABELS[v.financialHealth] ?? v.financialHealth)
      : '—',
  }));
}

/**
 * Build the 90-day activity log from real substrate only:
 *   - vendor contract renewals whose renewal_date lands within ±90d of
 *     towerToday;
 *   - KPI measurements whose quarter parses to a date within the window.
 * No item is invented; if neither source yields anything in the window
 * the result is an empty array and the renderers print an honest note.
 */
function buildActivity90d(
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  kpis: ReadonlyArray<TowerOutcomeKpiInput>,
  towerToday: string,
): ReadonlyArray<OutcomeActivityRow> {
  const items: OutcomeActivityRow[] = [];

  for (const v of vendors) {
    if (!v.renewalDate) continue;
    const offset = daysBetween(v.renewalDate, towerToday);
    if (offset === null) continue;
    if (Math.abs(offset) > ACTIVITY_WINDOW_DAYS) continue;
    items.push({
      date: v.renewalDate,
      dayOffset: offset,
      category: 'renewal',
      summary: `${v.vendorName} contract renewal (${v.initiativeDisplayId} · ${v.initiativeName})`,
    });
  }

  for (const k of kpis) {
    // A quarter label like "2026-Q1" is not a precise date; only count
    // it as activity when it carries an ISO-parseable date.
    const offset = daysBetween(k.quarter, towerToday);
    if (offset === null) continue;
    if (Math.abs(offset) > ACTIVITY_WINDOW_DAYS) continue;
    items.push({
      date: k.quarter,
      dayOffset: offset,
      category: 'kpi_measurement',
      summary: `${k.kpiName} measured for ${k.initiativeDisplayId} (${k.initiativeName})`,
    });
  }

  return items.sort((a, b) => a.dayOffset - b.dayOffset);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assemble the Tower outcome-report payload. Pure: view-model in,
 * payload out. The renderers add no numbers of their own.
 */
export function buildTowerOutcomeReportPayload(
  input: TowerOutcomeReportInput,
): TowerOutcomeReportPayload {
  const initiativeRows = buildInitiativeRows(input.initiatives);
  const kpiRows = buildKpiRows(input.kpis);
  const vendorRows = buildVendorRows(input.vendors, input.towerToday);
  const activity90d = buildActivity90d(input.vendors, input.kpis, input.towerToday);

  const measuredInitiativeCount = input.initiatives.filter(
    (i) => i.measuredValueUsd !== null,
  ).length;
  const pressuredInitiativeCount = input.initiatives.filter((i) =>
    PRESSURE_FLAGS.has(i.statusFlag),
  ).length;

  const bandMetrics: ReadonlyArray<OutcomeBandMetricRow> =
    input.bandMetrics.metrics.map((m) => ({
      label: m.label,
      value: m.value,
      subtext: m.subtext,
      confidence: confidenceUpper(m.confidence),
      tooltip: m.tooltip,
    }));

  const isEmpty = input.initiatives.length === 0;

  return {
    tenantName: input.tenantName,
    tenantKey: input.tenantKey,
    generatedAt: input.generatedAt,
    towerToday: input.towerToday,
    isEmpty,
    summary: {
      initiativeCount: input.initiatives.length,
      vendorCount: input.vendors.length,
      kpiCount: input.kpis.length,
      measuredInitiativeCount,
      pressuredInitiativeCount,
    },
    bandMetrics,
    initiatives: initiativeRows,
    kpis: kpiRows,
    vendors: vendorRows,
    activity90d,
    emptyNotes: {
      initiatives: isEmpty
        ? 'No AI initiatives are tracked in the Control Tower for this tenant yet. ' +
          'Register initiatives in Setup → AI Initiatives; Tower will then track their ' +
          'stage, status, committed spend, and realized value here.'
        : null,
      kpis:
        kpiRows.length === 0
          ? 'No KPI measurements are recorded against this tenant’s tracked ' +
            'initiatives yet. The measurement model is empty until KPI quarters are ' +
            'loaded; no KPI figures are estimated in this report.'
          : null,
      vendors:
        vendorRows.length === 0
          ? 'No vendor contracts are recorded against this tenant’s tracked ' +
            'initiatives. The vendor portfolio section is intentionally empty.'
          : null,
      activity:
        activity90d.length === 0
          ? `No vendor renewals or KPI measurements fall within 90 days of ` +
            `${input.towerToday}. The 90-day activity window has no recorded events.`
          : null,
      measurement:
        measuredInitiativeCount === 0 && !isEmpty
          ? 'No tracked initiative carries a realized (measured) value yet. ' +
            'Realized-vs-forecast comparisons are reported as "not yet measured" ' +
            'rather than estimated.'
          : null,
    },
  };
}
