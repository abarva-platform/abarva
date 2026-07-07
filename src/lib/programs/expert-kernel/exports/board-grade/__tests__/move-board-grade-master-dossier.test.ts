// Generic Move Master Move Dossier — unit tests.
//
// Covers the end-to-end proof slice:
//   • a real Move (one per vertical — retail / healthcare / financial
//     services) binds a curated Function Pack, the kernel runs, and the
//     projected Master Move Dossier carries the kernel's REAL verdict;
//   • the assembled-book structure is intact — the executive answer, the
//     decision timeline, the economics, the roadmap & Tower handoff, the
//     evidence/gap audit and the recommendation are all kernel-derived;
//   • §6 — the assembled book — links every OTHER generic board-grade deck
//     for that Move, each link carrying `?moveId=<id>`;
//   • the binding's precise seed gaps are surfaced into the evidence/gap
//     section — named, never blank, never fabricated;
//   • a Move with no resolvable function produces the honest UNBOUND result,
//     and the renderer renders the honest unbound deck — never a fake one;
//   • the Apex reference dossier (`buildApexMasterMoveDossier`) is untouched.

import {
  buildMoveMasterDossier,
  type MoveMasterDossier,
} from '../move-master-dossier-model';
import { renderMoveMasterDossierHtml } from '../move-master-dossier-renderer';
import { buildApexMasterMoveDossier } from '../master-dossier-model';
import { renderApexMasterDossierHtml } from '../master-dossier-renderer';
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

const VERTICALS: Array<{
  name: string;
  move: MoveBusinessCaseInput;
  moveId: string;
}> = [
  { name: 'retail', move: RETAIL_MOVE, moveId: 'retail-move-1' },
  { name: 'healthcare', move: HEALTHCARE_MOVE, moveId: 'health-move-1' },
  { name: 'financial services', move: FINSERV_MOVE, moveId: 'fs-move-1' },
];

// A Move that resolves no curated Function Pack — its industry resolves but
// the charter carries no function key.
const UNBOUND_MOVE: MoveBusinessCaseInput = {
  industry_code: 'RETAIL',
  name: 'A Move with no classified function',
  charter: {},
  baseline_metrics: [],
};

