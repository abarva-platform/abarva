import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
  type AgentRole,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';
import { DEFAULT_AGENT_CARDS, type AgentCardModel, type AgentPosture } from './admin-shell-config';

export interface AgentPostureRow extends AgentCardModel {
  summary: string;
  topGap: string;
}

// ---------------------------------------------------------------------------
// ADMIN12 — Depth additions
// ---------------------------------------------------------------------------

export type AgentReadinessTabKey =
  | 'overview'
  | 'steward'
  | 'nexus'
  | 'sentinel'
  | 'atlas';

export interface AgentReadinessTabMeta {
  key: AgentReadinessTabKey;
  label: string;
  description: string;
}

export type ContextCoverageLevel =
  | 'decision_grade'
  | 'partial'
  | 'thin'
  | 'none';

export type AgentReadinessSurfaceKey =
  | 'programs'
  | 'source'
  | 'intelligence'
  | 'tower'
  | 'admin';

export interface ContextCoverageMatrixRow {
  agent: AgentRole;
  agentLabel: string;
  cells: ReadonlyArray<{
    surface: AgentReadinessSurfaceKey;
    surfaceLabel: string;
    level: ContextCoverageLevel;
    note: string;
  }>;
}

export interface AgentDetailModel {
  id: AgentRole;
  label: string;
  governs: string;
  posture: AgentPosture;
  postureReason: string;
  unblockBy: string | null;
  contextCoverage: ReadonlyArray<{
    surface: AgentReadinessSurfaceKey;
    surfaceLabel: string;
    level: ContextCoverageLevel;
    note: string;
  }>;
  canDo: ReadonlyArray<string>;
  cannotDo: ReadonlyArray<string>;
  unblockedBy: string;
}

export interface AgentReadinessActionRow {
  id: 'open_runtime_config' | 'review_contracts';
  label: string;
  status: 'hard_gated' | 'safe';
  reason?: string;
  href?: string;
}

export interface AgentReadinessPageView {
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
  agents: ReadonlyArray<AgentPostureRow>;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
  // ADMIN12 depth fields
  tabs: ReadonlyArray<AgentReadinessTabMeta>;
  defaultTab: AgentReadinessTabKey;
  agentDetailMap: Readonly<Record<AgentRole, AgentDetailModel>>;
  contextCoverageMatrix: ReadonlyArray<ContextCoverageMatrixRow>;
  actionStrip: ReadonlyArray<AgentReadinessActionRow>;
}

const AGENT_DETAIL: Record<AgentCardModel['id'], { summary: string; topGap: string }> = {
  steward: {
    summary: 'Holds the gate, access, and readiness posture across the tenant.',
    topGap: 'Live access mutation pipeline not wired',
  },
  nexus: {
    summary: 'Workflow orchestration over deterministic mission queue.',
    topGap: 'Live mission queue not connected',
  },
  sentinel: {
    summary: 'Pattern detection over evidence ledger.',
    topGap: 'Confidence scoring not wired to live evidence',
  },
  atlas: {
    summary: 'Executive tradeoff briefing across portfolio.',
    topGap: 'Pressure cards run on seed data only',
  },
};

const AGENT_LABELS: Record<AgentRole, string> = {
  steward: 'Steward',
  nexus: 'Nexus',
  sentinel: 'Sentinel',
  atlas: 'Atlas',
};

const AGENT_GOVERNS: Record<AgentRole, string> = {
  steward: 'Gate, access, readiness',
  nexus: 'Workflow orchestration',
  sentinel: 'Evidence gaps',
  atlas: 'Executive tradeoffs',
};

const SURFACE_LABELS: Record<AgentReadinessSurfaceKey, string> = {
  programs: 'Programs',
  source: 'Source',
  intelligence: 'Intelligence',
  tower: 'Tower',
  admin: 'Admin',
};

const TABS: ReadonlyArray<AgentReadinessTabMeta> = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'All four agents at a glance · posture grid + context matrix',
  },
  {
    key: 'steward',
    label: 'Steward',
    description: 'Gate, access, readiness posture',
  },
  {
    key: 'nexus',
    label: 'Nexus',
    description: 'Workflow orchestration over the mission queue',
  },
  {
    key: 'sentinel',
    label: 'Sentinel',
    description: 'Pattern detection over the evidence ledger',
  },
  {
    key: 'atlas',
    label: 'Atlas',
    description: 'Executive tradeoff briefing across portfolio',
  },
];

const DEFAULT_TAB: AgentReadinessTabKey = 'overview';

const VALID_TABS: ReadonlyArray<AgentReadinessTabKey> = [
  'overview',
  'steward',
  'nexus',
  'sentinel',
  'atlas',
];

