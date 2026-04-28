// AG13 - Cross-Agent Handoff Read Model tests.
//
// Deterministic, file-pure suite. No network, no model providers, no
// time-of-day dependence.

import {
  CROSS_AGENT_HANDOFF_AGENTS,
  CROSS_AGENT_HANDOFF_REASONS,
  CROSS_AGENT_HANDOFF_STATES,
  buildCrossAgentHandoffSeed,
  getHandoffsForAgent,
  getOpenHandoffs,
  summarizeCrossAgentHandoffs,
  validateCrossAgentHandoff,
  type CrossAgentHandoff,
  type CrossAgentHandoffAgent,
  type CrossAgentHandoffReason,
  type CrossAgentHandoffState,
} from '@/lib/agent/cross-agent-handoff';

const ID_PATTERN = /^handoff-seed-\d+$/;

const VALID_AGENTS = new Set<CrossAgentHandoffAgent>(CROSS_AGENT_HANDOFF_AGENTS);
const VALID_STATES = new Set<CrossAgentHandoffState>(CROSS_AGENT_HANDOFF_STATES);
const VALID_REASONS = new Set<CrossAgentHandoffReason>(CROSS_AGENT_HANDOFF_REASONS);

const VALID_WORK_OBJECT_KINDS = new Set([
  'program',
  'phase',
  'workshop',
  'pattern',
  'artifact',
  'tower_dimension',
  'dataset_domain',
  'sourcing_event',
]);

const VALID_SURFACES = new Set([
  'programs',
  'tower',
  'intelligence',
  'admin',
  'source',
]);

const VALID_ESCALATION_TARGETS = new Set([
  'platform_admin',
  'founder',
  'value_office',
  'governance_committee',
]);

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildCrossAgentHandoffSeed · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildCrossAgentHandoffSeed());
    const second = JSON.stringify(buildCrossAgentHandoffSeed());
    const third = JSON.stringify(buildCrossAgentHandoffSeed());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('returns at least 20 seed handoffs', () => {
    expect(buildCrossAgentHandoffSeed().length).toBeGreaterThanOrEqual(20);
  });

  it('every handoff is tagged createdFrom: deterministic_cross_agent_handoff_seed', () => {
    for (const handoff of buildCrossAgentHandoffSeed()) {
      expect(handoff.createdFrom).toBe('deterministic_cross_agent_handoff_seed');
    }
  });

  it('every handoff id matches /^handoff-seed-\\d+$/ and ids are unique', () => {
    const seen = new Set<string>();
    for (const handoff of buildCrossAgentHandoffSeed()) {
      expect(handoff.id).toMatch(ID_PATTERN);
      expect(seen.has(handoff.id)).toBe(false);
      seen.add(handoff.id);
    }
  });
});

// ---------------------------------------------------------------------
// Agent / state / reason coverage
// ---------------------------------------------------------------------

