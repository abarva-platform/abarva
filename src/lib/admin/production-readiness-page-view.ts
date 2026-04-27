/**
 * ADMIN5 — Production Readiness page read-model.
 * ADMIN16 — Depth extension: per-tile expand, blocker drawer, gate criteria,
 *           history strip, sub-nav tabs, action strip.
 *
 * Pure TypeScript read-model that drives the Production Readiness page wired
 * to AdminCanonShellV2. Demo READY / Pilot PARTIAL / Production BLOCKED is
 * the deterministic posture for the Apex Retail seed. Top blockers are
 * sourced from the W32F blocker-detail-view (do not mutate that file).
 *
 * Never sets production_ready: true. Honestly says production is blocked.
 */

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
  getAllBlockerDetails,
  getCriticalBlockers,
  type BlockerDetail,
} from './blocker-detail-view';

export type ReadinessTileStatus = 'ready' | 'partial' | 'blocked';

export interface ReadinessTile {
  id: 'demo' | 'pilot' | 'production';
  label: string;
  statusLabel: string;
  status: ReadinessTileStatus;
  body: string;
  blockerCount: number;
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
// Deterministic depth seeds
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

const HISTORY_STRIP: ReadonlyArray<ReadinessHistoryEntry> = [
  {
    id: 'h-1',
    timestamp: '2026-04-27',
    who: 'Steward',
    from: 'Pilot: Partial',
    to: 'Pilot: Partial',
    note: 'Connector blockers added (W32F seed expansion).',
  },
  {
    id: 'h-2',
    timestamp: '2026-04-21',
    who: 'Steward',
    from: 'Production: Blocked',
    to: 'Production: Blocked',
    note: 'SOC2 audit not initiated — production stays blocked.',
  },
  {
    id: 'h-3',
    timestamp: '2026-04-14',
    who: 'Founder',
    from: 'Demo: Partial',
    to: 'Demo: Ready',
    note: 'Apex Retail rich seed approved; guided demo cleared.',
  },
  {
    id: 'h-4',
    timestamp: '2026-04-07',
    who: 'Steward',
    from: 'Pilot: Blocked',
    to: 'Pilot: Partial',
    note: 'Identity connector verified; access path unblocked.',
  },
  {
    id: 'h-5',
    timestamp: '2026-03-31',
    who: 'Steward',
    from: 'Demo: Blocked',
    to: 'Demo: Partial',
    note: 'Initial Apex seed staged; guided demo provisional.',
  },
];

function buildGateCriteria(
  allBlockers: ReadonlyArray<BlockerDetail>,
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
            'Apex Retail rich seed manifest present (Wave 2 deterministic).',
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
// View-model builder
// ---------------------------------------------------------------------------

export function buildProductionReadinessPageView(
  tenantSlug: string = 'apex-retail',
): ProductionReadinessPageView {
  const ctx = buildAgentContext(tenantSlug, 'admin', 'production-readiness');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  const allBlockers = getAllBlockerDetails(tenantSlug);
  const criticalBlockers = getCriticalBlockers(tenantSlug);
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
      body: 'Guided demo can proceed with caveats. Apex Retail rich seed available.',
      blockerCount: 0,
    },
    {
      id: 'pilot',
      label: 'Pilot',
      statusLabel: 'Partial',
      status: 'partial',
      body: 'Needs access, security, connectors, approvals.',
      blockerCount: pilotImpactCount,
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

  const gateCriteria = buildGateCriteria(allBlockers);
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
    historyStrip: HISTORY_STRIP,
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
