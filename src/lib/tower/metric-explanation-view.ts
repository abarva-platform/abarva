import type { AIInitiative, AIInitiativeVendorRow } from '@/lib/admin/ai-initiatives/queries';
import type { AtlasCitation } from '@/lib/tower/atlas-citation-validator';
import type { BandConfidence, BandMetric, BandMetricKey, TowerBandMetricsView } from '@/lib/tower/band-metrics-view';
import type { MetricProvenanceKey } from '@/lib/tower/metric-provenance';

export interface MetricInput {
  initiativeId?: string;
  vendorId?: string;
  displayId: string;
  name: string;
  contribution: string;
  contributingValue?: number | string;
}

export interface MetricExclusion {
  displayId: string;
  name: string;
  reason: string;
}

export interface MetricContribution {
  displayId: string;
  name: string;
  pulling: 'up' | 'down' | 'neutral';
  by: string;
}

export interface MetricTrend {
  quarters: ReadonlyArray<{ quarter: string; value: number; confidence: 'HIGH' | 'MED' | 'LOW' }>;
  direction: 'improving' | 'declining' | 'flat' | 'volatile';
  note: string;
}

export interface MetricLever {
  action: string;
  estimatedImpact: string;
  owner: 'Sentinel' | 'Steward' | 'Nexus' | 'Source' | 'CFO' | 'Atlas';
  confidence: 'HIGH' | 'MED' | 'LOW';
}

export interface MetricExplanation {
  metricKey: MetricProvenanceKey;
  displayValue: string;
  displayConfidence: BandConfidence;
  headline: string;
  composition: {
    formula: string;
    inputs: ReadonlyArray<MetricInput>;
    excluded: ReadonlyArray<MetricExclusion>;
  };
  contributors: ReadonlyArray<MetricContribution>;
  trend: MetricTrend | null;
  levers: ReadonlyArray<MetricLever>;
  confidenceFloor: {
    level: 'HIGH' | 'MED' | 'LOW';
    reason: string;
    upgradePath?: string;
  };
  citations: ReadonlyArray<AtlasCitation>;
}

export interface MetricExplanationInput {
  tenant?: { name: string; clientId?: string | null };
  metricKey: MetricProvenanceKey;
  displayValue?: string;
  displayConfidence?: BandConfidence;
  todayIso: string;
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  bandMetrics?: TowerBandMetricsView | null;
}

const PRESSURE_FLAGS = new Set(['cost_overrun', 'value_lag', 'stalled', 'duplication_risk', 'adoption_gap']);
const RENEWALS_WINDOW_DAYS = 90;
const PORTFOLIO_TARGET_ROI = 3.5;