describe('buildMoveMasterDossier — a real Move in each vertical', () => {
  for (const { name, move, moveId } of VERTICALS) {
    describe(`vertical: ${name}`, () => {
      it('binds a curated pack and projects a bound dossier', () => {
        const dossier = buildMoveMasterDossier(move, moveId, GENERATED_ON);
        expect(dossier.bound).toBe(true);
      });

      it('carries the kernel’s REAL verdict, never a fabricated `go`', () => {
        const dossier = buildMoveMasterDossier(
          move,
          moveId,
          GENERATED_ON,
        ) as MoveMasterDossier;
        expect(['fund', 'shape', 'kill']).toContain(dossier.verdict);
        // The executive answer headline restates the kernel verdict.
        expect(dossier.sections.executiveAnswer.verdictHeadline).toContain(
          dossier.verdict.toUpperCase(),
        );
        // The recommendation verdict matches the dossier verdict.
        expect(dossier.sections.recommendation.verdictHeadline).toContain(
          dossier.verdict.toUpperCase(),
        );
      });

      it('projects the assembled-book structure from the kernel', () => {
        const dossier = buildMoveMasterDossier(
          move,
          moveId,
          GENERATED_ON,
        ) as MoveMasterDossier;
        // §1 executive answer — investment vs return are real ranges.
        const ivr = dossier.sections.executiveAnswer.investmentVsReturn;
        expect(ivr.investmentHigh).toBeGreaterThanOrEqual(ivr.investmentLow);
        expect(ivr.investmentLow).toBeGreaterThan(0);
        // §2 decision timeline — four phases, Discover → Mobilize.
        const phases = dossier.sections.decisionTimeline.phases;
        expect(phases.map((p) => p.phase)).toEqual([
          'Discover',
          'Charter',
          'Design & Plan',
          'Mobilize',
        ]);
        // §3 economics — investment is a real range with a positive base.
        expect(dossier.sections.economics.investmentPoint).toBeGreaterThan(0);
        expect(
          dossier.sections.economics.scenarios.map((s) => s.label),
        ).toEqual(['Conservative', 'Base', 'Upside']);
        // §4 roadmap — eight costed workstreams + a Tower handoff.
        expect(
          dossier.sections.roadmapTower.workstreams.length,
        ).toBeGreaterThan(0);
        expect(
          dossier.sections.roadmapTower.towerHandoff.length,
        ).toBeGreaterThan(0);
        // §7 recommendation — at least one gating condition is named.
        expect(
          dossier.sections.recommendation.conditions.length,
        ).toBeGreaterThan(0);
      });

      it('§6 — the assembled book — links every other generic deck with ?moveId', () => {
        const dossier = buildMoveMasterDossier(
          move,
          moveId,
          GENERATED_ON,
        ) as MoveMasterDossier;
        const book = dossier.sections.assembledBook;
        // The assembled book links the seven sibling generic decks.
        expect(book.artifacts.map((a) => a.id).sort()).toEqual([
          'cfo-pack',
          'charter-skeleton',
          'costed-business-case',
          'discover-brief',
          'estimate-model',
          'mobilize-packet',
          'solution-architecture',
        ]);
        // The dossier never links itself — it is the assembled book, not a
        // chapter of it.
        expect(book.artifacts.map((a) => a.id)).not.toContain(
          'master-dossier',
        );
        // Every sibling link carries THIS Move's id.
        for (const artifact of book.artifacts) {
          expect(artifact.htmlHref).toContain(
            `?moveId=${encodeURIComponent(moveId)}`,
          );
          expect(artifact.htmlHref.startsWith('/api/v1/moves/')).toBe(true);
        }
        // The Costed Business-Case Pack link is the expected route.
        const costed = book.artifacts.find(
          (a) => a.id === 'costed-business-case',
        );
        expect(costed?.htmlHref).toBe(
          `/api/v1/moves/board-grade-business-case?moveId=${moveId}`,
        );
      });

      it('surfaces the binding’s precise seed gaps — named, never blank', () => {
        const dossier = buildMoveMasterDossier(
          move,
          moveId,
          GENERATED_ON,
        ) as MoveMasterDossier;
        const gaps = dossier.sections.evidenceAndGaps.seedGaps;
        // The fixture records no metrics, so every expected metric is a gap.
        expect(gaps.length).toBeGreaterThan(0);
        for (const gap of gaps) {
          expect(gap.metric.length).toBeGreaterThan(0);
          expect(gap.reason.length).toBeGreaterThan(0);
          expect(gap.expectedDataSource.length).toBeGreaterThan(0);
        }
      });

      it('renders a self-contained HTML deck that links the other decks', () => {
        const html = renderMoveMasterDossierHtml(move, moveId, GENERATED_ON);
        const dossier = buildMoveMasterDossier(
          move,
          moveId,
          GENERATED_ON,
        ) as MoveMasterDossier;
        expect(html.startsWith('<!doctype html>')).toBe(true);
        expect(html).toContain(dossier.verdict.toUpperCase());
        expect(html).toContain(dossier.moveLabel);
        // The deck reads as the assembled book.
        expect(html).toContain('assembled book');
        // It links the other generic decks for this Move.
        expect(html).toContain(
          `/api/v1/moves/board-grade-business-case?moveId=${moveId}`,
        );
        expect(html).toContain(
          `/api/v1/moves/board-grade-cfo-pack?moveId=${moveId}`,
        );
        // The deck is not the honest-unbound document.
        expect(html).not.toContain('Honest unbound state');
      });

      it('is deterministic — same Move → same deck', () => {
        const a = renderMoveMasterDossierHtml(move, moveId, GENERATED_ON);
        const b = renderMoveMasterDossierHtml(move, moveId, GENERATED_ON);
        expect(a).toBe(b);
      });
    });
  }
});

