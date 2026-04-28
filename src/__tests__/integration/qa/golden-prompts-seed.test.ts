import { readFileSync } from 'fs';
import { resolve } from 'path';

const seedPath = resolve(
  __dirname,
  '../../../../docs/build/golden-prompts.seed.json',
);

interface GoldenPrompt {
  id: string;
  surface: string;
  persona: string;
  prompt: string;
  expectedBehavior: string;
  forbiddenBehavior: string;
  requiredContext: readonly string[];
  expectedAgent: string;
  validationMode: string;
  noFabricationChecks: readonly string[];
  readinessComponent: string;
  priority: string;
}

interface SeedDocument {
  schemaVersion: number;
  lastUpdated: string;
  prompts: readonly GoldenPrompt[];
}

const REQUIRED_FIELDS = [
  'id',
  'surface',
  'persona',
  'prompt',
  'expectedBehavior',
  'forbiddenBehavior',
  'requiredContext',
  'expectedAgent',
  'validationMode',
  'noFabricationChecks',
  'readinessComponent',
  'priority',
] as const;

const VALID_SURFACES = new Set<string>([
  'programs',
  'program_workshop',
  'deliverables',
  'intelligence',
  'tower',
  'admin',
  'source',
  'solution_intelligence',
  'evidence',
  'agent_missions',
]);

const SURFACE_MINIMUMS: Record<string, number> = {
  programs: 5,
  program_workshop: 4,
  deliverables: 4,
  intelligence: 4,
  tower: 4,
  admin: 3,
  source: 3,
  solution_intelligence: 4,
  evidence: 4,
  agent_missions: 5,
};

const VALID_PERSONAS = new Set<string>([
  'Client Maestro',
  'Founder / Platform Operator',
  'CIO',
  'CFO',
  'Steward Admin',
  'Data Owner',
  'Solution Architect',
  'VP Engineering',
]);

const VALID_AGENTS = new Set<string>([
  'nexus',
  'sentinel',
  'atlas',
  'steward',
  'system',
]);

const REQUIRED_AGENT_BUCKETS: readonly string[] = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];

const VALID_VALIDATION_MODES = new Set<string>([
  'static_match',
  'structured_match',
  'behavior_assertion',
  'manual_persona_review',
]);

const VALID_PRIORITIES = new Set<string>([
  'low',
  'medium',
  'high',
  'critical',
]);

const SPARSE_CONTEXT_REGEX = /\b(sparse|missing|without)\b/i;
const FAKE_DOLLAR_REGEX = /\$[0-9]/;
const FAKE_CITATION_REGEX = /\bE-\d+\b/;
const ID_PATTERN = /^gp-[a-z][a-z_-]*-\d{3}$/;

const BANNED_PHRASES = ['Coming soon', 'TBD', 'Lorem ipsum'] as const;

function loadSeed(): SeedDocument {
  const raw = readFileSync(seedPath, 'utf8');
  return JSON.parse(raw) as SeedDocument;
}

function collectStringValues(
  prompt: GoldenPrompt,
): { field: string; value: string }[] {
  const out: { field: string; value: string }[] = [];
  for (const [field, raw] of Object.entries(prompt)) {
    if (typeof raw === 'string') {
      out.push({ field, value: raw });
    } else if (Array.isArray(raw)) {
      for (const item of raw) {
        if (typeof item === 'string') {
          out.push({ field, value: item });
        }
      }
    }
  }
  return out;
}

