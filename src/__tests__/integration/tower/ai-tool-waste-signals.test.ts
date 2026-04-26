// ACT12 · AI Tool Waste / License Utilization Signals · integration tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - >= 20 signals.
// - All 6 canonical kinds present.
// - All 5 canonical statuses present.
// - All 4 canonical severities present.
// - >= 3 critical signals.
// - >= 3 shadow_it signals.
// - >= 2 signals carry a programKey; >= 2 carry an aiUseCaseKey.
// - Every signal carries >= 1 remediation entry.
// - Every utilizationFraction is in [0, 1]; every seatsAffected >= 0.
// - summarizeAiToolWasteSignals reconciles totals.
// - meanUtilizationFraction math is correct and bounded.
// - getCriticalWasteSignals honors its definition.
// - No real product names appear (regex deny-list).
// - No invented dollar amounts.
// - Module hygiene: no banned imports, no banned APIs.

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  AI_TOOL_WASTE_SIGNAL_KINDS,
  AI_TOOL_WASTE_SEVERITIES,
  AI_TOOL_WASTE_STATUSES,
  buildAiToolWasteSignalsSeed,
  getCriticalWasteSignals,
  summarizeAiToolWasteSignals,
  type AiToolWasteSignal,
  type AiToolWasteSignalSummary,
} from '@/lib/tower/ai-tool-waste-signals';

const signals: readonly AiToolWasteSignal[] = buildAiToolWasteSignalsSeed();

// Resolved absolute path to the module source so we can run static
// inspection without re-importing it.
const MODULE_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'lib',
  'tower',
  'ai-tool-waste-signals.ts',
);

const MODULE_SOURCE = fs.readFileSync(MODULE_SOURCE_PATH, 'utf8');

// ---------------------------------------------------------------------
// Shape & determinism
// ---------------------------------------------------------------------

