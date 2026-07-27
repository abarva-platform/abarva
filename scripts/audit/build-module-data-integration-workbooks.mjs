#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const REPO = process.cwd();
const OUT_DIR = path.join(REPO, "reports/module-data-integration-audit/2026-07-27");
const DEFAULT_ARTIFACT_TOOL =
  "/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const WORKBOOKS = [
  ["CURRENT_MODULE_DATA_INVENTORY.csv", "CURRENT_MODULE_DATA_INVENTORY.xlsx", "Inventory"],
  ["CROSS_MODULE_IDENTITY_COLLISION_MATRIX.csv", "CROSS_MODULE_IDENTITY_COLLISION_MATRIX.xlsx", "Identity Collisions"],
  ["CANONICAL_PROMOTION_MATRIX.csv", "CANONICAL_PROMOTION_MATRIX.xlsx", "Promotion"],
  ["CONSUMPTION_PROJECTION_MATRIX.csv", "CONSUMPTION_PROJECTION_MATRIX.xlsx", "Consumption"],
  ["METRIC_DEFINITION_DUPLICATION_MATRIX.csv", "METRIC_DEFINITION_DUPLICATION_MATRIX.xlsx", "Metric Duplication"],
];

async function loadArtifactTool() {
  const candidates = [process.env.ARTIFACT_TOOL_MODULE, "@oai/artifact-tool", DEFAULT_ARTIFACT_TOOL].filter(Boolean);
  let lastError;
  for (const candidate of candidates) {
    try {
      return await import(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes && char === '"' && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.length)) rows.push(row);
  }
  return rows;
}

function columnLetter(index) {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    const mod = (value - 1) % 26;
    label = String.fromCharCode(65 + mod) + label;
    value = Math.floor((value - mod) / 26);
  }
  return label;
}

function applyBasicFormatting(sheet, rows) {
  if (!rows.length) return;
  const rowCount = rows.length;
  const colCount = Math.max(...rows.map((row) => row.length));
  const lastCol = columnLetter(colCount - 1);
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const used = sheet.getRange(`A1:${lastCol}${rowCount}`);
  used.format.font.name = "Aptos";
  used.format.font.size = 10;
  used.format.wrapText = true;
  used.format.borders = {
    insideHorizontal: { style: "thin", color: "#E5E7EB" },
    top: { style: "thin", color: "#CBD5E1" },
    bottom: { style: "thin", color: "#CBD5E1" },
  };
  const header = sheet.getRange(`A1:${lastCol}1`);
  header.format.fill.color = "#0F172A";
  header.format.font.color = "#FFFFFF";
  header.format.font.bold = true;
  header.format.rowHeightPx = 34;
  used.format.autofitColumns();
  used.format.autofitRows();
  for (let i = 0; i < colCount; i += 1) {
    const col = sheet.getRange(`${columnLetter(i)}:${columnLetter(i)}`);
    col.format.columnWidth = Math.min(Math.max(14, String(rows[0][i] || "").length + 4), 42);
  }
}

async function writeWorkbook({ Workbook, SpreadsheetFile }, csvFile, xlsxFile, sheetName) {
  const csvText = await fs.readFile(path.join(OUT_DIR, csvFile), "utf8");
  const rows = parseCsv(csvText);
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add(sheetName);
  const colCount = Math.max(...rows.map((row) => row.length), 1);
  const normalized = rows.map((row) => [...row, ...Array(Math.max(0, colCount - row.length)).fill("")]);
  const lastCol = columnLetter(colCount - 1);
  sheet.getRange(`A1:${lastCol}${normalized.length}`).values = normalized;
  applyBasicFormatting(sheet, normalized);
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(OUT_DIR, xlsxFile));
}

async function main() {
  const artifactTool = await loadArtifactTool();
  for (const [csvFile, xlsxFile, sheetName] of WORKBOOKS) {
    await writeWorkbook(artifactTool, csvFile, xlsxFile, sheetName);
    console.log(`Wrote ${path.relative(REPO, path.join(OUT_DIR, xlsxFile))}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
