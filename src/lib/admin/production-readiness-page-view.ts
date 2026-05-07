/**
 * ADMIN5 — Production Readiness page read-model.
 * ADMIN16 — Depth extension: per-tile expand, blocker drawer, gate criteria,
 *           history strip, sub-nav tabs, action strip.
 * ADMIN-DATA8 — Tiles, blockers, gate criteria, and history strip now sourced
 *               from `admin-production-readiness-adapter` + `admin-blockers-adapter`.
 *               Builder is async; output shape preserved.
 *
 * Pure TypeScript read-model that drives the Production Readiness page wired
 * to AdminCanonShellV2. Demo READY / Pilot PARTIAL / Production BLOCKED is
 * the deterministic posture for the Apex Retail seed (in fixture mode).
 *
 * Never sets production_ready: true. Honestly says production is blocked.
 */

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
  mapBlockerRowToDetail,
  type BlockerDetail,
} from './blocker-detail-view';
import {
  getAdminBlockers,
  getAdminCriticalBlockers,
} from './data/admin-blockers-adapter';
import { getAdminProductionReadinessSnapshot } from './data/admin-production-readiness-adapter';
import type { AdminReadinessHistoryEntry } from './data/admin-production-readiness-adapter-types';

export type ReadinessTileStatus = 'ready' | 'partial' | 'blocked';

/**
 * Setup Fix Package PR 9 §2.1 — Pilot card "Needs:" list with each
 * blocker linked to the panel that resolves it. Optional because
 * Demo and Production tiles don't surface a generic blocker list
 * here (Demo has none; Production is governed by the Gate Criteria
 * matrix in the depth view).
 */
export interface ReadinessTileBlockerLink {
  /** Short blocker label (e.g. "Access"). */
  label: string;
  /** Action copy shown next to the label (e.g. "Configure SSO →"). */
  cta: string;
  /** Destination href for the action. */
  href: string;
}

export interface ReadinessTile {
  id: 'demo' | 'pilot' | 'production';
  label: string;
  statusLabel: string;
  status: ReadinessTileStatus;
  body: string;
  blockerCount: number;
  /** Linked blockers replacing the generic body sentence. PR 9 §2.1. */
  blockerLinks?: ReadonlyArray<ReadinessTileBlockerLink>;
}

// ---------------------------------------------------------------------------
// ADMIN16 — Depth additions
// ---------------------------------------------------------------------------

export type ProductionReadinessTabKey =
  | 'decision'
  | 'blockers'
  | 'gates'
  | 'history';

export interface ProductionReadinessTabMeta {
  key: ProductionReadinessTabKey;
  label: string;
  description: string;
}

export type GateCriterionStatus = 'pass' | 'partial' | 'fail';

export interface GateCriterion {
  id: string;
  label: string;
  status: GateCriterionStatus;
  evidenceBasis: string;
}

export interface GateCriteriaGroup {
  gateId: 'demo' | 'pilot' | 'production';
  gateLabel: string;
  status: ReadinessTileStatus;
  criteria: ReadonlyArray<GateCriterion>;
}

export interface ReadinessTileExpanded {
  tileId: 'demo' | 'pilot' | 'production';
  blockers: ReadonlyArray<BlockerDetail>;
  criteria: ReadonlyArray<GateCriterion>;
  unblocksNextTier: string;
}

export interface ReadinessHistoryEntry {
  id: string;
  timestamp: string;
  who: string;
  from: string;
  to: string;
  note: string;
}

export type ProductionReadinessActionId =
  | 'open_blocker_drawer'
  | 'run_readiness_check'
  | 'approve_gate'
  | 'export_readiness_report';

export interface ProductionReadinessActionRow {
  id: ProductionReadinessActionId;
  label: string;
  status: 'safe' | 'hard_gated';
  reason?: string;
  href?: string;
}

