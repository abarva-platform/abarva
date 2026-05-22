// board-artifacts-registry — unit tests.
//
// Covers two resolution paths:
//   1. The Apex "Contact Center AI Routing" REFERENCE Move → its 8
//      hand-authored board-grade decks (the Costed pack carrying a pptxHref).
//   2. The KEY-DRIVEN path — any other Move with a resolvable
//      `(industryKey, functionKey)` Function-Pack identity → the generic,
//      four kernel-derived board-grade decks (Discover Brief, Costed
//      Business-Case Pack, Solution Architecture Pack, Mobilize & Go-Decision
//      Packet), each carrying a `?moveId=` link.
//   A Move with no resolvable function resolves to `[]` — an honest gap.

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
    charter: null,
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

describe('boardArtifactsForMove — Apex Contact Center AI Routing (reference)', () => {
  it('resolves to the 8 board-grade reference decks', () => {
    const artifacts = boardArtifactsForMove(makeMove());
    expect(artifacts).toHaveLength(8);
    expect(artifacts.map((a) => a.id).sort()).toEqual([
      'cfo-pack',
      'charter-skeleton',
      'costed-business-case',
      'discover-brief',
      'estimate-model',
      'master-dossier',
      'mobilize-packet',
      'solution-architecture',
    ]);
  });

  it('the Costed Business-Case Pack carries a pptxHref; the others do not', () => {
    const artifacts = boardArtifactsForMove(makeMove());
    const costed = artifacts.find((a) => a.id === 'costed-business-case');
    const discover = artifacts.find((a) => a.id === 'discover-brief');

    expect(costed?.label).toBe('Costed Business-Case Pack');
    expect(costed?.htmlHref).toBe('/api/v1/moves/board-grade-business-case');
    expect(costed?.pptxHref).toBe('/api/v1/moves/board-grade-business-case?format=pptx');

    expect(discover?.htmlHref).toBe('/api/v1/moves/board-grade-discover-brief');
    expect(discover?.pptxHref).toBeUndefined();
  });

  it('matches case- and whitespace-insensitively on the Move name', () => {
    expect(boardArtifactsForMove(makeMove({ name: 'contact center ai routing' }))).toHaveLength(8);
    expect(boardArtifactsForMove(makeMove({ name: '  Contact Center AI Routing  ' }))).toHaveLength(8);
  });

  it('matches the tenant by display-name fold (Apex Retail / Apex Retail Group)', () => {
    expect(
      boardArtifactsForMove(makeMove({ tenant: { id: 't', name: 'Apex Retail', industryCode: 'retail' } })),
    ).toHaveLength(8);
  });
});

