import { describe, expect, it } from "@jest/globals";
import { computeRateCardDiff } from "../rate-card-diff";
import type { NewRateCardLineInput } from "../../rate-card-repository";
import type { PricingRateCardLineRow } from "../../types";

function currentLine(overrides: Partial<PricingRateCardLineRow>): PricingRateCardLineRow {
  return {
    id: "line-id",
    card_version_id: "card-1",
    role_or_band_ref: "ROL-037",
    level: "LVL-04",
    provider_ref: null,
    location_ref: null,
    rate_basis: "client_negotiated",
    unit: "hour",
    rate_value: 400,
    currency: "USD",
    valid_from: "2026-08-01",
    valid_to: null,
    tenant_key: "apex-retail",
    content_hash: "irrelevant",
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function incomingLine(overrides: Partial<NewRateCardLineInput>): NewRateCardLineInput {
  return {
    roleOrBandRef: "ROL-037",
    level: "LVL-04",
    rateBasis: "client_negotiated",
    unit: "hour",
    rateValue: 400,
    currency: "USD",
    validFrom: "2026-08-01",
    ...overrides,
  };
}

describe("computeRateCardDiff", () => {
  it("classifies a brand-new tenant upload entirely as added", () => {
    const diff = computeRateCardDiff([], [incomingLine({}), incomingLine({ roleOrBandRef: "ROL-038" })]);
    expect(diff.added).toHaveLength(2);
    expect(diff.changed).toEqual([]);
    expect(diff.unchanged).toEqual([]);
    expect(diff.removed).toEqual([]);
  });

  it("classifies an identical re-upload entirely as unchanged", () => {
    const diff = computeRateCardDiff([currentLine({})], [incomingLine({})]);
    expect(diff.unchanged).toHaveLength(1);
    expect(diff.added).toEqual([]);
    expect(diff.changed).toEqual([]);
    expect(diff.removed).toEqual([]);
  });

  it("classifies a rate_value change as changed, carrying before/after", () => {
    const diff = computeRateCardDiff([currentLine({})], [incomingLine({ rateValue: 450 })]);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].before.rateValue).toBe(400);
    expect(diff.changed[0].after.rateValue).toBe(450);
    expect(diff.unchanged).toEqual([]);
  });

  it("classifies a line present in current but absent from incoming as removed", () => {
    const diff = computeRateCardDiff([currentLine({}), currentLine({ role_or_band_ref: "ROL-038" })], [
      incomingLine({}),
    ]);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0].roleOrBandRef).toBe("ROL-038");
  });

  it("a currency change alone still counts as changed", () => {
    const diff = computeRateCardDiff([currentLine({})], [incomingLine({ currency: "EUR" })]);
    expect(diff.changed).toHaveLength(1);
  });
});
