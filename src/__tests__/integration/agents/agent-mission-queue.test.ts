// AG10 - Agent Mission Queue Read Model tests.
//
// Deterministic, file-pure suite for the AG10 read model. No network
// calls, no model providers, no migrations, no time-of-day dependence.

import {
  AGENT_MISSION_AGENTS,
  AGENT_MISSION_STATES,
  AGENT_MISSION_TYPES,
  buildAgentMissionQueue,
  buildAgentMissionsForAgent,
  buildAgentMissionsForSurface,
  getAgentMissionHandoffs,
  getTopAgentMissions,
  summarizeAgentMissionQueue,
  type AgentMission,
  type AgentMissionAgent,
  type AgentMissionPriority,
  type AgentMissionSurface,
  type AgentMissionUiVisibility,
} from '@/lib/agent/agent-mission-queue';

const ID_PATTERN = /^mission-seed-[a-z0-9-]+$/;

const VALID_AGENTS = new Set<AgentMissionAgent>(AGENT_MISSION_AGENTS);
const VALID_TYPES = new Set<string>(AGENT_MISSION_TYPES);
const VALID_STATES = new Set<string>(AGENT_MISSION_STATES);
const VALID_SURFACES = new Set<AgentMissionSurface>([
  'programs',
  'tower',
  'intelligence',
  'admin',
  'source',
]);
const VALID_VISIBILITY = new Set<AgentMissionUiVisibility>([
  'compact_strip',
  'right_panel',
  'inline_recommendation',
  'executive_brief',
  'hidden_drawer',
]);
const VALID_PRIORITIES = new Set<AgentMissionPriority>([
  'low',
  'medium',
  'high',
  'critical',
]);
const VALID_WORK_OBJECT_KINDS = new Set([
  'program',
  'phase',
  'workshop',
  'artifact',
  'pattern',
  'tower_dimension',
  'dataset_domain',
  'sourcing_event',
  'vendor_response',
]);
const VALID_HANDOFF_TRIGGERS = new Set([
  'evidence_weak',
  'gate_blocked',
  'executive_decision_needed',
  'workflow_allowed',
  'follow_up_needed',
  'missing_inputs',
]);

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildAgentMissionQueue · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildAgentMissionQueue());
    const second = JSON.stringify(buildAgentMissionQueue());
    const third = JSON.stringify(buildAgentMissionQueue());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('returns at least 12 seed missions', () => {
    expect(buildAgentMissionQueue().length).toBeGreaterThanOrEqual(12);
  });

  it('every mission is tagged createdFrom: deterministic_seed', () => {
    for (const mission of buildAgentMissionQueue()) {
      expect(mission.createdFrom).toBe('deterministic_seed');
    }
  });
});

// ---------------------------------------------------------------------
// Coverage of agents / types / states / surfaces
// ---------------------------------------------------------------------

