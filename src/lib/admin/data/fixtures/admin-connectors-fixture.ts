/**
 * ADMIN-DATA2 — Admin connectors fixture.
 *
 * Lifts the existing hardcoded data from `connectors-readiness-view.ts`
 * and `connectors-page-view.ts` into the adapter shape. Page-views are
 * not yet swapped to consume this — DATA3-9 do that.
 */

import type {
  AdminConnectorDetail,
  AdminConnectorHealthPoint,
  AdminConnectorRow,
  AdminConnectorSyncAttempt,
} from '../admin-connectors-adapter-types';

const FIXTURE_GENERATED_AT = '2026-04-26T12:00:00.000Z';

// ---------------------------------------------------------------------------
// Apex Retail — 6 connectors lifted from APEX_RETAIL_CONNECTORS
// ---------------------------------------------------------------------------

const APEX_RETAIL_CONNECTORS: ReadonlyArray<AdminConnectorRow> = [
  {
    id: 'conn-apex-erp',
    tenantSlug: 'apex-retail',
    kind: 'erp',
    vendor: 'SAP S/4HANA (planned)',
    label: 'ERP / Finance System',
    status: 'not_configured',
    requiredForPilot: false,
    requiredForProduction: true,
    blockerReason:
      'ERP API credentials not provided. Data-sharing consent framework not approved.',
    stewardGuidance:
      'Steward requires: (1) ERP API credentials from IT Security, (2) data-sharing consent ' +
      'from Data Governance, (3) confirmation of which data domains are in scope. ' +
      'Do not configure until consent framework is approved.',
    lastSyncAttempt: null,
    updatedAt: FIXTURE_GENERATED_AT,
  },
  {
    id: 'conn-apex-spend-analytics',
    tenantSlug: 'apex-retail',
    kind: 'spend_analytics',
    vendor: 'Coupa Spend Analytics (deferred)',
    label: 'Spend Analytics Platform',
    status: 'deferred',
    requiredForPilot: false,
    requiredForProduction: false,
    blockerReason: null,
    stewardGuidance:
      'Spend analytics connector is deferred to post-pilot. ' +
      'Manual spend data export is the interim workaround for the AMS BAFO analysis.',
    lastSyncAttempt: null,
    updatedAt: FIXTURE_GENERATED_AT,
  },
  {
    id: 'conn-apex-contract-mgmt',
    tenantSlug: 'apex-retail',
    kind: 'contract_management',
    vendor: 'Icertis Contract Intelligence',
    label: 'Contract Management System',
    status: 'configured_stub',
    requiredForPilot: true,
    requiredForProduction: true,
    blockerReason: null,
    stewardGuidance:
      'Stub connector is in place but has not been tested with live contract data. ' +
      'Steward requires: (1) end-to-end connectivity test, (2) contract field mapping review, ' +
      '(3) data classification confirmation before this connector can be trusted.',
    lastSyncAttempt: '2026-04-26T11:00:00.000Z',
    updatedAt: FIXTURE_GENERATED_AT,
  },
  {
    id: 'conn-apex-market-intel',
    tenantSlug: 'apex-retail',
    kind: 'market_intelligence',
    vendor: 'Beroe LiVE.Ai',
    label: 'Market Intelligence Feed',
    status: 'not_configured',
    requiredForPilot: false,
    requiredForProduction: false,
    blockerReason: 'Market intelligence vendor subscription not procured.',
    stewardGuidance:
      'Market intelligence connector requires a vendor subscription and API key. ' +
      'Contact the procurement team to obtain subscription credentials.',
    lastSyncAttempt: null,
    updatedAt: FIXTURE_GENERATED_AT,
  },
  {
    id: 'conn-apex-vendor-portal',
    tenantSlug: 'apex-retail',
    kind: 'vendor_portal',
    vendor: 'Internal vendor portal (deferred)',
    label: 'Vendor Portal Integration',
    status: 'deferred',
    requiredForPilot: false,
    requiredForProduction: true,
    blockerReason: null,
    stewardGuidance:
      'Vendor portal integration is deferred pending vendor onboarding process. ' +
      'BAFO responses are currently received via email — manual ingestion in place.',
    lastSyncAttempt: null,
    updatedAt: FIXTURE_GENERATED_AT,
  },
  {
    id: 'conn-apex-identity',
    tenantSlug: 'apex-retail',
    kind: 'identity',
    vendor: 'Clerk (test users)',
    label: 'Identity / SSO (Clerk)',
    status: 'configured_stub',
    requiredForPilot: true,
    requiredForProduction: true,
    blockerReason: null,
    stewardGuidance:
      'Clerk identity provider is configured for test users. ' +
      'Production SSO integration requires IT Security review and domain verification.',
    lastSyncAttempt: '2026-04-26T11:00:00.000Z',
    updatedAt: FIXTURE_GENERATED_AT,
  },
  {
    id: 'conn-apex-ms-graph',
    tenantSlug: 'apex-retail',
    kind: 'identity',
    vendor: 'Microsoft Graph',
    label: 'Microsoft Graph',
    status: 'blocked',
    requiredForPilot: false,
    requiredForProduction: true,
    blockerReason:
      'Microsoft Graph OAuth is not configured. Setup W4 must own tenant admin consent, token storage, and live validation before configure/test can run.',
    stewardGuidance:
      'Graph connector is contract-only in Setup W3. Required scopes and configuration are masked for review, but no OAuth exchange, Graph SDK call, or live tenant read is performed.',
    lastSyncAttempt: null,
    updatedAt: FIXTURE_GENERATED_AT,
  },
];

