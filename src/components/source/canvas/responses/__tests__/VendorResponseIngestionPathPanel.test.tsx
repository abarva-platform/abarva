import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorResponseMveProfiles,
  buildVendorResponseParseReportsFromProfiles,
} from "@/lib/source/proposal-intelligence";
import { VendorResponseIngestionPathPanel } from "../VendorResponseIngestionPathPanel";

describe("VendorResponseIngestionPathPanel", () => {
  it("explains how parsed long proposals become scoring and decision evidence", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "Managed services sourcing event",
      accountName: "Demo account",
    });
    const parseReports =
      buildVendorResponseParseReportsFromProfiles(profileSet);

    const html = renderToStaticMarkup(
      createElement(VendorResponseIngestionPathPanel, { parseReports }),
    );

    expect(html).toContain("Long response intake");
    expect(html).toContain("How 75-100 page proposals become score evidence");
    expect(html).toContain("Vendor package intake");
    expect(html).toContain("Vendor isolation");
    expect(html).toContain("Parse and section map");
    expect(html).toContain("Citation inventory");
    expect(html).toContain("Score gate");
    expect(html).toContain("Decision outputs");
    expect(html).toContain("Parser citations");
    expect(html).toContain("AI is not the parser");
    expect(html).toContain(
      "BAFO asks, CXO conditions, and value proof guardrails",
    );
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });

  it("shows the intake path before vendor packages are parsed", () => {
    const html = renderToStaticMarkup(
      createElement(VendorResponseIngestionPathPanel, {}),
    );

    expect(html).toContain("Awaiting packages");
    expect(html).toContain(
      "Load one main proposal and one pricing workbook for each vendor.",
    );
    expect(html).toContain(
      "Do not score claims until citations are available.",
    );
    expect(html).toContain(
      "Parse vendor packages before generating leverage or value proof.",
    );
  });
});