describe('buildMoveMasterDossier — honesty discipline', () => {
  it('a thin Move (no recorded metrics) does not produce a fabricated FUND', () => {
    // None of the three fixtures records baseline metrics, so monetisation
    // rests on a proxy — the kernel must not return a clean `fund`.
    for (const { move, moveId } of VERTICALS) {
      const dossier = buildMoveMasterDossier(
        move,
        moveId,
        GENERATED_ON,
      ) as MoveMasterDossier;
      expect(dossier.verdict).not.toBe('fund');
    }
  });

  it('a thin Move blocks payback and says so honestly', () => {
    for (const { move, moveId } of VERTICALS) {
      const dossier = buildMoveMasterDossier(
        move,
        moveId,
        GENERATED_ON,
      ) as MoveMasterDossier;
      expect(dossier.monetisationBlocked).toBe(true);
      expect(dossier.sections.economics.paybackBlocked).toBe(true);
      expect(dossier.sections.economics.paybackText.toLowerCase()).toContain(
        'not claimable',
      );
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
    const dossier = buildMoveMasterDossier(
      moveWithData,
      'retail-move-1',
      GENERATED_ON,
    ) as MoveMasterDossier;
    expect(dossier.bound).toBe(true);
    expect(
      dossier.sections.evidenceAndGaps.recordedCount,
    ).toBeGreaterThan(0);
  });
});

describe('buildMoveMasterDossier — a Move with no resolvable function', () => {
  it('returns the honest UNBOUND result, never a fabricated deck', () => {
    const result = buildMoveMasterDossier(
      UNBOUND_MOVE,
      'unbound-move-1',
      GENERATED_ON,
    );
    expect(result.bound).toBe(false);
    if (!result.bound) {
      expect(result.unboundReason.length).toBeGreaterThan(0);
      expect(result.moveLabel).toBe(UNBOUND_MOVE.name);
    }
  });

  it('the renderer renders the honest unbound deck — not a dossier', () => {
    const html = renderMoveMasterDossierHtml(
      UNBOUND_MOVE,
      'unbound-move-1',
      GENERATED_ON,
    );
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Honest unbound state');
    expect(html).toContain('No curated Domain Function Pack');
    // No verdict word, no fabricated economics, no sibling-deck links — the
    // unbound deck states the gap and stops.
    expect(html).toContain('Kernel');
    expect(html).toContain('Not run');
    expect(html).not.toContain('board-grade-business-case?moveId=');
  });
});

describe('renderMoveMasterDossierHtml — AI Ops cost panel', () => {
  it('surfaces the three-axis split and AI run-cost warnings in the dossier', () => {
    const dossier = buildMoveMasterDossier(
      AI_OPS_RETAIL_MOVE,
      'ai-ops-move-1',
      GENERATED_ON,
    ) as MoveMasterDossier;
    const roadmap = dossier.sections.roadmapTower;

    expect(roadmap.aiOps).not.toBeNull();
    expect(roadmap.aiOpsCost).toBe(roadmap.aiOps!.threeYearTotal);
    expect(roadmap.aiOps!.decisionUnit).toBe('scheduled store-week');
    expect(roadmap.aiOps!.pricingTierShockWarning).toContain('Year');
    expect(roadmap.aiOps!.modelTierDriftWarning).toContain('schedule_quality');

    const html = renderMoveMasterDossierHtml(
      AI_OPS_RETAIL_MOVE,
      'ai-ops-move-1',
      GENERATED_ON,
    );
    expect(html).toContain('Three-axis cost view');
    expect(html).toContain('AI Ops cost');
    expect(html).toContain('Unit economic');
    expect(html).toContain('Pricing-tier alert');
    expect(html).toContain('Model-tier drift');
    expect(html).toContain('scheduled store-week');
  });
});

describe('buildApexMasterMoveDossier — the reference dossier is untouched', () => {
  it('still builds the Apex reference dossier with its honest verdict', () => {
    const dossier = buildApexMasterMoveDossier(GENERATED_ON);
    expect(dossier.tenantLabel).toBe('Apex Retail');
    expect(dossier.verdict).toBe('shape');
    expect(dossier.goDecision).toBe('no_go');
    expect(dossier.paybackBlocked).toBe(true);
  });

  it('still renders the Apex reference dossier HTML deck', () => {
    const html = renderApexMasterDossierHtml(GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Master Move Dossier');
  });
});
