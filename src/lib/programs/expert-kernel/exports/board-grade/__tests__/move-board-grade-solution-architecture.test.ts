// Generic Move Solution Architecture Pack — unit tests.
//
// Covers the end-to-end proof slice, mirroring the generic Costed
// Business-Case pack tests:
//   • a real Move (one per vertical — retail / healthcare / financial
//     services) binds a curated Function Pack for the solution-architecture
//     artifact, and the projected pack carries the curated reference patterns
//     and AI archetypes — the architecture is pack-grounded, not improvised;
//   • the deck's section structure is the curated solution-architecture
//     outline (the binding's `deliverableOutline`) — inherited, not improvised;
//   • the binding's precise seed gaps are surfaced into the evidence-gaps
//     section — named, never blank, never fabricated;
//   • the recommended target pattern is the most human-accountable curated
//     pattern — never full autonomy;
//   • a Move with no resolvable function produces the honest UNBOUND result,
//     and the renderer renders the honest unbound deck — never a fake one.

import {
  buildMoveSolutionArchitecture,
  type MoveSolutionArchitecture,
} from '../move-solution-architecture-model';
import { renderMoveSolutionArchitectureHtml } from '../move-solution-architecture-renderer';
import type { MoveBusinessCaseInput } from '../../../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../../../function-identity';

const GENERATED_ON = '2026-05-22';

// ─────────────────────────────────────────────────────────────────────────────
// Minimal real-Move fixtures — one per vertical, each with a
// `charter.functionPackKey` pointing at a curated pack with a
// solution-architecture outline. Deliberately thin baseline data so the
// binding must seed-gap.
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

