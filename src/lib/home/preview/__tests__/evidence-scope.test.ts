import { hasUnsupportedHomeEvidenceScope } from "../evidence-scope";

const portfolio =
  "Only 24% of promised AI portfolio value is finance-validated.";
const enterprise =
  "Only 24% of promised AI value is finance-validated enterprise-wide.";
const qualified =
  "The published value summary in this Home record does not establish independently accepted financial outcomes or value across the whole enterprise.";

describe("qualified scope denials", () => {
  it.each([
    qualified,
    "This Home record cannot establish independently accepted financial outcomes or value across the whole enterprise.",
    "This Home record can't establish independently accepted financial outcomes or value across the whole enterprise.",
    "This Home record does not yet establish independently accepted financial outcomes or value across the whole enterprise.",
    "Enterprise-wide benefit validation is not established in this Home record.",
    "AI-portfolio benefit validation is not enterprise-wide benefit validation.",
    "AI portfolio validation does not establish enterprise-wide benefit validation.",
    "No evidence establishes independently accepted outcomes or value across the whole enterprise.",
    "The record supports portfolio validation rather than enterprise-wide validation.",
    "This Home record does not establish that no transformation program exists anywhere in the enterprise.",
  ])("preserves the qualification: %s", (passage) => {
    expect(hasUnsupportedHomeEvidenceScope([passage], [portfolio])).toBe(false);
  });

  it("checks every supplied passage independently", () => {
    expect(
      hasUnsupportedHomeEvidenceScope([qualified, enterprise], [portfolio]),
    ).toBe(true);
    expect(
      hasUnsupportedHomeEvidenceScope([enterprise, qualified], [portfolio]),
    ).toBe(true);
  });

  it("preserves coordinated negative objects without splitting their governing predicate", () => {
    expect(
      hasUnsupportedHomeEvidenceScope(
        [
          "This Home record does not establish accepted financial outcomes and value across the whole enterprise.",
        ],
        [portfolio],
      ),
    ).toBe(false);
  });
});

describe("bounded gaps and universal absence", () => {
  it.each([
    "No resolution-rate baseline exists in this Home record.",
    "No program evidence is available in the supplied context.",
    "Program evidence is absent from the current record.",
    "No evidence of enterprise-wide programs is available in this Home record.",
  ])("allows a record-scoped gap: %s", (passage) => {
    expect(hasUnsupportedHomeEvidenceScope([passage], [portfolio])).toBe(false);
  });

  it.each([
    "No member service transformation program, baseline or Agent Assist evidence exists yet.",
    "No service transformation program or resolution-rate baseline exists in current tracking.",
    "The service transformation program does not exist.",
    "Service transformation programs are absent from current tracking.",
    "No baseline evidence is available yet.",
    "No transformation program exists anywhere in the enterprise, according to this Home record.",
    "No program evidence is available in this Home record, so no program exists anywhere in the enterprise.",
    "This Home record describes AI portfolio value, but no transformation program exists.",
    "This Home record describes AI portfolio value and no transformation program exists.",
    "No transformation program exists, according to this Home record.",
    "No program evidence is available across the whole enterprise in this Home record.",
  ])("blocks asserted absence beyond the record: %s", (passage) => {
    expect(hasUnsupportedHomeEvidenceScope([passage], [portfolio])).toBe(true);
  });

  it("guards absence even without citations", () => {
    expect(
      hasUnsupportedHomeEvidenceScope(["No service program exists."], []),
    ).toBe(true);
  });
});

describe("independent enterprise assertions", () => {
  it.each([
    "Not merely portfolio value, AI benefits are finance-validated enterprise-wide.",
    "There is no doubt that AI value is finance-validated enterprise-wide.",
    "AI value is not only finance-validated enterprise-wide but also accepted.",
    "This Home record does not establish enterprise-wide value, but AI benefits are finance-validated enterprise-wide.",
    "This Home record does not establish enterprise-wide value; AI benefits are finance-validated enterprise-wide.",
    "This Home record does not establish enterprise-wide value and AI benefits are finance-validated enterprise-wide.",
    "This Home record does not establish enterprise-wide value and does establish AI benefits enterprise-wide.",
    "This Home record does not establish enterprise-wide value, yet AI benefits are finance-validated enterprise-wide.",
    "This Home record does not establish enterprise-wide value. AI benefits are finance-validated enterprise-wide.",
    "This Home record does not establish enterprise-wide value\nAI benefits are finance-validated enterprise-wide.",
  ])("a neighboring qualification cannot exempt: %s", (passage) => {
    expect(hasUnsupportedHomeEvidenceScope([passage], [portfolio])).toBe(true);
  });
});

