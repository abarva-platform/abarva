// Workforce Economics — Move board-grade business-case binding (WE-3) tests.
//
// Proves the flag-gated, dormant-by-default WE-3 seam:
//   • flag ON (opts.workforceEconomicsEnabled) → the Costed Business-Case Pack
//     carries the estimate-twice: traditional cost present and positive, the
//     AI-native cost strictly lower, the delta internally consistent, and the
//     honesty block populated (planning ranges, conservative agent haircut);
//   • flag OFF (default opts) → the pack carries NO workforce field and is
//     deep-equal to the baseline pack (byte-identical generation).
//
// The estimate-twice is DERIVED from the kernel skeleton, so the traditional
// figure reconciles to the kernel investment — no parallel estimate path.

import {
  buildMoveCostedBusinessCasePack,
  type MoveCostedBusinessCasePack,
} from '../move-pack-model';
import { deriveWorkforceEstimateInput } from '../move-workforce-economics-binding';
import { buildMoveBusinessCase } from '../../../../move-business-case';
import type { MoveBusinessCaseInput } from '../../../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../../../function-identity';

const GENERATED_ON = '2026-06-21';

// A representative real-Move scope — binds a curated Function Pack so the kernel
// runs and produces a real effort skeleton (the WE-3 input substrate).
const RETAIL_MOVE: MoveBusinessCaseInput = {
  industry_code: 'RETAIL',
  name: 'Cut repeat transfers in the contact centre',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'customer_care' },
  baseline_metrics: [],
};

