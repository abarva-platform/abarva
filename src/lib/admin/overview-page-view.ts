import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext, buildAgentContextAsync } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';
import { getAdminOverviewSnapshot } from '@/lib/admin/data/admin-overview-adapter';
import { isFixtureMode } from '@/lib/admin/data/admin-data-mode';

export type OverviewSetupStatus = 'done' | 'in_progress' | 'pending';

export interface OverviewSetupItem {
  id: string;
  label: string;
  status: OverviewSetupStatus;
  description: string;
}

export interface OverviewRecentActivityItem {
  id: string;
  category: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface OverviewCrossPageCounts {
  openBlockers: number;
  datasetsPendingApproval: number;
  connectorsNotConfigured: number;
  invitesPending: number;
  productionReadinessGatesFailing: number;
}

export interface OverviewPageView {
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
  setupItems: ReadonlyArray<OverviewSetupItem>;
  recentActivity: ReadonlyArray<OverviewRecentActivityItem>;
  crossPageCounts: OverviewCrossPageCounts;
  dataMode: 'fixture' | 'live';
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
}

export async function buildOverviewPageView(): Promise<OverviewPageView> {
  const ctx = await buildAgentContextAsync('apex-retail', 'admin', 'overview');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  // Fetch snapshot from adapter (fixture or live depending on ADMIN_DATA_MODE)
  const snapshot = await getAdminOverviewSnapshot('apex-retail');
  const dataMode = isFixtureMode() ? 'fixture' : 'live';

  const setupItems: OverviewSetupItem[] = snapshot.setupSteps.map((step) => ({
    id: step.id.replace(/_/g, '-'),
    label: step.label,
    status: step.status as OverviewSetupStatus,
    description: step.description,
  }));

  const recentActivity: OverviewRecentActivityItem[] = snapshot.recentActivity.map((e) => ({
    id: e.id,
    category: e.category,
    action: e.action,
    summary: e.summary,
    createdAt: e.createdAt,
  }));

  return {
    eyebrow: 'Steward-led control plane orientation',
    title: 'Setup overview',
    subtitle:
      'What needs setup before AbarVa can run a tenant in pilot. The Steward holds this control plane.',
    context: {
      tenant: ctx.tenant.name,
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: dataMode === 'live' ? 'Live DB' : 'Manifest + seeds',
      liveStatus: dataMode === 'live' ? 'Live' : 'Fixture',
      liveStatusKind: dataMode === 'live' ? 'live' : 'deferred',
    },
    editorial: {
      title: editorial.title,
      body: editorial.body,
      contextUsed: editorial.contextUsed,
      evidenceStrength: editorial.evidenceStrength,
      blocker: editorial.blocker ?? undefined,
      primaryAction: editorial.primaryAction,
    },
    setupItems,
    recentActivity,
    crossPageCounts: snapshot.crossPageCounts,
    dataMode,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open Production Readiness',
    primaryActionHref: '/admin/production-readiness',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
  };
}
