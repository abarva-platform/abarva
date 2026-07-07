/**
 * @jest-environment jsdom
 */
// meridian-vbc-bet-selection — the function-aware Intelligence bet-selection
// reference surface, verified against the experience spec §3 bar
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md).
//
// The tests prove the surface:
//   • resolves the Population-Health / VBC Function Pack as its frame;
//   • renders the Function Pack's AI use-case archetypes as ranked candidate
//     bets — every bet is one of the pack's archetypes, ranking is honest;
//   • leads with the headline answer — the answer element precedes the
//     ranked-bets list in document order (the §3 "answer renders first" bar);
//   • renders a seed gap honestly where Meridian lacks a gating input — a bet
//     resting on unseeded data is held for evidence, never a fabricated
//     confident bet (the §3 "honest by construction" bar).

import {
  buildMeridianVbcBetSelection,
  buildVbcBetSelection,
  MERIDIAN_FUNCTION_KEY,
  MERIDIAN_INDUSTRY_KEY,
} from "../meridian-vbc-bet-selection";
import { resolveFunctionPack } from "../function-pack-registry";

describe("buildMeridianVbcBetSelection — Function Pack binding", () => {
  it("binds the Population-Health / VBC Function Pack as the frame", () => {
    const pack = resolveFunctionPack(
      MERIDIAN_INDUSTRY_KEY,
      MERIDIAN_FUNCTION_KEY,
    );
    expect(pack).not.toBeNull();

    const selection = buildMeridianVbcBetSelection("Meridian Health");
    expect(selection).not.toBeNull();
    expect(selection!.functionLabel).toBe(pack!.functionLabel);
  });

  it("renders the Function Pack archetypes as the ranked candidate bets", () => {
    const pack = resolveFunctionPack(
      MERIDIAN_INDUSTRY_KEY,
      MERIDIAN_FUNCTION_KEY,
    )!;
    const selection = buildMeridianVbcBetSelection("Meridian Health")!;

    // Every candidate bet is one of the pack's AI use-case archetypes — the
    // bet set is INHERITED from the Function Pack, never improvised.
    const archetypeKeys = new Set(pack.aiUseCaseArchetypes.map((a) => a.key));
    expect(selection.bets.length).toBe(pack.aiUseCaseArchetypes.length);
    for (const bet of selection.bets) {
      expect(archetypeKeys.has(bet.key)).toBe(true);
      // Each bet carries the archetype's value mechanism and a funding read.
      expect(bet.valueMechanism.length).toBeGreaterThan(0);
      expect(["fund_first", "shape", "hold_for_evidence"]).toContain(bet.read);
    }

    // The ranking is a strict 1..N order — a real ranked list.
    const ranks = selection.bets.map((b) => b.rank);
    expect(ranks).toEqual(
      Array.from({ length: selection.bets.length }, (_, i) => i + 1),
    );
  });

  it("ranks the bet Meridian can fund now first — grounded, off-benchmark", () => {
    const selection = buildMeridianVbcBetSelection("Meridian Health")!;
    const top = selection.bets[0];
    // Meridian's audited RAF capture (58%) is off the function's 85–100% band;
    // the HCC/RAF coding-gap intelligence bet moves it. That measured, on-the-
    // table value makes it the fund-first bet.
    expect(top.key).toBe("hcc_coding_intelligence");
    expect(top.read).toBe("fund_first");
    expect(top.restsOnSeedGap).toBe(false);
  });

  it("holds the unseeded bets for evidence — honest coverage, not inflated", () => {
    const selection = buildMeridianVbcBetSelection("Meridian Health")!;
    // The contract-simulation and network-leakage bets move only metrics
    // Meridian has not seeded — they must be held for evidence, never funded
    // on a fabricated number, and never ranked first.
    const held = selection.bets.filter((b) => b.read === "hold_for_evidence");
    expect(held.length).toBeGreaterThan(0);
    for (const bet of held) {
      expect(bet.restsOnSeedGap).toBe(true);
      // A held bet is never the fund-first answer.
      expect(bet.rank).toBeGreaterThan(1);
      // Its gate is a named seed gap, not a confident claim.
      expect(bet.evidenceOrGate.toLowerCase()).toContain("seed gap");
      // Every metric a held bet moves lacks a Meridian baseline.
      expect(bet.movesMetrics.every((m) => !m.grounded)).toBe(true);
    }
    const heldKeys = held.map((b) => b.key);
    expect(heldKeys).toContain("contract_performance_simulation");

    // Coverage is honest: fewer bets are grounded than the function offers.
    expect(selection.groundedBetCount).toBeGreaterThan(0);
    expect(selection.groundedBetCount).toBeLessThan(selection.totalBetCount);
  });

  it("names the gates that would re-order the ranking", () => {
    const selection = buildMeridianVbcBetSelection("Meridian Health")!;
    expect(selection.gates.length).toBeGreaterThan(0);
    for (const gate of selection.gates) {
      expect(gate.title.length).toBeGreaterThan(0);
      expect(gate.description.length).toBeGreaterThan(0);
      expect(gate.whatItWouldMove.length).toBeGreaterThan(0);
    }
  });
});

