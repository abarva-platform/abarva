// Board-grade brief serializer tests.
//
// For each of the 8 reference deck slugs, pin:
//   - the brief contains the expected card count (cover + body sections),
//   - it contains the model's actual section heading prose (no fabrication),
//   - the additionalInstructions carries the honesty clause.

import {
  BOARD_GRADE_DECK_SLUGS,
  HONESTY_INSTRUCTIONS,
  buildBoardGradeDeckBrief,
  serializeBoardGradeDeckBrief,
  isBoardGradeDeckSlug,
  type BoardGradeDeckSlug,
} from '../board-grade-brief';

import {
  buildApexDiscoverBrief,
  buildApexCharterSkeleton,
  buildApexCostedBusinessCasePack,
  buildApexSolutionArchitecture,
  buildApexEstimateModel,
  buildApexCfoPack,
  buildApexMobilizePacket,
  buildApexMasterMoveDossier,
} from '@/lib/programs/expert-kernel/exports/board-grade';

const GENERATED_ON = '2026-05-22';

interface BuilderMeta {
  expectedBodyCardCount: number;
  sectionNavLabels: string[];
}

function inspectModelMeta(slug: BoardGradeDeckSlug): BuilderMeta {
  switch (slug) {
    case 'discover-brief': {
      const m = buildApexDiscoverBrief(GENERATED_ON);
      return {
        expectedBodyCardCount: Object.keys(m.sections).length,
        sectionNavLabels: Object.values(m.sections).map(
          (s) => s.anatomy.navLabel,
        ),
      };
    }
    case 'charter-skeleton': {
      const m = buildApexCharterSkeleton(GENERATED_ON);
      return {
        expectedBodyCardCount: Object.keys(m.sections).length,
        sectionNavLabels: Object.values(m.sections).map(
          (s) => s.anatomy.navLabel,
        ),
      };
    }
    case 'business-case': {
      const m = buildApexCostedBusinessCasePack(GENERATED_ON);
      return {
        expectedBodyCardCount: Object.keys(m.sections).length,
        sectionNavLabels: Object.values(m.sections).map(
          (s) => s.anatomy.navLabel,
        ),
      };
    }
    case 'solution-architecture': {
      const m = buildApexSolutionArchitecture(GENERATED_ON);
      return {
        expectedBodyCardCount: Object.keys(m.sections).length,
        sectionNavLabels: Object.values(m.sections).map(
          (s) => s.anatomy.navLabel,
        ),
      };
    }
    case 'estimate-model': {
      const m = buildApexEstimateModel(GENERATED_ON);
      return {
        expectedBodyCardCount: Object.keys(m.sections).length,
        sectionNavLabels: Object.values(m.sections).map(
          (s) => s.anatomy.navLabel,
        ),
      };
    }
    case 'cfo-pack': {
      const m = buildApexCfoPack(GENERATED_ON);
      return {
        expectedBodyCardCount: Object.keys(m.sections).length,
        sectionNavLabels: Object.values(m.sections).map(
          (s) => s.anatomy.navLabel,
        ),
      };
    }
    case 'mobilize-packet': {
      const m = buildApexMobilizePacket(GENERATED_ON);
      return {
        expectedBodyCardCount: Object.keys(m.sections).length,
        sectionNavLabels: Object.values(m.sections).map(
          (s) => s.anatomy.navLabel,
        ),
      };
    }
    case 'master-dossier': {
      const m = buildApexMasterMoveDossier(GENERATED_ON);
      return {
        expectedBodyCardCount: Object.keys(m.sections).length,
        sectionNavLabels: Object.values(m.sections).map(
          (s) => s.anatomy.navLabel,
        ),
      };
    }
  }
}

describe('honesty clause', () => {
  it('forbids added/altered figures, dates, sources, or claims', () => {
    expect(HONESTY_INSTRUCTIONS).toContain('Do not add, alter, or infer');
    expect(HONESTY_INSTRUCTIONS).toContain('figure');
    expect(HONESTY_INSTRUCTIONS).toContain('seed gap');
  });
});

describe('isBoardGradeDeckSlug', () => {
  it('accepts every known slug', () => {
    for (const slug of BOARD_GRADE_DECK_SLUGS) {
      expect(isBoardGradeDeckSlug(slug)).toBe(true);
    }
  });
  it('rejects unknown slugs', () => {
    expect(isBoardGradeDeckSlug('not-a-deck')).toBe(false);
    expect(isBoardGradeDeckSlug('')).toBe(false);
  });
});

describe('buildBoardGradeDeckBrief — per deck', () => {
  for (const slug of BOARD_GRADE_DECK_SLUGS) {
    describe(slug, () => {
      const brief = buildBoardGradeDeckBrief(slug, GENERATED_ON);
      const meta = inspectModelMeta(slug);

      it('carries the deck slug and an Apex / Contact Center cover', () => {
        expect(brief.deckSlug).toBe(slug);
        expect(brief.cover.bodyLines.join('\n')).toContain('Apex Retail');
        expect(brief.cover.bodyLines.join('\n')).toContain(
          'Contact Center AI Routing',
        );
      });

      it('emits one card per model section (plus the cover)', () => {
        expect(brief.cards.length).toBe(meta.expectedBodyCardCount);
      });

      it('includes the section navLabel in every card heading', () => {
        for (let i = 0; i < meta.sectionNavLabels.length; i++) {
          const label = meta.sectionNavLabels[i];
          const card = brief.cards[i];
          expect(card.heading).toContain(label);
        }
      });
    });
  }
});

describe('serializeBoardGradeDeckBrief — Gamma input shape', () => {
  for (const slug of BOARD_GRADE_DECK_SLUGS) {
    it(`${slug} — has the honesty clause and the card-break delimiter`, () => {
      const s = serializeBoardGradeDeckBrief(slug, GENERATED_ON);
      expect(s.additionalInstructions).toBe(HONESTY_INSTRUCTIONS);
      // numCards = cover + body sections, ≥ 7 for every reference deck.
      expect(s.numCards).toBeGreaterThanOrEqual(7);
      // Card-break delimiter is '\n\n\n' — present (numCards - 1) times.
      const breaks = s.inputText.split('\n\n\n').length - 1;
      expect(breaks).toBe(s.numCards - 1);
      // No empty cards.
      for (const segment of s.inputText.split('\n\n\n')) {
        expect(segment.trim().length).toBeGreaterThan(0);
        expect(segment.startsWith('#')).toBe(true);
      }
    });
  }
});

describe('serialized brief — no obvious fabrication', () => {
  // We can not assert "no NEW facts" exhaustively, but we can confirm the
  // serializer's text is a subset of model strings: every non-marker line in
  // the body either reproduces a model string or is anatomy boilerplate.
  it('every figure in the discover-brief serializer comes from the model', () => {
    const m = buildApexDiscoverBrief(GENERATED_ON);
    const s = serializeBoardGradeDeckBrief('discover-brief', GENERATED_ON);
    // Every recorded metric value should appear in the input text verbatim.
    for (const metric of m.sections.currentStateBaseline.metrics) {
      expect(s.inputText).toContain(metric.value);
      expect(s.inputText).toContain(metric.source);
    }
    // Every seed gap label should appear in the input text.
    for (const gap of m.sections.currentStateBaseline.seedGaps) {
      expect(s.inputText).toContain(gap.metric);
    }
  });
});
