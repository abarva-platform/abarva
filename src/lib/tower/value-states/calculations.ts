import {
  VALUE_LAYER_DEFINITIONS,
  VALUE_STATE_LAYERS,
  type ValueEvidenceRef,
  type ValueLayerState,
  type ValueStateCell,
  type ValueStateLayer,
} from './types';

export interface TowerValueTelemetry {
  applicationCount: number;
  modernAppCount: number;
  legacyAppCount: number;
  annualRunCostUsd: number;
  aiFitAvg: number;
  engineeringFte: number;
  doraSampleCount: number;
  deployFreqPerWeekAvg: number;
  leadTimeHoursAvg: number;
  mttrHoursAvg: number;
  changeFailureRatePctAvg: number;
  reliabilityPctAvg: number;
  licensedSeats: number;
  activatedSeats: number;
  dau: number;
  mau: number;
  annualAiToolCostUsd: number;
  discoveryInstrumentCount: number;
  completedDiscoveryInstrumentCount: number;
  killCriteria: {
    total: number;
    pass: number;
    watch: number;
    fail: number;
    waived: number;
    notEvaluated: number;
  };
}

const HOURS_PER_FTE_YEAR = 1760;
const BLENDED_ENGINEERING_RATE_USD = 95;
const TARGET_ADOPTION_PCT = 72;
const TARGET_DORA_DELTA_PCT = 12;
const TARGET_REALLOCATION_PCT = 62;
const TARGET_PROCESS_CHANGES = 10;

function round(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return round((numerator / denominator) * 100, 1);
}

function evidence(
  id: string,
  label: string,
  source: string,
  confidence: ValueEvidenceRef['confidence'],
  href?: string,
): ValueEvidenceRef {
  return { id, label, source, confidence, href };
}

function cell(input: Omit<ValueStateCell, 'computedAt'> & { computedAt?: string | null }): ValueStateCell {
  return {
    ...input,
    computedAt: input.computedAt ?? null,
  };
}

function emptyVerified(layer: ValueStateLayer): ValueStateCell {
  const definition = VALUE_LAYER_DEFINITIONS[layer];
  return cell({
    kind: 'verified',
    value: null,
    unit: definition.format,
    label: 'Not attested',
    confidence: 'stub',
    basis: 'CFO attestation has not been recorded for this value layer.',
    evidence: [],
  });
}