describe('buildMoveSolutionArchitecture — a real Move in each vertical', () => {
  for (const { name, move } of VERTICALS) {
    describe(`vertical: ${name}`, () => {
      it('binds a curated pack and projects a bound architecture', () => {
        const arch = buildMoveSolutionArchitecture(move, GENERATED_ON);
        expect(arch.bound).toBe(true);
      });

      it('inherits the curated solution-architecture outline as the spine', () => {
        const arch = buildMoveSolutionArchitecture(
          move,
          GENERATED_ON,
        ) as MoveSolutionArchitecture;
        const outline = arch.sections.inheritedOutline.outline;
        // The curated outline is non-empty and every section carries real
        // guidance — a label list would be a hard fail.
        expect(outline.length).toBeGreaterThan(0);
        for (const section of outline) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.guidance.length).toBeGreaterThan(0);
        }
      });

      it('projects the curated reference patterns + AI archetypes', () => {
        const arch = buildMoveSolutionArchitecture(
          move,
          GENERATED_ON,
        ) as MoveSolutionArchitecture;
        // Reference patterns drive the target-state architecture section.
        const patterns = arch.sections.targetArchitecture.patterns;
        expect(patterns.length).toBeGreaterThan(0);
        for (const p of patterns) {
          expect(p.name.length).toBeGreaterThan(0);
          expect(p.boundary.length).toBeGreaterThan(0);
          expect(p.humanAccountabilityPoint.length).toBeGreaterThan(0);
        }
        // Exactly one pattern is the selected target.
        expect(patterns.filter((p) => p.selected)).toHaveLength(1);
        // AI archetypes drive the archetypes section.
        const archetypes = arch.sections.archetypes.archetypes;
        expect(archetypes.length).toBeGreaterThan(0);
        for (const a of archetypes) {
          expect(a.name.length).toBeGreaterThan(0);
          expect(a.valueMechanism.length).toBeGreaterThan(0);
        }
      });

      it('recommends the most human-accountable pattern, never full autonomy', () => {
        const arch = buildMoveSolutionArchitecture(
          move,
          GENERATED_ON,
        ) as MoveSolutionArchitecture;
        // The target pattern is the selected curated pattern.
        const selected = arch.sections.targetArchitecture.patterns.find(
          (p) => p.selected,
        );
        expect(selected).toBeDefined();
        // The selected pattern is not the highest-autonomy posture: no
        // selected pattern is `autonomous-with-audit` when a lower-autonomy
        // curated pattern exists. With curated packs that always carry a
        // human-accountable pattern, the selected posture is human-bounded.
        expect(selected?.controlPosture).not.toBe('autonomous-with-audit');
      });

      it('surfaces the binding’s precise seed gaps — named, never blank', () => {
        const arch = buildMoveSolutionArchitecture(
          move,
          GENERATED_ON,
        ) as MoveSolutionArchitecture;
        const gaps = arch.sections.evidenceGaps.seedGaps;
        // The fixture records no metrics, so every expected metric is a gap.
        expect(gaps.length).toBeGreaterThan(0);
        for (const gap of gaps) {
          expect(gap.metric.length).toBeGreaterThan(0);
          expect(gap.reason.length).toBeGreaterThan(0);
          expect(gap.expectedDataSource.length).toBeGreaterThan(0);
        }
      });

      it('carries an honest architecture verdict', () => {
        const arch = buildMoveSolutionArchitecture(
          move,
          GENERATED_ON,
        ) as MoveSolutionArchitecture;
        expect(['shape', 'conditional', 'hold']).toContain(arch.verdict);
        // A thin Move (no recorded metrics) seed-gaps, so the verdict is not
        // a clean `shape`.
        expect(arch.verdict).not.toBe('shape');
      });

      it('renders a self-contained HTML deck — a pack-grounded architecture', () => {
        const html = renderMoveSolutionArchitectureHtml(move, GENERATED_ON);
        const arch = buildMoveSolutionArchitecture(
          move,
          GENERATED_ON,
        ) as MoveSolutionArchitecture;
        expect(html.startsWith('<!doctype html>')).toBe(true);
        expect(html).toContain(arch.moveLabel);
        // The deck is the bound architecture, not the honest-unbound document.
        expect(html).not.toContain('Honest unbound state');
        // The seven section anchors are present as slide elements.
        for (const anchor of [
          'architecture-decision',
          'inherited-outline',
          'target-architecture',
          'archetypes',
          'control-posture',
          'evidence-gaps',
          'open-decisions',
        ]) {
          expect(html).toContain(`<section class="slide" id="${anchor}"`);
        }
        // The deck carries real inline-SVG architecture diagrams.
        expect((html.match(/<svg/g) ?? []).length).toBeGreaterThanOrEqual(2);
      });

      it('is deterministic — same Move → same deck', () => {
        const a = renderMoveSolutionArchitectureHtml(move, GENERATED_ON);
        const b = renderMoveSolutionArchitectureHtml(move, GENERATED_ON);
        expect(a).toBe(b);
      });
    });
  }
});

describe('buildMoveSolutionArchitecture — a Move with no resolvable function', () => {
  it('returns the honest UNBOUND result, never a fabricated architecture', () => {
    const result = buildMoveSolutionArchitecture(UNBOUND_MOVE, GENERATED_ON);
    expect(result.bound).toBe(false);
    if (!result.bound) {
      expect(result.unboundReason.length).toBeGreaterThan(0);
      expect(result.moveLabel).toBe(UNBOUND_MOVE.name);
    }
  });

  it('the renderer renders the honest unbound deck — not an architecture', () => {
    const html = renderMoveSolutionArchitectureHtml(
      UNBOUND_MOVE,
      GENERATED_ON,
    );
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Honest unbound state');
    expect(html).toContain('No curated Domain Function Pack');
    // No fabricated architecture — the unbound deck states the gap and stops.
    expect(html).toContain('Not produced');
    // No target-architecture section slide is rendered.
    expect(html).not.toContain('id="target-architecture"');
  });
});

