/**
 * ADM6 — connector-health-read-model integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - buildConnectorHealthSummary() shape and counts
 *   - getConnectorHealthSnapshot() for all 5 seed connectors + nonexistent
 *   - getHealthStatusLabel() for all 4 statuses
 *   - describeHealthSummary() prose format
 *   - Module hygiene (no runtime non-determinism, no forbidden imports)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildConnectorHealthSummary,
  getConnectorHealthSnapshot,
  getHealthStatusLabel,
  describeHealthSummary,
  type ConnectorHealthSummary,
  type ConnectorHealthSnapshot,
  type ConnectorHealthStatus,
} from '@/lib/admin/connector-health-read-model';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/admin/connector-health-read-model.ts';

function readSource(): string {
  return readFileSync(resolve(root, SOURCE_PATH), 'utf8');
}

// ---------------------------------------------------------------------------
// buildConnectorHealthSummary shape
// ---------------------------------------------------------------------------

describe('ADM6 — buildConnectorHealthSummary shape', () => {
  let summary: ConnectorHealthSummary;

  beforeAll(() => {
    summary = buildConnectorHealthSummary();
  });

  it('totalCount is 5', () => {
    expect(summary.totalCount).toBe(5);
  });

  it('healthyCount is 2', () => {
    expect(summary.healthyCount).toBe(2);
  });

  it('degradedCount is 1', () => {
    expect(summary.degradedCount).toBe(1);
  });

  it('unreachableCount is 1', () => {
    expect(summary.unreachableCount).toBe(1);
  });

  it('notConfiguredCount is 1', () => {
    expect(summary.notConfiguredCount).toBe(1);
  });

  it('counts sum to totalCount', () => {
    expect(
      summary.healthyCount +
        summary.degradedCount +
        summary.unreachableCount +
        summary.notConfiguredCount,
    ).toBe(summary.totalCount);
  });

  it('snapshots array length equals totalCount', () => {
    expect(summary.snapshots.length).toBe(summary.totalCount);
  });

  it('deterministicSeed is true', () => {
    expect(summary.deterministicSeed).toBe(true);
  });

  it('every snapshot in the summary has deterministicSeed: true', () => {
    for (const snap of summary.snapshots) {
      expect(snap.deterministicSeed).toBe(true);
    }
  });

  it('every snapshot has a non-empty connectorId', () => {
    for (const snap of summary.snapshots) {
      expect(typeof snap.connectorId).toBe('string');
      expect(snap.connectorId.length).toBeGreaterThan(0);
    }
  });

  it('every snapshot has a non-empty connectorLabel', () => {
    for (const snap of summary.snapshots) {
      expect(typeof snap.connectorLabel).toBe('string');
      expect(snap.connectorLabel.length).toBeGreaterThan(0);
    }
  });

  it('every snapshot overallPassed <= totalChecks', () => {
    for (const snap of summary.snapshots) {
      expect(snap.overallPassed).toBeLessThanOrEqual(snap.totalChecks);
    }
  });

  it('every snapshot has a non-empty healthNote', () => {
    for (const snap of summary.snapshots) {
      expect(typeof snap.healthNote).toBe('string');
      expect(snap.healthNote.length).toBeGreaterThan(0);
    }
  });

  it('every healthCheck in every snapshot has deterministicSeed: true', () => {
    for (const snap of summary.snapshots) {
      for (const check of snap.healthChecks) {
        expect(check.deterministicSeed).toBe(true);
      }
    }
  });

  it('every healthCheck has a non-empty label', () => {
    for (const snap of summary.snapshots) {
      for (const check of snap.healthChecks) {
        expect(typeof check.label).toBe('string');
        expect(check.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('every healthCheck has a non-empty detail', () => {
    for (const snap of summary.snapshots) {
      for (const check of snap.healthChecks) {
        expect(typeof check.detail).toBe('string');
        expect(check.detail.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getConnectorHealthSnapshot — per-connector assertions
// ---------------------------------------------------------------------------

describe('ADM6 — getConnectorHealthSnapshot: conn-market-intel (healthy)', () => {
  let snap: ConnectorHealthSnapshot;

  beforeAll(() => {
    snap = getConnectorHealthSnapshot('conn-market-intel') as ConnectorHealthSnapshot;
  });

  it('returns a non-null value', () => {
    expect(snap).not.toBeNull();
  });

  it('status is healthy_stub', () => {
    expect(snap.status).toBe('healthy_stub');
  });

  it('overallPassed equals totalChecks', () => {
    expect(snap.overallPassed).toBe(snap.totalChecks);
  });

  it('deterministicSeed is true', () => {
    expect(snap.deterministicSeed).toBe(true);
  });

  it('all health checks passed', () => {
    for (const check of snap.healthChecks) {
      expect(check.passed).toBe(true);
    }
  });
});

describe('ADM6 — getConnectorHealthSnapshot: conn-erp (unreachable)', () => {
  let snap: ConnectorHealthSnapshot;

  beforeAll(() => {
    snap = getConnectorHealthSnapshot('conn-erp') as ConnectorHealthSnapshot;
  });

  it('returns a non-null value', () => {
    expect(snap).not.toBeNull();
  });

  it('status is unreachable_stub', () => {
    expect(snap.status).toBe('unreachable_stub');
  });

  it('overallPassed is less than totalChecks', () => {
    expect(snap.overallPassed).toBeLessThan(snap.totalChecks);
  });

  it('deterministicSeed is true', () => {
    expect(snap.deterministicSeed).toBe(true);
  });

  it('overallPassed is 0', () => {
    expect(snap.overallPassed).toBe(0);
  });
});

describe('ADM6 — getConnectorHealthSnapshot: conn-spend-analytics (degraded)', () => {
  let snap: ConnectorHealthSnapshot;

  beforeAll(() => {
    snap = getConnectorHealthSnapshot('conn-spend-analytics') as ConnectorHealthSnapshot;
  });

  it('returns a non-null value', () => {
    expect(snap).not.toBeNull();
  });

  it('status is degraded_stub', () => {
    expect(snap.status).toBe('degraded_stub');
  });

  it('overallPassed is less than totalChecks', () => {
    expect(snap.overallPassed).toBeLessThan(snap.totalChecks);
  });

  it('overallPassed is 2 (connectivity + auth pass, last_sync fails)', () => {
    expect(snap.overallPassed).toBe(2);
  });

  it('deterministicSeed is true', () => {
    expect(snap.deterministicSeed).toBe(true);
  });
});

describe('ADM6 — getConnectorHealthSnapshot: conn-contract-mgmt (not_configured)', () => {
  let snap: ConnectorHealthSnapshot;

  beforeAll(() => {
    snap = getConnectorHealthSnapshot('conn-contract-mgmt') as ConnectorHealthSnapshot;
  });

  it('returns a non-null value', () => {
    expect(snap).not.toBeNull();
  });

  it('status is not_configured', () => {
    expect(snap.status).toBe('not_configured');
  });

  it('overallPassed is 0', () => {
    expect(snap.overallPassed).toBe(0);
  });

  it('deterministicSeed is true', () => {
    expect(snap.deterministicSeed).toBe(true);
  });
});

describe('ADM6 — getConnectorHealthSnapshot: conn-identity (healthy)', () => {
  let snap: ConnectorHealthSnapshot;

  beforeAll(() => {
    snap = getConnectorHealthSnapshot('conn-identity') as ConnectorHealthSnapshot;
  });

  it('returns a non-null value', () => {
    expect(snap).not.toBeNull();
  });

  it('status is healthy_stub', () => {
    expect(snap.status).toBe('healthy_stub');
  });

  it('overallPassed equals totalChecks', () => {
    expect(snap.overallPassed).toBe(snap.totalChecks);
  });

  it('deterministicSeed is true', () => {
    expect(snap.deterministicSeed).toBe(true);
  });
});

describe('ADM6 — getConnectorHealthSnapshot: nonexistent id', () => {
  it('returns null for an unknown connector id', () => {
    expect(getConnectorHealthSnapshot('nonexistent')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getConnectorHealthSnapshot('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getHealthStatusLabel
// ---------------------------------------------------------------------------

describe('ADM6 — getHealthStatusLabel', () => {
  const statuses: ConnectorHealthStatus[] = [
    'healthy_stub',
    'degraded_stub',
    'unreachable_stub',
    'not_configured',
  ];

  for (const status of statuses) {
    it(`returns a non-empty string for status "${status}"`, () => {
      const label = getHealthStatusLabel(status);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  }

  it('healthy_stub maps to "Healthy"', () => {
    expect(getHealthStatusLabel('healthy_stub')).toBe('Healthy');
  });

  it('degraded_stub maps to "Degraded"', () => {
    expect(getHealthStatusLabel('degraded_stub')).toBe('Degraded');
  });

  it('unreachable_stub maps to "Unreachable"', () => {
    expect(getHealthStatusLabel('unreachable_stub')).toBe('Unreachable');
  });

  it('not_configured maps to "Not Configured"', () => {
    expect(getHealthStatusLabel('not_configured')).toBe('Not Configured');
  });
});

// ---------------------------------------------------------------------------
// describeHealthSummary
// ---------------------------------------------------------------------------

describe('ADM6 — describeHealthSummary', () => {
  let summary: ConnectorHealthSummary;

  beforeAll(() => {
    summary = buildConnectorHealthSummary();
  });

  it('returns a non-empty string', () => {
    const desc = describeHealthSummary(summary);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('includes healthy count "2 healthy"', () => {
    expect(describeHealthSummary(summary)).toContain('2 healthy');
  });

  it('includes degraded count "1 degraded"', () => {
    expect(describeHealthSummary(summary)).toContain('1 degraded');
  });

  it('includes unreachable count "1 unreachable"', () => {
    expect(describeHealthSummary(summary)).toContain('1 unreachable');
  });

  it('includes not-configured count "1 not configured"', () => {
    expect(describeHealthSummary(summary)).toContain('1 not configured');
  });

  it('uses interpunct separator "·"', () => {
    expect(describeHealthSummary(summary)).toContain('·');
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('ADM6 — module hygiene', () => {
  let src: string;

  beforeAll(() => {
    src = readSource();
  });

  it('does not call Date.now', () => {
    expect(src).not.toContain('Date.now');
  });

  it('does not call Math.random', () => {
    expect(src).not.toContain('Math.random');
  });

  it('does not construct new Date(', () => {
    expect(src).not.toContain('new Date(');
  });

  it('does not call fetch(', () => {
    expect(src).not.toContain('fetch(');
  });

  it('does not import useState', () => {
    expect(src).not.toContain('useState');
  });

  it('does not import useEffect', () => {
    expect(src).not.toContain('useEffect');
  });

  it('does not contain "Coming soon"', () => {
    expect(src).not.toContain('Coming soon');
  });

  it('does not contain "TBD"', () => {
    expect(src).not.toContain('TBD');
  });

  it('does not contain "Lorem ipsum"', () => {
    expect(src).not.toContain('Lorem ipsum');
  });

  it('does not import from supabase', () => {
    expect(src).not.toContain('@supabase/supabase-js');
  });

  it('does not import from @clerk/nextjs', () => {
    expect(src).not.toContain('@clerk/nextjs');
  });
});