export function buildProjectedAndTrackedCells(
  telemetry: TowerValueTelemetry,
  computedAt: string,
): Record<ValueStateLayer, { projected: ValueStateCell; tracked: ValueStateCell }> {
  const adoptionProjected = TARGET_ADOPTION_PCT;
  const adoptionTracked = telemetry.licensedSeats > 0
    ? pct(telemetry.activatedSeats, telemetry.licensedSeats)
    : pct(telemetry.mau, Math.max(telemetry.engineeringFte, 1));

  const aiFit = telemetry.aiFitAvg > 0 ? telemetry.aiFitAvg : 0.62;
  const cohortFte = Math.max(telemetry.engineeringFte, telemetry.activatedSeats, telemetry.mau, 1);
  const hoursSavedProjected = round(cohortFte * HOURS_PER_FTE_YEAR * aiFit * 0.11);
  const trackedUsageRatio = Math.max(telemetry.dau, telemetry.mau) > 0
    ? Math.max(telemetry.dau / Math.max(telemetry.mau, 1), telemetry.activatedSeats / Math.max(telemetry.licensedSeats, 1))
    : 0.35;
  const hoursSavedTracked = round(hoursSavedProjected * Math.min(Math.max(trackedUsageRatio, 0.2), 0.85));

  const hoursReallocatedProjected = round(hoursSavedProjected * (TARGET_REALLOCATION_PCT / 100));
  const completedInstrumentRatio = telemetry.discoveryInstrumentCount > 0
    ? telemetry.completedDiscoveryInstrumentCount / telemetry.discoveryInstrumentCount
    : 0.35;
  const hoursReallocatedTracked = round(hoursSavedTracked * Math.min(Math.max(completedInstrumentRatio, 0.25), 0.7));

  const licenseProjected = round(telemetry.annualAiToolCostUsd);
  const licenseTracked = round(telemetry.annualAiToolCostUsd * (telemetry.activatedSeats > 0 ? 1 : 0.75));

  const realizedProjected = Math.max(
    0,
    round(hoursReallocatedProjected * BLENDED_ENGINEERING_RATE_USD - licenseProjected),
  );
  const realizedTracked = Math.max(
    0,
    round(hoursReallocatedTracked * BLENDED_ENGINEERING_RATE_USD - licenseTracked),
  );

  const doraTracked = round(
    Math.max(0, TARGET_DORA_DELTA_PCT * 0.45)
      + Math.max(0, 99 - telemetry.reliabilityPctAvg) * 0.12
      + Math.max(0, 20 - telemetry.changeFailureRatePctAvg) * 0.08,
    1,
  );

  const processTracked = telemetry.completedDiscoveryInstrumentCount > 0
    ? Math.min(TARGET_PROCESS_CHANGES, Math.max(2, Math.ceil(telemetry.completedDiscoveryInstrumentCount / 2)))
    : 2;

  const killProjected = 'pass';
  const killTracked = telemetry.killCriteria.fail > 0
    ? 'fail'
    : telemetry.killCriteria.watch > 0
    ? 'watch'
    : telemetry.killCriteria.pass > 0
    ? 'pass'
    : 'not_evaluated';

  return {
    adoption: {
      projected: cell({
        kind: 'projected',
        value: adoptionProjected,
        unit: 'percent',
        label: `${adoptionProjected}% target adoption`,
        confidence: 'medium',
        basis: 'Template target calibrated against Apex engineering cohort and AI-fit mix.',
        computedAt,
        evidence: [
          evidence('template-adoption', 'IT-Productivity template adoption target', 'move_templates', 'medium'),
          evidence('tool-footprint-projection', `${telemetry.licensedSeats} licensed AI tool seats`, 'ai_tool_footprint', 'high'),
        ],
      }),
      tracked: cell({
        kind: 'tracked',
        value: adoptionTracked,
        unit: 'percent',
        label: `${adoptionTracked}% active-seat adoption`,
        confidence: 'stub',
        basis: 'Seed-stubbed telemetry from AI tool footprint activated seats and monthly active usage.',
        computedAt,
        evidence: [
          evidence('tool-footprint-tracked', `${telemetry.activatedSeats} activated seats / ${telemetry.licensedSeats} licensed`, 'ai_tool_footprint', 'stub'),
        ],
      }),
    },
    dora_delta: {
      projected: cell({
        kind: 'projected',
        value: TARGET_DORA_DELTA_PCT,
        unit: 'percent',
        label: `${TARGET_DORA_DELTA_PCT}% target DORA improvement`,
        confidence: 'medium',
        basis: 'Template target from Gate 2 baseline plus Wave 1 pilot kill criteria.',
        computedAt,
        evidence: [
          evidence('dora-template', 'DORA baseline kit and Wave 1 pilot target', 'move_template_gates', 'medium'),
        ],
      }),
      tracked: cell({
        kind: 'tracked',
        value: doraTracked,
        unit: 'percent',
        label: `${doraTracked}% seeded DORA movement`,
        confidence: 'stub',
        basis: 'Seed-stubbed DORA baseline rollup until production telemetry wiring lands.',
        computedAt,
        evidence: [
          evidence('dora-baseline', `${telemetry.doraSampleCount} DORA baseline rows`, 'dora_baselines', 'stub'),
        ],
      }),
    },
    hours_saved: {
      projected: cell({
        kind: 'projected',
        value: hoursSavedProjected,
        unit: 'hours',
        label: `${hoursSavedProjected.toLocaleString()} projected hours saved`,
        confidence: 'medium',
        basis: 'Engineering FTE × annual productive hours × AI-fit × conservative productivity lift.',
        computedAt,
        evidence: [
          evidence('roles-inventory', `${cohortFte.toLocaleString()} engineering FTE/seat cohort`, 'roles_inventory + ai_tool_footprint', 'medium'),
        ],
      }),
      tracked: cell({
        kind: 'tracked',
        value: hoursSavedTracked,
        unit: 'hours',
        label: `${hoursSavedTracked.toLocaleString()} tracked hours saved`,
        confidence: 'stub',
        basis: 'Seed-stubbed from active AI-tool usage intensity pending live telemetry.',
        computedAt,
        evidence: [
          evidence('tool-usage-hours', `${telemetry.dau} DAU / ${telemetry.mau} MAU`, 'ai_tool_footprint', 'stub'),
        ],
      }),
    },
    hours_reallocated: {
      projected: cell({
        kind: 'projected',
        value: hoursReallocatedProjected,
        unit: 'hours',
        label: `${hoursReallocatedProjected.toLocaleString()} projected reallocated hours`,
        confidence: 'medium',
        basis: 'Projected saved hours × named reallocation queue conversion target.',
        computedAt,
        evidence: [
          evidence('reallocation-template', 'Gate 6 business case reallocation queue target', 'move_template_gates', 'medium'),
        ],
      }),
      tracked: cell({
        kind: 'tracked',
        value: hoursReallocatedTracked,
        unit: 'hours',
        label: `${hoursReallocatedTracked.toLocaleString()} tracked reallocated hours`,
        confidence: 'stub',
        basis: 'Seed-stubbed from discovery completion as proxy for queue instrumentation readiness.',
        computedAt,
        evidence: [
          evidence('discovery-instruments', `${telemetry.completedDiscoveryInstrumentCount}/${telemetry.discoveryInstrumentCount} discovery instruments complete`, 'discovery_instruments', 'stub'),
        ],
      }),
    },
    license_dollars: {
      projected: cell({
        kind: 'projected',
        value: licenseProjected,
        unit: 'usd',
        label: `$${licenseProjected.toLocaleString()} projected annual license spend`,
        confidence: 'high',
        basis: 'Projected from Apex AI tool-footprint seed annual cost.',
        computedAt,
        evidence: [
          evidence('license-projection', 'AI SDLC tool annual cost seed', 'ai_tool_footprint', 'high'),
        ],
      }),
      tracked: cell({
        kind: 'tracked',
        value: licenseTracked,
        unit: 'usd',
        label: `$${licenseTracked.toLocaleString()} tracked annual license spend`,
        confidence: 'stub',
        basis: 'Seed-stubbed license spend from current activated tool footprint.',
        computedAt,
        evidence: [
          evidence('license-tracked', `${telemetry.activatedSeats} activated seats`, 'ai_tool_footprint', 'stub'),
        ],
      }),
    },
    realized_value_usd: {
      projected: cell({
        kind: 'projected',
        value: realizedProjected,
        unit: 'usd',
        label: `$${realizedProjected.toLocaleString()} projected realized value`,
        confidence: 'medium',
        basis: 'Reallocated hours × blended engineering rate minus AI-tool license spend.',
        computedAt,
        evidence: [
          evidence('realized-projection', 'Value math from template and Apex telemetry seed', 'value_states', 'medium'),
        ],
      }),
      tracked: cell({
        kind: 'tracked',
        value: realizedTracked,
        unit: 'usd',
        label: `$${realizedTracked.toLocaleString()} tracked realized value`,
        confidence: 'stub',
        basis: 'Seed-stubbed tracked value from usage and discovery readiness proxies.',
        computedAt,
        evidence: [
          evidence('realized-tracked', 'Tracked hours reallocated minus tracked license spend', 'value_states', 'stub'),
        ],
      }),
    },
    process_changes_shipped: {
      projected: cell({
        kind: 'projected',
        value: TARGET_PROCESS_CHANGES,
        unit: 'count',
        label: `${TARGET_PROCESS_CHANGES} process changes targeted`,
        confidence: 'medium',
        basis: 'Template requires ten process/workflow changes across Wave 0 through Operate.',
        computedAt,
        evidence: [
          evidence('process-template', 'Process redesign and operating-model template requirements', 'move_template_artifacts', 'medium'),
        ],
      }),
      tracked: cell({
        kind: 'tracked',
        value: processTracked,
        unit: 'count',
        label: `${processTracked} process changes tracked`,
        confidence: 'stub',
        basis: 'Seed-stubbed from discovery artifact completion until workflow telemetry lands.',
        computedAt,
        evidence: [
          evidence('process-tracked', `${telemetry.completedDiscoveryInstrumentCount} completed discovery instruments`, 'discovery_instruments', 'stub'),
        ],
      }),
    },
    kill_criteria_status: {
      projected: cell({
        kind: 'projected',
        value: killProjected,
        unit: 'status',
        label: 'Projected pass',
        confidence: 'medium',
        basis: 'Template business case assumes kill criteria clear Wave 1 thresholds.',
        computedAt,
        evidence: [
          evidence('kill-template', 'Gate kill criteria thresholds', 'move_template_gates', 'medium'),
        ],
      }),
      tracked: cell({
        kind: 'tracked',
        value: killTracked,
        unit: 'status',
        label: `Tracked ${String(killTracked).replace('_', ' ')}`,
        confidence: telemetry.killCriteria.total > 0 ? 'high' : 'stub',
        basis: telemetry.killCriteria.total > 0
          ? 'Current kill criteria rows determine the tracked posture.'
          : 'No kill-criteria rows yet; tracked posture remains seed-stubbed.',
        computedAt,
        evidence: [
          evidence('kill-tracked', `${telemetry.killCriteria.total} kill criteria rows`, 'kill_criteria', telemetry.killCriteria.total > 0 ? 'high' : 'stub'),
        ],
      }),
    },
  };
}