describe('QA6 golden prompts seed library', () => {
  it('parses as JSON with the canonical top-level shape', () => {
    const seed = loadSeed();
    expect(seed.schemaVersion).toBe(1);
    expect(typeof seed.lastUpdated).toBe('string');
    expect(seed.lastUpdated.length).toBeGreaterThan(0);
    expect(Array.isArray(seed.prompts)).toBe(true);
  });

  it('contains at least 40 prompts', () => {
    const seed = loadSeed();
    expect(seed.prompts.length).toBeGreaterThanOrEqual(40);
  });

  it('represents all 10 canonical surfaces with their per-surface minimums', () => {
    const seed = loadSeed();
    const counts = new Map<string, number>();
    for (const prompt of seed.prompts) {
      counts.set(prompt.surface, (counts.get(prompt.surface) ?? 0) + 1);
    }
    for (const surface of VALID_SURFACES) {
      const got = counts.get(surface) ?? 0;
      const min = SURFACE_MINIMUMS[surface];
      expect(got).toBeGreaterThanOrEqual(min);
    }
    expect(counts.size).toBe(VALID_SURFACES.size);
  });

  it('represents all 4 expected agents (nexus / sentinel / atlas / steward) with at least 5 prompts each', () => {
    const seed = loadSeed();
    const counts = new Map<string, number>();
    for (const prompt of seed.prompts) {
      counts.set(prompt.expectedAgent, (counts.get(prompt.expectedAgent) ?? 0) + 1);
    }
    for (const agent of REQUIRED_AGENT_BUCKETS) {
      const got = counts.get(agent) ?? 0;
      expect(got).toBeGreaterThanOrEqual(5);
    }
  });

  it('represents all 4 validation modes', () => {
    const seed = loadSeed();
    const seen = new Set<string>();
    for (const prompt of seed.prompts) {
      seen.add(prompt.validationMode);
    }
    for (const mode of VALID_VALIDATION_MODES) {
      expect(seen.has(mode)).toBe(true);
    }
  });

  it('every prompt has every required field with non-empty values', () => {
    const seed = loadSeed();
    for (const prompt of seed.prompts) {
      for (const field of REQUIRED_FIELDS) {
        expect(prompt).toHaveProperty(field);
        const value = (prompt as unknown as Record<string, unknown>)[field];
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        } else if (Array.isArray(value)) {
          expect(value.length).toBeGreaterThan(0);
          for (const item of value) {
            expect(typeof item).toBe('string');
            expect((item as string).length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('every prompt uses a canonical surface, persona, agent, validation mode, and priority', () => {
    const seed = loadSeed();
    for (const prompt of seed.prompts) {
      expect(VALID_SURFACES.has(prompt.surface)).toBe(true);
      expect(VALID_PERSONAS.has(prompt.persona)).toBe(true);
      expect(VALID_AGENTS.has(prompt.expectedAgent)).toBe(true);
      expect(VALID_VALIDATION_MODES.has(prompt.validationMode)).toBe(true);
      expect(VALID_PRIORITIES.has(prompt.priority)).toBe(true);
    }
  });

  it('every prompt id is unique and matches the canonical pattern', () => {
    const seed = loadSeed();
    const seen = new Set<string>();
    for (const prompt of seed.prompts) {
      expect(seen.has(prompt.id)).toBe(false);
      seen.add(prompt.id);
      expect(ID_PATTERN.test(prompt.id)).toBe(true);
    }
  });

  it('contains at least 6 sparse-context probes', () => {
    const seed = loadSeed();
    const sparse = seed.prompts.filter((prompt) => {
      return (
        SPARSE_CONTEXT_REGEX.test(prompt.prompt) ||
        SPARSE_CONTEXT_REGEX.test(prompt.expectedBehavior)
      );
    });
    expect(sparse.length).toBeGreaterThanOrEqual(6);
  });

  it('contains no fabricated dollar amounts in any string field', () => {
    const seed = loadSeed();
    const offenders: string[] = [];
    for (const prompt of seed.prompts) {
      for (const { field, value } of collectStringValues(prompt)) {
        if (FAKE_DOLLAR_REGEX.test(value)) {
          offenders.push(`${prompt.id}.${field}: ${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('contains no fake E-### citation tokens in any string field', () => {
    const seed = loadSeed();
    const offenders: string[] = [];
    for (const prompt of seed.prompts) {
      for (const { field, value } of collectStringValues(prompt)) {
        if (FAKE_CITATION_REGEX.test(value)) {
          offenders.push(`${prompt.id}.${field}: ${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('contains no banned placeholder phrases', () => {
    const seed = loadSeed();
    const raw = readFileSync(seedPath, 'utf8');
    for (const phrase of BANNED_PHRASES) {
      expect(raw.toLowerCase().includes(phrase.toLowerCase())).toBe(false);
    }
  });

  it('every prompt has a non-empty forbiddenBehavior with concrete content', () => {
    const seed = loadSeed();
    for (const prompt of seed.prompts) {
      expect(prompt.forbiddenBehavior.length).toBeGreaterThanOrEqual(20);
      // forbiddenBehavior must mention at least one negation/refusal verb
      // to ensure it carries real content, not a placeholder.
      const hasNegation = /\b(do not|never|refuse|decline|must not)\b/i.test(
        prompt.forbiddenBehavior,
      );
      expect(hasNegation).toBe(true);
    }
  });

  it('every prompt declares at least one no-fabrication check', () => {
    const seed = loadSeed();
    for (const prompt of seed.prompts) {
      expect(prompt.noFabricationChecks.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('seed is deterministic (parses to the same shape across calls)', () => {
    const a = loadSeed();
    const b = loadSeed();
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });
});
