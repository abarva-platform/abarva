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

  it("extracts sourcing-critical facts from a realistic long-form technology proposal", () => {
    const longProposalText = [
      "Executive summary",
      "Vendor Alpha proposes a managed data-platform operations model for airport, crew, revenue, and maintenance analytics.",
      "",
      "[p. 18] Scope: Manage Snowflake warehouse operations, dbt pipelines, data quality triage, and Level 2/3 analytics support; mainframe feed ownership remains retained by the client.",
      "Page 24 - Solution architecture: Hub-and-spoke lakehouse with private connectivity, event-stream ingestion, dbt semantic marts, lineage controls, and a governed AI-assistant support layer.",
      "Page 27 - Integration architecture: 42 inbound interfaces, 16 APIs, and 9 batch feeds are included; two airport partner feeds require client-owned access remediation.",
      "Page 31 - AI automation: Vendor commits an AIOps triage assistant for data incidents with a 12% ticket deflection target after a measured 90-day baseline.",
      "Page 35 - Accelerators: Migration factory, data-quality rule pack, and airline operations KPI starter mart are included at no additional license cost.",
      "Page 41 - SLA: P1 data-platform incidents carry 99.7% availability and monthly service credits capped at 5%.",
      "Page 47 - Staffing: 18 named-role FTE equivalent model across US, India, and Poland with 24x7 major-incident coverage.",
      "Page 58 - Transition: 120-day transition with four acceptance milestones and 20% fee holdback until runbook sign-off.",
      "Page 63 - Security: SOC 2 Type II report, data access logging, privileged access review, and subcontractor list are supplied as exhibits.",
      "Page 69 - Assumptions: Client will provide production credentials, current interface catalogue, and SME access within ten business days.",
      "Page 70 - Exceptions: Liability cap excludes indirect damages and the vendor requests earn-back rights for two chronic SLA misses per quarter.",
      "Page 72 - Price: USD 14,800,000 annual run-rate plus USD 2,100,000 transition fee.",
      "Page 74 - Evidence: Exhibit E-3 maps each transformation claim to a source artifact, owner, due date, and proposed acceptance metric.",
    ].join("\n");

    const result = extractVendorProposalFacts(longProposalText);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          factKey: "scope_coverage",
          sectionKey: "scope_coverage",
          pageOrLocation: "page 18, line 4",
        }),
        expect.objectContaining({
          factKey: "solution_architecture",
          sectionKey: "solution_architecture",
          pageOrLocation: "page 24, line 5",
          valueText: expect.stringMatching(/Hub-and-spoke lakehouse/i),
        }),
        expect.objectContaining({
          factKey: "integration_architecture",
          sectionKey: "solution_architecture",
        }),
        expect.objectContaining({
          factKey: "automation_productivity",
          valueNumeric: 12,
          unit: "percent",
        }),
        expect.objectContaining({
          factKey: "accelerator",
          sectionKey: "innovation_value_add",
        }),
        expect.objectContaining({
          factKey: "price",
          valueNumeric: 14800000,
          currency: "USD",
        }),
        expect.objectContaining({
          factKey: "evidence_reference",
          sectionKey: "evidence_quality",
        }),
      ]),
    );
    expect(result.length).toBeGreaterThanOrEqual(12);
  });
});
