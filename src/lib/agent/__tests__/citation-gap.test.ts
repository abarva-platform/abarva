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

  it("recognizes grounded-engine citation forms (no false 'no citations' banner)", () => {
    // answerGrounded form: "(cited <Source Name> …)"
    expect(
      hasAgentCitationMarkup(
        "IT systems in scope are committed (cited Application & Systems Inventory, 4 CIs).",
      ),
    ).toBe(true);
    // grounded-deliverable body form: "[source: <Source Name>]"
    expect(
      hasAgentCitationMarkup(
        "Data Architecture maturity sits at 2/5 [source: Engineering Delivery Baseline (DORA Metrics)].",
      ),
    ).toBe(true);
    // a substantive grounded answer must NOT get the citation-gap banner
    expect(
      shouldShowPlainTextCitationGap(
        "DORA baseline committed (cited Engineering Delivery Baseline (DORA Metrics)). Platform maturity is 3/5, implying AI leverage is highest where delivery is already automated.",
      ),
    ).toBe(false);
  });

  it("still shows the banner on a genuinely uncited gap response", () => {
    // A real evidence gap (no citation attached) keeps the governance banner.
    expect(hasAgentCitationMarkup("[MISSING EVIDENCE: it_systems_landscape]")).toBe(false);
    expect(
      shouldShowPlainTextCitationGap(
        "The IT systems landscape is not yet committed. Scope cannot be enumerated until the CMDB export is provided and committed.",
      ),
    ).toBe(true);
  });
});
