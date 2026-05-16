// Slice 0.2 — coherence tests for the Moves solution-archetype taxonomy and
// its behaviour-test fixtures. No classifier is exercised here (that is Slice
// 2.1); these tests prove the taxonomy + fixtures form a complete, internally
// consistent contract a classifier could be built against.

import {
  SOLUTION_ARCHETYPES,
  SOLUTION_ARCHETYPE_BY_KEY,
  SOLUTION_ARCHETYPE_KEYS,
  getSolutionArchetype,
  meetsReadiness,
  type MaturityLevel,
  type SolutionArchetypeKey,
} from '../solution-archetype-taxonomy';
import { ARCHETYPE_FIXTURES } from '../archetype-fixtures';

const EXPECTED_KEYS: readonly SolutionArchetypeKey[] = [
  'automation',
  'assistant',
  'retrieval_copilot',
  'human_in_loop_agent',
  'full_agentic_workflow',
  'data_remediation',
  'vendor_led_implementation',
  'process_redesign',
];

describe('SOLUTION_ARCHETYPES taxonomy', () => {
  it('defines exactly the 8 required archetypes', () => {
    expect(SOLUTION_ARCHETYPES).toHaveLength(8);
    expect([...SOLUTION_ARCHETYPE_KEYS].sort()).toEqual(
      [...EXPECTED_KEYS].sort(),
    );
  });

  it('has unique archetype keys', () => {
    const keys = SOLUTION_ARCHETYPES.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every archetype non-empty fit guidance, gates, evidence, and anti-patterns', () => {
    for (const a of SOLUTION_ARCHETYPES) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.summary.length).toBeGreaterThan(0);
      expect(a.whenItFits.length).toBeGreaterThan(0);
      expect(a.whenItDoesNotFit.length).toBeGreaterThan(0);
      expect(a.evidenceInputs.length).toBeGreaterThan(0);
      expect(a.antiPatterns.length).toBeGreaterThan(0);
    }
  });

  it('defines a readiness gate for all three dimensions on every archetype', () => {
    for (const a of SOLUTION_ARCHETYPES) {
      const dims = a.readinessGates.map((g) => g.dimension).sort();
      expect(dims).toEqual(['control', 'data', 'eval']);
    }
  });

  it('uses unique anti-pattern codes within each archetype', () => {
    for (const a of SOLUTION_ARCHETYPES) {
      const codes = a.antiPatterns.map((p) => p.code);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });

  it('indexes every archetype by key', () => {
    for (const key of EXPECTED_KEYS) {
      expect(SOLUTION_ARCHETYPE_BY_KEY[key].key).toBe(key);
      expect(getSolutionArchetype(key).key).toBe(key);
    }
  });

  it('escalates agentic ambition: full agentic workflow is the most ambitious', () => {
    const full = getSolutionArchetype('full_agentic_workflow');
    const automation = getSolutionArchetype('automation');
    expect(full.agenticAmbition).toBeGreaterThan(automation.agenticAmbition);
    expect(full.agenticAmbition).toBe(6);
  });

  it('flags the canonical over-reach anti-pattern on full agentic workflow', () => {
    const full = getSolutionArchetype('full_agentic_workflow');
    expect(full.antiPatterns.map((p) => p.code)).toContain(
      'full_agentic_on_low_data_readiness',
    );
  });
});

describe('meetsReadiness', () => {
  const cases: ReadonlyArray<[MaturityLevel, MaturityLevel, boolean]> = [
    ['none', 'none', true],
    ['high', 'low', true],
    ['moderate', 'moderate', true],
    ['low', 'high', false],
    ['none', 'low', false],
  ];
  it.each(cases)('actual %s vs required %s -> %s', (actual, required, want) => {
    expect(meetsReadiness(actual, required)).toBe(want);
  });
});