describe('boardArtifactsForMove — key-driven path (real Moves, 3 verticals)', () => {
  it('a retail Move with a resolvable function gets the generic decks', () => {
    const move = makeMove({
      id: 'retail-move-1',
      name: 'Cut repeat transfers in the contact centre',
      tenant: { id: 't-r', name: 'Northwind Retail', industryCode: 'retail' },
      charter: { functionPackKey: 'customer_care' },
    });
    const artifacts = boardArtifactsForMove(move);
    // The key-driven path resolves the four generic kernel-derived decks.
    expect(artifacts.map((a) => a.id).sort()).toEqual([
      'cfo-pack',
      'costed-business-case',
      'discover-brief',
      'mobilize-packet',
      'solution-architecture',
    ]);
    const costed = artifacts.find((a) => a.id === 'costed-business-case');
    expect(costed?.htmlHref).toBe(
      '/api/v1/moves/board-grade-business-case?moveId=retail-move-1',
    );
    expect(costed?.pptxHref).toBeUndefined();
    const discover = artifacts.find((a) => a.id === 'discover-brief');
    expect(discover?.htmlHref).toBe(
      '/api/v1/moves/board-grade-discover-brief?moveId=retail-move-1',
    );
    expect(discover?.phase).toBe('Discover');
    const arch = artifacts.find((a) => a.id === 'solution-architecture');
    expect(arch?.htmlHref).toBe(
      '/api/v1/moves/board-grade-solution-architecture?moveId=retail-move-1',
    );
    const mobilize = artifacts.find((a) => a.id === 'mobilize-packet');
    expect(mobilize?.htmlHref).toBe(
      '/api/v1/moves/board-grade-mobilize-packet?moveId=retail-move-1',
    );
    const cfo = artifacts.find((a) => a.id === 'cfo-pack');
    expect(cfo?.htmlHref).toBe(
      '/api/v1/moves/board-grade-cfo-pack?moveId=retail-move-1',
    );
    expect(cfo?.phase).toBe('Design & Plan');
  });

  it('a healthcare Move with a resolvable function gets the generic decks', () => {
    const move = makeMove({
      id: 'health-move-1',
      name: 'Reduce clinical documentation burden',
      tenant: { id: 't-h', name: 'Cedar Valley Health', industryCode: 'healthcare_idn' },
      charter: { functionPackKey: 'clinical_operations_documentation' },
    });
    const artifacts = boardArtifactsForMove(move);
    expect(artifacts.map((a) => a.id).sort()).toEqual([
      'cfo-pack',
      'costed-business-case',
      'discover-brief',
      'mobilize-packet',
      'solution-architecture',
    ]);
    expect(
      artifacts.find((a) => a.id === 'discover-brief')?.htmlHref,
    ).toBe('/api/v1/moves/board-grade-discover-brief?moveId=health-move-1');
    expect(
      artifacts.find((a) => a.id === 'mobilize-packet')?.htmlHref,
    ).toBe(
      '/api/v1/moves/board-grade-mobilize-packet?moveId=health-move-1',
    );
    expect(
      artifacts.find((a) => a.id === 'solution-architecture')?.htmlHref,
    ).toBe(
      '/api/v1/moves/board-grade-solution-architecture?moveId=health-move-1',
    );
  });

  it('a financial-services Move with a resolvable function gets the generic decks', () => {
    const move = makeMove({
      id: 'fs-move-1',
      name: 'Strengthen fraud detection',
      tenant: { id: 't-f', name: 'Summit Bank', industryCode: 'finserv' },
      charter: { functionPackKey: 'fraud_financial_crime' },
    });
    const artifacts = boardArtifactsForMove(move);
    expect(artifacts.map((a) => a.id).sort()).toEqual([
      'cfo-pack',
      'costed-business-case',
      'discover-brief',
      'mobilize-packet',
      'solution-architecture',
    ]);
    expect(
      artifacts.find((a) => a.id === 'discover-brief')?.htmlHref,
    ).toBe('/api/v1/moves/board-grade-discover-brief?moveId=fs-move-1');
    expect(
      artifacts.find((a) => a.id === 'mobilize-packet')?.htmlHref,
    ).toBe(
      '/api/v1/moves/board-grade-mobilize-packet?moveId=fs-move-1',
    );
    expect(
      artifacts.find((a) => a.id === 'solution-architecture')?.htmlHref,
    ).toBe(
      '/api/v1/moves/board-grade-solution-architecture?moveId=fs-move-1',
    );
  });

  it('the hardcoded Apex Move-name is no longer the gate — any name resolves', () => {
    // A Move named nothing like "Contact Center AI Routing" still resolves the
    // board-grade artifacts, purely from its (industryKey, functionKey).
    const move = makeMove({
      id: 'oddly-named-move',
      name: 'Q3 ops improvement workstream',
      tenant: { id: 't-r', name: 'Northwind Retail', industryCode: 'retail' },
      charter: { functionPackKey: 'customer_care' },
    });
    const artifacts = boardArtifactsForMove(move);
    expect(artifacts).toHaveLength(5);
    for (const artifact of artifacts) {
      expect(artifact.htmlHref).toContain('moveId=oddly-named-move');
    }
  });

  it('encodes the moveId in the href of every generic deck', () => {
    const move = makeMove({
      id: 'move with spaces/&',
      tenant: { id: 't-r', name: 'Northwind Retail', industryCode: 'retail' },
      charter: { functionPackKey: 'customer_care' },
    });
    const artifacts = boardArtifactsForMove(move);
    const encoded = encodeURIComponent('move with spaces/&');
    expect(
      artifacts.find((a) => a.id === 'costed-business-case')?.htmlHref,
    ).toBe(`/api/v1/moves/board-grade-business-case?moveId=${encoded}`);
    expect(
      artifacts.find((a) => a.id === 'discover-brief')?.htmlHref,
    ).toBe(`/api/v1/moves/board-grade-discover-brief?moveId=${encoded}`);
    expect(
      artifacts.find((a) => a.id === 'solution-architecture')?.htmlHref,
    ).toBe(
      `/api/v1/moves/board-grade-solution-architecture?moveId=${encoded}`,
    );
    expect(
      artifacts.find((a) => a.id === 'mobilize-packet')?.htmlHref,
    ).toBe(`/api/v1/moves/board-grade-mobilize-packet?moveId=${encoded}`);
    expect(
      artifacts.find((a) => a.id === 'cfo-pack')?.htmlHref,
    ).toBe(`/api/v1/moves/board-grade-cfo-pack?moveId=${encoded}`);
  });
});

describe('boardArtifactsForMove — no resolvable function resolves to []', () => {
  it('a Move whose charter carries no function key resolves to []', () => {
    expect(
      boardArtifactsForMove(
        makeMove({
          name: 'Customer Data Platform',
          tenant: { id: 't-r', name: 'Northwind Retail', industryCode: 'retail' },
          charter: null,
        }),
      ),
    ).toEqual([]);
  });

  it('a Move with a function key but an unresolvable industry resolves to []', () => {
    expect(
      boardArtifactsForMove(
        makeMove({
          name: 'Some Move',
          tenant: { id: 't-x', name: 'Some Other Company', industryCode: null },
          charter: { functionPackKey: 'customer_care' },
        }),
      ),
    ).toEqual([]);
  });

  it('a Move with a non-string function key resolves to []', () => {
    expect(
      boardArtifactsForMove(
        makeMove({
          tenant: { id: 't-r', name: 'Northwind Retail', industryCode: 'retail' },
          charter: { functionPackKey: 12345 },
          name: 'Bad charter Move',
        }),
      ),
    ).toEqual([]);
  });
});

describe('boardArtifactsForMove — return value is a fresh array', () => {
  it('does not leak the internal reference array (mutation-safe)', () => {
    const first = boardArtifactsForMove(makeMove());
    first.pop();
    expect(boardArtifactsForMove(makeMove())).toHaveLength(8);
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

  it('slugs an unknown name so it never matches a reference entry', () => {
    expect(canonicalTenantKey('Some Other Company')).toBe('someothercompany');
  });
});
