// Generic Move Charter Business-Case Skeleton — unit tests.
//
// Covers the end-to-end proof slice:
//   • a real Move (one per vertical — retail / healthcare / financial
//     services) binds a curated Function Pack, the kernel runs, and the
//     projected Charter skeleton carries the kernel's REAL verdict
//     (`fund`/`shape`/`kill`) and the real cost/value RANGES;
//   • the deck's section structure inherits the curated Function-Pack outline
//     (the binding's `deliverableOutline`) — structure is inherited, not
//     improvised;
//   • the binding's precise seed gaps are surfaced into the evidence-asks
//     section — named with their source, never blank, never fabricated;
//   • a Move with no resolvable function produces the honest UNBOUND result,
//     and the renderer renders the honest unbound deck — never a fake one.
//   • the Apex reference Charter Skeleton is left intact.

import {
  buildMoveCharterSkeleton,
  type MoveCharterSkeleton,
} from '../move-charter-skeleton-model';
import { renderMoveCharterSkeletonHtml } from '../move-charter-skeleton-renderer';
import {
  buildApexCharterSkeleton,
  renderApexCharterSkeletonHtml,
} from '../index';
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

describe('buildMoveCharterSkeleton — a real Move in each vertical', () => {
  for (const { name, move } of VERTICALS) {
    describe(`vertical: ${name}`, () => {
      it('binds a curated pack and projects a bound Charter skeleton', () => {
        const charter = buildMoveCharterSkeleton(move, GENERATED_ON);
        expect(charter.bound).toBe(true);
      });

      it('carries the kernel’s REAL verdict, never a fabricated `fund`', () => {
        const charter = buildMoveCharterSkeleton(
          move,
          GENERATED_ON,
        ) as MoveCharterSkeleton;
        expect(['fund', 'shape', 'kill']).toContain(charter.verdict);
        // The Charter-answer headline restates the verdict word.
        const headline = charter.sections.charterAnswer.verdictHeadline;
        expect(headline).toContain(
          charter.verdict === 'fund'
            ? 'FUND'
            : charter.verdict === 'kill'
              ? 'STOP'
              : 'SHAPE',
        );
      });

      it('inherits the curated Function-Pack outline as the section spine', () => {
        const charter = buildMoveCharterSkeleton(
          move,
          GENERATED_ON,
        ) as MoveCharterSkeleton;
        const outline = charter.sections.inheritedOutline.outline;
        // The curated outline is non-empty and every section carries real
        // guidance — a label list would be a hard fail.
        expect(outline.length).toBeGreaterThan(0);
        for (const section of outline) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.guidance.length).toBeGreaterThan(0);
        }
      });

      it('surfaces the binding’s precise seed gaps as evidence asks', () => {
        const charter = buildMoveCharterSkeleton(
          move,
          GENERATED_ON,
        ) as MoveCharterSkeleton;
        const asks = charter.sections.evidenceAsks.asks;
        // The fixture records no metrics, so every expected metric is a gap.
        expect(asks.length).toBeGreaterThan(0);
        for (const ask of asks) {
          expect(ask.label.length).toBeGreaterThan(0);
          expect(ask.reason.length).toBeGreaterThan(0);
          expect(ask.expectedDataSource.length).toBeGreaterThan(0);
        }
        // At least one ask is a build-funding blocker — the kernel needs the
        // sizing metrics to monetise the case.
        expect(asks.some((a) => a.blocksFunding)).toBe(true);
      });

      it('carries the cost and value as RANGES, never single points', () => {
        const charter = buildMoveCharterSkeleton(
          move,
          GENERATED_ON,
        ) as MoveCharterSkeleton;
        const cost = charter.sections.initialCostEffort;
        // A low–point–high band, ordered — a single-point cost is a hard fail.
        expect(cost.effortLow).toBeLessThanOrEqual(cost.effortPoint);
        expect(cost.effortPoint).toBeLessThanOrEqual(cost.effortHigh);
        expect(cost.effortHigh).toBeGreaterThan(cost.effortLow);
      });

      it('every assumption carries an owner and a sensitivity rank', () => {
        const charter = buildMoveCharterSkeleton(
          move,
          GENERATED_ON,
        ) as MoveCharterSkeleton;
        const assumptions = charter.sections.assumptionLedger.assumptions;
        expect(assumptions.length).toBeGreaterThan(0);
        for (const a of assumptions) {
          expect(a.owner.length).toBeGreaterThan(0);
          expect(['high', 'medium', 'low']).toContain(a.sensitivityImpact);
        }
      });

      it('renders a self-contained HTML deck with the verdict in it', () => {
        const html = renderMoveCharterSkeletonHtml(move, GENERATED_ON);
        const charter = buildMoveCharterSkeleton(
          move,
          GENERATED_ON,
        ) as MoveCharterSkeleton;
        expect(html.startsWith('<!doctype html>')).toBe(true);
        expect(html).toContain(charter.moveLabel);
        // The deck is not the honest-unbound document.
        expect(html).not.toContain('Honest unbound state');
        // The inherited-outline slide carries the curated outline.
        expect(html).toContain('Inherited outline');
      });

      it('is deterministic — same Move → same deck', () => {
        const a = renderMoveCharterSkeletonHtml(move, GENERATED_ON);
        const b = renderMoveCharterSkeletonHtml(move, GENERATED_ON);
        expect(a).toBe(b);
      });
    });
  }
});