describe('buildMoveSolutionArchitecture — honesty discipline', () => {
  it('the inherited outline is the binding’s, not improvised', () => {
    // The deck section spine is the curated outline — for every vertical.
    for (const { move } of VERTICALS) {
      const arch = buildMoveSolutionArchitecture(
        move,
        GENERATED_ON,
      ) as MoveSolutionArchitecture;
      expect(arch.sections.inheritedOutline.outline.length).toBeGreaterThan(0);
    }
  });

  it('open-decision section names gate-blocking decisions for a thin Move', () => {
    // A thin Move seed-gaps; the seed-gap closure is a gate-blocking decision.
    const arch = buildMoveSolutionArchitecture(
      RETAIL_MOVE,
      GENERATED_ON,
    ) as MoveSolutionArchitecture;
    const decisions = arch.sections.openDecisions.decisions;
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.some((d) => d.blocksGate)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Foundation-aware rendering — a pack that carries `dispositionKind:
// 'foundation'` patterns (the population-health pack now spreads the five
// cross-cutting architecture patterns) renders them as ADOPTED foundation,
// never as ranked or rejected options.
// ─────────────────────────────────────────────────────────────────────────────

const POP_HEALTH_MOVE: MoveBusinessCaseInput = {
  industry_code: 'HEALTHCARE_IDN',
  name: 'Population-health & value-based-care command centre',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'population_health_value_based_care' },
  baseline_metrics: [],
};

describe('buildMoveSolutionArchitecture — foundation-aware partition', () => {
  const arch = buildMoveSolutionArchitecture(
    POP_HEALTH_MOVE,
    GENERATED_ON,
  ) as MoveSolutionArchitecture;

  it('binds the population-health pack', () => {
    expect(arch.bound).toBe(true);
  });

  it('separates the five adopted foundation patterns from the options', () => {
    const target = arch.sections.targetArchitecture;
    // The five cross-cutting patterns render as adopted foundation.
    expect(target.foundation.length).toBe(5);
    const foundationNames = target.foundation.map((f) => f.name);
    expect(foundationNames).toEqual(
      expect.arrayContaining([
        'Cloud landing zone & private data plane',
        'Metadata-driven (own-it) ingestion framework',
        'Medallion data products on the lakehouse',
        'Governed model serving & monitoring',
        'Unity Catalog governance & HITRUST/HIPAA control spine',
      ]),
    );
    // The option scorecard carries only the competing options — the
    // foundation patterns are NOT in `patterns`.
    const optionNames = target.patterns.map((p) => p.name);
    for (const fn of foundationNames) {
      expect(optionNames).not.toContain(fn);
    }
    // Exactly one option is the selected target.
    expect(target.patterns.filter((p) => p.selected)).toHaveLength(1);
    // Every foundation entry names a boundary + a human accountability point.
    for (const f of target.foundation) {
      expect(f.boundary.length).toBeGreaterThan(0);
      expect(f.humanAccountabilityPoint.length).toBeGreaterThan(0);
    }
  });

  it('never ranks or rejects a foundation pattern', () => {
    const target = arch.sections.targetArchitecture;
    const foundationNames = new Set(target.foundation.map((f) => f.name));
    // The target-pattern selection + rejection set draws only from options.
    expect(foundationNames.has(arch.targetPattern.name)).toBe(false);
    for (const r of arch.targetPattern.rejected) {
      expect(foundationNames.has(r.name)).toBe(false);
    }
    // The decision scorecard options exclude foundation patterns too.
    const scorecardNames = arch.sections.architectureDecision.options.map(
      (o) => o.name,
    );
    for (const fn of foundationNames) {
      expect(scorecardNames).not.toContain(fn);
    }
  });

  it('renders an Adopted platform foundation exhibit, foundation not rejected', () => {
    const html = renderMoveSolutionArchitectureHtml(
      POP_HEALTH_MOVE,
      GENERATED_ON,
    );
    expect(html).toContain('Adopted platform foundation');
    expect(html).toContain('Cloud landing zone &amp; private data plane');
    // The target-architecture slide renders the adopted-foundation treatment,
    // not the rejected treatment, for the foundation cards.
    const target = html.slice(html.indexOf('id="target-architecture"'));
    expect(target).toContain('pattern-foundation');
    expect(target).not.toContain('pattern-rejected');
  });
});
