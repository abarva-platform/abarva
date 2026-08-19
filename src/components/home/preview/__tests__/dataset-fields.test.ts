import { DATASET_FIELD_CONFIG, inferFieldConfig } from "../visuals/dataset-fields";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";

/**
 * The field config is the one place that decides which row field is "the label" and which is
 * "the value" for a governed dataset -- get it wrong and a chart plots the wrong number without
 * anyone noticing, since the chart itself has no way to know it picked the wrong field. These
 * tests pin every configured dataset_ref against the real golden-snapshot rows, not synthetic
 * fixtures, so a future dataset-shape change in the generator breaks this test instead of shipping
 * a silently-wrong chart.
 */
describe("DATASET_FIELD_CONFIG", () => {
  const bundle = getHomeReviewBundle("skyharbor-air");
  const visualDatasets = bundle?.thesis.signalPacket.visualDatasets ?? {};

  it("every configured dataset_ref's labelKey and valueKey exist on its real rows", () => {
    for (const [datasetRef, config] of Object.entries(DATASET_FIELD_CONFIG)) {
      const rows = visualDatasets[datasetRef];
      if (!rows || rows.length === 0) continue; // not every dataset appears in every tenant
      expect(rows[0]).toHaveProperty(config.labelKey);
      expect(rows[0]).toHaveProperty(config.valueKey);
      expect(typeof rows[0][config.valueKey]).toBe("number");
    }
  });

  it("formats a representative value without throwing for every configured dataset", () => {
    for (const config of Object.values(DATASET_FIELD_CONFIG)) {
      expect(() => config.format(1234567)).not.toThrow();
      expect(config.format(1234567)).toEqual(expect.any(String));
    }
  });
});

describe("inferFieldConfig", () => {
  it("picks the first string field as label and first number field as value", () => {
    const rows = [{ name: "Vendor A", count: 4, extra: true }];
    expect(inferFieldConfig(rows)).toEqual({
      labelKey: "name",
      valueKey: "count",
      valueLabel: "count",
      format: expect.any(Function),
    });
  });

  it("returns null for empty rows rather than throwing", () => {
    expect(inferFieldConfig([])).toBeNull();
  });

  it("returns null when no field is a plain string or number", () => {
    expect(inferFieldConfig([{ nested: { a: 1 } }])).toBeNull();
  });
});
