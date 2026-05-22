// Generic Move Mobilize & Go-Decision Packet — unit tests.
//
// Covers the end-to-end proof slice:
//   • a real Move (one per vertical — retail / healthcare / financial
//     services) binds a curated Function Pack, the kernel runs, and the
//     projected packet carries a go-decision that comes from the kernel's
//     REAL recommendation — never a fabricated `go`;
//   • the deck's section structure is the curated Function-Pack
//     mobilization-plan outline (the binding's `deliverableOutline`) —
//     structure is inherited, not improvised;
//   • the binding's precise seed gaps are surfaced into the open-action
//     queue — named, never blank, never fabricated;
//   • a Move with no resolvable function produces the honest UNBOUND result,
//     and the renderer renders the honest unbound deck — never a fake one.

import {
  buildMoveMobilizePacket,
  type MoveMobilizePacket,
} from '../move-mobilize-model';
import { buildMoveBusinessCase } from '../../../../move-business-case';
import { renderMoveMobilizePacketHtml } from '../move-mobilize-renderer';
import type { MoveBusinessCaseInput } from '../../../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../../../function-identity';

const GENERATED_ON = '2026-05-22';

// ─────────────────────────────────────────────────────────────────────────────
// Minimal real-Move fixtures — one per vertical, each with a
// `charter.functionPackKey` pointing at a curated pack with a mobilization
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

/** The valid go-decision verdicts — `go` must never be fabricated from thin data. */
const GO_VERDICTS = ['go', 'conditional_go', 'no_go'];

describe('buildMoveMobilizePacket — a real Move in each vertical', () => {
  for (const { name, move } of VERTICALS) {
    describe(`vertical: ${name}`, () => {
      it('binds a curated pack and projects a bound packet', () => {
        const packet = buildMoveMobilizePacket(move, GENERATED_ON);
        expect(packet.bound).toBe(true);
      });

      it('the go-decision comes from the kernel’s REAL verdict', () => {
        const packet = buildMoveMobilizePacket(
          move,
          GENERATED_ON,
        ) as MoveMobilizePacket;
        expect(GO_VERDICTS).toContain(packet.verdict);

        // The packet verdict is a deterministic projection of the kernel's
        // business-case recommendation — fund→go, shape→conditional_go,
        // kill→no_go. It is read, never re-decided.
        const kernel = buildMoveBusinessCase(move);
        expect(kernel.bound).toBe(true);
        const rec = kernel.skeleton!.recommendation;
        const expected =
          rec === 'fund' ? 'go' : rec === 'kill' ? 'no_go' : 'conditional_go';
        expect(packet.verdict).toBe(expected);

        // The go-decision rationale is the kernel's own recommendation
        // rationale — not invented prose.
        expect(packet.verdictRationale).toBe(
          kernel.skeleton!.recommendationRationale,
        );
      });

      it('inherits the curated mobilization outline as the section spine', () => {
        const packet = buildMoveMobilizePacket(
          move,
          GENERATED_ON,
        ) as MoveMobilizePacket;
        const outline = packet.sections.inheritedPlan.outline;
        // The curated outline is non-empty and every section carries real
        // guidance — a label list would be a hard fail.
        expect(outline.length).toBeGreaterThan(0);
        for (const section of outline) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.guidance.length).toBeGreaterThan(0);
        }
      });

      it('surfaces the binding’s precise seed gaps into the open queue', () => {
        const packet = buildMoveMobilizePacket(
          move,
          GENERATED_ON,
        ) as MoveMobilizePacket;
        // The fixture records no metrics, so the open queue carries the
        // pack's seed gaps as named, non-blocking pre-launch actions.
        const gapActions = packet.sections.openActions.actions.filter(
          (a) => !a.blocksGoLive,
        );
        expect(gapActions.length).toBeGreaterThan(0);
        for (const action of gapActions) {
          expect(action.action.length).toBeGreaterThan(0);
          expect(action.owner.length).toBeGreaterThan(0);
          expect(action.gateImpact.length).toBeGreaterThan(0);
        }
      });

      it('the Tower handoff and value/effort trace to the kernel skeleton', () => {
        const packet = buildMoveMobilizePacket(
          move,
          GENERATED_ON,
        ) as MoveMobilizePacket;
        const kernel = buildMoveBusinessCase(move);
        const skeleton = kernel.skeleton!;
        // Investment is a real range with a positive base point.
        const inv = packet.sections.valueEffort.investmentRange;
        expect(inv.point).toBeGreaterThan(0);
        expect(inv).toEqual(skeleton.economics.investment);
        // The Tower handoff metric count matches the kernel handoff.
        expect(packet.sections.towerHandoff.metrics.length).toBe(
          skeleton.towerHandoff.length,
        );
      });

      it('renders a self-contained HTML deck with the go-decision in it', () => {
        const html = renderMoveMobilizePacketHtml(move, GENERATED_ON);
        const packet = buildMoveMobilizePacket(
          move,
          GENERATED_ON,
        ) as MoveMobilizePacket;
        expect(html.startsWith('<!doctype html>')).toBe(true);
        expect(html).toContain(packet.moveLabel);
        // The deck is not the honest-unbound document.
        expect(html).not.toContain('Honest unbound state');
      });

      it('is deterministic — same Move → same deck', () => {
        const a = renderMoveMobilizePacketHtml(move, GENERATED_ON);
        const b = renderMoveMobilizePacketHtml(move, GENERATED_ON);
        expect(a).toBe(b);
      });
    });
  }
});

describe('buildMoveMobilizePacket — a Move with no resolvable function', () => {
  it('returns the honest UNBOUND result, never a fabricated packet', () => {
    const result = buildMoveMobilizePacket(UNBOUND_MOVE, GENERATED_ON);
    expect(result.bound).toBe(false);
    if (!result.bound) {
      expect(result.unboundReason.length).toBeGreaterThan(0);
      expect(result.moveLabel).toBe(UNBOUND_MOVE.name);
    }
  });

  it('the renderer renders the honest unbound deck — not a go-decision', () => {
    const html = renderMoveMobilizePacketHtml(UNBOUND_MOVE, GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Honest unbound state');
    expect(html).toContain('No curated Domain Function Pack');
    // No fabricated go-decision — the unbound deck states the gap and stops.
    expect(html).toContain('Kernel');
    expect(html).toContain('Not run');
  });
});

describe('buildMoveMobilizePacket — honesty discipline', () => {
  it('a thin Move (no recorded metrics) does not produce a fabricated GO', () => {
    // None of the three fixtures records baseline metrics, so monetisation
    // rests on a proxy — the kernel must not return a clean `fund`, so the
    // go-decision must not be a clean `go`.
    for (const { move } of VERTICALS) {
      const packet = buildMoveMobilizePacket(
        move,
        GENERATED_ON,
      ) as MoveMobilizePacket;
      expect(packet.verdict).not.toBe('go');
    }
  });

  it('a recorded metric is reflected in the readiness gates', () => {
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
    const packet = buildMoveMobilizePacket(
      moveWithData,
      GENERATED_ON,
    ) as MoveMobilizePacket;
    expect(packet.bound).toBe(true);
    // A recorded metric lifts the baseline-coverage readiness row off the
    // fully-blocked state.
    const coverageRow = packet.sections.controlsReadiness.rows.find(
      (r) => r.label === 'Baseline coverage',
    );
    expect(coverageRow).toBeDefined();
    expect(coverageRow!.state).not.toBe('blocked');
  });
});
