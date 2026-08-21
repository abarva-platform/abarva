import fs from "node:fs";
import path from "node:path";

import {
  computeCriticalityRank,
  computeInterfaceIntensity,
  computeSourceFanOut,
  computeTargetFanIn,
  recomputeDeterministicColumns,
} from "../../src/lib/enterprise-data/intake/deterministic-recomputers";
import { ENRICHMENT_SCHEMAS, enrichmentSchemaFor } from "../../src/lib/enterprise-data/intake/enrichment-schemas";
import { basisForColumn, validateEnrichmentSchema } from "../../src/lib/enterprise-data/intake/enrichment-firewall";

const TEMPLATE_DIR = "datasets/tenant-inputs/templates/universal/standard-2026-07-v3";

describe("the three schemas are honest about what they are", () => {
  it("declares no augmented column anywhere in the technology estate", () => {
    // Augmentation adds a fact the client never gave us. On the estate files that would be the
    // least defensible thing on the page.
    for (const schema of ENRICHMENT_SCHEMAS) {
      expect(schema.columns.filter((c) => c.basis === "augmented")).toEqual([]);
    }
  });

  it("cites only evidence fields that exist in the real template header", () => {
    // A schema citing a column the template does not have produces a dependency hash over nothing,
    // and invalidation silently stops working.
    for (const schema of ENRICHMENT_SCHEMAS) {
      const file = path.join(TEMPLATE_DIR, schema.templateFile);
      const header = fs.readFileSync(file, "utf8").split("\n")[0].split(",").map((h) => h.trim());
      for (const column of schema.columns) {
        expect(column.evidenceFields.length).toBeGreaterThan(0);
        for (const field of column.evidenceFields) {
          expect([schema.templateFile, field, header.includes(field)]).toEqual([schema.templateFile, field, true]);
        }
      }
    }
  });

  it("gives every column a reserved prefix matching its declared basis", () => {
    for (const schema of ENRICHMENT_SCHEMAS) {
      for (const column of schema.columns) {
        expect(basisForColumn(column.column)).toBe(column.basis);
      }
    }
  });

  it("closes the vocabulary on every classification, or states why it cannot be closed", () => {
    // An open field lets a model widen the taxonomy one reasonable-looking row at a time.
    for (const schema of ENRICHMENT_SCHEMAS) {
      for (const column of schema.columns) {
        // An open field is sometimes correct, but must be argued in the schema rather than
        // simply omitted -- otherwise the two cases are indistinguishable on inspection.
        if (column.unenumerable) {
          expect([column.column, column.vocabulary]).toEqual([column.column, undefined]);
          continue;
        }
        expect([column.column, Boolean(column.vocabulary?.length)]).toEqual([column.column, true]);
        expect(column.vocabulary).toContain("unknown");
      }
    }
  });

  it("keeps entity role and hosting platform as separate attributes", () => {
    // Collapsing them is how "SQL Server" ends up rendered as an integration layer.
    const four = enrichmentSchemaFor("04_applications_systems.csv")!;
    expect(four.columns.map((c) => c.targetAttribute)).toEqual(
      expect.arrayContaining(["architectureRole", "hostingPlatform"]),
    );
  });
});

describe("fan-in is a property of the target, not of the row", () => {
  const rows = [
    { source_system: "Epic", target_system: "Netezza EDW" },
    { source_system: "Workday", target_system: "Netezza EDW" },
    { source_system: "Epic", target_system: "Netezza EDW" },
    { source_system: "Netezza EDW", target_system: "Radiology Mart" },
  ];

  it("counts distinct sources across the whole file", () => {
    // Computed per-row this is always 1 and measures nothing -- the defect in the first draft.
    expect(computeTargetFanIn(rows)).toEqual(["2", "2", "2", "1"]);
  });

  it("counts one system feeding a target twice as one dependency", () => {
    const twice = [
      { source_system: "Epic", target_system: "EDW" },
      { source_system: "Epic", target_system: "EDW" },
    ];
    expect(computeTargetFanIn(twice)).toEqual(["1", "1"]);
  });

  it("mirrors as fan-out, which is what a retirement would break", () => {
    expect(computeSourceFanOut(rows)).toEqual(["1", "1", "1", "1"]);
    expect(computeSourceFanOut([
      { source_system: "Epic", target_system: "EDW" },
      { source_system: "Epic", target_system: "Mart" },
    ])).toEqual(["2", "2"]);
  });

  it("returns unknown rather than zero when the target is blank", () => {
    expect(computeTargetFanIn([{ source_system: "Epic", target_system: "" }])).toEqual(["unknown"]);
  });
});

