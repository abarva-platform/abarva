// Generic Move Costed Business-Case Pack — unit tests.
//
// Covers the end-to-end proof slice:
//   • a real Move (one per vertical — retail / healthcare / financial
//     services) binds a curated Function Pack, the kernel runs, and the
//     projected pack carries the kernel's REAL verdict and value;
//   • the deck's section structure is the curated Function-Pack outline (the
//     binding's `deliverableOutline`) — structure is inherited, not improvised;
//   • the binding's precise seed gaps are surfaced into the evidence-gaps
//     section — named, never blank, never fabricated;
//   • a Move with no resolvable function produces the honest UNBOUND result,
//     and the renderer renders the honest unbound deck — never a fake one.

import {
  buildMoveCostedBusinessCasePack,
  type MoveCostedBusinessCasePack,
} from '../move-pack-model';
import { renderMoveCostedBusinessCaseHtml } from '../move-html-renderer';
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

describe('buildMoveCostedBusinessCasePack — a real Move in each vertical', () => {
  for (const { name, move } of VERTICALS) {
    describe(`vertical: ${name}`, () => {
      it('binds a curated pack and projects a bound pack', () => {
        const pack = buildMoveCostedBusinessCasePack(move, GENERATED_ON);
        expect(pack.bound).toBe(true);
      });

      it('carries the kernel’s REAL verdict, never a fabricated `go`', () => {
        const pack = buildMoveCostedBusinessCasePack(
          move,
          GENERATED_ON,
        ) as MoveCostedBusinessCasePack;
        expect(['fund', 'shape', 'kill']).toContain(pack.verdict);
        // The board-answer headline restates the kernel verdict word — it is
        // never the word "go".
        expect(pack.sections.boardAnswer.verdictHeadline.toLowerCase()).not.toMatch(
          /\bgo\b/,
        );
        expect(pack.sections.boardAnswer.verdictHeadline).toContain(
          pack.verdict.toUpperCase(),
        );
      });

      it('the value/effort content traces to the kernel skeleton', () => {
        const pack = buildMoveCostedBusinessCasePack(
          move,
          GENERATED_ON,
        ) as MoveCostedBusinessCasePack;
        // Investment is a real range with a positive base point.
        const inv = pack.sections.investmentCase.investmentRange;
        expect(inv.point).toBeGreaterThan(0);
        expect(inv.low).toBeLessThanOrEqual(inv.point);
        expect(inv.high).toBeGreaterThanOrEqual(inv.point);
        // The board-answer economics tile for the verdict matches the verdict.
        const verdictTile = pack.sections.boardAnswer.economics.find(
          (e) => e.label === 'Verdict',
        );
        expect(verdictTile?.value).toBe(pack.verdict.toUpperCase());
      });

      it('inherits the curated Function-Pack outline as the section spine', () => {
        const pack = buildMoveCostedBusinessCasePack(
          move,
          GENERATED_ON,
        ) as MoveCostedBusinessCasePack;
        const outline = pack.sections.inheritedOutline.outline;
        // The curated outline is non-empty and every section carries real
        // guidance — a label list would be a hard fail.
        expect(outline.length).toBeGreaterThan(0);
        for (const section of outline) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.guidance.length).toBeGreaterThan(0);
        }
      });

      it('surfaces the binding’s precise seed gaps — named, never blank', () => {
        const pack = buildMoveCostedBusinessCasePack(
          move,
          GENERATED_ON,
        ) as MoveCostedBusinessCasePack;
        const gaps = pack.sections.evidenceGaps.seedGaps;
        // The fixture records no metrics, so every expected metric is a gap.
        expect(gaps.length).toBeGreaterThan(0);
        for (const gap of gaps) {
          expect(gap.metric.length).toBeGreaterThan(0);
          expect(gap.reason.length).toBeGreaterThan(0);
          expect(gap.expectedDataSource.length).toBeGreaterThan(0);
        }
      });

      it('renders a self-contained HTML deck with the verdict in it', () => {
        const html = renderMoveCostedBusinessCaseHtml(move, GENERATED_ON);
        const pack = buildMoveCostedBusinessCasePack(
          move,
          GENERATED_ON,
        ) as MoveCostedBusinessCasePack;
        expect(html.startsWith('<!doctype html>')).toBe(true);
        expect(html).toContain(pack.verdict.toUpperCase());
        expect(html).toContain(pack.moveLabel);
        // The deck is not the honest-unbound document.
        expect(html).not.toContain('Honest unbound state');
      });

      it('is deterministic — same Move → same deck', () => {
        const a = renderMoveCostedBusinessCaseHtml(move, GENERATED_ON);
        const b = renderMoveCostedBusinessCaseHtml(move, GENERATED_ON);
        expect(a).toBe(b);
      });
    });
  }
});

describe('buildMoveCostedBusinessCasePack — a Move with no resolvable function', () => {
  it('returns the honest UNBOUND result, never a fabricated deck', () => {
    const result = buildMoveCostedBusinessCasePack(UNBOUND_MOVE, GENERATED_ON);
    expect(result.bound).toBe(false);
    if (!result.bound) {
      expect(result.unboundReason.length).toBeGreaterThan(0);
      expect(result.moveLabel).toBe(UNBOUND_MOVE.name);
    }
  });

  it('the renderer renders the honest unbound deck — not a business case', () => {
    const html = renderMoveCostedBusinessCaseHtml(UNBOUND_MOVE, GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Honest unbound state');
    expect(html).toContain('No curated Domain Function Pack');
    // No verdict word, no fabricated economics — the unbound deck states the
    // gap and stops.
    expect(html).toContain('Kernel');
    expect(html).toContain('Not run');
  });
});

describe('buildMoveCostedBusinessCasePack — honesty discipline', () => {
  it('a thin Move (no recorded metrics) does not produce a fabricated FUND', () => {
    // None of the three fixtures records baseline metrics, so monetisation
    // rests on a proxy — the kernel must not return a clean `fund`.
    for (const { move } of VERTICALS) {
      const pack = buildMoveCostedBusinessCasePack(
        move,
        GENERATED_ON,
      ) as MoveCostedBusinessCasePack;
      // With zero recorded metrics the kernel blocks monetisation; the
      // honest verdict is `shape` or `kill`, never `fund`.
      expect(pack.verdict).not.toBe('fund');
    }
  });

  it('a recorded metric is reflected in the evidence section', () => {
    const moveWithData: MoveBusinessCaseInput = {
      ...RETAIL_MOVE,
      baseline_metrics: [
        {
          // A metric name the `customer_care` Function Pack expects — it
          // reconciles to the pack's `first_contact_resolution` operating
          // metric, so it is a recorded baseline value, not a seed gap.
          metric_name: 'First-contact resolution (FCR)',
          value: 72,
          unit: 'percent',
        },
      ],
    };
    const pack = buildMoveCostedBusinessCasePack(
      moveWithData,
      GENERATED_ON,
    ) as MoveCostedBusinessCasePack;
    expect(pack.bound).toBe(true);
    // A recorded metric lifts the recorded count above zero.
    expect(pack.sections.evidenceGaps.recordedCount).toBeGreaterThan(0);
  });
});