describe('buildAgentMissionQueue · coverage', () => {
  it('represents all four agents at least once', () => {
    const missions = buildAgentMissionQueue();
    for (const agent of AGENT_MISSION_AGENTS) {
      const matching = missions.filter((mission) => mission.agent === agent);
      expect(matching.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every mission type is a valid AgentMissionType', () => {
    for (const mission of buildAgentMissionQueue()) {
      expect(VALID_TYPES.has(mission.type)).toBe(true);
    }
  });

  it('every mission state is a valid AgentMissionState', () => {
    for (const mission of buildAgentMissionQueue()) {
      expect(VALID_STATES.has(mission.state)).toBe(true);
    }
  });

  it('covers each of the 5 surfaces at least once', () => {
    for (const surface of VALID_SURFACES) {
      expect(buildAgentMissionsForSurface(surface).length).toBeGreaterThan(0);
    }
  });

  it('buildAgentMissionsForAgent returns at least one mission per agent', () => {
    for (const agent of AGENT_MISSION_AGENTS) {
      expect(buildAgentMissionsForAgent(agent).length).toBeGreaterThan(0);
    }
  });

  it('seed includes low_context_warning, validation_defer, and approval_follow_up missions', () => {
    const types = new Set(buildAgentMissionQueue().map((mission) => mission.type));
    expect(types.has('low_context_warning')).toBe(true);
    expect(types.has('validation_defer')).toBe(true);
    expect(types.has('approval_follow_up')).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Mission shape
// ---------------------------------------------------------------------

describe('buildAgentMissionQueue · mission shape', () => {
  it('every mission id matches /^mission-seed-[a-z0-9-]+$/', () => {
    for (const mission of buildAgentMissionQueue()) {
      expect(mission.id).toMatch(ID_PATTERN);
    }
  });

  it('every mission carries non-empty rationale, recommendedAction, and stopCondition', () => {
    for (const mission of buildAgentMissionQueue()) {
      expect(mission.rationale.trim().length).toBeGreaterThan(0);
      expect(mission.recommendedAction.trim().length).toBeGreaterThan(0);
      expect(mission.stopCondition.trim().length).toBeGreaterThan(0);
      // rationale should be at least one sentence-ish (>= 12 chars to
      // avoid trivial placeholders, no exact period requirement).
      expect(mission.rationale.length).toBeGreaterThanOrEqual(12);
    }
  });

  it('every mission has a valid uiVisibility and priority', () => {
    for (const mission of buildAgentMissionQueue()) {
      expect(VALID_VISIBILITY.has(mission.uiVisibility)).toBe(true);
      expect(VALID_PRIORITIES.has(mission.priority)).toBe(true);
    }
  });

  it('every mission carries a valid workObject', () => {
    for (const mission of buildAgentMissionQueue()) {
      expect(VALID_WORK_OBJECT_KINDS.has(mission.workObject.kind)).toBe(true);
      expect(VALID_SURFACES.has(mission.workObject.surface)).toBe(true);
      expect(mission.workObject.id.trim().length).toBeGreaterThan(0);
      expect(mission.workObject.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('Atlas executive_brief missions use executive_brief visibility', () => {
    const atlasExec = buildAgentMissionQueue().filter(
      (mission) => mission.agent === 'atlas' && mission.type === 'executive_brief',
    );
    expect(atlasExec.length).toBeGreaterThanOrEqual(1);
    for (const mission of atlasExec) {
      expect(mission.uiVisibility).toBe('executive_brief');
    }
  });
});

// ---------------------------------------------------------------------
// Handoffs
// ---------------------------------------------------------------------

describe('getAgentMissionHandoffs', () => {
  it('returns only missions with non-null handoffs', () => {
    const handoffs = getAgentMissionHandoffs(buildAgentMissionQueue());
    expect(handoffs.length).toBeGreaterThan(0);
    for (const mission of handoffs) {
      expect(mission.handoff).not.toBeNull();
    }
  });

  it('every handoff toAgent is a valid AgentMissionAgent and trigger is valid', () => {
    const handoffs = getAgentMissionHandoffs(buildAgentMissionQueue());
    for (const mission of handoffs) {
      expect(mission.handoff).not.toBeNull();
      const handoff = mission.handoff!;
      expect(VALID_AGENTS.has(handoff.toAgent)).toBe(true);
      expect(VALID_HANDOFF_TRIGGERS.has(handoff.trigger)).toBe(true);
      expect(handoff.reason.trim().length).toBeGreaterThan(0);
    }
  });

  it('Sentinel evidence_gap missions hand off to Nexus', () => {
    const evidenceGaps = buildAgentMissionQueue().filter(
      (mission) => mission.agent === 'sentinel' && mission.type === 'evidence_gap',
    );
    expect(evidenceGaps.length).toBeGreaterThanOrEqual(1);
    for (const mission of evidenceGaps) {
      expect(mission.handoff).not.toBeNull();
      expect(mission.handoff!.toAgent).toBe('nexus');
    }
  });
});

// ---------------------------------------------------------------------
// getTopAgentMissions ordering
// ---------------------------------------------------------------------

describe('getTopAgentMissions', () => {
  it('orders missions by priority (critical > high > medium > low)', () => {
    const top = getTopAgentMissions(buildAgentMissionQueue(), 100);
    const rank: Record<AgentMissionPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    for (let i = 1; i < top.length; i += 1) {
      expect(rank[top[i].priority]).toBeGreaterThanOrEqual(rank[top[i - 1].priority]);
    }
  });

  it('breaks priority ties by ascending mission id', () => {
    const top = getTopAgentMissions(buildAgentMissionQueue(), 100);
    for (let i = 1; i < top.length; i += 1) {
      if (top[i].priority === top[i - 1].priority) {
        expect(top[i - 1].id < top[i].id).toBe(true);
      }
    }
  });

  it('returns deterministic byte-equal output for the same input', () => {
    const queue = buildAgentMissionQueue();
    const a = JSON.stringify(getTopAgentMissions(queue, 5));
    const b = JSON.stringify(getTopAgentMissions(queue, 5));
    expect(a).toBe(b);
  });

  it('respects the limit and returns at most that many missions', () => {
    const queue = buildAgentMissionQueue();
    expect(getTopAgentMissions(queue, 3).length).toBe(3);
    expect(getTopAgentMissions(queue, 0).length).toBe(0);
    expect(getTopAgentMissions(queue, 1000).length).toBe(queue.length);
  });

  it('places critical missions first when any exist', () => {
    const queue = buildAgentMissionQueue();
    const criticals = queue.filter((mission) => mission.priority === 'critical');
    if (criticals.length > 0) {
      const top = getTopAgentMissions(queue, criticals.length);
      for (const mission of top) {
        expect(mission.priority).toBe('critical');
      }
    }
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeAgentMissionQueue', () => {
  it('totalMissions is at least 12 and matches sum of byAgent / byState / bySurface', () => {
    const summary = summarizeAgentMissionQueue();
    expect(summary.totalMissions).toBeGreaterThanOrEqual(12);

    const agentSum = (Object.values(summary.byAgent) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );
    const stateSum = (Object.values(summary.byState) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );
    const surfaceSum = (Object.values(summary.bySurface) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );

    expect(agentSum).toBe(summary.totalMissions);
    expect(stateSum).toBe(summary.totalMissions);
    expect(surfaceSum).toBe(summary.totalMissions);
  });

  it('handoffCount matches getAgentMissionHandoffs length', () => {
    const queue = buildAgentMissionQueue();
    const summary = summarizeAgentMissionQueue(queue);
    expect(summary.handoffCount).toBe(getAgentMissionHandoffs(queue).length);
  });

  it('highestPriorityCount matches the number of critical missions', () => {
    const queue = buildAgentMissionQueue();
    const summary = summarizeAgentMissionQueue(queue);
    const criticals = queue.filter((mission) => mission.priority === 'critical').length;
    expect(summary.highestPriorityCount).toBe(criticals);
  });
});

// ---------------------------------------------------------------------
// Serialized hygiene of the seed queue
// ---------------------------------------------------------------------

describe('buildAgentMissionQueue · serialized hygiene', () => {
  const serialized = JSON.stringify(buildAgentMissionQueue());

  it('contains no https:// URLs', () => {
    expect(serialized).not.toMatch(/https:\/\//);
    expect(serialized).not.toMatch(/http:\/\//);
  });

  it('contains no production-shaped E-### evidence citation ids', () => {
    expect(serialized).not.toMatch(/E-\d+/);
  });

  it('every mission id matches the seed id pattern after serialization', () => {
    for (const mission of buildAgentMissionQueue() as AgentMission[]) {
      expect(mission.id).toMatch(ID_PATTERN);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · agent-mission-queue.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/agents/agent-mission-queue.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Source / Auth / Supabase runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });
});
