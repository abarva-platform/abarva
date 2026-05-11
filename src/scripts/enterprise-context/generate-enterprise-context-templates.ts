import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';

import {
  ENTERPRISE_CONTEXT_COMMON_COLUMNS,
  ENTERPRISE_CONTEXT_TEMPLATE_TENANTS,
  ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
  ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS,
  type EnterpriseContextTemplateColumn,
  type EnterpriseContextTemplateTenant,
  type EnterpriseContextTemplateWorkbook,
} from '../../lib/enterprise-context/template-schema';

const FIXED_CREATED_AT = new Date('2026-05-01T00:00:00Z');
const OUTPUT_ROOT = 'docs/enterprise-context/templates';

const COLORS = {
  ink: 'FF0B1736',
  header: 'FF0B1736',
  teal: 'FF14B8A6',
  paper: 'FFF8FAFC',
  muted: 'FF64748B',
  line: 'FFE2E8F0',
  warning: 'FFFFF7ED',
};

interface GenerateOptions {
  tenants: readonly EnterpriseContextTemplateTenant[];
  outRoot: string;
}

interface GeneratedWorkbook {
  tenantKey: string;
  tenantSlug: string;
  workbookKey: string;
  title: string;
  path: string;
  columns: string[];
}

function parseArgs(): GenerateOptions {
  const tenantArg = process.argv.find((arg) => arg.startsWith('--tenant='))?.split('=')[1] ?? 'all';
  const outRoot = process.argv.find((arg) => arg.startsWith('--out='))?.split('=')[1] ?? OUTPUT_ROOT;

  const tenants = tenantArg === 'all'
    ? ENTERPRISE_CONTEXT_TEMPLATE_TENANTS
    : ENTERPRISE_CONTEXT_TEMPLATE_TENANTS.filter((tenant) => tenant.tenantKey === tenantArg || tenant.tenantSlug === tenantArg);

  if (!tenants.length) {
    throw new Error(`Unknown tenant "${tenantArg}". Use one of: all, ${ENTERPRISE_CONTEXT_TEMPLATE_TENANTS.map((tenant) => tenant.tenantKey).join(', ')}`);
  }

  return { tenants, outRoot };
}

function validationForColumn(column: EnterpriseContextTemplateColumn): ExcelJS.DataValidation | undefined {
  if (column.type === 'enum' && column.enumValues?.length) {
    return {
      type: 'list',
      allowBlank: !column.required,
      formulae: [`"${column.enumValues.join(',')}"`],
      showErrorMessage: true,
      errorTitle: `Invalid ${column.label}`,
      error: `Must be one of: ${column.enumValues.join(', ')}`,
    };
  }

  if (column.type === 'boolean') {
    return {
      type: 'list',
      allowBlank: !column.required,
      formulae: ['"true,false"'],
      showErrorMessage: true,
      errorTitle: `Invalid ${column.label}`,
      error: 'Must be true or false.',
    };
  }

  if (column.type === 'number') {
    return {
      type: 'decimal',
      allowBlank: !column.required,
      operator: 'greaterThanOrEqual',
      formulae: [0],
      showErrorMessage: true,
      errorTitle: `Invalid ${column.label}`,
      error: 'Must be a non-negative number.',
    };
  }

  if (column.type === 'date') {
    return {
      type: 'date',
      allowBlank: !column.required,
      operator: 'greaterThan',
      formulae: [new Date('1990-01-01')],
      showErrorMessage: true,
      errorTitle: `Invalid ${column.label}`,
      error: 'Use a valid date, preferably YYYY-MM-DD.',
    };
  }

  return undefined;
}

