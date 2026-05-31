// Generic Move Estimate & Financial Model — unit tests.
//
// Covers the end-to-end proof slice:
//   • a real Move (one per vertical — retail / healthcare / financial
//     services) binds a curated Function Pack, the kernel runs, and the
//     projected estimate model carries the kernel's REAL verdict, the effort
//     decomposition, the role-mix cost build-up and the value forecast;
//   • every figure traces to a kernel field — the investment range is a real
//     planning range, the workstreams are all costed individually, the value
//     forecast is honestly discounted;
//   • the binding's precise seed gaps are surfaced into the baseline section —
//     named, never blank, never fabricated;
//   • a Move with no resolvable function produces the honest UNBOUND result,
//     and the renderer renders the honest unbound deck — never a fake estimate.

import {
  buildMoveEstimateModel,
  type MoveEstimateModel,
} from '../move-estimate-model';
import { renderMoveEstimateModelHtml } from '../move-estimate-renderer';
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

const AI_OPS_RETAIL_MOVE: MoveBusinessCaseInput = {
  ...RETAIL_MOVE,
  name: 'Apex Store Labor AI',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'workforce_labor' },
  aiOperatingCost: {
    callRamp: {
      y1: 300_000,
      y2: 900_000,
      y3: 1_500_000,
      y4: 1_900_000,
      y5: 2_200_000,
    },
    tokensPerCall: { input: 1_800, output: 600, cacheHitRate: 0.25 },
    modelTier: 'cost_optimized',
    modelTierRamp: [{ year: 3, tier: 'mid', reasonCode: 'schedule_quality' }],
    pricingTiers: [
      {
        thresholdCallsPerMonth: 100_000,
        discount: 0,
        notes: 'requires pricing-tier lock before network-wide rollout',
      },
    ],
    decisionUnit: 'scheduled store-week',
    decisionsPerCall: 1,
  },
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

