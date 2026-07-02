import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";

describe("Home V6 context browser", () => {
  it("builds table previews for all Home dimensions from the V6 tenant pack", () => {
    const browser = getHomeV6ContextBrowser("lakeshore");
    const skyharborBrowser = getHomeV6ContextBrowser("skyharbor");

    expect(browser?.datasetDir).toBe("lakeshore-holdings-synthetic-v6");
    expect(browser?.displayName).toBe("Lakeshore Holdings");
    expect(browser?.dimensions["Enterprise Profile"].sourceRows[0].values).toEqual(
      expect.objectContaining({
        Company: "Lakeshore Holdings",
        "Business model":
          "Holding company with four named operating companies plus an operating-company revenue allocation bucket. Corporate IT carries its own budget and supports shared services and enterprise platforms; each operating company carries its own local IT and operating budget.",
        Priorities: expect.stringContaining(
          "portfolio company revenue rollup usd:7120000000",
        ),
      }),
    );
    expect(
      browser?.dimensions["Enterprise Profile"].sourceRows[0].values.Priorities,
    ).toEqual(expect.stringContaining("direct holdco revenue usd:0"));
    expect(
      browser?.dimensions["Enterprise Profile"].sourceRows[0].values.Priorities,
    ).toEqual(expect.stringContaining("opco revenue to allocate usd:3560000000"));
    expect(browser?.dimensions["Vendors & Contracts"]).toEqual(
      expect.objectContaining({
        title: "Vendors and contracts",
        rowCount: 90,
        sourceCount: 1,
      }),
    );
    expect(browser?.dimensions["Vendors & Contracts"].columns).toEqual([
      { key: "__loaded_record", label: "Loaded record" },
      { key: "__source_family", label: "Source family" },
      { key: "__source_basis", label: "Basis" },
      { key: "vendor_name", label: "Vendor" },
      { key: "service", label: "Service" },
      { key: "renewal_date", label: "Renewal" },
      { key: "contract_risk", label: "Risk/gap" },
    ]);
    expect(browser?.dimensions["Vendors & Contracts"].rows[0]).toEqual([
      "LH-VDR-WORKDAY - Workday",
      "holdco/vendors-contracts.csv",
      "synthetic demo",
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
        label: "LH-VDR-WORKDAY - Workday",
      }),
    );
    expect(
      skyharborBrowser?.dimensions["IT Budget & Financials"].rows[0],
    ).toEqual([
      "BEN-00001 - spend value record",
      "family-7-outcome-intelligence/O04 benefits-realization.csv",
      "synthetic demo",
      "52.9",
      "Productivity",
      "CFO Office",
      "MET-0006",
    ]);
    expect(
      skyharborBrowser?.dimensions["IT Budget & Financials"].sourceRows[0]
        .values,
    ).toEqual(
      expect.objectContaining({
        "Loaded record": "BEN-00001 - spend value record",
        "Source family":
          "family-7-outcome-intelligence/O04 benefits-realization.csv",
        Basis: "synthetic demo",
        Type: "Productivity",
        Amount: "52.9",
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
