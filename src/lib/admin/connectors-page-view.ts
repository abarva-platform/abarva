import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContextAsync } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';
import {
  getAdminConnectors,
  getAdminConnectorDetail,
} from './data/admin-connectors-adapter';
import type {
  AdminConnectorRow,
  AdminConnectorDetail as AdapterConnectorDetail,
  AdminConnectorKind,
} from './data/admin-connectors-adapter-types';
import {
  type ConnectorReadiness,
  type ConnectorKind,
  type ConnectorStatus,
} from './connectors-readiness-view';

// ---------------------------------------------------------------------------
// ADMIN13 — Connectors depth view-model
// ADMIN-DATA4 — Wired to admin-connectors-adapter
// ---------------------------------------------------------------------------

export type ConnectorTab = 'health' | 'requirements' | 'configuration' | 'logs';

export interface ConnectorCategoryGroup {
  kind: ConnectorKind;
  label: string;
  connectors: ReadonlyArray<ConnectorReadiness>;
  pilotBlockerCount: number;
  configuredCount: number;
  totalCount: number;
}

export interface ConnectorConfigField {
  key: string;
  label: string;
  type: 'string' | 'secret' | 'enum' | 'boolean' | 'url';
  required: boolean;
  /** Masked display value when present (never live secret material). */
  maskedValue: string | null;
  helpText: string;
}

export interface ConnectorSyncAttempt {
  /** Stable ISO timestamp string (deterministic seed — not Date.now). */
  occurredAt: string;
  outcome: 'success_stub' | 'failure' | 'skipped' | 'pending';
  message: string;
  durationMs: number;
}

export interface ConnectorLogEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface ConnectorRequirement {
  surface: string;        // e.g. "Programs · Source Ingest"
  required: boolean;
  notes: string;
}

export interface ConnectorDetail {
  id: string;
  vendor: string;
  docsHref: string;
  configFields: ReadonlyArray<ConnectorConfigField>;
  lastSyncAttempt: ConnectorSyncAttempt;
  recentAttempts: ReadonlyArray<ConnectorSyncAttempt>;
  errorLog: ReadonlyArray<ConnectorLogEvent>;
  requirements: ReadonlyArray<ConnectorRequirement>;
  /** 24h health-trend points, deterministic seed. Length 24, values 0–100. */
  healthTrend: ReadonlyArray<number>;
}

export type ConnectorActionStatus = 'available' | 'blocked';

export interface ConnectorAction {
  id: string;
  label: string;
  status: ConnectorActionStatus;
  /** Reason text when blocked. */
  reason: string | null;
  /** Hint shown alongside the available actions. */
  hint: string;
}

export interface ConnectorsPageView {
  eyebrow: string;
  title: string;
  subtitle: string;
  context: {
    tenant: string;
    mode: string;
    agent: string;
    data: string;
    liveStatus: string;
    liveStatusKind: ContextLiveStatus;
  };
  editorial: {
    title: string;
    body: string;
    contextUsed: ReadonlyArray<string>;
    evidenceStrength: EvidenceStrength;
    blocker?: string;
    primaryAction: { label: string; href: string };
  };
  connectors: ReadonlyArray<ConnectorReadiness>;
  pilotBlockers: ReadonlyArray<ConnectorReadiness>;
  configuredCount: number;
  totalCount: number;
  caveat: string;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;

  // ADMIN13 additions
  /** Connectors grouped by ConnectorKind. */
  categories: ReadonlyArray<ConnectorCategoryGroup>;
  /** Per-connector deterministic detail keyed by ConnectorReadiness.id. */
  connectorDetailMap: Readonly<Record<string, ConnectorDetail>>;
  /** Action strip for the page header. */
  actions: ReadonlyArray<ConnectorAction>;
  /** Default tab when no ?tab param. */
  defaultTab: ConnectorTab;
  /** All available tabs in canonical order. */
  tabs: ReadonlyArray<{ id: ConnectorTab; label: string }>;
  /** Hard-gated reason text reused across action affordances. */
  hardGateReason: string;
}

// ---------------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<ConnectorKind, string> = {
  erp: 'ERP / Finance',
  spend_analytics: 'Spend',
  contract_management: 'Contract',
  market_intelligence: 'Market intelligence',
  vendor_portal: 'Vendor portal',
  identity: 'Identity / SSO',
};

// Canonical category order — matches admin sub-nav muscle memory.
const CATEGORY_ORDER: ConnectorKind[] = [
  'erp',
  'spend_analytics',
  'contract_management',
  'identity',
  'market_intelligence',
  'vendor_portal',
];

