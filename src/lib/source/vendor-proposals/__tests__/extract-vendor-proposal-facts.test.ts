import { extractVendorProposalFacts } from "../extract-vendor-proposal-facts";

describe("extractVendorProposalFacts", () => {
  it("returns an empty array for null/undefined/empty text — malformed content never throws", () => {
    expect(extractVendorProposalFacts(null)).toEqual([]);
    expect(extractVendorProposalFacts(undefined)).toEqual([]);
    expect(extractVendorProposalFacts("")).toEqual([]);
  });

  it("returns an empty array for garbled/unstructured text with no labeled lines", () => {
    expect(extractVendorProposalFacts("asdf 1234 !!! qwer\n\n\tzzxx")).toEqual(
      [],
    );
  });

  it("extracts a dollar amount from a Price: line as a numeric USD fact", () => {
    const result = extractVendorProposalFacts("Price: $120,000/year");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      factKey: "price",
      valueNumeric: 120000,
      currency: "USD",
      unit: "year",
      valueText: null,
      confidence: "low",
      extractionMethod: "parsed_text",
    });
    expect(result[0].sourceQuote).toBe("Price: $120,000/year");
  });

  it("extracts a percent value from an SLA: line", () => {
    const result = extractVendorProposalFacts("SLA: 99.9% uptime guaranteed");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      factKey: "sla",
      valueNumeric: 99.9,
      unit: "percent",
      currency: null,
    });
  });

  it("falls back to valueText when no numeric pattern is present", () => {
    const result = extractVendorProposalFacts(
      "Payment: net 45 days from invoice date",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      factKey: "payment",
      valueNumeric: null,
      valueText: "net 45 days from invoice date",
    });
  });

  it("ignores lines that don't match the proposal-fact label allowlist", () => {
    const result = extractVendorProposalFacts(
      "Vendor: Acme Corp\nContact: sales@acme.example",
    );
    expect(result).toEqual([]);
  });

  it("extracts multiple candidates from multiple lines, preserving line-number locators", () => {
    const result = extractVendorProposalFacts(
      "Price: $50,000/month\nWarranty: 2 years parts and labor\nRate: $150/hour",
    );
    expect(result).toHaveLength(3);
    expect(result[0].pageOrLocation).toBe("line 1");
    expect(result[1].pageOrLocation).toBe("line 2");
    expect(result[2].pageOrLocation).toBe("line 3");
  });

  it("derives higher confidence for a structured extraction method than free text", () => {
    const textResult = extractVendorProposalFacts("Rate: $100/hour", {
      extractionMethod: "parsed_text",
    });
    const xlsxResult = extractVendorProposalFacts("Rate: $100/hour", {
      extractionMethod: "parsed_xlsx_cell",
    });
    expect(textResult[0].confidence).toBe("low");
    expect(xlsxResult[0].confidence).toBe("med");
  });

  it("strips a markdown bullet prefix before matching the label", () => {
    const result = extractVendorProposalFacts(
      "- Discount: 10% volume discount",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ factKey: "discount", valueNumeric: 10 });
  });
});
