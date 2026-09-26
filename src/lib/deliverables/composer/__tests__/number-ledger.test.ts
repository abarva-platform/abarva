import {
  extractNumericClaims,
  validateDeckLineage,
  type LedgerEntry,
} from '../number-ledger';
import type { InspectedDeck } from '../../orchestrator/deck-inspection';

function deckOf(...slides: string[][]): InspectedDeck {
  return {
    canvasWidthIn: 13.333,
    canvasHeightIn: 7.5,
    slideCount: slides.length,
    slides: slides.map((textRuns, i) => ({
      index: i + 1,
      textRuns,
      visibleChars: textRuns.join('').length,
      tableCount: 0,
      pictureCount: 0,
      chartCount: 0,
      offCanvas: [],
    })),
  };
}

const LEDGER: LedgerEntry[] = [
  {
    figureId: 'F001',
    value: 81_400_000_000,
    unit: 'usd',
    label: 'annual revenue',
    formattedVariants: ['81400000000', '$81.4B'],
    sourceRef: 'tenant/profile',
  },
  {
    figureId: 'F002',
    value: 503,
    unit: 'count',
    label: 'applications',
    formattedVariants: ['503'],
    sourceRef: 'tenant/apps',
  },
  {
    figureId: 'F003',
    value: 32.6,
    unit: 'percent',
    label: 'top-5 concentration',
    formattedVariants: ['32.6%'],
    sourceRef: 'tenant/vendors',
  },
];

describe('lineage gate over a rendered deck', () => {
  it('passes a deck whose every figure is in the ledger', () => {
    const verdict = validateDeckLineage(
      deckOf(['$81.4B revenue across 503 systems', 'Top five carry 32.6%']),
      { ledger: LEDGER },
    );
    expect(verdict.findings).toEqual([]);
    expect(verdict.ok).toBe(true);
    expect(verdict.matchedToLedger).toBe(3);
  });

  it('blocks a figure that is in no governed statement', () => {
    const verdict = validateDeckLineage(
      deckOf(['Modernization unlocks $240M of run-rate savings']),
      { ledger: LEDGER },
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.findings[0]).toMatchObject({ kind: 'unsupported_figure', claim: '$240M' });
  });

  it('accepts a unit-consistent reformatting of a ledger figure', () => {
    // $81.4B and $81,400M are the same governed number written two ways. A gate
    // that only string-matched would fail the second and be switched off.
    const verdict = validateDeckLineage(deckOf(['$81,400M in revenue']), { ledger: LEDGER });
    expect(verdict.ok).toBe(true);
  });

  it('does not let tolerance swallow a materially different figure', () => {
    // $84.0B is one decimal place away from $81.4B in rendering but $2.6B away
    // in fact. Rounding tolerance must not cover it.
    const verdict = validateDeckLineage(deckOf(['$84.0B in revenue']), { ledger: LEDGER });
    expect(verdict.ok).toBe(false);
  });

  it('exempts only the structural numbers named in the allowlist', () => {
    const deck = deckOf(
      ['1'], // slide number on slide 1
      ['Step 2', 'Q3', '2 / 5'],
    );
    const verdict = validateDeckLineage(deck, { ledger: LEDGER });
    expect(verdict.findings).toEqual([]);
    expect(verdict.exemptStructural).toBeGreaterThanOrEqual(4);
  });

  it('does not exempt a small integer that is not this slide number', () => {
    // The slide-number rule must check the slide, not just "small integer alone
    // in a run" — otherwise "47" as a standalone headline metric walks through.
    const onSlideThree = deckOf(['a'], ['b'], ['9']);
    expect(validateDeckLineage(onSlideThree, { ledger: LEDGER }).ok).toBe(false);
  });

  it('does not exempt a year the governed artifact never mentions', () => {
    const withYear = { ledger: LEDGER, calendarYears: new Set([2026, 2027]) };
    expect(validateDeckLineage(deckOf(['Complete by 2027']), withYear).ok).toBe(true);
    expect(validateDeckLineage(deckOf(['Complete by 2031']), withYear).ok).toBe(false);
  });

  it('recomputes a declared derivation and rejects a wrong one', () => {
    const good = validateDeckLineage(deckOf(['$81.4B and 503 systems']), {
      ledger: LEDGER,
      derived: [
        {
          value: 81_400_000_503,
          unit: 'usd',
          fromFigureIds: ['F001', 'F002'],
          operation: 'sum',
          label: 'nonsense but arithmetically true',
        },
      ],
    });
    expect(good.findings.filter((f) => f.kind === 'bad_derivation')).toEqual([]);

    const bad = validateDeckLineage(deckOf(['Total $90B']), {
      ledger: LEDGER,
      derived: [
        {
          value: 90_000_000_000,
          unit: 'usd',
          fromFigureIds: ['F001', 'F002'],
          operation: 'sum',
          label: 'inflated total',
        },
      ],
    });
    expect(bad.ok).toBe(false);
    expect(bad.findings.some((f) => f.kind === 'bad_derivation')).toBe(true);
  });

  it('rejects a derivation naming a figureId that is not in the ledger', () => {
    const verdict = validateDeckLineage(deckOf(['x']), {
      ledger: LEDGER,
      derived: [
        {
          value: 10,
          unit: 'usd',
          fromFigureIds: ['F999'],
          operation: 'sum',
          label: 'phantom input',
        },
      ],
    });
    expect(verdict.findings[0]).toMatchObject({ kind: 'bad_derivation' });
  });

  it('reads an ISO date as one claim, not as three loose numbers', () => {
    // "2028-06-30" used to surface a bare "30" as an unsupported figure on every
    // slide that named a contract renewal. Eight findings, none of them real.
    const dates = new Set(['2028-06-30']);
    const clean = validateDeckLineage(deckOf(['Renewal window opens 2028-06-30']), {
      ledger: LEDGER,
      calendarDates: dates,
    });
    expect(clean.findings).toEqual([]);

    const invented = validateDeckLineage(deckOf(['Renewal window opens 2029-01-15']), {
      ledger: LEDGER,
      calendarDates: dates,
    });
    expect(invented.ok).toBe(false);
    expect(invented.findings[0].message).toContain('2029-01-15');
  });

  it('does not let a masked date hide a real figure beside it', () => {
    // Masking the date must not swallow the rest of the run.
    const verdict = validateDeckLineage(
      deckOf(['By 2028-06-30 the programme releases $240M']),
      { ledger: LEDGER, calendarDates: new Set(['2028-06-30']) },
    );
    expect(verdict.findings).toHaveLength(1);
    expect(verdict.findings[0]).toMatchObject({ claim: '$240M' });
  });

  it('counts a figure once when it is written with a currency symbol', () => {
    // "$503" must not also register as the bare count 503 — a double count would
    // inflate matchedToLedger and hide a real miss behind a coincidence.
    const { claims } = extractNumericClaims(deckOf(['$503']));
    expect(claims).toHaveLength(1);
    expect(claims[0].unit).toBe('usd');
  });
});
