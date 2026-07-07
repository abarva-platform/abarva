// Structured-map extraction correctness: columns → the right fact keys, unit +
// entity validation against the catalog, provenance stamping, and no silent drift
// (unmapped columns surfaced, bad cells rejected).

import {
  coerceNumericCell,
  mapTemplateUploadToFacts,
  type ParsedTemplateUpload,
} from "../structured-map";
import {
  templateFactMapByCode,
  type TemplateFactMap,
} from "../../template-fact-map";
import { factSpecByKey } from "../../fact-catalog";

const CTX = { sourceEventId: "event-uuid-1", clientKey: "lakeshore" };

const APP_INVENTORY = templateFactMapByCode("APP_INVENTORY_V1")!;
const VOLUMETRICS = templateFactMapByCode("VOLUMETRICS_V1")!;

describe("coerceNumericCell", () => {
  it("passes through finite numbers", () => {
    expect(coerceNumericCell(1200)).toBe(1200);
    expect(coerceNumericCell(0)).toBe(0);
    expect(coerceNumericCell(-3.5)).toBe(-3.5);
  });

  it("parses common export shapes", () => {
    expect(coerceNumericCell("$1,200")).toBe(1200);
    expect(coerceNumericCell("42%")).toBe(42);
    expect(coerceNumericCell("  7.5  ")).toBe(7.5);
    expect(coerceNumericCell("(1,000)")).toBe(-1000);
  });

  it("rejects non-numeric and empty cells", () => {
    expect(coerceNumericCell("")).toBeNull();
    expect(coerceNumericCell("   ")).toBeNull();
    expect(coerceNumericCell("N/A")).toBeNull();
    expect(coerceNumericCell("12abc")).toBeNull();
    expect(coerceNumericCell(null)).toBeNull();
    expect(coerceNumericCell(undefined)).toBeNull();
    expect(coerceNumericCell(Number.NaN)).toBeNull();
    expect(coerceNumericCell(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("mapTemplateUploadToFacts — APP_INVENTORY_V1", () => {
  const upload: ParsedTemplateUpload = {
    headers: [
      "Application ID",
      "Annual Run Cost (USD)",
      "Loaded FTE Cost (USD)",
      "Variable Cost Share (%)",
    ],
    rows: [
      {
        "Application ID": "APP-100",
        "Annual Run Cost (USD)": "1,200,000",
        "Loaded FTE Cost (USD)": "185000",
        "Variable Cost Share (%)": "35",
      },
    ],
  };

  it("maps every mapped column to its catalog fact key", () => {
    const { facts } = mapTemplateUploadToFacts(APP_INVENTORY, upload, CTX);
    const byKey = new Map(facts.map((f) => [f.fact_key, f]));
    expect(byKey.has("annual_run_cost")).toBe(true);
    expect(byKey.has("loaded_fte_cost")).toBe(true);
    expect(byKey.has("variable_cost_share_pct")).toBe(true);
    expect(facts).toHaveLength(3);
  });

  it("stamps structured_map provenance + high confidence + template citation", () => {
    const { facts } = mapTemplateUploadToFacts(APP_INVENTORY, upload, CTX);
    for (const f of facts) {
      expect(f.source_method).toBe("structured_map");
      expect(f.confidence).toBe("high");
      expect(f.source_citation?.doc).toBe("APP_INVENTORY_V1");
      expect(String(f.source_citation?.locator)).toContain("row 1");
      expect(f.source_event_id).toBe(CTX.sourceEventId);
      expect(f.client_key).toBe(CTX.clientKey);
    }
  });

  it("sets the value on value_numeric and mirrors the catalog unit", () => {
    const { facts } = mapTemplateUploadToFacts(APP_INVENTORY, upload, CTX);
    const runCost = facts.find((f) => f.fact_key === "annual_run_cost")!;
    expect(runCost.value_numeric).toBe(1200000);
    expect(runCost.value_text).toBeNull();
    expect(runCost.unit).toBe(factSpecByKey("annual_run_cost")!.unit);
  });

  it("attaches entity_ref per the FACT entityKind, not the template row entity", () => {
    const { facts } = mapTemplateUploadToFacts(APP_INVENTORY, upload, CTX);
    // annual_run_cost / variable_cost_share_pct are tower-level → entity_ref = row id.
    const runCost = facts.find((f) => f.fact_key === "annual_run_cost")!;
    expect(runCost.entity_kind).toBe("tower");
    expect(runCost.entity_ref).toBe("APP-100");
    // loaded_fte_cost is event-level → entity_ref = null even though the row is an app.
    const fteCost = facts.find((f) => f.fact_key === "loaded_fte_cost")!;
    expect(fteCost.entity_kind).toBe("event");
    expect(fteCost.entity_ref).toBeNull();
  });
});

describe("mapTemplateUploadToFacts — VOLUMETRICS_V1 mixed entity + sparse rows", () => {
  const upload: ParsedTemplateUpload = {
    headers: [
      "Service Tower",
      "Annual Change-Order Spend (USD)",
      "Projected Volume Decline (%)",
      "Chronic SLA Miss Rate (%)",
    ],
    rows: [
      {
        "Service Tower": "AMS-Core",
        "Annual Change-Order Spend (USD)": "500000",
        "Projected Volume Decline (%)": "12",
        "Chronic SLA Miss Rate (%)": "", // sparse — silently skipped
      },
    ],
  };

  it("skips absent/blank cells without rejecting them", () => {
    const { facts, rejectedRows } = mapTemplateUploadToFacts(
      VOLUMETRICS,
      upload,
      CTX,
    );
    expect(facts.map((f) => f.fact_key).sort()).toEqual([
      "annual_change_order_spend",
      "projected_volume_decline_pct",
    ]);
    // The blank chronic-miss cell is skipped, not rejected.
    expect(rejectedRows).toHaveLength(0);
  });

  it("event facts get null entity_ref; tower facts carry the row entity", () => {
    const { facts } = mapTemplateUploadToFacts(VOLUMETRICS, upload, CTX);
    const spend = facts.find((f) => f.fact_key === "annual_change_order_spend")!;
    expect(spend.entity_kind).toBe("event");
    expect(spend.entity_ref).toBeNull();
    const decline = facts.find(
      (f) => f.fact_key === "projected_volume_decline_pct",
    )!;
    expect(decline.entity_kind).toBe("tower");
    expect(decline.entity_ref).toBe("AMS-Core");
  });
});

describe("mapTemplateUploadToFacts — drift + rejection (no silent loss)", () => {
  it("collects columns the template does not know about as unmappedColumns", () => {
    const upload: ParsedTemplateUpload = {
      headers: [
        "Application ID",
        "Annual Run Cost (USD)",
        "Owner Email", // not in the template
        "Notes", // not in the template
      ],
      rows: [
        {
          "Application ID": "APP-1",
          "Annual Run Cost (USD)": "100",
          "Owner Email": "a@b.co",
          Notes: "x",
        },
      ],
    };
    const { unmappedColumns } = mapTemplateUploadToFacts(
      APP_INVENTORY,
      upload,
      CTX,
    );
    expect(unmappedColumns.sort()).toEqual(["Notes", "Owner Email"]);
  });

  it("does NOT treat the entity-ref column as unmapped", () => {
    const upload: ParsedTemplateUpload = {
      headers: ["Application ID", "Annual Run Cost (USD)"],
      rows: [{ "Application ID": "APP-1", "Annual Run Cost (USD)": "100" }],
    };
    const { unmappedColumns } = mapTemplateUploadToFacts(
      APP_INVENTORY,
      upload,
      CTX,
    );
    expect(unmappedColumns).toEqual([]);
  });

  it("rejects a present-but-uncoercible numeric cell", () => {
    const upload: ParsedTemplateUpload = {
      headers: ["Application ID", "Annual Run Cost (USD)"],
      rows: [{ "Application ID": "APP-1", "Annual Run Cost (USD)": "unknown" }],
    };
    const { facts, rejectedRows } = mapTemplateUploadToFacts(
      APP_INVENTORY,
      upload,
      CTX,
    );
    expect(facts).toHaveLength(0);
    expect(rejectedRows).toHaveLength(1);
    expect(rejectedRows[0]).toMatchObject({
      rowIndex: 0,
      header: "Annual Run Cost (USD)",
      factKey: "annual_run_cost",
    });
    expect(rejectedRows[0].reason).toMatch(/not a valid number/);
  });

  it("rejects an entity-level fact whose row has no entity id", () => {
    const upload: ParsedTemplateUpload = {
      headers: ["Application ID", "Annual Run Cost (USD)"],
      rows: [{ "Application ID": "", "Annual Run Cost (USD)": "100" }],
    };
    const { facts, rejectedRows } = mapTemplateUploadToFacts(
      APP_INVENTORY,
      upload,
      CTX,
    );
    expect(facts).toHaveLength(0);
    expect(rejectedRows[0].reason).toMatch(/entity-ref column/);
  });

  it("rejects a column whose declared unit drifts from the catalog", () => {
    const drifted: TemplateFactMap = {
      templateCode: "DRIFT_UNIT_V1",
      label: "unit drift",
      rowEntity: "tower",
      entityRefColumn: "Service Tower",
      columns: [
        {
          header: "Run Cost",
          factKey: "annual_run_cost",
          entityKind: "tower",
          unit: "pct", // catalog says usd_per_year
        },
      ],
    };
    const upload: ParsedTemplateUpload = {
      headers: ["Service Tower", "Run Cost"],
      rows: [{ "Service Tower": "T1", "Run Cost": "100" }],
    };
    const { facts, rejectedRows } = mapTemplateUploadToFacts(drifted, upload, CTX);
    expect(facts).toHaveLength(0);
    expect(rejectedRows[0].reason).toMatch(/unit drift/);
  });

  it("rejects a column whose declared entityKind drifts from the catalog", () => {
    const drifted: TemplateFactMap = {
      templateCode: "DRIFT_ENTITY_V1",
      label: "entity drift",
      rowEntity: "tower",
      entityRefColumn: "Service Tower",
      columns: [
        {
          header: "Run Cost",
          factKey: "annual_run_cost",
          entityKind: "vendor", // catalog says tower
          unit: "usd_per_year",
        },
      ],
    };
    const upload: ParsedTemplateUpload = {
      headers: ["Service Tower", "Run Cost"],
      rows: [{ "Service Tower": "T1", "Run Cost": "100" }],
    };
    const { facts, rejectedRows } = mapTemplateUploadToFacts(drifted, upload, CTX);
    expect(facts).toHaveLength(0);
    expect(rejectedRows[0].reason).toMatch(/entity drift/);
  });

  it("rejects a column bound to a non-catalog fact key", () => {
    const drifted: TemplateFactMap = {
      templateCode: "DRIFT_KEY_V1",
      label: "bad key",
      rowEntity: "tower",
      entityRefColumn: "Service Tower",
      columns: [
        {
          header: "Made Up",
          factKey: "not_a_real_fact",
          entityKind: "tower",
          unit: "usd_per_year",
        },
      ],
    };
    const upload: ParsedTemplateUpload = {
      headers: ["Service Tower", "Made Up"],
      rows: [{ "Service Tower": "T1", "Made Up": "100" }],
    };
    const { facts, rejectedRows } = mapTemplateUploadToFacts(drifted, upload, CTX);
    expect(facts).toHaveLength(0);
    expect(rejectedRows[0].reason).toMatch(/not in the catalog/);
  });
});
