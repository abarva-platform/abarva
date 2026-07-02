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
      "Kyriba",
      "finance treasury",
      "2026-07-06",
      "Renewal concentration",
    ]);
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