export function resolveAgentReadinessTab(
  input: string | undefined,
): AgentReadinessTabKey {
  if (!input) return DEFAULT_TAB;
  const found = VALID_TABS.find((t) => t === input);
  return found ?? DEFAULT_TAB;
}

// ---------------------------------------------------------------------------
// Per-agent capabilities (deterministic — honest about what works today)
// ---------------------------------------------------------------------------

const AGENT_CAPABILITIES: Record<
  AgentRole,
  { canDo: ReadonlyArray<string>; cannotDo: ReadonlyArray<string>; unblockedBy: string }
> = {
  steward: {
    canDo: [
      'Read evidence manifest from the deterministic seed',
      'Compute readiness gate from the AGENT1 context bundle',
      'Surface blockers and pilot risks per tenant',
      'Render posture pills (BLOCKED/PARTIAL/THIN/READY)',
    ],
    cannotDo: [
      'Write approvals to a live access store',
      'Execute SSO configuration against an IdP',
      'Mutate dataset state in any tenant',
      'Call any model — purely deterministic today',
    ],
    unblockedBy: 'Wave 27 model gateway + write tool registry',
  },
  nexus: {
    canDo: [
      'Build a deterministic agent choice list (top-K) from context',
      'Read pending decisions from the manifest',
      'Compute orchestration posture from blockers + decisions',
    ],
    cannotDo: [
      'Dispatch missions to a live worker queue',
      'Coordinate multi-step workflows across surfaces',
      'Persist orchestration state across sessions',
    ],
    unblockedBy: 'Wave 27 mission queue + workflow runtime',
  },
  sentinel: {
    canDo: [
      'Detect pattern triggers from the seeded pattern library',
      'Score evidence strength deterministically (strong/partial/thin)',
      'Surface evidence gaps per work-object',
    ],
    cannotDo: [
      'Stream live signal from connectors in real time',
      'Compute pattern confidence on live evidence',
      'Open or close patterns autonomously',
    ],
    unblockedBy: 'Wave 27 connector streams + confidence model',
  },
  atlas: {
    canDo: [
      'Surface pressure cards from the seeded portfolio',
      'Compose executive tradeoff briefs from manifest data',
      'Read posture across the portfolio for sponsor view',
    ],
    cannotDo: [
      'Pull live KPI deltas from connected data warehouses',
      'Generate net-new tradeoff scenarios on demand',
      'Persist decisions back to the program backbone',
    ],
    unblockedBy: 'Wave 27 portfolio warehouse + decision write-back',
  },
};

// ---------------------------------------------------------------------------
// Context coverage matrix (deterministic per agent × surface)
// ---------------------------------------------------------------------------

interface CoverageCellSeed {
  level: ContextCoverageLevel;
  note: string;
}

const COVERAGE: Record<
  AgentRole,
  Record<AgentReadinessSurfaceKey, CoverageCellSeed>
> = {
  steward: {
    admin: { level: 'decision_grade', note: 'Manifest + posture + blockers fully wired' },
    programs: { level: 'partial', note: 'Phase gate posture wired; access mutation deferred' },
    source: { level: 'partial', note: 'Evidence strength visible; approval pipeline deferred' },
    intelligence: { level: 'thin', note: 'Read posture only; no scoring access' },
    tower: { level: 'thin', note: 'Read posture only; no executive write path' },
  },
  nexus: {
    programs: { level: 'decision_grade', note: 'Mission slate + pending decisions wired' },
    source: { level: 'partial', note: 'Reads dataset state; cannot dispatch ingest jobs' },
    intelligence: { level: 'partial', note: 'Reads pattern queue; cannot orchestrate runs' },
    tower: { level: 'thin', note: 'No live workflow context — pressure cards only' },
    admin: { level: 'thin', note: 'No orchestration scope on admin surfaces' },
  },
  sentinel: {
    intelligence: { level: 'decision_grade', note: 'Pattern library + evidence ledger fully wired' },
    source: { level: 'partial', note: 'Evidence ledger wired; live connector signal deferred' },
    programs: { level: 'partial', note: 'Pattern triggers per phase wired; live confidence deferred' },
    tower: { level: 'thin', note: 'Read-only signal surfacing for pressure cards' },
    admin: { level: 'none', note: 'Sentinel has no admin surface scope today' },
  },
  atlas: {
    tower: { level: 'decision_grade', note: 'Portfolio brief + pressure cards fully wired' },
    programs: { level: 'partial', note: 'Reads portfolio posture; no per-program brief writes' },
    intelligence: { level: 'thin', note: 'Read scoring only; no tradeoff synthesis' },
    source: { level: 'thin', note: 'Read evidence summary; no raw-dataset reach' },
    admin: { level: 'none', note: 'Atlas has no admin surface scope today' },
  },
};