export function normalizeCell(
  value: unknown,
  fallback: ValueStateCell,
  kind: ValueStateCell['kind'],
): ValueStateCell {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const record = value as Partial<ValueStateCell>;
  return {
    ...fallback,
    ...record,
    kind,
    evidence: Array.isArray(record.evidence) ? record.evidence : fallback.evidence,
  };
}

function numeric(value: number | string | null): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function buildLayerState(input: {
  id: string | null;
  moveId: string;
  layer: ValueStateLayer;
  projected: ValueStateCell;
  tracked: ValueStateCell;
  verified?: ValueStateCell;
  updatedAt?: string | null;
}): ValueLayerState {
  const definition = VALUE_LAYER_DEFINITIONS[input.layer];
  const verified = input.verified ?? emptyVerified(input.layer);
  const projectedValue = numeric(input.projected.value);
  const trackedValue = numeric(input.tracked.value);
  const verifiedValue = numeric(verified.value);

  return {
    id: input.id,
    moveId: input.moveId,
    layer: input.layer,
    definition,
    projected: input.projected,
    tracked: input.tracked,
    verified,
    variance: {
      trackedVsProjected: projectedValue === null || trackedValue === null ? null : round(trackedValue - projectedValue, 1),
      verifiedVsProjected: projectedValue === null || verifiedValue === null ? null : round(verifiedValue - projectedValue, 1),
      unit: definition.format,
    },
    updatedAt: input.updatedAt ?? null,
  };
}

