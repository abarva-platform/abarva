/**
 * W32D — Admin Connectors Readiness View Model
 *
 * Pure TypeScript read-model for the Admin Connectors panel.
 * The WIRE2 audit found the Connectors tab is absent from the Admin sidebar.
 * This view model provides honest connector status without fabricating live connections.
 *
 * No React. No network calls. No model calls. Deterministic seed output only.
 * Status is always stub/deferred/not_configured — never claims production_ready.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectorStatus =
  | 'not_configured'
  | 'configured_stub'
  | 'blocked'
  | 'deferred';

export type ConnectorKind =
  | 'erp'
  | 'spend_analytics'
  | 'contract_management'
  | 'market_intelligence'
  | 'vendor_portal'
  | 'identity';

export interface ConnectorReadiness {
  id: string;
  kind: ConnectorKind;
  label: string;
  status: ConnectorStatus;
  stewardGuidance: string;    // what Steward needs before this connector can be trusted
  blockerReason: string | null;
  deferredReason: string | null;
  requiredForPilot: boolean;
  requiredForProduction: boolean;
  deterministicSeed: true;
}

export interface ConnectorsReadinessView {
  connectors: ConnectorReadiness[];
  pilotBlockers: ConnectorReadiness[];
  configuredCount: number;
  totalCount: number;
  overallStatus: 'not_ready' | 'partial' | 'pilot_ready' | 'production_ready';
  stewardSummary: string;
  caveat: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Apex Retail connector seed data — realistic stubs only
// ---------------------------------------------------------------------------

const APEX_RETAIL_CONNECTORS: ConnectorReadiness[] = [
  {
    id: 'conn-apex-erp',
    kind: 'erp',
    label: 'ERP / Finance System',
    status: 'not_configured',
    stewardGuidance:
      'Steward requires: (1) ERP API credentials from IT Security, (2) data-sharing consent ' +
      'from Data Governance, (3) confirmation of which data domains are in scope. ' +
      'Do not configure until consent framework is approved.',
    blockerReason:
      'ERP API credentials not provided. Data-sharing consent framework not approved.',
    deferredReason: null,
    requiredForPilot: false,
    requiredForProduction: true,
    deterministicSeed: true,
  },
  {
    id: 'conn-apex-spend-analytics',
    kind: 'spend_analytics',
    label: 'Spend Analytics Platform',
    status: 'deferred',
    stewardGuidance:
      'Spend analytics connector is deferred to post-pilot. ' +
      'Manual spend data export is the interim workaround for the AMS BAFO analysis.',
    blockerReason: null,
    deferredReason:
      'Deferred to post-pilot scope. Manual data export approved as interim workaround.',
    requiredForPilot: false,
    requiredForProduction: false,
    deterministicSeed: true,
  },
  {
    id: 'conn-apex-contract-mgmt',
    kind: 'contract_management',
    label: 'Contract Management System',
    status: 'configured_stub',
    stewardGuidance:
      'Stub connector is in place but has not been tested with live contract data. ' +
      'Steward requires: (1) end-to-end connectivity test, (2) contract field mapping review, ' +
      '(3) data classification confirmation before this connector can be trusted.',
    blockerReason: null,
    deferredReason: null,
    requiredForPilot: true,
    requiredForProduction: true,
    deterministicSeed: true,
  },
  {
    id: 'conn-apex-market-intel',
    kind: 'market_intelligence',
    label: 'Market Intelligence Feed',
    status: 'not_configured',
    stewardGuidance:
      'Market intelligence connector requires a vendor subscription and API key. ' +
      'Contact the procurement team to obtain subscription credentials.',
    blockerReason: 'Market intelligence vendor subscription not procured.',
    deferredReason: null,
    requiredForPilot: false,
    requiredForProduction: false,
    deterministicSeed: true,
  },
  {
    id: 'conn-apex-vendor-portal',
    kind: 'vendor_portal',
    label: 'Vendor Portal Integration',
    status: 'deferred',
    stewardGuidance:
      'Vendor portal integration is deferred pending vendor onboarding process. ' +
      'BAFO responses are currently received via email — manual ingestion in place.',
    blockerReason: null,
    deferredReason:
      'Deferred pending vendor onboarding. Manual BAFO intake is the approved interim process.',
    requiredForPilot: false,
    requiredForProduction: true,
    deterministicSeed: true,
  },
  {
    id: 'conn-apex-identity',
    kind: 'identity',
    label: 'Identity / SSO (Clerk)',
    status: 'configured_stub',
    stewardGuidance:
      'Clerk identity provider is configured for test users. ' +
      'Production SSO integration requires IT Security review and domain verification.',
    blockerReason: null,
    deferredReason: null,
    requiredForPilot: true,
    requiredForProduction: true,
    deterministicSeed: true,
  },
];

// ---------------------------------------------------------------------------
// Meridian connector seed (thinner)
// ---------------------------------------------------------------------------

const MERIDIAN_CONNECTORS: ConnectorReadiness[] = [
  {
    id: 'conn-meridian-identity',
    kind: 'identity',
    label: 'Identity / SSO (Clerk)',
    status: 'configured_stub',
    stewardGuidance:
      'Clerk identity provider is configured for test users. ' +
      'Production SSO requires domain verification.',
    blockerReason: null,
    deferredReason: null,
    requiredForPilot: true,
    requiredForProduction: true,
    deterministicSeed: true,
  },
  {
    id: 'conn-meridian-erp',
    kind: 'erp',
    label: 'ERP / Finance System',
    status: 'not_configured',
    stewardGuidance:
      'ERP connector not configured. Requires IT Security approval and API credentials.',
    blockerReason: 'ERP API credentials not provided.',
    deferredReason: null,
    requiredForPilot: false,
    requiredForProduction: true,
    deterministicSeed: true,
  },
];

const DETERMINISTIC_CAVEAT =
  'Connector statuses are deterministic seed data — not live connectivity checks. ' +
  'No connector claims production-ready status until Steward validates live data flow.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeOverallStatus(
  connectors: ConnectorReadiness[],
): ConnectorsReadinessView['overallStatus'] {
  const configured = connectors.filter(
    (c) => c.status === 'configured_stub',
  );
  const pilotBlockers = connectors.filter(
    (c) => c.requiredForPilot && c.status !== 'configured_stub',
  );

  if (configured.length === 0) return 'not_ready';
  if (pilotBlockers.length > 0) return 'partial';
  // Never return production_ready from seed data — always partial at best
  return 'partial';
}

function buildStewardSummary(connectors: ConnectorReadiness[]): string {
  const notConfigured = connectors.filter((c) => c.status === 'not_configured').length;
  const stubs = connectors.filter((c) => c.status === 'configured_stub').length;
  const deferred = connectors.filter((c) => c.status === 'deferred').length;
  const pilotBlockers = connectors.filter(
    (c) => c.requiredForPilot && c.status === 'not_configured',
  ).length;

  let summary = `${stubs} connector${stubs !== 1 ? 's' : ''} configured as stubs, ` +
    `${notConfigured} not configured, ${deferred} deferred.`;

  if (pilotBlockers > 0) {
    summary +=
      ` ${pilotBlockers} pilot-required connector${pilotBlockers !== 1 ? 's' : ''} ` +
      `not yet configured — pilot cannot proceed until resolved.`;
  } else {
    summary += ' No pilot-blocking connector gaps.';
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all connectors required for pilot that are not yet configured.
 */
export function getPilotBlockerConnectors(tenantSlug: string): ConnectorReadiness[] {
  const view = buildConnectorsReadinessView(tenantSlug);
  return view.pilotBlockers;
}

/**
 * Builds the full ConnectorsReadinessView for the Admin Connectors panel.
 */
export function buildConnectorsReadinessView(tenantSlug: string): ConnectorsReadinessView {
  const connectors: ConnectorReadiness[] =
    tenantSlug === 'apex-retail'
      ? APEX_RETAIL_CONNECTORS
      : tenantSlug === 'meridian'
        ? MERIDIAN_CONNECTORS
        : [];

  const pilotBlockers = connectors.filter(
    (c) => c.requiredForPilot && c.status !== 'configured_stub',
  );

  const configuredCount = connectors.filter(
    (c) => c.status === 'configured_stub',
  ).length;

  return {
    connectors,
    pilotBlockers,
    configuredCount,
    totalCount: connectors.length,
    overallStatus: computeOverallStatus(connectors),
    stewardSummary: buildStewardSummary(connectors),
    caveat: DETERMINISTIC_CAVEAT,
    deterministicSeed: true,
  };
}
