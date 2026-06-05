import { getCxoIntelBundle } from "../schemas";
import { parseCxoIntelCsv, validateCxoIntelCsv } from "../validators";

describe("CXO Intel schemas", () => {
  it("ships exactly seven active CIO files and seven active CFO files", () => {
    expect(getCxoIntelBundle("cio").files).toHaveLength(7);
    expect(getCxoIntelBundle("cfo").files).toHaveLength(7);
  });

  it("maps the banking relationship file to the Wave 1 substrate table", () => {
    const banking = getCxoIntelBundle("cfo").files.find(
      (file) => file.fileName === "banking_relationships.csv",
    );

    expect(banking?.tableName).toBe("cxo_intel_banking_relationships");
    expect(banking?.requiredColumns).toContain("h2h_ready");
  });
});

describe("validateCxoIntelCsv", () => {
  it("marks a complete file green", () => {
    const schema = getCxoIntelBundle("cio").files.find(
      (file) => file.fileName === "it_spend_allocation.csv",
    )!;
    const parsed = parseCxoIntelCsv(
      [
        "category,share_pct,annual_usd,notes",
        "run,68,35360000,Existing stack maintenance",
        "grow,20,10400000,Selective enhancement",
        "transform,12,6240000,Kyriba and reporting modernization",
      ].join("\n"),
    );

    const result = validateCxoIntelCsv(schema, parsed);

    expect(result.tone).toBe("green");
    expect(result.rowCount).toBe(3);
    expect(result.redRows).toBe(0);
  });

  it("marks missing required headers red", () => {
    const schema = getCxoIntelBundle("cfo").files.find(
      (file) => file.fileName === "banking_relationships.csv",
    )!;
    const parsed = parseCxoIntelCsv("bank_name,relationship_role\nBMO,operating");

    const result = validateCxoIntelCsv(schema, parsed);

    expect(result.tone).toBe("red");
    expect(result.missingRequiredColumns).toContain("h2h_ready");
  });

  it("marks suspicious required cell formats amber", () => {
    const schema = getCxoIntelBundle("cio").files.find(
      (file) => file.fileName === "app_inventory.csv",
    )!;
    const parsed = parseCxoIntelCsv(
      [
        "app_name,vendor_name,category,criticality,scope,owner_name,owner_email,annual_cost_usd,cost_currency,renewal_date",
        "Kyriba,Kyriba,treasury,tier_1,holdco,Aisha Vargas,aisha@lakeshore.example.com,4200000,USD,06/30/2028",
      ].join("\n"),
    );

    const result = validateCxoIntelCsv(schema, parsed);

    expect(result.tone).toBe("amber");
    expect(result.amberRows).toBe(1);
  });
});
