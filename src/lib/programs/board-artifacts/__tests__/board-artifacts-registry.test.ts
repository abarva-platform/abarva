// board-artifacts-registry — unit tests.
//
// Covers the stable identity match: the Apex "Contact Center AI Routing" Move
// resolves to its 5 board-grade decks (the Costed pack carrying a pptxHref);
// any unrelated Move resolves to `[]`.

import {
  boardArtifactsForMove,
  canonicalTenantKey,
} from '../board-artifacts-registry';
import type { StrategicMove } from '../../types.ui';

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  const base: StrategicMove = {
    id: 'move-uuid',
    displayCode: 'APX-CC-2026',
    name: 'Contact Center AI Routing',
    tenant: { id: 'tenant-apex', name: 'Apex Retail Group', industryCode: 'retail' },
    archetype: 'AI Product Enablement',
    currentPhase: 3,
    phaseLabel: 'Design & Plan',
    status: { key: 'active', text: 'On track', description: '' },
    statusColor: 'green',
    sponsor: null,
    participants: [],
    valueAtStake: { projected: null, verified: null, assumptions: null },
    deliverables: [],
    gateCriteria: [],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: '',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  return { ...base, ...overrides };
}

describe('boardArtifactsForMove — Apex Contact Center AI Routing', () => {
  it('resolves to the 5 board-grade decks', () => {
    const artifacts = boardArtifactsForMove(makeMove());
    expect(artifacts).toHaveLength(5);
    expect(artifacts.map((a) => a.id).sort()).toEqual([
      'cfo-pack',
      'charter-skeleton',
      'costed-business-case',
      'discover-brief',
      'solution-architecture',
    ]);
  });

  it('surfaces the Charter Skeleton and CFO Pack decks', () => {
    const artifacts = boardArtifactsForMove(makeMove());
    const charter = artifacts.find((a) => a.id === 'charter-skeleton');
    const cfo = artifacts.find((a) => a.id === 'cfo-pack');

    expect(charter?.label).toBe('Charter Business-Case Skeleton');
    expect(charter?.phase).toBe('Charter');
    expect(charter?.htmlHref).toBe(
      '/api/v1/moves/board-grade-charter-skeleton',
    );
    expect(charter?.pptxHref).toBeUndefined();

    expect(cfo?.label).toBe('CFO Pack');
    expect(cfo?.phase).toBe('Design & Plan');
    expect(cfo?.htmlHref).toBe('/api/v1/moves/board-grade-cfo-pack');
    expect(cfo?.pptxHref).toBeUndefined();
  });

  it('the Costed Business-Case Pack carries a pptxHref; the others do not', () => {
    const artifacts = boardArtifactsForMove(makeMove());
    const costed = artifacts.find((a) => a.id === 'costed-business-case');
    const discover = artifacts.find((a) => a.id === 'discover-brief');
    const architecture = artifacts.find((a) => a.id === 'solution-architecture');

    expect(costed?.label).toBe('Costed Business-Case Pack');
    expect(costed?.htmlHref).toBe('/api/v1/moves/board-grade-business-case');
    expect(costed?.pptxHref).toBe('/api/v1/moves/board-grade-business-case?format=pptx');

    expect(discover?.htmlHref).toBe('/api/v1/moves/board-grade-discover-brief');
    expect(discover?.pptxHref).toBeUndefined();

    expect(architecture?.htmlHref).toBe('/api/v1/moves/board-grade-solution-architecture');
    expect(architecture?.pptxHref).toBeUndefined();
  });

  it('every artifact carries a label, phase and blurb', () => {
    for (const artifact of boardArtifactsForMove(makeMove())) {
      expect(artifact.label.length).toBeGreaterThan(0);
      expect(artifact.phase.length).toBeGreaterThan(0);
      expect(artifact.blurb.length).toBeGreaterThan(0);
    }
  });

  it('matches case- and whitespace-insensitively on the Move name', () => {
    expect(boardArtifactsForMove(makeMove({ name: 'contact center ai routing' }))).toHaveLength(5);
    expect(boardArtifactsForMove(makeMove({ name: '  Contact Center AI Routing  ' }))).toHaveLength(5);
    expect(boardArtifactsForMove(makeMove({ name: 'Contact   Center  AI   Routing' }))).toHaveLength(5);
  });

  it('matches the tenant by display-name fold (Apex Retail / Apex Retail Group)', () => {
    expect(
      boardArtifactsForMove(makeMove({ tenant: { id: 't', name: 'Apex Retail', industryCode: 'retail' } })),
    ).toHaveLength(5);
  });
});

describe('boardArtifactsForMove — unrelated Moves resolve to []', () => {
  it('an unrelated Move on the same tenant resolves to []', () => {
    expect(boardArtifactsForMove(makeMove({ name: 'Customer Data Platform' }))).toEqual([]);
  });

  it('a same-named Move on a different tenant resolves to []', () => {
    expect(
      boardArtifactsForMove(
        makeMove({ tenant: { id: 't-mer', name: 'Meridian Health System', industryCode: 'healthcare' } }),
      ),
    ).toEqual([]);
  });

  it('an unknown tenant resolves to []', () => {
    expect(
      boardArtifactsForMove(
        makeMove({ tenant: { id: 't-x', name: 'Some Other Company', industryCode: null } }),
      ),
    ).toEqual([]);
  });
});

describe('boardArtifactsForMove — return value is a fresh array', () => {
  it('does not leak the internal registry array (mutation-safe)', () => {
    const first = boardArtifactsForMove(makeMove());
    first.pop();
    expect(boardArtifactsForMove(makeMove())).toHaveLength(5);
  });
});

describe('canonicalTenantKey', () => {
  it('folds known Apex display names to the canonical short key', () => {
    expect(canonicalTenantKey('Apex Retail Group')).toBe('apexretail');
    expect(canonicalTenantKey('Apex Retail')).toBe('apexretail');
  });

  it('folds Meridian and First Capital display names', () => {
    expect(canonicalTenantKey('Meridian Health System')).toBe('meridian');
    expect(canonicalTenantKey('First Capital Financial')).toBe('arcturus');
  });

  it('slugs an unknown name so it never matches a registry entry', () => {
    expect(canonicalTenantKey('Some Other Company')).toBe('someothercompany');
  });
});