describe('Workforce Economics WE-3 binding — flag ON', () => {
  it('attaches the estimate-twice with traditional > AI-native and a consistent delta', () => {
    const pack = buildMoveCostedBusinessCasePack(RETAIL_MOVE, GENERATED_ON, {
      workforceEconomicsEnabled: true,
    }) as MoveCostedBusinessCasePack;

    expect(pack.bound).toBe(true);
    const we = pack.workforceEconomics;
    expect(we).toBeDefined();
    if (!we) return;

    // Traditional cost present and positive.
    expect(we.traditional.totalCost).toBeGreaterThan(0);
    // AI-native strictly cheaper.
    expect(we.aiNative.totalCost).toBeLessThan(we.traditional.totalCost);
    // ...and not slower (capacity model: agents add parallel capacity).
    expect(we.aiNative.durationMonths).toBeLessThanOrEqual(
      we.traditional.durationMonths,
    );

    // Delta internal consistency — savings ≈ traditional - ai_native. The
    // engine rounds the raw difference (Math.round(tradCost - aiCost)), which
    // can differ from the difference of the separately-rounded totals by $1.
    expect(
      Math.abs(
        we.delta.costSaving -
          (we.traditional.totalCost - we.aiNative.totalCost),
      ),
    ).toBeLessThanOrEqual(1);
    expect(we.delta.costSaving).toBeGreaterThan(0);
    expect(we.delta.costReductionPct).toBeGreaterThan(0);
    expect(we.delta.costReductionPct).toBeLessThanOrEqual(1);
    // Productivity gain > 1 — each remaining human delivers more.
    expect(we.delta.productivityGain).toBeGreaterThan(1);
    // Agent cost is subscription-priced, not at the human rate.
    expect(we.aiNative.agentCost).toBeGreaterThan(0);
    expect(we.aiNative.agentCost).toBeLessThan(we.aiNative.humanCost);

    // Honesty block populated — planning ranges, drivers, caveats.
    expect(we.assumptions.confidence).toBe('medium');
    expect(we.assumptions.drivers.length).toBeGreaterThan(0);
    expect(we.assumptions.caveats.length).toBeGreaterThan(0);
    expect(we.assumptions.agentCapacityRange.conservative).toBeLessThan(
      we.assumptions.agentCapacityRange.modelled,
    );
  });

  it('reconciles the TRADITIONAL cost to the kernel investment skeleton', () => {
    // The estimate-twice is derived from the kernel's own effort estimate, so
    // the traditional cost must reconcile to the kernel's total base cost (the
    // blended $/hr is back-derived from exactly that number). Allow rounding.
    const kernel = buildMoveBusinessCase(RETAIL_MOVE);
    expect(kernel.bound).toBe(true);
    expect(kernel.skeleton).toBeTruthy();
    const kernelTotal = kernel.skeleton!.effort.totalCost.point;

    const pack = buildMoveCostedBusinessCasePack(RETAIL_MOVE, GENERATED_ON, {
      workforceEconomicsEnabled: true,
    }) as MoveCostedBusinessCasePack;
    const we = pack.workforceEconomics!;
    // Within $1 of the kernel total (engine rounds to whole dollars).
    expect(Math.abs(we.traditional.totalCost - kernelTotal)).toBeLessThanOrEqual(
      1,
    );
  });

  it('is deterministic — same Move → same estimate-twice', () => {
    const a = buildMoveCostedBusinessCasePack(RETAIL_MOVE, GENERATED_ON, {
      workforceEconomicsEnabled: true,
    }) as MoveCostedBusinessCasePack;
    const b = buildMoveCostedBusinessCasePack(RETAIL_MOVE, GENERATED_ON, {
      workforceEconomicsEnabled: true,
    }) as MoveCostedBusinessCasePack;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('derives a structurally valid WorkforceEstimateInput from the skeleton', () => {
    const kernel = buildMoveBusinessCase(RETAIL_MOVE);
    const input = deriveWorkforceEstimateInput(
      kernel.skeleton!,
      RETAIL_MOVE.name ?? 'Move',
    );
    expect(input).not.toBeNull();
    if (!input) return;
    // WBS non-empty, every line finite & >= 0.
    expect(input.wbs.length).toBeGreaterThan(0);
    for (const line of input.wbs) {
      expect(Number.isFinite(line.effortHours)).toBe(true);
      expect(line.effortHours).toBeGreaterThanOrEqual(0);
    }
    // Team shapes: AI-native has fewer humans + at least one agent.
    expect(input.team.traditionalHumans).toBeGreaterThan(0);
    expect(input.team.aiNativeAgents).toBeGreaterThan(0);
    expect(input.team.aiNativeHumans).toBeLessThanOrEqual(
      input.team.traditionalHumans,
    );
  });
});

describe('Workforce Economics WE-3 binding — flag OFF is byte-identical', () => {
  it('omits the workforce field and is deep-equal to the baseline pack', () => {
    const baseline = buildMoveCostedBusinessCasePack(
      RETAIL_MOVE,
      GENERATED_ON,
    ) as MoveCostedBusinessCasePack;
    const explicitOff = buildMoveCostedBusinessCasePack(
      RETAIL_MOVE,
      GENERATED_ON,
      { workforceEconomicsEnabled: false },
    ) as MoveCostedBusinessCasePack;

    // No workforce field on either default/explicit-off path.
    expect(baseline.workforceEconomics).toBeUndefined();
    expect(explicitOff.workforceEconomics).toBeUndefined();
    // The key is genuinely absent, not present-but-undefined.
    expect('workforceEconomics' in baseline).toBe(false);
    // Default and explicit-off are identical.
    expect(JSON.stringify(baseline)).toBe(JSON.stringify(explicitOff));
  });

  it('flag-ON pack equals flag-OFF pack once the workforce field is removed', () => {
    const off = buildMoveCostedBusinessCasePack(
      RETAIL_MOVE,
      GENERATED_ON,
    ) as MoveCostedBusinessCasePack;
    const on = buildMoveCostedBusinessCasePack(RETAIL_MOVE, GENERATED_ON, {
      workforceEconomicsEnabled: true,
    }) as MoveCostedBusinessCasePack;

    // Strip the additive field from the ON pack — the rest must be identical to
    // the OFF pack (the flag is purely additive; it changes nothing else).
    const { workforceEconomics, ...onWithoutWe } = on;
    void workforceEconomics;
    expect(JSON.stringify(onWithoutWe)).toBe(JSON.stringify(off));
  });
});
