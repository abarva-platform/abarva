import { detectSourceAwareness, detectTowerAwareness } from "../source-tower-awareness";

describe("detectSourceAwareness", () => {
  it("flags vendor/commercial keywords and returns the Source workstream suggestion", () => {
    const result = detectSourceAwareness("How does this affect the vendor renewal and pricing?");
    expect(result.relevant).toBe(true);
    expect(result.matchedKeywords).toEqual(expect.arrayContaining(["vendor", "renewal", "pricing"]));
    expect(result.suggestion).toMatch(/Source workstream/);
  });

  it("returns not-relevant with no suggestion for unrelated text", () => {
    const result = detectSourceAwareness("What should I do next in this phase?");
    expect(result.relevant).toBe(false);
    expect(result.matchedKeywords).toEqual([]);
    expect(result.suggestion).toBeNull();
  });
});

describe("detectTowerAwareness", () => {
  it("flags value/metric keywords and returns the Tower metric-contract suggestion", () => {
    const result = detectTowerAwareness("What should Tower measure for adoption and ROI?");
    expect(result.relevant).toBe(true);
    expect(result.matchedKeywords).toEqual(expect.arrayContaining(["adoption", "roi"]));
    expect(result.suggestion).toMatch(/Tower metric contract/);
  });

  it("returns not-relevant with no suggestion for unrelated text", () => {
    const result = detectTowerAwareness("What evidence is missing?");
    expect(result.relevant).toBe(false);
    expect(result.suggestion).toBeNull();
  });
});
