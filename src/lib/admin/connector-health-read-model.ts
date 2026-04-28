// connector-health-read-model.ts — ADM6
//
// Deterministic read model for connector health status.
// No React. No network calls. No model calls. Deterministic seed output only.
// All health check results are stubs — no live connectivity checks are performed.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectorHealthStatus =
  | 'healthy_stub'
  | 'degraded_stub'
  | 'unreachable_stub'
  | 'not_configured';

export type ConnectorHealthCheckKind =
  | 'connectivity'
  | 'auth'
  | 'last_sync'
  | 'schema_drift'
  | 'rate_limit';

export interface ConnectorHealthCheck {
  kind: ConnectorHealthCheckKind;
  label: string;
  passed: boolean;
  detail: string;
  deterministicSeed: true;
}

export interface ConnectorHealthSnapshot {
  connectorId: string;
  connectorLabel: string;
  status: ConnectorHealthStatus;
  healthChecks: readonly ConnectorHealthCheck[];
  overallPassed: number;
  totalChecks: number;
  lastSyncAtStub: string;
  healthNote: string;
  deterministicSeed: true;
}

export interface ConnectorHealthSummary {
  snapshots: readonly ConnectorHealthSnapshot[];
  healthyCount: number;
  degradedCount: number;
  unreachableCount: number;
  notConfiguredCount: number;
  totalCount: number;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Seed data — 5 connectors
// ---------------------------------------------------------------------------

const CONNECTOR_SNAPSHOTS: readonly ConnectorHealthSnapshot[] = [
  {
    connectorId: 'conn-erp',
    connectorLabel: 'ERP / Finance System',
    status: 'unreachable_stub',
    healthChecks: [
      {
        kind: 'connectivity',
        label: 'Connectivity',
        passed: false,
        detail: 'Host unreachable — no TCP response on configured endpoint.',
        deterministicSeed: true,
      },
      {
        kind: 'auth',
        label: 'Authentication',
        passed: false,
        detail: 'Cannot authenticate — connectivity check failed upstream.',
        deterministicSeed: true,
      },
    ],
    overallPassed: 0,
    totalChecks: 2,
    lastSyncAtStub: 'never',
    healthNote:
      'ERP connector is unreachable. Connectivity and authentication checks failed. ' +
      'Verify API endpoint and network configuration before retrying.',
    deterministicSeed: true,
  },
  {
    connectorId: 'conn-spend-analytics',
    connectorLabel: 'Spend Analytics Platform',
    status: 'degraded_stub',
    healthChecks: [
      {
        kind: 'connectivity',
        label: 'Connectivity',
        passed: true,
        detail: 'Host reachable — TCP handshake completed successfully.',
        deterministicSeed: true,
      },
      {
        kind: 'auth',
        label: 'Authentication',
        passed: true,
        detail: 'API key accepted — 200 response on auth probe endpoint.',
        deterministicSeed: true,
      },
      {
        kind: 'last_sync',
        label: 'Last Sync',
        passed: false,
        detail:
          'Last successful sync was more than 72 hours ago — data may be stale. ' +
          'Expected cadence is daily batch.',
        deterministicSeed: true,
      },
    ],
    overallPassed: 2,
    totalChecks: 3,
    lastSyncAtStub: '2026-04-25T02:00:00Z',
    healthNote:
      'Spend Analytics connector is reachable and authenticated but the last sync ' +
      'is overdue. Data freshness is degraded — investigate batch scheduler.',
    deterministicSeed: true,
  },
  {
    connectorId: 'conn-contract-mgmt',
    connectorLabel: 'Contract Management System',
    status: 'not_configured',
    healthChecks: [
      {
        kind: 'connectivity',
        label: 'Connectivity',
        passed: false,
        detail: 'Not run — connector not configured. No endpoint on record.',
        deterministicSeed: true,
      },
      {
        kind: 'auth',
        label: 'Authentication',
        passed: false,
        detail: 'Not run — connector not configured. No credentials on record.',
        deterministicSeed: true,
      },
      {
        kind: 'last_sync',
        label: 'Last Sync',
        passed: false,
        detail: 'Not run — connector not configured.',
        deterministicSeed: true,
      },
    ],
    overallPassed: 0,
    totalChecks: 3,
    lastSyncAtStub: 'never',
    healthNote:
      'Contract Management connector has not been configured. ' +
      'Provide endpoint URL and API credentials to enable health checks.',
    deterministicSeed: true,
  },
  {
    connectorId: 'conn-market-intel',
    connectorLabel: 'Market Intelligence Feed',
    status: 'healthy_stub',
    healthChecks: [
      {
        kind: 'connectivity',
        label: 'Connectivity',
        passed: true,
        detail: 'Host reachable — TCP handshake completed successfully.',
        deterministicSeed: true,
      },
      {
        kind: 'auth',
        label: 'Authentication',
        passed: true,
        detail: 'API key accepted — 200 response on auth probe endpoint.',
        deterministicSeed: true,
      },
      {
        kind: 'last_sync',
        label: 'Last Sync',
        passed: true,
        detail: 'Last sync completed within expected window.',
        deterministicSeed: true,
      },
      {
        kind: 'schema_drift',
        label: 'Schema Drift',
        passed: true,
        detail: 'No schema changes detected since last schema snapshot.',
        deterministicSeed: true,
      },
      {
        kind: 'rate_limit',
        label: 'Rate Limit',
        passed: true,
        detail: 'API usage is within rate limit thresholds.',
        deterministicSeed: true,
      },
    ],
    overallPassed: 5,
    totalChecks: 5,
    lastSyncAtStub: '2026-04-20T09:00:00Z',
    healthNote: 'Market Intelligence connector is healthy. All 5 checks passed.',
    deterministicSeed: true,
  },
  {
    connectorId: 'conn-identity',
    connectorLabel: 'Identity / SSO',
    status: 'healthy_stub',
    healthChecks: [
      {
        kind: 'connectivity',
        label: 'Connectivity',
        passed: true,
        detail: 'Host reachable — TCP handshake completed successfully.',
        deterministicSeed: true,
      },
      {
        kind: 'auth',
        label: 'Authentication',
        passed: true,
        detail: 'Service token accepted — 200 response on auth probe endpoint.',
        deterministicSeed: true,
      },
      {
        kind: 'last_sync',
        label: 'Last Sync',
        passed: true,
        detail: 'Last sync completed within expected window.',
        deterministicSeed: true,
      },
      {
        kind: 'schema_drift',
        label: 'Schema Drift',
        passed: true,
        detail: 'No schema changes detected since last schema snapshot.',
        deterministicSeed: true,
      },
      {
        kind: 'rate_limit',
        label: 'Rate Limit',
        passed: true,
        detail: 'API usage is within rate limit thresholds.',
        deterministicSeed: true,
      },
    ],
    overallPassed: 5,
    totalChecks: 5,
    lastSyncAtStub: '2026-04-28T06:00:00Z',
    healthNote: 'Identity connector is healthy. All 5 checks passed.',
    deterministicSeed: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countByStatus(
  snapshots: readonly ConnectorHealthSnapshot[],
  status: ConnectorHealthStatus,
): number {
  let count = 0;
  for (const s of snapshots) {
    if (s.status === status) count += 1;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the health snapshot for a single connector by its id, or null if
 * the id is not in the seed.
 */
export function getConnectorHealthSnapshot(
  connectorId: string,
): ConnectorHealthSnapshot | null {
  for (const snapshot of CONNECTOR_SNAPSHOTS) {
    if (snapshot.connectorId === connectorId) return snapshot;
  }
  return null;
}

/**
 * Builds the full ConnectorHealthSummary across all seeded connectors.
 */
export function buildConnectorHealthSummary(): ConnectorHealthSummary {
  return {
    snapshots: CONNECTOR_SNAPSHOTS,
    healthyCount: countByStatus(CONNECTOR_SNAPSHOTS, 'healthy_stub'),
    degradedCount: countByStatus(CONNECTOR_SNAPSHOTS, 'degraded_stub'),
    unreachableCount: countByStatus(CONNECTOR_SNAPSHOTS, 'unreachable_stub'),
    notConfiguredCount: countByStatus(CONNECTOR_SNAPSHOTS, 'not_configured'),
    totalCount: CONNECTOR_SNAPSHOTS.length,
    deterministicSeed: true,
  };
}

/**
 * Returns a human-readable label for a ConnectorHealthStatus value.
 */
export function getHealthStatusLabel(status: ConnectorHealthStatus): string {
  switch (status) {
    case 'healthy_stub':
      return 'Healthy';
    case 'degraded_stub':
      return 'Degraded';
    case 'unreachable_stub':
      return 'Unreachable';
    case 'not_configured':
      return 'Not Configured';
  }
}

/**
 * Returns a concise prose description of a ConnectorHealthSummary.
 * Example: "2 healthy · 1 degraded · 1 unreachable · 1 not configured"
 */
export function describeHealthSummary(summary: ConnectorHealthSummary): string {
  return (
    summary.healthyCount +
    ' healthy · ' +
    summary.degradedCount +
    ' degraded · ' +
    summary.unreachableCount +
    ' unreachable · ' +
    summary.notConfiguredCount +
    ' not configured'
  );
}
