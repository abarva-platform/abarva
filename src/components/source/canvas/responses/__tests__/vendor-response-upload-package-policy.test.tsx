import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  VENDOR_RESPONSE_FILE_FAMILIES,
  VENDOR_RESPONSE_REQUIRED_FILE_COUNT,
} from "@/lib/source/vendor-response-upload-package-policy";
import { VendorResponseFileReadinessPanel } from "../VendorResponseFileReadinessPanel";
import { VendorResponsePackageCockpit } from "../VendorResponsePackageCockpit";

/**
 * The Responses stage renders the upload requirement twice — once as the
 * cockpit strip, once as the file-readiness ledger. When they were maintained
 * separately, the page told a buyer "2 required files per vendor" directly
 * under a strip listing five files as REQUIRED. These tests pin the invariant
 * that both surfaces read from one policy.
 */
describe("vendor response upload package policy", () => {
  it("requires exactly the main proposal and the pricing workbook", () => {
    const required = VENDOR_RESPONSE_FILE_FAMILIES.filter(
      (family) => family.requirement === "Required",
    ).map((family) => family.key);

    expect(required).toEqual(["main_proposal", "pricing_template"]);
    expect(VENDOR_RESPONSE_REQUIRED_FILE_COUNT).toBe(2);
  });

  it("keeps SLA, staffing and transition conditional, not required", () => {
    for (const key of ["sla_response", "staffing_model", "transition_plan"]) {
      const family = VENDOR_RESPONSE_FILE_FAMILIES.find(
        (item) => item.key === key,
      );
      expect(family?.requirement).toBe("Conditional");
    }
  });

  it("renders the same requirement wording in the cockpit strip and the ledger", () => {
    const cockpit = renderToStaticMarkup(
      createElement(VendorResponsePackageCockpit, {}),
    );
    const ledger = renderToStaticMarkup(
      createElement(VendorResponseFileReadinessPanel, {}),
    );

    for (const family of VENDOR_RESPONSE_FILE_FAMILIES) {
      expect(cockpit).toContain(family.label);
    }

    expect(cockpit).toContain(
      `${VENDOR_RESPONSE_REQUIRED_FILE_COUNT} required files per vendor`,
    );
    expect(ledger).toContain(
      `Minimum package: ${VENDOR_RESPONSE_REQUIRED_FILE_COUNT} required files per vendor`,
    );
  });
});
