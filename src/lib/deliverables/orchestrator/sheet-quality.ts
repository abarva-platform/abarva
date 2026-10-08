import type ExcelJS from "exceljs";

export interface SheetQualityVerdict {
  ok: boolean;
  findings: string[];
}

/** Check the workbook a reader will open, including its cover and data sheets. */
export function judgeSheetQuality(
  workbook: ExcelJS.Workbook,
  expectedFigures = 0,
): SheetQualityVerdict {
  const findings: string[] = [];
  const cover = workbook.worksheets[0];
  if (
    cover?.name !== "Cover" ||
    !String(cover.getCell("A2").value ?? "").trim()
  ) {
    findings.push("missing_or_empty_cover");
  }
  const dataSheets = workbook.worksheets.slice(1);
  if (!dataSheets.length) findings.push("no_data_sheets");
  const figures = dataSheets.reduce(
    (count, sheet) => count + sheet.getImages().length,
    0,
  );
  if (figures < expectedFigures)
    findings.push(`empty_figure:expected_${expectedFigures}:actual_${figures}`);
  for (const sheet of dataSheets) {
    const first = sheet.getRow(1);
    if (!first.hasValues || first.cellCount === 0) {
      findings.push(`empty_header:${sheet.name}`);
    }
    if (
      !sheet
        .getRows(2, Math.max(0, sheet.rowCount - 1))
        ?.some((row) => row.hasValues)
    ) {
      findings.push(`empty_sheet:${sheet.name}`);
    }
    if (sheet.columns.some((column) => (column.width ?? 0) < 8)) {
      findings.push(`unsized_columns:${sheet.name}`);
    }
  }
  return { ok: findings.length === 0, findings };
}