export interface ProductionReadinessPageView {
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
  tiles: ReadonlyArray<ReadinessTile>;
  topBlockers: ReadonlyArray<BlockerDetail>;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
  // ADMIN16 depth fields
  tabs: ReadonlyArray<ProductionReadinessTabMeta>;
  defaultTab: ProductionReadinessTabKey;
  tileDetailMap: Readonly<Record<'demo' | 'pilot' | 'production', ReadinessTileExpanded>>;
  gateCriteria: ReadonlyArray<GateCriteriaGroup>;
  historyStrip: ReadonlyArray<ReadinessHistoryEntry>;
  blockerDetailMap: Readonly<Record<string, BlockerDetail>>;
  actionStrip: ReadonlyArray<ProductionReadinessActionRow>;
}

// ---------------------------------------------------------------------------
// Deterministic depth seeds (tab metadata + action strip — UI-only, not data)
// ---------------------------------------------------------------------------

const TABS: ReadonlyArray<ProductionReadinessTabMeta> = [
  {
    key: 'decision',
    label: 'Decision',
    description: 'Steward editorial + Demo / Pilot / Production tiles.',
  },
  {
    key: 'blockers',
    label: 'Blockers',
    description: 'Top blockers ranked by severity and downstream impact.',
  },
  {
    key: 'gates',
    label: 'Gates',
    description: 'Per-gate criteria matrix with deterministic evidence basis.',
  },
  {
    key: 'history',
    label: 'History',
    description: 'Recent readiness state transitions (deterministic seed).',
  },
];

function buildGateCriteria(
  allBlockers: ReadonlyArray<BlockerDetail>,
  tenantName: string,
): ReadonlyArray<GateCriteriaGroup> {
  const pilotBlocked = allBlockers.some((b) => b.pilotImpact);
  const prodBlocked = allBlockers.some((b) => b.productionImpact);

  return [
    {
      gateId: 'demo',
      gateLabel: 'Demo',
      status: 'ready',
      criteria: [
        {
          id: 'demo-seed',
          label: 'Deterministic seed available',
          status: 'pass',
          evidenceBasis:
            `${tenantName} rich seed manifest present (Wave 2 deterministic).`,
        },
        {
          id: 'demo-route-shell',
          label: 'Route shell verified',
          status: 'pass',
          evidenceBasis:
            'AdminCanonShellV2 + EditorialCanvas wired across admin tree.',
        },
        {
          id: 'demo-guided-flow',
          label: 'Guided demo flow rehearsed',
          status: 'pass',
          evidenceBasis:
            'Steward editorial primary action surfaces blocker drawer entry.',
        },
      ],
    },
    {
      gateId: 'pilot',
      gateLabel: 'Pilot',
      status: pilotBlocked ? 'partial' : 'ready',
      criteria: [
        {
          id: 'pilot-connectors',
          label: 'Connectors configured',
          status: 'partial',
          evidenceBasis:
            'Connector readiness view — most connectors stub or not_configured.',
        },
        {
          id: 'pilot-evidence',
          label: 'Evidence approved',
          status: 'partial',
          evidenceBasis:
            'Evidence upload connector not wired; manual intake interim.',
        },
        {
          id: 'pilot-users',
          label: 'Users granted',
          status: 'pass',
          evidenceBasis:
            'Identity connector domain-verified (Wave 2 seed).',
        },
      ],
    },
    {
      gateId: 'production',
      gateLabel: 'Production',
      status: prodBlocked ? 'blocked' : 'partial',
      criteria: [
        {
          id: 'prod-model-gateway',
          label: 'Model gateway live',
          status: 'fail',
          evidenceBasis:
            'Model gateway component not_started in production manifest.',
        },
        {
          id: 'prod-audit-log',
          label: 'Audit log enabled',
          status: 'partial',
          evidenceBasis:
            'Audit log scaffold present; production retention contract pending.',
        },
        {
          id: 'prod-soc2',
          label: 'SOC2 controls met',
          status: 'fail',
          evidenceBasis:
            'SOC2 Type II certification not_started in trust runbook seed.',
        },
      ],
    },
  ];
}

