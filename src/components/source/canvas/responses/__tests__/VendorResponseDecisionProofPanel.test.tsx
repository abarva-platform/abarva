import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorResponseMveProfiles,
  buildVendorResponseParseReportsFromProfiles,
} from "@/lib/source/proposal-intelligence";
import { VendorResponseDecisionProofPanel } from "../VendorResponseDecisionProofPanel";

describe("VendorResponseDecisionProofPanel", () => {
  it("renders scoring, BAFO, CXO, and value proof outputs from parser reports", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "Managed services sourcing event",
      accountName: "Demo account",
    });
    const parseReports =
      buildVendorResponseParseReportsFromProfiles(profileSet);

    const html = renderToStaticMarkup(
      // U-520 made the flag required. This suite asserts the panel's structure
      // and its vendor-anonymity rule, neither of which depends on the
      // entitlement, so it answers granted; the restricted direction is covered
      // in `u520-financial-visibility.test.tsx`.
      createElement(VendorResponseDecisionProofPanel, {
        parseReports,
        canViewFinancialValues: true,
      }),
    );

    expect(html).toContain("Decision proof");
    expect(html).toContain("First-pass scoring");
    expect(html).toContain("BAFO leverage");
    expect(html).toContain("CXO decision pack");
    expect(html).toContain("Value realization");
    expect(html).toContain("AI suggestions");
    expect(html).toContain("not booked savings");
    expect(html).toContain("realized savings");
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });
});
