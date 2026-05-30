/**
 * Build the Azure Cost Management template workbook.
 *
 * Sheets:
 *   - README  · context, columns, validation, sample-data banner
 *   - Data    · one row per (subscription, resource, service, month) — required headers + a blank sample row
 *   - Sample  · ~2000 synthetic Northwind rows pre-populated for demos
 */

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import ExcelJS from 'exceljs';

import { AZURE_COST_HEADERS, AZURE_COST_TEMPLATE_VERSION } from './parse';
import { generateSampleRows, SAMPLE_TENANT } from './sample';

const HEADER_FILL = 'FF0A0A0A';
const HEADER_TEXT = 'FFF5F5F0';
const REQUIRED_FILL = 'FF2DD4C8';
const BANNER_FILL = 'FFFEE07A';

interface ColumnHelp {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'enum';
  enumValues?: string[];
  description: string;
  example: string;
}

const COLUMN_HELP: ColumnHelp[] = [
  { key: 'subscription_id', label: 'subscription_id', required: true, type: 'string', description: 'Azure subscription GUID.', example: '00000000-0000-0000-0000-0000000a0001' },
  { key: 'resource_group', label: 'resource_group', required: true, type: 'string', description: 'Resource group name.', example: 'rg-ecom-prod-eus' },
  { key: 'resource_name', label: 'resource_name', required: false, type: 'string', description: 'Resource short name. Blank rolls up to resource-group level.', example: 'ca-storefront-eus' },
  { key: 'service', label: 'service', required: false, type: 'string', description: 'Azure service / meter sub-category (Container Apps, Postgres, AI Search, ...).', example: 'Container Apps' },
  { key: 'tag_program', label: 'tag_program', required: false, type: 'string', description: 'Program tag for allocation. Empty rolls into __untagged__.', example: 'pgm-ecom' },
  { key: 'tag_environment', label: 'tag_environment', required: false, type: 'enum', enumValues: ['prod', 'staging', 'dev', 'unspecified'], description: 'Environment tag. Defaults to unspecified.', example: 'prod' },
  { key: 'period_start', label: 'period_start', required: true, type: 'date', description: 'YYYY-MM-DD. First day of billing month.', example: '2026-04-01' },
  { key: 'period_end', label: 'period_end', required: true, type: 'date', description: 'YYYY-MM-DD. Last day of billing month.', example: '2026-04-30' },
  { key: 'monthly_cost_usd', label: 'monthly_cost_usd', required: true, type: 'number', description: 'USD spend for this row in the period. Must be >= 0.', example: '4820.55' },
  { key: 'currency', label: 'currency', required: true, type: 'string', description: 'Must be USD. Non-USD subscriptions should be pre-converted.', example: 'USD' },
  { key: 'meter_category', label: 'meter_category', required: false, type: 'string', description: 'Azure top-level meter category (Compute, Networking, AI + Machine Learning, ...).', example: 'Compute' },
  { key: 'location', label: 'location', required: false, type: 'string', description: 'Azure region slug.', example: 'eastus' },
];

const VERTICAL_BANNER = `SYNTHETIC SAMPLE DATA · ${SAMPLE_TENANT} · Generated ${new Date().toISOString().slice(0, 10)} · NOT FOR PRODUCTION DECISIONS`;

