import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { ALL_TEMPLATES, TEMPLATE_VERSION, type DimensionTemplate, type ColumnSpec } from './schema';

const HEADER_FILL = 'FF0A0A0A';
const HEADER_TEXT = 'FFF5F5F0';
const REQUIRED_FILL = 'FF2DD4C8';
const README_FILL = 'FFF8F7F4';

function dataValidation(col: ColumnSpec): ExcelJS.DataValidation | null {
  if (col.type === 'enum' && col.enumValues?.length) {
    return {
      type: 'list',
      allowBlank: !col.required,
      formulae: [`"${col.enumValues.join(',')}"`],
      showErrorMessage: true,
      errorTitle: `Invalid ${col.label}`,
      error: `Must be one of: ${col.enumValues.join(', ')}`,
    };
  }
  if (col.type === 'number') {
    return {
      type: 'decimal',
      allowBlank: !col.required,
      operator: 'greaterThanOrEqual',
      formulae: [0],
      showErrorMessage: true,
      errorTitle: `Invalid ${col.label}`,
      error: 'Must be a non-negative number.',
    };
  }
  if (col.type === 'date') {
    return {
      type: 'date',
      allowBlank: !col.required,
      operator: 'greaterThan',
      formulae: [new Date('1990-01-01')],
      showErrorMessage: true,
      errorTitle: `Invalid ${col.label}`,
      error: 'Must be a date (YYYY-MM-DD).',
    };
  }
  return null;
}

function writeSheet(wb: ExcelJS.Workbook, t: DimensionTemplate) {
  const ws = wb.addWorksheet(t.displayName, {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  ws.getRow(1).values = [`${t.displayName} · ${t.description}`];
  ws.mergeCells(1, 1, 1, t.columns.length);
  const titleCell = ws.getRow(1).getCell(1);
  titleCell.font = { bold: true, size: 13, color: { argb: HEADER_TEXT } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 28;

  ws.getRow(2).values = [`Required columns highlighted teal · Template v${TEMPLATE_VERSION}`];
  ws.mergeCells(2, 1, 2, t.columns.length);
  const subCell = ws.getRow(2).getCell(1);
  subCell.font = { italic: true, size: 11, color: { argb: 'FF706D66' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 22;

  ws.getRow(3).values = t.columns.map((c) => c.label);
  ws.getRow(3).eachCell((cell, colNumber) => {
    const col = t.columns[colNumber - 1];
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? REQUIRED_FILL : HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = { bottom: { style: 'medium', color: { argb: HEADER_FILL } } };
  });
  ws.getRow(3).height = 26;

  ws.getRow(4).values = t.columns.map((c) => t.exampleRow[c.key] ?? '');
  ws.getRow(4).eachCell((cell) => {
    cell.font = { italic: true, color: { argb: 'FF9CA3AF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });
  ws.getCell(4, 1).note = 'Example row — delete before uploading.';

  t.columns.forEach((col, idx) => {
    const column = ws.getColumn(idx + 1);
    const labelWidth = col.label.length + 4;
    const descriptionWidth = Math.min(col.description.length / 3, 30);
    column.width = Math.max(labelWidth, descriptionWidth, 14);

    const validation = dataValidation(col);
    if (validation) {
      for (let row = 5; row <= 1000; row += 1) {
        ws.getCell(row, idx + 1).dataValidation = validation;
      }
    }
  });
}

function writeReadme(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet('README', { views: [{ state: 'normal' }] });

  ws.getColumn(1).width = 110;

  const lines: Array<{ text: string; bold?: boolean; size?: number; color?: string }> = [
    { text: 'AbarVa Control Tower · Data Bundle Template', bold: true, size: 18 },
    { text: `Version ${TEMPLATE_VERSION}`, size: 11, color: 'FF706D66' },
    { text: '' },
    { text: 'How to use this workbook', bold: true, size: 13 },
    { text: 'Each sheet maps to one of the five Control Tower dimensions.' },
    { text: 'Required columns are highlighted teal in the header row.' },
    { text: 'Cell validation enforces enum values, dates, and non-negative numbers.' },
    { text: 'Delete the example row (row 4) before uploading your real data.' },
    { text: '' },
    { text: 'Sheets', bold: true, size: 13 },
    ...ALL_TEMPLATES.map((t) => ({ text: `· ${t.displayName} — ${t.description}` })),
    { text: '' },
    { text: 'In-app catalog', bold: true, size: 13 },
    { text: 'Per-dimension export guidance for ServiceNow, Workday, M365, AWS,' },
    { text: 'Azure, GCP, Okta/Entra, and Snowflake lives at /tower/onboard.' },
    { text: '' },
    { text: 'Upload', bold: true, size: 13 },
    { text: 'Drop this file into the Tower upload zone. The classifier will' },
    { text: 'route each sheet to the matching dimension automatically.' },
  ];

  lines.forEach((line, idx) => {
    const row = ws.getRow(idx + 2);
    const cell = row.getCell(2);
    cell.value = line.text;
    if (line.bold || line.size || line.color) {
      cell.font = {
        bold: !!line.bold,
        size: line.size ?? 11,
        color: { argb: line.color ?? 'FF0A0A0A' },
      };
    }
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    row.height = line.size && line.size > 13 ? 32 : 20;
  });

  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: README_FILL } };
  ws.spliceColumns(1, 0, []);
}

export async function generateXlsxBundle(outDir: string): Promise<string> {
  mkdirSync(outDir, { recursive: true });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa · Control Tower';
  wb.created = new Date();
  wb.description = `AbarVa Control Tower data bundle template v${TEMPLATE_VERSION}`;

  writeReadme(wb);
  for (const t of ALL_TEMPLATES) writeSheet(wb, t);

  const path = join(outDir, 'tower-bundle.xlsx');
  await wb.xlsx.writeFile(path);
  return path;
}