const SURFACE_ORDER: ReadonlyArray<AgentReadinessSurfaceKey> = [
  'programs',
  'source',
  'intelligence',
  'tower',
  'admin',
];

const AGENT_ORDER: ReadonlyArray<AgentRole> = ['steward', 'nexus', 'sentinel', 'atlas'];

function buildCoverageRow(agent: AgentRole): ContextCoverageMatrixRow {
  return {
    agent,
    agentLabel: AGENT_LABELS[agent],
    cells: SURFACE_ORDER.map((surface) => ({
      surface,
      surfaceLabel: SURFACE_LABELS[surface],
      level: COVERAGE[agent][surface].level,
      note: COVERAGE[agent][surface].note,
    })),
  };
}

// ---------------------------------------------------------------------------
// Action strip
// ---------------------------------------------------------------------------

const SEED_ACTION_STRIP: ReadonlyArray<AgentReadinessActionRow> = [
  {
    id: 'open_runtime_config',
    label: 'Open agent runtime config',
    status: 'hard_gated',
    reason: 'Available with model gateway in Wave 27',
  },
  {
    id: 'review_contracts',
    label: 'Review agent contracts',
    status: 'safe',
    href: '/admin/agent-readiness?agent=overview&review=contracts',
  },
];

function postureBlocker(posture: AgentPosture): boolean {
  return posture === 'BLOCKED';
}

function lookupPosture(
  postures: ReadonlyArray<AgentFoundationPosture>,
  agent: AgentRole,
): AgentFoundationPosture | undefined {
  return postures.find((p) => p.agent === agent);
}

function buildAgentDetailMap(
  postures: ReadonlyArray<AgentFoundationPosture>,
  agentRows: ReadonlyArray<AgentPostureRow>,
): Record<AgentRole, AgentDetailModel> {
  const out: Partial<Record<AgentRole, AgentDetailModel>> = {};
  for (const agent of AGENT_ORDER) {
    const row = agentRows.find((r) => r.id === agent);
    const posture = lookupPosture(postures, agent);
    const fallbackPosture: AgentPosture = row?.posture ?? 'THIN';
    const reason = posture?.reason ?? 'Posture computed from deterministic context bundle';
    out[agent] = {
      id: agent,
      label: AGENT_LABELS[agent],
      governs: AGENT_GOVERNS[agent],
      posture: fallbackPosture,
      postureReason: reason,
      unblockBy: posture?.unblockBy ?? null,
      contextCoverage: SURFACE_ORDER.map((surface) => ({
        surface,
        surfaceLabel: SURFACE_LABELS[surface],
        level: COVERAGE[agent][surface].level,
        note: COVERAGE[agent][surface].note,
      })),
      canDo: AGENT_CAPABILITIES[agent].canDo,
      cannotDo: AGENT_CAPABILITIES[agent].cannotDo,
      unblockedBy: AGENT_CAPABILITIES[agent].unblockedBy,
    };
  }
  return out as Record<AgentRole, AgentDetailModel>;
}

export function findAgentDetail(
  view: AgentReadinessPageView,
  agentId: string | undefined,
): AgentDetailModel | null {
  if (!agentId) return null;
  if (!AGENT_ORDER.includes(agentId as AgentRole)) return null;
  return view.agentDetailMap[agentId as AgentRole] ?? null;
}

export function buildAgentReadinessPageView(): AgentReadinessPageView {
  const ctx = buildAgentContext('apex-retail', 'admin', 'agent-readiness');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  const agents: ReadonlyArray<AgentPostureRow> = DEFAULT_AGENT_CARDS.map((agent) => ({
    ...agent,
    summary: AGENT_DETAIL[agent.id].summary,
    topGap: AGENT_DETAIL[agent.id].topGap,
  }));

  const blockedCount = agents.filter((a) => postureBlocker(a.posture)).length;
  const blockerLabel =
    editorial.blocker ?? (blockedCount > 0 ? `${blockedCount} agent blocked` : undefined);

  const agentDetailMap = buildAgentDetailMap(postures, agents);
  const contextCoverageMatrix: ReadonlyArray<ContextCoverageMatrixRow> = AGENT_ORDER.map(
    (agent) => buildCoverageRow(agent),
  );

  return {
    eyebrow: 'Agent posture across the four agents',
    title: 'Agent Readiness',
    subtitle:
      'Steward / Nexus / Sentinel / Atlas posture. Static manifest — not live agent execution.',
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
      blocker: blockerLabel,
      primaryAction: editorial.primaryAction,
    },
    agents,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open Steward posture',
    primaryActionHref: '/admin/agent-readiness?agent=steward',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
    tabs: TABS,
    defaultTab: DEFAULT_TAB,
    agentDetailMap,
    contextCoverageMatrix,
    actionStrip: SEED_ACTION_STRIP,
  };
}
