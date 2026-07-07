// Tower · ERP ingest · workbook builder.
//
// Produces the two-sheet ERP workbook (Program Financials + Vendor
// Spend) with a How-to-fill sheet and a Schema sheet. Used to emit:
//   • public/templates/tower/erp/template.xlsx           (blank)
//   • public/templates/tower/erp/sample-northwind.xlsx   (sample-filled)
//
// Convention matches the rest of public/templates/tower/* — title row,
// version stripe, header row, frozen above data.

import ExcelJS from "exceljs";
import {
  ERP_FINANCIALS_SHEET,
  ERP_VENDOR_SPEND_SHEET,
  type ErpProgramFinancialRow,
  type ErpVendorRow,
} from "./parse";
import { SYNTHETIC_BANNER } from "./sample-data";

export const ERP_TEMPLATE_VERSION = "1.0";

const HEADER_FILL = "FF0A0A0A";
const HEADER_TEXT = "FFF5F5F0";
const REQUIRED_FILL = "FF2DD4C8";
const BANNER_FILL = "FFFFEB99";

interface ColumnSpec {
  key: string;
  label: string;
  required: boolean;
  type: "string" | "number" | "date";
  description: string;
}

const FINANCIAL_COLUMNS: ColumnSpec[] = [
  {
    key: "program_id",
    label: "program_id",
    required: true,
    type: "string",
    description:
      "Customer program identifier (Oracle Project ID, SAP WBS, internal code).",
  },
  {
    key: "period_start",
    label: "period_start",
    required: true,
    type: "date",
    description: "Fiscal period start. YYYY-MM-DD.",
  },
  {
    key: "period_end",
    label: "period_end",
    required: true,
    type: "date",
    description: "Fiscal period end. YYYY-MM-DD. Must be ≥ period_start.",
  },
  {
    key: "budget_usd",
    label: "budget_usd",
    required: false,
    type: "number",
    description: "Planned spend, USD. Non-negative.",
  },
  {
    key: "actual_usd",
    label: "actual_usd",
    required: false,
    type: "number",
    description: "Posted actual spend, USD. Non-negative.",
  },
  {
    key: "capex_usd",
    label: "capex_usd",
    required: false,
    type: "number",
    description: "Capital-expenditure share of actual. capex+opex ≤ actual.",
  },
  {
    key: "opex_usd",
    label: "opex_usd",
    required: false,
    type: "number",
    description: "Operating-expenditure share of actual. capex+opex ≤ actual.",
  },
  {
    key: "vendor_id",
    label: "vendor_id",
    required: false,
    type: "string",
    description: "FK to Vendor Spend sheet vendor_id if present.",
  },
  {
    key: "cost_center",
    label: "cost_center",
    required: false,
    type: "string",
    description: "Cost-center / profit-center code.",
  },
  {
    key: "gl_account",
    label: "gl_account",
    required: false,
    type: "string",
    description: "GL natural account code.",
  },
];

const VENDOR_COLUMNS: ColumnSpec[] = [
  {
    key: "vendor_id",
    label: "vendor_id",
    required: true,
    type: "string",
    description: "Stable vendor master ID from the source ERP.",
  },
  {
    key: "vendor_name",
    label: "vendor_name",
    required: true,
    type: "string",
    description: "Vendor display name.",
  },
  {
    key: "cost_center",
    label: "cost_center",
    required: false,
    type: "string",
    description: "Default cost center this vendor rolls to.",
  },
  {
    key: "gl_account",
    label: "gl_account",
    required: false,
    type: "string",
    description: "Default GL natural account.",
  },
  {
    key: "ttm_spend_usd",
    label: "ttm_spend_usd",
    required: false,
    type: "number",
    description: "Trailing-twelve-month vendor spend, USD. Non-negative.",
  },
];

function writeBanner(
  ws: ExcelJS.Worksheet,
  columnCount: number,
  banner: string,
) {
  ws.getRow(1).values = [banner];
  ws.mergeCells(1, 1, 1, columnCount);
  const c = ws.getRow(1).getCell(1);
  c.font = { bold: true, size: 11, color: { argb: "FF7B5300" } };
  c.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BANNER_FILL },
  };
  c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 26;
}

function writeTitle(ws: ExcelJS.Worksheet, columnCount: number, title: string) {
  ws.getRow(2).values = [title];
  ws.mergeCells(2, 1, 2, columnCount);
  const c = ws.getRow(2).getCell(1);
  c.font = { italic: true, size: 11, color: { argb: "FF706D66" } };
  c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(2).height = 22;
}

function writeHeader(ws: ExcelJS.Worksheet, columns: ColumnSpec[]) {
  ws.getRow(3).values = columns.map((c) => c.label);
  ws.getRow(3).eachCell((cell, colNumber) => {
    const col = columns[colNumber - 1];
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: col.required ? REQUIRED_FILL : HEADER_FILL },
    };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    cell.border = { bottom: { style: "medium", color: { argb: HEADER_FILL } } };
  });
  ws.getRow(3).height = 26;
}