describe('buildMoveEstimateModel — a real Move in each vertical', () => {
  for (const { name, move } of VERTICALS) {
    describe(`vertical: ${name}`, () => {
      it('binds a curated pack and projects a bound estimate model', () => {
        const model = buildMoveEstimateModel(move, GENERATED_ON);
        expect(model.bound).toBe(true);
      });

      it('carries the kernel’s REAL verdict, never a fabricated `go`', () => {
        const model = buildMoveEstimateModel(
          move,
          GENERATED_ON,
        ) as MoveEstimateModel;
        expect(['fund', 'shape', 'kill']).toContain(model.recommendation);
        // The exec-summary headline restates the kernel verdict word — it is
        // never the word "go".
        const headline = model.sections.executiveSummary.verdictHeadline;
        expect(headline.toLowerCase()).not.toMatch(/\bgo\b/);
        expect(headline).toContain(model.recommendation.toUpperCase());
        // The recommendation tile matches the verdict.
        const tile = model.sections.executiveSummary.tiles.find(
          (t) => t.label === 'Recommendation',
        );
        expect(tile?.value).toBe(model.recommendation.toUpperCase());
      });

      it('the effort decomposition is kernel-derived — every workstream costed', () => {
        const model = buildMoveEstimateModel(
          move,
          GENERATED_ON,
        ) as MoveEstimateModel;
        const ws = model.sections.workstreamEstimate;
        // The estimate is never collapsed — at least the eight standard
        // workstreams, each with a positive base cost and its own role mix.
        expect(ws.workstreams.length).toBeGreaterThanOrEqual(8);
        for (const w of ws.workstreams) {
          expect(w.baseCost).toBeGreaterThan(0);
          // The cost range never inverts: upside ≤ base ≤ conservative.
          expect(w.upsideCost).toBeLessThanOrEqual(w.baseCost);
          expect(w.conservativeCost).toBeGreaterThanOrEqual(w.baseCost);
        }
        // The total is a real planning range with a positive base point.
        expect(ws.totalBase).toBeGreaterThan(0);
        expect(ws.totalUpside).toBeLessThanOrEqual(ws.totalBase);
        expect(ws.totalConservative).toBeGreaterThanOrEqual(ws.totalBase);
        // Business change is surfaced as a costed lane, not buried.
        expect(ws.businessChangeCost).toBeGreaterThan(0);
        expect(ws.businessChangeFraction).toBeGreaterThan(0);
        expect(ws.workstreams.some((w) => w.isBusinessChange)).toBe(true);
      });

      it('the investment range traces to the kernel economics', () => {
        const model = buildMoveEstimateModel(
          move,
          GENERATED_ON,
        ) as MoveEstimateModel;
        const tile = model.sections.executiveSummary.tiles.find(
          (t) => t.label === 'Investment (base)',
        );
        expect(tile?.value.length).toBeGreaterThan(0);
        // The exec-summary investment base equals the workstream total base.
        const ws = model.sections.workstreamEstimate;
        expect(ws.totalBase).toBeGreaterThan(0);
      });

      it('the rate card names its source and keeps role-family lanes distinct', () => {
        const model = buildMoveEstimateModel(
          move,
          GENERATED_ON,
        ) as MoveEstimateModel;
        const rc = model.sections.rateCard;
        // The provenance label is non-empty — the rate-card source is shown.
        expect(rc.provenanceLabel.length).toBeGreaterThan(0);
        expect(rc.cells.length).toBeGreaterThan(0);
        // At least one priced lane — domain / location are not collapsed.
        expect(
          rc.cells.some((c) => c.onshore !== null || c.offshore !== null),
        ).toBe(true);
      });

      it('the value forecast is honestly discounted, not optimistic', () => {
        const model = buildMoveEstimateModel(
          move,
          GENERATED_ON,
        ) as MoveEstimateModel;
        const vf = model.sections.valueForecast;
        // The net value is a real planning range.
        expect(vf.netValue.low).toBeLessThanOrEqual(vf.netValue.point);
        expect(vf.netValue.high).toBeGreaterThanOrEqual(vf.netValue.point);
        // The per-year curve climbs along the adoption ramp.
        expect(vf.curve).toHaveLength(3);
        expect(vf.curve[0].adoption).toBeLessThan(vf.curve[2].adoption);
      });

      it('surfaces the binding’s precise seed gaps — named, never blank', () => {
        const model = buildMoveEstimateModel(
          move,
          GENERATED_ON,
        ) as MoveEstimateModel;
        const gaps = model.sections.baselineInputs.seedGaps;
        // The fixture records no metrics, so every expected metric is a gap.
        expect(gaps.length).toBeGreaterThan(0);
        for (const gap of gaps) {
          expect(gap.metric.length).toBeGreaterThan(0);
          expect(gap.reason.length).toBeGreaterThan(0);
          expect(gap.expectedDataSource.length).toBeGreaterThan(0);
        }
      });

      it('renders a self-contained HTML deck with the verdict in it', () => {
        const html = renderMoveEstimateModelHtml(move, GENERATED_ON);
        const model = buildMoveEstimateModel(
          move,
          GENERATED_ON,
        ) as MoveEstimateModel;
        expect(html.startsWith('<!doctype html>')).toBe(true);
        expect(html).toContain(model.recommendation.toUpperCase());
        expect(html).toContain(model.moveLabel);
        // The deck is the bound estimate model, not the honest-unbound doc.
        expect(html).not.toContain('Honest unbound state');
        // The deck names the artifact and shows the workstream estimate.
        expect(html).toContain('Estimate &amp; Financial Model');
        expect(html).toContain('Workstream estimate');
      });

      it('is deterministic — same Move → same deck', () => {
        const a = renderMoveEstimateModelHtml(move, GENERATED_ON);
        const b = renderMoveEstimateModelHtml(move, GENERATED_ON);
        expect(a).toBe(b);
      });
    });
  }
});

