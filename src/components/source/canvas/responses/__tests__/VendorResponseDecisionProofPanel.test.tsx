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
      createElement(VendorResponseDecisionProofPanel, { parseReports }),
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