describe('buildAiToolWasteSignalsSeed · shape and determinism', () => {
  it('returns at least 20 signals', () => {
    expect(signals.length).toBeGreaterThanOrEqual(20);
  });

  it('is byte-equal across repeated calls (deterministic)', () => {
    const a = buildAiToolWasteSignalsSeed();
    const b = buildAiToolWasteSignalsSeed();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('exposes all six canonical kinds', () => {
    expect([...AI_TOOL_WASTE_SIGNAL_KINDS]).toEqual([
      'unused_license',
      'duplicate_license',
      'shadow_it',
      'underused_seat',
      'expired_subscription',
      'overprovisioned',
    ]);
  });

  it('exposes all five canonical statuses', () => {
    expect([...AI_TOOL_WASTE_STATUSES]).toEqual([
      'detected',
      'in_review',
      'remediated',
      'accepted',
      'escalated',
    ]);
  });

  it('exposes all four canonical severities', () => {
    expect([...AI_TOOL_WASTE_SEVERITIES]).toEqual([
      'low',
      'medium',
      'high',
      'critical',
    ]);
  });

  it('every signal carries createdFrom: "deterministic_ai_tool_waste_signals_seed"', () => {
    for (const signal of signals) {
      expect(signal.createdFrom).toBe(
        'deterministic_ai_tool_waste_signals_seed',
      );
    }
  });

  it('every signal id matches the canonical "tool-waste-seed-{n}" shape', () => {
    for (const signal of signals) {
      expect(signal.id).toMatch(/^tool-waste-seed-\d+$/);
    }
  });

  it('signal ids are unique', () => {
    const ids = signals.map((signal) => signal.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every signal has a non-empty description and ownerRole', () => {
    for (const signal of signals) {
      expect(signal.description.length).toBeGreaterThan(0);
      expect(signal.ownerRole.length).toBeGreaterThan(0);
    }
  });

  it('every signal toolLabel matches the canonical "ai-tool-placeholder-{n}" shape', () => {
    for (const signal of signals) {
      expect(signal.toolLabel).toMatch(/^ai-tool-placeholder-\d+$/);
    }
  });
});

// ---------------------------------------------------------------------
// Kind / status / severity coverage
// ---------------------------------------------------------------------

describe('kind coverage', () => {
  it.each(AI_TOOL_WASTE_SIGNAL_KINDS.map((k) => [k]))(
    'has at least one signal for kind %s',
    (kind) => {
      const matches = signals.filter((s) => s.kind === kind);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical kinds', () => {
    const allowed = new Set([...AI_TOOL_WASTE_SIGNAL_KINDS]);
    for (const signal of signals) {
      expect(allowed.has(signal.kind)).toBe(true);
    }
  });
});

describe('status coverage', () => {
  it.each(AI_TOOL_WASTE_STATUSES.map((s) => [s]))(
    'has at least one signal for status %s',
    (status) => {
      const matches = signals.filter((s) => s.status === status);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical statuses', () => {
    const allowed = new Set([...AI_TOOL_WASTE_STATUSES]);
    for (const signal of signals) {
      expect(allowed.has(signal.status)).toBe(true);
    }
  });
});

describe('severity coverage', () => {
  it.each(AI_TOOL_WASTE_SEVERITIES.map((s) => [s]))(
    'has at least one signal for severity %s',
    (severity) => {
      const matches = signals.filter((s) => s.severity === severity);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical severities', () => {
    const allowed = new Set([...AI_TOOL_WASTE_SEVERITIES]);
    for (const signal of signals) {
      expect(allowed.has(signal.severity)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Per-row invariants
// ---------------------------------------------------------------------

describe('per-row invariants', () => {
  it('every signal carries at least one remediation entry', () => {
    for (const signal of signals) {
      expect(signal.remediations.length).toBeGreaterThanOrEqual(1);
      for (const remediation of signal.remediations) {
        expect(remediation.length).toBeGreaterThan(0);
      }
    }
  });

  it('seatsAffected is a non-negative integer', () => {
    for (const signal of signals) {
      expect(Number.isFinite(signal.seatsAffected)).toBe(true);
      expect(signal.seatsAffected).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(signal.seatsAffected)).toBe(true);
    }
  });

  it('utilizationFraction is a finite number in [0, 1]', () => {
    for (const signal of signals) {
      expect(Number.isFinite(signal.utilizationFraction)).toBe(true);
      expect(signal.utilizationFraction).toBeGreaterThanOrEqual(0);
      expect(signal.utilizationFraction).toBeLessThanOrEqual(1);
    }
  });

  it('auditableEvidenceIds is an array (possibly empty) of evidence-seed-{n} ids', () => {
    for (const signal of signals) {
      expect(Array.isArray(signal.auditableEvidenceIds)).toBe(true);
      for (const id of signal.auditableEvidenceIds) {
        expect(id).toMatch(/^evidence-seed-\d+$/);
      }
    }
  });

  it('programKey, when present, is a non-empty string', () => {
    for (const signal of signals) {
      if (signal.programKey !== undefined) {
        expect(signal.programKey.length).toBeGreaterThan(0);
      }
    }
  });

  it('aiUseCaseKey, when present, matches the canonical ai-use-case-seed-{n} shape', () => {
    for (const signal of signals) {
      if (signal.aiUseCaseKey !== undefined) {
        expect(signal.aiUseCaseKey).toMatch(/^ai-use-case-seed-\d+$/);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Distribution constraints (per ACT12 spec)
// ---------------------------------------------------------------------

describe('distribution constraints', () => {
  it('has at least 3 critical signals', () => {
    const critical = signals.filter((s) => s.severity === 'critical');
    expect(critical.length).toBeGreaterThanOrEqual(3);
  });

  it('has at least 3 shadow_it signals', () => {
    const shadow = signals.filter((s) => s.kind === 'shadow_it');
    expect(shadow.length).toBeGreaterThanOrEqual(3);
  });

  it('has at least 2 signals linked to a programKey', () => {
    const linked = signals.filter((s) => s.programKey !== undefined);
    expect(linked.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least 2 signals linked to an aiUseCaseKey', () => {
    const linked = signals.filter((s) => s.aiUseCaseKey !== undefined);
    expect(linked.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------
// summarizeAiToolWasteSignals
// ---------------------------------------------------------------------

describe('summarizeAiToolWasteSignals', () => {
  const summary: AiToolWasteSignalSummary = summarizeAiToolWasteSignals(
    signals,
  );

  it('totalSignals equals the input length', () => {
    expect(summary.totalSignals).toBe(signals.length);
  });

  it('byKind counts reconcile to totalSignals', () => {
    const sum = Object.values(summary.byKind).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalSignals);
  });

  it('bySeverity counts reconcile to totalSignals', () => {
    const sum = Object.values(summary.bySeverity).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalSignals);
  });

  it('byStatus counts reconcile to totalSignals', () => {
    const sum = Object.values(summary.byStatus).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalSignals);
  });

  it('byKind exposes every canonical kind key (zero allowed)', () => {
    for (const kind of AI_TOOL_WASTE_SIGNAL_KINDS) {
      expect(typeof summary.byKind[kind]).toBe('number');
    }
  });

  it('bySeverity exposes every canonical severity key (zero allowed)', () => {
    for (const severity of AI_TOOL_WASTE_SEVERITIES) {
      expect(typeof summary.bySeverity[severity]).toBe('number');
    }
  });

  it('byStatus exposes every canonical status key (zero allowed)', () => {
    for (const status of AI_TOOL_WASTE_STATUSES) {
      expect(typeof summary.byStatus[status]).toBe('number');
    }
  });

  it('criticalCount equals bySeverity.critical', () => {
    expect(summary.criticalCount).toBe(summary.bySeverity.critical);
  });

  it('detectedCount equals byStatus.detected', () => {
    expect(summary.detectedCount).toBe(summary.byStatus.detected);
  });

  it('shadowItCount equals byKind.shadow_it', () => {
    expect(summary.shadowItCount).toBe(summary.byKind.shadow_it);
  });

  it('totalSeatsAffected equals the sum of seatsAffected across signals', () => {
    const expected = signals.reduce((acc, s) => acc + s.seatsAffected, 0);
    expect(summary.totalSeatsAffected).toBe(expected);
  });

  it('meanUtilizationFraction equals the arithmetic mean of utilizationFraction', () => {
    const sum = signals.reduce((acc, s) => acc + s.utilizationFraction, 0);
    const expected = sum / signals.length;
    expect(summary.meanUtilizationFraction).toBeCloseTo(expected, 10);
  });

  it('meanUtilizationFraction is in the closed interval [0, 1]', () => {
    expect(summary.meanUtilizationFraction).toBeGreaterThanOrEqual(0);
    expect(summary.meanUtilizationFraction).toBeLessThanOrEqual(1);
  });

  it('meanUtilizationFraction is 0 for an empty input list', () => {
    const emptySummary = summarizeAiToolWasteSignals([]);
    expect(emptySummary.meanUtilizationFraction).toBe(0);
    expect(emptySummary.totalSignals).toBe(0);
    expect(emptySummary.totalSeatsAffected).toBe(0);
  });

  it('summarizes the canonical seed when called with no arguments', () => {
    const defaultSummary = summarizeAiToolWasteSignals();
    expect(defaultSummary.totalSignals).toBe(signals.length);
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

describe('helpers', () => {
  it('getCriticalWasteSignals returns only severity === "critical"', () => {
    const critical = getCriticalWasteSignals(signals);
    expect(critical.length).toBeGreaterThanOrEqual(3);
    for (const signal of critical) {
      expect(signal.severity).toBe('critical');
    }
  });

  it('getCriticalWasteSignals excludes non-critical signals', () => {
    const critical = getCriticalWasteSignals(signals);
    const ids = new Set(critical.map((s) => s.id));
    for (const signal of signals) {
      if (signal.severity !== 'critical') {
        expect(ids.has(signal.id)).toBe(false);
      }
    }
  });

  it('getCriticalWasteSignals defaults to the canonical seed when called with no arguments', () => {
    expect(getCriticalWasteSignals().length).toBe(
      getCriticalWasteSignals(signals).length,
    );
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no-fabrication invariants', () => {
  const serialized = JSON.stringify(signals);

  it('does not invent dollar amounts in any string field', () => {
    expect(serialized).not.toMatch(/\$\s*\d/);
  });

  it('does not carry real product names (deny-list)', () => {
    const denyList = [
      'Copilot',
      'ChatGPT',
      'Claude',
      'Gemini',
      'OpenAI',
      'Anthropic',
      'Cohere',
      'Mistral',
      'Databricks',
      'Snowflake',
      'Microsoft',
      'GitHub',
      'Notion',
      'Glean',
      'Perplexity',
      'Bard',
      'Llama',
    ];
    for (const brand of denyList) {
      expect(serialized).not.toContain(brand);
    }
  });

  it('does not carry banned placeholder language', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(serialized).not.toContain(phrase);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene', () => {
  it('does not import from forbidden runtime areas', () => {
    const forbidden = [
      "from '@/lib/source",
      "from '@/lib/sentinel",
      "from '@/lib/atlas",
      "from '@/lib/nexus",
      "from '@/lib/agent",
      "from '@/lib/auth",
      "from 'supabase",
      "from '@/supabase",
    ];
    for (const fragment of forbidden) {
      expect(MODULE_SOURCE).not.toContain(fragment);
    }
  });

  it('does not call banned timing / randomness / network APIs', () => {
    const bannedFragments = [
      'Date.now',
      'Math.random',
      'new Date(',
      'fetch(',
      'anthropic',
      'openai',
      'useState',
      'useEffect',
    ];
    for (const fragment of bannedFragments) {
      expect(MODULE_SOURCE).not.toContain(fragment);
    }
  });

  it('does not contain placeholder language in the source', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(MODULE_SOURCE).not.toContain(phrase);
    }
  });

  it('does not contain real product names in the source', () => {
    // The module source includes its own naming-policy comment that
    // explicitly forbids real product names; the deny-list scan
    // ensures none of the canonical real product names slipped into
    // the seed prose, comments, or the placeholder factory.
    const denyList = [
      'Copilot',
      'ChatGPT',
      'Claude',
      'Gemini',
      'OpenAI',
      'Anthropic',
      'Cohere',
      'Mistral',
      'Databricks',
      'Snowflake',
      'Microsoft',
      'Notion',
      'Glean',
      'Perplexity',
      'Bard',
      'Llama',
    ];
    for (const brand of denyList) {
      expect(MODULE_SOURCE).not.toContain(brand);
    }
  });
});