function setupSheetDefaults(sheet: ExcelJS.Worksheet) {
  sheet.properties.defaultRowHeight = 18;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function writeInstructions(
  workbook: ExcelJS.Workbook,
  tenant: EnterpriseContextTemplateTenant,
  template: EnterpriseContextTemplateWorkbook,
) {
  const sheet = workbook.addWorksheet('Instructions');
  setupSheetDefaults(sheet);
  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 104;

  const rows = [
    ['AbarVa Enterprise Context Template', `${template.title} for ${tenant.displayName}`],
    ['Template version', ENTERPRISE_CONTEXT_TEMPLATE_VERSION],
    ['Client / tenant', `${tenant.displayName} (${tenant.tenantKey})`],
    ['Vertical', tenant.vertical],
    ['Purpose', template.description],
    ['Source systems', template.sourceSystems.join(', ')],
    ['How to use', 'Populate the Template tab with one row per internal record. Keep source_record_id stable across refreshes. Do not include PHI or patient-identifiable data.'],
    ['Required fields', 'Required headers are highlighted teal. Rows missing required fields will generate quality issues during ingestion.'],
    ['Evidence usable', 'Set evidence_usable to true only when the row is accurate enough to cite in Intelligence, Source, Moves, or Tower.'],
    ['Refresh model', 'Use the same workbook weekly or monthly. Changed records supersede prior facts; they do not overwrite history.'],
    ['Example row format', template.columns.map((column) => `${column.key}=${column.example}`).join(' | ')],
  ];

  rows.forEach((row, index) => {
    const excelRow = sheet.getRow(index + 1);
    excelRow.values = row;
    excelRow.height = index === 0 ? 30 : 24;
    const label = excelRow.getCell(1);
    const value = excelRow.getCell(2);
    label.font = { bold: true, color: { argb: index === 0 ? 'FFFFFFFF' : COLORS.ink } };
    label.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: index === 0 ? COLORS.header : COLORS.paper },
    };
    value.font = { bold: index === 0, color: { argb: index === 0 ? 'FFFFFFFF' : COLORS.ink } };
    value.alignment = { wrapText: true, vertical: 'middle' };
    value.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: index === 0 ? COLORS.header : 'FFFFFFFF' },
    };
  });
}

function writeDictionary(
  workbook: ExcelJS.Workbook,
  template: EnterpriseContextTemplateWorkbook,
) {
  const sheet = workbook.addWorksheet('Data Dictionary');
  setupSheetDefaults(sheet);
  sheet.columns = [
    { header: 'column', key: 'column', width: 32 },
    { header: 'required', key: 'required', width: 12 },
    { header: 'type', key: 'type', width: 14 },
    { header: 'description', key: 'description', width: 80 },
    { header: 'example', key: 'example', width: 42 },
  ];

  const header = sheet.getRow(1);
  header.height = 24;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
    cell.alignment = { vertical: 'middle' };
  });

  template.columns.forEach((column) => {
    sheet.addRow({
      column: column.key,
      required: column.required ? 'yes' : 'no',
      type: column.type,
      description: column.description,
      example: column.example,
    });
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell, colNumber) => {
      cell.alignment = { wrapText: colNumber === 4, vertical: 'top' };
      cell.border = { bottom: { style: 'thin', color: { argb: COLORS.line } } };
    });
  });
}