// ---------------------------------------------------------------------------
// Meridian — 2 connectors lifted from MERIDIAN_CONNECTORS
// ---------------------------------------------------------------------------

const MERIDIAN_CONNECTORS: ReadonlyArray<AdminConnectorRow> = [
  {
    id: 'conn-meridian-identity',
    tenantSlug: 'meridian',
    kind: 'identity',
    vendor: 'Clerk (test users)',
    label: 'Identity / SSO (Clerk)',
    status: 'configured_stub',
    requiredForPilot: true,
    requiredForProduction: true,
    blockerReason: null,
    stewardGuidance:
      'Clerk identity provider is configured for test users. ' +
      'Production SSO requires domain verification.',
    lastSyncAttempt: '2026-04-26T11:00:00.000Z',
    updatedAt: FIXTURE_GENERATED_AT,
  },
  {
    id: 'conn-meridian-erp',
    tenantSlug: 'meridian',
    kind: 'erp',
    vendor: 'Workday Financials (planned)',
    label: 'ERP / Finance System',
    status: 'not_configured',
    requiredForPilot: false,
    requiredForProduction: true,
    blockerReason: 'ERP API credentials not provided.',
    stewardGuidance:
      'ERP connector not configured. Requires IT Security approval and API credentials.',
    lastSyncAttempt: null,
    updatedAt: FIXTURE_GENERATED_AT,
  },
];

// ---------------------------------------------------------------------------
// Detail seeds — config schema, sync attempts, health trend
// ---------------------------------------------------------------------------

function buildSyncAttempts(row: AdminConnectorRow): ReadonlyArray<AdminConnectorSyncAttempt> {
  if (row.status === 'configured_stub') {
    return [
      {
        at: '2026-04-26T11:00:00.000Z',
        result: 'ok',
        errorMessage: undefined,
      },
      {
        at: '2026-04-26T05:00:00.000Z',
        result: 'partial',
        errorMessage: 'Schema validated against pilot snapshot.',
      },
    ];
  }
  if (row.status === 'deferred') {
    return [];
  }
  if (row.status === 'blocked') {
    return [
      {
        at: '2026-04-26T00:00:00.000Z',
        result: 'failed',
        errorMessage:
          'Blocked until Setup W4 implements live Microsoft Graph OAuth consent boundary.',
      },
    ];
  }
  return [
    {
      at: '2026-04-26T00:00:00.000Z',
      result: 'failed',
      errorMessage: 'No credentials configured.',
    },
  ];
}

