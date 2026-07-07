import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorChallengeIntelligence,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import { VendorChallengeLeveragePanel } from "../VendorChallengeLeveragePanel";

describe("VendorChallengeLeveragePanel", () => {
  it("renders challenge log and commercial leverage seeds from MVE profiles", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "SkyHarbor AMS Outsourcing RFP",
      accountName: "SkyHarbor Air",
    });
    const intelligence = buildVendorChallengeIntelligence(profileSet);

    const html = renderToStaticMarkup(
      createElement(VendorChallengeLeveragePanel, { intelligence }),
    );

    expect(html).toContain("Vendor Challenge Log");
    expect(html).toContain("Commercial Leverage Seeds");
    expect(html).toContain("Vendor A");
    expect(html).toContain("Vendor B");
    expect(html).toContain("Vendor C");
    expect(html).toContain("BAFO language");
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });
});