function writeTemplateSheet(
  workbook: ExcelJS.Workbook,
  template: EnterpriseContextTemplateWorkbook,
) {
  const sheet = workbook.addWorksheet('Template');
  sheet.views = [{ state: 'frozen', ySplit: 3 }];

  const columnCount = template.columns.length;
  sheet.mergeCells(1, 1, 1, columnCount);
  sheet.getCell(1, 1).value = template.title;
  sheet.getCell(1, 1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  sheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
  sheet.getCell(1, 1).alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, columnCount);
  sheet.getCell(2, 1).value = 'Enter internal enterprise context only. No PHI, no patient names, no external market research.';
  sheet.getCell(2, 1).font = { italic: true, color: { argb: COLORS.muted } };
  sheet.getCell(2, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warning } };
  sheet.getRow(2).height = 24;

  const headerRow = sheet.getRow(3);
  headerRow.values = template.columns.map((column) => column.key);
  headerRow.height = 26;
  headerRow.eachCell((cell, colNumber) => {
    const column = template.columns[colNumber - 1];
    cell.font = { bold: true, color: { argb: column.required ? COLORS.ink : 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: column.required ? COLORS.teal : COLORS.header },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const exampleRow = sheet.getRow(4);
  exampleRow.values = template.columns.map((column) => column.example);
  exampleRow.height = 24;
  exampleRow.eachCell((cell) => {
    cell.font = { italic: true, color: { argb: COLORS.muted } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paper } };
  });
  sheet.getCell(4, 1).note = 'Example row. Delete before loading real client data.';

  template.columns.forEach((column, index) => {
    const excelColumn = sheet.getColumn(index + 1);
    excelColumn.width = Math.max(14, Math.min(42, Math.max(column.key.length + 4, column.description.length / 3)));
    if (column.type === 'date') excelColumn.numFmt = 'yyyy-mm-dd';
    if (column.type === 'number') excelColumn.numFmt = '0.00';
    const validation = validationForColumn(column);
    if (validation) {
      for (let row = 5; row <= 500; row += 1) {
        sheet.getCell(row, index + 1).dataValidation = validation;
      }
    }
  });

  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: columnCount },
  };
}

async function writeWorkbook(
  tenant: EnterpriseContextTemplateTenant,
  template: EnterpriseContextTemplateWorkbook,
  outDir: string,
): Promise<GeneratedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa Enterprise Context';
  workbook.created = FIXED_CREATED_AT;
  workbook.modified = FIXED_CREATED_AT;
  workbook.subject = `${tenant.displayName} ${template.title}`;
  workbook.title = `${tenant.displayName} ${template.title}`;
  workbook.description = `${template.description} Template version ${ENTERPRISE_CONTEXT_TEMPLATE_VERSION}.`;

  writeInstructions(workbook, tenant, template);
  writeDictionary(workbook, template);
  writeTemplateSheet(workbook, template);

  mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${template.filenameBase}.xlsx`);
  await workbook.xlsx.writeFile(filePath);

  return {
    tenantKey: tenant.tenantKey,
    tenantSlug: tenant.tenantSlug,
    workbookKey: template.key,
    title: template.title,
    path: filePath,
    columns: template.columns.map((column) => column.key),
  };
}

export async function generateEnterpriseContextTemplates(options = parseArgs()) {
  const generated: GeneratedWorkbook[] = [];

  for (const tenant of options.tenants) {
    const tenantOutDir = path.join(options.outRoot, tenant.tenantSlug, 'day-one');
    for (const template of ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS) {
      generated.push(await writeWorkbook(tenant, template, tenantOutDir));
    }

    const manifestPath = path.join(options.outRoot, tenant.tenantSlug, 'manifest.json');
    mkdirSync(path.dirname(manifestPath), { recursive: true });
    writeFileSync(
      manifestPath,
      `${JSON.stringify({
        tenantKey: tenant.tenantKey,
        tenantSlug: tenant.tenantSlug,
        displayName: tenant.displayName,
        version: ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
        generatedAt: FIXED_CREATED_AT.toISOString(),
        workbookCount: ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.length,
        commonColumns: ENTERPRISE_CONTEXT_COMMON_COLUMNS.map((column) => column.key),
        workbooks: generated.filter((workbook) => workbook.tenantSlug === tenant.tenantSlug).map((workbook) => ({
          key: workbook.workbookKey,
          title: workbook.title,
          path: path.relative(path.join(options.outRoot, tenant.tenantSlug), workbook.path),
          columns: workbook.columns,
        })),
      }, null, 2)}\n`,
    );
  }

  return generated;
}

if (require.main === module) {
  generateEnterpriseContextTemplates()
    .then((generated) => {
      console.log(JSON.stringify({
        workbookCount: generated.length,
        tenants: [...new Set(generated.map((workbook) => workbook.tenantSlug))],
      }, null, 2));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
