import "server-only";

import ExcelJS from "exceljs";
import type { EditionInputs } from "./reference-deck-inputs";
import type { ReferenceDeckSpec } from "./reference-deck-model";
import { computeRom } from "@/lib/pricing/moves-workflow/rom-service";
import { createCommittedRomReferenceLoaders } from "@/lib/pricing/moves-workflow/rom-reference";
import { buildRomWorkbook } from "@/lib/pricing/moves-workflow/rom-workbook";
import { previewMatchesApproval } from "@/lib/pricing/moves-workflow/approved-rom-snapshot";

const SHEET_FIGURES = "Deck Figures";
const SHEET_VALUE = "Value Case";
const SHEET_REGISTER = "Move Assumptions";
const safeText = (value: unknown) => typeof value === "string" ? value : "";

function addHeader(sheet: ExcelJS.Worksheet, cells: string[]): void {
  const row = sheet.addRow(cells);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17202B" } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 25;
}

/** The worksheet cell in each ReferenceFigure is physically written here. */
export async function buildReferenceWorkbook(inputs: EditionInputs, spec: ReferenceDeckSpec): Promise<Buffer> {
  let workbook: ExcelJS.Workbook;
  if (spec.edition === "investment" && inputs.rom.status === "ready") {
    const result = computeRom(inputs.rom.value.workbookStructure, createCommittedRomReferenceLoaders());
    if (!result.ok || !previewMatchesApproval(result, inputs.rom.value.result)) {
      throw new Error("reference_rom_workbook_mismatch");
    }
    workbook = buildRomWorkbook(result).workbook;
  } else {
    workbook = new ExcelJS.Workbook();
    workbook.creator = "AbarVa Moves";
    workbook.calcProperties.fullCalcOnLoad = true;
  }
  const figures = workbook.addWorksheet(SHEET_FIGURES);
  figures.columns = [
    { key: "sourceId", width: 37 }, { key: "display", width: 25 },
    { key: "source", width: 70 }, { key: "status", width: 27 },
  ];
  addHeader(figures, ["Governed source ID", "Slide figure", "Source label", "Read status"]);
  for (const figure of spec.figureLedger) {
    const row = figures.addRow([figure.sourceId, figure.display, spec.sources[figure.sourceId] ?? "", "Read from governed source"]);
    if (`${SHEET_FIGURES}!B${row.number}` !== figure.workbookCell || row.getCell(2).value !== figure.display)
      throw new Error("reference_workbook_cell_mismatch");
  }
  figures.views = [{ state: "frozen", ySplit: 1 }];
  figures.autoFilter = { from: "A1", to: `D${Math.max(1, figures.rowCount)}` };

  const value = workbook.addWorksheet(SHEET_VALUE);
  value.columns = [{ width: 38 }, { width: 27 }, { width: 48 }];
  addHeader(value, ["Value-engine key", "Slide figure", "Deck Figures cell"]);
  for (const figure of spec.figureLedger.filter((item) => item.sourceId.startsWith("engine:"))) {
    value.addRow([figure.sourceId, figure.display, figure.workbookCell]);
  }
  if (value.rowCount === 1) value.addRow(["Gap — value-case figures unavailable", "", ""]);

  const register = workbook.addWorksheet(SHEET_REGISTER);
  register.columns = [{ width: 16 }, { width: 50 }, { width: 23 }, { width: 28 }, { width: 45 }, { width: 22 }];
  addHeader(register, ["Register ID", "Assumption", "Working figure", "Owner role", "Source", "Status"]);
  if (inputs.register.status === "ready") {
    for (const row of inputs.register.value.assumptions) {
      register.addRow([safeText(row.registerId), safeText(row.statement),
        inputs.register.value.figuresRedacted ? "Withheld for this viewer" : safeText(row.answerFigure) || safeText(row.workingFigure),
        safeText(row.ownerRole), safeText(row.source), safeText(row.status)]);
    }
  } else {
    register.addRow(["Gap", inputs.register.detail, "", "", "", ""]);
  }
  if (register.rowCount === 1) register.addRow(["Gap", "No assumption rows were returned", "", "", "", ""]);
  const bytes = await workbook.xlsx.writeBuffer();
  return Buffer.from(bytes);
}
