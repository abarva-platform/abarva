import {
  isInputSettled,
  validateEstimateForRun,
  validateEstimateHeaderComplete,
  validateEstimateReadiness,
  type EstimateInputForGate,
} from "../validation-gate";

function input(overrides: Partial<EstimateInputForGate> = {}): EstimateInputForGate {
  return {
    inputKey: "integration_count",
    value: null,
    confirmedAt: null,
    overrideReason: null,
    confidence: null,
    ...overrides,
  };
}

describe("isInputSettled", () => {
  it("is settled when confirmedAt is set", () => {
    expect(isInputSettled(input({ confirmedAt: "2026-07-24T00:00:00Z", value: 3 }))).toBe(true);
  });

  it("is settled when explicitly marked unknown with an override reason AND a confidence tier", () => {
    expect(isInputSettled(input({ overrideReason: "Client could not provide a number yet", confidence: "low", value: 5 }))).toBe(true);
  });

  it("is NOT settled with only an override reason and no confidence tier", () => {
    expect(isInputSettled(input({ overrideReason: "unsure", confidence: null, value: 5 }))).toBe(false);
  });

  it("is NOT settled with only a confidence tier and no override reason", () => {
    expect(isInputSettled(input({ overrideReason: null, confidence: "low", value: 5 }))).toBe(false);
  });

  it("is NOT settled with neither confirmation nor override", () => {
    expect(isInputSettled(input({ value: 5 }))).toBe(false);
  });
});

describe("validateEstimateReadiness — blocking behavior", () => {
  it("blocks when a required key was never provided at all", () => {
    const result = validateEstimateReadiness(["integration_count"], []);
    expect(result.ready).toBe(false);
    expect(result.blockingReasons).toEqual([{ inputKey: "integration_count", reason: expect.stringContaining("has not been provided") }]);
  });

  it("blocks when a required key has no value", () => {
    const result = validateEstimateReadiness(["integration_count"], [input({ value: null })]);
    expect(result.ready).toBe(false);
    expect(result.blockingReasons[0].reason).toContain("no value recorded");
  });

  it("blocks when a required key has a value but is not settled", () => {
    const result = validateEstimateReadiness(["integration_count"], [input({ value: 4 })]);
    expect(result.ready).toBe(false);
    expect(result.blockingReasons[0].reason).toContain("not confirmed");
  });

  it("passes once EVERY required key is confirmed", () => {
    const result = validateEstimateReadiness(
      ["integration_count", "impacted_user_count"],
      [
        input({ inputKey: "integration_count", value: 4, confirmedAt: "2026-07-24T00:00:00Z" }),
        input({ inputKey: "impacted_user_count", value: 250, confirmedAt: "2026-07-24T00:00:00Z" }),
      ],
    );
    expect(result.ready).toBe(true);
    expect(result.blockingReasons).toEqual([]);
  });

  it("passes when a required key is explicitly marked unknown with an accepted range-policy widening instead of confirmed", () => {
    const result = validateEstimateReadiness(
      ["integration_count"],
      [input({ inputKey: "integration_count", value: 4, overrideReason: "Vendor discovery not complete yet — planning estimate only", confidence: "low" })],
    );
    expect(result.ready).toBe(true);
  });

  it("collects one blocking reason PER missing key, not a single generic message", () => {
    const result = validateEstimateReadiness(["a", "b", "c"], [input({ inputKey: "a", value: 1, confirmedAt: "now" })]);
    expect(result.blockingReasons.map((r) => r.inputKey)).toEqual(["b", "c"]);
  });

  it("requiredInputKeys echoes exactly what was checked", () => {
    const result = validateEstimateReadiness(["x", "y"], []);
    expect(result.requiredInputKeys).toEqual(["x", "y"]);
  });
});

describe("validateEstimateHeaderComplete", () => {
  it("blocks on every unset header field", () => {
    const blocking = validateEstimateHeaderComplete({
      currency: null,
      targetStartDate: null,
      targetDurationWeeks: null,
      selectedRateCardId: null,
    });
    expect(blocking).toHaveLength(4);
  });

  it("passes when every header field is set", () => {
    const blocking = validateEstimateHeaderComplete({
      currency: "USD",
      targetStartDate: "2026-09-01",
      targetDurationWeeks: 12,
      selectedRateCardId: "rate-card-id",
    });
    expect(blocking).toEqual([]);
  });
});

describe("validateEstimateForRun — the full gate", () => {
  const readyHeader = { currency: "USD", targetStartDate: "2026-09-01", targetDurationWeeks: 12, selectedRateCardId: "rc-1" };

  it("blocks when the header is incomplete even if every driver input is confirmed", () => {
    const result = validateEstimateForRun(
      { ...readyHeader, currency: null },
      ["integration_count"],
      [input({ value: 4, confirmedAt: "now" })],
    );
    expect(result.ready).toBe(false);
    expect(result.blockingReasons.some((r) => r.inputKey === "currency")).toBe(true);
  });

  it("blocks when the header is complete but a driver input is not settled", () => {
    const result = validateEstimateForRun(readyHeader, ["integration_count"], [input({ value: 4 })]);
    expect(result.ready).toBe(false);
  });

  it("passes once both the header AND every driver input are settled", () => {
    const result = validateEstimateForRun(readyHeader, ["integration_count"], [input({ value: 4, confirmedAt: "now" })]);
    expect(result.ready).toBe(true);
    expect(result.blockingReasons).toEqual([]);
  });
});
