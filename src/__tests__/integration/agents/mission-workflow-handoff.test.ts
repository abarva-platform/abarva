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
 *   - Determinism and provenance BY EXECUTION (no source-text scanning)
 */

import {
  buildAgentMissionQueue,
  getAgentMissionHandoffs,
} from '@/lib/agent/agent-mission-queue';
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
} from '@/lib/agent/mission-workflow-handoff';

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
// Determinism and provenance — BY EXECUTION
//
// Item T-495, suite 10 of 11 in the claimable half. What stood here was a
// source-text scanner: it read `src/lib/agent/mission-workflow-handoff.ts` as a
// string, stripped its comments and literals, and asserted the text did not
// match /Date\.now\s*\(/, /Math\.random\s*\(/, /new\s+Date\s*\(/ or
// /\bfetch\s*\(/, plus one case asserting the RAW text contained the substring
// `@/lib/agent/agent-mission-queue`.
//
// Three things that scanner could not see, each of which is a real way for this
// module to stop being what the scanner claimed it was:
//
//   1. It read ONE file. `buildMissionWorkflowHandoffView` composes
//      `agent-mission-queue`, so a clock or a random seed introduced there is
//      invisible to a scan of the handoff module — and it would make this view
//      non-deterministic just the same.
//   2. It matched a CALL SHAPE. `const now = Date.now; now()`,
//      `globalThis['Date']['now']()`, or a clock read behind any local helper
//      defeats the regex while doing exactly the thing it forbids.
//   3. The import case read the raw text, comments included, so a code comment
//      naming the module path satisfied it. A module that forked a private copy
//      of the mission seed and merely MENTIONED the queue in a comment passed.
//
// The cases below assert the same four properties by removing the capability
// from the runtime and building anyway, and assert derivation by reconciling the
// edge set against what the mission queue module itself returns. They cover the
// whole transitive composition, every call shape, and actual provenance.
// ---------------------------------------------------------------------------

/**
 * Replace a global with a stub that throws on any use, build the view through a
 * FRESH module load, restore the global, and return the built view.
 *
 * The module is re-required inside the window on purpose: a clock read at module
 * load time is as real as one inside the builder, and a suite that only stubs
 * around an already-loaded module cannot see it.
 */
function buildWithGlobalRemoved(
  name: 'Date.now' | 'new Date' | 'Math.random' | 'fetch',
): MissionWorkflowHandoffView {
  const g = globalThis as unknown as Record<string, unknown>;
  const realDate = g.Date;
  const realRandom = Math.random;
  const realFetch = g.fetch;

  const boom = (): never => {
    throw new Error(`mission-workflow-handoff read ${name}`);
  };

  if (name === 'Date.now') {
    const D = function (this: unknown, ...args: unknown[]) {
      return new (realDate as new (...a: unknown[]) => object)(...args);
    } as unknown as DateConstructor;
    Object.setPrototypeOf(D, realDate as object);
    D.now = boom;
    g.Date = D;
  } else if (name === 'new Date') {
    const D = function () {
      return boom();
    } as unknown as DateConstructor;
    D.now = (realDate as DateConstructor).now;
    D.parse = (realDate as DateConstructor).parse;
    D.UTC = (realDate as DateConstructor).UTC;
    g.Date = D;
  } else if (name === 'Math.random') {
    Math.random = boom;
  } else {
    g.fetch = boom;
  }

  try {
    let built: MissionWorkflowHandoffView | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fresh = require('@/lib/agent/mission-workflow-handoff') as {
        buildMissionWorkflowHandoffView: () => MissionWorkflowHandoffView;
      };
      built = fresh.buildMissionWorkflowHandoffView();
    });
    return built as MissionWorkflowHandoffView;
  } finally {
    g.Date = realDate;
    Math.random = realRandom;
    g.fetch = realFetch;
  }
}

describe('MW4 — no clock, no entropy, no network, proved by removing them', () => {
  let reference: string;

  beforeAll(() => {
    reference = JSON.stringify(buildMissionWorkflowHandoffView());
  });

  it.each(['Date.now', 'new Date', 'Math.random', 'fetch'] as const)(
    'builds an identical view with %s removed from the runtime',
    (name) => {
      const view = buildWithGlobalRemoved(name);
      expect(JSON.stringify(view)).toBe(reference);
    },
  );

  it('is byte-equal when the wall clock is a year apart between builds', () => {
    const g = globalThis as unknown as Record<string, unknown>;
    const realDate = g.Date as DateConstructor;

    const at = (iso: string): string => {
      const fixed = new realDate(iso).getTime();
      const D = function (this: unknown, ...args: unknown[]) {
        if (args.length === 0) return new realDate(fixed);
        return new (realDate as new (...a: unknown[]) => object)(...args);
      } as unknown as DateConstructor;
      Object.setPrototypeOf(D, realDate);
      D.now = () => fixed;
      g.Date = D;
      try {
        let json = '';
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const fresh = require('@/lib/agent/mission-workflow-handoff') as {
            buildMissionWorkflowHandoffView: () => MissionWorkflowHandoffView;
          };
          json = JSON.stringify(fresh.buildMissionWorkflowHandoffView());
        });
        return json;
      } finally {
        g.Date = realDate;
      }
    };

    expect(at('2026-01-01T00:00:00.000Z')).toBe(at('2027-01-01T00:00:00.000Z'));
  });
});

describe('MW4 — the edge set is DERIVED from the mission queue, not a private copy', () => {
  let view: MissionWorkflowHandoffView;
  let queueHandoffs: ReturnType<typeof getAgentMissionHandoffs>;

  beforeAll(() => {
    view = buildMissionWorkflowHandoffView();
    queueHandoffs = getAgentMissionHandoffs(buildAgentMissionQueue());
  });

  it('totalHandoffs equals the count the mission queue module itself reports', () => {
    expect(view.totalHandoffs).toBe(queueHandoffs.length);
  });

  it('every edge carries a mission that is byte-equal to the queue mission of that id', () => {
    const byId = new Map(queueHandoffs.map((m) => [m.id, m]));
    for (const edge of view.handoffEdges) {
      const fromQueue = byId.get(edge.mission.id);
      expect(fromQueue).toBeDefined();
      expect(JSON.stringify(edge.mission)).toBe(JSON.stringify(fromQueue));
    }
  });

  it('every queue mission carrying a handoff has exactly one edge', () => {
    for (const mission of queueHandoffs) {
      const edges = view.handoffEdges.filter((e) => e.mission.id === mission.id);
      expect(edges).toHaveLength(1);
    }
  });

  it('each edge toAgent, trigger and reason are the queue handoff fields verbatim', () => {
    const byId = new Map(queueHandoffs.map((m) => [m.id, m]));
    for (const edge of view.handoffEdges) {
      const handoff = byId.get(edge.mission.id)?.handoff;
      expect(handoff).toBeDefined();
      expect(edge.toAgent).toBe(handoff?.toAgent);
      expect(edge.trigger).toBe(handoff?.trigger);
      expect(edge.reason).toBe(handoff?.reason);
    }
  });
});
