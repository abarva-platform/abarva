/**
 * SOL15 · Pattern Playbook integration tests
 * ≥30 tests covering shape, coverage scores, archetype completeness, risk flags.
 */

import {
  buildPatternPlaybook,
  buildPatternPlaybookSummary,
  type PatternPlaybook,
} from '@/lib/solutions/pattern-playbook';
import { SOLUTION_ARCHETYPE_KEYS } from '@/lib/solutions/solution-archetype-registry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_SEVERITIES = ['high', 'medium', 'low'] as const;

// ---------------------------------------------------------------------------
// Per-archetype: non-null, shape, constraints
// ---------------------------------------------------------------------------

describe('buildPatternPlaybook — canonical archetypes', () => {
  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'returns non-null for archetype %s',
    (key) => {
      expect(buildPatternPlaybook(key)).not.toBeNull();
    },
  );

  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'archetypeId matches input for %s',
    (key) => {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      expect(pb.archetypeId).toBe(key);
    },
  );

  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'createdFrom is sol15_pattern_playbook for %s',
    (key) => {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      expect(pb.createdFrom).toBe('sol15_pattern_playbook');
    },
  );

  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'recommendedWorkshops length is 2–4 for %s',
    (key) => {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      expect(pb.recommendedWorkshops.length).toBeGreaterThanOrEqual(2);
      expect(pb.recommendedWorkshops.length).toBeLessThanOrEqual(4);
    },
  );

  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'keyDeliverables length is 3–5 for %s',
    (key) => {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      expect(pb.keyDeliverables.length).toBeGreaterThanOrEqual(3);
      expect(pb.keyDeliverables.length).toBeLessThanOrEqual(5);
    },
  );

  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'coverageScore is in [0, 1] for %s',
    (key) => {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      expect(pb.coverageScore).toBeGreaterThanOrEqual(0);
      expect(pb.coverageScore).toBeLessThanOrEqual(1);
    },
  );

  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'riskFlags length is 2–3 for %s',
    (key) => {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      expect(pb.riskFlags.length).toBeGreaterThanOrEqual(2);
      expect(pb.riskFlags.length).toBeLessThanOrEqual(3);
    },
  );

  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'all riskFlag severities are valid for %s',
    (key) => {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      for (const flag of pb.riskFlags) {
        expect(VALID_SEVERITIES).toContain(flag.severity);
      }
    },
  );

  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'all workshop templateIds are non-empty strings for %s',
    (key) => {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      for (const ws of pb.recommendedWorkshops) {
        expect(typeof ws.templateId).toBe('string');
        expect(ws.templateId.length).toBeGreaterThan(0);
      }
    },
  );

  test.each(SOLUTION_ARCHETYPE_KEYS as string[])(
    'archetypeLabel is a non-empty string for %s',
    (key) => {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      expect(typeof pb.archetypeLabel).toBe('string');
      expect(pb.archetypeLabel.length).toBeGreaterThan(0);
    },
  );
});

// ---------------------------------------------------------------------------
// Unknown archetype
// ---------------------------------------------------------------------------

