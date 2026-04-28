/**
 * MW4 — mission-workflow-handoff integration tests
 *
 * Covers:
 *   - buildMissionWorkflowHandoffView() default seed
 *   - handoffEdges: each has fromAgent/toAgent/trigger/reason
 *   - totalHandoffs matches handoffEdges.length
 *   - blockingHandoffs: only blocked/escalated missions
 *   - blockingHandoffCount matches blockingHandoffs.length
 *   - agentSummaries: 4 canonical agents, outbound+inbound counts sum correctly
 *   - activeTriggers: non-empty array of known trigger values
 *   - honestDisclaimer is non-empty and contains 'deterministic'
 *   - deterministicSeed: true
 *   - Determinism
 *   - getOutboundHandoffs / getInboundHandoffs / getHandoffsByTrigger
 *   - getAgentHandoffSummary returns correct entry or null
 *   - describeMissionWorkflowHandoff format
 *   - Module hygiene
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildMissionWorkflowHandoffView,
  getOutboundHandoffs,
  getInboundHandoffs,
  getHandoffsByTrigger,
  getAgentHandoffSummary,
  describeMissionWorkflowHandoff,
  type MissionWorkflowHandoffView,
  type AgentMissionAgent,
  type AgentMissionHandoffTrigger,
} from '@/lib/agents/mission-workflow-handoff';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/agents/mission-workflow-handoff.ts';

const CANONICAL_AGENTS: AgentMissionAgent[] = ['nexus', 'sentinel', 'atlas', 'steward'];

const VALID_TRIGGERS: AgentMissionHandoffTrigger[] = [
  'evidence_weak',
  'gate_blocked',
  'executive_decision_needed',
  'workflow_allowed',
  'follow_up_needed',
  'missing_inputs',
];

// ---------------------------------------------------------------------------
// buildMissionWorkflowHandoffView — default seed
// ---------------------------------------------------------------------------

describe('MW4 — buildMissionWorkflowHandoffView default seed', () => {
  let view: MissionWorkflowHandoffView;

  beforeAll(() => {
    view = buildMissionWorkflowHandoffView();
  });

  it('returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('totalHandoffs matches handoffEdges.length', () => {
    expect(view.totalHandoffs).toBe(view.handoffEdges.length);
  });

  it('totalHandoffs is a positive integer', () => {
    expect(view.totalHandoffs).toBeGreaterThan(0);
  });

  it('blockingHandoffCount matches blockingHandoffs.length', () => {
    expect(view.blockingHandoffCount).toBe(view.blockingHandoffs.length);
  });

  it('blockingHandoffs are a subset of handoffEdges', () => {
    for (const bh of view.blockingHandoffs) {
      expect(view.handoffEdges).toContain(bh);
    }
  });

  it('honestDisclaimer is non-empty', () => {
    expect(view.honestDisclaimer.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains "deterministic"', () => {
    expect(view.honestDisclaimer).toContain('deterministic');
  });

  it('activeTriggers is an array', () => {
    expect(Array.isArray(view.activeTriggers)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// handoffEdges
// ---------------------------------------------------------------------------

describe('MW4 — handoffEdges', () => {
  let view: MissionWorkflowHandoffView;

  beforeAll(() => {
    view = buildMissionWorkflowHandoffView();
  });

  it('each edge has a non-empty fromAgent', () => {
    for (const edge of view.handoffEdges) {
      expect(CANONICAL_AGENTS).toContain(edge.fromAgent);
    }
  });

  it('each edge has a non-empty toAgent', () => {
    for (const edge of view.handoffEdges) {
      expect(CANONICAL_AGENTS).toContain(edge.toAgent);
    }
  });

  it('each edge trigger is a valid trigger value', () => {
    for (const edge of view.handoffEdges) {
      expect(VALID_TRIGGERS).toContain(edge.trigger);
    }
  });

  it('each edge has a non-empty reason', () => {
    for (const edge of view.handoffEdges) {
      expect(edge.reason.length).toBeGreaterThan(0);
    }
  });

  it('each edge fromAgent matches mission.agent', () => {
    for (const edge of view.handoffEdges) {
      expect(edge.fromAgent).toBe(edge.mission.agent);
    }
  });

  it('blocking edges have blocked or escalated state', () => {
    for (const edge of view.blockingHandoffs) {
      expect(['blocked', 'escalated']).toContain(edge.state);
    }
  });

  it('isBlocking is consistent with state', () => {
    for (const edge of view.handoffEdges) {
      const shouldBeBlocking = edge.state === 'blocked' || edge.state === 'escalated';
      expect(edge.isBlocking).toBe(shouldBeBlocking);
    }
  });
});

// ---------------------------------------------------------------------------
// activeTriggers
// ---------------------------------------------------------------------------

describe('MW4 — activeTriggers', () => {
  let view: MissionWorkflowHandoffView;

  beforeAll(() => {
    view = buildMissionWorkflowHandoffView();
  });

  it('all activeTriggers are valid trigger values', () => {
    for (const trigger of view.activeTriggers) {
      expect(VALID_TRIGGERS).toContain(trigger);
    }
  });

  it('activeTriggers are unique (no duplicates)', () => {
    const unique = new Set(view.activeTriggers);
    expect(unique.size).toBe(view.activeTriggers.length);
  });

  it('activeTriggers covers all triggers present in handoffEdges', () => {
    const fromEdges = new Set(view.handoffEdges.map((e) => e.trigger));
    for (const trigger of fromEdges) {
      expect(view.activeTriggers).toContain(trigger);
    }
  });
});

// ---------------------------------------------------------------------------
// agentSummaries
// ---------------------------------------------------------------------------

describe('MW4 — agentSummaries', () => {
  let view: MissionWorkflowHandoffView;

  beforeAll(() => {
    view = buildMissionWorkflowHandoffView();
  });

  it('has exactly 4 agent summaries', () => {
    expect(view.agentSummaries.length).toBe(4);
  });

  it('agent summaries are in canonical order', () => {
    const keys = view.agentSummaries.map((s) => s.agent);
    expect(keys).toEqual(CANONICAL_AGENTS);
  });

  it('sum of outboundCounts equals totalHandoffs', () => {
    const total = view.agentSummaries.reduce((acc, s) => acc + s.outboundCount, 0);
    expect(total).toBe(view.totalHandoffs);
  });

  it('sum of inboundCounts equals totalHandoffs', () => {
    const total = view.agentSummaries.reduce((acc, s) => acc + s.inboundCount, 0);
    expect(total).toBe(view.totalHandoffs);
  });

  it('handingOffTo and receivingFrom contain valid agents', () => {
    for (const summary of view.agentSummaries) {
      for (const a of summary.handingOffTo) expect(CANONICAL_AGENTS).toContain(a);
      for (const a of summary.receivingFrom) expect(CANONICAL_AGENTS).toContain(a);
    }
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe('MW4 — helpers', () => {
  let view: MissionWorkflowHandoffView;

  beforeAll(() => {
    view = buildMissionWorkflowHandoffView();
  });

  it.each(CANONICAL_AGENTS)('getOutboundHandoffs(%s) returns edges from that agent', (agent) => {
    const edges = getOutboundHandoffs(view, agent);
    for (const e of edges) expect(e.fromAgent).toBe(agent);
  });

  it.each(CANONICAL_AGENTS)('getInboundHandoffs(%s) returns edges to that agent', (agent) => {
    const edges = getInboundHandoffs(view, agent);
    for (const e of edges) expect(e.toAgent).toBe(agent);
  });

  it.each(VALID_TRIGGERS)('getHandoffsByTrigger(%s) returns matching edges', (trigger) => {
    const edges = getHandoffsByTrigger(view, trigger);
    for (const e of edges) expect(e.trigger).toBe(trigger);
  });

  it.each(CANONICAL_AGENTS)('getAgentHandoffSummary(%s) returns correct entry', (agent) => {
    const summary = getAgentHandoffSummary(view, agent);
    expect(summary).not.toBeNull();
    expect(summary?.agent).toBe(agent);
  });

  it('getAgentHandoffSummary returns null for unknown agent', () => {
    const summary = getAgentHandoffSummary(view, 'unknown' as AgentMissionAgent);
    expect(summary).toBeNull();
  });

  it('describeMissionWorkflowHandoff returns non-empty string', () => {
    const desc = describeMissionWorkflowHandoff(view);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('describeMissionWorkflowHandoff starts with "Handoff workflow"', () => {
    const desc = describeMissionWorkflowHandoff(view);
    expect(desc).toMatch(/^Handoff workflow/);
  });

  it('describeMissionWorkflowHandoff contains edge count', () => {
    const desc = describeMissionWorkflowHandoff(view);
    expect(desc).toMatch(/\d+ edge/);
  });

  it('describeMissionWorkflowHandoff uses dot-separator', () => {
    const desc = describeMissionWorkflowHandoff(view);
    expect(desc).toContain(' · ');
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('MW4 — determinism', () => {
  it('two calls produce identical JSON', () => {
    const a = buildMissionWorkflowHandoffView();
    const b = buildMissionWorkflowHandoffView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('handoffEdges are byte-equal across calls', () => {
    const a = buildMissionWorkflowHandoffView();
    const b = buildMissionWorkflowHandoffView();
    expect(JSON.stringify(a.handoffEdges)).toBe(JSON.stringify(b.handoffEdges));
  });

  it('agentSummaries are byte-equal across calls', () => {
    const a = buildMissionWorkflowHandoffView();
    const b = buildMissionWorkflowHandoffView();
    expect(JSON.stringify(a.agentSummaries)).toBe(JSON.stringify(b.agentSummaries));
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('MW4 — module hygiene', () => {
  let source: string;

  beforeAll(() => {
    const raw = readFileSync(resolve(root, SOURCE_PATH), 'utf8');
    source = raw
      .replace(/`[\s\S]*?`/g, '``')
      .replace(/"[^"]*"/g, '""')
      .replace(/'[^']*'/g, "''")
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('does not call Date.now', () => {
    expect(source).not.toMatch(/Date\.now\s*\(/);
  });

  it('does not call Math.random', () => {
    expect(source).not.toMatch(/Math\.random\s*\(/);
  });

  it('does not call new Date()', () => {
    expect(source).not.toMatch(/new\s+Date\s*\(/);
  });

  it('does not call fetch()', () => {
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });

  it('imports from @/lib/agent/agent-mission-queue', () => {
    const raw = readFileSync(resolve(root, SOURCE_PATH), 'utf8');
    expect(raw).toMatch(/@\/lib\/agent\/agent-mission-queue/);
  });
});