function buildActionStrip(): ReadonlyArray<ProductionReadinessActionRow> {
  return [
    {
      id: 'open_blocker_drawer',
      label: 'Open blocker drawer',
      status: 'safe',
      href: '/admin/production-readiness?tab=blockers',
    },
    {
      id: 'run_readiness_check',
      label: 'Run readiness check',
      status: 'hard_gated',
      reason: 'Live readiness scan in Wave 27',
    },
    {
      id: 'approve_gate',
      label: 'Approve gate',
      status: 'hard_gated',
      reason: 'Approval write available in Wave 27',
    },
    {
      id: 'export_readiness_report',
      label: 'Export readiness report',
      status: 'safe',
      href: '/admin/production-readiness?export=report',
    },
  ];
}

// ---------------------------------------------------------------------------
// History mapping — adapter `AdminReadinessHistoryEntry` → page-view `ReadinessHistoryEntry`
// ---------------------------------------------------------------------------

function titleCase(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function ownerForScope(scope: string, status: string): string {
  // Founder approvals show up on the demo→ready transition; everything else
  // is steward-driven in the deterministic seed.
  if (scope === 'demo' && status === 'ready') return 'Founder';
  return 'Steward';
}

function mapHistoryEntry(
  entry: AdminReadinessHistoryEntry,
  index: number,
): ReadinessHistoryEntry {
  const label = `${titleCase(entry.scope)}: ${titleCase(entry.status)}`;
  return {
    id: `h-${index + 1}`,
    timestamp: entry.at,
    who: ownerForScope(entry.scope, entry.status),
    from: label,
    to: label,
    note: entry.note,
  };
}

// ---------------------------------------------------------------------------
// View-model builder — async; consumes admin-data adapters.
// ---------------------------------------------------------------------------

/**
 * PR 9 §2.2 — tenant-substituted copy for the Demo tile body and
 * for the demo-seed gate-criteria evidence basis. Falls back to
 * "Apex Retail Group" only when the caller doesn't pass a name.
 */
export async function buildProductionReadinessPageView(
  tenantSlug: string = 'apex-retail',
  tenantName: string = 'Apex Retail Group',
): Promise<ProductionReadinessPageView> {
  const ctx = await buildAgentContextAsync(tenantSlug, 'admin', 'production-readiness');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  const [allBlockerRows, criticalBlockerRows, snapshot] = await Promise.all([
    getAdminBlockers(tenantSlug),
    getAdminCriticalBlockers(tenantSlug),
    getAdminProductionReadinessSnapshot(tenantSlug),
  ]);

  const allBlockers = allBlockerRows.map(mapBlockerRowToDetail);
  const criticalBlockers = criticalBlockerRows.map(mapBlockerRowToDetail);

  const productionImpactCount = allBlockers.filter((b) => b.productionImpact).length;
  const pilotImpactCount = allBlockers.filter((b) => b.pilotImpact).length;

  // Surface critical first, then high-severity production-impact blockers, capped at 5.
  const rankedBlockers: BlockerDetail[] = [
    ...criticalBlockers,
    ...allBlockers.filter(
      (b) => b.severity !== 'critical' && b.productionImpact,
    ),
  ];
  const seen = new Set<string>();
  const topBlockers = rankedBlockers
    .filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    })
    .slice(0, 5);

  const tiles: ReadonlyArray<ReadinessTile> = [
    {
      id: 'demo',
      label: 'Demo',
      statusLabel: 'Ready',
      status: 'ready',
      body: `Guided demo can proceed with caveats. ${tenantName} rich seed available.`,
      blockerCount: 0,
    },
    {
      id: 'pilot',
      label: 'Pilot',
      statusLabel: 'Partial',
      status: 'partial',
      body: 'Needs:',
      blockerCount: pilotImpactCount,
      // PR 9 §2.1 — each blocker links directly to the panel that
      // resolves it. Anchors / query params are stable destinations
      // already wired by earlier PRs in this package.
      blockerLinks: [
        {
          label: 'Access',
          cta: 'Configure SSO →',
          href: '/admin/users-access/sso-configuration',
        },
        {
          label: 'Security',
          cta: 'Connector readiness review →',
          href: '/admin/connectors?tab=health',
        },
        {
          label: 'Connectors',
          cta: 'Pilot-required connectors →',
          href: '/admin/connectors?tab=requirements',
        },
        {
          label: 'Approvals',
          cta: 'Steward review queue →',
          href: '/admin',
        },
      ],
    },
    {
      id: 'production',
      label: 'Production',
      statusLabel: 'Blocked',
      status: 'blocked',
      body: 'Do not claim production readiness.',
      blockerCount: productionImpactCount,
    },
  ];

  const gateCriteria = buildGateCriteria(allBlockers, tenantName);
  const criteriaByGate = new Map<string, ReadonlyArray<GateCriterion>>();
  for (const g of gateCriteria) criteriaByGate.set(g.gateId, g.criteria);

  const tileDetailMap: Record<
    'demo' | 'pilot' | 'production',
    ReadinessTileExpanded
  > = {
    demo: {
      tileId: 'demo',
      blockers: [],
      criteria: criteriaByGate.get('demo') ?? [],
      unblocksNextTier:
        'Pilot tier unlocks once connectors are configured and evidence is approved.',
    },
    pilot: {
      tileId: 'pilot',
      blockers: allBlockers.filter((b) => b.pilotImpact),
      criteria: criteriaByGate.get('pilot') ?? [],
      unblocksNextTier:
        'Production tier unlocks once the model gateway is live, audit retention is contracted, and SOC2 controls are met.',
    },
    production: {
      tileId: 'production',
      blockers: allBlockers.filter((b) => b.productionImpact),
      criteria: criteriaByGate.get('production') ?? [],
      unblocksNextTier:
        'Production readiness is blocked until model gateway, audit log retention, and SOC2 controls are confirmed live.',
    },
  };

  const blockerDetailMap: Record<string, BlockerDetail> = {};
  for (const b of allBlockers) blockerDetailMap[b.id] = b;

  const historyStrip: ReadonlyArray<ReadinessHistoryEntry> = snapshot.history.map(
    (entry, idx) => mapHistoryEntry(entry, idx),
  );

  return {
    eyebrow: 'Demo, pilot, and production decision flow',
    title: 'Production Readiness',
    subtitle:
      'The canvas tells whether AbarVa can be demoed, piloted, or productionized — and what blocks each step.',
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
      body: editorial.body,
      contextUsed: editorial.contextUsed,
      evidenceStrength: editorial.evidenceStrength,
      blocker: editorial.blocker ?? undefined,
      primaryAction: editorial.primaryAction,
    },
    tiles,
    topBlockers,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open blocker drawer',
    primaryActionHref: '/admin/production-readiness?tab=blockers',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
    tabs: TABS,
    defaultTab: 'decision',
    tileDetailMap,
    gateCriteria,
    historyStrip,
    blockerDetailMap,
    actionStrip: buildActionStrip(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TAB_KEYS: ReadonlySet<ProductionReadinessTabKey> = new Set([
  'decision',
  'blockers',
  'gates',
  'history',
]);

export function resolveProductionReadinessTab(
  raw: string | undefined | null,
): ProductionReadinessTabKey {
  if (!raw) return 'decision';
  if (TAB_KEYS.has(raw as ProductionReadinessTabKey)) {
    return raw as ProductionReadinessTabKey;
  }
  return 'decision';
}

export function findBlockerDetail(
  view: ProductionReadinessPageView,
  blockerId: string | undefined | null,
): BlockerDetail | null {
  if (!blockerId) return null;
  return view.blockerDetailMap[blockerId] ?? null;
}

export function resolveExpandedTile(
  raw: string | undefined | null,
): 'demo' | 'pilot' | 'production' | null {
  if (raw === 'demo' || raw === 'pilot' || raw === 'production') return raw;
  return null;
}
