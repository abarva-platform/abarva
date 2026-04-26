// Integration tests for SRC25: Source Commercial Signals Preview view model.
// Type-shape tests only — no React rendering, no jsdom.

import {
  buildCommercialSignalsPreviewViewModel,
  SourceCommercialSignalsPreviewViewModel,
  SourceSignalPreviewItem,
  SourcePatternPreviewItem,
} from '../../../lib/source/source-commercial-signals-preview';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RFP_ID = 'rfp-test-001';
const VENDOR_LIST = ['vendor-alpha', 'vendor-beta', 'vendor-gamma'];
const EVENT_ID = 'evt-test-source-001';

let vm: SourceCommercialSignalsPreviewViewModel;

beforeAll(() => {
  vm = buildCommercialSignalsPreviewViewModel(RFP_ID, VENDOR_LIST, EVENT_ID);
});

// ---------------------------------------------------------------------------
// 1. topSignals length <= 3
// ---------------------------------------------------------------------------

test('topSignals has at most 3 items', () => {
  expect(vm.topSignals.length).toBeLessThanOrEqual(3);
});

// ---------------------------------------------------------------------------
// 2. topPatterns length <= 3
// ---------------------------------------------------------------------------

test('topPatterns has at most 3 items', () => {
  expect(vm.topPatterns.length).toBeLessThanOrEqual(3);
});

// ---------------------------------------------------------------------------
// 3. totalSignalCount >= topSignals.length
// ---------------------------------------------------------------------------

test('totalSignalCount is >= topSignals.length', () => {
  expect(vm.totalSignalCount).toBeGreaterThanOrEqual(vm.topSignals.length);
});

// ---------------------------------------------------------------------------
// 4. criticalSignalCount >= 0
// ---------------------------------------------------------------------------

test('criticalSignalCount is a non-negative integer', () => {
  expect(vm.criticalSignalCount).toBeGreaterThanOrEqual(0);
  expect(Number.isInteger(vm.criticalSignalCount)).toBe(true);
});

// ---------------------------------------------------------------------------
// 5. Each signal item has signalId, label, severity
// ---------------------------------------------------------------------------

test('each signal item has required fields: signalId, label, severity', () => {
  for (const signal of vm.topSignals) {
    expect(typeof signal.signalId).toBe('string');
    expect(signal.signalId.length).toBeGreaterThan(0);
    expect(typeof signal.label).toBe('string');
    expect(signal.label.length).toBeGreaterThan(0);
    expect(['critical', 'warning', 'info']).toContain(signal.severity);
  }
});

// ---------------------------------------------------------------------------
// 6. Each pattern item has patternId, category, confidence
// ---------------------------------------------------------------------------

test('each pattern item has required fields: patternId, category, confidence', () => {
  for (const pattern of vm.topPatterns) {
    expect(typeof pattern.patternId).toBe('string');
    expect(pattern.patternId.length).toBeGreaterThan(0);
    expect(typeof pattern.category).toBe('string');
    expect(pattern.category.length).toBeGreaterThan(0);
    expect(typeof pattern.confidence).toBe('number');
  }
});

// ---------------------------------------------------------------------------
// 7. confidence is between 0 and 1 for all pattern items
// ---------------------------------------------------------------------------

test('confidence is between 0 and 1 (inclusive) for all pattern items', () => {
  for (const pattern of vm.topPatterns) {
    expect(pattern.confidence).toBeGreaterThanOrEqual(0);
    expect(pattern.confidence).toBeLessThanOrEqual(1);
  }
});

// ---------------------------------------------------------------------------
// 8. generatedAt === '2026-04-26'
// ---------------------------------------------------------------------------

test('generatedAt is exactly "2026-04-26"', () => {
  expect(vm.generatedAt).toBe('2026-04-26');
});

// ---------------------------------------------------------------------------
// 9. Component exports SourceCommercialSignalsPreview as a function
// ---------------------------------------------------------------------------

test('SourceCommercialSignalsPreview is exported as a function from the component module', async () => {
  const mod = await import('../../../components/source/SourceCommercialSignalsPreview');
  expect(typeof mod.SourceCommercialSignalsPreview).toBe('function');
});