describe('buildCrossAgentHandoffSeed · coverage', () => {
  const handoffs = buildCrossAgentHandoffSeed();

  it('represents all 4 source agents at least once', () => {
    for (const agent of CROSS_AGENT_HANDOFF_AGENTS) {
      const matching = handoffs.filter((handoff) => handoff.sourceAgent === agent);
      expect(matching.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('represents all 4 target agents at least once', () => {
    for (const agent of CROSS_AGENT_HANDOFF_AGENTS) {
      const matching = handoffs.filter((handoff) => handoff.targetAgent === agent);
      expect(matching.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers all 7 states at least once', () => {
    for (const state of CROSS_AGENT_HANDOFF_STATES) {
      const matching = handoffs.filter((handoff) => handoff.state === state);
      expect(matching.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers all 9 reasons at least once', () => {
    for (const reason of CROSS_AGENT_HANDOFF_REASONS) {
      const matching = handoffs.filter((handoff) => handoff.reason === reason);
      expect(matching.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every sourceAgent and targetAgent is a valid CrossAgentHandoffAgent', () => {
    for (const handoff of handoffs) {
      expect(VALID_AGENTS.has(handoff.sourceAgent)).toBe(true);
      expect(VALID_AGENTS.has(handoff.targetAgent)).toBe(true);
    }
  });

  it('every state is a valid CrossAgentHandoffState', () => {
    for (const handoff of handoffs) {
      expect(VALID_STATES.has(handoff.state)).toBe(true);
    }
  });

  it('every reason is a valid CrossAgentHandoffReason', () => {
    for (const handoff of handoffs) {
      expect(VALID_REASONS.has(handoff.reason)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// sourceAgent !== targetAgent invariant
// ---------------------------------------------------------------------

describe('cross-agent handoff invariants', () => {
  it('sourceAgent never equals targetAgent for any seed handoff', () => {
    for (const handoff of buildCrossAgentHandoffSeed()) {
      expect(handoff.sourceAgent).not.toBe(handoff.targetAgent);
    }
  });

  it('every handoff has a non-empty audit rationale and expectedResolution', () => {
    for (const handoff of buildCrossAgentHandoffSeed()) {
      expect(handoff.audit.rationale.trim().length).toBeGreaterThan(0);
      expect(handoff.audit.expectedResolution.trim().length).toBeGreaterThan(0);
      expect(handoff.audit.rationale.length).toBeGreaterThanOrEqual(12);
    }
  });

  it('every handoff carries a valid workObject', () => {
    for (const handoff of buildCrossAgentHandoffSeed()) {
      expect(VALID_WORK_OBJECT_KINDS.has(handoff.workObject.kind)).toBe(true);
      expect(VALID_SURFACES.has(handoff.workObject.surface)).toBe(true);
      expect(handoff.workObject.id.trim().length).toBeGreaterThan(0);
      expect(handoff.workObject.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('declined handoffs carry a non-empty declinedReason', () => {
    const declined = buildCrossAgentHandoffSeed().filter(
      (handoff) => handoff.state === 'declined',
    );
    expect(declined.length).toBeGreaterThanOrEqual(1);
    for (const handoff of declined) {
      expect(handoff.declinedReason).toBeDefined();
      expect((handoff.declinedReason ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('blocked handoffs carry a non-empty blockedReason', () => {
    const blocked = buildCrossAgentHandoffSeed().filter(
      (handoff) => handoff.state === 'blocked',
    );
    expect(blocked.length).toBeGreaterThanOrEqual(1);
    for (const handoff of blocked) {
      expect(handoff.blockedReason).toBeDefined();
      expect((handoff.blockedReason ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('deferred handoffs carry a non-empty deferredReason', () => {
    const deferred = buildCrossAgentHandoffSeed().filter(
      (handoff) => handoff.state === 'deferred',
    );
    expect(deferred.length).toBeGreaterThanOrEqual(1);
    for (const handoff of deferred) {
      expect(handoff.deferredReason).toBeDefined();
      expect((handoff.deferredReason ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('escalated handoffs carry a valid escalatedTo target', () => {
    const escalated = buildCrossAgentHandoffSeed().filter(
      (handoff) => handoff.state === 'escalated',
    );
    expect(escalated.length).toBeGreaterThanOrEqual(1);
    for (const handoff of escalated) {
      expect(handoff.escalatedTo).toBeDefined();
      expect(VALID_ESCALATION_TARGETS.has(handoff.escalatedTo as string)).toBe(true);
    }
  });

  it('at least one handoff references an AG10 mission via audit.triggeringMissionId', () => {
    const linked = buildCrossAgentHandoffSeed().filter(
      (handoff) =>
        typeof handoff.audit.triggeringMissionId === 'string' &&
        handoff.audit.triggeringMissionId.startsWith('mission-seed-'),
    );
    expect(linked.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------
// validateCrossAgentHandoff
// ---------------------------------------------------------------------

describe('validateCrossAgentHandoff', () => {
  const baseValid: CrossAgentHandoff = {
    id: 'handoff-seed-test-base',
    sourceAgent: 'sentinel',
    targetAgent: 'nexus',
    state: 'proposed',
    reason: 'pattern_signal_detected',
    workObject: {
      kind: 'pattern',
      id: 'pattern-seed-test',
      label: 'Test Pattern',
      surface: 'intelligence',
    },
    audit: {
      evidenceIds: [],
      rationale: 'Sentinel asks Nexus to act on a confirmed pattern.',
      expectedResolution: 'Nexus accepts and presents the recommendation.',
    },
    createdFrom: 'deterministic_cross_agent_handoff_seed',
  };

  it('every seed handoff validates as valid', () => {
    for (const handoff of buildCrossAgentHandoffSeed()) {
      const result = validateCrossAgentHandoff(handoff);
      expect(result.isValid).toBe(true);
      expect(result.reasons.length).toBe(0);
    }
  });

  it('rejects sourceAgent === targetAgent', () => {
    const result = validateCrossAgentHandoff({
      ...baseValid,
      targetAgent: baseValid.sourceAgent,
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('sourceAgent'))).toBe(true);
  });

  it('rejects empty audit rationale', () => {
    const result = validateCrossAgentHandoff({
      ...baseValid,
      audit: { ...baseValid.audit, rationale: '   ' },
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('rationale'))).toBe(true);
  });

  it('rejects empty workObject id', () => {
    const result = validateCrossAgentHandoff({
      ...baseValid,
      workObject: { ...baseValid.workObject, id: '' },
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('workObject.id'))).toBe(true);
  });

  it('rejects empty workObject label', () => {
    const result = validateCrossAgentHandoff({
      ...baseValid,
      workObject: { ...baseValid.workObject, label: '' },
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('workObject.label'))).toBe(true);
  });

  it('rejects declined state without declinedReason', () => {
    const result = validateCrossAgentHandoff({
      ...baseValid,
      state: 'declined',
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('declinedReason'))).toBe(true);
  });

  it('rejects blocked state without blockedReason', () => {
    const result = validateCrossAgentHandoff({
      ...baseValid,
      state: 'blocked',
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('blockedReason'))).toBe(true);
  });

  it('rejects deferred state without deferredReason', () => {
    const result = validateCrossAgentHandoff({
      ...baseValid,
      state: 'deferred',
    });
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('deferredReason'))).toBe(true);
  });
});

// ---------------------------------------------------------------------
// getHandoffsForAgent / getOpenHandoffs
// ---------------------------------------------------------------------

describe('getHandoffsForAgent', () => {
  it('returns handoffs where the agent is source or target', () => {
    for (const agent of CROSS_AGENT_HANDOFF_AGENTS) {
      const found = getHandoffsForAgent(agent);
      expect(found.length).toBeGreaterThan(0);
      for (const handoff of found) {
        expect(
          handoff.sourceAgent === agent || handoff.targetAgent === agent,
        ).toBe(true);
      }
    }
  });

  it('returns the same byte-equal output across repeated calls', () => {
    const a = JSON.stringify(getHandoffsForAgent('nexus'));
    const b = JSON.stringify(getHandoffsForAgent('nexus'));
    expect(a).toBe(b);
  });
});

describe('getOpenHandoffs', () => {
  it('returns only handoffs in proposed, accepted, or deferred state', () => {
    const open = getOpenHandoffs();
    expect(open.length).toBeGreaterThan(0);
    for (const handoff of open) {
      expect(['proposed', 'accepted', 'deferred']).toContain(handoff.state);
    }
  });

  it('matches summarizeCrossAgentHandoffs.openCount', () => {
    const handoffs = buildCrossAgentHandoffSeed();
    const summary = summarizeCrossAgentHandoffs(handoffs);
    expect(getOpenHandoffs(handoffs).length).toBe(summary.openCount);
  });
});

// ---------------------------------------------------------------------
// summarizeCrossAgentHandoffs reconciliation
// ---------------------------------------------------------------------

describe('summarizeCrossAgentHandoffs', () => {
  it('totalHandoffs reconciles with byState / bySourceAgent / byTargetAgent / byReason sums', () => {
    const summary = summarizeCrossAgentHandoffs();

    const stateSum = (Object.values(summary.byState) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );
    const sourceSum = (Object.values(summary.bySourceAgent) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );
    const targetSum = (Object.values(summary.byTargetAgent) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );
    const reasonSum = (Object.values(summary.byReason) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );

    expect(stateSum).toBe(summary.totalHandoffs);
    expect(sourceSum).toBe(summary.totalHandoffs);
    expect(targetSum).toBe(summary.totalHandoffs);
    expect(reasonSum).toBe(summary.totalHandoffs);
  });

  it('blockedCount matches the count of blocked handoffs', () => {
    const handoffs = buildCrossAgentHandoffSeed();
    const summary = summarizeCrossAgentHandoffs(handoffs);
    const blocked = handoffs.filter((handoff) => handoff.state === 'blocked').length;
    expect(summary.blockedCount).toBe(blocked);
  });

  it('uniqueWorkObjects is at most totalHandoffs and at least 1', () => {
    const summary = summarizeCrossAgentHandoffs();
    expect(summary.uniqueWorkObjects).toBeGreaterThanOrEqual(1);
    expect(summary.uniqueWorkObjects).toBeLessThanOrEqual(summary.totalHandoffs);
  });
});

// ---------------------------------------------------------------------
// Serialized hygiene of the seed
// ---------------------------------------------------------------------

describe('buildCrossAgentHandoffSeed · serialized hygiene', () => {
  const serialized = JSON.stringify(buildCrossAgentHandoffSeed());

  it('contains no https:// or http:// URLs', () => {
    expect(serialized).not.toMatch(/https:\/\//);
    expect(serialized).not.toMatch(/http:\/\//);
  });

  it('contains no production-shaped E-### evidence citation ids', () => {
    expect(serialized).not.toMatch(/E-\d+/);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · cross-agent-handoff.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/agents/cross-agent-handoff.ts',
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
