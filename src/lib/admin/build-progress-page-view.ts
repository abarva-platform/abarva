import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';

export type BuildWaveStatus = 'merged' | 'in_progress' | 'planned' | 'blocked' | 'deferred';

export interface BuildWaveRow {
  id: string;
  title: string;
  status: BuildWaveStatus;
  percentComplete: number;
  note: string;
}

export interface BuildProgressPageView {
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
  waves: ReadonlyArray<BuildWaveRow>;
  slicesShipped: number;
  slicesPlanned: number;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
}

const WAVES: ReadonlyArray<BuildWaveRow> = [
  {
    id: 'wave-0',
    title: 'Agentic Spine Foundation',
    status: 'merged',
    percentComplete: 98,
    note: 'Surfaces, contracts, page catalog, and architecture in place',
  },
  {
    id: 'wave-32',
    title: 'Agent Surface Completion',
    status: 'merged',
    percentComplete: 100,
    note: 'Connector readiness, dataset trust, mission queue read-models landed',
  },
  {
    id: 'wave-admin-redesign',
    title: 'Admin Surface Canonical Redesign',
    status: 'in_progress',
    percentComplete: 62,
    note: 'AdminCanonShellV2 + 6 admin sub-pages wired across ADMIN1–6',
  },
  {
    id: 'wave-prat-demo',
    title: 'Prat Demo Density Pass',
    status: 'planned',
    percentComplete: 0,
    note: 'Page-density plan staged for marketing + product surfaces',
  },
];

export function buildBuildProgressPageView(): BuildProgressPageView {
  const merged = WAVES.filter((w) => w.status === 'merged').length;

  return {
    eyebrow: 'Build orchestration',
    title: 'Build Progress',
    subtitle:
      'Waves shipped, slices completed, blockers active. Deterministic snapshot — not a live deploy monitor.',
    context: {
      tenant: 'AbarVa platform',
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Build manifest',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: 'Steward editorial · Build posture',
      body:
        `${merged} waves merged. Admin redesign in progress. The page does not poll CI or Vercel; it reflects the canonical build manifest only.`,
      contextUsed: ['build manifest snapshot', 'wave lifecycle catalog', 'admin shell config'],
      evidenceStrength: 'partial',
      primaryAction: { label: 'Open build dashboard', href: '/platform/admin/build-progress' },
    },
    waves: WAVES,
    slicesShipped: 5,
    slicesPlanned: 8,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open build dashboard',
    primaryActionHref: '/platform/admin/build-progress',
    deterministicSeed: true,
  };
}
