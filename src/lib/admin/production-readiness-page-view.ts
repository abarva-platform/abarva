/**
 * ADMIN5 — Production Readiness page read-model.
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
}

export function buildProductionReadinessPageView(
  tenantSlug: string = 'apex-retail',
): ProductionReadinessPageView {
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

  return {
    eyebrow: 'Demo, pilot, and production decision flow',
    title: 'Production Readiness',
    subtitle:
      'The canvas tells whether AbarVa can be demoed, piloted, or productionized — and what blocks each step.',
    context: {
      tenant: 'Apex Retail',
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: 'Steward editorial · Readiness decision',
      body: 'Demo readiness is strong for Apex Retail. Pilot is partial. Production is blocked by live audit, model gateway execution, tenant security review, and Azure private data-plane proof.',
      contextUsed: ['readiness manifest', 'CI/Vercel status', 'wireframe audit'],
      evidenceStrength: 'partial',
      blocker: 'production controls',
      primaryAction: {
        label: 'Open blockers',
        href: '/admin/production-readiness#blockers',
      },
    },
    tiles,
    topBlockers,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open blocker drawer',
    primaryActionHref: '/admin/production-readiness#drawer',
    deterministicSeed: true,
  };
}
