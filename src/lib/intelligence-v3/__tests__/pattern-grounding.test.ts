// Guards the Intelligence/Move binder against CROSS-NAMESPACE mis-binds: a valid
// `corpus_patterns` id (PAT-LSH-D18-00479, public-sector procurement) leaking
// onto a Kyriba/treasury decision card whose grounding set is the genome
// `LSH-TMS-*` namespace. The guard is grounding-scoped: an id is valid for a card
// only if it belongs to that card's active namespace — even if it is a real id
// elsewhere. A generic "absent from all tables" check would NOT catch this.

import {
  classifyPatternId,
  isIdInNamespace,
  groundingNamespaceForText,
  filterToGrounding,
  partitionIdsByGrounding,
  type GroundingDiagnostic,
  type PatternNamespace,
} from '../pattern-grounding';
import { selectRelevantPatternRows } from '../pattern-relevance';

// Mirrors the GroundedCandidate shape the binder selects over. Typed with the
// wide PatternNamespace so corpus/genome candidates unify into one array type.
interface Cand {
  namespace: PatternNamespace;
  id: string;
  title: string;
  category: string | null;
  vertical_overlays: string[] | null;
  depth_score: number;
  confidence: number;
}

const TMS_002: Cand = {
  namespace: 'genome-lsh-tms',
  id: 'LSH-TMS-002',
  title: 'Bank connectivity matrix clears before rollout confidence is claimed',
  category: 'treasury',
  vertical_overlays: ['treasury', 'kyriba', 'bank-connectivity'],
  depth_score: 70,
  confidence: 0.9,
};
const TMS_009: Cand = {
  namespace: 'genome-lsh-tms',
  id: 'LSH-TMS-009',
  title: 'Payment approval and BEC controls are rollout acceptance criteria',
  category: 'treasury',
  vertical_overlays: ['treasury', 'payments', 'bec'],
  depth_score: 65,
  confidence: 0.9,
};
const D18_PROCUREMENT: Cand = {
  namespace: 'corpus-pat-lsh',
  id: 'PAT-LSH-D18-00479',
  title: 'Prioritize City and State Procurement Calendars For Timing Local Bids',
  category: 'D18',
  vertical_overlays: ['public_sector'],
  depth_score: 99, // higher depth — would win a depth/positional bind
  confidence: 0.92,
};

const KYRIBA_TEXT = 'Kyriba global treasury rollout — modernize treasury and bank connectivity';

describe('classifyPatternId (namespace by id shape, case-insensitive)', () => {
  it('classifies LSH-TMS codes as the genome treasury namespace', () => {
    expect(classifyPatternId('LSH-TMS-002')).toBe('genome-lsh-tms');
    expect(classifyPatternId('lsh-tms-009')).toBe('genome-lsh-tms');
  });

  // Test 6: case-insensitive lookup does not falsely mark real lowercase slugs absent.
  it('classifies real lowercase pat-lsh slugs as corpus (not unknown)', () => {
    expect(classifyPatternId('pat-lsh-d18-00479')).toBe('corpus-pat-lsh');
    expect(classifyPatternId('PAT-LSH-D18-00479')).toBe('corpus-pat-lsh');
  });

  it('returns unknown for fabricated/foreign ids', () => {
    expect(classifyPatternId('TOTALLY-MADE-UP-1')).toBe('unknown');
    expect(classifyPatternId('')).toBe('unknown');
    expect(classifyPatternId(null)).toBe('unknown');
  });
});

describe('groundingNamespaceForText', () => {
  it('grounds Kyriba/treasury decisions in the genome LSH-TMS namespace', () => {
    expect(groundingNamespaceForText(KYRIBA_TEXT)).toBe('genome-lsh-tms');
    expect(groundingNamespaceForText('Payment approval and bank connectivity')).toBe('genome-lsh-tms');
  });

  it('defaults non-treasury decisions to the corpus pat-lsh namespace', () => {
    expect(groundingNamespaceForText('Store associate productivity rollout')).toBe('corpus-pat-lsh');
    expect(groundingNamespaceForText('')).toBe('corpus-pat-lsh');
  });
});

