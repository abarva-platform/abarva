import {
  buildLayerState,
  buildProjectedAndTrackedCells,
  sumLayerHours,
  sumLayerUsd,
  type TowerValueTelemetry,
} from '../calculations';
import { VALUE_STATE_LAYERS } from '../types';

const telemetry: TowerValueTelemetry = {
  applicationCount: 100,
  modernAppCount: 70,
  legacyAppCount: 30,
  annualRunCostUsd: 40_000_000,
  aiFitAvg: 0.64,
  engineeringFte: 200,
  doraSampleCount: 72,
  deployFreqPerWeekAvg: 3.2,
  leadTimeHoursAvg: 42,
  mttrHoursAvg: 8,
  changeFailureRatePctAvg: 12,
  reliabilityPctAvg: 97,
  licensedSeats: 600,
  activatedSeats: 420,
  dau: 210,
  mau: 360,
  annualAiToolCostUsd: 102_000,
  discoveryInstrumentCount: 12,
  completedDiscoveryInstrumentCount: 6,
  killCriteria: {
    total: 2,
    pass: 1,
    watch: 1,
    fail: 0,
    waived: 0,
    notEvaluated: 0,
  },
};

describe('Tower value-state calculations', () => {
  it('builds all 8 projected and tracked value layers', () => {
    const cells = buildProjectedAndTrackedCells(telemetry, '2026-05-23T16:00:00.000Z');

    expect(Object.keys(cells).sort()).toEqual([...VALUE_STATE_LAYERS].sort());
    expect(cells.adoption.projected.value).toBe(72);
    expect(cells.adoption.tracked.value).toBe(70);
    expect(cells.realized_value_usd.projected.value).toBeGreaterThan(0);
    expect(cells.kill_criteria_status.tracked.value).toBe('watch');
  });

  it('computes tracked and verified variance without mutating cells', () => {
    const cells = buildProjectedAndTrackedCells(telemetry, '2026-05-23T16:00:00.000Z');
    const state = buildLayerState({
      id: 'value-row',
      moveId: 'move-1',
      layer: 'realized_value_usd',
      projected: cells.realized_value_usd.projected,
      tracked: cells.realized_value_usd.tracked,
      verified: {
        ...cells.realized_value_usd.tracked,
        kind: 'verified',
        value: 12345,
      },
    });

    expect(state.variance.trackedVsProjected).toBeLessThan(0);
    expect(state.variance.verifiedVsProjected).toBeLessThan(0);
    expect(cells.realized_value_usd.tracked.kind).toBe('tracked');
  });

  it('rolls up realized dollars and reallocated hours from layer states', () => {
    const cells = buildProjectedAndTrackedCells(telemetry, '2026-05-23T16:00:00.000Z');
    const layers = VALUE_STATE_LAYERS.map((layer) => buildLayerState({
      id: `row-${layer}`,
      moveId: 'move-1',
      layer,
      projected: cells[layer].projected,
      tracked: cells[layer].tracked,
    }));

    expect(sumLayerUsd(layers, 'projected')).toBe(cells.realized_value_usd.projected.value);
    expect(sumLayerHours(layers, 'projected')).toBe(cells.hours_reallocated.projected.value);
  });
});
