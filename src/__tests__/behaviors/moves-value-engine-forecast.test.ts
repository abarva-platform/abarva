import { valueForecastFromEngine } from "@/lib/programs/value-engine/kernel-adapter";
import type { ValueCaseResult } from "@/lib/programs/value-engine/types";

const annualCash = { low: 96_000, base: 120_000, high: 144_000 };
const monthlyCash = {
  low: Array(24).fill(8_000) as number[],
  base: Array(24).fill(10_000) as number[],
  high: Array(24).fill(12_000) as number[],
};

const evaluated: ValueCaseResult = {
  status: "evaluated",
  readyForApproval: true,
  horizonYears: 2,
  levers: [],
  economics: {
    annualCashCents: annualCash,
    annualCashTerms: { low: [], base: [], high: [] },
    riskAvoidedAnnualCents: { low: 0, base: 0, high: 0 },
    monthlyCashCents: monthlyCash,
    threeYearBases: null,
    costCents: { low: 20_000, base: 20_000, high: 20_000 },
    discountRate: 0.08,
    npvCents: { low: 0, base: 0, high: 0 },
    npvTerms: { low: [], base: [], high: [] },
    paybackMonth: { low: 3, base: 2, high: 2 },
  },
  breakeven: [],
  sensitivity: [],
  caseInputIssues: [],
  caseRuleViolations: [],
  mustValidate: [],
};

const haircutScores = {
  adoptionRisk: 0.5,
  dataReadiness: 0.5,
  processDependency: 0.5,
  integrationComplexity: 0.5,
  controlBurden: 0.5,
  sponsorStrength: 0.5,
};

describe("Moves engine cash in the business-case forecast", () => {
  it("keeps counted cash intact and reports the kernel haircut only as a cross-check", () => {
    const forecast = valueForecastFromEngine(evaluated, {
      moveName: "Fictional move",
      haircutScores,
    });

    expect(forecast.source).toBe("value_engine");
    expect(forecast.curve.map((year) => year.netValue.point)).toEqual([1_200, 1_200]);
    expect(forecast.curve.map((year) => year.grossValue)).toEqual(
      forecast.curve.map((year) => year.netValue),
    );
    expect(forecast.totalNetValue).toEqual({ low: 1_920, point: 2_400, high: 2_880 });
    expect(forecast.totalGrossValue).toEqual(forecast.totalNetValue);
    expect(forecast.totalHaircut).toBe(0);
    expect(forecast.retainedFraction).toBe(1);
    expect(forecast.factors).toEqual([]);
    expect(forecast.kernelCrossCheck?.applied).toBe(false);
    expect(forecast.kernelCrossCheck?.netIfApplied.point).toBeLessThan(2_400);
    expect(forecast.monetisationBlocked).toBe(false);
  });

  it("keeps an unresolved engine case out of monetisation", () => {
    const forecast = valueForecastFromEngine(
      { ...evaluated, status: "blocked", readyForApproval: false, economics: null },
      { moveName: "Fictional move", haircutScores },
    );

    expect(forecast.monetisationBlocked).toBe(true);
    expect(forecast.curve.map((year) => year.netValue.point)).toEqual([0, 0]);
    expect(forecast.totalNetValue.point).toBe(0);
    expect(forecast.kernelCrossCheck).toBeNull();
  });
});
