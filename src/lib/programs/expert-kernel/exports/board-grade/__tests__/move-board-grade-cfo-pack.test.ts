// Generic Move CFO Pack — unit tests.
//
// Covers the end-to-end proof slice:
//   • a real Move (one per vertical — retail / healthcare / financial
//     services) binds a curated Function Pack, the kernel runs, and the
//     projected CFO Pack carries the kernel's REAL verdict;
//   • the financial-challenge structure is intact — the funding ask, the
//     downside, the do-not-fund holdbacks, the Tower measurement and the
//     evidence/gap audit are all present and kernel-derived;
//   • the binding's precise seed gaps are surfaced into the evidence/gap
//     section and the monetisation gaps — named, never blank, never fabricated;
//   • a Move with no resolvable function produces the honest UNBOUND result,
//     and the renderer renders the honest unbound deck — never a fake one;
//   • the Apex reference CFO Pack (`buildApexCfoPack`) is untouched.

import {
  buildMoveCfoPack,
  type MoveCfoPack,
} from '../move-cfo-pack-model';
import { renderMoveCfoPackHtml } from '../move-cfo-pack-renderer';
import { buildApexCfoPack } from '../cfo-pack-model';
import { renderApexCfoPackHtml } from '../cfo-pack-renderer';
import type { MoveBusinessCaseInput } from '../../../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../../../function-identity';

const GENERATED_ON = '2026-05-22';

// ─────────────────────────────────────────────────────────────────────────────
// Minimal real-Move fixtures — one per vertical, each with a
// `charter.functionPackKey` pointing at a curated pack with a business-case
// outline. Deliberately thin baseline data so the kernel must seed-gap.
// ─────────────────────────────────────────────────────────────────────────────

const RETAIL_MOVE: MoveBusinessCaseInput = {
  industry_code: 'RETAIL',
  name: 'Cut repeat transfers in the contact centre',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'customer_care' },
  baseline_metrics: [],
};

const HEALTHCARE_MOVE: MoveBusinessCaseInput = {
  industry_code: 'HEALTHCARE_IDN',
  name: 'Reduce clinical documentation burden',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'clinical_operations_documentation' },
  baseline_metrics: [],
};

const FINSERV_MOVE: MoveBusinessCaseInput = {
  industry_code: 'FINSERV',
  name: 'Strengthen fraud detection',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'fraud_financial_crime' },
  baseline_metrics: [],
};

const VERTICALS: Array<{ name: string; move: MoveBusinessCaseInput }> = [
  { name: 'retail', move: RETAIL_MOVE },
  { name: 'healthcare', move: HEALTHCARE_MOVE },
  { name: 'financial services', move: FINSERV_MOVE },
];

// A Move that resolves no curated Function Pack — its industry resolves but
// the charter carries no function key.
const UNBOUND_MOVE: MoveBusinessCaseInput = {
  industry_code: 'RETAIL',
  name: 'A Move with no classified function',
  charter: {},
  baseline_metrics: [],
};

describe('buildMoveCfoPack — a real Move in each vertical', () => {
  for (const { name, move } of VERTICALS) {
    describe(`vertical: ${name}`, () => {
      it('binds a curated pack and projects a bound CFO Pack', () => {
        const pack = buildMoveCfoPack(move, GENERATED_ON);
        expect(pack.bound).toBe(true);
      });

      it('carries the kernel’s REAL verdict, never a fabricated `go`', () => {
        const pack = buildMoveCfoPack(
          move,
          GENERATED_ON,
        ) as MoveCfoPack;
        expect(['fund', 'shape', 'kill']).toContain(pack.verdict);
        // The verdict headline restates the kernel verdict — never "go".
        const headline = pack.sections.theAnswer.verdictHeadline.toLowerCase();
        expect(headline).not.toMatch(/\bgo\b/);
        // The verdict word (FUND / SHAPE / KILL) is in the headline.
        expect(pack.sections.theAnswer.verdictHeadline).toContain(
          pack.verdict.toUpperCase(),
        );
      });

      it('projects the financial-challenge structure from the kernel', () => {
        const pack = buildMoveCfoPack(
          move,
          GENERATED_ON,
        ) as MoveCfoPack;
        // §1 funding ask is a real, non-empty statement.
        expect(pack.sections.theAnswer.fundingAsk.length).toBeGreaterThan(0);
        // §2 investment is a real range with a positive base point.
        expect(pack.sections.theCase.investmentPoint).toBeGreaterThan(0);
        expect(pack.sections.theCase.investmentLow).toBeLessThanOrEqual(
          pack.sections.theCase.investmentPoint,
        );
        // §4 downside is shown — the conservative scenario is carried.
        expect(
          typeof pack.sections.whatWouldMakeItWrong.conservativeNetReturn,
        ).toBe('number');
        // §5 the do-not-fund holdbacks are first-class — never empty.
        expect(
          pack.sections.whatNotToFundYet.holdbacks.length,
        ).toBeGreaterThan(0);
        for (const h of pack.sections.whatNotToFundYet.holdbacks) {
          expect(h.title.length).toBeGreaterThan(0);
          expect(h.detail.length).toBeGreaterThan(0);
          expect(h.releaseCondition.length).toBeGreaterThan(0);
        }
        // §6 Tower measurement carries real metrics.
        expect(
          pack.sections.towerMeasurement.metrics.length,
        ).toBeGreaterThan(0);
      });

      it('surfaces the binding’s precise seed gaps — named, never blank', () => {
        const pack = buildMoveCfoPack(
          move,
          GENERATED_ON,
        ) as MoveCfoPack;
        const gaps = pack.sections.evidenceAndGaps.seedGaps;
        // The fixture records no metrics, so every expected metric is a gap.
        expect(gaps.length).toBeGreaterThan(0);
        for (const gap of gaps) {
          expect(gap.metric.length).toBeGreaterThan(0);
          expect(gap.reason.length).toBeGreaterThan(0);
          expect(gap.expectedDataSource.length).toBeGreaterThan(0);
        }
        // The monetisation gaps in §4 are also named, never blank.
        for (const g of pack.sections.whatWouldMakeItWrong.monetisationGaps) {
          expect(g.length).toBeGreaterThan(0);
        }
      });

      it('renders a self-contained HTML deck with the verdict in it', () => {
        const html = renderMoveCfoPackHtml(move, GENERATED_ON);
        const pack = buildMoveCfoPack(
          move,
          GENERATED_ON,
        ) as MoveCfoPack;
        expect(html.startsWith('<!doctype html>')).toBe(true);
        expect(html).toContain(pack.verdict.toUpperCase());
        expect(html).toContain(pack.moveLabel);
        // The deck reads as a financial challenge.
        expect(html).toContain('What not to fund yet');
        // The deck is not the honest-unbound document.
        expect(html).not.toContain('Honest unbound state');
      });

      it('is deterministic — same Move → same deck', () => {
        const a = renderMoveCfoPackHtml(move, GENERATED_ON);
        const b = renderMoveCfoPackHtml(move, GENERATED_ON);
        expect(a).toBe(b);
      });
    });
  }
});

