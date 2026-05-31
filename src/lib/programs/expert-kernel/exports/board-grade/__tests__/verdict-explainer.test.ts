// Verdict-explainer chip — unit tests.
//
// Covers `dominantVerdictCause` and `renderVerdictExplainerChip`:
//   • verdicts `fund` / `go` return `null` — no chip.
//   • every non-fund / non-go verdict returns a chip whose `chipText` traces
//     to a real kernel field (monetisation, critic blockers, net return,
//     baseline coverage, kill criteria).
//   • the explainer text never invents a reason — when no single dominant
//     cause exists, the chip is the honest catch-all pointing at the gaps.
//   • the rendered HTML carries the chip text and the severity-keyed label.
//
// Also covers integration with two representative renderers: a thin Move
// renders a chip; a complete Move (verdict = fund) does not.

import {
  dominantVerdictCause,
  renderVerdictExplainerChip,
  type VerdictExplainerChip,
} from '../verdict-explainer';
import type { BusinessCaseSkeleton } from '../../../business-case-compiler';
import type { FunctionPackBinding } from '../../../domain/function-pack-context-binding';
import type { CriticReport } from '../../../critic';

import { buildMoveCostedBusinessCasePack } from '../move-pack-model';
import { renderMoveCostedBusinessCaseHtml } from '../move-html-renderer';
import { buildMoveCharterSkeleton } from '../move-charter-skeleton-model';
import { renderMoveCharterSkeletonHtml } from '../move-charter-skeleton-renderer';
import type { MoveBusinessCaseInput } from '../../../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../../../function-identity';

const GENERATED_ON = '2026-05-23';

// ─────────────────────────────────────────────────────────────────────────────
// Minimal skeleton + binding builders — the resolver only reads a few fields,
// so a hand-rolled skeleton is the cleanest way to test each branch in
// isolation.
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_BINDING: FunctionPackBinding = {
  bound: true,
  functionLabel: 'Test function',
  artifactLabel: 'Test artifact',
  phase: 'discover',
  deliverableOutline: [],
  expectedMetrics: [],
  seedGaps: [],
  fallbackNote: '',
};

interface SkeletonOverrides {
  recommendation?: 'fund' | 'shape' | 'kill';
  monetisable?: boolean;
  netReturnPoint?: number;
  netReturnLow?: number;
  blockers?: Array<{ message: string; code?: string }>;
  concerns?: Array<{ message: string; code?: string }>;
  seedGaps?: Array<{ key: string; label: string }>;
  coverage?: number;
  killCriteria?: Array<{ code: string; condition: string }>;
}