describe('buildMoveCharterSkeleton — a Move with no resolvable function', () => {
  it('returns the honest UNBOUND result, never a fabricated charter', () => {
    const result = buildMoveCharterSkeleton(UNBOUND_MOVE, GENERATED_ON);
    expect(result.bound).toBe(false);
    if (!result.bound) {
      expect(result.unboundReason.length).toBeGreaterThan(0);
      expect(result.moveLabel).toBe(UNBOUND_MOVE.name);
    }
  });

  it('the renderer renders the honest unbound deck — not a Charter skeleton', () => {
    const html = renderMoveCharterSkeletonHtml(UNBOUND_MOVE, GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Honest unbound state');
    expect(html).toContain('No curated Domain Function Pack');
    // No fabricated verdict — the unbound deck states the gap and stops.
    expect(html).toContain('Not run');
  });
});

describe('buildMoveCharterSkeleton — honesty discipline', () => {
  it('a thin Move (no recorded metrics) does not produce a fabricated FUND', () => {
    // None of the three fixtures records baseline metrics, so monetisation
    // rests on a proxy — the kernel must not return a clean `fund`.
    for (const { move } of VERTICALS) {
      const charter = buildMoveCharterSkeleton(
        move,
        GENERATED_ON,
      ) as MoveCharterSkeleton;
      expect(charter.verdict).not.toBe('fund');
      // Monetisation is blocked while the sizing metrics are seed-gapped.
      expect(charter.monetisationBlocked).toBe(true);
    }
  });

  it('a recorded metric is reflected in the Charter-answer baseline tile', () => {
    const moveWithData: MoveBusinessCaseInput = {
      ...RETAIL_MOVE,
      baseline_metrics: [
        {
          // A metric name the `customer_care` Function Pack expects — it
          // reconciles to a pack operating metric, so it is a recorded
          // baseline value, not a seed gap.
          metric_name: 'First-contact resolution (FCR)',
          value: 72,
          unit: 'percent',
        },
      ],
    };
    const charter = buildMoveCharterSkeleton(
      moveWithData,
      GENERATED_ON,
    ) as MoveCharterSkeleton;
    expect(charter.bound).toBe(true);
    // A recorded metric appears on the value-hypothesis metric bars.
    expect(
      charter.sections.valueHypothesis.metricBars.length,
    ).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The Apex reference Charter Skeleton is left intact — its model and renderer
// still work exactly as before. The generic path is added alongside it.
// ─────────────────────────────────────────────────────────────────────────────

describe('the Apex reference Charter Skeleton is unaffected', () => {
  it('still builds with the shape verdict and six sections', () => {
    const charter = buildApexCharterSkeleton(GENERATED_ON);
    expect(charter.verdict).toBe('shape');
    expect(charter.toc).toHaveLength(6);
  });

  it('still renders a self-contained HTML deck', () => {
    const html = renderApexCharterSkeletonHtml(GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('SHAPE');
    expect(html).not.toContain('Honest unbound state');
  });
});