const HARD_GATE_REASON =
  'Live connector configure/test is blocked until Setup W4 implements the OAuth and steward validation boundary.';

const DETERMINISTIC_CAVEAT =
  'Connector statuses are deterministic seed data — not live connectivity checks. ' +
  'No connector claims production-ready status until Steward validates live data flow.';

// ---------------------------------------------------------------------------
// Deterministic seed helpers
// ---------------------------------------------------------------------------

/** Fast, deterministic 32-bit hash for stable seed strings. */
function seedHash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** Deterministic 24-point health trend in [40,100]. Stub connectors trend higher. */
function buildHealthTrend(seedKey: string, baseline: number): number[] {
  const out: number[] = [];
  let h = seedHash(seedKey);
  for (let i = 0; i < 24; i++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const offset = (h % 21) - 10; // -10..+10
    const v = Math.max(0, Math.min(100, baseline + offset));
    out.push(v);
  }
  return out;
}

/** Deterministic ISO timestamp anchored to the connector id (no Date.now). */
function seedTimestamp(seedKey: string, hoursAgoBase: number): string {
  // Anchor: 2026-04-26T12:00:00Z (deterministic, matches demo seed era).
  const anchor = Date.UTC(2026, 3, 26, 12, 0, 0); // month index 3 = April
  const h = seedHash(seedKey);
  const minutesJitter = h % 47;
  const ms = anchor - (hoursAgoBase * 60 + minutesJitter) * 60 * 1000;
  return new Date(ms).toISOString();
}

// ---------------------------------------------------------------------------
// Adapter row → page-view ConnectorReadiness translator
// ---------------------------------------------------------------------------

/**
 * Adapter rows expose `AdminConnectorKind` (which includes data_warehouse + crm)
 * and `AdminConnectorStatus` (which includes 'active'). The page-view
 * `ConnectorKind`/`ConnectorStatus` are narrower — we never seed adapter rows
 * with kinds/statuses outside the page-view's whitelist, so the cast is safe.
 * If the live adapter ever returns a wider kind/status, the connector is
 * skipped (defensive — page-view today only renders the narrower taxonomy).
 */
function isPageViewKind(kind: AdminConnectorKind): kind is ConnectorKind {
  return (
    kind === 'erp' ||
    kind === 'spend_analytics' ||
    kind === 'contract_management' ||
    kind === 'market_intelligence' ||
    kind === 'vendor_portal' ||
    kind === 'identity'
  );
}

function adapterStatusToPageView(
  status: AdminConnectorRow['status'],
): ConnectorStatus {
  if (status === 'active') return 'configured_stub'; // narrow safety; not used today
  return status;
}

