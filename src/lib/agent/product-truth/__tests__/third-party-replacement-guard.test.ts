import { checkThirdPartyReplacementClaims } from "../third-party-replacement-guard";

describe("checkThirdPartyReplacementClaims", () => {
  it.each([
    "AbarVa replaces Gartner for this kind of research.",
    "This report is equivalent to what Forrester would produce.",
    "You no longer need McKinsey once you have AbarVa.",
    "AbarVa outperforms the Big Four on this analysis.",
    "Our platform certifies against Deloitte's framework.",
  ])("flags a replacement/certification claim against a named third party: %s", (text) => {
    const violations = checkThirdPartyReplacementClaims(text);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].category).toBe("third_party_replacement_claim");
  });

  it("does not flag a bare, non-replacement mention of a named third party", () => {
    const violations = checkThirdPartyReplacementClaims(
      "Gartner's research on this topic is publicly available if you want the external view.",
    );
    expect(violations).toEqual([]);
  });

  it("does not flag text with no named third party at all", () => {
    const violations = checkThirdPartyReplacementClaims(
      "This Move replaces the manual review process with a structured workflow.",
    );
    expect(violations).toEqual([]);
  });
});
