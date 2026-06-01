import {
  hasAgentCitationMarkup,
  hasSubstantiveClaimText,
  shouldShowPlainTextCitationGap,
} from "../citation-gap";

describe("citation-gap", () => {
  it("identifies substantive uncited text", () => {
    expect(
      hasSubstantiveClaimText(
        "This is a concrete recommendation. It changes the next operating decision.",
      ),
    ).toBe(true);
    expect(shouldShowPlainTextCitationGap("Short operational reply.")).toBe(false);
    expect(
      shouldShowPlainTextCitationGap(
        "This is a concrete recommendation. It changes the next operating decision.",
      ),
    ).toBe(true);
  });

  it("recognizes agent citation markup", () => {
    expect(hasAgentCitationMarkup("[tenant-specific: CRM renewal data]")).toBe(true);
    expect(hasAgentCitationMarkup("{{cite:program:APX-CDP-2026}}")).toBe(true);
    expect(hasAgentCitationMarkup("[PAT-SRC-CAT-001: vendor clause pattern]")).toBe(true);
    expect(
      shouldShowPlainTextCitationGap(
        "This is a concrete recommendation. It changes the next operating decision. [tenant-specific: CRM renewal data]",
      ),
    ).toBe(false);
  });
});