describe("portfolio and enterprise validation support", () => {
  it("retains the cited portfolio population", () => {
    expect(hasUnsupportedHomeEvidenceScope([portfolio], [portfolio])).toBe(
      false,
    );
  });

  it("requires enterprise support for an enterprise assertion", () => {
    expect(hasUnsupportedHomeEvidenceScope([enterprise], [portfolio])).toBe(
      true,
    );
    expect(
      hasUnsupportedHomeEvidenceScope([enterprise], [portfolio, enterprise]),
    ).toBe(false);
    expect(hasUnsupportedHomeEvidenceScope([enterprise], [enterprise])).toBe(
      false,
    );
  });

  it.each([
    "Enterprise-wide value governance needs review.",
    "Only 24% of promised program value is finance-validated enterprise-wide.",
    "Only 25% of promised AI value is finance-validated enterprise-wide.",
    "AI portfolio validation does not establish enterprise-wide benefit validation.",
    "The published value summary in this Home record does not establish that only 24% of promised AI value is finance-validated enterprise-wide.",
    "This Home record cannot establish that only 24% of promised AI value is finance-validated enterprise-wide.",
    "Only 24% of promised AI value is not finance-validated enterprise-wide.",
    "Enterprise-wide AI value validation is not established in this Home record; 24% of portfolio value is finance-validated.",
    "Only 24% of AI portfolio value is finance-validated; enterprise-wide value governance needs review.",
  ])("does not authorize an enterprise assertion with: %s", (source) => {
    expect(
      hasUnsupportedHomeEvidenceScope([enterprise], [portfolio, source]),
    ).toBe(true);
  });

  it("admits an independent affirmative enterprise source after a qualified denial", () => {
    expect(
      hasUnsupportedHomeEvidenceScope(
        [enterprise],
        [portfolio, `${qualified} ${enterprise}`],
      ),
    ).toBe(false);
  });

  it("normalizes percent spelling without changing the share", () => {
    expect(
      hasUnsupportedHomeEvidenceScope(
        [enterprise],
        [
          portfolio,
          "Only 24 percent of promised AI value is finance-validated enterprise-wide.",
        ],
      ),
    ).toBe(false);
  });

  it("retains decimal shares through sentence and clause splitting", () => {
    const decimalPortfolio = portfolio.replace("24%", "24.5%");
    const decimalEnterprise = enterprise.replace("24%", "24.5%");
    expect(
      hasUnsupportedHomeEvidenceScope(
        [decimalEnterprise],
        [decimalPortfolio, decimalEnterprise],
      ),
    ).toBe(false);
    expect(
      hasUnsupportedHomeEvidenceScope(
        [decimalEnterprise],
        [decimalPortfolio, enterprise],
      ),
    ).toBe(true);
    expect(
      hasUnsupportedHomeEvidenceScope(
        [decimalEnterprise.replace("24.5%", "24.6%")],
        [decimalPortfolio, decimalEnterprise],
      ),
    ).toBe(true);
  });

  it("requires support for every share in the assertion", () => {
    expect(
      hasUnsupportedHomeEvidenceScope(
        [
          "Only 24% of promised AI value is finance-validated enterprise-wide, with 30% pending.",
        ],
        [portfolio, enterprise],
      ),
    ).toBe(true);
  });
});

describe("vendor allocation and internal control", () => {
  it.each([
    "Over half of the technology budget flows to third-party vendors and sits outside internal control.",
    "Vendor contract spend is beyond our internal control.",
    "Vendor spend is not outside internal control, but vendor costs are beyond internal control.",
    "Vendor spend is not outside internal control and sits beyond internal control.",
    "Vendor allocation does not establish that spend is outside internal control; vendor spend is outside internal control.",
    "Vendor spend is not only outside internal control but also unreviewed.",
  ])("retains the control-loss guard: %s", (passage) => {
    expect(hasUnsupportedHomeEvidenceScope([passage], [portfolio])).toBe(true);
  });

  it.each([
    "Vendor contract spend is not outside internal control simply because it is allocated to third parties.",
    "Vendor contract spend is not beyond our internal control.",
    "Vendor allocation does not establish that spend is outside internal control.",
    "Vendor allocation cannot establish that spend is beyond internal control.",
    "Over half of the technology budget is allocated to vendor contracts.",
  ])("preserves the allocation or qualified denial: %s", (passage) => {
    expect(hasUnsupportedHomeEvidenceScope([passage], [portfolio])).toBe(false);
  });
});
