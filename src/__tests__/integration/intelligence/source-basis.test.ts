// I7 · Internal / External Source Basis tests.
//
// Pure deterministic tests over the I7 source-basis seed builder, the
// summarizer, and the internal / external accessors, plus a static
// hygiene pass over the source module.

import {
  buildIntelligenceSourceBasisSeed,
  summarizeIntelligenceSourceBasis,
  getInternalOnlyBases,
  getExternalOnlyBases,
  INTELLIGENCE_SOURCE_BASIS_KINDS,
  INTELLIGENCE_SOURCE_BASIS_CONFIDENCES,
  type IntelligenceSourceBasis,
  type IntelligenceSourceBasisKind,
  type IntelligenceSourceBasisConfidence,
} from '@/lib/intelligence/source-basis';

const INTERNAL_KINDS: ReadonlySet<IntelligenceSourceBasisKind> = new Set([
  'internal_program_evidence',
  'internal_workshop_notes',
  'internal_evidence_ledger',
]);

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildIntelligenceSourceBasisSeed · determinism', () => {
  it('returns byte-equal arrays across repeated calls', () => {
    const a = buildIntelligenceSourceBasisSeed();
    const b = buildIntelligenceSourceBasisSeed();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('every basis carries the deterministic createdFrom marker', () => {
    for (const basis of buildIntelligenceSourceBasisSeed()) {
      expect(basis.createdFrom).toBe(
        'deterministic_intelligence_source_basis_seed',
      );
    }
  });

  it('basis ids follow the deterministic intel-source-basis-seed-N form', () => {
    for (const basis of buildIntelligenceSourceBasisSeed()) {
      expect(basis.id).toMatch(/^intel-source-basis-seed-\d+$/);
    }
  });

  it('basis ids are unique across the seed set', () => {
    const ids = buildIntelligenceSourceBasisSeed().map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------
// Coverage requirements
// ---------------------------------------------------------------------

describe('seed coverage', () => {
  const bases = buildIntelligenceSourceBasisSeed();

  it('seeds at least 1 basis (sanity)', () => {
    expect(bases.length).toBeGreaterThanOrEqual(1);
  });

  it('covers all 6 source basis kinds across the seed set', () => {
    const seen = new Set<IntelligenceSourceBasisKind>();
    for (const basis of bases) {
      seen.add(basis.kind);
    }
    for (const kind of INTELLIGENCE_SOURCE_BASIS_KINDS) {
      expect(seen.has(kind)).toBe(true);
    }
    expect(seen.size).toBe(INTELLIGENCE_SOURCE_BASIS_KINDS.length);
  });

  it('covers all 3 confidence labels across the seed set', () => {
    const seen = new Set<IntelligenceSourceBasisConfidence>();
    for (const basis of bases) {
      seen.add(basis.confidence);
    }
    for (const conf of INTELLIGENCE_SOURCE_BASIS_CONFIDENCES) {
      expect(seen.has(conf)).toBe(true);
    }
    expect(seen.size).toBe(INTELLIGENCE_SOURCE_BASIS_CONFIDENCES.length);
  });

  it('every seeded pattern key carries at least 1 internal and 1 external basis', () => {
    const byPattern = new Map<string, IntelligenceSourceBasis[]>();
    for (const b of bases) {
      const list = byPattern.get(b.patternKey) ?? [];
      list.push(b);
      byPattern.set(b.patternKey, list);
    }
    for (const [, list] of byPattern) {
      const internal = list.filter((b) => INTERNAL_KINDS.has(b.kind));
      const external = list.filter((b) => !INTERNAL_KINDS.has(b.kind));
      expect(internal.length).toBeGreaterThanOrEqual(1);
      expect(external.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------
// Per-basis contract
// ---------------------------------------------------------------------

describe('per-basis contract', () => {
  const bases = buildIntelligenceSourceBasisSeed();

  it('every basis carries a non-empty label, rationale, and citationLocator', () => {
    for (const basis of bases) {
      expect(basis.label.length).toBeGreaterThan(0);
      expect(basis.rationale.length).toBeGreaterThan(0);
      expect(basis.citationLocator.length).toBeGreaterThan(0);
    }
  });

  it('citationLocator strings are structured seed refs (no http or https)', () => {
    for (const basis of bases) {
      expect(basis.citationLocator).not.toMatch(/https?:\/\//);
    }
  });

  it('every basis kind belongs to the canonical kind tuple', () => {
    const allowed = new Set<IntelligenceSourceBasisKind>(
      INTELLIGENCE_SOURCE_BASIS_KINDS,
    );
    for (const basis of bases) {
      expect(allowed.has(basis.kind)).toBe(true);
    }
  });

  it('every basis confidence belongs to the canonical confidence tuple', () => {
    const allowed = new Set<IntelligenceSourceBasisConfidence>(
      INTELLIGENCE_SOURCE_BASIS_CONFIDENCES,
    );
    for (const basis of bases) {
      expect(allowed.has(basis.confidence)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeIntelligenceSourceBasis', () => {
  const bases = buildIntelligenceSourceBasisSeed();
  const summary = summarizeIntelligenceSourceBasis(bases);

  it('totalBases equals the input length', () => {
    expect(summary.totalBases).toBe(bases.length);
  });

  it('internalCount + externalCount equals totalBases', () => {
    expect(summary.internalCount + summary.externalCount).toBe(
      summary.totalBases,
    );
  });

  it('confidenceBreakdown sums to totalBases', () => {
    const sum = INTELLIGENCE_SOURCE_BASIS_CONFIDENCES.reduce(
      (acc, c) => acc + summary.confidenceBreakdown[c],
      0,
    );
    expect(sum).toBe(summary.totalBases);
  });

  it('kindBreakdown sums to totalBases', () => {
    const sum = INTELLIGENCE_SOURCE_BASIS_KINDS.reduce(
      (acc, k) => acc + summary.kindBreakdown[k],
      0,
    );
    expect(sum).toBe(summary.totalBases);
  });

  it('honestDisclaimer mentions deterministic seed and disclaims live external retrieval', () => {
    expect(summary.honestDisclaimer.toLowerCase()).toMatch(/deterministic seed/);
    expect(summary.honestDisclaimer.toLowerCase()).toMatch(
      /no live external retrieval/,
    );
  });

  it('summary is byte-equal across repeated calls with the same input', () => {
    const a = summarizeIntelligenceSourceBasis(bases);
    const b = summarizeIntelligenceSourceBasis(bases);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('summary on an empty array reports zero counts and stable disclaimer', () => {
    const empty = summarizeIntelligenceSourceBasis([]);
    expect(empty.totalBases).toBe(0);
    expect(empty.internalCount).toBe(0);
    expect(empty.externalCount).toBe(0);
    expect(empty.honestDisclaimer.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Internal / External accessors
// ---------------------------------------------------------------------

describe('getInternalOnlyBases / getExternalOnlyBases', () => {
  const bases = buildIntelligenceSourceBasisSeed();
  const internal = getInternalOnlyBases(bases);
  const external = getExternalOnlyBases(bases);

  it('internal accessor returns only kinds whose name starts with internal_', () => {
    for (const b of internal) {
      expect(INTERNAL_KINDS.has(b.kind)).toBe(true);
      expect(b.kind).toMatch(/^internal_/);
    }
  });

  it('external accessor returns only kinds whose name starts with external_', () => {
    for (const b of external) {
      expect(INTERNAL_KINDS.has(b.kind)).toBe(false);
      expect(b.kind).toMatch(/^external_/);
    }
  });

  it('internal + external counts equal the seed length and are disjoint', () => {
    expect(internal.length + external.length).toBe(bases.length);
    const internalIds = new Set(internal.map((b) => b.id));
    for (const b of external) {
      expect(internalIds.has(b.id)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------
// Serialization hygiene
// ---------------------------------------------------------------------

describe('serialization hygiene', () => {
  const serialized = JSON.stringify(buildIntelligenceSourceBasisSeed());

  it('contains no https:// or http:// URLs', () => {
    expect(serialized).not.toMatch(/https?:\/\//);
  });

  it('contains no E-### / E-#### literal citation tokens', () => {
    expect(serialized).not.toMatch(/\bE-\d+\b/);
  });

  it('contains no fabricated dollar amounts', () => {
    expect(serialized).not.toMatch(/\$\d/);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · source-basis.ts
// ---------------------------------------------------------------------

describe('module hygiene · source-basis.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/intelligence/source-basis.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('does not import Sentinel runtime, Atlas, Nexus, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from 'supabase/);
  });

  it('does not import any model SDK', () => {
    expect(codeOnly).not.toMatch(/from 'anthropic'/);
    expect(codeOnly).not.toMatch(/from '@anthropic-ai\//);
    expect(codeOnly).not.toMatch(/from 'openai'/);
  });

  it('does not invoke runtime side-effects (Date.now / Math.random / new Date / fetch)', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
