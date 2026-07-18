import { getLocalCxoRuntimeBrowser } from "@/lib/home/local-cxo-runtime";

describe("getLocalCxoRuntimeBrowser", () => {
  it("prefers active/current tenant context for Airline and FS instead of requiring legacy story blocks", () => {
    const airline = getLocalCxoRuntimeBrowser("skyharbor");
    const fs = getLocalCxoRuntimeBrowser("first-capital");

    expect(airline).toMatchObject({
      tenantKey: "skyharbor-air",
      displayName: "SkyHarbor Air",
      runtimeSource: "local-v3-active",
      contractLabel: "Active standard v3 context",
    });
    expect(airline?.datasetDir).toBe(
      "datasets/tenant-inputs/active/skyharbor-air/current",
    );
    expect(airline?.dimensions["Applications & Systems"].rowCount).toBe(613);
    expect(airline?.dimensions["AI & Automation Use Cases"].sourceRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "IROPS AI recovery cockpit",
        }),
      ]),
    );

    expect(fs).toMatchObject({
      tenantKey: "first-capital-financial",
      displayName: "Financial Services Demo",
      runtimeSource: "local-v3-active",
      contractLabel: "Active standard v3 context",
    });
    expect(fs?.datasetDir).toBe(
      "datasets/tenant-inputs/active/first-capital-financial/current",
    );
    expect(fs?.dimensions["Applications & Systems"].rowCount).toBe(212);
    expect(fs?.dimensions["Programs & Initiatives"].sourceRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Real-time scam & APP fraud detection",
        }),
      ]),
    );
  });

  it("exposes the full refreshed Meridian source-template rows instead of the 12-row display preview", () => {
    const browser = getLocalCxoRuntimeBrowser("meridian-health");

    expect(browser?.runtimeSource).toBe("local-v3-active");
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
    expect(
      browser?.dimensions["Applications & Systems"].sourceRows,
    ).toHaveLength(241);
    expect(
      browser?.dimensions["Data Assets & Integrations"].sourceRows,
    ).toHaveLength(242);
    expect(
      browser?.dimensions["IT Budget, Spend & Value"].sourceRows,
    ).toHaveLength(298);
    expect(
      browser?.dimensions["Programs & Initiatives"].sourceRows,
    ).toHaveLength(256);
    expect(
      browser?.dimensions["AI & Automation Use Cases"].sourceRows,
    ).toHaveLength(251);
  });
});
