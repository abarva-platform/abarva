// =============================================================================
// Discovery Intake — assessment template → XLSX render (S8b)
// -----------------------------------------------------------------------------
// Renders an AssessmentTemplate spec (S8a) into a real .xlsx workbook the
// client/maestro downloads, fills, and uploads back (S3 routes the filled
// result into the shape). Isolated from the pure spec so the exceljs dependency
// stays at the edge. The download route (auth + flag + serve) is S8c.
// =============================================================================

import ExcelJS from 'exceljs';
import type { AssessmentTemplate } from './assessment-template';

/** Excel sheet names: max 31 chars, no []:*?/\\ — sanitize + truncate. */
function safeSheetName(name: string, index: number): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31);
  return cleaned.length > 0 ? cleaned : `Sheet ${index + 1}`;
}

/** Render the template spec to an .xlsx buffer (one worksheet per sheet). */
export async function renderAssessmentTemplateXlsx(template: AssessmentTemplate): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa · Nexus';
  wb.title = template.title;

  template.sheets.forEach((sheet, i) => {
    const ws = wb.addWorksheet(safeSheetName(sheet.name, i));
    ws.columns = sheet.columns.map((c) => ({
      header: c.hint ? `${c.label} (${c.hint})` : c.label,
      key: c.key,
      width: 24,
    }));
    for (const row of sheet.rows) {
      ws.addRow(row);
    }
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };
  });

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}
