import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";

describe("Home V6 context browser", () => {
  it("builds table previews for all Home dimensions from the V6 tenant pack", () => {
    const browser = getHomeV6ContextBrowser("lakeshore");

    expect(browser?.datasetDir).toBe("lakeshore-industries-synthetic-v6");
    expect(browser?.dimensions["Vendors & Contracts"]).toEqual(
      expect.objectContaining({
        title: "Vendors and contracts",
        rowCount: 90,
        sourceCount: 1,
      }),
    );
    expect(browser?.dimensions["Vendors & Contracts"].columns).toEqual([
      { key: "vendor_name", label: "Vendor" },
      { key: "service", label: "Service" },
      { key: "renewal_date", label: "Renewal" },
      { key: "contract_risk", label: "Risk/gap" },
    ]);
    expect(browser?.dimensions["Vendors & Contracts"].rows[0]).toEqual([
      "Workday",
      "HCM and finance SaaS",
      "2027-02-28",
      "medium",
    ]);
    expect(browser?.dimensions["Vendors & Contracts"].sourceRows[0]).toEqual(
      expect.objectContaining({
        v6File: "V6_07_vendors_contracts.csv",
        rowNumber: 2,
        rowId: "LH-VDR-WORKDAY",
        label: "Workday",
      }),
    );
    expect(Object.keys(browser?.dimensions ?? {})).toEqual(
      expect.arrayContaining([
        "Enterprise Profile",
        "Business & Operating Model",
        "Applications & Core Systems",
        "Vendors & Contracts",
        "AI & Automation Footprint",
        "Industry Benchmarks",
      ]),
    );
  });
});
