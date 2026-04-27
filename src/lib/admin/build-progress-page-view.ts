import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';

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
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
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
  const ctx = buildAgentContext('abarva-platform', 'admin', 'build-progress');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  const merged = WAVES.filter((w) => w.status === 'merged').length;

  // Build-progress body is data-dependent on the wave manifest. Foundation
  // editorial provides title + contextUsed + primaryAction.
  const buildBody =
    `${merged} waves merged. Admin redesign in progress. ` +
    'The page does not poll CI or Vercel; it reflects the canonical build manifest only.';

  return {
    eyebrow: 'Build orchestration',
    title: 'Build Progress',
    subtitle:
      'Waves shipped, slices completed, blockers active. Deterministic snapshot — not a live deploy monitor.',
    context: {
      tenant: ctx.tenant.name,
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Build manifest',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: editorial.title,
      body: buildBody,
      contextUsed: editorial.contextUsed,
      evidenceStrength: editorial.evidenceStrength,
      blocker: editorial.blocker ?? undefined,
      primaryAction: editorial.primaryAction,
    },
    waves: WAVES,
    slicesShipped: 5,
    slicesPlanned: 8,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open build dashboard',
    primaryActionHref: '/platform/admin/build-progress',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
  };
}