describe("buildVbcBetSelection — generic over (industryKey, functionKey)", () => {
  it("produces a correct ranked bet selection for a RETAIL pack", () => {
    const pack = resolveFunctionPack("retail", "pricing_promotions")!;
    expect(pack).not.toBeNull();

    const selection = buildVbcBetSelection(
      "retail",
      "pricing_promotions",
      "Apex Retail",
    );
    expect(selection).not.toBeNull();

    // The frame is the retail pack — never Meridian's healthcare pack.
    expect(selection!.functionLabel).toBe(pack.functionLabel);
    expect(selection!.tenantName).toBe("Apex Retail");

    // Every candidate bet is one of the retail pack's AI use-case archetypes,
    // and the ranking is a strict 1..N order.
    const archetypeKeys = new Set(pack.aiUseCaseArchetypes.map((a) => a.key));
    expect(selection!.bets.length).toBe(pack.aiUseCaseArchetypes.length);
    for (const bet of selection!.bets) {
      expect(archetypeKeys.has(bet.key)).toBe(true);
      expect(bet.valueMechanism.length).toBeGreaterThan(0);
      expect(["fund_first", "shape", "hold_for_evidence"]).toContain(bet.read);
    }
    expect(selection!.bets.map((b) => b.rank)).toEqual(
      Array.from({ length: selection!.bets.length }, (_, i) => i + 1),
    );

    // Apex has no audited substrate for this pack — so the ranking is honest:
    // every bet is held for evidence, never fabricated as fundable, and the
    // copy names Apex (never Meridian) and the retail function.
    expect(selection!.groundedBetCount).toBe(0);
    for (const bet of selection!.bets) {
      expect(bet.read).toBe("hold_for_evidence");
      expect(bet.restsOnSeedGap).toBe(true);
    }
    expect(selection!.headline.honestyClause).toContain("Apex Retail");
    expect(selection!.headline.honestyClause).not.toContain("Meridian");
    expect(selection!.headline.honestyClause).not.toMatch(/RAF|MLR/);
    expect(selection!.gates.length).toBeGreaterThan(0);
    expect(selection!.isReferenceExample).toBe(false);
  });

  it("produces a correct ranked bet selection for a FINANCIAL-SERVICES pack", () => {
    const pack = resolveFunctionPack(
      "financial-services",
      "lending_credit_underwriting",
    )!;
    expect(pack).not.toBeNull();

    const selection = buildVbcBetSelection(
      "financial-services",
      "lending_credit_underwriting",
      "First Capital Financial",
    );
    expect(selection).not.toBeNull();

    expect(selection!.functionLabel).toBe(pack.functionLabel);
    expect(selection!.tenantName).toBe("First Capital Financial");

    const archetypeKeys = new Set(pack.aiUseCaseArchetypes.map((a) => a.key));
    expect(selection!.bets.length).toBe(pack.aiUseCaseArchetypes.length);
    for (const bet of selection!.bets) {
      expect(archetypeKeys.has(bet.key)).toBe(true);
    }
    expect(selection!.bets.map((b) => b.rank)).toEqual(
      Array.from({ length: selection!.bets.length }, (_, i) => i + 1),
    );

    // No financial-services substrate — every bet is honestly held for
    // evidence, and the copy is the tenant's, never Meridian's healthcare.
    expect(selection!.groundedBetCount).toBe(0);
    for (const bet of selection!.bets) {
      expect(bet.read).toBe("hold_for_evidence");
      expect(bet.evidenceOrGate.toLowerCase()).toContain("seed gap");
      expect(bet.evidenceOrGate).toContain("First Capital Financial");
    }
    expect(selection!.headline.question).toContain("First Capital Financial");
    expect(selection!.headline.question).not.toContain("Meridian");
  });

  it("orders the ungrounded retail bets by adoption maturity", () => {
    const pack = resolveFunctionPack("retail", "pricing_promotions")!;
    const selection = buildVbcBetSelection(
      "retail",
      "pricing_promotions",
      "Apex Retail",
    )!;

    // With no substrate, every score collapses to the adoption tie-breaker —
    // the ranked order must be non-increasing in adoption weight.
    const adoptionWeight: Record<string, number> = {
      mainstream: 3,
      emerging: 2,
      experimenting: 1,
      early: 0,
    };
    const byKey = new Map(pack.aiUseCaseArchetypes.map((a) => [a.key, a]));
    const weights = selection.bets.map(
      (b) => adoptionWeight[byKey.get(b.key)!.adoptionProfile],
    );
    for (let i = 1; i < weights.length; i += 1) {
      expect(weights[i]).toBeLessThanOrEqual(weights[i - 1]);
    }
  });

  it("the Meridian shim returns exactly what the old function did", () => {
    // The shim calls buildVbcBetSelection with the Meridian constants — its
    // result must be deep-equal to the generic builder on that binding.
    const viaShim = buildMeridianVbcBetSelection("Meridian Health");
    const viaGeneric = buildVbcBetSelection(
      MERIDIAN_INDUSTRY_KEY,
      MERIDIAN_FUNCTION_KEY,
      "Meridian Health",
    );
    expect(viaShim).toEqual(viaGeneric);

    // And it is still the grounded Meridian ranking — RAF-capture funds first.
    expect(viaShim).not.toBeNull();
    expect(viaShim!.bets[0].key).toBe("hcc_coding_intelligence");
    expect(viaShim!.bets[0].read).toBe("fund_first");
    expect(viaShim!.groundedBetCount).toBeGreaterThan(0);
    expect(viaShim!.groundedBetCount).toBeLessThan(viaShim!.totalBetCount);
    expect(viaShim!.isReferenceExample).toBe(false);
  });

  it("returns null honestly when no pack is catalogued for the binding", () => {
    // An industry/function pair with no curated pack — the builder must return
    // null, never a fabricated frame.
    expect(
      buildVbcBetSelection("retail", "no_such_function", "Apex Retail"),
    ).toBeNull();
    expect(
      buildVbcBetSelection(
        "financial-services",
        "not_a_real_function",
        "First Capital Financial",
      ),
    ).toBeNull();
  });
});
