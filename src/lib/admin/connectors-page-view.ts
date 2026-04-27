import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';
import {
  buildConnectorsReadinessView,
  type ConnectorReadiness,
  type ConnectorKind,
} from './connectors-readiness-view';

// ---------------------------------------------------------------------------
// ADMIN13 — Connectors depth view-model
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
  'Live connector adapter available in Wave 27. Hard-gated in this environment.';

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
// Per-connector detail builders
// ---------------------------------------------------------------------------

interface DetailSeed {
  vendor: string;
  docsHref: string;
  configFields: ReadonlyArray<ConnectorConfigField>;
  requirements: ReadonlyArray<ConnectorRequirement>;
  errorLog: ReadonlyArray<ConnectorLogEvent>;
}

const APEX_DETAIL_SEEDS: Readonly<Record<string, DetailSeed>> = {
  'conn-apex-erp': {
    vendor: 'SAP S/4HANA (planned)',
    docsHref: 'https://help.sap.com/docs/SAP_S4HANA_CLOUD',
    configFields: [
      {
        key: 'apiBaseUrl',
        label: 'API base URL',
        type: 'url',
        required: true,
        maskedValue: null,
        helpText: 'Tenant-specific S/4HANA OData endpoint.',
      },
      {
        key: 'clientId',
        label: 'OAuth client id',
        type: 'string',
        required: true,
        maskedValue: null,
        helpText: 'Issued by IT Security after consent approval.',
      },
      {
        key: 'clientSecret',
        label: 'OAuth client secret',
        type: 'secret',
        required: true,
        maskedValue: null,
        helpText: 'Stored in Vault. Never displayed.',
      },
      {
        key: 'dataDomains',
        label: 'In-scope data domains',
        type: 'enum',
        required: true,
        maskedValue: null,
        helpText: 'Spend, Vendors, Contracts, Invoices.',
      },
    ],
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
    vendor: 'Coupa Spend Analytics (deferred)',
    docsHref: 'https://success.coupa.com/Implement/Coupa_Connectors',
    configFields: [
      {
        key: 'tenantId',
        label: 'Coupa tenant id',
        type: 'string',
        required: true,
        maskedValue: null,
        helpText: 'Provided by Coupa onboarding team.',
      },
      {
        key: 'apiKey',
        label: 'API key',
        type: 'secret',
        required: true,
        maskedValue: null,
        helpText: 'Never displayed. Vault-managed.',
      },
    ],
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
    vendor: 'Icertis Contract Intelligence',
    docsHref: 'https://docs.icertis.com',
    configFields: [
      {
        key: 'apiBaseUrl',
        label: 'Icertis API base URL',
        type: 'url',
        required: true,
        maskedValue: 'https://••••.icertis.com/api',
        helpText: 'Tenant-specific endpoint.',
      },
      {
        key: 'apiKey',
        label: 'API key',
        type: 'secret',
        required: true,
        maskedValue: '••••••••',
        helpText: 'Stub credential — not validated against live service.',
      },
      {
        key: 'fieldMapVersion',
        label: 'Field map version',
        type: 'enum',
        required: true,
        maskedValue: 'v2024.07',
        helpText: 'Contract field mapping version pinned for the pilot.',
      },
    ],
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
    vendor: 'Beroe LiVE.Ai',
    docsHref: 'https://www.beroeinc.com/live/',
    configFields: [
      {
        key: 'subscriptionTier',
        label: 'Subscription tier',
        type: 'enum',
        required: true,
        maskedValue: null,
        helpText: 'Tier dictates available category coverage.',
      },
      {
        key: 'apiKey',
        label: 'API key',
        type: 'secret',
        required: true,
        maskedValue: null,
        helpText: 'Provisioned post-procurement.',
      },
    ],
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
    vendor: 'Internal vendor portal (deferred)',
    docsHref: 'https://example.com/docs/vendor-portal',
    configFields: [
      {
        key: 'portalBaseUrl',
        label: 'Portal base URL',
        type: 'url',
        required: true,
        maskedValue: null,
        helpText: 'Internal portal endpoint.',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook secret',
        type: 'secret',
        required: true,
        maskedValue: null,
        helpText: 'For BAFO callback verification.',
      },
    ],
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
    vendor: 'Clerk (test users)',
    docsHref: 'https://clerk.com/docs',
    configFields: [
      {
        key: 'publishableKey',
        label: 'Clerk publishable key',
        type: 'string',
        required: true,
        maskedValue: 'pk_test_••••••••',
        helpText: 'Test environment key.',
      },
      {
        key: 'secretKey',
        label: 'Clerk secret key',
        type: 'secret',
        required: true,
        maskedValue: '••••••••',
        helpText: 'Server-only. Vault-managed.',
      },
      {
        key: 'allowedRedirectOrigins',
        label: 'Allowed redirect origins',
        type: 'string',
        required: true,
        maskedValue: 'https://app.example.com',
        helpText: 'Pilot URL allowlist.',
      },
    ],
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
};

const MERIDIAN_DETAIL_SEEDS: Readonly<Record<string, DetailSeed>> = {
  'conn-meridian-identity': {
    vendor: 'Clerk (test users)',
    docsHref: 'https://clerk.com/docs',
    configFields: [
      {
        key: 'publishableKey',
        label: 'Clerk publishable key',
        type: 'string',
        required: true,
        maskedValue: 'pk_test_••••••••',
        helpText: 'Test environment key.',
      },
      {
        key: 'secretKey',
        label: 'Clerk secret key',
        type: 'secret',
        required: true,
        maskedValue: '••••••••',
        helpText: 'Server-only.',
      },
    ],
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
    vendor: 'Workday Financials (planned)',
    docsHref: 'https://doc.workday.com',
    configFields: [
      {
        key: 'apiBaseUrl',
        label: 'API base URL',
        type: 'url',
        required: true,
        maskedValue: null,
        helpText: 'Tenant-specific endpoint.',
      },
      {
        key: 'apiKey',
        label: 'API key',
        type: 'secret',
        required: true,
        maskedValue: null,
        helpText: 'Provisioned post-IT-Security review.',
      },
    ],
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

function seedsFor(tenantSlug: string): Readonly<Record<string, DetailSeed>> {
  return tenantSlug === 'meridian' ? MERIDIAN_DETAIL_SEEDS : APEX_DETAIL_SEEDS;
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
  seed: DetailSeed,
): ConnectorDetail {
  const baseline =
    connector.status === 'configured_stub' ? 88
      : connector.status === 'deferred' ? 60
        : 45;
  const { last, recent } = buildSyncAttempts(connector);
  return {
    id: connector.id,
    vendor: seed.vendor,
    docsHref: seed.docsHref,
    configFields: seed.configFields,
    lastSyncAttempt: last,
    recentAttempts: recent,
    errorLog: seed.errorLog,
    requirements: seed.requirements,
    healthTrend: buildHealthTrend(`${connector.id}:trend`, baseline),
  };
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

export function buildConnectorsPageView(): ConnectorsPageView {
  const tenantSlug = 'apex-retail';
  const ctx = buildAgentContext(tenantSlug, 'admin', 'connectors');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  const readiness = buildConnectorsReadinessView(tenantSlug);
  const seeds = seedsFor(tenantSlug);

  const detailMap: Record<string, ConnectorDetail> = {};
  for (const conn of readiness.connectors) {
    const seed = seeds[conn.id];
    if (!seed) continue;
    detailMap[conn.id] = buildDetail(conn, seed);
  }

  const categories = buildCategories(readiness.connectors);
  const actions = buildActions(readiness.pilotBlockers.length);

  const connectorBody =
    `${readiness.configuredCount} of ${readiness.totalCount} connectors configured as stubs. ` +
    'None are live in this environment. Pilot cannot proceed until pilot-required connectors clear Steward review.';

  const blockerLabel =
    readiness.pilotBlockers.length > 0
      ? `${readiness.pilotBlockers.length} pilot blocker${readiness.pilotBlockers.length === 1 ? '' : 's'}`
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
    connectors: readiness.connectors,
    pilotBlockers: readiness.pilotBlockers,
    configuredCount: readiness.configuredCount,
    totalCount: readiness.totalCount,
    caveat: readiness.caveat,
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
