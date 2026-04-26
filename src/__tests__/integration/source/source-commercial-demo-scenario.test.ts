// Integration tests for SRC28: Source Commercial Demo Scenario Seed.
// Type-shape tests only — no React rendering, no jsdom.

import {
  buildSourceCommercialDemoScenario,
  SourceCommercialDemoScenario,
  DemoRiskSeverity,
} from '../../../lib/source/source-commercial-demo-scenario';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_RISK_SEVERITIES: DemoRiskSeverity[] = [
  'critical',
  'high',
  'medium',
  'low',
];

const VALID_AGENT_OWNERS = ['Nexus', 'Sentinel', 'Atlas', 'Steward'];

let scenario: SourceCommercialDemoScenario;

beforeAll(() => {
  scenario = buildSourceCommercialDemoScenario();
});

// ---------------------------------------------------------------------------
// 1. scenarioId
// ---------------------------------------------------------------------------

test('scenarioId is ams-outsourcing-demo-2026', () => {
  expect(scenario.scenarioId).toBe('ams-outsourcing-demo-2026');
});

// ---------------------------------------------------------------------------
// 2. vendors count
// ---------------------------------------------------------------------------

test('vendors has exactly 4 items', () => {
  expect(scenario.vendors).toHaveLength(4);
});

// ---------------------------------------------------------------------------
// 3. All vendors have deterministicSeed === true
// ---------------------------------------------------------------------------

test('all vendors have deterministicSeed === true', () => {
  for (const vendor of scenario.vendors) {
    expect(vendor.deterministicSeed).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// 4. risks count
// ---------------------------------------------------------------------------

test('risks has exactly 5 items', () => {
  expect(scenario.risks).toHaveLength(5);
});

// ---------------------------------------------------------------------------
// 5. All risk severities are valid
// ---------------------------------------------------------------------------

test('all risk severities are valid (critical | high | medium | low)', () => {
  for (const risk of scenario.risks) {
    expect(VALID_RISK_SEVERITIES).toContain(risk.severity);
  }
});

// ---------------------------------------------------------------------------
// 6. missions count
// ---------------------------------------------------------------------------

test('missions has exactly 5 items', () => {
  expect(scenario.missions).toHaveLength(5);
});

// ---------------------------------------------------------------------------
// 7. All mission agentOwners are valid
// ---------------------------------------------------------------------------

test('all mission agentOwners are one of Nexus, Sentinel, Atlas, Steward', () => {
  for (const mission of scenario.missions) {
    expect(VALID_AGENT_OWNERS).toContain(mission.agentOwner);
  }
});

// ---------------------------------------------------------------------------
// 8. signals count
// ---------------------------------------------------------------------------

test('signals has exactly 4 items', () => {
  expect(scenario.signals).toHaveLength(4);
});

// ---------------------------------------------------------------------------
// 9. caveats count
// ---------------------------------------------------------------------------

test('caveats has exactly 3 items', () => {
  expect(scenario.caveats).toHaveLength(3);
});

// ---------------------------------------------------------------------------
// 10. generatedAt
// ---------------------------------------------------------------------------

test('generatedAt is 2026-04-26', () => {
  expect(scenario.generatedAt).toBe('2026-04-26');
});

// ---------------------------------------------------------------------------
// 11. No vendor label contains a real company name
// ---------------------------------------------------------------------------

test('all vendor labels start with "Vendor "', () => {
  for (const vendor of scenario.vendors) {
    expect(vendor.vendorLabel).toMatch(/^Vendor /);
  }
});

// ---------------------------------------------------------------------------
// 12. No vendor has deterministicSeed === false
// ---------------------------------------------------------------------------

test('no vendor has deterministicSeed === false', () => {
  for (const vendor of scenario.vendors) {
    expect(vendor.deterministicSeed).not.toBe(false);
  }
});