function rowToReadiness(row: AdminConnectorRow): ConnectorReadiness | null {
  if (!isPageViewKind(row.kind)) return null;
  const status = adapterStatusToPageView(row.status);
  const deferredReason =
    status === 'deferred'
      ? row.stewardGuidance ??
        'Deferred — manual workaround approved as interim path.'
      : null;
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    status,
    stewardGuidance: row.stewardGuidance ?? '',
    blockerReason: row.blockerReason,
    deferredReason,
    requiredForPilot: row.requiredForPilot,
    requiredForProduction: row.requiredForProduction,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------------
// Per-connector enrichment (UI-shaped detail kept here until DATA10
// widens the adapter contract).
// ---------------------------------------------------------------------------
//
// The adapter detail (`AdapterConnectorDetail`) supplies vendor, configSchema
// (key list + docsHref), recentSyncAttempts, healthTrend. The page-view layer
// adds UI-only fields: configField labels/help-text/maskedValue, requirement
// surface mappings, and human-readable error log seeds.

interface ConfigFieldUiSeed {
  label: string;
  type: ConnectorConfigField['type'];
  maskedValue: string | null;
  helpText: string;
}

interface ConnectorEnrichment {
  configFieldDetails: Readonly<Record<string, ConfigFieldUiSeed>>;
  requirements: ReadonlyArray<ConnectorRequirement>;
  errorLog: ReadonlyArray<ConnectorLogEvent>;
}

const CONNECTOR_ENRICHMENT: Readonly<Record<string, ConnectorEnrichment>> = {
  'conn-apex-erp': {
    configFieldDetails: {
      apiBaseUrl: {
        label: 'API base URL',
        type: 'url',
        maskedValue: null,
        helpText: 'Tenant-specific S/4HANA OData endpoint.',
      },
      clientId: {
        label: 'OAuth client id',
        type: 'string',
        maskedValue: null,
        helpText: 'Issued by IT Security after consent approval.',
      },
      clientSecret: {
        label: 'OAuth client secret',
        type: 'secret',
        maskedValue: null,
        helpText: 'Stored in Vault. Never displayed.',
      },
      dataDomains: {
        label: 'In-scope data domains',
        type: 'enum',
        maskedValue: null,
        helpText: 'Spend, Vendors, Contracts, Invoices.',
      },
    },
    requirements: [
      { surface: 'Programs · Source ingest', required: true, notes: 'Spend + vendor master.' },
      { surface: 'Intelligence · Vendor patterns', required: true, notes: 'Trend signals.' },
      { surface: 'Tower · Spend telemetry', required: false, notes: 'Optional — manual export bridges.' },
    ],
    errorLog: [
      {
        timestamp: seedTimestamp('conn-apex-erp:err1', 26),
        level: 'warn',
        message: 'Configuration not started — credentials pending IT Security.',
      },
    ],
  },
  'conn-apex-spend-analytics': {
    configFieldDetails: {
      tenantId: {
        label: 'Coupa tenant id',
        type: 'string',
        maskedValue: null,
        helpText: 'Provided by Coupa onboarding team.',
      },
      apiKey: {
        label: 'API key',
        type: 'secret',
        maskedValue: null,
        helpText: 'Never displayed. Vault-managed.',
      },
    },
    requirements: [
      { surface: 'Programs · BAFO analysis', required: false, notes: 'Manual export is the interim path.' },
    ],
    errorLog: [
      {
        timestamp: seedTimestamp('conn-apex-spend:dfr', 72),
        level: 'info',
        message: 'Deferred to post-pilot. Manual export approved as workaround.',
      },
    ],
  },
  'conn-apex-contract-mgmt': {
    configFieldDetails: {
      apiBaseUrl: {
        label: 'Icertis API base URL',
        type: 'url',
        maskedValue: 'https://••••.icertis.com/api',
        helpText: 'Tenant-specific endpoint.',
      },
      apiKey: {
        label: 'API key',
        type: 'secret',
        maskedValue: '••••••••',
        helpText: 'Stub credential — not validated against live service.',
      },
      fieldMapVersion: {
        label: 'Field map version',
        type: 'enum',
        maskedValue: 'v2024.07',
        helpText: 'Contract field mapping version pinned for the pilot.',
      },
    },
    requirements: [
      { surface: 'Programs · Contract lifecycle', required: true, notes: 'Primary surface for pilot.' },
      { surface: 'Intelligence · Risk patterns', required: true, notes: 'Renewal + expiry signals.' },
      { surface: 'Tower · Contract dossier', required: true, notes: 'Per-contract pull-through.' },
    ],
    errorLog: [
      {
        timestamp: seedTimestamp('conn-apex-contract:i1', 8),
        level: 'info',
        message: 'Stub validated against fixtures — live test deferred.',
      },
      {
        timestamp: seedTimestamp('conn-apex-contract:w1', 30),
        level: 'warn',
        message: 'Field mapping review pending Steward sign-off.',
      },
    ],
  },
  'conn-apex-market-intel': {
    configFieldDetails: {
      subscriptionTier: {
        label: 'Subscription tier',
        type: 'enum',
        maskedValue: null,
        helpText: 'Tier dictates available category coverage.',
      },
      apiKey: {
        label: 'API key',
        type: 'secret',
        maskedValue: null,
        helpText: 'Provisioned post-procurement.',
      },
    },
    requirements: [
      { surface: 'Intelligence · Category outlooks', required: false, notes: 'Optional — qualitative briefs only.' },
    ],
    errorLog: [
      {
        timestamp: seedTimestamp('conn-apex-mi:nopro', 96),
        level: 'warn',
        message: 'Subscription not procured.',
      },
    ],
  },
  'conn-apex-vendor-portal': {
    configFieldDetails: {
      portalBaseUrl: {
        label: 'Portal base URL',
        type: 'url',
        maskedValue: null,
        helpText: 'Internal portal endpoint.',
      },
      webhookSecret: {
        label: 'Webhook secret',
        type: 'secret',
        maskedValue: null,
        helpText: 'For BAFO callback verification.',
      },
    },
    requirements: [
      { surface: 'Programs · Vendor portfolio', required: false, notes: 'Manual BAFO intake covers pilot.' },
    ],
    errorLog: [
      {
        timestamp: seedTimestamp('conn-apex-vp:dfr', 120),
        level: 'info',
        message: 'Deferred pending vendor onboarding cohort.',
      },
    ],
  },
  'conn-apex-identity': {
    configFieldDetails: {
      publishableKey: {
        label: 'Clerk publishable key',
        type: 'string',
        maskedValue: 'pk_test_••••••••',
        helpText: 'Test environment key.',
      },
      secretKey: {
        label: 'Clerk secret key',
        type: 'secret',
        maskedValue: '••••••••',
        helpText: 'Server-only. Vault-managed.',
      },
      allowedRedirectOrigins: {
        label: 'Allowed redirect origins',
        type: 'string',
        maskedValue: 'https://app.example.com',
        helpText: 'Pilot URL allowlist.',
      },
    },
    requirements: [
      { surface: 'Admin · Users & access', required: true, notes: 'All admin gating relies on Clerk metadata.' },
      { surface: 'Programs · Audit', required: true, notes: 'User attribution.' },
    ],
    errorLog: [
      {
        timestamp: seedTimestamp('conn-apex-id:ok', 1),
        level: 'info',
        message: 'Stub session validated.',
      },
      {
        timestamp: seedTimestamp('conn-apex-id:warn', 14),
        level: 'warn',
        message: 'Production SSO domain verification not started.',
      },
    ],
  },
  'conn-apex-ms-graph': {
    configFieldDetails: {
      tenantId: {
        label: 'Microsoft Entra tenant id',
        type: 'string',
        maskedValue: 'tenant-****',
        helpText: 'Required for W4 OAuth; masked in W3 and not validated live.',
      },
      clientId: {
        label: 'Application client id',
        type: 'string',
        maskedValue: 'app-****',
        helpText: 'Microsoft Graph app registration id; no live app lookup is performed.',
      },
      clientSecret: {
        label: 'Client secret',
        type: 'secret',
        maskedValue: '••••••••',
        helpText: 'Secret reference only. W3 does not store or exchange Graph credentials.',
      },
      redirectUri: {
        label: 'Redirect URI',
        type: 'url',
        maskedValue: 'https://app.abarva.ai/api/setup/microsoft-graph/callback',
        helpText: 'Planned W4 callback boundary; inactive in this deterministic seed.',
      },
      adminConsent: {
        label: 'Admin consent',
        type: 'enum',
        maskedValue: 'not granted',
        helpText: 'Tenant admin consent is required before any live Graph test.',
      },
      requiredScopes: {
        label: 'Required scopes',
        type: 'enum',
        maskedValue: 'User.Read.All, Group.Read.All, Directory.Read.All, Calendars.Read, Mail.ReadBasic.All, Reports.Read.All',
        helpText: 'Scope contract only. These scopes are not active in W3.',
      },
    },
    requirements: [
      { surface: 'Admin · Users & access', required: true, notes: 'Users and groups require W4 OAuth before use.' },
      { surface: 'Setup · Connector health', required: true, notes: 'Health row must stay not configured until live consent exists.' },
      { surface: 'Tower · Usage evidence', required: false, notes: 'Usage reports remain out of runtime scope in W3.' },
    ],
    errorLog: [
      {
        timestamp: seedTimestamp('conn-apex-ms-graph:block', 12),
        level: 'warn',
        message: 'Configure/test blocked until Setup W4 implements Microsoft Graph OAuth.',
      },
    ],
  },
  'conn-meridian-identity': {
    configFieldDetails: {
      publishableKey: {
        label: 'Clerk publishable key',
        type: 'string',
        maskedValue: 'pk_test_••••••••',
        helpText: 'Test environment key.',
      },
      secretKey: {
        label: 'Clerk secret key',
        type: 'secret',
        maskedValue: '••••••••',
        helpText: 'Server-only.',
      },
    },
    requirements: [
      { surface: 'Admin · Users & access', required: true, notes: 'Tenant gate.' },
    ],
    errorLog: [
      {
        timestamp: seedTimestamp('conn-meridian-id:ok', 1),
        level: 'info',
        message: 'Stub session validated.',
      },
    ],
  },
  'conn-meridian-erp': {
    configFieldDetails: {
      apiBaseUrl: {
        label: 'API base URL',
        type: 'url',
        maskedValue: null,
        helpText: 'Tenant-specific endpoint.',
      },
      apiKey: {
        label: 'API key',
        type: 'secret',
        maskedValue: null,
        helpText: 'Provisioned post-IT-Security review.',
      },
    },
    requirements: [
      { surface: 'Programs · Source ingest', required: false, notes: 'Manual export covers Meridian pilot.' },
    ],
    errorLog: [
      {
        timestamp: seedTimestamp('conn-meridian-erp:warn', 36),
        level: 'warn',
        message: 'Credentials not provided.',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Detail builders
// ---------------------------------------------------------------------------

/**
 * Build the page-view config-field array from the adapter's configSchema +
 * the page-view enrichment seed. Returns [] if no schema fields available.
 */
function buildConfigFields(
  connectorId: string,
  adapterDetail: AdapterConnectorDetail | null,
): ReadonlyArray<ConnectorConfigField> {
  const schema = adapterDetail?.configSchema;
  const fieldKeys = Array.isArray(schema?.fields)
    ? (schema!.fields as string[])
    : [];
  const enrichment = CONNECTOR_ENRICHMENT[connectorId];
  if (!enrichment) return [];

  return fieldKeys.map((key) => {
    const ui = enrichment.configFieldDetails[key];
    if (!ui) {
      return {
        key,
        label: key,
        type: 'string' as const,
        required: true,
        maskedValue: null,
        helpText: '',
      };
    }
    return {
      key,
      label: ui.label,
      type: ui.type,
      required: true, // all known fields are required in fixture seed
      maskedValue: ui.maskedValue,
      helpText: ui.helpText,
    };
  });
}

function buildSyncAttempts(connector: ConnectorReadiness): {
  last: ConnectorSyncAttempt;
  recent: ConnectorSyncAttempt[];
} {
  const recent: ConnectorSyncAttempt[] = [];
  const baseHashes: Array<{ hoursAgo: number; outcome: ConnectorSyncAttempt['outcome']; message: string }> =
    connector.status === 'configured_stub'
      ? [
          { hoursAgo: 1, outcome: 'success_stub', message: 'Stub fixture replayed end-to-end.' },
          { hoursAgo: 7, outcome: 'success_stub', message: 'Schema validated against pilot snapshot.' },
          { hoursAgo: 19, outcome: 'skipped', message: 'Skipped — Steward review pending.' },
        ]
      : connector.status === 'deferred'
        ? [
            { hoursAgo: 24, outcome: 'skipped', message: 'Deferred — manual workaround active.' },
            { hoursAgo: 72, outcome: 'skipped', message: 'Deferred during pilot scoping.' },
          ]
        : [
            { hoursAgo: 12, outcome: 'pending', message: 'Awaiting credentials.' },
            { hoursAgo: 48, outcome: 'failure', message: 'No credentials configured.' },
          ];
  for (let i = 0; i < baseHashes.length; i++) {
    const a = baseHashes[i];
    const seedKey = `${connector.id}:attempt:${i}`;
    const hash = seedHash(seedKey);
    recent.push({
      occurredAt: seedTimestamp(seedKey, a.hoursAgo),
      outcome: a.outcome,
      message: a.message,
      durationMs: 120 + (hash % 880),
    });
  }
  const last = recent[0];
  return { last, recent };
}

function buildDetail(
  connector: ConnectorReadiness,
  adapterDetail: AdapterConnectorDetail | null,
): ConnectorDetail {
  const baseline =
    connector.status === 'configured_stub' ? 88
      : connector.status === 'deferred' ? 60
        : 45;
  const { last, recent } = buildSyncAttempts(connector);
  const enrichment = CONNECTOR_ENRICHMENT[connector.id];
  const schema = adapterDetail?.configSchema;
  const docsHref =
    typeof schema?.docsHref === 'string' ? (schema.docsHref as string) : '';
  return {
    id: connector.id,
    vendor: adapterDetail?.vendor ?? '',
    docsHref,
    configFields: buildConfigFields(connector.id, adapterDetail),
    lastSyncAttempt: last,
    recentAttempts: recent,
    errorLog: enrichment?.errorLog ?? [],
    requirements: enrichment?.requirements ?? [],
    healthTrend: buildHealthTrend(`${connector.id}:trend`, baseline),
  };
}

// ---------------------------------------------------------------------------
// Helper: locate detail entry by id (preserved across the refactor for
// component callers that need a typed lookup).
// ---------------------------------------------------------------------------

export function findConnectorDetail(
  view: ConnectorsPageView,
  connectorId: string,
): ConnectorDetail | null {
  return view.connectorDetailMap[connectorId] ?? null;
}

// ---------------------------------------------------------------------------
// Page-view builder
// ---------------------------------------------------------------------------

function buildCategories(
  connectors: ReadonlyArray<ConnectorReadiness>,
): ConnectorCategoryGroup[] {
  const byKind = new Map<ConnectorKind, ConnectorReadiness[]>();
  for (const c of connectors) {
    const arr = byKind.get(c.kind) ?? [];
    arr.push(c);
    byKind.set(c.kind, arr);
  }
  const out: ConnectorCategoryGroup[] = [];
  for (const kind of CATEGORY_ORDER) {
    const list = byKind.get(kind);
    if (!list || list.length === 0) continue;
    out.push({
      kind,
      label: CATEGORY_LABELS[kind],
      connectors: list,
      pilotBlockerCount: list.filter(
        (c) => c.requiredForPilot && c.status !== 'configured_stub',
      ).length,
      configuredCount: list.filter((c) => c.status === 'configured_stub').length,
      totalCount: list.length,
    });
  }
  return out;
}

function buildActions(pilotBlockerCount: number): ConnectorAction[] {
  return [
    {
      id: 'add-connector',
      label: 'Add connector',
      status: 'blocked',
      reason: HARD_GATE_REASON,
      hint: 'Available in pilot environment.',
    },
    {
      id: 'test-all',
      label: 'Test all connections',
      status: 'blocked',
      reason: HARD_GATE_REASON,
      hint:
        pilotBlockerCount > 0
          ? `${pilotBlockerCount} pilot blocker${pilotBlockerCount === 1 ? '' : 's'} would fail in this environment.`
          : 'No live adapters in this environment.',
    },
    {
      id: 'export-config',
      label: 'Export config',
      status: 'available',
      reason: null,
      hint: 'Downloads a deterministic snapshot of connector seeds.',
    },
  ];
}

export async function buildConnectorsPageView(
  tenantSlug: string = 'apex-retail',
): Promise<ConnectorsPageView> {
  const ctx = await buildAgentContextAsync(tenantSlug, 'admin', 'connectors');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  // ADMIN-DATA4: source connectors + per-connector detail from the adapter.
  const adapterRows = await getAdminConnectors(tenantSlug);

  const connectors: ConnectorReadiness[] = [];
  for (const row of adapterRows) {
    const r = rowToReadiness(row);
    if (r) connectors.push(r);
  }

  const detailMap: Record<string, ConnectorDetail> = {};
  for (const conn of connectors) {
    const adapterDetail = await getAdminConnectorDetail(tenantSlug, conn.id);
    detailMap[conn.id] = buildDetail(conn, adapterDetail);
  }

  const pilotBlockers = connectors.filter(
    (c) => c.requiredForPilot && c.status !== 'configured_stub',
  );
  const configuredCount = connectors.filter(
    (c) => c.status === 'configured_stub',
  ).length;
  const totalCount = connectors.length;

  const categories = buildCategories(connectors);
  const actions = buildActions(pilotBlockers.length);

  const connectorBody =
    `${configuredCount} of ${totalCount} connectors configured as stubs. ` +
    'None are live in this environment. Pilot cannot proceed until pilot-required connectors clear Steward review.';

  const blockerLabel =
    pilotBlockers.length > 0
      ? `${pilotBlockers.length} pilot blocker${pilotBlockers.length === 1 ? '' : 's'}`
      : undefined;

  return {
    eyebrow: 'External systems readiness',
    title: 'Connectors',
    subtitle:
      'Which external systems are configured, blocked, or deferred. None are live in this environment — all show stub or deferred status.',
    context: {
      tenant: ctx.tenant.name,
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: editorial.title,
      body: connectorBody,
      contextUsed: editorial.contextUsed,
      evidenceStrength: editorial.evidenceStrength,
      blocker: blockerLabel,
      primaryAction: editorial.primaryAction,
    },
    connectors,
    pilotBlockers,
    configuredCount,
    totalCount,
    caveat: DETERMINISTIC_CAVEAT,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Resolve connector blockers',
    primaryActionHref: '/admin/connectors#blockers',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,

    categories,
    connectorDetailMap: detailMap,
    actions,
    defaultTab: 'health',
    tabs: [
      { id: 'health', label: 'Health' },
      { id: 'requirements', label: 'Requirements' },
      { id: 'configuration', label: 'Configuration' },
      { id: 'logs', label: 'Logs' },
    ],
    hardGateReason: HARD_GATE_REASON,
  };
}