export function emptyLayerStates(moveId: string): ValueLayerState[] {
  return VALUE_STATE_LAYERS.map((layer) => {
    const definition = VALUE_LAYER_DEFINITIONS[layer];
    const projected = cell({
      kind: 'projected',
      value: null,
      unit: definition.format,
      label: 'Projection unavailable',
      confidence: 'stub',
      basis: 'Projection requires Apex template and client-data seed rows.',
      evidence: [],
    });
    const tracked = cell({
      kind: 'tracked',
      value: null,
      unit: definition.format,
      label: 'Tracked telemetry unavailable',
      confidence: 'stub',
      basis: 'Tracked telemetry is seed-stubbed until production wiring lands.',
      evidence: [],
    });
    return buildLayerState({ id: null, moveId, layer, projected, tracked });
  });
}

export function sumLayerUsd(layers: ValueLayerState[], kind: 'projected' | 'tracked' | 'verified'): number {
  return layers
    .filter((layer) => layer.definition.format === 'usd' && layer.layer === 'realized_value_usd')
    .reduce((sum, layer) => sum + (numeric(layer[kind].value) ?? 0), 0);
}

export function sumLayerHours(layers: ValueLayerState[], kind: 'projected' | 'tracked' | 'verified'): number {
  return layers
    .filter((layer) => layer.definition.format === 'hours' && layer.layer === 'hours_reallocated')
    .reduce((sum, layer) => sum + (numeric(layer[kind].value) ?? 0), 0);
}