describe("other deterministic columns", () => {
  it("bands interface counts and leaves unparseable values unknown", () => {
    expect(
      computeInterfaceIntensity([
        { interfaces_count: "0" },
        { interfaces_count: "3" },
        { interfaces_count: "9" },
        { interfaces_count: "41" },
        { interfaces_count: "" },
        { interfaces_count: "many" },
      ]),
    ).toEqual(["isolated", "lightly_integrated", "integrated", "heavily_integrated", "unknown", "unknown"]);
  });

  it("leaves an unrecognised criticality label unknown rather than guessing a rank", () => {
    expect(
      computeCriticalityRank([{ criticality: "Mission Critical" }, { criticality: "Low" }, { criticality: "Gold" }]),
    ).toEqual(["1", "4", "unknown"]);
  });

  it("reports a declared deterministic column with no implementation instead of omitting it", () => {
    // Silently omitting it leaves the workbook's submitted value as the only candidate -- exactly
    // what deterministic columns exist to prevent.
    const out = recomputeDeterministicColumns({ rows: [{}], columns: ["det__target_fan_in", "det__not_built"] });
    expect(out.unimplemented).toEqual(["det__not_built"]);
    expect(out.values.det__target_fan_in).toBeDefined();
  });

  it("implements every deterministic column the three schemas declare", () => {
    const declared = ENRICHMENT_SCHEMAS.flatMap((s) => s.columns.filter((c) => c.basis === "deterministic").map((c) => c.column));
    const out = recomputeDeterministicColumns({ rows: [{}], columns: declared });
    expect(out.unimplemented).toEqual([]);
  });
});

describe("schema self-check applies to schemas not yet written", () => {
  it("passes every schema shipped today", () => {
    for (const schema of ENRICHMENT_SCHEMAS) {
      expect([schema.templateFile, validateEnrichmentSchema(schema).errors]).toEqual([schema.templateFile, []]);
    }
  });

  it("catches a closed vocabulary with no way to decline", () => {
    // A model with no "unknown" available picks the nearest wrong answer.
    const { errors } = validateEnrichmentSchema({
      schemaVersion: "x",
      templateFile: "t.csv",
      columns: [{ column: "drv__x", basis: "derived", targetAttribute: "x", evidenceFields: ["a"], vocabulary: ["p", "q"] }],
    });
    expect(errors.join(" ")).toMatch(/nearest wrong answer/);
  });

  it("catches an open field that was omitted rather than argued", () => {
    const { errors } = validateEnrichmentSchema({
      schemaVersion: "x",
      templateFile: "t.csv",
      columns: [{ column: "drv__x", basis: "derived", targetAttribute: "x", evidenceFields: ["a"] }],
    });
    expect(errors.join(" ")).toMatch(/must be argued, not omitted/);
  });

  it("catches a prefix that disagrees with the declared basis", () => {
    const { errors } = validateEnrichmentSchema({
      schemaVersion: "x",
      templateFile: "t.csv",
      columns: [{ column: "det__x", basis: "derived", targetAttribute: "x", evidenceFields: ["a"], unenumerable: "count" }],
    });
    expect(errors.join(" ")).toMatch(/prefix is what every loader reads/);
  });

  it("catches a column citing no evidence", () => {
    const { errors } = validateEnrichmentSchema({
      schemaVersion: "x",
      templateFile: "t.csv",
      columns: [{ column: "drv__x", basis: "derived", targetAttribute: "x", evidenceFields: [], unenumerable: "n/a" }],
    });
    expect(errors.join(" ")).toMatch(/invalidation would silently stop working/);
  });
});