describe('buildMoveCfoPack — a Move with no resolvable function', () => {
  it('returns the honest UNBOUND result, never a fabricated deck', () => {
    const result = buildMoveCfoPack(UNBOUND_MOVE, GENERATED_ON);
    expect(result.bound).toBe(false);
    if (!result.bound) {
      expect(result.unboundReason.length).toBeGreaterThan(0);
      expect(result.moveLabel).toBe(UNBOUND_MOVE.name);
    }
  });

  it('the renderer renders the honest unbound deck — not a CFO pack', () => {
    const html = renderMoveCfoPackHtml(UNBOUND_MOVE, GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Honest unbound state');
    expect(html).toContain('No curated Domain Function Pack');
    // No verdict word, no fabricated economics — the unbound deck states the
    // gap and stops.
    expect(html).toContain('Kernel');
    expect(html).toContain('Not run');
  });
});

describe('buildMoveCfoPack — honesty discipline', () => {
  it('a thin Move (no recorded metrics) does not produce a fabricated FUND', () => {
    // None of the three fixtures records baseline metrics, so monetisation
    // rests on a proxy — the kernel must not return a clean `fund`.
    for (const { move } of VERTICALS) {
      const pack = buildMoveCfoPack(
        move,
        GENERATED_ON,
      ) as MoveCfoPack;
      expect(pack.verdict).not.toBe('fund');
    }
  });

  it('a thin Move blocks payback and withholds the build holdback', () => {
    for (const { move } of VERTICALS) {
      const pack = buildMoveCfoPack(
        move,
        GENERATED_ON,
      ) as MoveCfoPack;
      // Monetisation is blocked for a thin Move.
      expect(pack.monetisationBlocked).toBe(true);
      // A monetisation-blocked Move withholds any dollar value claim.
      const titles = pack.sections.whatNotToFundYet.holdbacks.map(
        (h) => h.title,
      );
      expect(titles).toContain('Any value claim in dollars');
    }
  });

  it('a recorded metric is reflected in the evidence section', () => {
    const moveWithData: MoveBusinessCaseInput = {
      ...RETAIL_MOVE,
      baseline_metrics: [
        {
          metric_name: 'First-contact resolution (FCR)',
          value: 72,
          unit: 'percent',
        },
      ],
    };
    const pack = buildMoveCfoPack(
      moveWithData,
      GENERATED_ON,
    ) as MoveCfoPack;
    expect(pack.bound).toBe(true);
    // A recorded metric lifts the recorded count above zero.
    expect(pack.sections.evidenceAndGaps.recordedCount).toBeGreaterThan(0);
  });
});

describe('buildApexCfoPack — the reference CFO Pack is untouched', () => {
  it('still builds the Apex reference CFO Pack with its honest verdict', () => {
    const pack = buildApexCfoPack(GENERATED_ON);
    expect(pack.tenantLabel).toBe('Apex Retail');
    expect(pack.verdict).toBe('shape');
    expect(pack.sections.whatNotToFundYet.holdbacks.length).toBeGreaterThan(0);
  });

  it('still renders the Apex reference CFO Pack HTML deck', () => {
    const html = renderApexCfoPackHtml(GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('CFO Pack');
  });
});