function writeDataSheet(
  wb: ExcelJS.Workbook,
  name: string,
  description: string,
  columns: ColumnSpec[],
  rows: Array<Record<string, string | number | null>>,
  bannerOverride?: string,
): void {
  const ws = wb.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  const banner =
    bannerOverride ??
    `Sheet "${name}" · Required columns highlighted teal · Template v${ERP_TEMPLATE_VERSION}`;
  writeBanner(ws, columns.length, banner);
  writeTitle(ws, columns.length, description);
  writeHeader(ws, columns);

  // Column widths.
  columns.forEach((col, idx) => {
    const labelWidth = col.label.length + 4;
    const descWidth = Math.min(col.description.length / 3, 30);
    ws.getColumn(idx + 1).width = Math.max(labelWidth, descWidth, 14);
  });

  // Data rows.
  rows.forEach((rowData, i) => {
    const row = ws.getRow(4 + i);
    columns.forEach((col, idx) => {
      const cell = row.getCell(idx + 1);
      const value = rowData[col.key];
      if (value === null || value === undefined || value === "") {
        cell.value = null;
      } else if (col.type === "number") {
        cell.value = typeof value === "number" ? value : Number(value);
        cell.numFmt = "#,##0.00";
      } else if (col.type === "date") {
        cell.value = String(value);
      } else {
        cell.value = String(value);
      }
    });
  });
}

function writeHowToFillSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("How to fill");
  ws.getColumn(1).width = 110;
  const lines: Array<{ text: string; bold?: boolean; size?: number; color?: string }> = [
    { text: 'AbarVa Control Tower · ERP financial-data template', bold: true, size: 16 },
    { text: `Template v${ERP_TEMPLATE_VERSION}`, color: 'FF706D66', size: 11 },
    { text: '' },
    { text: 'Sheets to fill', bold: true, size: 13 },
    { text: '· Program Financials — one row per (program, fiscal period).' },
    { text: '· Vendor Spend — one row per vendor your ERP knows about.' },
    { text: '' },
    { text: 'Order of operations', bold: true, size: 13 },
    { text: '1. Fill Vendor Spend first. Make sure every vendor_id you intend to reference exists here.' },
    { text: '2. Fill Program Financials. vendor_id (if used) must match a row from sheet 1.' },
    { text: '3. Save the file. Upload through Admin templates or run the CLI: npm run tower:ingest-erp -- --file <path>.' },
    { text: '' },
    { text: 'Required columns (teal headers) must be present and populated.', bold: true, size: 12 },
    { text: 'Optional columns can be blank. Numeric columns must be non-negative.' },
    { text: '' },
    { text: 'Validation enforced at ingest', bold: true, size: 13 },
    { text: '· period_end ≥ period_start' },
    { text: '· capex_usd + opex_usd ≤ actual_usd (within $1 rounding)' },
    { text: '· vendor_id in Program Financials must FK to Vendor Spend' },
    { text: '· (program_id, period_start) is unique within Program Financials' },
    { text: '· (vendor_id) is unique within Vendor Spend' },
    { text: '' },
    { text: 'Where this came from', bold: true, size: 13 },
    { text: 'Two source-system paths supported. See README.md alongside this workbook for the' },
    { text: 'step-by-step Oracle GL/AP and SAP CO-PA extract procedures.' },
    { text: '' },
    { text: 'Data classification', bold: true, size: 13 },
    { text: 'Treat this file as CONFIDENTIAL. Program budgets and vendor spend are' },
    { text: 'gated by redaction Layer 2 in Tower roll-ups — exact figures appear only' },
    { text: 'for users with the financial-data role.' },
  ];
  lines.forEach((line, idx) => {
    const cell = ws.getRow(idx + 2).getCell(2);
    cell.value = line.text;
    cell.font = {
      bold: !!line.bold,
      italic: !!line.color,
      size: line.size ?? 11,
      color: { argb: line.color ?? "FF0A0A0A" },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    ws.getRow(idx + 2).height = line.size && line.size > 13 ? 28 : 18;
  });
}

function writeSchemaSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Schema");
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 10;
  ws.getColumn(4).width = 10;
  ws.getColumn(5).width = 70;

  ws.getRow(1).values = ["sheet", "column", "type", "required", "description"];
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  });
  ws.getRow(1).height = 24;

  let rowIdx = 2;
  for (const [sheet, columns] of [
    [ERP_FINANCIALS_SHEET, FINANCIAL_COLUMNS],
    [ERP_VENDOR_SPEND_SHEET, VENDOR_COLUMNS],
  ] as Array<[string, ColumnSpec[]]>) {
    for (const col of columns) {
      ws.getRow(rowIdx).values = [
        sheet,
        col.label,
        col.type,
        col.required ? "yes" : "no",
        col.description,
      ];
      rowIdx += 1;
    }
  }
}

export interface BuildErpWorkbookOptions {
  // If provided, fills the data sheets with these rows and shows the
  // SYNTHETIC banner instead of the standard template banner.
  filled?: {
    financials: ErpProgramFinancialRow[];
    vendors: ErpVendorRow[];
  };
}

export async function buildErpWorkbook(
  options: BuildErpWorkbookOptions = {},
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AbarVa · Control Tower";
  wb.created = new Date();
  wb.description = `AbarVa Tower · ERP financial ingest template v${ERP_TEMPLATE_VERSION}`;

  const banner = options.filled ? SYNTHETIC_BANNER : undefined;

  writeDataSheet(
    wb,
    ERP_FINANCIALS_SHEET,
    "One row per (program, fiscal period). Source: Oracle GL/AP or SAP CO-PA.",
    FINANCIAL_COLUMNS,
    (options.filled?.financials ?? []).map((r) => ({ ...r })),
    banner,
  );
  writeDataSheet(
    wb,
    ERP_VENDOR_SPEND_SHEET,
    "One row per vendor. Vendor master + TTM spend roll-up.",
    VENDOR_COLUMNS,
    (options.filled?.vendors ?? []).map((r) => ({ ...r })),
    banner,
  );
  writeHowToFillSheet(wb);
  writeSchemaSheet(wb);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
