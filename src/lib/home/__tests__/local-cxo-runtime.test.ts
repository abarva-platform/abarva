import { getLocalCxoRuntimeBrowser } from "@/lib/home/local-cxo-runtime";

describe("getLocalCxoRuntimeBrowser", () => {
  it("exposes the full refreshed Meridian source-template rows instead of the 12-row display preview", () => {
    const browser = getLocalCxoRuntimeBrowser("meridian-health");

    expect(browser?.dimensions["Applications & Systems"]).toEqual(
      expect.objectContaining({
        rowCount: 241,
        sourceRows: expect.arrayContaining([
          expect.objectContaining({
            values: expect.objectContaining({
              "Business Name": expect.stringMatching(/Epic/i),
            }),
          }),
        ]),
      }),
    );
    expect(browser?.dimensions["Applications & Systems"].sourceRows).toHaveLength(
      241,
    );
    expect(browser?.dimensions["Data Assets & Integrations"].sourceRows).toHaveLength(
      242,
    );
    expect(browser?.dimensions["IT Budget, Spend & Value"].sourceRows).toHaveLength(
      298,
    );
    expect(browser?.dimensions["Programs & Initiatives"].sourceRows).toHaveLength(
      256,
    );
    expect(browser?.dimensions["AI & Automation Use Cases"].sourceRows).toHaveLength(
      251,
    );
  });
});