describe('ARCHETYPE_FIXTURES', () => {
  it('provides at least 8 fixtures covering all 8 archetypes', () => {
    expect(ARCHETYPE_FIXTURES.length).toBeGreaterThanOrEqual(8);
    const covered = new Set(ARCHETYPE_FIXTURES.map((f) => f.expectedArchetype));
    expect([...covered].sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it('has unique fixture ids', () => {
    const ids = ARCHETYPE_FIXTURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only valid archetype keys', () => {
    for (const f of ARCHETYPE_FIXTURES) {
      expect(SOLUTION_ARCHETYPE_BY_KEY[f.expectedArchetype]).toBeDefined();
      if (f.temptingButWrong) {
        expect(
          SOLUTION_ARCHETYPE_BY_KEY[f.temptingButWrong.archetype],
        ).toBeDefined();
      }
    }
  });

  it('gives every fixture a non-empty proposed Move and reasons', () => {
    for (const f of ARCHETYPE_FIXTURES) {
      expect(f.proposedMove.trim().length).toBeGreaterThan(0);
      expect(f.expectedReasons.length).toBeGreaterThan(0);
    }
  });

  it('cites a real anti-pattern code on the wrongly-tempting archetype', () => {
    for (const f of ARCHETYPE_FIXTURES) {
      if (!f.temptingButWrong) continue;
      const wrong = SOLUTION_ARCHETYPE_BY_KEY[f.temptingButWrong.archetype];
      const codes = wrong.antiPatterns.map((p) => p.code);
      expect(codes).toContain(f.temptingButWrong.antiPatternCode);
    }
  });

  // Precondition archetypes (data_remediation, process_redesign) are NOT
  // agentic solutions; their own gates are deliberately permissive. A fixture
  // classified into one of these reports the readiness the *downstream*
  // blocked use case needs, not the precondition archetype's own gate — so
  // those gaps are exempt from the gate-equality assertion below.
  const PRECONDITION_ARCHETYPES: ReadonlySet<SolutionArchetypeKey> = new Set([
    'data_remediation',
    'process_redesign',
  ]);

  it('reports readiness gaps whose current value matches the scenario profile', () => {
    for (const f of ARCHETYPE_FIXTURES) {
      const archetype = getSolutionArchetype(f.expectedArchetype);
      for (const gap of f.expectedReadinessGaps) {
        const gate = archetype.readinessGates.find(
          (g) => g.dimension === gap.dimension,
        );
        expect(gate).toBeDefined();
        // The fixture's current readiness matches the scenario profile.
        expect(gap.current).toBe(f.readiness[gap.dimension]);
        // A gap must be a genuine shortfall: required strictly exceeds current.
        expect(meetsReadiness(gap.current, gap.required)).toBe(false);
        // For agentic-solution archetypes the stated requirement matches the
        // taxonomy gate. Precondition archetypes are exempt (see above).
        if (!PRECONDITION_ARCHETYPES.has(f.expectedArchetype)) {
          expect(gap.required).toBe(gate!.minimum);
        }
      }
    }
  });

  it('keeps fixture readiness consistent with the chosen archetype gates', () => {
    // A fixture should not claim an agentic-solution archetype while leaving
    // an unsatisfied gate unreported as a gap — that would be an incoherent
    // classification. Precondition archetypes are exempt: their permissive
    // gates are met by construction.
    for (const f of ARCHETYPE_FIXTURES) {
      if (PRECONDITION_ARCHETYPES.has(f.expectedArchetype)) continue;
      const archetype = getSolutionArchetype(f.expectedArchetype);
      const reportedDims = new Set(
        f.expectedReadinessGaps.map((g) => g.dimension),
      );
      for (const gate of archetype.readinessGates) {
        const satisfied = meetsReadiness(
          f.readiness[gate.dimension],
          gate.minimum,
        );
        if (!satisfied) {
          expect(reportedDims.has(gate.dimension)).toBe(true);
        }
      }
    }
  });
});