function buildHealthTrend(row: AdminConnectorRow): ReadonlyArray<AdminConnectorHealthPoint> {
  if (row.status === 'configured_stub') {
    return [
      { at: '2026-04-26T08:00:00.000Z', status: 'healthy' },
      { at: '2026-04-26T04:00:00.000Z', status: 'healthy' },
      { at: '2026-04-26T00:00:00.000Z', status: 'degraded' },
    ];
  }
  if (row.status === 'deferred') {
    return [{ at: '2026-04-26T00:00:00.000Z', status: 'paused' }];
  }
  if (row.status === 'blocked') {
    return [{ at: '2026-04-26T00:00:00.000Z', status: 'paused' }];
  }
  return [{ at: '2026-04-26T00:00:00.000Z', status: 'failed' }];
}

const CONFIG_SCHEMAS: Readonly<Record<string, Record<string, unknown>>> = {
  'conn-apex-erp': {
    fields: ['apiBaseUrl', 'clientId', 'clientSecret', 'dataDomains'],
    docsHref: 'https://help.sap.com/docs/SAP_S4HANA_CLOUD',
  },
  'conn-apex-spend-analytics': {
    fields: ['tenantId', 'apiKey'],
    docsHref: 'https://success.coupa.com/Implement/Coupa_Connectors',
  },
  'conn-apex-contract-mgmt': {
    fields: ['apiBaseUrl', 'apiKey', 'fieldMapVersion'],
    docsHref: 'https://docs.icertis.com',
  },
  'conn-apex-market-intel': {
    fields: ['subscriptionTier', 'apiKey'],
    docsHref: 'https://www.beroeinc.com/live/',
  },
  'conn-apex-vendor-portal': {
    fields: ['portalBaseUrl', 'webhookSecret'],
    docsHref: 'https://example.com/docs/vendor-portal',
  },
  'conn-apex-identity': {
    fields: ['publishableKey', 'secretKey', 'allowedRedirectOrigins'],
    docsHref: 'https://clerk.com/docs',
  },
  'conn-apex-ms-graph': {
    fields: ['tenantId', 'clientId', 'clientSecret', 'redirectUri', 'adminConsent', 'requiredScopes'],
    docsHref: 'https://learn.microsoft.com/graph/overview',
    maskedConfig: {
      tenantId: 'tenant-****',
      clientId: 'app-****',
      clientSecret: '••••••••',
      redirectUri: 'https://app.abarva.ai/api/setup/microsoft-graph/callback',
      adminConsent: 'not granted',
      requiredScopes:
        'User.Read.All, Group.Read.All, Directory.Read.All, Calendars.Read, Mail.ReadBasic.All, Reports.Read.All',
    },
  },
  'conn-meridian-identity': {
    fields: ['publishableKey', 'secretKey'],
    docsHref: 'https://clerk.com/docs',
  },
  'conn-meridian-erp': {
    fields: ['apiBaseUrl', 'apiKey'],
    docsHref: 'https://doc.workday.com',
  },
};

export function adminConnectorsFixture(
  tenantSlug: string,
): ReadonlyArray<AdminConnectorRow> {
  if (tenantSlug === 'apex-retail') return APEX_RETAIL_CONNECTORS;
  if (tenantSlug === 'meridian') return MERIDIAN_CONNECTORS;
  return [];
}

export function adminConnectorDetailFixture(
  tenantSlug: string,
  connectorId: string,
): AdminConnectorDetail | null {
  const row = adminConnectorsFixture(tenantSlug).find((c) => c.id === connectorId);
  if (!row) return null;
  return {
    ...row,
    configSchema: CONFIG_SCHEMAS[connectorId] ?? null,
    requiredScopes:
      connectorId === 'conn-apex-ms-graph'
        ? [
            'User.Read.All',
            'Group.Read.All',
            'Directory.Read.All',
            'Calendars.Read',
            'Mail.ReadBasic.All',
            'Reports.Read.All',
          ]
        : undefined,
    recentSyncAttempts: buildSyncAttempts(row),
    healthTrend: buildHealthTrend(row),
  };
}

export function adminConnectorPilotBlockersFixture(
  tenantSlug: string,
): ReadonlyArray<AdminConnectorRow> {
  return adminConnectorsFixture(tenantSlug).filter(
    (c) => c.requiredForPilot && c.status !== 'configured_stub' && c.status !== 'active',
  );
}
