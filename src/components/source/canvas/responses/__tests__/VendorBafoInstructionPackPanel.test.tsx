import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import { VendorBafoInstructionPackPanel } from "../VendorBafoInstructionPackPanel";

describe("VendorBafoInstructionPackPanel", () => {
  it("renders vendor-specific BAFO asks from challenge leverage intelligence", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "SkyHarbor AMS Outsourcing RFP",
      accountName: "SkyHarbor Air",
    });
    const intelligence = buildVendorChallengeIntelligence(profileSet);
    const pack = buildVendorBafoInstructionPack(intelligence);

    const html = renderToStaticMarkup(
      createElement(VendorBafoInstructionPackPanel, { pack }),
    );

    expect(html).toContain("BAFO instruction pack");
    expect(html).toContain("Vendor-specific asks before scoring hardens");
    expect(html).toContain("Vendor A");
    expect(html).toContain("Vendor B");
    expect(html).toContain("Vendor C");
    expect(html).toContain("Response format");
    expect(html).toContain("Scoring holdback");
    expect(html).toMatch(/baseline volume|price-down|gainshare/i);
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });
});