function makeSkeleton(overrides: SkeletonOverrides = {}): BusinessCaseSkeleton {
  const blockers = (overrides.blockers ?? []).map((b, i) => ({
    lens: 'cfo' as const,
    severity: 'blocker' as const,
    code: b.code ?? `blocker_${i}`,
    message: b.message,
  }));
  const concerns = (overrides.concerns ?? []).map((c, i) => ({
    lens: 'cfo' as const,
    severity: 'concern' as const,
    code: c.code ?? `concern_${i}`,
    message: c.message,
  }));
  const critic: CriticReport = {
    findings: [...blockers, ...concerns],
    blockers,
    concerns,
    notes: [],
    hasBlocker: blockers.length > 0,
  };
  const seedGapMetrics = (overrides.seedGaps ?? []).map((g) => ({
    key: g.key,
    label: g.label,
    value: null,
    unit: 'unit',
    source: 'seed gap',
    sourceQuality: 'absent' as const,
    asOf: 'not-recorded',
    confidence: 'low' as const,
    seedGapReason: `Gap on ${g.label}`,
    recorded: false,
  }));
  return {
    moveName: 'Test Move',
    tenantKey: 'test-tenant',
    baseline: {
      moveName: 'Test Move',
      tenantKey: 'test-tenant',
      metrics: seedGapMetrics,
      recordedMetrics: [],
      seedGaps: seedGapMetrics,
      coverage: overrides.coverage ?? (seedGapMetrics.length > 0 ? 0.2 : 1),
      weakestConfidence: null,
    },
    valueRange: { low: 0, point: 0, high: 0 },
    effortRange: { low: 1, point: 1, high: 1 },
    aiOpsCost: null,
    effort: {
      moveName: 'Test Move',
      workstreams: [],
      totalCost: { low: 1, point: 1, high: 1 },
      totalHumanCost: 1,
      totalAgentCost: 0,
      effectiveAgentSplit: 0,
      buildVsChange: {
        aiBuildCost: 1,
        businessChangeCost: 0,
        businessChangeFraction: 0,
        aiOpsCost: 0,
        note: '',
      },
      aiOpsCost: null,
      rateCard: {
        provenance: 'researched_benchmark',
        label: 'test',
        rates: [],
      },
    },
    assumptions: {
      assumptions: [],
      byImpact: [],
      topMovers: [],
      seedGapProxies: [],
    },
    sensitivity: {
      base: { low: 0, point: 0, high: 0 },
      conservative: { low: 0, point: 0, high: 0 },
      upside: { low: 0, point: 0, high: 0 },
      whatBreaksTheCase: '',
      topMovers: [],
    },
    killCriteria: overrides.killCriteria ?? [],
    recommendation: overrides.recommendation ?? 'shape',
    recommendationRationale: 'test',
    towerHandoff: [],
    economics: {
      investment: { low: 1, point: 1, high: 1 },
      netReturn: {
        low: overrides.netReturnLow ?? 1,
        point: overrides.netReturnPoint ?? 1,
        high: 1,
      },
      paybackMonths: null,
      monetisable: overrides.monetisable ?? true,
    },
    critic,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// `dominantVerdictCause` — unit branches.
// ─────────────────────────────────────────────────────────────────────────────

describe('dominantVerdictCause', () => {
  it('returns null for a `fund` verdict — no chip needed', () => {
    const skel = makeSkeleton({ recommendation: 'fund' });
    expect(dominantVerdictCause(skel, EMPTY_BINDING)).toBeNull();
  });

  it('returns null for a `go` verdict via the Mobilize override — no chip needed', () => {
    const skel = makeSkeleton({ recommendation: 'fund' });
    expect(dominantVerdictCause(skel, EMPTY_BINDING, 'go')).toBeNull();
  });

  it('surfaces "seed gap blocks monetisation" when the kernel blocks monetisation', () => {
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: false,
    });
    const chip = dominantVerdictCause(skel, EMPTY_BINDING);
    expect(chip).not.toBeNull();
    expect(chip?.severity).toBe('shape');
    expect(chip?.chipText).toMatch(/seed gap blocks monetisation/i);
    expect(chip?.chipText).toMatch(/planning-range proxy/i);
  });

  it('quotes the kernel critic blocker when monetisation is OK but a blocker exists', () => {
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: true,
      blockers: [{ message: 'Delivery cannot be staffed in time' }],
    });
    const chip = dominantVerdictCause(skel, EMPTY_BINDING);
    expect(chip?.chipText).toMatch(/critic blocker/i);
    expect(chip?.chipText).toContain('Delivery cannot be staffed in time');
  });

  it('reports "base-case net return is not positive" for a kill on negative payback', () => {
    const skel = makeSkeleton({
      recommendation: 'kill',
      monetisable: true,
      netReturnPoint: -1,
    });
    const chip = dominantVerdictCause(skel, EMPTY_BINDING);
    expect(chip?.severity).toBe('kill');
    expect(chip?.chipText).toMatch(/base-case net return is not positive/i);
  });

  it('reports baseline coverage insufficient when seed gaps are open', () => {
    const binding: FunctionPackBinding = {
      ...EMPTY_BINDING,
      seedGaps: [
        {
          metricKey: 'aht_minutes',
          metricName: 'Average Handle Time',
          definition: 'AHT in minutes',
          expectedDataSource: 'NICE CXone',
          gapStatement: 'AHT is not recorded.',
        },
      ],
    };
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: true,
      seedGaps: [{ key: 'aht_minutes', label: 'Average Handle Time' }],
      coverage: 0.2,
    });
    const chip = dominantVerdictCause(skel, binding);
    expect(chip?.chipText).toMatch(/baseline coverage insufficient/i);
    expect(chip?.chipText).toContain('20%');
    expect(chip?.chipText).toContain('Average Handle Time');
  });

  it('reports downside negative when net return low is below zero', () => {
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: true,
      netReturnPoint: 5,
      netReturnLow: -2,
    });
    const chip = dominantVerdictCause(skel, EMPTY_BINDING);
    expect(chip?.chipText).toMatch(/downside net return is negative/i);
  });

  it('reports critic-concern count when there are 3 or more concerns', () => {
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: true,
      netReturnLow: 0,
      concerns: [
        { message: 'a' },
        { message: 'b' },
        { message: 'c' },
        { message: 'd' },
      ],
    });
    const chip = dominantVerdictCause(skel, EMPTY_BINDING);
    expect(chip?.chipText).toMatch(/4 concerns/i);
  });

  it('names the kill criterion when one exists and no earlier cause fired', () => {
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: true,
      netReturnLow: 0,
      killCriteria: [
        { code: 'kill_x', condition: 'The downside cannot be lifted above zero.' },
      ],
    });
    const chip = dominantVerdictCause(skel, EMPTY_BINDING);
    expect(chip?.chipText).toMatch(/kill criterion/i);
    expect(chip?.chipText).toContain('The downside cannot be lifted above zero.');
  });

  it('falls back to the honest catch-all when no single cause exists', () => {
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: true,
      netReturnPoint: 5,
      netReturnLow: 0,
    });
    const chip = dominantVerdictCause(skel, EMPTY_BINDING);
    expect(chip?.chipText).toMatch(/multiple blockers \(see Evidence & Gaps section\)/i);
  });

  it('maps Mobilize `no_go` → severity `no-go`', () => {
    const skel = makeSkeleton({
      recommendation: 'kill',
      monetisable: false,
    });
    const chip = dominantVerdictCause(skel, EMPTY_BINDING, 'no_go');
    expect(chip?.severity).toBe('no-go');
  });

  it('maps Mobilize `conditional_go` → severity `hold`', () => {
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: false,
    });
    const chip = dominantVerdictCause(skel, EMPTY_BINDING, 'conditional_go');
    expect(chip?.severity).toBe('hold');
  });

  it('maps Solution Architecture `hold` and `conditional` correctly', () => {
    const skel = makeSkeleton({
      recommendation: 'kill',
      monetisable: false,
    });
    expect(
      dominantVerdictCause(skel, EMPTY_BINDING, 'hold')?.severity,
    ).toBe('hold');
    const skelShape = makeSkeleton({
      recommendation: 'shape',
      monetisable: false,
    });
    expect(
      dominantVerdictCause(skelShape, EMPTY_BINDING, 'conditional')?.severity,
    ).toBe('shape');
  });

  it('maps Discover Brief `reshape` and `no-go` correctly', () => {
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: false,
    });
    expect(
      dominantVerdictCause(skel, EMPTY_BINDING, 'reshape')?.severity,
    ).toBe('shape');
    const skelKill = makeSkeleton({
      recommendation: 'kill',
      monetisable: false,
    });
    expect(
      dominantVerdictCause(skelKill, EMPTY_BINDING, 'no-go')?.severity,
    ).toBe('no-go');
  });

  it('is deterministic — same inputs → same chip', () => {
    const skel = makeSkeleton({
      recommendation: 'shape',
      monetisable: false,
    });
    const a = dominantVerdictCause(skel, EMPTY_BINDING);
    const b = dominantVerdictCause(skel, EMPTY_BINDING);
    expect(a).toEqual(b);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// `renderVerdictExplainerChip` — HTML rendering.
// ─────────────────────────────────────────────────────────────────────────────

describe('renderVerdictExplainerChip', () => {
  it('returns an empty string when the chip is null', () => {
    expect(renderVerdictExplainerChip(null)).toBe('');
  });

  it('emits a kill-toned chip with the severity label and chip text', () => {
    const chip: VerdictExplainerChip = {
      chipText: 'Base-case net return is not positive.',
      severity: 'kill',
    };
    const html = renderVerdictExplainerChip(chip);
    expect(html).toContain('verdict-explainer-chip');
    expect(html).toContain('Why kill?');
    expect(html).toContain('Base-case net return is not positive.');
  });

  it('emits the customer-facing "no-go" label when severity is no-go', () => {
    const chip: VerdictExplainerChip = {
      chipText: 'Monetisation blocked.',
      severity: 'no-go',
    };
    expect(renderVerdictExplainerChip(chip)).toContain('Why no-go?');
  });

  it('escapes HTML in the chip text', () => {
    const chip: VerdictExplainerChip = {
      chipText: 'Issue <script>alert(1)</script>',
      severity: 'shape',
    };
    const html = renderVerdictExplainerChip(chip);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Renderer integration — a thin Move surfaces the chip; a clean Move does not.
// ─────────────────────────────────────────────────────────────────────────────

// A thin Move: zero recorded baseline metrics → monetisation is blocked → the
// kernel verdict is non-`fund` → the chip MUST render.
const THIN_MOVE: MoveBusinessCaseInput = {
  industry_code: 'RETAIL',
  name: 'Cut repeat transfers in the contact centre',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'customer_care' },
  baseline_metrics: [],
};

describe('Costed Business-Case renderer — chip integration', () => {
  it('a thin Move produces the chip on the pack model', () => {
    const pack = buildMoveCostedBusinessCasePack(THIN_MOVE, GENERATED_ON);
    expect(pack.bound).toBe(true);
    if (pack.bound) {
      expect(pack.verdictExplainerChip).not.toBeNull();
      // The chip text traces to the kernel — monetisation blocked is the
      // dominant cause for a no-metrics fixture.
      expect(pack.verdictExplainerChip?.chipText).toMatch(
        /seed gap blocks monetisation/i,
      );
    }
  });

  it('a thin Move\'s rendered HTML carries the chip text', () => {
    const html = renderMoveCostedBusinessCaseHtml(THIN_MOVE, GENERATED_ON);
    expect(html).toContain('verdict-explainer-chip');
    expect(html).toMatch(/seed gap blocks monetisation/i);
    expect(html).toMatch(/Why (kill|shape)\?/);
  });
});

describe('Charter Skeleton renderer — chip integration', () => {
  it('a thin Move produces the chip on the charter pack model', () => {
    const charter = buildMoveCharterSkeleton(THIN_MOVE, GENERATED_ON);
    expect(charter.bound).toBe(true);
    if (charter.bound) {
      expect(charter.verdictExplainerChip).not.toBeNull();
      expect(charter.verdictExplainerChip?.chipText).toMatch(
        /seed gap blocks monetisation/i,
      );
    }
  });

  it('a thin Move\'s rendered Charter HTML carries the chip text', () => {
    const html = renderMoveCharterSkeletonHtml(THIN_MOVE, GENERATED_ON);
    expect(html).toContain('verdict-explainer-chip');
    expect(html).toMatch(/seed gap blocks monetisation/i);
  });
});

// A "complete" Move would set monetisable=true and produce a `fund` verdict.
// We exercise that path through a synthetic skeleton because no curated pack
// fixture currently yields a complete-data `fund` verdict from a real Move.
describe('Chip absent when the verdict clears', () => {
  it('a synthetic `fund` skeleton produces no chip', () => {
    const skel = makeSkeleton({ recommendation: 'fund', monetisable: true });
    expect(dominantVerdictCause(skel, EMPTY_BINDING)).toBeNull();
  });
});