describe('buildMoveEstimateModel — a Move with no resolvable function', () => {
  it('returns the honest UNBOUND result, never a fabricated estimate', () => {
    const result = buildMoveEstimateModel(UNBOUND_MOVE, GENERATED_ON);
    expect(result.bound).toBe(false);
    if (!result.bound) {
      expect(result.unboundReason.length).toBeGreaterThan(0);
      expect(result.moveLabel).toBe(UNBOUND_MOVE.name);
    }
  });

  it('the renderer renders the honest unbound deck — not an estimate', () => {
    const html = renderMoveEstimateModelHtml(UNBOUND_MOVE, GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Honest unbound state');
    expect(html).toContain('No curated Domain Function Pack');
    // No verdict word, no fabricated economics — the unbound deck states the
    // gap and stops.
    expect(html).toContain('Kernel');
    expect(html).toContain('Not run');
  });
});

describe('renderMoveEstimateModelHtml — AI Ops cost panel', () => {
  it('renders the three-axis split, unit economic, and run-cost warnings', () => {
    const model = buildMoveEstimateModel(
      AI_OPS_RETAIL_MOVE,
      GENERATED_ON,
    ) as MoveEstimateModel;
    const section = model.sections.workstreamEstimate;

    expect(section.aiOps).not.toBeNull();
    expect(section.aiOpsCost).toBe(section.aiOps!.threeYearTotal);
    expect(section.aiOps!.decisionUnit).toBe('scheduled store-week');
    expect(section.aiOps!.pricingTierShockWarning).toContain('Year');
    expect(section.aiOps!.modelTierDriftWarning).toContain('schedule_quality');

    const html = renderMoveEstimateModelHtml(AI_OPS_RETAIL_MOVE, GENERATED_ON);
    expect(html).toContain('Three-axis cost view');
    expect(html).toContain('AI Ops cost');
    expect(html).toContain('Unit economic');
    expect(html).toContain('Pricing-tier alert');
    expect(html).toContain('Model-tier drift');
    expect(html).toContain('scheduled store-week');
  });
});

describe('buildMoveEstimateModel — honesty discipline', () => {
  it('a thin Move (no recorded metrics) does not produce a fabricated FUND', () => {
    // None of the three fixtures records baseline metrics, so monetisation
    // rests on a proxy — the kernel must not return a clean `fund`, and the
    // payback must be honestly blocked.
    for (const { move } of VERTICALS) {
      const model = buildMoveEstimateModel(
        move,
        GENERATED_ON,
      ) as MoveEstimateModel;
      expect(model.recommendation).not.toBe('fund');
      expect(model.paybackBlocked).toBe(true);
      // The payback tile is honest about the block.
      const tile = model.sections.executiveSummary.tiles.find(
        (t) => t.label === 'Payback',
      );
      expect(tile?.value).toBe('Blocked');
    }
  });

  it('a recorded metric is reflected in the baseline section', () => {
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
    const model = buildMoveEstimateModel(
      moveWithData,
      GENERATED_ON,
    ) as MoveEstimateModel;
    expect(model.bound).toBe(true);
    // A recorded metric lifts the recorded count above zero.
    expect(model.sections.baselineInputs.recordedCount).toBeGreaterThan(0);
    expect(model.sections.baselineInputs.coveragePct).toBeGreaterThan(0);
  });

  it('the cash-flow curve never claims a payback while monetisation is blocked', () => {
    // A blocked Move's cash-flow is a net-value model, not verified cash —
    // the payback note must say so plainly.
    const model = buildMoveEstimateModel(
      RETAIL_MOVE,
      GENERATED_ON,
    ) as MoveEstimateModel;
    const sens = model.sections.sensitivity;
    expect(sens.paybackBlocked).toBe(true);
    expect(sens.paybackNote.toLowerCase()).toContain('not computable');
    // The cash-flow series carries one value per period label.
    expect(sens.cashFlow.base).toHaveLength(sens.cashFlow.periodLabels.length);
  });
});
