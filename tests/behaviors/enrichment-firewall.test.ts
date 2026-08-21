import {
  basisForColumn,
  containsFinancialClaim,
  dependencyHash,
  reconcileDeterministic,
  screenOverlayColumns,
  screenProposalContent,
  screenRecordedStream,
  type EnrichmentSchema,
} from "../../src/lib/enterprise-data/intake/enrichment-firewall";

/**
 * These assert the acceptance criteria the architecture review set. Each one corresponds to a way
 * an unapproved model judgement could otherwise reach canonical state.
 */

const SCHEMA: EnrichmentSchema = {
  schemaVersion: "2026-08-v1",
  templateFile: "04_applications_systems.csv",
  columns: [
    {
      column: "drv__architecture_role",
      basis: "derived",
      targetAttribute: "architectureRole",
      evidenceFields: ["system_name", "system_category", "deployment_model"],
      vocabulary: ["data_mart", "enterprise_data_warehouse", "unknown"],
    },
  ],
};

describe("firewall: reserved prefixes never reach the recorded path", () => {
  it("hard-fails when an enrichment column reaches the recorded loader", () => {
    // The generic passthrough would otherwise turn this into a canonical attribute that looks
    // exactly as authoritative as a recorded one.
    const r = screenRecordedStream({
      columns: ["tenant_key", "system_name", "drv__architecture_role"],
      strict: true,
      templateFile: "04_applications_systems.csv",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/must arrive as an approved overlay/);
    expect(r.recordedColumns).not.toContain("drv__architecture_role");
  });

  it("extracts rather than errors when the caller is the intake splitter", () => {
    const r = screenRecordedStream({
      columns: ["tenant_key", "system_name", "drv__architecture_role", "det__rank"],
      strict: false,
    });
    expect(r.ok).toBe(true);
    expect(r.recordedColumns).toEqual(["tenant_key", "system_name"]);
    expect(r.extractedEnrichmentColumns).toEqual(["drv__architecture_role", "det__rank"]);
  });

  it("gives both ingestion routes the same recorded column set", () => {
    // One file previously produced two different canonical results depending on route: the
    // mapping adapter dropped unmapped columns, the canonical build admitted them.
    const columns = ["tenant_key", "system_name", "drv__architecture_role"];
    const a = screenRecordedStream({ columns, strict: false });
    const b = screenRecordedStream({ columns, strict: false });
    expect(a.recordedColumns).toEqual(b.recordedColumns);
  });

  it("reads basis off the prefix", () => {
    expect(basisForColumn("system_name")).toBe("recorded");
    expect(basisForColumn("det__rank")).toBe("deterministic");
    expect(basisForColumn("drv__architecture_role")).toBe("derived");
    expect(basisForColumn("aug__cadence")).toBe("augmented");
  });
});

describe("firewall: only declared columns may exist in an overlay", () => {
  it("rejects a column the model invented", () => {
    const r = screenOverlayColumns({ columns: ["drv__new_fact"], schema: SCHEMA });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/not declared/);
  });

  it("accepts a declared column", () => {
    const r = screenOverlayColumns({ columns: ["drv__architecture_role"], schema: SCHEMA });
    expect(r.ok).toBe(true);
  });

  it("treats __basis and __evidence as proposal metadata, not business attributes", () => {
    const r = screenOverlayColumns({
      columns: ["drv__architecture_role__basis", "drv__architecture_role__evidence"],
      schema: SCHEMA,
    });
    expect(r.ok).toBe(true);
    expect(r.checks.every((c) => c.reason?.includes("never as an attribute"))).toBe(true);
  });
});

describe("firewall: financial claims are caught by CONTENT, not column name", () => {
  it.each([
    "$4.7M annual",
    "4.7M USD",
    "saves 30%",
    "reduces cost materially",
    "GBP 250000",
  ])("rejects %s wherever it is written", (value) => {
    expect(containsFinancialClaim(value)).toBe(true);
  });

  it("catches a financial claim hidden in an innocuously named derived column", () => {
    const r = screenProposalContent({
      cells: [{ rowId: "r1", column: "drv__architecture_role", value: "data mart, saves $4.7M a year" }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/derived cost is a fabricated cost/);
  });

  it("leaves recorded columns alone", () => {
    // A recorded cost is the client's own figure and is not ours to refuse.
    const r = screenProposalContent({ cells: [{ rowId: "r1", column: "annual_cost_usd", value: "$4,200,000" }] });
    expect(r.ok).toBe(true);
  });

  it("does not flag an ordinary classification", () => {
    expect(containsFinancialClaim("data_mart")).toBe(false);
    expect(containsFinancialClaim("operational_reporting_database")).toBe(false);
  });
});

describe("firewall: deterministic values are recomputed, never trusted", () => {
  it("discards the submitted value and reports tampering", () => {
    const r = reconcileDeterministic({
      submitted: { det__target_fan_in: "99" },
      recomputed: { det__target_fan_in: "1" },
    });
    expect(r.values.det__target_fan_in).toBe("1");
    expect(r.tampered).toEqual(["det__target_fan_in"]);
  });

  it("reports nothing when the submitted value matches", () => {
    const r = reconcileDeterministic({
      submitted: { det__target_fan_in: "1" },
      recomputed: { det__target_fan_in: "1" },
    });
    expect(r.tampered).toEqual([]);
  });
});

describe("firewall: dependency hash makes invalidation exact", () => {
  const row = { system_name: "Revenue Cycle Mart", system_category: "SQL Server database/mart", other: "x" };
  const fields = ["system_name", "system_category"];

  it("changes when a cited evidence field changes", () => {
    const before = dependencyHash(row, fields);
    const after = dependencyHash({ ...row, system_category: "Application" }, fields);
    expect(after).not.toBe(before);
  });

  it("does NOT change when an uncited field changes", () => {
    // A client correcting an unrelated column must not invalidate every derivation in the file.
    const before = dependencyHash(row, fields);
    const after = dependencyHash({ ...row, other: "y" }, fields);
    expect(after).toBe(before);
  });

  it("is order-independent across evidence fields", () => {
    expect(dependencyHash(row, ["system_name", "system_category"])).toBe(
      dependencyHash(row, ["system_category", "system_name"]),
    );
  });
});
