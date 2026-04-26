import {
  buildSourceControlTowerSignals,
  SourceSignalType,
  SourceSignalSeverity,
  SourceSignalStatus,
  SourceControlTowerSignalBundle,
} from '../../../lib/source/control-tower-signals';

const SIGNAL_TYPES: SourceSignalType[] = [
  'price_anomaly', 'scope_gap', 'evidence_deficit', 'negotiation_deadline',
  'vendor_withdrawal_risk', 'governance_gap', 'bafo_ready',
  'evaluation_stalled', 'commercial_trap_detected', 'contract_risk',
];

const SEVERITIES: SourceSignalSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
const STATUSES: SourceSignalStatus[] = ['active', 'acknowledged', 'resolved', 'suppressed'];

const allFlagsInput = {
  eventId: 'evt-signals-test',
  eventName: 'Signals Test Event',
  stage: 'bafo',
  vendorIds: ['vendor-a', 'vendor-b'],
  hasPricingAnomalies: true,
  hasScopeGap: true,
  hasEvidenceDeficit: true,
  hasGovernanceGap: true,
  isBafoReady: false,
  evaluationDaysStalled: 15,
};

const cleanInput = {
  eventId: 'evt-clean',
  eventName: 'Clean Event',
  stage: 'rfp',
  vendorIds: [],
  hasPricingAnomalies: false,
  hasScopeGap: false,
  hasEvidenceDeficit: false,
  hasGovernanceGap: false,
  isBafoReady: true,
  evaluationDaysStalled: 0,
};

describe('control-tower-signals - vocabulary', () => {
  it('defines exactly 10 signal types', () => {
    expect(SIGNAL_TYPES).toHaveLength(10);
  });

  it('includes price_anomaly and bafo_ready', () => {
    expect(SIGNAL_TYPES).toContain('price_anomaly');
    expect(SIGNAL_TYPES).toContain('bafo_ready');
  });
});

describe('control-tower-signals - buildSourceControlTowerSignals (all flags)', () => {
  let bundle: SourceControlTowerSignalBundle;

  beforeAll(() => {
    bundle = buildSourceControlTowerSignals(allFlagsInput);
  });

  it('returns correct eventId', () => {
    expect(bundle.eventId).toBe('evt-signals-test');
  });

  it('sets generatedAt to 2026-04-26', () => {
    expect(bundle.generatedAt).toBe('2026-04-26');
  });

  it('returns at least one signal when flags are set', () => {
    expect(bundle.signals.length).toBeGreaterThan(0);
  });

  it('every signal has a valid signalType', () => {
    for (const s of bundle.signals) {
      expect(SIGNAL_TYPES).toContain(s.signalType);
    }
  });

  it('every signal has a valid severity', () => {
    for (const s of bundle.signals) {
      expect(SEVERITIES).toContain(s.severity);
    }
  });

  it('every signal has a valid status', () => {
    for (const s of bundle.signals) {
      expect(STATUSES).toContain(s.status);
    }
  });

  it('every signal has non-empty title and narrative', () => {
    for (const s of bundle.signals) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.narrative.length).toBeGreaterThan(0);
    }
  });

  it('every signal has tags array', () => {
    for (const s of bundle.signals) {
      expect(Array.isArray(s.tags)).toBe(true);
    }
  });

  it('every signal has positive ttlDays', () => {
    for (const s of bundle.signals) {
      expect(s.ttlDays).toBeGreaterThan(0);
    }
  });

  it('totalCount equals signals array length', () => {
    expect(bundle.totalCount).toBe(bundle.signals.length);
  });

  it('requiresImmediateAttention is true when high signals exist', () => {
    expect(bundle.highCount).toBeGreaterThan(0);
    expect(bundle.requiresImmediateAttention).toBe(true);
  });

  it('emits evaluation_stalled signal when stalled > 7 days', () => {
    const types = bundle.signals.map((s) => s.signalType);
    expect(types).toContain('evaluation_stalled');
  });
});

describe('control-tower-signals - buildSourceControlTowerSignals (clean)', () => {
  it('emits bafo_ready signal when isBafoReady is true', () => {
    const bundle = buildSourceControlTowerSignals(cleanInput);
    const types = bundle.signals.map((s) => s.signalType);
    expect(types).toContain('bafo_ready');
  });

  it('requiresImmediateAttention is false when no anomalies', () => {
    const bundle = buildSourceControlTowerSignals(cleanInput);
    // Only info signal for bafo_ready
    expect(bundle.criticalCount).toBe(0);
    expect(bundle.highCount).toBe(0);
    expect(bundle.requiresImmediateAttention).toBe(false);
  });
});

describe('control-tower-signals - determinism', () => {
  it('two calls with same input return identical JSON', () => {
    const b1 = buildSourceControlTowerSignals(allFlagsInput);
    const b2 = buildSourceControlTowerSignals(allFlagsInput);
    expect(JSON.stringify(b1)).toBe(JSON.stringify(b2));
  });
});