describe('buildPatternPlaybook — unknown archetype', () => {
  test('returns null for an unknown archetype ID', () => {
    expect(buildPatternPlaybook('__unknown_archetype__')).toBeNull();
  });

  test('returns null for an empty string', () => {
    expect(buildPatternPlaybook('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Workshop fields
// ---------------------------------------------------------------------------

describe('buildPatternPlaybook — workshop fields', () => {
  test('every recommended workshop has a non-empty templateName', () => {
    for (const key of SOLUTION_ARCHETYPE_KEYS) {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      for (const ws of pb.recommendedWorkshops) {
        expect(ws.templateName.length).toBeGreaterThan(0);
      }
    }
  });

  test('every recommended workshop has a non-empty rationale', () => {
    for (const key of SOLUTION_ARCHETYPE_KEYS) {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      for (const ws of pb.recommendedWorkshops) {
        expect(ws.rationale.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Deliverable fields
// ---------------------------------------------------------------------------

describe('buildPatternPlaybook — deliverable fields', () => {
  test('every deliverable has a non-empty id', () => {
    for (const key of SOLUTION_ARCHETYPE_KEYS) {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      for (const d of pb.keyDeliverables) {
        expect(d.id.length).toBeGreaterThan(0);
      }
    }
  });

  test('every deliverable has a non-empty label', () => {
    for (const key of SOLUTION_ARCHETYPE_KEYS) {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      for (const d of pb.keyDeliverables) {
        expect(d.label.length).toBeGreaterThan(0);
      }
    }
  });

  test('every deliverable has a non-empty phase', () => {
    for (const key of SOLUTION_ARCHETYPE_KEYS) {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      for (const d of pb.keyDeliverables) {
        expect(d.phase.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Risk flag fields
// ---------------------------------------------------------------------------

describe('buildPatternPlaybook — risk flag fields', () => {
  test('every riskFlag has a non-empty id', () => {
    for (const key of SOLUTION_ARCHETYPE_KEYS) {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      for (const rf of pb.riskFlags) {
        expect(rf.id.length).toBeGreaterThan(0);
      }
    }
  });

  test('every riskFlag has a non-empty label', () => {
    for (const key of SOLUTION_ARCHETYPE_KEYS) {
      const pb = buildPatternPlaybook(key) as PatternPlaybook;
      for (const rf of pb.riskFlags) {
        expect(rf.label.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// buildPatternPlaybookSummary
// ---------------------------------------------------------------------------

describe('buildPatternPlaybookSummary', () => {
  let summary: ReadonlyArray<PatternPlaybook>;

  beforeAll(() => {
    summary = buildPatternPlaybookSummary();
  });

  test('returns an array with the same count as SOLUTION_ARCHETYPE_KEYS', () => {
    expect(summary.length).toBe(SOLUTION_ARCHETYPE_KEYS.length);
  });

  test('returns exactly 12 items', () => {
    expect(summary.length).toBe(12);
  });

  test('is sorted by archetypeId ascending', () => {
    for (let i = 1; i < summary.length; i++) {
      expect(
        summary[i].archetypeId.localeCompare(summary[i - 1].archetypeId),
      ).toBeGreaterThanOrEqual(0);
    }
  });

  test('average coverageScore is > 0', () => {
    const avg = summary.reduce((sum, pb) => sum + pb.coverageScore, 0) / summary.length;
    expect(avg).toBeGreaterThan(0);
  });

  test('all entries have createdFrom sol15_pattern_playbook', () => {
    for (const pb of summary) {
      expect(pb.createdFrom).toBe('sol15_pattern_playbook');
    }
  });

  test('all archetypeIds are unique', () => {
    const ids = summary.map((pb) => pb.archetypeId);
    const unique = new Set(ids);
    expect(unique.size).toBe(summary.length);
  });

  test('all archetypeIds are from the canonical key list', () => {
    const keySet = new Set(SOLUTION_ARCHETYPE_KEYS as string[]);
    for (const pb of summary) {
      expect(keySet.has(pb.archetypeId)).toBe(true);
    }
  });

  test('no coverageScore exceeds 1', () => {
    for (const pb of summary) {
      expect(pb.coverageScore).toBeLessThanOrEqual(1);
    }
  });

  test('coverageScore equals recommendedWorkshops.length / 7', () => {
    for (const pb of summary) {
      expect(pb.coverageScore).toBeCloseTo(pb.recommendedWorkshops.length / 7, 10);
    }
  });
});

// ---------------------------------------------------------------------------
// Spot-check specific archetypes
// ---------------------------------------------------------------------------

describe('buildPatternPlaybook — spot checks', () => {
  test('ai_governance_operating_model has a high-severity risk flag', () => {
    const pb = buildPatternPlaybook('ai_governance_operating_model') as PatternPlaybook;
    const hasHigh = pb.riskFlags.some((rf) => rf.severity === 'high');
    expect(hasHigh).toBe(true);
  });

  test('healthcare_ambient_clinical_value_chain has 5 deliverables', () => {
    const pb = buildPatternPlaybook('healthcare_ambient_clinical_value_chain') as PatternPlaybook;
    expect(pb.keyDeliverables.length).toBe(5);
  });

  test('build_buy_partner_evaluation workshops include executive_review', () => {
    const pb = buildPatternPlaybook('build_buy_partner_evaluation') as PatternPlaybook;
    const ids = pb.recommendedWorkshops.map((ws) => ws.templateId);
    expect(ids).toContain('wstpl:executive_review:decision_review');
  });

  test('finance_fpna_ai_automation has roi_model in deliverables', () => {
    const pb = buildPatternPlaybook('finance_fpna_ai_automation') as PatternPlaybook;
    const ids = pb.keyDeliverables.map((d) => d.id);
    expect(ids).toContain('roi_model');
  });
});
