// Integration tests for SRC32: Tenant-Scoped Apex Retail AMS Scenario.
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

const OLD_GENERIC_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta'];

let scenario: SourceCommercialDemoScenario;

beforeAll(() => {
  scenario = buildSourceCommercialDemoScenario();
});

// ---------------------------------------------------------------------------
// 1. tenantSlug
// ---------------------------------------------------------------------------

test('scenario has tenantSlug "apex-retail"', () => {
  expect(scenario.tenantSlug).toBe('apex-retail');
});

// ---------------------------------------------------------------------------
// 2. linkedProgramCode
// ---------------------------------------------------------------------------

test('scenario has linkedProgramCode "APX-CDP-2026"', () => {
  expect(scenario.linkedProgramCode).toBe('APX-CDP-2026');
});

// ---------------------------------------------------------------------------
// 3. scenarioId
// ---------------------------------------------------------------------------

test('scenarioId is apex-retail-ams-outsourcing-2026', () => {
  expect(scenario.scenarioId).toBe('apex-retail-ams-outsourcing-2026');
});

// ---------------------------------------------------------------------------
// 4. deterministicSeed on scenario root
// ---------------------------------------------------------------------------

test('scenario root has deterministicSeed === true', () => {
  expect(scenario.deterministicSeed).toBe(true);
});

// ---------------------------------------------------------------------------
// 5. vendors count
// ---------------------------------------------------------------------------

test('vendors has exactly 4 items', () => {
  expect(scenario.vendors).toHaveLength(4);
});

// ---------------------------------------------------------------------------
// 6. All vendors have deterministicSeed === true
// ---------------------------------------------------------------------------

test('all vendors have deterministicSeed === true', () => {
  for (const vendor of scenario.vendors) {
    expect(vendor.deterministicSeed).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// 7. All vendors have the caveat field
// ---------------------------------------------------------------------------

test('all vendors have caveat: "Deterministic seed data. Not an actual vendor response."', () => {
  for (const vendor of scenario.vendors) {
    expect(vendor.caveat).toBe('Deterministic seed data. Not an actual vendor response.');
  }
});

// ---------------------------------------------------------------------------
// 8. No vendor name contains old generic names (Alpha, Beta, Gamma, Delta)
// ---------------------------------------------------------------------------

test('no vendor name contains "Alpha", "Beta", "Gamma", or "Delta"', () => {
  for (const vendor of scenario.vendors) {
    for (const oldName of OLD_GENERIC_NAMES) {
      expect(vendor.vendorLabel).not.toContain(oldName);
    }
  }
});

// ---------------------------------------------------------------------------
// 9. risks count
// ---------------------------------------------------------------------------

test('risks has exactly 5 items', () => {
  expect(scenario.risks).toHaveLength(5);
});

// ---------------------------------------------------------------------------
// 10. All risk severities are valid
// ---------------------------------------------------------------------------

test('all risk severities are valid (critical | high | medium | low)', () => {
  for (const risk of scenario.risks) {
    expect(VALID_RISK_SEVERITIES).toContain(risk.severity);
  }
});

// ---------------------------------------------------------------------------
// 11. signals count
// ---------------------------------------------------------------------------

test('signals has exactly 4 items', () => {
  expect(scenario.signals).toHaveLength(4);
});

// ---------------------------------------------------------------------------
// 12. missions count
// ---------------------------------------------------------------------------

test('missions has exactly 5 items', () => {
  expect(scenario.missions).toHaveLength(5);
});

// ---------------------------------------------------------------------------
// 13. All mission agentOwners are valid
// ---------------------------------------------------------------------------

test('all mission agentOwners are one of Nexus, Sentinel, Atlas, Steward', () => {
  for (const mission of scenario.missions) {
    expect(VALID_AGENT_OWNERS).toContain(mission.agentOwner);
  }
});

// ---------------------------------------------------------------------------
// 14. caveats count
// ---------------------------------------------------------------------------

test('caveats has exactly 3 items', () => {
  expect(scenario.caveats).toHaveLength(3);
});

// ---------------------------------------------------------------------------
// 15. generatedAt
// ---------------------------------------------------------------------------

test('generatedAt is 2026-04-26', () => {
  expect(scenario.generatedAt).toBe('2026-04-26');
});

// ---------------------------------------------------------------------------
// 16. sourceEventId matches scenarioId
// ---------------------------------------------------------------------------

test('sourceEventId matches scenarioId', () => {
  expect(scenario.sourceEventId).toBe(scenario.scenarioId);
});

// ---------------------------------------------------------------------------
// 17. No vendor has deterministicSeed === false
// ---------------------------------------------------------------------------

test('no vendor has deterministicSeed === false', () => {
  for (const vendor of scenario.vendors) {
    expect(vendor.deterministicSeed).not.toBe(false);
  }
});
