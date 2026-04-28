/**
 * W32D — Admin Connectors Readiness Tests
 *
 * Tests for src/lib/admin/connectors-readiness-view.ts
 * All tests are deterministic seed only.
 */

import {
  buildConnectorsReadinessView,
  getPilotBlockerConnectors,
  type ConnectorsReadinessView,
  type ConnectorStatus,
  type ConnectorKind,
} from '@/lib/admin/connectors-readiness-view';

// ===========================================================================
// Structure — basic contract
// ===========================================================================

describe('buildConnectorsReadinessView — structure', () => {
  it('deterministicSeed is true', () => {
    const view = buildConnectorsReadinessView('apex-retail');
    expect(view.deterministicSeed).toBe(true);
  });

  it('caveat is a non-empty string', () => {
    const view = buildConnectorsReadinessView('apex-retail');
    expect(typeof view.caveat).toBe('string');
    expect(view.caveat.length).toBeGreaterThan(10);
  });

  it('stewardSummary is a non-empty string', () => {
    const view = buildConnectorsReadinessView('apex-retail');
    expect(typeof view.stewardSummary).toBe('string');
    expect(view.stewardSummary.length).toBeGreaterThan(0);
  });

  it('totalCount equals connectors.length', () => {
    const view = buildConnectorsReadinessView('apex-retail');
    expect(view.totalCount).toBe(view.connectors.length);
  });

  it('configuredCount equals connectors with configured_stub status', () => {
    const view = buildConnectorsReadinessView('apex-retail');
    const stubs = view.connectors.filter((c) => c.status === 'configured_stub').length;
    expect(view.configuredCount).toBe(stubs);
  });
});

// ===========================================================================
// Apex Retail data contract
// ===========================================================================

describe('buildConnectorsReadinessView — apex-retail', () => {
  let view: ConnectorsReadinessView;

  beforeEach(() => {
    view = buildConnectorsReadinessView('apex-retail');
  });

  it('returns 6 connectors for apex-retail', () => {
    expect(view.connectors).toHaveLength(6);
  });

  it('ERP connector is not_configured', () => {
    const erp = view.connectors.find((c) => c.kind === 'erp');
    expect(erp?.status).toBe('not_configured');
  });

  it('spend analytics is deferred', () => {
    const spend = view.connectors.find((c) => c.kind === 'spend_analytics');
    expect(spend?.status).toBe('deferred');
  });

  it('contract management is configured_stub', () => {
    const cm = view.connectors.find((c) => c.kind === 'contract_management');
    expect(cm?.status).toBe('configured_stub');
  });

  it('identity connector is configured_stub', () => {
    const identity = view.connectors.find((c) => c.kind === 'identity');
    expect(identity?.status).toBe('configured_stub');
  });

  it('overallStatus is not production_ready', () => {
    expect(view.overallStatus).not.toBe('production_ready');
  });

  it('each connector has a non-empty stewardGuidance', () => {
    for (const c of view.connectors) {
      expect(c.stewardGuidance.length).toBeGreaterThan(0);
    }
  });

  it('each connector has deterministicSeed true', () => {
    for (const c of view.connectors) {
      expect(c.deterministicSeed).toBe(true);
    }
  });

  it('connectors with not_configured have non-null blockerReason', () => {
    const notConfigured = view.connectors.filter((c) => c.status === 'not_configured');
    for (const c of notConfigured) {
      expect(c.blockerReason).not.toBeNull();
    }
  });

  it('connectors with deferred have non-null deferredReason', () => {
    const deferred = view.connectors.filter((c) => c.status === 'deferred');
    for (const c of deferred) {
      expect(c.deferredReason).not.toBeNull();
    }
  });
});

// ===========================================================================
// Pilot blockers
// ===========================================================================

describe('getPilotBlockerConnectors — apex-retail', () => {
  it('returns pilot blockers for apex-retail', () => {
    const blockers = getPilotBlockerConnectors('apex-retail');
    expect(Array.isArray(blockers)).toBe(true);
  });

  it('pilot blockers are all required for pilot', () => {
    const blockers = getPilotBlockerConnectors('apex-retail');
    for (const b of blockers) {
      expect(b.requiredForPilot).toBe(true);
    }
  });

  it('pilot blockers are not configured_stub', () => {
    const blockers = getPilotBlockerConnectors('apex-retail');
    for (const b of blockers) {
      expect(b.status).not.toBe('configured_stub');
    }
  });

  it('pilotBlockers in view matches getPilotBlockerConnectors', () => {
    const view = buildConnectorsReadinessView('apex-retail');
    const direct = getPilotBlockerConnectors('apex-retail');
    expect(view.pilotBlockers.length).toBe(direct.length);
  });
});

// ===========================================================================
// Meridian
// ===========================================================================

describe('buildConnectorsReadinessView — meridian', () => {
  it('returns connectors for meridian', () => {
    const view = buildConnectorsReadinessView('meridian');
    expect(view.connectors.length).toBeGreaterThan(0);
  });

  it('deterministicSeed is true for meridian', () => {
    const view = buildConnectorsReadinessView('meridian');
    expect(view.deterministicSeed).toBe(true);
  });
});

// ===========================================================================
// Unknown tenant
// ===========================================================================

describe('buildConnectorsReadinessView — unknown tenant', () => {
  it('returns 0 connectors for unknown tenant', () => {
    const view = buildConnectorsReadinessView('unknown');
    expect(view.connectors).toHaveLength(0);
  });

  it('overallStatus is not_ready for unknown tenant', () => {
    const view = buildConnectorsReadinessView('unknown');
    expect(view.overallStatus).toBe('not_ready');
  });
});
