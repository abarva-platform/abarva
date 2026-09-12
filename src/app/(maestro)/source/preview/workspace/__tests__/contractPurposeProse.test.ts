import {
  contractPurposeSummary,
  withoutIdentifierTokens,
} from "../WorkspaceExecutiveShell";
import type {
  SourceContract360Row,
  SourceContractEvidenceCoverageRow,
} from "@/lib/source/data-model/types";

/**
 * Two defects observed live on one card:
 *
 *  1. A scope summary arrived as "Managed Services - present_with_annual_right
 *     - present_after_year_2_with_90_days_notice" — clause and exit-rights
 *     enum values concatenated onto a real phrase — and rendered whole, so an
 *     executive read column values as a sentence.
 *
 *  2. With no reviewed purpose, the card composed one from the header fields
 *     anyway. It read as a finding, directly above the narrative's own line
 *     saying the purpose is not yet reviewed.
 */

const coverage = {
  contract_id: "MER-TEST-PROSE-001",
  contract_archetype: "legacy_analytics_managed_services",
  spend_rows: 12,
  scope_rows: 48,
} as unknown as SourceContractEvidenceCoverageRow;

const contractWith = (
  fields: Partial<Record<string, unknown>>,
): SourceContract360Row =>
  ({
    contract_id: "MER-TEST-PROSE-001",
    contract_name: "Legacy Analytics Application Managed Services Agreement",
    vendor_name: "Test Vendor Ltd",
    vendor_category: "legacy_analytics_managed_services",
    purpose_summary: null,
    scope_summary: null,
    annual_value: 7_800_000,
    end_date: "2027-07-14",
    ...fields,
  }) as unknown as SourceContract360Row;

describe("withoutIdentifierTokens", () => {
  it("strips snake_case database values and keeps the prose", () => {
    expect(
      withoutIdentifierTokens(
        "Managed Services - present_with_annual_right - present_after_year_2_with_90_days_notice",
      ),
    ).toBe("Managed Services");
  });

  it("returns null when nothing but identifiers remains", () => {
    expect(
      withoutIdentifierTokens(
        "present_with_annual_right - for_cause_only_termination",
      ),
    ).toBeNull();
  });

  it("leaves ordinary prose untouched", () => {
    const prose =
      "Application managed services covering claims analytics and reporting.";
    expect(withoutIdentifierTokens(prose)).toBe(prose);
  });

  it("does not strip a single underscore-free word", () => {
    expect(withoutIdentifierTokens("Managed Services")).toBe(
      "Managed Services",
    );
  });
});

describe("contractPurposeSummary", () => {
  it("never renders a database identifier in the body", () => {
    const purpose = contractPurposeSummary(
      contractWith({
        scope_summary:
          "Managed Services - present_with_annual_right - present_after_year_2_with_90_days_notice",
      }),
      coverage,
      [],
    );

    expect(purpose.body).not.toMatch(/[a-z0-9]+_[a-z0-9]/);
    expect(purpose.body).not.toContain("present_with_annual_right");
  });

  it("marks a characterisation as derived when no purpose is reviewed", () => {
    // The card still says what the header establishes — withholding that would
    // lose real information. What it must not do is speak in the same voice as
    // a reviewed extraction, directly above a line saying none exists.
    const purpose = contractPurposeSummary(contractWith({}), coverage, []);

    expect(purpose.evidence).toContain("Derived from the contract header");
    expect(purpose.evidence).toContain("no reviewed purpose extraction yet");
  });

  it("names the reviewed extraction as the basis when one exists", () => {
    const purpose = contractPurposeSummary(
      contractWith({
        purpose_summary:
          "Application managed services for the claims analytics estate.",
      }),
      coverage,
      [],
    );

    expect(purpose.evidence).toContain("Reviewed purpose extraction");
    expect(purpose.evidence).not.toContain("Derived from the contract header");
  });
});
