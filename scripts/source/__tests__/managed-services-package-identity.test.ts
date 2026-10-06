import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../..");
const packageRoot = path.join(
  repoRoot,
  "datasets/source/contract-depth/meridian-managed-services-depth-v1-20260907/source-files",
);

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function readCsv(fileName: string): Record<string, string>[] {
  const lines = fs
    .readFileSync(path.join(packageRoot, fileName), "utf8")
    .trimEnd()
    .split(/\r?\n/u);
  const headers = parseCsvLine(lines[0] ?? "");
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

describe("managed-services contract-depth package identity", () => {
  it("uses the selected incumbent identity consistently across source files", () => {
    const packageText = fs
      .readdirSync(packageRoot)
      .filter((fileName) => fileName.endsWith(".csv"))
      .map((fileName) => fs.readFileSync(path.join(packageRoot, fileName), "utf8"))
      .join("\n");

    expect(packageText).not.toMatch(/HCLTech|VEN-HCLTECH|HCL America|HCL Technologies/u);

    const contract = readCsv("contracts.csv").find(
      (row) => row.contract_id === "MER-TECH-IMS-001",
    );

    expect(contract).toMatchObject({
      vendor_ref: "VEN-KYNDRYL",
      vendor_name: "Kyndryl, Inc.",
      contract_name: "Enterprise Infrastructure and Service Desk Managed Services Agreement",
      archetype: "infra_service_desk_managed_services",
    });
  });

  it("keeps document page-text hashes aligned with edited evidence text", () => {
    const pages = readCsv("contract_page_text.csv");

    expect(pages).toHaveLength(12);
    for (const page of pages) {
      const expectedHash = createHash("sha256").update(page.page_text).digest("hex");
      expect(page.page_text_sha256).toBe(expectedHash);
    }
  });

  it("carries managed-services depth that reconciles to the package economics", () => {
    const spendByMonth = new Map(
      readCsv("monthly_spend.csv").map((row) => [row.month, Number(row.actual_spend_usd)]),
    );
    const invoiceByMonth = new Map<string, number>();
    for (const row of readCsv("invoice_line_detail.csv")) {
      invoiceByMonth.set(
        row.month,
        (invoiceByMonth.get(row.month) ?? 0) + Number(row.line_amount_usd),
      );
    }

    const mismatchedMonths = [...spendByMonth].filter(
      ([month, spend]) => Math.abs(spend - (invoiceByMonth.get(month) ?? 0)) > 0.001,
    );
    const resourceRows = readCsv("resource_model.csv");
    const resourceTotal = resourceRows.reduce(
      (total, row) => total + Number(row.annual_billed_amount_usd),
      0,
    );
    const totalFte = resourceRows.reduce((total, row) => total + Number(row.fte), 0);
    const onshoreFte = resourceRows
      .filter((row) => row.location_mix === "onshore")
      .reduce((total, row) => total + Number(row.fte), 0);
    const offshoreFte = resourceRows
      .filter((row) => row.location_mix === "offshore")
      .reduce((total, row) => total + Number(row.fte), 0);

    expect(readCsv("pricing_bridge.csv")).toHaveLength(7);
    expect(readCsv("invoice_line_detail.csv")).toHaveLength(50);
    expect(readCsv("batch_job_volumetrics.csv")).toHaveLength(60);
    expect(readCsv("qbr_scorecards.csv")).toHaveLength(4);
    expect(mismatchedMonths).toEqual([]);
    expect(resourceRows).toHaveLength(11);
    expect(resourceTotal).toBe(11_880_000);
    expect(totalFte).toBe(93);
    expect(onshoreFte).toBe(9);
    expect(offshoreFte).toBe(84);
  });
});
