// scrubBuilderVocabulary removes ONLY how-it-was-generated vocabulary, and must
// leave legitimate domain / architecture terms (e.g. "data plane") untouched —
// which is why it exists apart from the full client-facing sanitizer.

import { scrubBuilderVocabulary } from "../client-facing-artifact-sanitize";

describe("scrubBuilderVocabulary", () => {
  it("rewrites the builder nouns and the generation self-reference", () => {
    const out = scrubBuilderVocabulary(
      "Produced by the Moves Expert Kernel from the bound Domain Function Pack. " +
        "The agent does not improvise the structure. See the Expert Kernel and " +
        "the Function Pack. From Apex's audited substrate.",
    );
    expect(out).not.toMatch(/Expert Kernel/);
    expect(out).not.toMatch(/Domain Function Pack/);
    expect(out).not.toMatch(/Function Pack/);
    expect(out).not.toMatch(/the agent does not improvise/i);
    expect(out).not.toMatch(/audited substrate/);
    expect(out).toContain("the structure is not improvised");
    expect(out).toContain("audited enterprise data");
  });

  it("leaves legitimate architecture and domain terms untouched", () => {
    // These are exactly the terms the FULL sanitizer over-rewrites; the narrow
    // builder scrub must not.
    const text =
      "Cloud landing zone & private data plane; the data plane spans regions. " +
      "Governance substrate note: the data substrate stays in-region.";
    expect(scrubBuilderVocabulary(text)).toBe(text);
  });

  it("keeps the honest unbound state readable", () => {
    expect(
      scrubBuilderVocabulary("No curated Domain Function Pack covers this Move"),
    ).toBe("No curated domain reference model covers this Move");
  });
});