describe('filterToGrounding (the emission-point guard)', () => {
  // Test 1: a known valid pattern in the active grounding namespace passes.
  it('keeps an id that is in the active grounding namespace', () => {
    const kept = filterToGrounding([TMS_002], (c) => c.id, 'genome-lsh-tms');
    expect(kept.map((c) => c.id)).toEqual(['LSH-TMS-002']);
  });

  // Test 2 + 3: a valid pattern from the WRONG namespace is rejected — including
  // PAT-LSH-D18-00479 for Kyriba/treasury (genome-lsh-tms) grounding.
  it('rejects a valid id from the wrong namespace and records a diagnostic', () => {
    const diags: GroundingDiagnostic[] = [];
    const kept = filterToGrounding(
      [TMS_002, D18_PROCUREMENT, TMS_009],
      (c) => c.id,
      'genome-lsh-tms',
      diags,
    );
    expect(kept.map((c) => c.id)).toEqual(['LSH-TMS-002', 'LSH-TMS-009']);
    expect(kept.some((c) => c.id === 'PAT-LSH-D18-00479')).toBe(false);
    expect(diags).toHaveLength(1);
    expect(diags[0]).toMatchObject({
      rejectedId: 'PAT-LSH-D18-00479',
      rejectedNamespace: 'corpus-pat-lsh',
      grounding: 'genome-lsh-tms',
    });
  });

  it('drops unknown-namespace ids (fail closed)', () => {
    const kept = filterToGrounding(
      [{ id: 'NONSENSE-1' }],
      (c) => c.id,
      'genome-lsh-tms',
    );
    expect(kept).toHaveLength(0);
  });
});

describe('end-to-end binder simulation (grounding pool + relevance + guard)', () => {
  // Test 4: a Kyriba query binds a real LSH-TMS pattern (from the grounding pool),
  // never the higher-depth off-namespace procurement pattern.
  it('binds a real LSH-TMS pattern for a Kyriba/treasury card', () => {
    const grounding = groundingNamespaceForText(KYRIBA_TEXT);
    expect(grounding).toBe('genome-lsh-tms');

    const pool: Cand[] = grounding === 'genome-lsh-tms' ? [TMS_002, TMS_009] : [D18_PROCUREMENT];
    const selected = selectRelevantPatternRows(KYRIBA_TEXT, pool, 2);
    const guarded = filterToGrounding(selected, (c) => c.id, grounding);

    expect(guarded.length).toBeGreaterThan(0);
    expect(guarded.every((c) => isIdInNamespace(c.id, 'genome-lsh-tms'))).toBe(true);
    expect(guarded.some((c) => c.id === 'PAT-LSH-D18-00479')).toBe(false);
  });

  // Test 5: even if the depth-ranked pool wrongly included the procurement
  // pattern, the guard prevents it reaching the card's citations/evidence.
  it('never emits a cross-namespace citation even if the pool is contaminated', () => {
    const grounding = groundingNamespaceForText(KYRIBA_TEXT);
    const contaminated: Cand[] = [D18_PROCUREMENT, TMS_002]; // procurement first (higher depth)
    const selected = selectRelevantPatternRows(KYRIBA_TEXT, contaminated, 2);
    const citations = filterToGrounding(selected, (c) => c.id, grounding).map((c) => c.id);
    expect(citations).not.toContain('PAT-LSH-D18-00479');
    expect(citations.every((id) => isIdInNamespace(id, 'genome-lsh-tms'))).toBe(true);
  });
});

describe('partitionIdsByGrounding', () => {
  it('splits ids into valid and rejected for the active namespace', () => {
    const { valid, rejected } = partitionIdsByGrounding(
      ['LSH-TMS-002', 'PAT-LSH-D18-00479', 'LSH-TMS-009'],
      'genome-lsh-tms',
    );
    expect(valid).toEqual(['LSH-TMS-002', 'LSH-TMS-009']);
    expect(rejected).toEqual(['PAT-LSH-D18-00479']);
  });
});