function writeReadme(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('README');
  ws.getColumn(1).width = 110;

  const lines: Array<{ text: string; bold?: boolean; size?: number; color?: string }> = [
    { text: 'AbarVa Control Tower · Azure Cost Management template', bold: true, size: 18 },
    { text: `Template version ${AZURE_COST_TEMPLATE_VERSION}`, size: 11, color: 'FF706D66' },
    { text: '' },
    { text: 'What this is', bold: true, size: 13 },
    { text: 'A flattened view of Azure Cost Management data: one row per (subscription, resource_group, resource, service, meter_category, month).' },
    { text: 'Tag-based program allocation is the headline feature — tag_program is first-class.' },
    { text: '' },
    { text: 'How to populate it', bold: true, size: 13 },
    { text: '1. Azure Portal → Cost Management + Billing → Exports → schedule a monthly CSV to Blob.' },
    { text: '2. Open the exported CSV, copy the columns into the Data sheet (or use the REST API path documented in /docs/templates/tower/azure-cost/README.md).' },
    { text: '3. Tag your resources with `program` and `environment` tags in Azure before exporting — rows without tag_program roll into __untagged__.' },
    { text: '4. Drop this workbook into the Tower upload zone, or run `npm run tower:ingest:azure-cost -- --file=path/to/file.xlsx`.' },
    { text: '' },
    { text: 'Required columns', bold: true, size: 13 },
    { text: 'subscription_id · resource_group · period_start · period_end · monthly_cost_usd · currency (= USD)' },
    { text: '' },
    { text: 'Validation', bold: true, size: 13 },
    { text: '· currency must equal USD (non-USD pre-convert before export)' },
    { text: '· monthly_cost_usd must be >= 0' },
    { text: '· dates must be YYYY-MM-DD and period_end >= period_start' },
    { text: '· tag_program is recommended; missing tags roll into __untagged__ with a warning if > 5% of rows' },
    { text: '' },
    { text: 'Idempotency', bold: true, size: 13 },
    { text: 'The CLI ingest is idempotent on (subscription_id, resource_group, resource_name, service, meter_category, period_start) — re-uploading the same month overwrites prior values.' },
  ];

  lines.forEach((line, idx) => {
    const row = ws.getRow(idx + 2);
    const cell = row.getCell(2);
    cell.value = line.text;
    cell.font = {
      bold: !!line.bold,
      size: line.size ?? 11,
      color: { argb: line.color ?? 'FF0A0A0A' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    row.height = line.size && line.size > 13 ? 32 : 20;
  });

  ws.spliceColumns(1, 0, []);
}

function writeDataSheet(ws: ExcelJS.Worksheet, includeSample: boolean): void {
  ws.views = [{ state: 'frozen', ySplit: 3 }];

  // Row 1: title banner
  ws.getRow(1).values = ['Azure Cost Management · monthly rollup'];
  ws.mergeCells(1, 1, 1, COLUMN_HELP.length);
  const title = ws.getRow(1).getCell(1);
  title.font = { bold: true, size: 13, color: { argb: HEADER_TEXT } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 28;

  // Row 2: synthetic / sample banner
  ws.getRow(2).values = [
    includeSample
      ? VERTICAL_BANNER
      : `Template v${AZURE_COST_TEMPLATE_VERSION} · Required columns highlighted teal · Delete sample row before uploading`,
  ];
  ws.mergeCells(2, 1, 2, COLUMN_HELP.length);
  const sub = ws.getRow(2).getCell(1);
  sub.font = { italic: true, bold: true, size: 11, color: { argb: 'FF0A0A0A' } };
  sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BANNER_FILL } };
  sub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 22;

  // Row 3: headers
  ws.getRow(3).values = COLUMN_HELP.map((c) => c.label);
  ws.getRow(3).eachCell((cell, colNumber) => {
    const col = COLUMN_HELP[colNumber - 1];
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? REQUIRED_FILL : HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.note = `${col.description}${col.example ? `\nExample: ${col.example}` : ''}`;
  });
  ws.getRow(3).height = 26;

  // Row 4: in the blank template, a greyed-out example row. In the sample
  // workbook we skip the example row entirely — sample data starts at row 4 —
  // so re-ingesting sample.xlsx doesn't double-count the example.
  if (!includeSample) {
    ws.getRow(4).values = COLUMN_HELP.map((c) => c.example);
    ws.getRow(4).eachCell((cell) => {
      cell.font = { italic: true, color: { argb: 'FF9CA3AF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });
    ws.getCell(4, 1).note = 'Example row — delete before uploading your real export.';
  } else {
    const rows = generateSampleRows();
    rows.forEach((r, idx) => {
      const row = ws.getRow(4 + idx);
      row.values = [
        r.subscriptionId,
        r.resourceGroup,
        r.resourceName,
        r.service,
        r.tagProgram,
        r.tagEnvironment,
        r.periodStart,
        r.periodEnd,
        r.monthlyCostUsd,
        r.currency,
        r.meterCategory,
        r.location,
      ];
    });
  }

  // Column widths + cell validation
  COLUMN_HELP.forEach((col, idx) => {
    const column = ws.getColumn(idx + 1);
    column.width = Math.max(col.label.length + 4, 18);

    if (col.type === 'enum' && col.enumValues?.length) {
      for (let row = 5; row <= 5000; row += 1) {
        ws.getCell(row, idx + 1).dataValidation = {
          type: 'list',
          allowBlank: !col.required,
          formulae: [`"${col.enumValues.join(',')}"`],
          showErrorMessage: true,
          errorTitle: `Invalid ${col.label}`,
          error: `Must be one of: ${col.enumValues.join(', ')}`,
        };
      }
    }
    if (col.type === 'number') {
      for (let row = 5; row <= 5000; row += 1) {
        ws.getCell(row, idx + 1).dataValidation = {
          type: 'decimal',
          allowBlank: !col.required,
          operator: 'greaterThanOrEqual',
          formulae: [0],
          showErrorMessage: true,
          errorTitle: `Invalid ${col.label}`,
          error: 'Must be a non-negative number.',
        };
      }
    }
  });
}

async function writeWorkbook(path: string, includeSample: boolean): Promise<void> {
  mkdirSync(dirname(path), { recursive: true });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa · Control Tower · Azure Cost ingest';
  wb.created = new Date();
  wb.description = `Azure Cost Management ingest template v${AZURE_COST_TEMPLATE_VERSION}`;

  writeReadme(wb);
  const dataSheet = wb.addWorksheet('Data');
  writeDataSheet(dataSheet, includeSample);

  await wb.xlsx.writeFile(path);
}

/** Write the blank template (just headers, example row, validation). */
export async function writeBlankTemplate(path: string): Promise<void> {
  return writeWorkbook(path, false);
}

/** Write the sample-filled workbook with synthetic Northwind data. */
export async function writeSampleTemplate(path: string): Promise<void> {
  return writeWorkbook(path, true);
}

/** Re-export so the script doesn't have to depend on parse.ts directly. */
export { AZURE_COST_HEADERS };
