import { validateNarrative } from "../../scripts/data-build/build-home-orientation-pack";

/**
 * The validation gate is the only thing standing between a generated sentence and a client's screen.
 *
 * Everything else in the orientation pack is deterministic and inspectable. This one component
 * decides whether prose a language model produced gets stored as an assertion about a real
 * organisation, so it is tested against the ways that goes wrong rather than the ways it goes right:
 * a number nobody computed, a vendor nobody supplied, a recommendation nobody asked for.
 *
 * It is intentionally biased toward rejection. A false rejection costs a block that shows its facts
 * without a sentence around them. A false acceptance costs a fabricated figure in front of a client,
 * carrying the authority of their own data.
 */

const AGGREGATE = {
  heading: "What is actually run",
  facts: [
    { label: "Applications", value: "503" },
    { label: "Technology budget", value: "$3.42B", detail: "4.20% of revenue" },
    { label: "Third-party contracted", value: "$2.05B", detail: "60% of technology spend" },
  ],
};
const ENTITIES = ["Amadeus Altéa Reservations", "SITA"];

describe("orientation pack narrative validation", () => {
  it("accepts prose whose every figure appears in the aggregate", () => {
    const result = validateNarrative(
      "This organisation runs 503 applications against a technology budget of $3.42B. Of that, $2.05B is contracted to third parties.",
      AGGREGATE,
      ENTITIES,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a number the model computed rather than quoted", () => {
    // 503 and $3.42B are both present; $6.8M per application is arithmetic the model performed.
    const result = validateNarrative(
      "This organisation runs 503 applications, averaging $6.8M per application.",
      AGGREGATE,
      ENTITIES,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("number not in aggregate");
  });

  it("rejects a percentage that was not supplied", () => {
    const result = validateNarrative(
      "Third-party spend accounts for 73% of the technology budget.",
      AGGREGATE,
      ENTITIES,
    );
    expect(result.ok).toBe(false);
  });

  it("accepts a percentage that was supplied, written as a percentage", () => {
    const result = validateNarrative(
      "Technology spend is 4.20% of revenue.",
      AGGREGATE,
      ENTITIES,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects an entity the client never supplied", () => {
    // The failure that matters most: a real vendor, plausibly placed, that this client does not use.
    const result = validateNarrative(
      "The estate includes systems from Oracle Corporation alongside 503 applications.",
      AGGREGATE,
      ENTITIES,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("entity not in aggregate");
  });

  it("accepts an entity that was supplied", () => {
    const result = validateNarrative(
      "SITA is among the named suppliers.",
      { ...AGGREGATE, named: ENTITIES },
      ENTITIES,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects recommendation and causation", () => {
    for (const text of [
      "The organisation should consolidate its 503 applications.",
      "This concentration indicates that resilience is at risk.",
      "The estate is likely to grow.",
    ]) {
      expect(validateNarrative(text, AGGREGATE, ENTITIES).ok).toBe(false);
    }
  });

  it("does not trip over sentence-initial ordinary words", () => {
    // "Across", "Only", "Nearly" open sentences and look like proper nouns to a naive matcher.
    const result = validateNarrative(
      "Across the estate, 503 applications are recorded. Only $2.05B of that is contracted externally.",
      AGGREGATE,
      ENTITIES,
    );
    expect(result.ok).toBe(true);
  });

  it("allows small ordinals and years without evidence", () => {
    const result = validateNarrative(
      "All 3 of these categories are recorded, with 503 applications in total.",
      AGGREGATE,
      ENTITIES,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a large number even when it looks like a plausible count", () => {
    const result = validateNarrative(
      "There are 512 applications recorded.",
      AGGREGATE,
      ENTITIES,
    );
    expect(result.ok).toBe(false);
  });
});