function formatUsd(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}K`;
  return `$${Math.round(usd)}`;
}

function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}

function daysUntil(targetIso: string | null, todayIso: string): number {
  if (!targetIso) return Number.POSITIVE_INFINITY;
  const target = Date.parse(targetIso);
  const today = Date.parse(todayIso);
  if (Number.isNaN(target) || Number.isNaN(today)) return Number.POSITIVE_INFINITY;
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}

function metricFromBand(input: MetricExplanationInput): BandMetric | null {
  return input.bandMetrics?.metrics.find((metric) => metric.key === input.metricKey) ?? null;
}

function displayValue(input: MetricExplanationInput): string {
  return input.displayValue ?? metricFromBand(input)?.value ?? '-';
}

function displayConfidence(input: MetricExplanationInput): BandConfidence {
  return input.displayConfidence ?? metricFromBand(input)?.confidence ?? 'none';
}

function weakestConfidence(rows: ReadonlyArray<{ confidenceLevel?: 'HIGH' | 'MED' | 'LOW' | null }>): 'HIGH' | 'MED' | 'LOW' {
  if (rows.length === 0) return 'LOW';
  if (rows.some((row) => row.confidenceLevel === 'LOW')) return 'LOW';
  if (rows.some((row) => row.confidenceLevel === 'MED')) return 'MED';
  return 'HIGH';
}

function initiativeCitation(initiative: AIInitiative, field: string, value: string | number): AtlasCitation {
  return {
    initiativeId: initiative.initiativeId,
    field: `ai_initiatives.${field}`,
    value,
  };
}

function vendorCitation(vendor: AIInitiativeVendorRow, field: string, value: string | number): AtlasCitation {
  return {
    vendorId: vendor.vendorId,
    initiativeId: vendor.initiativeId,
    field: `ai_initiative_vendors.${field}`,
    value,
  };
}

function towerCitation(metricKey: BandMetricKey, field: string, value: string | number): AtlasCitation {
  return {
    field: `tower_view.band_metrics.${metricKey}.${field}`,
    value,
  };
}

function sortByMagnitude<T>(rows: ReadonlyArray<T>, valueOf: (row: T) => number): T[] {
  return rows.slice().sort((a, b) => valueOf(b) - valueOf(a));
}

function fallbackExplanation(input: MetricExplanationInput): MetricExplanation {
  return {
    metricKey: input.metricKey,
    displayValue: displayValue(input),
    displayConfidence: displayConfidence(input),
    headline: 'Atlas needs loaded initiatives before it can explain this metric beyond the static provenance panel.',
    composition: {
      formula: 'No substrate rows loaded',
      inputs: [],
      excluded: [],
    },
    contributors: [],
    trend: null,
    levers: [
      {
        action: 'Load the AI Initiatives substrate for this tenant',
        estimatedImpact: 'Enables composition, exclusions, contributors, and confidence floor',
        owner: 'Steward',
        confidence: 'HIGH',
      },
    ],
    confidenceFloor: {
      level: 'LOW',
      reason: 'No initiative or vendor rows were available to explain the metric.',
      upgradePath: 'Run the Apex substrate load and refresh Tower.',
    },
    citations: [towerCitation(input.metricKey, 'display_value', displayValue(input))],
  };
}

function explainPortfolioRoi(input: MetricExplanationInput): MetricExplanation {
  const rows = input.initiatives.filter((initiative) => (initiative.committedAnnualUsd ?? 0) > 0);
  const totalCommitted = rows.reduce((sum, initiative) => sum + (initiative.committedAnnualUsd ?? 0), 0);
  const totalMeasured = rows.reduce((sum, initiative) => sum + Math.max(initiative.measuredValueUsd ?? 0, 0), 0);
  const ratio = totalCommitted > 0 ? totalMeasured / totalCommitted : 0;
  const dilutive = rows.filter((initiative) => (initiative.measuredValueUsd ?? 0) < (initiative.committedAnnualUsd ?? 0));
  const missing = input.initiatives.filter((initiative) => (initiative.committedAnnualUsd ?? 0) <= 0);

  return {
    metricKey: 'portfolio_roi',
    displayValue: displayValue(input),
    displayConfidence: displayConfidence(input),
    headline: `Portfolio ROI is ${ratio.toFixed(1)}x because ${formatUsd(totalMeasured)} measured value divides ${formatUsd(totalCommitted)} committed annual spend across ${rows.length} initiatives.`,
    composition: {
      formula: 'sum(measured_value_usd) / sum(committed_annual_usd)',
      inputs: rows.map((initiative) => ({
        initiativeId: initiative.initiativeId,
        displayId: initiative.displayId,
        name: initiative.name,
        contribution: `${formatUsd(initiative.measuredValueUsd ?? 0)} measured over ${formatUsd(initiative.committedAnnualUsd ?? 0)} committed`,
        contributingValue: initiative.measuredValueUsd ?? 0,
      })),
      excluded: missing.map((initiative) => ({
        displayId: initiative.displayId,
        name: initiative.name,
        reason: 'committed_annual_usd is missing or zero',
      })),
    },
    contributors: sortByMagnitude(rows, (initiative) => initiative.measuredValueUsd ?? 0).slice(0, 3).map((initiative) => {
      const initiativeRatio = (initiative.committedAnnualUsd ?? 0) > 0
        ? (initiative.measuredValueUsd ?? 0) / (initiative.committedAnnualUsd ?? 1)
        : 0;
      return {
        displayId: initiative.displayId,
        name: initiative.name,
        pulling: initiativeRatio >= ratio ? 'up' : 'down',
        by: `${initiativeRatio.toFixed(1)}x row ROI`,
      };
    }),
    trend: null,
    levers: [
      ...sortByMagnitude(dilutive, (initiative) => (initiative.committedAnnualUsd ?? 0) - (initiative.measuredValueUsd ?? 0)).slice(0, 2).map((initiative): MetricLever => ({
        action: `Resolve value lag on ${initiative.displayId}`,
        estimatedImpact: `Reaching committed value would add about ${formatUsd(Math.max((initiative.committedAnnualUsd ?? 0) - (initiative.measuredValueUsd ?? 0), 0))} measured value`,
        owner: 'CFO',
        confidence: initiative.confidenceLevel,
      })),
      {
        action: 'Re-baseline strategic bets that are intentionally pre-value',
        estimatedImpact: `Separates target pursuit from the ${PORTFOLIO_TARGET_ROI.toFixed(1)}x operating ROI metric`,
        owner: 'Nexus',
        confidence: 'MED',
      } satisfies MetricLever,
    ].slice(0, 3),
    confidenceFloor: {
      level: weakestConfidence(rows),
      reason: `${rows.length} committed rows drive the calculation; weakest initiative confidence sets the floor.`,
      upgradePath: 'Load measured value and confidence evidence for every committed initiative.',
    },
    citations: [
      towerCitation('portfolio_roi', 'total_measured_usd', totalMeasured),
      towerCitation('portfolio_roi', 'total_committed_annual_usd', totalCommitted),
      ...rows.flatMap((initiative) => [
        initiativeCitation(initiative, 'display_id', initiative.displayId),
        initiativeCitation(initiative, 'measured_value_usd', initiative.measuredValueUsd ?? 0),
        initiativeCitation(initiative, 'committed_annual_usd', initiative.committedAnnualUsd ?? 0),
        initiativeCitation(initiative, 'confidence_level', initiative.confidenceLevel),
      ]),
    ],
  };
}

function explainActivePressures(input: MetricExplanationInput): MetricExplanation {
  const pressuring = input.initiatives.filter((initiative) => PRESSURE_FLAGS.has(initiative.statusFlag));
  const excluded = input.initiatives.filter((initiative) => !PRESSURE_FLAGS.has(initiative.statusFlag));
  const high = pressuring.filter((initiative) => initiative.confidenceLevel === 'HIGH').length;
  const watch = pressuring.length - high;

  return {
    metricKey: 'active_pressures',
    displayValue: displayValue(input),
    displayConfidence: displayConfidence(input),
    headline: `${pressuring.length} active pressures: ${high} high-confidence rows and ${watch} watch rows in pressure-bearing status flags.`,
    composition: {
      formula: 'count(initiative) where status_flag is pressure-bearing',
      inputs: pressuring.map((initiative) => ({
        initiativeId: initiative.initiativeId,
        displayId: initiative.displayId,
        name: initiative.name,
        contribution: `${initiative.statusFlag} counts as active pressure`,
        contributingValue: initiative.statusFlag,
      })),
      excluded: excluded.map((initiative) => ({
        displayId: initiative.displayId,
        name: initiative.name,
        reason: `${initiative.statusFlag} is not pressure-bearing`,
      })),
    },
    contributors: pressuring.map((initiative) => ({
      displayId: initiative.displayId,
      name: initiative.name,
      pulling: 'down',
      by: initiative.statusFlag.replace(/_/g, ' '),
    })),
    trend: null,
    levers: pressuring.slice(0, 3).map((initiative) => ({
      action: `Resolve ${initiative.displayId} from ${initiative.statusFlag.replace(/_/g, ' ')}`,
      estimatedImpact: 'Drops the active-pressure count by 1 when the status flag exits pressure',
      owner: 'CFO',
      confidence: initiative.confidenceLevel,
    })),
    confidenceFloor: {
      level: weakestConfidence(pressuring),
      reason: 'The count is deterministic; per-pressure confidence sets the floor for explanation quality.',
      upgradePath: 'Raise low-confidence pressure rows with owner-confirmed status evidence.',
    },
    citations: [
      towerCitation('active_pressures', 'pressure_count', pressuring.length),
      ...pressuring.flatMap((initiative) => [
        initiativeCitation(initiative, 'display_id', initiative.displayId),
        initiativeCitation(initiative, 'status_flag', initiative.statusFlag),
        initiativeCitation(initiative, 'confidence_level', initiative.confidenceLevel),
      ]),
    ],
  };
}

function explainSpendAtRisk(input: MetricExplanationInput): MetricExplanation {
  const pressuring = input.initiatives.filter((initiative) => PRESSURE_FLAGS.has(initiative.statusFlag));
  const totalAtRisk = pressuring.reduce((sum, initiative) => sum + (initiative.committedAnnualUsd ?? 0), 0);
  const sorted = sortByMagnitude(pressuring, (initiative) => initiative.committedAnnualUsd ?? 0);

  return {
    metricKey: 'spend_at_risk',
    displayValue: displayValue(input),
    displayConfidence: displayConfidence(input),
    headline: `${formatUsd(totalAtRisk)} spend at risk is the committed annual spend attached to ${pressuring.length} pressure-bearing initiatives.`,
    composition: {
      formula: 'sum(committed_annual_usd) where status_flag is pressure-bearing',
      inputs: sorted.map((initiative) => ({
        initiativeId: initiative.initiativeId,
        displayId: initiative.displayId,
        name: initiative.name,
        contribution: `${formatUsd(initiative.committedAnnualUsd ?? 0)} committed annual in ${initiative.statusFlag}`,
        contributingValue: initiative.committedAnnualUsd ?? 0,
      })),
      excluded: input.initiatives.filter((initiative) => !PRESSURE_FLAGS.has(initiative.statusFlag)).map((initiative) => ({
        displayId: initiative.displayId,
        name: initiative.name,
        reason: `${initiative.statusFlag} is not included in spend at risk`,
      })),
    },
    contributors: sorted.slice(0, 3).map((initiative) => ({
      displayId: initiative.displayId,
      name: initiative.name,
      pulling: 'down',
      by: formatUsd(initiative.committedAnnualUsd ?? 0),
    })),
    trend: null,
    levers: sorted.slice(0, 3).map((initiative) => ({
      action: `Clear the pressure posture on ${initiative.displayId}`,
      estimatedImpact: `Would remove ${formatUsd(initiative.committedAnnualUsd ?? 0)} from spend at risk`,
      owner: 'CFO',
      confidence: initiative.confidenceLevel,
    })),
    confidenceFloor: {
      level: weakestConfidence(pressuring),
      reason: 'The sum inherits the weakest confidence among included pressure rows.',
      upgradePath: 'Confirm committed annual spend and status flags for every pressure row.',
    },
    citations: [
      towerCitation('spend_at_risk', 'total_at_risk_usd', totalAtRisk),
      ...pressuring.flatMap((initiative) => [
        initiativeCitation(initiative, 'display_id', initiative.displayId),
        initiativeCitation(initiative, 'committed_annual_usd', initiative.committedAnnualUsd ?? 0),
        initiativeCitation(initiative, 'status_flag', initiative.statusFlag),
        initiativeCitation(initiative, 'confidence_level', initiative.confidenceLevel),
      ]),
    ],
  };
}

function explainRenewals(input: MetricExplanationInput): MetricExplanation {
  const inWindow = input.vendors.filter((vendor) => {
    const days = daysUntil(vendor.renewalDate, input.todayIso);
    return days >= 0 && days <= RENEWALS_WINDOW_DAYS;
  });
  const outside = input.vendors.filter((vendor) => !inWindow.includes(vendor));
  const sorted = inWindow.slice().sort((a, b) => daysUntil(a.renewalDate, input.todayIso) - daysUntil(b.renewalDate, input.todayIso));
  const totalContractValue = inWindow.reduce((sum, vendor) => sum + (vendor.contractValueUsd ?? 0), 0);
  const nextOutside = outside
    .filter((vendor) => daysUntil(vendor.renewalDate, input.todayIso) > RENEWALS_WINDOW_DAYS)
    .sort((a, b) => daysUntil(a.renewalDate, input.todayIso) - daysUntil(b.renewalDate, input.todayIso))[0];

  return {
    metricKey: 'renewals_90d',
    displayValue: displayValue(input),
    displayConfidence: displayConfidence(input),
    headline: `${inWindow.length} vendor renewals fall within 90 days of ${input.todayIso}; loaded in-window contract value is ${formatUsd(totalContractValue)}.`,
    composition: {
      formula: 'count(vendor) where renewal_date is today through today + 90 days',
      inputs: sorted.map((vendor) => ({
        vendorId: vendor.vendorId,
        initiativeId: vendor.initiativeId,
        displayId: vendor.initiativeDisplayId,
        name: vendor.vendorName,
        contribution: `${vendor.renewalDate ?? 'no renewal date'} is ${daysUntil(vendor.renewalDate, input.todayIso)} days out`,
        contributingValue: vendor.renewalDate ?? 'missing',
      })),
      excluded: outside.map((vendor) => ({
        displayId: vendor.initiativeDisplayId,
        name: vendor.vendorName,
        reason: vendor.renewalDate
          ? `${daysUntil(vendor.renewalDate, input.todayIso)} days out, outside 90-day window`
          : 'renewal_date missing',
      })),
    },
    contributors: sorted.slice(0, 3).map((vendor) => ({
      displayId: vendor.initiativeDisplayId,
      name: vendor.vendorName,
      pulling: 'neutral',
      by: `${daysUntil(vendor.renewalDate, input.todayIso)}d`,
    })),
    trend: null,
    levers: [
      ...(sorted[0]
        ? [{
          action: `Open renewal brief for ${sorted[0].vendorName}`,
          estimatedImpact: `Moves the nearest ${daysUntil(sorted[0].renewalDate, input.todayIso)}d renewal into Source negotiation posture`,
          owner: 'Source' as const,
          confidence: 'HIGH' as const,
        }]
        : []),
      ...(nextOutside
        ? [{
          action: `Stage a look-ahead on ${nextOutside.vendorName}`,
          estimatedImpact: `Next loaded renewal is ${daysUntil(nextOutside.renewalDate, input.todayIso)}d out`,
          owner: 'Source' as const,
          confidence: 'MED' as const,
        }]
        : []),
    ],
    confidenceFloor: {
      level: input.vendors.some((vendor) => !vendor.renewalDate) ? 'MED' : 'HIGH',
      reason: 'Renewal math is calendrical; missing renewal dates are the only confidence drag.',
      upgradePath: 'Load renewal_date for every vendor row.',
    },
    citations: [
      towerCitation('renewals_90d', 'today_iso', input.todayIso),
      towerCitation('renewals_90d', 'window_days', RENEWALS_WINDOW_DAYS),
      towerCitation('renewals_90d', 'renewal_count', inWindow.length),
      ...input.vendors.flatMap((vendor) => [
        vendorCitation(vendor, 'vendor_name', vendor.vendorName),
        vendorCitation(vendor, 'renewal_date', vendor.renewalDate ?? 'missing'),
        vendorCitation(vendor, 'contract_value_usd', vendor.contractValueUsd ?? 0),
      ]),
    ],
  };
}

function explainAdoption(input: MetricExplanationInput): MetricExplanation {
  const eligible = input.initiatives.filter(
    (initiative) => initiative.statusFlag !== 'foundation_phase' && initiative.stage !== 'multi_year_strategic_bet',
  );
  const scaled = eligible.filter((initiative) => initiative.stage === 'scaled');
  const excluded = input.initiatives.filter((initiative) => !eligible.includes(initiative));
  const pct = eligible.length > 0 ? (scaled.length * 100) / eligible.length : 0;
  const pilot = eligible.filter((initiative) => initiative.stage === 'pilot');

  return {
    metricKey: 'adoption_rate',
    displayValue: displayValue(input),
    displayConfidence: displayConfidence(input),
    headline: `Adoption reads ${formatPct(pct)} because ${scaled.length} of ${eligible.length} eligible initiatives are in scaled stage. Confidence is LOW because stage is only a proxy for actual user adoption.`,
    composition: {
      formula: "count(stage = 'scaled') / count(non-foundation initiatives)",
      inputs: eligible.map((initiative) => ({
        initiativeId: initiative.initiativeId,
        displayId: initiative.displayId,
        name: initiative.name,
        contribution: initiative.stage === 'scaled' ? 'scaled stage counts toward numerator' : `${initiative.stage} stage stays in denominator only`,
        contributingValue: initiative.stage,
      })),
      excluded: excluded.map((initiative) => ({
        displayId: initiative.displayId,
        name: initiative.name,
        reason: initiative.statusFlag === 'foundation_phase'
          ? 'foundation_phase excluded from denominator'
          : `${initiative.stage} excluded from denominator`,
      })),
    },
    contributors: [
      ...scaled.map((initiative) => ({
        displayId: initiative.displayId,
        name: initiative.name,
        pulling: 'up' as const,
        by: 'counts in numerator',
      })),
      ...eligible.filter((initiative) => initiative.stage !== 'scaled').map((initiative) => ({
        displayId: initiative.displayId,
        name: initiative.name,
        pulling: 'down' as const,
        by: `${initiative.stage} denominator-only`,
      })),
    ],
    trend: null,
    levers: [
      ...pilot.slice(0, 2).map((initiative) => ({
        action: `Scale ${initiative.displayId} from pilot to scaled`,
        estimatedImpact: eligible.length > 0 ? `Would raise proxy adoption to about ${formatPct(((scaled.length + 1) * 100) / eligible.length)}` : 'Would create the first eligible adoption numerator',
        owner: 'Steward' as const,
        confidence: initiative.confidenceLevel,
      })),
      {
        action: 'Connect identity plus per-tool MAU integrations',
        estimatedImpact: 'Replaces stage proxy with actual active-user adoption',
        owner: 'Steward',
        confidence: 'HIGH',
      },
    ],
    confidenceFloor: {
      level: 'LOW',
      reason: 'The value is correct as a stage proxy, but stage is not the same as measured active usage.',
      upgradePath: 'Load Okta or EntraID identity resolution plus per-tool MAU and licensed-user feeds.',
    },
    citations: [
      towerCitation('adoption_rate', 'scaled_count', scaled.length),
      towerCitation('adoption_rate', 'eligible_count', eligible.length),
      towerCitation('adoption_rate', 'adoption_pct', Math.round(pct)),
      ...input.initiatives.flatMap((initiative) => [
        initiativeCitation(initiative, 'display_id', initiative.displayId),
        initiativeCitation(initiative, 'stage', initiative.stage),
        initiativeCitation(initiative, 'status_flag', initiative.statusFlag),
        initiativeCitation(initiative, 'confidence_level', initiative.confidenceLevel),
      ]),
    ],
  };
}

export function buildMetricExplanation(input: MetricExplanationInput): MetricExplanation {
  if (input.initiatives.length === 0 && input.vendors.length === 0) return fallbackExplanation(input);
  if (input.metricKey === 'portfolio_roi') return explainPortfolioRoi(input);
  if (input.metricKey === 'active_pressures') return explainActivePressures(input);
  if (input.metricKey === 'spend_at_risk') return explainSpendAtRisk(input);
  if (input.metricKey === 'renewals_90d') return explainRenewals(input);
  return explainAdoption(input);
}

export function renderMetricExplanationForAtlas(explanation: MetricExplanation): string {
  const inputLines = explanation.composition.inputs
    .slice(0, 5)
    .map((item) => `- ${item.displayId} ${item.name}: ${item.contribution}`);
  const excludedLines = explanation.composition.excluded
    .slice(0, 4)
    .map((item) => `- ${item.displayId} ${item.name}: ${item.reason}`);
  const contributorLines = explanation.contributors
    .slice(0, 4)
    .map((item) => `- ${item.displayId} ${item.name}: ${item.pulling}, ${item.by}`);
  const leverLines = explanation.levers
    .slice(0, 4)
    .map((lever) => `- ${lever.action}: ${lever.estimatedImpact} (${lever.owner}, ${lever.confidence})`);

  return [
    explanation.headline,
    '',
    `Formula: ${explanation.composition.formula}.`,
    '',
    'Inputs:',
    ...(inputLines.length > 0 ? inputLines : ['- No included rows.']),
    '',
    'Excluded:',
    ...(excludedLines.length > 0 ? excludedLines : ['- None.']),
    '',
    'Top pulls:',
    ...(contributorLines.length > 0 ? contributorLines : ['- No contributors.']),
    '',
    'What would move it:',
    ...(leverLines.length > 0 ? leverLines : ['- No deterministic lever available from current substrate.']),
    '',
    `Confidence floor: ${explanation.confidenceFloor.level} - ${explanation.confidenceFloor.reason}`,
    explanation.confidenceFloor.upgradePath ? `Upgrade path: ${explanation.confidenceFloor.upgradePath}` : '',
  ].filter(Boolean).join('\n');
}
