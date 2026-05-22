// Generic Move Discover Brief — unit tests.
//
// Covers the end-to-end proof slice:
//   • a real Move (one per vertical — retail / healthcare / financial
//     services) binds a curated Function Pack for the Discover Brief artifact,
//     the kernel runs, and the projected brief carries the kernel's REAL
//     verdict (`go`/`reshape`/`no-go`) and the real baseline split;
//   • the deck's section structure inherits the curated Function-Pack Discover
//     outline (the binding's `deliverableOutline`) — structure is inherited,
//     not improvised;
//   • the binding's precise seed gaps are surfaced into the evidence-gaps
//     section — named with their source, never blank, never fabricated;
//   • a Move with no resolvable function produces the honest UNBOUND result,
//     and the renderer renders the honest unbound deck — never a fake one.
//   • the Apex reference brief is left intact.

import {
  buildMoveDiscoverBrief,
  type MoveDiscoverBrief,
} from '../move-discover-brief-model';
import { renderMoveDiscoverBriefHtml } from '../move-discover-brief-renderer';
import {
  buildApexDiscoverBrief,
  renderApexDiscoverBriefHtml,
} from '../index';
import type { MoveBusinessCaseInput } from '../../../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../../../function-identity';

const GENERATED_ON = '2026-05-22';

// ─────────────────────────────────────────────────────────────────────────────
// Minimal real-Move fixtures — one per vertical, each with a
// `charter.functionPackKey` pointing at a curated pack with a Discover-Brief
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

describe('buildMoveDiscoverBrief — a real Move in each vertical', () => {
  for (const { name, move } of VERTICALS) {
    describe(`vertical: ${name}`, () => {
      it('binds a curated pack and projects a bound brief', () => {
        const brief = buildMoveDiscoverBrief(move, GENERATED_ON);
        expect(brief.bound).toBe(true);
      });

      it('carries the kernel’s REAL verdict, never a fabricated `go`', () => {
        const brief = buildMoveDiscoverBrief(
          move,
          GENERATED_ON,
        ) as MoveDiscoverBrief;
        expect(['go', 'reshape', 'no-go']).toContain(brief.verdict);
        // The decision-snapshot headline restates the verdict word.
        expect(brief.sections.decisionSnapshot.verdictHeadline).toContain(
          brief.verdict === 'go'
            ? 'GO'
            : brief.verdict === 'no-go'
              ? 'NO-GO'
              : 'RESHAPE',
        );
      });

      it('inherits the curated Function-Pack Discover outline as the spine', () => {
        const brief = buildMoveDiscoverBrief(
          move,
          GENERATED_ON,
        ) as MoveDiscoverBrief;
        const outline = brief.sections.inheritedOutline.outline;
        // The curated outline is non-empty and every section carries real
        // guidance — a label list would be a hard fail.
        expect(outline.length).toBeGreaterThan(0);
        for (const section of outline) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.guidance.length).toBeGreaterThan(0);
        }
      });

      it('surfaces the binding’s precise seed gaps — named, with a source', () => {
        const brief = buildMoveDiscoverBrief(
          move,
          GENERATED_ON,
        ) as MoveDiscoverBrief;
        const gaps = brief.sections.evidenceGaps.gaps;
        // The fixture records no metrics, so every expected metric is a gap.
        expect(gaps.length).toBeGreaterThan(0);
        for (const gap of gaps) {
          expect(gap.label.length).toBeGreaterThan(0);
          expect(gap.reason.length).toBeGreaterThan(0);
          expect(gap.expectedDataSource.length).toBeGreaterThan(0);
        }
      });

      it('carries a real baseline split — recorded vs declared seed gaps', () => {
        const brief = buildMoveDiscoverBrief(
          move,
          GENERATED_ON,
        ) as MoveDiscoverBrief;
        const baseline = brief.sections.currentStateBaseline;
        // Zero recorded metrics in the fixture → seed gaps, never blank.
        expect(baseline.seedGapCount).toBeGreaterThan(0);
        for (const gap of baseline.seedGaps) {
          expect(gap.metric.length).toBeGreaterThan(0);
          expect(gap.reason.length).toBeGreaterThan(0);
        }
        // Coverage is the honest recorded fraction.
        expect(baseline.coveragePct).toBe(0);
      });

      it('renders a self-contained HTML deck with the verdict in it', () => {
        const html = renderMoveDiscoverBriefHtml(move, GENERATED_ON);
        const brief = buildMoveDiscoverBrief(
          move,
          GENERATED_ON,
        ) as MoveDiscoverBrief;
        expect(html.startsWith('<!doctype html>')).toBe(true);
        expect(html).toContain(brief.moveLabel);
        // The deck is not the honest-unbound document.
        expect(html).not.toContain('Honest unbound state');
        // The inherited-outline slide carries the curated outline.
        expect(html).toContain('Inherited outline');
      });

      it('is deterministic — same Move → same deck', () => {
        const a = renderMoveDiscoverBriefHtml(move, GENERATED_ON);
        const b = renderMoveDiscoverBriefHtml(move, GENERATED_ON);
        expect(a).toBe(b);
      });
    });
  }
});

describe('buildMoveDiscoverBrief — a Move with no resolvable function', () => {
  it('returns the honest UNBOUND result, never a fabricated brief', () => {
    const result = buildMoveDiscoverBrief(UNBOUND_MOVE, GENERATED_ON);
    expect(result.bound).toBe(false);
    if (!result.bound) {
      expect(result.unboundReason.length).toBeGreaterThan(0);
      expect(result.moveLabel).toBe(UNBOUND_MOVE.name);
    }
  });

  it('the renderer renders the honest unbound deck — not a Discover Brief', () => {
    const html = renderMoveDiscoverBriefHtml(UNBOUND_MOVE, GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Honest unbound state');
    expect(html).toContain('No curated Domain Function Pack');
    // No fabricated verdict — the unbound deck states the gap and stops.
    expect(html).toContain('Not run');
  });
});

describe('buildMoveDiscoverBrief — honesty discipline', () => {
  it('a thin Move (no recorded metrics) does not produce a fabricated GO', () => {
    // None of the three fixtures records baseline metrics, so monetisation
    // rests on a proxy — the kernel must not return a clean `go`.
    for (const { move } of VERTICALS) {
      const brief = buildMoveDiscoverBrief(
        move,
        GENERATED_ON,
      ) as MoveDiscoverBrief;
      expect(brief.verdict).not.toBe('go');
      // Monetisation is blocked, so the opportunity is directional only.
      expect(brief.sections.painAndOpportunity.directionalOnly).toBe(true);
    }
  });

  it('a recorded metric is reflected in the baseline section', () => {
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
    const brief = buildMoveDiscoverBrief(
      moveWithData,
      GENERATED_ON,
    ) as MoveDiscoverBrief;
    expect(brief.bound).toBe(true);
    // A recorded metric lifts the recorded count above zero.
    expect(
      brief.sections.currentStateBaseline.recordedCount,
    ).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The Apex reference brief is left intact — its model and renderer still work
// exactly as before. The generic path is added alongside, not in place of it.
// ─────────────────────────────────────────────────────────────────────────────

describe('the Apex reference Discover Brief is unaffected', () => {
  it('still builds with the reshape verdict and six sections', () => {
    const brief = buildApexDiscoverBrief(GENERATED_ON);
    expect(brief.verdict).toBe('reshape');
    expect(brief.toc).toHaveLength(6);
  });

  it('still renders a self-contained HTML deck', () => {
    const html = renderApexDiscoverBriefHtml(GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('RESHAPE');
    expect(html).not.toContain('Honest unbound state');
  });
});
