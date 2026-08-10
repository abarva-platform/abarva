// Unit tests for the deterministic file → rows parser. Covers CSV (papaparse)
// and XLSX (exceljs) parsing, numeric coercion, empty-cell → null, blank-row
// skipping, file-kind resolution, and clear rejection of unsupported / empty
// files. A real XLSX fixture is built in-memory with exceljs so the round-trip
// is genuine (no mocks).

import ExcelJS from "exceljs";
import {
  coerceParsedCell,
  parseFileToRows,
  resolveParsableFileKind,
} from "../file-to-rows";

// A VOLUMETRICS_V1-shaped CSV: entity-ref column + 5 fact columns + 1 extra.
const VOLUMETRICS_CSV = [
  "Service Tower,Annual Change-Order Spend (USD),Recurring/Avoidable Share (%),Projected Volume Decline (%),Automatable Effort Pool (USD),Chronic SLA Miss Rate (%),Notes",
  'End User Compute,"$1,200,000",35%,12%,"450,000",4%,steady',
  "Network,900000,20,8,300000,2,",
].join("\n");

describe("resolveParsableFileKind", () => {
  it("resolves CSV by extension and mime", () => {
    expect(resolveParsableFileKind({ filename: "a.csv" })).toBe("csv");
    expect(resolveParsableFileKind({ mimeType: "text/csv" })).toBe("csv");
  });
  it("resolves XLSX by extension and mime", () => {
    expect(resolveParsableFileKind({ filename: "a.xlsx" })).toBe("xlsx");
    expect(
      resolveParsableFileKind({
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ).toBe("xlsx");
  });
  it("prefers the .csv extension over the ambiguous ms-excel mime", () => {
    expect(
      resolveParsableFileKind({
        filename: "ticket-export.csv",
        mimeType: "application/vnd.ms-excel",
      }),
    ).toBe("csv");
  });
  it("returns null for unsupported types", () => {
    expect(resolveParsableFileKind({ filename: "a.pdf" })).toBeNull();
    expect(
      resolveParsableFileKind({ mimeType: "application/x-msdownload" }),
    ).toBeNull();
  });
});

describe("coerceParsedCell", () => {
  it("coerces numeric-looking strings to numbers", () => {
    expect(coerceParsedCell("1,200,000")).toBe(1200000);
    expect(coerceParsedCell("$450,000")).toBe(450000);
    expect(coerceParsedCell("35%")).toBe(35);
    expect(coerceParsedCell("(1,200)")).toBe(-1200);
    expect(coerceParsedCell(42)).toBe(42);
  });
  it("leaves non-numeric strings as trimmed strings", () => {
    expect(coerceParsedCell("  End User Compute ")).toBe("End User Compute");
    expect(coerceParsedCell("APP-1")).toBe("APP-1");
  });
  it("maps empty / whitespace to null", () => {
    expect(coerceParsedCell("")).toBeNull();
    expect(coerceParsedCell("   ")).toBeNull();
    expect(coerceParsedCell(null)).toBeNull();
    expect(coerceParsedCell(undefined)).toBeNull();
  });
});

describe("parseFileToRows — CSV", () => {
  it("parses a VOLUMETRICS-shaped CSV into headers + coerced rows", async () => {
    const upload = await parseFileToRows({
      bytes: Buffer.from(VOLUMETRICS_CSV, "utf8"),
      filename: "volumetrics.csv",
      mimeType: "text/csv",
    });

    expect(upload.headers).toEqual([
      "Service Tower",
      "Annual Change-Order Spend (USD)",
      "Recurring/Avoidable Share (%)",
      "Projected Volume Decline (%)",
      "Automatable Effort Pool (USD)",
      "Chronic SLA Miss Rate (%)",
      "Notes",
    ]);
    expect(upload.rows).toHaveLength(2);

    const [r0, r1] = upload.rows;
    expect(r0["Service Tower"]).toBe("End User Compute");
    expect(r0["Annual Change-Order Spend (USD)"]).toBe(1200000);
    expect(r0["Recurring/Avoidable Share (%)"]).toBe(35);
    expect(r0["Automatable Effort Pool (USD)"]).toBe(450000);
    expect(r0["Notes"]).toBe("steady");

    // An empty trailing cell (Notes) becomes null, not "".
    expect(r1["Service Tower"]).toBe("Network");
    expect(r1["Notes"]).toBeNull();
  });

  it("skips fully blank lines", async () => {
    const csv = "A,B\n1,2\n\n , \n3,4\n";
    const upload = await parseFileToRows({
      bytes: Buffer.from(csv, "utf8"),
      filename: "x.csv",
    });
    expect(upload.rows).toHaveLength(2);
    expect(upload.rows[0]).toEqual({ A: 1, B: 2 });
    expect(upload.rows[1]).toEqual({ A: 3, B: 4 });
  });
});

describe("parseFileToRows — XLSX", () => {
  async function buildXlsx(rows: (string | number)[][]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    for (const r of rows) ws.addRow(r);
    const arr = await wb.xlsx.writeBuffer();
    return Buffer.from(arr);
  }

  it("parses the first worksheet with row 1 as headers", async () => {
    const bytes = await buildXlsx([
      ["Application ID", "Annual Run Cost (USD)", "Loaded FTE Cost (USD)"],
      ["APP-1", 1000000, 180000],
      ["APP-2", 500000, 90000],
    ]);

    const upload = await parseFileToRows({
      bytes,
      filename: "inventory.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    expect(upload.headers).toEqual([
      "Application ID",
      "Annual Run Cost (USD)",
      "Loaded FTE Cost (USD)",
    ]);
    expect(upload.rows).toHaveLength(2);
    expect(upload.rows[0]).toEqual({
      "Application ID": "APP-1",
      "Annual Run Cost (USD)": 1000000,
      "Loaded FTE Cost (USD)": 180000,
    });
    expect(upload.rows[1]["Application ID"]).toBe("APP-2");
  });

  it("rejects a corrupt XLSX with an actionable parser message", async () => {
    await expect(
      parseFileToRows({
        bytes: Buffer.from("this is not a workbook", "utf8"),
        filename: "broken.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ).rejects.toThrow(/XLSX file could not be read.*standard \.xlsx/i);
  });
});

describe("parseFileToRows — rejection", () => {
  it("rejects an unsupported file type", async () => {
    await expect(
      parseFileToRows({
        bytes: Buffer.from("hi", "utf8"),
        filename: "notes.pdf",
        mimeType: "application/pdf",
      }),
    ).rejects.toThrow(/Unsupported file type/);
  });

  it("rejects an empty file", async () => {
    await expect(
      parseFileToRows({ bytes: Buffer.alloc(0), filename: "empty.csv" }),
    ).rejects.toThrow(/empty/i);
  });

  it("rejects a CSV with no usable header row", async () => {
    await expect(
      parseFileToRows({ bytes: Buffer.from(",,\n", "utf8"), filename: "x.csv" }),
    ).rejects.toThrow(/no rows|no header row/i);
  });
});
